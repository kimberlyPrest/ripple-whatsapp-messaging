import { supabase } from "@/lib/supabase/client";

export const whatsappService = {
  async manageInstance(action: "create" | "get-qr" | "status" | "logout") {
    const { data, error } = await supabase.functions.invoke(
      "evolution-management",
      {
        body: { action },
      },
    );

    if (error) throw error;
    return data;
  },
};
