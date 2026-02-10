import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Helper for variable replacement
function replaceVariables(template: string, contact: any): string {
  let result = template;

  // Normalize contact data
  const name = contact.name || "";
  const phone = contact.phone || "";

  // Replace standard fields (case insensitive)
  result = result.replace(/{{\s*name\s*}}/gi, name);
  result = result.replace(/{{\s*nome\s*}}/gi, name);
  result = result.replace(/{{\s*phone\s*}}/gi, phone);
  result = result.replace(/{{\s*telefone\s*}}/gi, phone);
  result = result.replace(/{{\s*celular\s*}}/gi, phone);

  // Replace metadata fields
  if (contact.metadata && typeof contact.metadata === "object") {
    Object.entries(contact.metadata).forEach(([key, value]) => {
      // Create a regex for the key, case insensitive
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      result = result.replace(regex, String(value || ""));
    });
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validate and extract Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // 2. Create Supabase client with user context
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // 3. Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { campaign_id, prompt_base } = await req.json();
    if (!campaign_id || !prompt_base)
      throw new Error("Missing parameters: campaign_id or prompt_base");

    // Initialize admin client to get API key and update contacts
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 4. Get user Gemini key
    // Note: We access the profile directly. Since migration adds the column, it is available.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("gemini_api_key")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.gemini_api_key) {
      throw new Error(
        "Gemini API Key não encontrada. Por favor, configure sua chave em Configurações.",
      );
    }

    // 5. Fetch ALL contacts for this campaign (handling pagination)
    let allContacts: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: campaignMessages, error: cmError } = await supabaseAdmin
        .from("campaign_messages")
        .select("contact_id, contacts(*)")
        .eq("campaign_id", campaign_id)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (cmError) throw cmError;

      if (campaignMessages && campaignMessages.length > 0) {
        const pageContacts = campaignMessages
          .map((cm) => cm.contacts)
          .filter(Boolean);
        allContacts = [...allContacts, ...pageContacts];

        if (campaignMessages.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    if (allContacts.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          count: 0,
          error: "Nenhum contato encontrado nesta campanha.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `Generating AI messages for ${allContacts.length} contacts using Gemini...`,
    );

    // 6. Process each contact with Gemini
    const results = [];
    const BATCH_SIZE = 5; // Parallel requests limit (Conservative for Gemini free/pay-as-you-go)
    const MODEL_NAME = "gemini-2.5-flash"; // As requested

    for (let i = 0; i < allContacts.length; i += BATCH_SIZE) {
      const batch = allContacts.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (contact: any) => {
        try {
          // Perform Variable Replacement
          const personalizedPrompt = replaceVariables(prompt_base, contact);

          // Construct system prompt context
          let systemContext =
            "Você é um assistente de vendas especializado em mensagens de WhatsApp curtas, diretas e amigáveis.";
          systemContext +=
            " Responda APENAS com o texto da mensagem, sem aspas, sem explicações.";
          systemContext += " Não use hashtags. Use emojis com moderação.";

          // Combine system context with prompt for Gemini (simple prompting)
          const finalPrompt = `${systemContext}\n\nInstrução: ${personalizedPrompt}`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${profile.gemini_api_key}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: finalPrompt,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 300,
                },
              }),
            },
          );

          const aiData = await response.json();
          if (!response.ok) {
            const errorMsg =
              aiData.error?.message ||
              `Erro na API do Gemini: ${response.statusText}`;
            throw new Error(errorMsg);
          }

          // Parse Gemini Response
          // candidates[0].content.parts[0].text
          const generatedMessage =
            aiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

          if (!generatedMessage) {
            throw new Error("Gemini retornou uma resposta vazia.");
          }

          // Update contact in DB
          const { error: updateError } = await supabaseAdmin
            .from("contacts")
            .update({ message: generatedMessage })
            .eq("id", contact.id);

          if (updateError) throw updateError;

          return { success: true, contact_id: contact.id };
        } catch (err: any) {
          console.error(`Error for contact ${contact.id}:`, err);

          // Log error to campaign_messages to help debug
          await supabaseAdmin
            .from("campaign_messages")
            .update({ error_message: `Gemini Error: ${err.message}` })
            .eq("campaign_id", campaign_id)
            .eq("contact_id", contact.id);

          return { success: false, contact_id: contact.id, error: err.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        success: true,
        count: successCount,
        failures: failureCount,
        total: allContacts.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("AI Generation error:", error);

    const status =
      error.message === "Unauthorized" ||
      error.message === "Missing Authorization header"
        ? 401
        : 400;

    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
