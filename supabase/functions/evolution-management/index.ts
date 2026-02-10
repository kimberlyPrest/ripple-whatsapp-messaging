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

    console.log(`Action: ${action} | Target URL: ${targetUrl}`);

    if (action === "create") {
      const createBody = {
        instanceName: instanceName,
        token: user.id,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      };

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify(createBody),
      });

      result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to create instance",
        );
      }

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
      let response = await fetch(targetUrl, {
        method: "DELETE",
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
      });

      if (!response.ok) {
        // Fallback or retry if needed, but usually delete is final
        response = await fetch(targetUrl, {
          method: "POST", // Some versions use POST for logout
          headers: {
            apikey: EVOLUTION_API_KEY,
          },
        });
      }

      result = await response.json();

      await serviceRoleClient
        .from("profiles")
        .update({
          whatsapp_status: "disconnected",
          whatsapp_connected_at: null,
        })
        .eq("id", user.id);
    } else if (action === "get-info") {
      // Fetch all instances and find the one matching the user
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          apikey: EVOLUTION_API_KEY,
        },
      });

      const instances = await response.json();

      let instanceInfo = null;
      if (Array.isArray(instances)) {
        instanceInfo = instances.find(
          (i: any) =>
            i.instance?.instanceName === instanceName ||
            i.name === instanceName,
        );
      }

      if (instanceInfo) {
        // Normalize structure
        result = {
          profilePictureUrl:
            instanceInfo.profilePictureUrl ||
            instanceInfo.instance?.profilePictureUrl,
          owner: instanceInfo.owner || instanceInfo.instance?.owner,
          profileName:
            instanceInfo.profileName || instanceInfo.instance?.profileName,
        };
      } else {
        result = null;
      }
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
