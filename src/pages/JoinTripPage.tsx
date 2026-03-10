import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const JoinTripPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "error" | "auth_required">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus("auth_required");
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMsg("Link de convite inválido.");
      return;
    }

    const joinTrip = async () => {
      try {
        const { data, error } = await supabase.rpc("join_trip_by_token", {
          _invite_token: token,
        });

        if (error) throw error;

        const result = data as any;
        if (result?.error === "invalid_token") {
          setStatus("error");
          setErrorMsg("Este link de convite não é válido ou expirou.");
          return;
        }
        if (result?.error === "not_authenticated") {
          setStatus("auth_required");
          return;
        }
        if (result?.success) {
          if (result.already_member) {
            toast.info("Já és participante desta viagem.");
          } else {
            toast.success("Entraste na viagem com sucesso!");
          }
          navigate(`/trip/${result.trip_id}`, { replace: true });
        }
      } catch (err) {
        console.error("Error joining trip:", err);
        setStatus("error");
        setErrorMsg("Ocorreu um erro ao entrar na viagem.");
      }
    };

    joinTrip();
  }, [user, authLoading, token, navigate]);

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">A entrar na viagem...</p>
      </div>
    );
  }

  if (status === "auth_required") {
    const redirectPath = `/join/${token}`;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Convite para viagem</h1>
          <p className="text-muted-foreground max-w-sm">
            Para aceitar o convite, precisas de ter conta ou iniciar sessão.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`)}>
            Iniciar sessão
          </Button>
          <Button variant="outline" onClick={() => navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}&mode=signup`)}>
            Criar conta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Erro</h1>
        <p className="text-muted-foreground max-w-sm">{errorMsg}</p>
      </div>
      <Button variant="outline" onClick={() => navigate("/")}>
        Voltar ao início
      </Button>
    </div>
  );
};

export default JoinTripPage;
