import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import * as XLSX from "xlsx";

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { file, type } = await req.json();

    if (!file) {
      throw new Error("File content is required");
    }

    // Decode base64
    const binaryString = atob(file);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Parse workbook
    const workbook = XLSX.read(bytes, { type: "array" });

    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON (array of arrays for headers)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rawData || rawData.length === 0) {
      throw new Error("Spreadsheet is empty");
    }

    // Extract headers (first row) and data
    const headers = (rawData[0] as any[])
      .map((h) => String(h || "").trim())
      .filter((h) => h !== "");
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: headers });

    return new Response(JSON.stringify({ headers, rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
