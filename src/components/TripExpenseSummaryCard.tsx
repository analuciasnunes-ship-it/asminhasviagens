import { Trip } from "@/types/trip";
import { Receipt, ChevronRight } from "lucide-react";

interface Props {
  trip: Trip;
  onClick: () => void;
}

export function TripExpenseSummaryCard({ trip, onClick }: Props) {
  // Day-level costs
  const dayCost = trip.days.reduce((sum, day) => {
    const mealCost = (day.meals || []).reduce((s, m) => s + m.totalBill, 0);
    const expCost = (day.expenses || []).reduce((s, e) => s + e.amount, 0);
    const actCost = (day.activities || []).reduce((s, a) => s + (a.cost || 0), 0);
    return sum + mealCost + expCost + actCost;
  }, 0);

  // Detail-level costs (flights, accommodation, cars, other) at trip and day level
  const detailItems = [
    ...(trip.flights || []),
    ...(trip.accommodations || []),
    ...(trip.rentalCars || []),
    ...(trip.otherDetails || []),
    ...trip.days.flatMap((d) => [...(d.flights || []), ...(d.accommodations || []), ...(d.rentalCars || []), ...(d.otherDetails || [])]),
  ];
  const detailCost = detailItems.reduce((s, item) => s + (item.price || 0), 0);
  const totalCost = dayCost + detailCost;

  const mealCount = trip.days.reduce((s, d) => s + (d.meals || []).length, 0);
  const expenseCount = trip.days.reduce((s, d) => s + (d.expenses || []).length, 0);
  const totalItems = mealCount + expenseCount + detailItems.filter((d) => d.price).length;

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
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">{totalCost.toFixed(2)}€</span>
          <ChevronRight size={16} className="text-muted-foreground/40" />
        </div>
      </div>
    </button>
  );
}
