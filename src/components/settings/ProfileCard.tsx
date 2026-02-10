import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
  Camera,
  User as UserIcon,
  Lock,
  Key,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { profileService, ProfileData } from "@/services/profile";

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  gemini_api_key: z.string().optional(),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export function ProfileCard({
  profile,
  onUpdate,
}: {
  profile: ProfileData;
  onUpdate: () => void;
}) {
  const { user, updatePassword } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile.avatar_url,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name || "",
      gemini_api_key: profile.gemini_api_key || "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024)
        return toast.error("A imagem deve ter no máximo 5MB");
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  async function onSubmit(data: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsSaving(true);
    try {
      let avatarUrl = undefined;
      if (avatarFile)
        avatarUrl = await profileService.uploadAvatar(user.id, avatarFile);

      await profileService.update(user.id, {
        name: data.name,
        gemini_api_key: data.gemini_api_key,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      });

      toast.success("Perfil atualizado com sucesso!");
      onUpdate();
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  }

  async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    const { error } = await updatePassword(data.password);
    if (error) toast.error(error.message);
    else {
      toast.success("Senha atualizada com sucesso!");
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-green-600" />
          <CardTitle>Perfil do Usuário</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="w-32 h-32 rounded-3xl border-4 border-white shadow-sm">
                <AvatarImage src={previewUrl || ""} className="object-cover" />
                <AvatarFallback className="text-4xl bg-green-50 text-green-600 rounded-3xl">
                  {profile.name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 text-white shadow-md border-2 border-white hover:bg-green-600 transition-colors">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-green-600 hover:text-green-700 uppercase tracking-wide"
            >
              Alterar Foto
            </button>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Nome Completo
                        </FormLabel>
                        <FormControl>
                          <Input className="bg-gray-50/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      E-mail (Não alterável)
                    </FormLabel>
                    <div className="relative">
                      <Input
                        value={profile.email || ""}
                        disabled
                        className="bg-gray-100 pr-10 text-muted-foreground"
                      />
                      <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="gemini_api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          Gemini API Key
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Google AI
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            className="bg-gray-50/50"
                            placeholder="AIza..."
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          Usada para gerar mensagens personalizadas com Google
                          Gemini 2.5 Flash. Suas chaves são criptografadas e
                          seguras.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border rounded-xl p-4 bg-gray-50/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-gray-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Senha</p>
                      <p className="text-xs text-muted-foreground">
                        Última alteração há 3 meses
                      </p>
                    </div>
                  </div>
                  <Dialog
                    open={isPasswordDialogOpen}
                    onOpenChange={setIsPasswordDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white">
                        Alterar Senha
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>
                          Digite sua nova senha abaixo.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...passwordForm}>
                        <form
                          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                          className="space-y-4 py-2"
                        >
                          <FormField
                            control={passwordForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nova Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirmar Senha</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                          >
                            Salvar Senha
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-green-500 hover:bg-green-600 text-white min-w-[150px]"
                  >
                    {isSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
