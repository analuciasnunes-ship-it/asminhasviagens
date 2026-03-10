import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useTrips } from "@/hooks/useTrips";
import { AddDayItemMenu } from "@/components/AddDayItemMenu";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { TripDetails } from "@/components/TripDetails";
import { DayMapView } from "@/components/DayMapView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Activity, Flight, Accommodation, RentalCar, OtherDetail, Meal, Expense, DURATION_OPTIONS } from "@/types/trip";
import { ArrowLeft, List, MapPin } from "lucide-react";
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
  const handleUpdateFlight = (f: Flight) => updateDay({ flights: dayFlights.map((x) => x.id === f.id ? f : x) });
  const handleUpdateAccommodation = (a: Accommodation) => updateDay({ accommodations: dayAccommodations.map((x) => x.id === a.id ? a : x) });
  const handleUpdateCar = (c: RentalCar) => updateDay({ rentalCars: dayRentalCars.map((x) => x.id === c.id ? c : x) });
  const handleUpdateOther = (o: OtherDetail) => updateDay({ otherDetails: dayOtherDetails.map((x) => x.id === o.id ? o : x) });

  const [activeTab, setActiveTab] = useState("timeline");
  const [highlightedActivityId, setHighlightedActivityId] = useState<string | null>(null);

  const handleMarkerClick = useCallback((activityId: string) => {
    setActiveTab("timeline");
    setHighlightedActivityId(activityId);
    // Allow tab switch to render, then scroll
    setTimeout(() => {
      const el = document.getElementById(`activity-${activityId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Clear highlight after animation
        setTimeout(() => setHighlightedActivityId(null), 2000);
      }
    }, 100);
  }, []);


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
          onUpdateFlight={handleUpdateFlight}
          onUpdateAccommodation={handleUpdateAccommodation}
          onUpdateCar={handleUpdateCar}
          onUpdateOther={handleUpdateOther}
          compact
        />

        {/* Tabs for Timeline / Map */}
        <Tabs defaultValue="timeline" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="timeline" className="flex-1 gap-1.5">
              <List size={14} />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-1 gap-1.5">
              <MapPin size={14} />
              Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            {/* Activity Timeline */}
            <ActivityTimeline
              activities={day.activities}
              meals={dayMeals}
              expenses={dayExpenses}
              participants={participants}
              onUpdate={handleUpdateActivity}
              onDelete={handleDeleteActivity}
              onReorder={(reordered) => updateDay({ activities: reordered })}
              onUpdateMeal={handleUpdateMeal}
              onDeleteMeal={handleDeleteMeal}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
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
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <DayMapView
              activities={day.activities}
              participants={participants}
              onUpdate={handleUpdateActivity}
              onDelete={handleDeleteActivity}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DayPage;
