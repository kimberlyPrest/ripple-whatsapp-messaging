import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Smartphone,
  RefreshCw,
  Save,
  Check,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { profileService, ProfileData } from "@/services/profile";
import { whatsappService } from "@/services/whatsapp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InstanceInfo {
  profilePictureUrl?: string;
  owner?: string; // JID or number
  profileName?: string;
}

export function WhatsAppConnection({
  profile,
  onUpdate,
}: {
  profile: ProfileData;
  onUpdate?: () => void;
}) {
  const [activeTab, setActiveTab] = useState(
    profile.whatsapp_connection_type || "webhook",
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    profile.whatsapp_status || "disconnected",
  );
  const [loading, setLoading] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(profile.webhook_url || "");
  const [instanceInfo, setInstanceInfo] = useState<InstanceInfo | null>(null);

  useEffect(() => {
    setStatus(profile.whatsapp_status || "disconnected");
  }, [profile.whatsapp_status]);

  useEffect(() => {
    if (activeTab === "evolution" && !qrCode && status !== "connected") {
      checkStatus();
    }
    if (activeTab === "evolution" && status === "connected") {
      fetchInstanceInfo();
    }
  }, [activeTab, status]);

  const fetchInstanceInfo = async () => {
    try {
      setInfoLoading(true);
      const info = await whatsappService.manageInstance("get-info");
      if (info) {
        setInstanceInfo(info);
      }
    } catch (e) {
      console.error("Failed to fetch instance info", e);
    } finally {
      setInfoLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    try {
      setLoading(true);
      const res = await whatsappService.manageInstance("create");
      if (res.qrcode?.base64) {
        setQrCode(res.qrcode.base64);
        setStatus("pairing");
      }
      await profileService.update(profile.id, {
        whatsapp_connection_type: "evolution",
      });
      toast.success("Instância criada! Escaneie o QR Code.");
      if (onUpdate) onUpdate();
    } catch (error: any) {
      toast.error("Erro ao gerar QR Code");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await whatsappService.manageInstance("status");
      if (res.instance?.state === "open") {
        setStatus("connected");
        setQrCode(null);
        if (onUpdate) onUpdate();
      } else {
        const qrRes = await whatsappService.manageInstance("get-qr");
        if (qrRes.base64) setQrCode(qrRes.base64);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await whatsappService.manageInstance("logout");
      setStatus("disconnected");
      setInstanceInfo(null);
      setQrCode(null);
      toast.success("WhatsApp desconectado com sucesso");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erro ao desconectar");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    try {
      setLoading(true);
      await profileService.update(profile.id, {
        webhook_url: webhookUrl,
        whatsapp_connection_type: "webhook",
      });
      toast.success("Webhook salvo com sucesso!");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erro ao salvar Webhook");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (jid?: string) => {
    if (!jid) return "Número desconhecido";
    // Clean JID to get just the number
    const number = jid.split("@")[0];
    // Check if it's a Brazilian number (starts with 55) and format
    if (number.startsWith("55") && number.length >= 12) {
      const ddd = number.substring(2, 4);
      const prefix = number.substring(4, number.length - 4);
      const suffix = number.substring(number.length - 4);
      return `+55 (${ddd}) ${prefix}-${suffix}`;
    }
    return `+${number}`;
  };

  const renderConnectedState = () => (
    <div className="flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in">
      <div className="border border-green-100 rounded-3xl p-8 bg-green-50/20 w-full max-w-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-white shadow-md">
              <AvatarImage
                src={
                  instanceInfo?.profilePictureUrl ||
                  profile.avatar_url ||
                  undefined
                }
                className="object-cover"
              />
              <AvatarFallback className="text-2xl bg-green-100 text-green-700">
                {profile.name?.slice(0, 2).toUpperCase() || "WA"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
              <div className="bg-green-500 rounded-full p-1">
                <Check className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 px-3 py-1 text-xs tracking-wider font-bold">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              STATUS: CONECTADO
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              {formatPhoneNumber(instanceInfo?.owner)}
            </h3>
            {profile.whatsapp_connected_at && (
              <p className="text-muted-foreground text-sm">
                Conectado em{" "}
                {format(
                  new Date(profile.whatsapp_connected_at),
                  "d 'de' MMMM, yyyy 'às' HH:mm",
                  {
                    locale: ptBR,
                  },
                )}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleDisconnect}
          disabled={loading}
          variant="outline"
          className="border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-200 min-w-[200px] h-12 text-base font-medium transition-all"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5 mr-2" />
          )}
          Desconectar WhatsApp
        </Button>
      </div>

      <p className="text-center text-muted-foreground text-sm max-w-lg leading-relaxed">
        Sua conta está sincronizada e pronta para disparos. Para trocar o número
        conectado, desconecte a conta atual primeiro.
      </p>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-600" />
          <CardTitle>Conectar WhatsApp</CardTitle>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-[200px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evolution">QR Code</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-0">
        {activeTab === "evolution" ? (
          status === "connected" ? (
            renderConnectedState()
          ) : (
            <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative flex items-center justify-center w-64 h-64 border-2 border-dashed border-green-300 rounded-xl bg-green-50/30 p-4 transition-all hover:bg-green-50/50">
                  {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  ) : qrCode ? (
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground text-sm p-4">
                      Clique em "Gerar Novo QR Code" para conectar
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider bg-gray-100 px-4 py-2 rounded-full">
                  <div className={`w-3 h-3 rounded-full bg-red-500`} />
                  <span className="text-red-500">Status: Desconectado</span>
                </div>
              </div>

              <div className="space-y-6 flex flex-col justify-center">
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Como conectar?</h3>
                  <ol className="space-y-4 text-sm text-muted-foreground">
                    <li className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5 shadow-sm">
                        1
                      </span>
                      <p>Abra o WhatsApp no seu aparelho celular.</p>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5 shadow-sm">
                        2
                      </span>
                      <p>
                        Toque em{" "}
                        <strong className="font-bold text-foreground">
                          Menu
                        </strong>{" "}
                        ou{" "}
                        <strong className="font-bold text-foreground">
                          Configurações
                        </strong>{" "}
                        e selecione{" "}
                        <strong className="font-bold text-foreground">
                          Aparelhos conectados
                        </strong>
                        .
                      </p>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5 shadow-sm">
                        3
                      </span>
                      <p>
                        Toque em{" "}
                        <strong className="font-bold text-foreground">
                          Conectar um aparelho
                        </strong>{" "}
                        e aponte seu celular para esta tela.
                      </p>
                    </li>
                  </ol>
                </div>

                <Button
                  onClick={handleCreateInstance}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-green-500 text-green-600 hover:bg-green-50 h-11"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Gerar Novo QR Code
                </Button>
              </div>
            </div>
          )
        ) : (
          <div className="p-6 md:p-8 space-y-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                URL do Webhook (n8n ou similar)
              </label>
              <Input
                placeholder="https://seu-webhook.com/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">
                As mensagens recebidas serão encaminhadas para esta URL.
              </p>
            </div>
            <Button
              onClick={handleSaveWebhook}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white w-full md:w-auto"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Configuração Webhook
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
