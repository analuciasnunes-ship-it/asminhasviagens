import { Trip } from "@/types/trip";
import { calculateBalances, calculateSettlements } from "@/lib/expenseUtils";
import { AddPaymentDialog } from "./AddPaymentDialog";
import { ArrowRight, Wallet, Trash2 } from "lucide-react";

interface Props {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

export function BalanceSummary({ trip, onUpdate }: Props) {
  const participants = trip.participants || [];
  if (participants.length === 0) return null;

  const balances = calculateBalances(trip);
  const settlements = calculateSettlements(balances);
  const payments = trip.payments || [];
  const hasAnyExpense = balances.some((b) => b.totalPaid > 0 || b.totalOwed > 0);

  if (!hasAnyExpense && payments.length === 0) return null;

  const handleAddPayment = (payment: any) => {
    onUpdate({ ...trip, payments: [...(trip.payments || []), payment] });
  };

  const handleDeletePayment = (id: string) => {
    onUpdate({ ...trip, payments: (trip.payments || []).filter((p) => p.id !== id) });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Wallet size={16} /> Balanço de despesas
      </h3>

      {/* Per-person totals */}
      <div className="space-y-2">
        {balances.map((b) => (
          <div key={b.participantId} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
            <span className="text-sm font-medium text-foreground">{b.participantName}</span>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Pagou: {b.totalPaid.toFixed(2)}€</p>
              <p className={`text-xs font-semibold ${b.net > 0.01 ? "text-success" : b.net < -0.01 ? "text-destructive" : "text-muted-foreground"}`}>
                {b.net > 0.01 ? `Recebe ${b.net.toFixed(2)}€` : b.net < -0.01 ? `Deve ${(-b.net).toFixed(2)}€` : "Equilibrado"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Settlements */}
      {settlements.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Acertos sugeridos</h4>
          {settlements.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm">
              <span className="font-medium text-foreground">{s.fromName}</span>
              <ArrowRight size={14} className="text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground">{s.toName}</span>
              <span className="ml-auto font-semibold text-primary">{s.amount.toFixed(2)}€</span>
            </div>
          ))}
        </div>
      )}

      {/* Recorded payments */}
      {payments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Pagamentos registados</h4>
          {payments.map((p) => {
            const fromName = participants.find((x) => x.id === p.from)?.name || "?";
            const toName = participants.find((x) => x.id === p.to)?.name || "?";
            return (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-sm">
                <span className="text-foreground">{fromName}</span>
                <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                <span className="text-foreground">{toName}</span>
                <span className="ml-auto font-medium text-success">{p.amount.toFixed(2)}€</span>
                <button onClick={() => handleDeletePayment(p.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors ml-1">
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddPaymentDialog participants={participants} onAdd={handleAddPayment} />
    </div>
  );
}
