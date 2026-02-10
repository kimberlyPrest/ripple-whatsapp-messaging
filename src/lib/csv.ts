export interface ParsedContact {
  name: string;
  phone: string;
  message?: string;
  metadata?: Record<string, string>;
}

export interface RawSpreadsheetData {
  headers: string[];
  rows: Record<string, any>[];
}

// Helper to clean CSV strings
const cleanStr = (str: string) => str.trim().replace(/^"|"$/g, "");

export const parseCSVRaw = async (file: File): Promise<RawSpreadsheetData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const lines = text.split(/\r\n|\n/);
        if (lines.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }

        // Parse headers from first line
        const headerLine = lines[0];
        const headers = headerLine
          .split(/[;,]/)
          .map((h) => cleanStr(h))
          .filter((h) => h !== "");

        const rows: Record<string, any>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Basic CSV parsing
          const rowValues: string[] = [];
          let inQuotes = false;
          let currentValue = "";

          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if ((char === "," || char === ";") && !inQuotes) {
              rowValues.push(cleanStr(currentValue));
              currentValue = "";
            } else {
              currentValue += char;
            }
          }
          rowValues.push(cleanStr(currentValue));

          // Map values to headers
          const rowObject: Record<string, any> = {};
          headers.forEach((header, index) => {
            if (rowValues[index] !== undefined) {
              rowObject[header] = rowValues[index];
            }
          });

          // Only add row if it has at least one value
          if (Object.keys(rowObject).length > 0) {
            rows.push(rowObject);
          }
        }

        resolve({ headers, rows });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo CSV"));
    reader.readAsText(file);
  });
};

/**
 * Legacy parser (tries to auto-detect columns) - Kept for backward compatibility if needed,
 * but Step1Import will now use parseCSVRaw + manual mapping.
 */
export const parseCSV = async (file: File): Promise<ParsedContact[]> => {
  const { headers, rows } = await parseCSVRaw(file);

  // Auto-detect columns
  const nameKey = headers.find((h) =>
    ["nome", "name", "cliente"].includes(h.toLowerCase()),
  );
  const phoneKey = headers.find((h) =>
    ["telefone", "phone", "celular", "whatsapp"].includes(h.toLowerCase()),
  );
  const messageKey = headers.find((h) =>
    ["mensagem", "message", "msg"].includes(h.toLowerCase()),
  );

  if (!nameKey || !phoneKey) {
    throw new Error(
      "Colunas obrigatórias (Nome, Telefone) não encontradas automaticamente.",
    );
  }

  return rows.map((row) => {
    const metadata: Record<string, string> = {};
    Object.keys(row).forEach((key) => {
      if (key !== nameKey && key !== phoneKey && key !== messageKey) {
        metadata[key] = String(row[key]);
      }
    });

    return {
      name: row[nameKey],
      phone: row[phoneKey],
      message: messageKey ? row[messageKey] : undefined,
      metadata,
    };
  });
};
