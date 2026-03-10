import { Trip, Payment } from "@/types/trip";
import { calculateBalances, calculateSettlements, calculateTripTotals, Settlement } from "@/lib/expenseUtils";
import { useMemo } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus, Check } from "lucide-react";

interface Props {
  trip: Trip;
  onSettlementComplete?: (payment: Payment) => void;
}

function isSettlementDone(settlement: Settlement, payments: Payment[]): boolean {
  return payments.some(
    (p) =>
      p.from === settlement.from &&
      p.to === settlement.to &&
      Math.abs(p.amount - settlement.amount) < 0.01
  );
}

export function FinancialSummary({ trip, onSettlementComplete }: Props) {
  const totals = calculateTripTotals(trip);
  const balances = calculateBalances(trip);
  const settlements = calculateSettlements(balances);
  const payments = trip.payments || [];

  if (totals.total === 0 && balances.length === 0) return null;

  const handleMarkDone = (s: Settlement) => {
    if (!onSettlementComplete) return;
    const payment: Payment = {
      id: crypto.randomUUID(),
      from: s.from,
      to: s.to,
      amount: s.amount,
      date: new Date().toISOString().split("T")[0],
    };
    onSettlementComplete(payment);
  };

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-lg font-bold text-foreground">Resumo financeiro da viagem</h2>

      {/* Grand total */}
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total gasto</p>
        <p className="text-3xl font-bold text-foreground">{totals.total.toFixed(2)}€</p>
        {balances.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {(totals.total / balances.length).toFixed(2)}€ por pessoa
          </p>
        )}
      </div>

      {/* Per-participant paid */}
      {balances.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Pagamentos por participante</h3>
          {balances.map((b) => (
            <div
              key={b.participantId}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    b.net > 0.01
                      ? "bg-success/15 text-success"
                      : b.net < -0.01
                      ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {b.net > 0.01 ? (
                    <TrendingUp size={14} />
                  ) : b.net < -0.01 ? (
                    <TrendingDown size={14} />
                  ) : (
                    <Minus size={14} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{b.participantName}</p>
                  <p className="text-xs text-muted-foreground">Pagou: {b.totalPaid.toFixed(2)}€</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-bold ${
                    b.net > 0.01
                      ? "text-success"
                      : b.net < -0.01
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {b.net > 0.01
                    ? `Recebe ${b.net.toFixed(2)}€`
                    : b.net < -0.01
                    ? `Deve ${(-b.net).toFixed(2)}€`
                    : "Equilibrado"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Minimized settlements */}
      {settlements.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Liquidação recomendada</h3>
          <p className="text-xs text-muted-foreground">
            Mínimo de {settlements.length} {settlements.length === 1 ? "pagamento" : "pagamentos"} para liquidar todas as dívidas
          </p>
          {settlements.map((s, i) => {
            const done = isSettlementDone(s, payments);
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all ${
                  done
                    ? "border-success/30 bg-success/5"
                    : "border-primary/20 bg-primary/5"
                }`}
              >
                {done && (
                  <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-success" />
                  </div>
                )}
                <span className={`font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {s.fromName}
                </span>
                <ArrowRight size={14} className={`shrink-0 ${done ? "text-muted-foreground" : "text-primary"}`} />
                <span className={`font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {s.toName}
                </span>
                <span className={`ml-auto font-bold ${done ? "text-success" : "text-primary"}`}>
                  {s.amount.toFixed(2)}€
                </span>
                {!done && onSettlementComplete && (
                  <button
                    onClick={() => handleMarkDone(s)}
                    className="ml-2 px-2.5 py-1 rounded-full text-[11px] font-medium border border-success/30 bg-success/10 text-success hover:bg-success/20 transition-colors"
                  >
                    <Check size={10} className="inline mr-0.5" /> Feito
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
