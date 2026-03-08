import { useState } from "react";
import { ExpensePayment, Participant } from "@/types/trip";
import { getPaymentStatus } from "@/lib/expenseUtils";
import { Plus, Check, Clock, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  totalAmount: number;
  payments: ExpensePayment[];
  participants: Participant[];
  onChange: (payments: ExpensePayment[]) => void;
}

export function ExpensePaymentsList({ totalAmount, payments, participants, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(participants[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"paid" | "pending">("paid");

  const { paid, remaining, hasPlan } = getPaymentStatus(totalAmount, payments);

  const handleAdd = () => {
    if (!amount || !paidBy) return;
    const newPayment: ExpensePayment = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      paidBy,
      date,
      status,
    };
    onChange([...payments, newPayment]);
    setAmount("");
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    onChange(payments.filter((p) => p.id !== id));
  };

  const toggleStatus = (id: string) => {
    onChange(
      payments.map((p) =>
        p.id === id ? { ...p, status: p.status === "paid" ? "pending" : "paid" } : p
      )
    );
  };

  const formatDate = (d: string) => {
    try {
      const parts = d.split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-2">
      {/* Payment status bar */}
      {hasPlan && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {paid.toFixed(2)}€ pago
              {remaining > 0.01 && (
                <> · <span className="text-warning">{remaining.toFixed(2)}€ pendente</span></>
              )}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: `${Math.min((paid / totalAmount) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Payment list */}
      {payments.length > 0 && (
        <div className="space-y-1">
          {payments.map((p) => {
            const payerName = participants.find((x) => x.id === p.paidBy)?.name || "?";
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                  p.status === "paid"
                    ? "bg-success/5 border border-success/20"
                    : "bg-warning/5 border border-warning/20"
                }`}
              >
                <button onClick={() => toggleStatus(p.id)} className="shrink-0">
                  {p.status === "paid" ? (
                    <Check size={12} className="text-success" />
                  ) : (
                    <Clock size={12} className="text-warning" />
                  )}
                </button>
                <span className="text-foreground font-medium">{p.amount.toFixed(2)}€</span>
                <span className="text-muted-foreground">por {payerName}</span>
                <span className="text-muted-foreground">({formatDate(p.date)})</span>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="ml-auto text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add payment form */}
      {showForm ? (
        <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Valor €</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Quem pagou</Label>
            <div className="flex flex-wrap gap-1">
              {participants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaidBy(p.id)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
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
          <div className="space-y-1">
            <Label className="text-[11px]">Estado</Label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setStatus("paid")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                  status === "paid"
                    ? "bg-success/10 text-success border-success/30"
                    : "bg-secondary text-muted-foreground border-border"
                }`}
              >
                <Check size={10} className="inline mr-0.5" /> Pago
              </button>
              <button
                type="button"
                onClick={() => setStatus("pending")}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                  status === "pending"
                    ? "bg-warning/10 text-warning border-warning/30"
                    : "bg-secondary text-muted-foreground border-border"
                }`}
              >
                <Clock size={10} className="inline mr-0.5" /> Pendente
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm" className="h-7 text-xs flex-1" disabled={!amount || !paidBy}>
              Adicionar
            </Button>
            <Button onClick={() => setShowForm(false)} size="sm" variant="ghost" className="h-7 text-xs">
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus size={11} /> Adicionar pagamento
        </button>
      )}
    </div>
  );
}

/** Compact inline status display */
export function PaymentStatusBadge({
  totalAmount,
  payments,
}: {
  totalAmount: number;
  payments?: ExpensePayment[];
}) {
  const { paid, remaining, hasPlan } = getPaymentStatus(totalAmount, payments);
  if (!hasPlan) return null;
  return (
    <span className="text-[11px]">
      <span className="text-success">{paid.toFixed(2)}€ pago</span>
      {remaining > 0.01 && (
        <> · <span className="text-warning">{remaining.toFixed(2)}€ pendente</span></>
      )}
    </span>
  );
}
