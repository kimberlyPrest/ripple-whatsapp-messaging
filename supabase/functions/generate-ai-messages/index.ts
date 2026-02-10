import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { campaign_id, prompt_base } = await req.json();
    if (!campaign_id || !prompt_base) throw new Error("Missing parameters");

    // Initialize admin client to get API key and update contacts
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get user OpenAI key
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("openai_api_key")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.openai_api_key) {
      throw new Error("OpenAI API Key não encontrada nas configurações.");
    }

    // 2. Fetch contacts for this campaign
    const { data: campaignMessages, error: cmError } = await supabaseAdmin
      .from("campaign_messages")
      .select("contact_id, contacts(*)")
      .eq("campaign_id", campaign_id);

    if (cmError) throw cmError;

    const contacts = (campaignMessages as any[])
      .map((cm) => cm.contacts)
      .filter(Boolean);
    if (contacts.length === 0)
      throw new Error("Nenhum contato encontrado nesta campanha.");

    console.log(`Generating AI messages for ${contacts.length} contacts...`);

    // 3. Process each contact with OpenAI
    // We'll do them in parallel with a limit or sequentially to avoid time timeouts.
    // Given Edge Functions have limits, we'll do them in small batches or one by one.
    // For large campaigns, this should be a background task, but for now we do it here.

    const results = [];
    const BATCH_SIZE = 5; // Low batch size for stability in dynamic generation

    for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
      const batch = contacts.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (contact: any) => {
        try {
          // Construct prompt with contact metadata
          let contactInfo = `Nome: ${contact.name}\nTelefone: ${contact.phone}`;
          if (contact.metadata && typeof contact.metadata === "object") {
            Object.entries(contact.metadata).forEach(([key, value]) => {
              contactInfo += `\n${key}: ${value}`;
            });
          }

          const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${profile.openai_api_key}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content:
                      "Você é um assistente de vendas especializado em mensagens de WhatsApp amigáveis e curtas. Use os dados do cliente para personalizar. Não use hashtags nem links a menos que solicitado. Gere apenas o texto da mensagem.",
                  },
                  {
                    role: "user",
                    content: `Instrução base: ${prompt_base}\n\nDados do Cliente:\n${contactInfo}`,
                  },
                ],
                temperature: 0.7,
                max_tokens: 300,
              }),
            },
          );

          const aiData = await response.json();
          if (!response.ok)
            throw new Error(aiData.error?.message || "OpenAI Error");

          const generatedMessage = aiData.choices[0].message.content.trim();

          // Update contact in DB
          await supabaseAdmin
            .from("contacts")
            .update({ message: generatedMessage })
            .eq("id", contact.id);

          return { success: true, contact_id: contact.id };
        } catch (err: any) {
          console.error(`Error for contact ${contact.id}:`, err);
          return { success: false, contact_id: contact.id, error: err.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: results.filter((r) => r.success).length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("AI Generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
