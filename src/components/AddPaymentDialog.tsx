import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { Payment, Participant } from "@/types/trip";

interface Props {
  participants: Participant[];
  onAdd: (payment: Payment) => void;
  editPayment?: Payment;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddPaymentDialog({ participants, onAdd, editPayment, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [from, setFrom] = useState(participants[0]?.id || "");
  const [to, setTo] = useState(participants[1]?.id || "");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open && editPayment) {
      setFrom(editPayment.from);
      setTo(editPayment.to);
      setAmount(editPayment.amount.toString());
    } else if (open && !editPayment) {
      setFrom(participants[0]?.id || "");
      setTo(participants[1]?.id || "");
      setAmount("");
    }
  }, [open, editPayment]);

  const handleSubmit = () => {
    if (!from || !to || from === to || !amount) return;
    onAdd({
      id: editPayment?.id || crypto.randomUUID(),
      from,
      to,
      amount: parseFloat(amount),
      date: editPayment?.date || new Date().toISOString().split("T")[0],
    });
    setOpen(false);
  };

  const isEdit = !!editPayment;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            + Registar pagamento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Pagamento" : "Registar Pagamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Quem pagou</Label>
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFrom(p.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    from === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ArrowRight size={16} />
          </div>

          <div className="space-y-2">
            <Label>A quem</Label>
            <div className="flex flex-wrap gap-1.5">
              {participants.filter((p) => p.id !== from).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTo(p.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    to === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Valor €</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!from || !to || from === to || !amount}>
            {isEdit ? "Guardar" : "Registar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
