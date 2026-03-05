import { useParams, useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import { AddActivityDialog } from "@/components/AddActivityDialog";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { TripDetails } from "@/components/TripDetails";
import { Activity, Flight, Accommodation, RentalCar } from "@/types/trip";
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

  const updateDay = (patch: Partial<typeof day>) => {
    updateTrip({
      ...trip,
      days: trip.days.map((d) => (d.id === day.id ? { ...d, ...patch } : d)),
    });
  };

  const handleAddActivity = (activity: Activity) => updateDay({ activities: [...day.activities, activity] });
  const handleUpdateActivity = (updated: Activity) => updateDay({ activities: day.activities.map((a) => (a.id === updated.id ? updated : a)) });
  const handleDeleteActivity = (activityId: string) => updateDay({ activities: day.activities.filter((a) => a.id !== activityId) });

  // Day-level detail handlers
  const dayFlights = day.flights || [];
  const dayAccommodations = day.accommodations || [];
  const dayRentalCars = day.rentalCars || [];

  const handleAddFlight = (f: Flight) => updateDay({ flights: [...dayFlights, f] });
  const handleAddAccommodation = (a: Accommodation) => updateDay({ accommodations: [...dayAccommodations, a] });
  const handleAddCar = (c: RentalCar) => updateDay({ rentalCars: [...dayRentalCars, c] });
  const handleRemoveFlight = (fid: string) => updateDay({ flights: dayFlights.filter((x) => x.id !== fid) });
  const handleRemoveAccommodation = (aid: string) => updateDay({ accommodations: dayAccommodations.filter((x) => x.id !== aid) });
  const handleRemoveCar = (cid: string) => updateDay({ rentalCars: dayRentalCars.filter((x) => x.id !== cid) });

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

        <TripDetails
          flights={dayFlights}
          accommodations={dayAccommodations}
          rentalCars={dayRentalCars}
          onAddFlight={handleAddFlight}
          onAddAccommodation={handleAddAccommodation}
          onAddCar={handleAddCar}
          onRemoveFlight={handleRemoveFlight}
          onRemoveAccommodation={handleRemoveAccommodation}
          onRemoveCar={handleRemoveCar}
          compact
        />

        <ActivityTimeline
          activities={day.activities}
          onUpdate={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          onReorder={(reordered) => updateDay({ activities: reordered })}
        />
        <div className="pl-9 mt-2">
          <AddActivityDialog onAdd={handleAddActivity} />
        </div>
      </div>
    </div>
  );
};

export default DayPage;
