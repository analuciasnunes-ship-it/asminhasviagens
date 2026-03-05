import { useState } from "react";
import { Trip, Flight, Accommodation, RentalCar } from "@/types/trip";
import { Plane, Hotel, Car, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FormType = "flight" | "accommodation" | "car" | null;

interface Props {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
}

export function TripLogistics({ trip, onUpdate }: Props) {
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [flightDraft, setFlightDraft] = useState({ origin: "", destination: "", date: "", airline: "", price: "" });
  const [accDraft, setAccDraft] = useState({ placeName: "", address: "", checkIn: "", checkOut: "", price: "" });
  const [carDraft, setCarDraft] = useState({ company: "", pickupDate: "", dropoffDate: "", price: "" });

  const flights = trip.flights || [];
  const accommodations = trip.accommodations || [];
  const rentalCars = trip.rentalCars || [];
  const hasItems = flights.length > 0 || accommodations.length > 0 || rentalCars.length > 0;

  const formatDate = (d: string) => {
    try { return format(new Date(d), "d MMM", { locale: pt }); } catch { return d; }
  };

  const addFlight = () => {
    if (!flightDraft.origin || !flightDraft.destination || !flightDraft.date) return;
    const f: Flight = {
      id: crypto.randomUUID(), origin: flightDraft.origin, destination: flightDraft.destination,
      date: flightDraft.date, airline: flightDraft.airline || undefined,
      price: flightDraft.price ? parseFloat(flightDraft.price) : undefined,
    };
    onUpdate({ ...trip, flights: [...flights, f] });
    setFlightDraft({ origin: "", destination: "", date: "", airline: "", price: "" });
    setActiveForm(null);
  };

  const addAccommodation = () => {
    if (!accDraft.placeName || !accDraft.checkIn || !accDraft.checkOut) return;
    const a: Accommodation = {
      id: crypto.randomUUID(), placeName: accDraft.placeName, address: accDraft.address || undefined,
      checkIn: accDraft.checkIn, checkOut: accDraft.checkOut,
      price: accDraft.price ? parseFloat(accDraft.price) : undefined,
    };
    onUpdate({ ...trip, accommodations: [...accommodations, a] });
    setAccDraft({ placeName: "", address: "", checkIn: "", checkOut: "", price: "" });
    setActiveForm(null);
  };

  const addCar = () => {
    if (!carDraft.company || !carDraft.pickupDate || !carDraft.dropoffDate) return;
    const c: RentalCar = {
      id: crypto.randomUUID(), company: carDraft.company,
      pickupDate: carDraft.pickupDate, dropoffDate: carDraft.dropoffDate,
      price: carDraft.price ? parseFloat(carDraft.price) : undefined,
    };
    onUpdate({ ...trip, rentalCars: [...rentalCars, c] });
    setCarDraft({ company: "", pickupDate: "", dropoffDate: "", price: "" });
    setActiveForm(null);
  };

  const remove = (type: "flights" | "accommodations" | "rentalCars", id: string) => {
    onUpdate({ ...trip, [type]: (trip[type] || []).filter((i: any) => i.id !== id) });
  };

  if (!hasItems && !activeForm) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 text-sm text-primary/60 hover:text-primary transition-colors mb-2">
            <Plus size={16} /> Adicionar logística
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => setActiveForm("flight")}>
            <Plane size={14} className="mr-2" /> Voo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveForm("accommodation")}>
            <Hotel size={14} className="mr-2" /> Alojamento
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveForm("car")}>
            <Car size={14} className="mr-2" /> Aluguer de carro
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Logística da Viagem</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-xs text-primary/60 hover:text-primary transition-colors">
              <Plus size={14} /> Adicionar
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setActiveForm("flight")}>
              <Plane size={14} className="mr-2" /> Voo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveForm("accommodation")}>
              <Hotel size={14} className="mr-2" /> Alojamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveForm("car")}>
              <Car size={14} className="mr-2" /> Aluguer de carro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Existing items */}
      {flights.map((f) => (
        <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0">
            <Plane size={14} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{f.origin} → {f.destination}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(f.date)}{f.airline && ` · ${f.airline}`}{f.price != null && ` · ${f.price.toFixed(2)}€`}
            </p>
          </div>
          <button onClick={() => remove("flights", f.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {accommodations.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0">
            <Hotel size={14} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{a.placeName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(a.checkIn)} – {formatDate(a.checkOut)}{a.address && ` · ${a.address}`}{a.price != null && ` · ${a.price.toFixed(2)}€`}
            </p>
          </div>
          <button onClick={() => remove("accommodations", a.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {rentalCars.map((c) => (
        <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0">
            <Car size={14} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{c.company}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(c.pickupDate)} – {formatDate(c.dropoffDate)}{c.price != null && ` · ${c.price.toFixed(2)}€`}
            </p>
          </div>
          <button onClick={() => remove("rentalCars", c.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {/* Forms */}
      {activeForm === "flight" && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Plane size={14} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Novo voo</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Origem *</Label><Input className="h-8 text-sm" placeholder="LIS" value={flightDraft.origin} onChange={(e) => setFlightDraft({ ...flightDraft, origin: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Destino *</Label><Input className="h-8 text-sm" placeholder="CDG" value={flightDraft.destination} onChange={(e) => setFlightDraft({ ...flightDraft, destination: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs">Data *</Label><Input className="h-8 text-sm" type="date" value={flightDraft.date} onChange={(e) => setFlightDraft({ ...flightDraft, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Companhia</Label><Input className="h-8 text-sm" placeholder="TAP" value={flightDraft.airline} onChange={(e) => setFlightDraft({ ...flightDraft, airline: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Preço (€)</Label><Input className="h-8 text-sm" type="number" step="0.01" placeholder="0.00" value={flightDraft.price} onChange={(e) => setFlightDraft({ ...flightDraft, price: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={addFlight} disabled={!flightDraft.origin || !flightDraft.destination || !flightDraft.date}>Adicionar</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setActiveForm(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {activeForm === "accommodation" && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hotel size={14} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Novo alojamento</span>
          </div>
          <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input className="h-8 text-sm" placeholder="Hotel / Airbnb..." value={accDraft.placeName} onChange={(e) => setAccDraft({ ...accDraft, placeName: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Morada</Label><Input className="h-8 text-sm" placeholder="Rua..." value={accDraft.address} onChange={(e) => setAccDraft({ ...accDraft, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Check-in *</Label><Input className="h-8 text-sm" type="date" value={accDraft.checkIn} onChange={(e) => setAccDraft({ ...accDraft, checkIn: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Check-out *</Label><Input className="h-8 text-sm" type="date" value={accDraft.checkOut} onChange={(e) => setAccDraft({ ...accDraft, checkOut: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs">Preço (€)</Label><Input className="h-8 text-sm" type="number" step="0.01" placeholder="0.00" value={accDraft.price} onChange={(e) => setAccDraft({ ...accDraft, price: e.target.value })} /></div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={addAccommodation} disabled={!accDraft.placeName || !accDraft.checkIn || !accDraft.checkOut}>Adicionar</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setActiveForm(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {activeForm === "car" && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Car size={14} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Aluguer de carro</span>
          </div>
          <div className="space-y-1"><Label className="text-xs">Empresa *</Label><Input className="h-8 text-sm" placeholder="Europcar, Hertz..." value={carDraft.company} onChange={(e) => setCarDraft({ ...carDraft, company: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Levantamento *</Label><Input className="h-8 text-sm" type="datetime-local" value={carDraft.pickupDate} onChange={(e) => setCarDraft({ ...carDraft, pickupDate: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Devolução *</Label><Input className="h-8 text-sm" type="datetime-local" value={carDraft.dropoffDate} onChange={(e) => setCarDraft({ ...carDraft, dropoffDate: e.target.value })} /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs">Preço (€)</Label><Input className="h-8 text-sm" type="number" step="0.01" placeholder="0.00" value={carDraft.price} onChange={(e) => setCarDraft({ ...carDraft, price: e.target.value })} /></div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={addCar} disabled={!carDraft.company || !carDraft.pickupDate || !carDraft.dropoffDate}>Adicionar</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setActiveForm(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
