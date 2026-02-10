import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
};

// Ensure environment variables are trimmed of whitespace
const EVOLUTION_API_URL = Deno.env
  .get("EVOLUTION_API_URL")
  ?.replace(/\/$/, "")
  ?.trim();
const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")?.trim();

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

    const serviceRoleClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

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
              : action === "get-info"
                ? `${EVOLUTION_API_URL}/instance/fetchInstances`
                : "";

    if (!targetUrl) {
      throw new Error(`Invalid action: ${action}`);
    }

    console.log(`Action: ${action} | Target URL: ${targetUrl}`);

    const fetchOptions: RequestInit = {
      method:
        action === "create" ? "POST" : action === "logout" ? "DELETE" : "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
        "User-Agent": "Supabase-Edge-Function",
      },
    };

    if (action === "create") {
      const createBody = {
        instanceName: instanceName,
        token: user.id,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      };
      fetchOptions.body = JSON.stringify(createBody);
    }

    let response = await fetch(targetUrl, fetchOptions);

    if (action === "logout" && !response.ok) {
      // Fallback or retry if needed, but usually delete is final
      // Some versions use POST for logout
      fetchOptions.method = "POST";
      response = await fetch(targetUrl, fetchOptions);
    }

    // Safely parse response
    const responseText = await response.text();
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText || response.statusText };
    }

    if (!response.ok) {
      console.error(
        `Evolution API Error (${response.status}):`,
        JSON.stringify(result),
      );
      throw new Error(
        result.message ||
          result.error ||
          result.response?.message ||
          "Failed to process request to Evolution API",
      );
    }

    if (action === "create") {
      await serviceRoleClient
        .from("profiles")
        .update({ evolution_instance_id: instanceName })
        .eq("id", user.id);
    } else if (action === "status") {
      const status =
        result.instance?.state === "open" ? "connected" : "disconnected";

      const { data: profile } = await serviceRoleClient
        .from("profiles")
        .select("whatsapp_status, whatsapp_connected_at")
        .eq("id", user.id)
        .single();

      const updates: any = { whatsapp_status: status };

      // If becoming connected and no timestamp exists, set it
      if (status === "connected" && !profile?.whatsapp_connected_at) {
        updates.whatsapp_connected_at = new Date().toISOString();
      }

      await serviceRoleClient
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
    } else if (action === "logout") {
      await serviceRoleClient
        .from("profiles")
        .update({
          whatsapp_status: "disconnected",
          whatsapp_connected_at: null,
        })
        .eq("id", user.id);
    } else if (action === "get-info") {
      // Fetch all instances and find the one matching the user
      const instances = result;

      let instanceInfo = null;
      if (Array.isArray(instances)) {
        instanceInfo = instances.find(
          (i: any) =>
            i.instance?.instanceName === instanceName ||
            i.name === instanceName,
        );
      }

      if (instanceInfo) {
        // Normalize structure and prioritize pushName
        result = {
          profilePictureUrl:
            instanceInfo.profilePictureUrl ||
            instanceInfo.instance?.profilePictureUrl,
          owner: instanceInfo.owner || instanceInfo.instance?.owner,
          profileName:
            instanceInfo.pushName ||
            instanceInfo.instance?.pushName ||
            instanceInfo.profileName ||
            instanceInfo.instance?.profileName,
        };
      } else {
        result = null;
      }
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
