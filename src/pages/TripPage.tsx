import { useParams, useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import { DayOverviewCard } from "@/components/DayOverviewCard";
import { TripDetails } from "@/components/TripDetails";
import { ArrowLeft, Trash2, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { Flight, Accommodation, RentalCar } from "@/types/trip";

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

  const numDays = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;
  const dateRange = `${format(new Date(trip.startDate), "d MMM", { locale: pt })} – ${format(new Date(trip.endDate), "d MMM yyyy", { locale: pt })}`;

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

  // Trip-level detail handlers
  const handleAddFlight = (f: Flight) => updateTrip({ ...trip, flights: [...(trip.flights || []), f] });
  const handleAddAccommodation = (a: Accommodation) => updateTrip({ ...trip, accommodations: [...(trip.accommodations || []), a] });
  const handleAddCar = (c: RentalCar) => updateTrip({ ...trip, rentalCars: [...(trip.rentalCars || []), c] });
  const handleRemoveFlight = (fid: string) => updateTrip({ ...trip, flights: (trip.flights || []).filter((x) => x.id !== fid) });
  const handleRemoveAccommodation = (aid: string) => updateTrip({ ...trip, accommodations: (trip.accommodations || []).filter((x) => x.id !== aid) });
  const handleRemoveCar = (cid: string) => updateTrip({ ...trip, rentalCars: (trip.rentalCars || []).filter((x) => x.id !== cid) });

  return (
    <div className="min-h-screen bg-background">
      {/* Immersive Hero Header */}
      <div className="relative h-64 sm:h-72 overflow-hidden">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.destination}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Nav buttons on top */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 z-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors backdrop-blur-sm bg-black/20 rounded-full px-3 py-1.5"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <button
            onClick={handleDelete}
            className="text-white/40 hover:text-destructive transition-colors backdrop-blur-sm bg-black/20 rounded-full p-2"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 z-10">
          <div className="max-w-lg mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {trip.destination}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar size={14} />
                {dateRange}
              </span>
              <span className="text-sm text-muted-foreground/60">·</span>
              <span className="text-sm font-medium text-muted-foreground">
                {numDays} {numDays === 1 ? "dia" : "dias"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {totalCost > 0 && (
          <div className="mb-6 inline-flex items-center bg-secondary px-3 py-1.5 rounded-full">
            <span className="text-sm font-semibold text-foreground">
              Total: {totalCost.toFixed(2)}€
            </span>
          </div>
        )}

        <TripDetails
          flights={trip.flights || []}
          accommodations={trip.accommodations || []}
          rentalCars={trip.rentalCars || []}
          onAddFlight={handleAddFlight}
          onAddAccommodation={handleAddAccommodation}
          onAddCar={handleAddCar}
          onRemoveFlight={handleRemoveFlight}
          onRemoveAccommodation={handleRemoveAccommodation}
          onRemoveCar={handleRemoveCar}
        />

        <div className="space-y-3">
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
