import { useState, useEffect } from "react";
import {
    Sparkles,
    ArrowLeft,
    ArrowRight,
    Loader2,
    Info,
    Key,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { campaignsService } from "@/services/campaigns";

interface StepIAConfigProps {
    campaignId: string;
    onBack: () => void;
    onNext: () => void;
}

export function StepIAConfig({ campaignId, onBack, onNext }: StepIAConfigProps) {
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
                    const contact = messages[0].contacts as any;
                    const metadata = contact.metadata || {};
                    const fields = ["nome", "telefone", ...Object.keys(metadata)];
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

        setIsGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke("generate-ai-messages", {
                body: { campaign_id: campaignId, prompt_base: prompt },
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            toast.success(`${data.count} mensagens personalizadas foram geradas com sucesso!`);
            onNext();
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao gerar mensagens", {
                description: error.message || "Verifique sua chave de AI nas configurações."
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-yellow-500 fill-yellow-500/20" />
                    Personalização com IA
                </h1>
                <p className="text-muted-foreground text-lg">
                    Use o poder da inteligência artificial para criar mensagens únicas para cada cliente.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <Card className="border-2 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            Instrução para a IA
                        </CardTitle>
                        <CardDescription>
                            Descreva como você quer que a mensagem seja. A IA usará os dados da sua planilha para personalizar cada uma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Ex: Seja amigável, agradeça pela compra do {{produto}} e ofereça um cupom de 10% para a próxima compra."
                            className="min-h-[150px] resize-none text-base leading-relaxed p-4 focus-visible:ring-primary/20"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Campos detectados na sua planilha:
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableFields.map((field) => (
                                    <Badge key={field} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md lowercase cursor-pointer"
                                        onClick={() => setPrompt(prev => prev + ` {{${field}}}`)}>
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Dica: Clique em um campo acima para adicioná-lo ao texto. A IA usará esses dados automaticamente.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-primary/5 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                Como funciona?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                            <p>
                                1. A IA lerá as informações de cada um dos <strong>{contactCount} contatos</strong>.
                            </p>
                            <p>
                                2. Para cada linha da sua planilha, ela criará uma variação exclusiva baseada na sua instrução.
                            </p>
                            <p>
                                3. Isso reduz o risco de bloqueio no WhatsApp por "mensagens repetitivas".
                            </p>
                            <div className="pt-2 border-t mt-4">
                                <p className="flex items-center gap-2 text-xs">
                                    <Key className="h-3 w-3" />
                                    Requer OpenAI Key configurada.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-3">
                        <Button
                            size="lg"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 shadow-md shadow-primary/20 transition-all hover:-translate-y-1"
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Gerando {contactCount} mensagens...
                                </>
                            ) : (
                                <>
                                    Gerar Mensagens com IA
                                    <Sparkles className="ml-2 h-5 w-5 fill-current" />
                                </>
                            )}
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
                    </div>
                </div>
            </div>

            <div className="flex justify-start">
                <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground" disabled={isGenerating}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>
            </div>
        </div>
    );
}
