import { useParams, useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import { AddDayItemMenu } from "@/components/AddDayItemMenu";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { TripDetails } from "@/components/TripDetails";

import { ExpenseCard } from "@/components/ExpenseCard";
import { Activity, Flight, Accommodation, RentalCar, OtherDetail, Meal, Expense, DURATION_OPTIONS } from "@/types/trip";
import { ArrowLeft, ShoppingCart, Receipt } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const DayPage = () => {
  const { id, dayId } = useParams<{ id: string; dayId: string }>();
  const navigate = useNavigate();
  const { getTrip, updateTrip } = useTrips();
  const trip = getTrip(id!);
  const day = trip?.days.find((d) => d.id === dayId);

  if (!trip || !day) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Dia não encontrado.</p>
      </div>
    );
  }

  const participants = trip.participants || [];
  const dateLabel = format(new Date(day.date), "EEEE, d 'de' MMMM", { locale: pt });
  const activityCost = day.activities.reduce((s, a) => s + (a.cost || 0), 0);
  const mealCost = (day.meals || []).reduce((s, m) => s + m.totalBill, 0);
  const expenseCost = (day.expenses || []).reduce((s, e) => s + e.amount, 0);
  const dayCost = activityCost + mealCost + expenseCost;

  const updateDay = (patch: Partial<typeof day>) => {
    updateTrip({
      ...trip,
      days: trip.days.map((d) => (d.id === day.id ? { ...d, ...patch } : d)),
    });
  };

  const handleAddActivity = (activity: Activity) => updateDay({ activities: [...day.activities, activity] });
  const handleUpdateActivity = (updated: Activity) => updateDay({ activities: day.activities.map((a) => (a.id === updated.id ? updated : a)) });
  const handleDeleteActivity = (activityId: string) => updateDay({ activities: day.activities.filter((a) => a.id !== activityId) });

  // Meals
  const dayMeals = day.meals || [];
  const handleAddMeal = (meal: Meal) => updateDay({ meals: [...dayMeals, meal] });
  const handleUpdateMeal = (meal: Meal) => updateDay({ meals: dayMeals.map((m) => (m.id === meal.id ? meal : m)) });
  const handleDeleteMeal = (mealId: string) => updateDay({ meals: dayMeals.filter((m) => m.id !== mealId) });

  // Expenses
  const dayExpenses = day.expenses || [];
  const handleAddExpense = (expense: Expense) => updateDay({ expenses: [...dayExpenses, expense] });
  const handleUpdateExpense = (expense: Expense) => updateDay({ expenses: dayExpenses.map((e) => (e.id === expense.id ? expense : e)) });
  const handleDeleteExpense = (expenseId: string) => updateDay({ expenses: dayExpenses.filter((e) => e.id !== expenseId) });

  // Day-level detail handlers
  const dayFlights = day.flights || [];
  const dayAccommodations = day.accommodations || [];
  const dayRentalCars = day.rentalCars || [];
  const dayOtherDetails = day.otherDetails || [];

  const handleAddFlight = (f: Flight) => updateDay({ flights: [...dayFlights, f] });
  const handleAddAccommodation = (a: Accommodation) => updateDay({ accommodations: [...dayAccommodations, a] });
  const handleAddCar = (c: RentalCar) => updateDay({ rentalCars: [...dayRentalCars, c] });
  const handleAddOther = (o: OtherDetail) => updateDay({ otherDetails: [...dayOtherDetails, o] });
  const handleRemoveFlight = (fid: string) => updateDay({ flights: dayFlights.filter((x) => x.id !== fid) });
  const handleRemoveAccommodation = (aid: string) => updateDay({ accommodations: dayAccommodations.filter((x) => x.id !== aid) });
  const handleRemoveCar = (cid: string) => updateDay({ rentalCars: dayRentalCars.filter((x) => x.id !== cid) });
  const handleRemoveOther = (oid: string) => updateDay({ otherDetails: dayOtherDetails.filter((x) => x.id !== oid) });

  const supermarketExpenses = dayExpenses.filter((e) => e.type === "supermarket");
  const otherExpenses = dayExpenses.filter((e) => e.type === "other");

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
          <h1 className="text-2xl font-bold text-foreground">
            Dia {day.dayNumber}{day.title ? ` – ${day.title}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{dateLabel}</p>
          {(() => {
            const itemCount = day.activities.length + (day.meals || []).length;
            const totalDurationMin = day.activities.reduce((sum, a) => {
              if (!a.estimatedDuration) return sum;
              const opt = DURATION_OPTIONS.find((o) => o.label === a.estimatedDuration);
              return sum + (opt?.minutes || 0);
            }, 0);
            const durationH = Math.floor(totalDurationMin / 60);
            const durationM = totalDurationMin % 60;
            const durationLabel = durationM > 0
              ? (durationH > 0 ? `${durationH}h${durationM.toString().padStart(2, "0")}` : `${durationM}m`)
              : (durationH > 0 ? `${durationH}h` : "");
            const parts: string[] = [];
            if (dayCost > 0) parts.push(`${dayCost.toFixed(0)}€`);
            if (itemCount > 0) parts.push(`${itemCount} ${itemCount === 1 ? "atividade" : "atividades"}`);
            if (durationLabel) parts.push(durationLabel);
            if (parts.length === 0) return null;
            return (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-full">
                <span className="text-sm font-semibold text-foreground">
                  {parts.join(" · ")}
                </span>
              </div>
            );
          })()}
        </header>

        <TripDetails
          flights={dayFlights}
          accommodations={dayAccommodations}
          rentalCars={dayRentalCars}
          otherDetails={dayOtherDetails}
          participants={participants}
          onAddFlight={handleAddFlight}
          onAddAccommodation={handleAddAccommodation}
          onAddCar={handleAddCar}
          onAddOther={handleAddOther}
          onRemoveFlight={handleRemoveFlight}
          onRemoveAccommodation={handleRemoveAccommodation}
          onRemoveCar={handleRemoveCar}
          onRemoveOther={handleRemoveOther}
          compact
        />

        {/* Activity Timeline */}
        <ActivityTimeline
          activities={day.activities}
          meals={dayMeals}
          participants={participants}
          onUpdate={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          onReorder={(reordered) => updateDay({ activities: reordered })}
          onUpdateMeal={handleUpdateMeal}
          onDeleteMeal={handleDeleteMeal}
        />

        {/* Add item menu */}
        <div className="pl-9 mt-2">
          <AddDayItemMenu
            participants={participants}
            onAddActivity={handleAddActivity}
            onAddMeal={handleAddMeal}
            onAddExpense={handleAddExpense}
          />
        </div>

        {/* Expenses section (after timeline) */}
        {(supermarketExpenses.length > 0 || otherExpenses.length > 0) && (
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Despesas do dia
            </h3>
            {supermarketExpenses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <ShoppingCart size={12} /> Supermercado
                </h4>
                {supermarketExpenses.map((exp) => (
                  <ExpenseCard key={exp.id} expense={exp} participants={participants} onDelete={handleDeleteExpense} onUpdate={handleUpdateExpense} />
                ))}
              </div>
            )}
            {otherExpenses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Receipt size={12} /> Outras despesas
                </h4>
                {otherExpenses.map((exp) => (
                  <ExpenseCard key={exp.id} expense={exp} participants={participants} onDelete={handleDeleteExpense} onUpdate={handleUpdateExpense} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayPage;
