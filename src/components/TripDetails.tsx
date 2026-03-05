import { useState } from "react";
import { Flight, Accommodation, RentalCar } from "@/types/trip";
import { Plane, Hotel, Car, Plus, Trash2, ArrowLeftRight, ArrowRight } from "lucide-react";
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
type FlightMode = null | "roundtrip" | "oneway";

interface Props {
  flights: Flight[];
  accommodations: Accommodation[];
  rentalCars: RentalCar[];
  onAddFlight: (f: Flight) => void;
  onAddAccommodation: (a: Accommodation) => void;
  onAddCar: (c: RentalCar) => void;
  onRemoveFlight: (id: string) => void;
  onRemoveAccommodation: (id: string) => void;
  onRemoveCar: (id: string) => void;
  compact?: boolean;
}

const emptyRoundtrip = { origin: "", destination: "", departureTime: "", arrivalTime: "", returnDepartureTime: "", returnArrivalTime: "", price: "" };
const emptyOneway = { origin: "", destination: "", flightNumber: "", departureTime: "", arrivalTime: "", price: "" };

export function TripDetails({
  flights, accommodations, rentalCars,
  onAddFlight, onAddAccommodation, onAddCar,
  onRemoveFlight, onRemoveAccommodation, onRemoveCar,
  compact = false,
}: Props) {
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [flightMode, setFlightMode] = useState<FlightMode>(null);
  const [rtDraft, setRtDraft] = useState(emptyRoundtrip);
  const [owDraft, setOwDraft] = useState(emptyOneway);
  const [accDraft, setAccDraft] = useState({ placeName: "", address: "", checkIn: "", checkOut: "", price: "" });
  const [carDraft, setCarDraft] = useState({ company: "", pickupDate: "", dropoffDate: "", price: "" });

  const hasItems = flights.length > 0 || accommodations.length > 0 || rentalCars.length > 0;

  const formatDate = (d: string) => {
    try { return format(new Date(d), "d MMM", { locale: pt }); } catch { return d; }
  };

  const resetFlightForm = () => {
    setActiveForm(null);
    setFlightMode(null);
    setRtDraft(emptyRoundtrip);
    setOwDraft(emptyOneway);
  };

  const addRoundtrip = () => {
    if (!rtDraft.origin || !rtDraft.destination) return;
    onAddFlight({
      id: crypto.randomUUID(),
      type: "roundtrip",
      origin: rtDraft.origin,
      destination: rtDraft.destination,
      departureTime: rtDraft.departureTime || undefined,
      arrivalTime: rtDraft.arrivalTime || undefined,
      returnDepartureTime: rtDraft.returnDepartureTime || undefined,
      returnArrivalTime: rtDraft.returnArrivalTime || undefined,
      price: rtDraft.price ? parseFloat(rtDraft.price) : undefined,
    });
    resetFlightForm();
  };

  const addOneway = () => {
    if (!owDraft.origin || !owDraft.destination) return;
    onAddFlight({
      id: crypto.randomUUID(),
      type: "oneway",
      origin: owDraft.origin,
      destination: owDraft.destination,
      flightNumber: owDraft.flightNumber || undefined,
      departureTime: owDraft.departureTime || undefined,
      arrivalTime: owDraft.arrivalTime || undefined,
      price: owDraft.price ? parseFloat(owDraft.price) : undefined,
    });
    resetFlightForm();
  };

  const addAccommodation = () => {
    if (!accDraft.placeName || !accDraft.checkIn || !accDraft.checkOut) return;
    onAddAccommodation({
      id: crypto.randomUUID(), placeName: accDraft.placeName, address: accDraft.address || undefined,
      checkIn: accDraft.checkIn, checkOut: accDraft.checkOut,
      price: accDraft.price ? parseFloat(accDraft.price) : undefined,
    });
    setAccDraft({ placeName: "", address: "", checkIn: "", checkOut: "", price: "" });
    setActiveForm(null);
  };

  const addCar = () => {
    if (!carDraft.company || !carDraft.pickupDate || !carDraft.dropoffDate) return;
    onAddCar({
      id: crypto.randomUUID(), company: carDraft.company,
      pickupDate: carDraft.pickupDate, dropoffDate: carDraft.dropoffDate,
      price: carDraft.price ? parseFloat(carDraft.price) : undefined,
    });
    setCarDraft({ company: "", pickupDate: "", dropoffDate: "", price: "" });
    setActiveForm(null);
  };

  const addButton = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm text-primary/60 hover:text-primary transition-colors">
          <Plus size={16} /> Adicionar detalhe
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

  if (!hasItems && !activeForm) {
    return <div className="mb-4">{addButton}</div>;
  }

  const renderFlightCard = (f: Flight) => {
    if (f.type === "roundtrip") {
      return (
        <div key={f.id} className="rounded-2xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0 mt-0.5">
              <ArrowLeftRight size={14} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium text-foreground">{f.origin} ↔ {f.destination}</p>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">Ida:</span>
                  {f.departureTime && ` ${f.departureTime}`}{f.arrivalTime && ` → ${f.arrivalTime}`}
                  {!f.departureTime && !f.arrivalTime && " —"}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/70">Volta:</span>
                  {f.returnDepartureTime && ` ${f.returnDepartureTime}`}{f.returnArrivalTime && ` → ${f.returnArrivalTime}`}
                  {!f.returnDepartureTime && !f.returnArrivalTime && " —"}
                </p>
              </div>
              {f.price != null && (
                <p className="text-xs text-muted-foreground">{f.price.toFixed(2)}€</p>
              )}
            </div>
            <button onClick={() => onRemoveFlight(f.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors mt-1">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0">
          <ArrowRight size={14} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {f.origin} → {f.destination}
            {f.flightNumber && <span className="text-muted-foreground font-normal"> · {f.flightNumber}</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {f.departureTime && `${f.departureTime}`}{f.arrivalTime && ` → ${f.arrivalTime}`}{f.price != null && ` · ${f.price.toFixed(2)}€`}
          </p>
        </div>
        <button onClick={() => onRemoveFlight(f.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className={compact ? "mb-4 space-y-2" : "mb-6 space-y-3"}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {compact ? "Detalhes do Dia" : "Detalhes da Viagem"}
        </h2>
        {addButton}
      </div>

      {/* Flight items */}
      {flights.map(renderFlightCard)}

      {/* Accommodation items */}
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
          <button onClick={() => onRemoveAccommodation(a.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {/* Rental car items */}
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
          <button onClick={() => onRemoveCar(c.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {/* Flight form */}
      {activeForm === "flight" && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Plane size={14} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Novo voo</span>
          </div>

          {!flightMode && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Que tipo de voo pretende adicionar?</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 text-xs flex flex-col gap-0.5"
                  onClick={() => setFlightMode("roundtrip")}
                >
                  <ArrowLeftRight size={14} />
                  Ida e volta
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 text-xs flex flex-col gap-0.5"
                  onClick={() => setFlightMode("oneway")}
                >
                  <ArrowRight size={14} />
                  Voos separados
                </Button>
              </div>
              <Button size="sm" variant="ghost" className="h-8 text-xs w-full" onClick={resetFlightForm}>Cancelar</Button>
            </div>
          )}

          {flightMode === "roundtrip" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Origem *</Label><Input className="h-8 text-sm" placeholder="LIS" value={rtDraft.origin} onChange={(e) => setRtDraft({ ...rtDraft, origin: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Destino *</Label><Input className="h-8 text-sm" placeholder="CDG" value={rtDraft.destination} onChange={(e) => setRtDraft({ ...rtDraft, destination: e.target.value })} /></div>
              </div>
              <p className="text-xs font-medium text-muted-foreground pt-1">Ida</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Partida</Label><Input className="h-8 text-sm" type="time" value={rtDraft.departureTime} onChange={(e) => setRtDraft({ ...rtDraft, departureTime: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Chegada</Label><Input className="h-8 text-sm" type="time" value={rtDraft.arrivalTime} onChange={(e) => setRtDraft({ ...rtDraft, arrivalTime: e.target.value })} /></div>
              </div>
              <p className="text-xs font-medium text-muted-foreground pt-1">Volta</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Partida</Label><Input className="h-8 text-sm" type="time" value={rtDraft.returnDepartureTime} onChange={(e) => setRtDraft({ ...rtDraft, returnDepartureTime: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Chegada</Label><Input className="h-8 text-sm" type="time" value={rtDraft.returnArrivalTime} onChange={(e) => setRtDraft({ ...rtDraft, returnArrivalTime: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Preço total (€)</Label><Input className="h-8 text-sm" type="number" step="0.01" placeholder="0.00" value={rtDraft.price} onChange={(e) => setRtDraft({ ...rtDraft, price: e.target.value })} /></div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8 text-xs" onClick={addRoundtrip} disabled={!rtDraft.origin || !rtDraft.destination}>Adicionar</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={resetFlightForm}>Cancelar</Button>
              </div>
            </div>
          )}

          {flightMode === "oneway" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Origem *</Label><Input className="h-8 text-sm" placeholder="LIS" value={owDraft.origin} onChange={(e) => setOwDraft({ ...owDraft, origin: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Destino *</Label><Input className="h-8 text-sm" placeholder="CDG" value={owDraft.destination} onChange={(e) => setOwDraft({ ...owDraft, destination: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Número do voo</Label><Input className="h-8 text-sm" placeholder="TP1234" value={owDraft.flightNumber} onChange={(e) => setOwDraft({ ...owDraft, flightNumber: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Hora de partida</Label><Input className="h-8 text-sm" type="time" value={owDraft.departureTime} onChange={(e) => setOwDraft({ ...owDraft, departureTime: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Hora de chegada</Label><Input className="h-8 text-sm" type="time" value={owDraft.arrivalTime} onChange={(e) => setOwDraft({ ...owDraft, arrivalTime: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Preço (€)</Label><Input className="h-8 text-sm" type="number" step="0.01" placeholder="0.00" value={owDraft.price} onChange={(e) => setOwDraft({ ...owDraft, price: e.target.value })} /></div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8 text-xs" onClick={addOneway} disabled={!owDraft.origin || !owDraft.destination}>Adicionar</Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={resetFlightForm}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accommodation form */}
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

      {/* Car form */}
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
