import { useParams, useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import { DayOverviewCard } from "@/components/DayOverviewCard";
import { TripLogistics } from "@/components/TripLogistics";
import { ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const TripPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrip, updateTrip, deleteTrip } = useTrips();
  const trip = getTrip(id!);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Viagem não encontrada.</p>
      </div>
    );
  }

  const totalCost = trip.days.reduce(
    (sum, day) => sum + day.activities.reduce((s, a) => s + (a.cost || 0), 0),
    0
  );

  const handleUpdateDayTitle = (dayId: string, title: string) => {
    updateTrip({
      ...trip,
      days: trip.days.map((d) => (d.id === dayId ? { ...d, title: title || undefined } : d)),
    });
  };

  const handleDelete = () => {
    if (window.confirm("Tens a certeza que queres apagar esta viagem?")) {
      deleteTrip(trip.id);
      navigate("/");
    }
  };

  const dateRange = `${format(new Date(trip.startDate), "d MMM", { locale: pt })} – ${format(new Date(trip.endDate), "d MMM yyyy", { locale: pt })}`;

  return (
    <div className="min-h-screen bg-background">
      {trip.coverImage && (
        <div className="h-48 relative">
          <img src={trip.coverImage} alt={trip.destination} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>
          <button onClick={handleDelete} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={16} />
          </button>
        </div>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{trip.destination}</h1>
          <p className="text-sm text-muted-foreground mt-1">{dateRange}</p>
          {totalCost > 0 && (
            <div className="mt-3 inline-flex items-center bg-secondary px-3 py-1.5 rounded-full">
              <span className="text-sm font-semibold text-foreground">
                Total: {totalCost.toFixed(2)}€
              </span>
            </div>
          )}
        </header>

        <TripLogistics trip={trip} onUpdate={updateTrip} />

        <div className="mt-6 space-y-3">
          {trip.days.map((day) => (
            <DayOverviewCard
              key={day.id}
              day={day}
              tripId={trip.id}
              onUpdateTitle={handleUpdateDayTitle}
              onClick={() => navigate(`/trip/${trip.id}/day/${day.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TripPage;
