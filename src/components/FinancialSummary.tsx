import { Trip } from "@/types/trip";
import { calculateBalances, calculateSettlements, calculateTripTotals } from "@/lib/expenseUtils";
import { useMemo } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  trip: Trip;
}

export function FinancialSummary({ trip }: Props) {
  const totals = calculateTripTotals(trip);
  const balances = calculateBalances(trip);
  const settlements = calculateSettlements(balances);

  if (totals.total === 0 && balances.length === 0) return null;

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
          <h3 className="text-sm font-semibold text-muted-foreground">Acertos sugeridos</h3>
          {settlements.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
            >
              <span className="font-medium text-foreground">{s.fromName}</span>
              <ArrowRight size={14} className="text-primary shrink-0" />
              <span className="font-medium text-foreground">{s.toName}</span>
              <span className="ml-auto font-bold text-primary">{s.amount.toFixed(2)}€</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
