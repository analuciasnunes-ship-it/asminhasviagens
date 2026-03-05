import { useParams, useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import { BalanceSummary } from "@/components/BalanceSummary";
import { MealCard } from "@/components/MealCard";
import { ExpenseCard } from "@/components/ExpenseCard";
import { ArrowLeft, UtensilsCrossed, ShoppingCart, Receipt } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Meal, Expense } from "@/types/trip";

const TripExpensesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrip, updateTrip } = useTrips();
  const trip = getTrip(id!);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Viagem não encontrada.</p>
      </div>
    );
  }

  const participants = trip.participants || [];

  // Collect all meals and expenses across days
  const allMeals: { meal: Meal; dayLabel: string; dayId: string }[] = [];
  const allSupermarket: { expense: Expense; dayLabel: string; dayId: string }[] = [];
  const allOther: { expense: Expense; dayLabel: string; dayId: string }[] = [];

  trip.days.forEach((day) => {
    const label = `Dia ${day.dayNumber}`;
    (day.meals || []).forEach((meal) => allMeals.push({ meal, dayLabel: label, dayId: day.id }));
    (day.expenses || []).forEach((exp) => {
      if (exp.type === "supermarket") allSupermarket.push({ expense: exp, dayLabel: label, dayId: day.id });
      else allOther.push({ expense: exp, dayLabel: label, dayId: day.id });
    });
  });

  const totalMeals = allMeals.reduce((s, m) => s + m.meal.totalBill, 0);
  const totalSupermarket = allSupermarket.reduce((s, e) => s + e.expense.amount, 0);
  const totalOther = allOther.reduce((s, e) => s + e.expense.amount, 0);
  const grandTotal = totalMeals + totalSupermarket + totalOther;

  const handleDeleteMeal = (mealId: string) => {
    updateTrip({
      ...trip,
      days: trip.days.map((d) => ({
        ...d,
        meals: (d.meals || []).filter((m) => m.id !== mealId),
      })),
    });
  };

  const handleUpdateMeal = (updated: Meal) => {
    updateTrip({
      ...trip,
      days: trip.days.map((d) => ({
        ...d,
        meals: (d.meals || []).map((m) => (m.id === updated.id ? updated : m)),
      })),
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    updateTrip({
      ...trip,
      days: trip.days.map((d) => ({
        ...d,
        expenses: (d.expenses || []).filter((e) => e.id !== expenseId),
      })),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/trip/${id}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Despesas da viagem</h1>
          <p className="text-sm text-muted-foreground mt-1">{trip.destination}</p>
          {grandTotal > 0 && (
            <div className="mt-3 inline-flex items-center bg-secondary px-3 py-1.5 rounded-full">
              <span className="text-sm font-semibold text-foreground">
                Total: {grandTotal.toFixed(2)}€
              </span>
            </div>
          )}
        </header>

        {/* Meals */}
        {allMeals.length > 0 && (
          <section className="mb-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <UtensilsCrossed size={14} /> Refeições
              </h3>
              <span className="text-xs font-medium text-muted-foreground">{totalMeals.toFixed(2)}€</span>
            </div>
            {allMeals.map(({ meal, dayLabel }) => (
              <div key={meal.id}>
                <span className="text-[11px] text-muted-foreground/50 font-medium">{dayLabel} · {meal.time}</span>
                <MealCard meal={meal} participants={participants} onDelete={handleDeleteMeal} onUpdate={handleUpdateMeal} />
              </div>
            ))}
          </section>
        )}

        {/* Supermarket */}
        {allSupermarket.length > 0 && (
          <section className="mb-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart size={14} /> Supermercado
              </h3>
              <span className="text-xs font-medium text-muted-foreground">{totalSupermarket.toFixed(2)}€</span>
            </div>
            {allSupermarket.map(({ expense, dayLabel }) => (
              <div key={expense.id}>
                <span className="text-[11px] text-muted-foreground/50 font-medium">{dayLabel}</span>
                <ExpenseCard expense={expense} participants={participants} onDelete={handleDeleteExpense} />
              </div>
            ))}
          </section>
        )}

        {/* Other expenses */}
        {allOther.length > 0 && (
          <section className="mb-8 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={14} /> Outras despesas
              </h3>
              <span className="text-xs font-medium text-muted-foreground">{totalOther.toFixed(2)}€</span>
            </div>
            {allOther.map(({ expense, dayLabel }) => (
              <div key={expense.id}>
                <span className="text-[11px] text-muted-foreground/50 font-medium">{dayLabel}</span>
                <ExpenseCard expense={expense} participants={participants} onDelete={handleDeleteExpense} />
              </div>
            ))}
          </section>
        )}

        {/* Balance summary */}
        {participants.length > 0 && (
          <BalanceSummary trip={trip} onUpdate={updateTrip} />
        )}
      </div>
    </div>
  );
};

export default TripExpensesPage;
