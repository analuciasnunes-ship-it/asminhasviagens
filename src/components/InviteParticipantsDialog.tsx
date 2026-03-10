import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Link2, Mail, Check, Copy, UserRoundPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Participant } from "@/types/trip";

interface Props {
  tripId: string;
  inviteToken?: string;
  tripName: string;
  onAddParticipant: (name: string, email: string) => Promise<void>;
}

export function InviteParticipantsDialog({ tripId, inviteToken, tripName, onAddParticipant }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [addingManual, setAddingManual] = useState(false);

  const inviteUrl = inviteToken
    ? `${window.location.origin}/join/${inviteToken}`
    : "";

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: "Link copiado!", description: "O link de convite foi copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setSending(true);
    
    const subject = encodeURIComponent(`Convite para viagem: ${tripName}`);
    const body = encodeURIComponent(
      `Olá!\n\nFoste convidado para a viagem "${tripName}".\n\nClica no link para aceitar o convite:\n${inviteUrl}\n\nAté já!`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    
    toast({ title: "Email preparado", description: "O teu cliente de email foi aberto com o convite." });
    setSending(false);
    setEmail("");
  };

  const handleAddManual = async () => {
    if (!manualName.trim()) return;
    setAddingManual(true);
    await onAddParticipant(manualName.trim(), manualEmail.trim());
    setManualName("");
    setManualEmail("");
    setAddingManual(false);
    toast({ title: "Participante adicionado", description: `${manualName.trim()} foi adicionado à viagem.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserPlus size={14} />
          Convidar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar participantes</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Copy link section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Link2 size={14} className="text-muted-foreground" />
              Link de convite
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteUrl}
                className="text-sm font-mono text-muted-foreground"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 gap-1.5"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Qualquer pessoa com este link pode entrar na viagem após criar conta ou iniciar sessão.
            </p>
          </div>

          {/* Send email section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Mail size={14} className="text-muted-foreground" />
              Enviar por email
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendEmail()}
                className="text-sm"
              />
              <Button
                variant="default"
                size="sm"
                onClick={handleSendEmail}
                disabled={!email.trim() || sending}
                className="shrink-0 gap-1.5"
              >
                <Mail size={14} />
                Enviar
              </Button>
            </div>
          </div>

          {/* Add manually section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <UserRoundPlus size={14} className="text-muted-foreground" />
              Adicionar manualmente
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Email (opcional)"
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddManual}
                disabled={!manualName.trim() || addingManual}
                className="shrink-0"
              >
                +
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Adiciona alguém sem conta. Pode ser vinculado mais tarde.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
