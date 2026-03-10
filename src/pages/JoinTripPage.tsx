import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const JoinTripPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "already" | "error" | "auth_required">("loading");
  const [tripId, setTripId] = useState<string | null>(null);
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
          setTripId(result.trip_id);
          setStatus(result.already_member ? "already" : "success");
        }
      } catch (err) {
        console.error("Error joining trip:", err);
        setStatus("error");
        setErrorMsg("Ocorreu um erro ao entrar na viagem.");
      }
    };

    joinTrip();
  }, [user, authLoading, token]);

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">A entrar na viagem...</p>
      </div>
    );
  }

  if (status === "auth_required") {
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
          <Button onClick={() => navigate(`/auth?redirect=/join/${token}`)}>
            Iniciar sessão
          </Button>
          <Button variant="outline" onClick={() => navigate(`/auth?redirect=/join/${token}&mode=signup`)}>
            Criar conta
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
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
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          {status === "already" ? "Já estás nesta viagem!" : "Entraste na viagem!"}
        </h1>
        <p className="text-muted-foreground max-w-sm">
          {status === "already"
            ? "Já és participante desta viagem."
            : "Foste adicionado como participante."}
        </p>
      </div>
      {tripId && (
        <Button onClick={() => navigate(`/trip/${tripId}`)}>
          Ver viagem
        </Button>
      )}
    </div>
  );
};

export default JoinTripPage;
