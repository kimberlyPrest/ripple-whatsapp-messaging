import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  Save,
  User as UserIcon,
  Camera,
  Upload,
  HelpCircle,
  Download,
  ExternalLink,
  MessageSquare,
  QrCode,
  LogOut,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { profileService, ProfileData } from "@/services/profile";
import { whatsappService } from "@/services/whatsapp";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email(),
  webhook_url: z
    .string()
    .url("A URL do webhook deve ser válida.")
    .nullable()
    .or(z.literal("")),
  whatsapp_connection_type: z.enum(["webhook", "evolution"]),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<string>("disconnected");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      webhook_url: "",
      whatsapp_connection_type: "webhook",
    },
    mode: "onChange",
  });

  const loadProfile = async () => {
    if (!user) return;

    try {
      const profile = await profileService.get(user.id);
      if (profile) {
        form.reset({
          name: profile.name || "",
          email: user.email || "",
          webhook_url: profile.webhook_url || "",
          whatsapp_connection_type:
            profile.whatsapp_connection_type || "webhook",
        });
        setWhatsappStatus(profile.whatsapp_status || "disconnected");
        if (profile.avatar_url) {
          setPreviewUrl(profile.avatar_url);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    setIsSaving(true);

    try {
      let avatarUrl = undefined;

      if (avatarFile) {
        try {
          avatarUrl = await profileService.uploadAvatar(user.id, avatarFile);
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toast.error("Erro ao fazer upload da imagem");
          throw error;
        }
      }

      await profileService.update(user.id, {
        name: data.name,
        webhook_url: data.webhook_url || null,
        whatsapp_connection_type: data.whatsapp_connection_type,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      });

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  }

  const handleCreateInstance = async () => {
    try {
      setCheckingStatus(true);
      const res = await whatsappService.manageInstance("create");
      if (res.error) throw new Error(res.error);

      if (res.qrcode?.base64) {
        setQrCode(res.qrcode.base64);
        setWhatsappStatus("pairing");
      }
      toast.success("Instância criada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao criar instância: " + error.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleGetQR = async () => {
    try {
      setCheckingStatus(true);
      const res = await whatsappService.manageInstance("get-qr");
      if (res.error) throw new Error(res.error);

      if (res.base64) {
        setQrCode(res.base64);
        setWhatsappStatus("pairing");
      } else if (res.code === "ALREADY_CONNECTED") {
        setWhatsappStatus("connected");
        toast.info("WhatsApp já está conectado.");
      }
    } catch (error: any) {
      toast.error("Erro ao obter QR Code: " + error.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await whatsappService.manageInstance("status");
      if (res.instance?.state === "open") {
        setWhatsappStatus("connected");
        setQrCode(null);
        toast.success("WhatsApp conectado!");
      } else {
        setWhatsappStatus("disconnected");
        toast.info("WhatsApp desconectado.");
      }
    } catch (error: any) {
      toast.error("Erro ao verificar status: " + error.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      setCheckingStatus(true);
      await whatsappService.manageInstance("logout");
      setWhatsappStatus("disconnected");
      setQrCode(null);
      toast.success("WhatsApp desconectado com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao desconectar: " + error.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userInitials = form.getValues("name")
    ? form
        .getValues("name")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.substring(0, 2).toUpperCase();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações de perfil e configurações de integração.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize sua foto de perfil e dados pessoais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row gap-8 items-start border-b pb-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <Avatar
                        className="w-32 h-32 border-4 border-muted cursor-pointer transition-opacity hover:opacity-90"
                        onClick={triggerFileInput}
                      >
                        <AvatarImage
                          src={previewUrl || ""}
                          alt="Foto de perfil"
                          className="object-cover"
                        />
                        <AvatarFallback className="text-4xl bg-muted">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                        title="Alterar foto"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerFileInput}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Alterar foto
                    </Button>
                  </div>

                  <div className="flex-1 w-full space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Seu nome"
                                className="pl-9"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} disabled className="bg-muted" />
                          </FormControl>
                          <FormDescription>
                            O email não pode ser alterado diretamente.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-medium">Conectar WhatsApp</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="whatsapp_connection_type"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <Tabs
                          value={field.value}
                          onValueChange={(val) => field.onChange(val)}
                          className="w-full"
                        >
                          <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="webhook">
                              Webhook (n8n)
                            </TabsTrigger>
                            <TabsTrigger value="evolution">
                              WhatsApp Nativo (Cloudfy)
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent
                            value="webhook"
                            className="space-y-6 animate-in fade-in-50 duration-300"
                          >
                            <FormField
                              control={form.control}
                              name="webhook_url"
                              render={({ field: webhookField }) => (
                                <FormItem>
                                  <div className="flex items-center justify-between gap-4">
                                    <FormLabel>URL do Webhook</FormLabel>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 flex items-center gap-2 border-primary text-primary hover:bg-primary/5 hover:text-primary transition-all shrink-0"
                                        >
                                          <HelpCircle className="w-4 h-4" />
                                          Como configurar o n8n?
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-md">
                                        <DialogHeader>
                                          <DialogTitle>
                                            Configuração do n8n
                                          </DialogTitle>
                                          <DialogDescription>
                                            Siga os passos abaixo para integrar
                                            o sistema com seu n8n.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-6 py-4">
                                          <div className="flex items-start gap-3">
                                            <div className="bg-primary/10 p-2 rounded-full text-primary mt-1 shrink-0">
                                              <Download className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <p className="font-semibold text-base">
                                                1. Baixe o Workflow
                                              </p>
                                              <p className="text-sm text-muted-foreground mb-3">
                                                Faça o download do arquivo JSON
                                                pronto para importar no seu n8n.
                                              </p>
                                              <Button
                                                variant="default"
                                                size="sm"
                                                asChild
                                                className="w-full sm:w-auto"
                                              >
                                                <a
                                                  href="/n8n_workflow.json"
                                                  download="n8n_workflow.json"
                                                  className="flex items-center justify-center gap-2"
                                                >
                                                  <Download className="w-4 h-4" />
                                                  Download JSON para n8n
                                                </a>
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-3 border-t pt-4">
                                            <div className="bg-primary/10 p-2 rounded-full text-primary mt-1 shrink-0">
                                              <Upload className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <p className="font-semibold text-base">
                                                2. Importe no n8n
                                              </p>
                                              <p className="text-sm text-muted-foreground">
                                                No seu painel n8n, crie um novo
                                                workflow e use a opção{" "}
                                                <span className="font-medium text-foreground italic">
                                                  "Import from File"
                                                </span>{" "}
                                                no menu para selecionar o JSON
                                                que você baixou.
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-3 border-t pt-4">
                                            <div className="bg-primary/10 p-2 rounded-full text-primary mt-1 shrink-0">
                                              <ExternalLink className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <p className="font-semibold text-base">
                                                3. Configure a Conexão
                                              </p>
                                              <p className="text-sm text-muted-foreground">
                                                Abra o nó chamado{" "}
                                                <span className="text-foreground font-bold font-mono">
                                                  "Whatsapp"
                                                </span>
                                                . Lá você precisará inserir seus
                                                dados da API.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                  <FormControl>
                                    <Input
                                      placeholder="https://seu-n8n-webhook.com/..."
                                      {...webhookField}
                                      value={webhookField.value || ""}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Cole aqui a URL do Webhook gerada pelo seu
                                    n8n.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TabsContent>

                          <TabsContent
                            value="evolution"
                            className="space-y-6 animate-in fade-in-50 duration-300"
                          >
                            <div className="bg-muted/30 border rounded-xl p-6">
                              <div className="flex flex-col items-center text-center space-y-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-full ${whatsappStatus === "connected" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}
                                  >
                                    {whatsappStatus === "connected" ? (
                                      <CheckCircle2 className="w-6 h-6" />
                                    ) : (
                                      <XCircle className="w-6 h-6" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-lg capitalize">
                                      {whatsappStatus === "connected"
                                        ? "Conectado"
                                        : "Desconectado"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Via Evolution API v2 (Cloudfy)
                                    </p>
                                  </div>
                                </div>

                                {whatsappStatus === "disconnected" &&
                                  !qrCode && (
                                    <div className="py-4">
                                      <Button
                                        type="button"
                                        onClick={handleCreateInstance}
                                        disabled={checkingStatus}
                                        className="flex items-center gap-2"
                                      >
                                        {checkingStatus ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <QrCode className="w-4 h-4" />
                                        )}
                                        Gerar QR Code para Conectar
                                      </Button>
                                      <p className="text-xs text-muted-foreground mt-2 italic px-8">
                                        Isso criará uma instância exclusiva para
                                        seu usuário e gerará o QR Code para
                                        pareamento.
                                      </p>
                                    </div>
                                  )}

                                {qrCode && whatsappStatus !== "connected" && (
                                  <div className="flex flex-col items-center space-y-4 py-2">
                                    <div className="bg-white p-4 rounded-xl border-2 border-primary/20 shadow-sm relative group">
                                      <img
                                        src={qrCode}
                                        alt="WhatsApp QR Code"
                                        className="w-48 h-48"
                                      />
                                      <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={handleGetQR}
                                          className="bg-white/80 hover:bg-white border"
                                        >
                                          <RefreshCw className="w-4 h-4 mr-2" />{" "}
                                          Atualizar
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                      <p className="text-sm font-medium animate-pulse text-primary">
                                        Aguardando leitura do QR Code...
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCheckStatus}
                                        disabled={checkingStatus}
                                      >
                                        {checkingStatus ? (
                                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                          <RefreshCw className="w-4 h-4 mr-2" />
                                        )}
                                        Verificar Status agora
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {whatsappStatus === "connected" && (
                                  <div className="py-4 flex flex-col items-center gap-4">
                                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200 flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4" /> Seu
                                      WhatsApp está pronto para uso!
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCheckStatus}
                                        disabled={checkingStatus}
                                      >
                                        <RefreshCw
                                          className={`w-4 h-4 mr-2 ${checkingStatus ? "animate-spin" : ""}`}
                                        />{" "}
                                        Sincronizar
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleLogout}
                                        disabled={checkingStatus}
                                      >
                                        <LogOut className="w-4 h-4 mr-2" />{" "}
                                        Desconectar
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-6 border-t">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="min-w-[150px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
