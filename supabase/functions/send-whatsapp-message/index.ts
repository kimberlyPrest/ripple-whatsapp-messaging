import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      name,
      phone,
      message,
      webhookUrl: customWebhookUrl,
      evolutionInstanceId,
      connectionType = "webhook",
    } = await req.json();

    if (!name || !phone || !message) {
      throw new Error("Missing required fields: name, phone, message");
    }

    if (connectionType === "evolution" && evolutionInstanceId) {
      if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        throw new Error("Evolution API configuration missing in Edge Function secrets");
      }

      // Sanitize phone for Evolution (remove +, etc if needed, but usually it takes full number)
      const sanitizedPhone = phone.replace(/\D/g, "");

      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${evolutionInstanceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: sanitizedPhone,
          text: message,
          linkPreview: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Evolution API error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      // DEFAULT: WEBHOOK
      const webhookUrl =
        customWebhookUrl ||
        "https://skinnysalmon-n8n.cloudfy.cloud/webhook-test/disparos";

      const payload = {
        Nome: name,
        Telefone: phone,
        Texto: message,
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Webhook error: ${response.status} ${text}`);
      }

      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : { success: true };
      } catch {
        data = { message: text };
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
