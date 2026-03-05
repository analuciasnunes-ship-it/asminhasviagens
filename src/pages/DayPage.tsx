import { useParams, useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import { ActivityCard } from "@/components/ActivityCard";
import { AddActivityDialog } from "@/components/AddActivityDialog";
import { Activity } from "@/types/trip";
import { ArrowLeft } from "lucide-react";
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

  const dateLabel = format(new Date(day.date), "EEEE, d 'de' MMMM", { locale: pt });
  const dayCost = day.activities.reduce((s, a) => s + (a.cost || 0), 0);

  const updateDay = (activities: Activity[]) => {
    updateTrip({
      ...trip,
      days: trip.days.map((d) => (d.id === day.id ? { ...d, activities } : d)),
    });
  };

  const handleAddActivity = (activity: Activity) => {
    updateDay([...day.activities, activity]);
  };

  const handleUpdateActivity = (updated: Activity) => {
    updateDay(day.activities.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteActivity = (activityId: string) => {
    updateDay(day.activities.filter((a) => a.id !== activityId));
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
          <h1 className="text-2xl font-bold text-foreground">
            Dia {day.dayNumber}{day.title ? ` – ${day.title}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{dateLabel}</p>
          {dayCost > 0 && (
            <div className="mt-3 inline-flex items-center bg-secondary px-3 py-1.5 rounded-full">
              <span className="text-sm font-semibold text-foreground">
                Total: {dayCost.toFixed(2)}€
              </span>
            </div>
          )}
        </header>

        <div className="space-y-2">
          {day.activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onUpdate={handleUpdateActivity}
              onDelete={handleDeleteActivity}
            />
          ))}
          <AddActivityDialog onAdd={handleAddActivity} />
        </div>
      </div>
    </div>
  );
};

export default DayPage;
