import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Trip, DayPlan } from "@/types/trip";
import { differenceInDays, addDays, format } from "date-fns";

interface Props {
  onCreateTrip: (trip: Trip) => void;
}

export function CreateTripDialog({ onCreateTrip }: Props) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const handleSubmit = () => {
    if (!destination || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = differenceInDays(end, start) + 1;

    const days: DayPlan[] = Array.from({ length: totalDays }, (_, i) => ({
      id: crypto.randomUUID(),
      date: format(addDays(start, i), "yyyy-MM-dd"),
      dayNumber: i + 1,
      activities: [],
    }));

    const trip: Trip = {
      id: crypto.randomUUID(),
      destination,
      startDate,
      endDate,
      coverImage: coverImage || undefined,
      flights: [],
      accommodations: [],
      days,
    };

    onCreateTrip(trip);
    setOpen(false);
    setDestination("");
    setStartDate("");
    setEndDate("");
    setCoverImage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center">
          <Plus size={24} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Viagem</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="destination">Destino</Label>
            <Input
              id="destination"
              placeholder="Ex: Lisboa, Porto, Açores..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover">Imagem de capa (URL, opcional)</Label>
            <Input
              id="cover"
              placeholder="https://..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!destination || !startDate || !endDate}>
            Criar Viagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
