import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UtensilsCrossed, ChevronDown, ChevronUp } from "lucide-react";
import { Meal, Participant, ExpensePayment } from "@/types/trip";
import { ExpensePaymentsList } from "./ExpensePaymentsList";
import { ExpenseSplitFields } from "./ExpenseSplitFields";

const MEAL_TYPES = ["Pequeno-almoço", "Almoço", "Lanche", "Jantar", "Snack"];

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
  const [mealName, setMealName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [notes, setNotes] = useState("");
  const [showExpense, setShowExpense] = useState(false);
  const [totalBill, setTotalBill] = useState("");
  const [paidBy, setPaidBy] = useState(participants[0]?.id || "");
  const [sharedBy, setSharedBy] = useState<string[]>(participants.map((p) => p.id));
  const [expensePayments, setExpensePayments] = useState<ExpensePayment[]>([]);

  useEffect(() => {
    if (open && editMeal) {
      setTime(editMeal.time);
      setMealName(editMeal.mealName || "");
      setRestaurantName(editMeal.restaurantName || "");
      setNotes(editMeal.notes || "");
      const hasExpense = (editMeal.totalBill ?? 0) > 0;
      setShowExpense(hasExpense);
      setTotalBill(hasExpense ? editMeal.totalBill!.toString() : "");
      setPaidBy(editMeal.paidBy || participants[0]?.id || "");
      setSharedBy(editMeal.sharedBy?.length ? editMeal.sharedBy : participants.map((p) => p.id));
      setExpensePayments(editMeal.expensePayments || []);
    } else if (open && !editMeal) {
      setTime("");
      setMealName("");
      setRestaurantName("");
      setNotes("");
      setShowExpense(false);
      setTotalBill("");
      setPaidBy(participants[0]?.id || "");
      setSharedBy(participants.map((p) => p.id));
      setExpensePayments([]);
    }
  }, [open, editMeal]);

  const handleSubmit = () => {
    if (!mealName || !time) return;

    const billNum = totalBill ? parseFloat(totalBill) : 0;
    // If expense is shown and amount > 0, require paidBy and sharedBy
    if (showExpense && billNum > 0 && (!paidBy || sharedBy.length === 0)) return;

    onAdd({
      id: editMeal?.id || crypto.randomUUID(),
      type: "meal",
      time: time,
      mealName,
      restaurantName: restaurantName || undefined,
      notes: notes || undefined,
      rating: editMeal?.rating,
      totalBill: billNum > 0 ? billNum : undefined,
      paidBy: billNum > 0 ? paidBy : undefined,
      sharedBy: billNum > 0 ? sharedBy : undefined,
      expensePayments: expensePayments.length > 0 ? expensePayments : undefined,
    });
    setOpen(false);
  };

  // toggleShared handled by ExpenseSplitFields

  const billNum = totalBill ? parseFloat(totalBill) : 0;
  const perPerson = billNum > 0 && sharedBy.length > 0 ? billNum / sharedBy.length : 0;
  const isEdit = !!editMeal;
  const canSubmit = mealName && time && (!showExpense || billNum === 0 || (paidBy && sharedBy.length > 0));

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
          {/* Required: Meal name */}
          <div className="space-y-2">
            <Label>Tipo de refeição *</Label>
            <div className="flex flex-wrap gap-1.5">
              {MEAL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMealName(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    mealName === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <Input
              placeholder="Ou escreve um nome..."
              value={!MEAL_TYPES.includes(mealName) ? mealName : ""}
              onChange={(e) => setMealName(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Required: Time */}
          <div className="space-y-2">
            <Label>Hora *</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          {/* Optional: Restaurant */}
          <div className="space-y-2">
            <Label>Restaurante / local (opcional)</Label>
            <Input placeholder="Nome do restaurante" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
          </div>

          {/* Optional: Notes */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea placeholder="Notas..." value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none min-h-[60px]" />
          </div>

          {/* Expense section - collapsible */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExpense(!showExpense)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary/50"
            >
              <span>💰 Adicionar despesa</span>
              {showExpense ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showExpense && (
              <div className="p-3 space-y-4 border-t border-border">
                <div className="space-y-2">
                  <Label>Total €</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={totalBill} onChange={(e) => setTotalBill(e.target.value)} />
                </div>

                {billNum > 0 && (
                  <>
                    <ExpenseSplitFields
                      participants={participants}
                      paidBy={paidBy}
                      sharedBy={sharedBy}
                      onPaidByChange={setPaidBy}
                      onSharedByChange={setSharedBy}
                      totalAmount={billNum}
                      required
                    />

                    {/* Payments section */}
                    <div className="space-y-2">
                      <Label>Pagamentos (opcional)</Label>
                      <ExpensePaymentsList
                        totalAmount={billNum}
                        payments={expensePayments}
                        participants={participants}
                        onChange={setExpensePayments}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!canSubmit}>
            {isEdit ? "Guardar" : "Adicionar Refeição"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
