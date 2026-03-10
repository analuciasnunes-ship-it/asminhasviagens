import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Link2, Check, Copy, Share2, MessageCircle, Mail, Send, UserRoundPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  tripId: string;
  inviteToken?: string;
  tripName: string;
  onAddParticipant: (name: string, email: string) => Promise<void>;
}

export function InviteParticipantsDialog({ tripId, inviteToken, tripName, onAddParticipant }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [addingManual, setAddingManual] = useState(false);

  const inviteUrl = inviteToken
    ? `${window.location.origin}/join/${inviteToken}`
    : "";

  const inviteMessage = `Olá! Foste convidado para a viagem "${tripName}". Entra aqui: ${inviteUrl}`;

  const handleCopyLink = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: "Link copiado!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Convite: ${tripName}`, text: inviteMessage, url: inviteUrl });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Convite para viagem: ${tripName}`);
    const body = encodeURIComponent(inviteMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleMessenger = () => {
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(inviteUrl)}&app_id=&redirect_uri=${encodeURIComponent(window.location.href)}`, "_blank");
  };

  const handleAddManual = async () => {
    if (!manualName.trim()) return;
    setAddingManual(true);
    await onAddParticipant(manualName.trim(), manualEmail.trim());
    toast({ title: "Participante adicionado", description: `${manualName.trim()} foi adicionado à viagem.` });
    setManualName("");
    setManualEmail("");
    setAddingManual(false);
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
          <DialogDescription>Partilha o link de convite para adicionar pessoas à viagem.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Invite link */}
          <div className="space-y-3">
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
                variant={copied ? "default" : "outline"}
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 gap-1.5"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>

            {/* Share buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleWhatsApp}>
                <MessageCircle size={14} />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleEmail}>
                <Mail size={14} />
                Email
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleShare}>
                <Share2 size={14} />
                Partilhar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Qualquer pessoa com este link pode entrar na viagem após criar conta ou iniciar sessão.
            </p>
          </div>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Add manually */}
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
                <UserPlus size={14} />
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
