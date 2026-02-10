import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { profileService, ProfileData } from "@/services/profile";
import { Navigate } from "react-router-dom";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { WhatsAppConnection } from "@/components/settings/WhatsAppConnection";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const data = await profileService.get(user.id);
      setProfile(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  if (authLoading || (loading && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-fade-in-up space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie seu perfil e conexões de mensagens.
        </p>
      </div>

      {profile && (
        <>
          <ProfileCard profile={profile} onUpdate={loadProfile} />
          <WhatsAppConnection profile={profile} />
        </>
      )}
    </div>
  );
}
