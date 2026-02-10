export interface ParsedContact {
  name: string;
  phone: string;
  message?: string;
  metadata?: Record<string, string>;
}

export const parseCSV = async (file: File): Promise<ParsedContact[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          resolve([]);
          return;
        }

        const lines = text.split(/\r\n|\n/);
        const headers = lines[0]
          .split(/[;,]/)
          .map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));

        const nameIndex = headers.findIndex(
          (h) => h === "nome" || h === "name",
        );
        const phoneIndex = headers.findIndex(
          (h) => h === "telefone" || h === "phone" || h === "celular",
        );
        const messageIndex = headers.findIndex(
          (h) => h === "mensagem" || h === "message",
        );

        if (nameIndex === -1 || phoneIndex === -1) {
          reject(
            new Error(
              "Colunas obrigatórias não encontradas. O arquivo deve conter pelo menos: Nome e Telefone",
            ),
          );
          return;
        }

        const contacts: ParsedContact[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Basic CSV parsing handling quotes
          const row: string[] = [];
          let inQuotes = false;
          let currentValue = "";

          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if ((char === "," || char === ";") && !inQuotes) {
              row.push(currentValue.trim().replace(/^"|"$/g, ""));
              currentValue = "";
            } else {
              currentValue += char;
            }
          }
          row.push(currentValue.trim().replace(/^"|"$/g, ""));

          if (row.length > Math.max(nameIndex, phoneIndex)) {
            const metadata: Record<string, string> = {};
            headers.forEach((header, idx) => {
              if (row[idx] !== undefined) {
                metadata[header] = row[idx];
              }
            });

            contacts.push({
              name: row[nameIndex],
              phone: row[phoneIndex],
              message: messageIndex !== -1 ? row[messageIndex] : undefined,
              metadata,
            });
          }
        }

        resolve(contacts);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo"));
    reader.readAsText(file);
  });
};
