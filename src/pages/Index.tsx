import { useTrips } from "@/hooks/useTrips";
import { TripCard } from "@/components/TripCard";
import { CreateTripDialog } from "@/components/CreateTripDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Plane, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { trips, loading, addTrip } = useTrips();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 pb-24">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Plane size={20} className="text-primary" />
              <span className="text-sm font-medium text-primary">TravelBook</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground gap-1.5">
              <LogOut size={14} />
              Sair
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            As Minhas Viagens
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planeia, vive, regista.
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : trips.length === 0 ? (
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
