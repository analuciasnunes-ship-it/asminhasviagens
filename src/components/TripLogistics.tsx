import { useState } from "react";
import { Trip, Flight, Accommodation } from "@/types/trip";
import { Plane, Hotel, Plus, Trash2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Props {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

export function TripLogistics({ trip, onUpdate }: Props) {
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [showAccommodationForm, setShowAccommodationForm] = useState(false);

  const [flightDraft, setFlightDraft] = useState({ origin: "", destination: "", date: "", airline: "", price: "" });
  const [accDraft, setAccDraft] = useState({ placeName: "", address: "", checkIn: "", checkOut: "", price: "" });

  const addFlight = () => {
    if (!flightDraft.origin || !flightDraft.destination || !flightDraft.date) return;
    const flight: Flight = {
      id: crypto.randomUUID(),
      origin: flightDraft.origin,
      destination: flightDraft.destination,
      date: flightDraft.date,
      airline: flightDraft.airline || undefined,
      price: flightDraft.price ? parseFloat(flightDraft.price) : undefined,
    };
    onUpdate({ ...trip, flights: [...(trip.flights || []), flight] });
    setFlightDraft({ origin: "", destination: "", date: "", airline: "", price: "" });
    setShowFlightForm(false);
  };

  const removeFlight = (id: string) => {
    onUpdate({ ...trip, flights: (trip.flights || []).filter((f) => f.id !== id) });
  };

  const addAccommodation = () => {
    if (!accDraft.placeName || !accDraft.checkIn || !accDraft.checkOut) return;
    const acc: Accommodation = {
      id: crypto.randomUUID(),
      placeName: accDraft.placeName,
      address: accDraft.address || undefined,
      checkIn: accDraft.checkIn,
      checkOut: accDraft.checkOut,
      price: accDraft.price ? parseFloat(accDraft.price) : undefined,
    };
    onUpdate({ ...trip, accommodations: [...(trip.accommodations || []), acc] });
    setAccDraft({ placeName: "", address: "", checkIn: "", checkOut: "", price: "" });
    setShowAccommodationForm(false);
  };

  const removeAccommodation = (id: string) => {
    onUpdate({ ...trip, accommodations: (trip.accommodations || []).filter((a) => a.id !== id) });
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), "d MMM", { locale: pt }); }
    catch { return d; }
  };

  return (
    <Accordion type="multiple" className="space-y-3">
      {/* Flights */}
      <AccordionItem value="flights" className="rounded-2xl border border-border bg-card px-4 overflow-hidden">
        <AccordionTrigger className="py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <Plane size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Voos {(trip.flights || []).length > 0 && `(${(trip.flights || []).length})`}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pb-1">
            {(trip.flights || []).map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">
                    {f.origin} → {f.destination}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(f.date)}
                    {f.airline && ` · ${f.airline}`}
                    {f.price != null && ` · ${f.price.toFixed(2)}€`}
                  </p>
                </div>
                <button onClick={() => removeFlight(f.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors ml-2">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {showFlightForm ? (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Origem *</Label>
                    <Input className="h-8 text-sm" placeholder="LIS" value={flightDraft.origin} onChange={(e) => setFlightDraft({ ...flightDraft, origin: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Destino *</Label>
                    <Input className="h-8 text-sm" placeholder="CDG" value={flightDraft.destination} onChange={(e) => setFlightDraft({ ...flightDraft, destination: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data *</Label>
                  <Input className="h-8 text-sm" type="date" value={flightDraft.date} onChange={(e) => setFlightDraft({ ...flightDraft, date: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Companhia</Label>
                    <Input className="h-8 text-sm" placeholder="TAP" value={flightDraft.airline} onChange={(e) => setFlightDraft({ ...flightDraft, airline: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço (€)</Label>
                    <Input className="h-8 text-sm" type="number" step="0.01" placeholder="0.00" value={flightDraft.price} onChange={(e) => setFlightDraft({ ...flightDraft, price: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={addFlight} disabled={!flightDraft.origin || !flightDraft.destination || !flightDraft.date}>Adicionar</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowFlightForm(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowFlightForm(true)} className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary transition-colors pt-1">
                <Plus size={14} /> Adicionar voo
              </button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Accommodations */}
      <AccordionItem value="accommodations" className="rounded-2xl border border-border bg-card px-4 overflow-hidden">
        <AccordionTrigger className="py-3 hover:no-underline">
          <div className="flex items-center gap-2">
            <Hotel size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Alojamento {(trip.accommodations || []).length > 0 && `(${(trip.accommodations || []).length})`}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pb-1">
            {(trip.accommodations || []).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-secondary/50 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{a.placeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(a.checkIn)} – {formatDate(a.checkOut)}
                    {a.address && ` · ${a.address}`}
                    {a.price != null && ` · ${a.price.toFixed(2)}€`}
                  </p>
                </div>
                <button onClick={() => removeAccommodation(a.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors ml-2">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {showAccommodationForm ? (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome *</Label>
                  <Input className="h-8 text-sm" placeholder="Hotel / Airbnb..." value={accDraft.placeName} onChange={(e) => setAccDraft({ ...accDraft, placeName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Morada</Label>
                  <Input className="h-8 text-sm" placeholder="Rua..." value={accDraft.address} onChange={(e) => setAccDraft({ ...accDraft, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Check-in *</Label>
                    <Input className="h-8 text-sm" type="date" value={accDraft.checkIn} onChange={(e) => setAccDraft({ ...accDraft, checkIn: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Check-out *</Label>
                    <Input className="h-8 text-sm" type="date" value={accDraft.checkOut} onChange={(e) => setAccDraft({ ...accDraft, checkOut: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preço (€)</Label>
                  <Input className="h-8 text-sm" type="number" step="0.01" placeholder="0.00" value={accDraft.price} onChange={(e) => setAccDraft({ ...accDraft, price: e.target.value })} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 h-8 text-xs" onClick={addAccommodation} disabled={!accDraft.placeName || !accDraft.checkIn || !accDraft.checkOut}>Adicionar</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowAccommodationForm(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAccommodationForm(true)} className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary transition-colors pt-1">
                <Plus size={14} /> Adicionar alojamento
              </button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
