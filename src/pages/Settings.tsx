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
} from "lucide-react";
import { toast } from "sonner";
import { profileService } from "@/services/profile";
import { Navigate } from "react-router-dom";

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
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      webhook_url: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const profile = await profileService.get(user.id);
        if (profile) {
          form.reset({
            name: profile.name || "",
            email: user.email || "",
            webhook_url: (profile as any).webhook_url || "",
          });
          if (profile.avatar_url) {
            setPreviewUrl(profile.avatar_url);
          }
        } else {
          form.reset({
            name: "",
            email: user.email || "",
            webhook_url: "",
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadProfile();
    }
  }, [user, form]);

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
                  <h3 className="text-lg font-medium mb-4">
                    Configurações de Webhook
                  </h3>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="webhook_url"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel>URL do Webhook</FormLabel>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 flex items-center gap-2"
                                >
                                  <HelpCircle className="w-4 h-4" />
                                  Como configurar o n8n?
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Configuração do n8n</DialogTitle>
                                  <DialogDescription>
                                    Siga os passos abaixo para integrar o
                                    sistema com seu n8n.
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
                                        Faça o download do arquivo JSON pronto
                                        para importar no seu n8n.
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
                                        No seu painel n8n, crie um novo workflow
                                        e use a opção{" "}
                                        <span className="font-medium text-foreground italic">
                                          "Import from File"
                                        </span>{" "}
                                        no menu para selecionar o JSON que você
                                        baixou.
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
                                        . Lá você precisará inserir:
                                      </p>
                                      <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                                        <li>
                                          Sua{" "}
                                          <span className="font-semibold">
                                            URL da API
                                          </span>
                                        </li>
                                        <li>
                                          Sua{" "}
                                          <span className="font-semibold">
                                            API Key
                                          </span>{" "}
                                          (do Evolution API)
                                        </li>
                                      </ul>
                                    </div>
                                  </div>

                                  <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                                    <p className="font-medium mb-1">Dica:</p>
                                    Após importar e configurar, não esqueça de
                                    copiar a{" "}
                                    <span className="font-bold underline italic">
                                      Webhook URL
                                    </span>{" "}
                                    gerada no gatilho do n8n e colá-la no campo
                                    ao lado.
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          <FormControl>
                            <Input
                              placeholder="https://seu-n8n-webhook.com/..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Cole aqui a URL do Webhook gerada pelo seu n8n para
                            receber as notificações.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
