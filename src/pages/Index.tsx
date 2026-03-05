import { useTrips } from "@/hooks/useTrips";
import { TripCard } from "@/components/TripCard";
import { CreateTripDialog } from "@/components/CreateTripDialog";
import { Plane } from "lucide-react";

const Index = () => {
  const { trips, addTrip } = useTrips();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 pb-24">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Plane size={20} className="text-primary" />
            <span className="text-sm font-medium text-primary">TravelBook</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            As Minhas Viagens
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planeia, vive, regista.
          </p>
        </header>

        {trips.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Plane size={28} className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Sem viagens ainda
            </h2>
            <p className="text-sm text-muted-foreground">
              Toca no <span className="text-primary font-medium">+</span> para criar a tua primeira viagem.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>

      <CreateTripDialog onCreateTrip={addTrip} />
    </div>
  );
};

export default Index;
