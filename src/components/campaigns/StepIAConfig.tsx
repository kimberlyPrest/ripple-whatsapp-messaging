import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Info,
  Key,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { campaignsService } from "@/services/campaigns";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { profileService } from "@/services/profile";

interface StepIAConfigProps {
  campaignId: string;
  onBack: () => void;
  onNext: () => void;
}

export function StepIAConfig({
  campaignId,
  onBack,
  onNext,
}: StepIAConfigProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    async function fetchCampaignDetails() {
      try {
        const messages = await campaignsService.getMessages(campaignId);
        setContactCount(messages.length);

        if (messages.length > 0 && messages[0].contacts) {
          const contact = messages[0].contacts;
          // Extract keys from metadata
          const metadata = contact.metadata || {};

          const metadataKeys = Object.keys(metadata).filter(
            (key) =>
              ![
                "name",
                "phone",
                "nome",
                "telefone",
                "celular",
                "message",
              ].includes(key.toLowerCase()),
          );

          // List "name" and "phone" first, then other metadata keys
          const fields = ["name", "phone", ...metadataKeys];
          setAvailableFields([...new Set(fields)]);
        }
      } catch (error) {
        console.error("Error fetching campaign details:", error);
      }
    }
    fetchCampaignDetails();
  }, [campaignId]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Por favor, digite uma instrução base.");
      return;
    }

    // Pre-execution check: Verify if Gemini API Key exists in profile
    if (user) {
      try {
        const profile = await profileService.get(user.id);
        if (!profile?.gemini_api_key) {
          toast.error("Gemini API Key não encontrada", {
            description: "Por favor, configure sua chave em Configurações.",
            action: {
              label: "Configurar",
              onClick: () => navigate("/settings"),
            },
            duration: 5000,
          });
          return;
        }
      } catch (error) {
        console.error("Error validating API key:", error);
        // Continue and let the backend handle the error if validation fails due to network
      }
    }

    setIsGenerating(true);
    try {
      // Optimistic user feedback
      toast.info("Iniciando geração com Gemini AI...", {
        description:
          "Isso pode levar alguns minutos dependendo da quantidade de contatos.",
      });

      const data = await campaignsService.generateAiMessages(
        campaignId,
        prompt,
      );

      if (data.count > 0) {
        toast.success("Sucesso!", {
          description: `${data.count} mensagens personalizadas foram geradas.`,
        });
        if (data.failures > 0) {
          toast.warning("Atenção", {
            description: `${data.failures} contatos falharam. Verifique os erros na tabela.`,
          });
        }
        onNext();
      } else if (data.error) {
        // Handle explicit error returned in JSON (success: false)
        if (
          data.error ===
          "Gemini API Key não encontrada. Por favor, configure sua chave em Configurações."
        ) {
          toast.error("Gemini API Key não encontrada", {
            description: "Por favor, configure sua chave em Configurações.",
            action: {
              label: "Configurar",
              onClick: () => navigate("/settings"),
            },
          });
        } else {
          toast.error("Erro na geração", { description: data.error });
        }
      } else {
        toast.warning("Nenhuma mensagem gerada", {
          description: "Verifique se seus contatos estão corretos.",
        });
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);

      const isAuthError =
        error?.status === 401 ||
        error?.code === 401 ||
        error?.message?.includes("Unauthorized") ||
        error?.message?.includes("JWT");

      const errorMessage = error.message || "";
      const isMissingKeyError =
        errorMessage.includes("Gemini API Key não encontrada") ||
        errorMessage.includes("configure sua chave");

      if (isAuthError) {
        toast.error("Sessão expirada", {
          description:
            "Por favor, recarregue a página ou faça login novamente para continuar.",
          action: {
            label: "Recarregar",
            onClick: () => window.location.reload(),
          },
        });
      } else if (isMissingKeyError) {
        toast.error("Gemini API Key não encontrada", {
          description: "Por favor, configure sua chave em Configurações.",
          action: {
            label: "Configurar",
            onClick: () => navigate("/settings"),
          },
        });
      } else {
        toast.error("Erro ao gerar mensagens", {
          description:
            errorMessage ||
            "Verifique sua chave de API do Gemini nas configurações ou tente novamente.",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-500 fill-blue-500/20" />
          Personalização com Gemini AI
        </h1>
        <p className="text-muted-foreground text-lg">
          Use o poder da inteligência artificial do Google para criar mensagens
          únicas para cada cliente.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-2 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Instrução para a IA
            </CardTitle>
            <CardDescription>
              Escreva o modelo da mensagem. Use as variáveis abaixo para
              personalizar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col">
            <Textarea
              placeholder="Ex: Olá {{name}}! Vi que você comprou {{produto}} recentemente. Que tal um desconto?"
              className="min-h-[180px] flex-1 resize-none text-base leading-relaxed p-4 focus-visible:ring-primary/20 font-medium"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Variáveis disponíveis:
              </label>
              {availableFields.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableFields.map((field) => (
                    <Badge
                      key={field}
                      variant="secondary"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md lowercase cursor-pointer transition-colors border border-slate-200 select-none active:scale-95"
                      onClick={() => {
                        if (!isGenerating) {
                          // Insert at cursor position if possible, otherwise append
                          setPrompt((prev) => prev + ` {{${field}}}`);
                        }
                      }}
                    >
                      {`{{${field}}}`}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma variável detectada além de nome/telefone.
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Clique para adicionar ao texto. O Gemini substituirá pelo valor
                real de cada contato.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-none shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Como funciona a substituição?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>
                1. O sistema substituirá as variáveis (ex:{" "}
                <code>{"{{name}}"}</code>) pelos dados reais da planilha.
              </p>
              <p>
                2. O texto completo será enviado para o{" "}
                <strong>Gemini 2.5 Flash</strong> refinar e humanizar.
              </p>
              <p>
                3. Resultado: Mensagens naturais, sem "cara de robô", e sem
                erros de formatação.
              </p>
              <div className="pt-2 border-t mt-4">
                <p className="flex items-center gap-2 text-xs">
                  <Key className="h-3 w-3" />
                  Requer Gemini API Key configurada.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            {isGenerating ? (
              <div className="w-full bg-slate-50 border rounded-lg p-6 space-y-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Gerando mensagens...
                  </h3>
                  <p className="text-sm text-slate-500">
                    Isso pode levar alguns minutos. Não feche esta página.
                  </p>
                </div>
                <Progress value={33} className="h-2 w-full" />
              </div>
            ) : (
              <>
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 shadow-md shadow-blue-500/20 transition-all hover:-translate-y-1"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                >
                  <>
                    Gerar {contactCount} Mensagens com Gemini
                    <Sparkles className="ml-2 h-5 w-5 fill-current" />
                  </>
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onNext}
                  disabled={isGenerating}
                >
                  Pular IA e usar mensagens originais
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-start">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 text-muted-foreground"
          disabled={isGenerating}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
    </div>
  );
}
