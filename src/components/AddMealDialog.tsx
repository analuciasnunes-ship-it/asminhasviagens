import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UtensilsCrossed } from "lucide-react";
import { Meal, Participant } from "@/types/trip";

interface Props {
  participants: Participant[];
  onAdd: (meal: Meal) => void;
  trigger?: React.ReactNode;
  editMeal?: Meal;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddMealDialog({ participants, onAdd, trigger, editMeal, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [time, setTime] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [notes, setNotes] = useState("");
  const [totalBill, setTotalBill] = useState("");
  const [paidBy, setPaidBy] = useState(participants[0]?.id || "");
  const [sharedBy, setSharedBy] = useState<string[]>(participants.map((p) => p.id));

  useEffect(() => {
    if (open && editMeal) {
      setTime(editMeal.time);
      setRestaurantName(editMeal.restaurantName);
      setNotes(editMeal.notes || "");
      setTotalBill(editMeal.totalBill.toString());
      setPaidBy(editMeal.paidBy);
      setSharedBy(editMeal.sharedBy);
    } else if (open && !editMeal) {
      setTime("");
      setRestaurantName("");
      setNotes("");
      setTotalBill("");
      setPaidBy(participants[0]?.id || "");
      setSharedBy(participants.map((p) => p.id));
    }
  }, [open, editMeal]);

  const handleSubmit = () => {
    if (!restaurantName || !totalBill || !paidBy || sharedBy.length === 0) return;
    onAdd({
      id: editMeal?.id || crypto.randomUUID(),
      type: "meal",
      time: time || "12:00",
      restaurantName,
      notes: notes || undefined,
      rating: editMeal?.rating,
      totalBill: parseFloat(totalBill),
      paidBy,
      sharedBy,
    });
    setOpen(false);
  };

  const toggleShared = (id: string) => {
    setSharedBy((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const perPerson = totalBill && sharedBy.length > 0 ? parseFloat(totalBill) / sharedBy.length : 0;
  const isEdit = !!editMeal;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          {trigger || (
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <UtensilsCrossed size={14} /> Refeição
            </button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed size={18} /> {isEdit ? "Editar Refeição" : "Nova Refeição"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Restaurante *</Label>
            <Input placeholder="Nome do restaurante" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Hora *</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Total €*</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={totalBill} onChange={(e) => setTotalBill(e.target.value)} />
            </div>
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
            <div className="flex items-center justify-between">
              <Label>Dividir entre</Label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSharedBy(participants.map((p) => p.id))} className="text-xs text-primary hover:underline">Todos</button>
                <button type="button" onClick={() => setSharedBy([])} className="text-xs text-muted-foreground hover:underline">Limpar</button>
              </div>
            </div>
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

          <Button onClick={handleSubmit} className="w-full" disabled={!restaurantName || !totalBill || !paidBy || sharedBy.length === 0}>
            {isEdit ? "Guardar" : "Adicionar Refeição"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
