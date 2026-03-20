import { Trip } from "@/types/trip";
import { Receipt, ChevronRight } from "lucide-react";
import { calculateTripTotals } from "@/lib/expenseUtils";
import { calculateTotalTripCost, countTripExpenseItems } from "@/lib/tripCostUtils";

interface Props {
  trip: Trip;
  onClick: () => void;
}

export function TripExpenseSummaryCard({ trip, onClick }: Props) {
  const totalCost = calculateTotalTripCost(trip);
  const { mealCount, totalItems } = countTripExpenseItems(trip);

  if (totalItems === 0 && totalCost === 0) return null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:bg-secondary/50 active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Receipt size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Despesas da viagem
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
              {mealCount > 0 && ` · ${mealCount} ${mealCount === 1 ? "refeição" : "refeições"}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">{totalCost.toFixed(2)}€</span>
            <ChevronRight size={16} className="text-muted-foreground/40" />
          </div>
          {(() => {
            const t = calculateTripTotals(trip);
            return t.pending > 0.01 ? (
              <p className="text-[11px] text-muted-foreground">
                <span className="text-success">{t.paid.toFixed(2)}€</span>
                {" • "}
                <span className="text-warning">{t.pending.toFixed(2)}€ pend.</span>
              </p>
            ) : null;
          })()}
        </div>
      </div>
    </button>
  );
}
