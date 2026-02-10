import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
};

const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")?.replace(/\/$/, "");
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;
    const instanceName = `user_${user.id.replace(/-/g, "_")}`;

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      throw new Error(
        "Evolution API configuration missing in Edge Function secrets (EVOLUTION_API_URL / EVOLUTION_API_KEY)",
      );
    }

    let result;
    const targetUrl =
      action === "create"
        ? `${EVOLUTION_API_URL}/instance/create`
        : action === "get-qr"
          ? `${EVOLUTION_API_URL}/instance/connect/${instanceName}`
          : action === "status"
            ? `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`
            : action === "logout"
              ? `${EVOLUTION_API_URL}/instance/logout/${instanceName}`
              : "";

    console.log(`Action: ${action} | Target URL: ${targetUrl}`);

    if (action === "create") {
      const createBody = {
        instanceName: instanceName,
        token: user.id,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      };

      console.log("Creating instance with body:", JSON.stringify(createBody));

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify(createBody),
      });

      result = await response.json();
      console.log(
        `Creation response (${response.status}):`,
        JSON.stringify(result),
      );

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to create instance",
        );
      }

      const serviceRoleClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      await serviceRoleClient
        .from("profiles")
        .update({ evolution_instance_id: instanceName })
        .eq("id", user.id);
    } else if (action === "get-qr") {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
      });
      result = await response.json();
    } else if (action === "status") {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
      });
      result = await response.json();

      const status =
        result.instance?.state === "open" ? "connected" : "disconnected";
      const serviceRoleClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      await serviceRoleClient
        .from("profiles")
        .update({ whatsapp_status: status })
        .eq("id", user.id);
    } else if (action === "logout") {
      let response = await fetch(targetUrl, {
        method: "DELETE",
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
      });

      if (!response.ok) {
        response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            apikey: EVOLUTION_API_KEY,
          },
        });
      }

      result = await response.json();

      const serviceRoleClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      await serviceRoleClient
        .from("profiles")
        .update({ whatsapp_status: "disconnected" })
        .eq("id", user.id);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
