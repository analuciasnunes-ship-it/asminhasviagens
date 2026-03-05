import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Receipt } from "lucide-react";
import { Expense, Participant } from "@/types/trip";

interface Props {
  participants: Participant[];
  expenseType: "supermarket" | "other";
  onAdd: (expense: Expense) => void;
  trigger?: React.ReactNode;
  editExpense?: Expense;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddExpenseDialog({ participants, expenseType, onAdd, trigger, editExpense, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const isSupermarket = expenseType === "supermarket";
  const Icon = isSupermarket ? ShoppingCart : Receipt;
  const label = isSupermarket ? "Supermercado" : "Outra Despesa";

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paidBy, setPaidBy] = useState(participants[0]?.id || "");
  const [sharedBy, setSharedBy] = useState<string[]>(participants.map((p) => p.id));

  useEffect(() => {
    if (open && editExpense) {
      setDescription(editExpense.description);
      setAmount(editExpense.amount.toString());
      setNotes(editExpense.notes || "");
      setPaidBy(editExpense.paidBy);
      setSharedBy(editExpense.sharedBy);
    } else if (open && !editExpense) {
      setDescription("");
      setAmount("");
      setNotes("");
      setPaidBy(participants[0]?.id || "");
      setSharedBy(participants.map((p) => p.id));
    }
  }, [open, editExpense]);

  const handleSubmit = () => {
    if (!description || !amount || !paidBy || sharedBy.length === 0) return;
    onAdd({
      id: editExpense?.id || crypto.randomUUID(),
      type: expenseType,
      description,
      amount: parseFloat(amount),
      paidBy,
      sharedBy,
      notes: notes || undefined,
    });
    setOpen(false);
  };

  const toggleShared = (id: string) => {
    setSharedBy((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const perPerson = amount && sharedBy.length > 0 ? parseFloat(amount) / sharedBy.length : 0;
  const isEdit = !!editExpense;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          {trigger || (
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Icon size={14} /> {label}
            </button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon size={18} /> {isEdit ? `Editar ${label}` : label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input placeholder="Ex: Compras para o jantar" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor € *</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Quem pagou *</Label>
            <div className="flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaidBy(p.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    paidBy === p.id
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
            <Label>Dividir entre</Label>
            <div className="space-y-1.5">
              {participants.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={sharedBy.includes(p.id)}
                    onCheckedChange={() => toggleShared(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
            {perPerson > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {perPerson.toFixed(2)}€ por pessoa
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea placeholder="Notas..." value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none min-h-[60px]" />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!description || !amount || !paidBy || sharedBy.length === 0}>
            {isEdit ? "Guardar" : "Adicionar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
