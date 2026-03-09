import { useParams, useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import { DayOverviewCard } from "@/components/DayOverviewCard";
import { TripDetails } from "@/components/TripDetails";
import { TripExpenseSummaryCard } from "@/components/TripExpenseSummaryCard";
import { TodayView } from "@/components/TodayView";
import { TripMapView } from "@/components/TripMapView";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, Calendar, Users, MapPin, Clock, Map } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { Flight, Accommodation, RentalCar, OtherDetail, Participant, Activity } from "@/types/trip";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TripPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrip, updateTrip, deleteTrip } = useTrips();
  const trip = getTrip(id!);

  const [newParticipant, setNewParticipant] = useState("");

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Viagem não encontrada.</p>
      </div>
    );
  }

  const participants = trip.participants || [];

  const totalCost = trip.days.reduce(
    (sum, day) => {
      const actCost = day.activities.reduce((s, a) => s + (a.cost || 0), 0);
      const mealCost = (day.meals || []).reduce((s, m) => s + m.totalBill, 0);
      const expCost = (day.expenses || []).reduce((s, e) => s + e.amount, 0);
      return sum + actCost + mealCost + expCost;
    },
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

  const handleAddParticipant = () => {
    const name = newParticipant.trim();
    if (!name || participants.some((p) => p.name === name)) return;
    const p: Participant = { id: crypto.randomUUID(), name };
    updateTrip({ ...trip, participants: [...participants, p] });
    setNewParticipant("");
  };

  const handleRemoveParticipant = (pid: string) => {
    updateTrip({ ...trip, participants: participants.filter((p) => p.id !== pid) });
  };

  // Trip-level detail handlers
  const handleAddFlight = (f: Flight) => updateTrip({ ...trip, flights: [...(trip.flights || []), f] });
  const handleAddAccommodation = (a: Accommodation) => updateTrip({ ...trip, accommodations: [...(trip.accommodations || []), a] });
  const handleAddCar = (c: RentalCar) => updateTrip({ ...trip, rentalCars: [...(trip.rentalCars || []), c] });
  const handleAddOther = (o: OtherDetail) => updateTrip({ ...trip, otherDetails: [...(trip.otherDetails || []), o] });
  const handleRemoveFlight = (fid: string) => updateTrip({ ...trip, flights: (trip.flights || []).filter((x) => x.id !== fid) });
  const handleRemoveAccommodation = (aid: string) => updateTrip({ ...trip, accommodations: (trip.accommodations || []).filter((x) => x.id !== aid) });
  const handleRemoveCar = (cid: string) => updateTrip({ ...trip, rentalCars: (trip.rentalCars || []).filter((x) => x.id !== cid) });
  const handleRemoveOther = (oid: string) => updateTrip({ ...trip, otherDetails: (trip.otherDetails || []).filter((x) => x.id !== oid) });
  const handleUpdateFlight = (f: Flight) => updateTrip({ ...trip, flights: (trip.flights || []).map((x) => x.id === f.id ? f : x) });
  const handleUpdateAccommodation = (a: Accommodation) => updateTrip({ ...trip, accommodations: (trip.accommodations || []).map((x) => x.id === a.id ? a : x) });
  const handleUpdateCar = (c: RentalCar) => updateTrip({ ...trip, rentalCars: (trip.rentalCars || []).map((x) => x.id === c.id ? c : x) });
  const handleUpdateOther = (o: OtherDetail) => updateTrip({ ...trip, otherDetails: (trip.otherDetails || []).map((x) => x.id === o.id ? o : x) });

  return (
    <div className="min-h-screen bg-background">
      {/* Immersive Hero Header */}
      <div className="relative h-64 sm:h-72 overflow-hidden">
        {trip.coverImage ? (
          <img src={trip.coverImage} alt={trip.destination} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

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
          <div className="mb-4 inline-flex items-center bg-secondary px-3 py-1.5 rounded-full">
            <span className="text-sm font-semibold text-foreground">
              Total: {totalCost.toFixed(2)}€
            </span>
          </div>
        )}

        <Tabs defaultValue="trip" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="trip" className="flex-1 gap-1.5">
              <MapPin size={14} /> Viagem
            </TabsTrigger>
            <TabsTrigger value="today" className="flex-1 gap-1.5">
              <Clock size={14} /> Hoje
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-1 gap-1.5">
              <Map size={14} /> Mapa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trip">
            {/* Participants */}
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} /> Participantes
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {participants.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium text-foreground">
                    {p.name}
                    <button onClick={() => handleRemoveParticipant(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar participante"
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddParticipant())}
                  className="text-sm h-8"
                />
                <Button variant="outline" size="sm" onClick={handleAddParticipant} disabled={!newParticipant.trim()}>
                  +
                </Button>
              </div>
            </div>

            {/* Expense summary card */}
            <div className="mb-6">
              <TripExpenseSummaryCard trip={trip} onClick={() => navigate(`/trip/${trip.id}/expenses`)} />
            </div>

            <TripDetails
              flights={trip.flights || []}
              accommodations={trip.accommodations || []}
              rentalCars={trip.rentalCars || []}
              otherDetails={trip.otherDetails || []}
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
          </TabsContent>

          <TabsContent value="today">
            <TodayView
              trip={trip}
              onUpdateActivity={(dayId, activity) => {
                updateTrip({
                  ...trip,
                  days: trip.days.map((d) =>
                    d.id === dayId
                      ? { ...d, activities: d.activities.map((a) => (a.id === activity.id ? activity : a)) }
                      : d
                  ),
                });
              }}
              onDeleteActivity={(dayId, activityId) => {
                updateTrip({
                  ...trip,
                  days: trip.days.map((d) =>
                    d.id === dayId
                      ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
                      : d
                  ),
                });
              }}
            />
          </TabsContent>

          <TabsContent value="map">
            <TripMapView
              trip={trip}
              onNavigateToDay={(dayId) => navigate(`/trip/${trip.id}/day/${dayId}`)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TripPage;
