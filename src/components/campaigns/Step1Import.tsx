import { useState, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  Upload as UploadIcon,
  Code as CodeIcon,
  ArrowRight,
  Loader2,
  FileIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { parseCSVRaw, RawSpreadsheetData } from "@/lib/csv";
import { spreadsheetService } from "@/services/spreadsheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Step1ImportProps {
  onNext: (contacts: any[], filename: string) => void;
  isProcessing: boolean;
}

type ImportStep = "upload" | "mapping";

export function Step1Import({
  onNext,
  isProcessing: parentProcessing,
}: Step1ImportProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);

  // Mapping state
  const [columnMapping, setColumnMapping] = useState({
    name: "",
    phone: "",
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await handleFileSelection(droppedFile);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFileSelection(selectedFile);
    }
    e.target.value = "";
  };

  const handleFileSelection = async (selectedFile: File) => {
    const fileExtension =
      "." + selectedFile.name.split(".").pop()?.toLowerCase();
    const validExtensions = [".xlsx", ".xls", ".csv"];

    if (!validExtensions.includes(fileExtension)) {
      toast.error("Formato inválido", {
        description: "Por favor, use arquivos .csv, .xlsx ou .xls",
      });
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    try {
      let data: RawSpreadsheetData;

      if (fileExtension === ".csv") {
        data = await parseCSVRaw(selectedFile);
      } else {
        data = await spreadsheetService.parseXLSX(selectedFile);
      }

      if (data.headers.length === 0 || data.rows.length === 0) {
        throw new Error("O arquivo parece estar vazio ou sem cabeçalhos.");
      }

      setHeaders(data.headers);
      setRawData(data.rows);

      // Auto-detect columns
      const detectedName = data.headers.find((h) =>
        ["nome", "name", "cliente", "nome completo", "full name"].includes(
          h.toLowerCase(),
        ),
      );
      const detectedPhone = data.headers.find((h) =>
        ["telefone", "phone", "celular", "whatsapp", "mobile", "tel"].includes(
          h.toLowerCase(),
        ),
      );

      setColumnMapping({
        name: detectedName || "",
        phone: detectedPhone || "",
      });

      setStep("mapping");
      toast.success("Arquivo processado com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao ler arquivo", {
        description: error.message || "Verifique se o arquivo está corrompido.",
      });
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleMappingConfirm = () => {
    if (!columnMapping.name || !columnMapping.phone) {
      toast.error("Mapeamento incompleto", {
        description: "Por favor, selecione as colunas para Nome e Telefone.",
      });
      return;
    }

    if (!file) return;

    // Transform data
    const parsedContacts = rawData
      .map((row) => {
        const name = row[columnMapping.name];
        const rawPhone = row[columnMapping.phone];

        // Clean phone: keep only numbers
        const phone = String(rawPhone || "").replace(/\D/g, "");

        // Extract metadata (all other fields)
        const metadata: Record<string, any> = {};
        Object.keys(row).forEach((key) => {
          if (key !== columnMapping.name && key !== columnMapping.phone) {
            metadata[key] = row[key];
          }
        });

        return {
          name: String(name || "").trim(),
          phone,
          message: metadata["mensagem"] || metadata["message"] || undefined,
          metadata,
        };
      })
      .filter((c) => c.name && c.phone && c.phone.length >= 8); // Basic validation

    if (parsedContacts.length === 0) {
      toast.error("Nenhum contato válido encontrado", {
        description: "Verifique se as colunas selecionadas contêm dados.",
      });
      return;
    }

    onNext(parsedContacts, file.name);
  };

  const detectedFields = useMemo(() => {
    return headers.filter(
      (h) => h !== columnMapping.name && h !== columnMapping.phone,
    );
  }, [headers, columnMapping]);

  const resetUpload = () => {
    setFile(null);
    setStep("upload");
    setHeaders([]);
    setRawData([]);
    setColumnMapping({ name: "", phone: "" });
  };

  if (step === "mapping") {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Mapeamento de Colunas
                </CardTitle>
                <CardDescription>
                  Arquivo:{" "}
                  <span className="font-medium text-foreground">
                    {file?.name}
                  </span>{" "}
                  • {rawData.length} linhas encontradas
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetUpload}>
                <X className="mr-2 h-4 w-4" />
                Trocar arquivo
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Required Fields */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" />
                  Campos Obrigatórios
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name-column">Nome do Cliente</Label>
                    <Select
                      value={columnMapping.name}
                      onValueChange={(val) =>
                        setColumnMapping((prev) => ({ ...prev, name: val }))
                      }
                    >
                      <SelectTrigger
                        id="name-column"
                        className={cn(
                          !columnMapping.name && "border-amber-400 bg-amber-50",
                        )}
                      >
                        <SelectValue placeholder="Selecione a coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Será usado como o nome principal do contato.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-column">Telefone (Whatsapp)</Label>
                    <Select
                      value={columnMapping.phone}
                      onValueChange={(val) =>
                        setColumnMapping((prev) => ({ ...prev, phone: val }))
                      }
                    >
                      <SelectTrigger
                        id="phone-column"
                        className={cn(
                          !columnMapping.phone &&
                            "border-amber-400 bg-amber-50",
                        )}
                      >
                        <SelectValue placeholder="Selecione a coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Será formatado automaticamente (removemos caracteres não
                      numéricos).
                    </p>
                  </div>
                </div>
              </div>

              {/* Detected Fields (Metadata) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm uppercase tracking-wider">
                  <TableIcon className="h-4 w-4" />
                  Outros Campos Detectados
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 min-h-[160px]">
                  {detectedFields.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">
                        Estes campos serão salvos e poderão ser usados pela IA
                        para personalizar as mensagens:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detectedFields.map((field) => (
                          <Badge
                            key={field}
                            variant="secondary"
                            className="bg-white border shadow-sm text-slate-700"
                          >
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm italic">
                      <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                      Nenhum outro campo detectado
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                size="lg"
                onClick={handleMappingConfirm}
                disabled={
                  !columnMapping.name ||
                  !columnMapping.phone ||
                  parentProcessing
                }
                className="w-full md:w-auto bg-[#13ec5b] hover:bg-[#0da540] text-slate-900 font-bold px-8 shadow-md transition-all hover:-translate-y-1"
              >
                {parentProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Confirmar e Importar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* File Dropzone */}
      <Card className="bg-white border-dashed border-2 shadow-sm hover:border-primary/50 transition-colors">
        <CardContent className="p-0">
          <div
            className={cn(
              "flex flex-col items-center justify-center min-h-[300px] p-8 cursor-pointer transition-all duration-300 group",
              isDragging ? "bg-primary/5" : "hover:bg-slate-50",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isParsing && fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              disabled={isParsing}
            />

            {isParsing ? (
              <div className="flex flex-col items-center animate-pulse">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Processando arquivo...
                </h3>
                <p className="text-slate-500">
                  Isso pode levar alguns segundos.
                </p>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "mb-6 p-4 rounded-full bg-slate-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#13ec5b]/10",
                    isDragging && "scale-110 bg-[#13ec5b]/10",
                  )}
                >
                  <FileSpreadsheet
                    className={cn(
                      "h-10 w-10 text-slate-400 transition-colors duration-300 group-hover:text-[#13ec5b]",
                      isDragging && "text-[#13ec5b]",
                    )}
                  />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2 text-center">
                  Arraste e solte sua planilha aqui
                </h3>
                <p className="text-slate-500 mb-6">
                  ou{" "}
                  <span className="text-[#13ec5b] font-medium">
                    clique para buscar
                  </span>{" "}
                  no seu computador
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-slate-50">
                    .XLSX
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50">
                    .XLS
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50">
                    .CSV
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm uppercase tracking-wider">
            <CodeIcon className="h-4 w-4" />
            <span>Flexibilidade de Formato</span>
          </div>
          <Card className="bg-slate-50/50 border shadow-none">
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Agora você pode importar planilhas em{" "}
                <strong>qualquer formato</strong>. Não se preocupe com a ordem
                das colunas ou nomes exatos.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>
                    Identifique as colunas de <strong>Nome</strong> e{" "}
                    <strong>Telefone</strong> no próximo passo.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>
                    Todos os outros dados (Cidade, Produto, etc.) são salvos
                    automaticamente.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Suporte completo para Excel (.xlsx) e CSV.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm uppercase tracking-wider">
            <AlertCircle className="h-4 w-4" />
            <span>Dicas Importantes</span>
          </div>
          <Card className="bg-amber-50/50 border-amber-100 shadow-none">
            <CardContent className="p-6 text-sm text-amber-900/80 space-y-2">
              <p>
                • A primeira linha da planilha deve conter os títulos das
                colunas.
              </p>
              <p>
                • Números de telefone serão limpos automaticamente (ex: (11)
                99999-9999 vira 11999999999).
              </p>
              <p>
                • Evite planilhas com múltiplas abas; apenas a primeira será
                lida.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
