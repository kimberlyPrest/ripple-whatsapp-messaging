import { supabase } from "@/lib/supabase/client";
import { RawSpreadsheetData } from "@/lib/csv";

export const spreadsheetService = {
  async parseXLSX(file: File): Promise<RawSpreadsheetData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const base64String = (event.target?.result as string).split(",")[1];

          const { data, error } = await supabase.functions.invoke(
            "parse-spreadsheet",
            {
              body: {
                file: base64String,
                type: file.name.endsWith(".xlsx") ? "xlsx" : "xls",
              },
            },
          );

          if (error) throw error;
          if (data.error) throw new Error(data.error);

          resolve(data as RawSpreadsheetData);
        } catch (error) {
          console.error("Error parsing spreadsheet:", error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
      reader.readAsDataURL(file);
    });
  },
};
