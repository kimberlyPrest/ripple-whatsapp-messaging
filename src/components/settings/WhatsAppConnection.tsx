import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Smartphone, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { profileService, ProfileData } from "@/services/profile";
import { whatsappService } from "@/services/whatsapp";

export function WhatsAppConnection({ profile }: { profile: ProfileData }) {
  const [activeTab, setActiveTab] = useState(
    profile.whatsapp_connection_type || "webhook",
  );
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(
    profile.whatsapp_status || "disconnected",
  );
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(profile.webhook_url || "");

  useEffect(() => {
    if (activeTab === "evolution" && !qrCode && status !== "connected") {
      // If we switch to evolution/qr code tab and not connected, try to fetch QR or status
      checkStatus();
    }
  }, [activeTab]);

  const handleCreateInstance = async () => {
    try {
      setLoading(true);
      const res = await whatsappService.manageInstance("create");
      if (res.qrcode?.base64) {
        setQrCode(res.qrcode.base64);
        setStatus("pairing");
      }
      // Update connection type preference
      await profileService.update(profile.id, {
        whatsapp_connection_type: "evolution",
      });
      toast.success("Instância criada! Escaneie o QR Code.");
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
      } else {
        // If disconnected and no QR, try to get QR
        const qrRes = await whatsappService.manageInstance("get-qr");
        if (qrRes.base64) setQrCode(qrRes.base64);
      }
    } catch (e) {
      console.error(e);
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
    } catch (error) {
      toast.error("Erro ao salvar Webhook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
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
      <CardContent>
        {activeTab === "evolution" ? (
          <div className="grid md:grid-cols-2 gap-8 pt-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative flex items-center justify-center w-64 h-64 border-2 border-dashed border-green-300 rounded-xl bg-green-50/30 p-4">
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                ) : status === "connected" ? (
                  <div className="text-center text-green-600 font-medium">
                    WhatsApp Conectado!
                  </div>
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
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <div
                  className={`w-3 h-3 rounded-full ${status === "connected" ? "bg-green-500" : "bg-red-500"}`}
                />
                <span
                  className={
                    status === "connected" ? "text-green-600" : "text-red-500"
                  }
                >
                  Status:{" "}
                  {status === "connected" ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Como conectar?</h3>
                <ol className="space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5">
                      1
                    </span>
                    <p>Abra o WhatsApp no seu aparelho celular.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5">
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
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs mt-0.5">
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
                className="w-full border-green-500 text-green-600 hover:bg-green-50"
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
        ) : (
          <div className="pt-4 space-y-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                URL do Webhook (n8n ou similar)
              </label>
              <Input
                placeholder="https://seu-webhook.com/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                As mensagens recebidas serão encaminhadas para esta URL.
              </p>
            </div>
            <Button
              onClick={handleSaveWebhook}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white"
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
