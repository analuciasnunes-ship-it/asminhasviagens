import { useState } from "react";
import { Flight, Accommodation, RentalCar, OtherDetail, Participant, ExpensePayment } from "@/types/trip";
import { ExpensePaymentsList } from "./ExpensePaymentsList";
import { PaymentStatusBadge } from "./ExpensePaymentsList";
import { Plane, Hotel, Car, Package, Plus, Trash2, ArrowLeftRight, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FormType = "flight" | "accommodation" | "car" | "other" | null;
type FlightMode = null | "roundtrip" | "oneway";

interface Props {
  flights: Flight[];
  accommodations: Accommodation[];
  rentalCars: RentalCar[];
  otherDetails?: OtherDetail[];
  participants?: Participant[];
  onAddFlight: (f: Flight) => void;
  onAddAccommodation: (a: Accommodation) => void;
  onAddCar: (c: RentalCar) => void;
  onAddOther?: (o: OtherDetail) => void;
  onRemoveFlight: (id: string) => void;
  onRemoveAccommodation: (id: string) => void;
  onRemoveCar: (id: string) => void;
  onRemoveOther?: (id: string) => void;
  compact?: boolean;
}

const emptyRoundtrip = { origin: "", destination: "", departureTime: "", arrivalTime: "", returnDepartureTime: "", returnArrivalTime: "", price: "", paidBy: "", sharedBy: [] as string[], expensePayments: [] as ExpensePayment[] };
const emptyOneway = { origin: "", destination: "", flightNumber: "", departureTime: "", arrivalTime: "", price: "", paidBy: "", sharedBy: [] as string[], expensePayments: [] as ExpensePayment[] };

function ExpenseSplitFields({ participants, paidBy, sharedBy, onPaidByChange, onSharedByChange }: {
  participants: Participant[];
  paidBy: string;
  sharedBy: string[];
  onPaidByChange: (id: string) => void;
  onSharedByChange: (ids: string[]) => void;
}) {
  if (participants.length === 0) return null;
  const toggleShared = (id: string) => {
    onSharedByChange(sharedBy.includes(id) ? sharedBy.filter((x) => x !== id) : [...sharedBy, id]);
  };
  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Quem pagou</Label>
        <div className="flex flex-wrap gap-1.5">
          {participants.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPaidByChange(p.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                paidBy === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Dividir entre</Label>
          <div className="flex gap-2">
            <button type="button" onClick={() => onSharedByChange(participants.map((p) => p.id))} className="text-[11px] text-primary hover:underline">Todos</button>
            <button type="button" onClick={() => onSharedByChange([])} className="text-[11px] text-muted-foreground hover:underline">Limpar</button>
          </div>
        </div>
        <div className="space-y-1">
          {participants.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-xs">
              <Checkbox checked={sharedBy.includes(p.id)} onCheckedChange={() => toggleShared(p.id)} />
              {p.name}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

function SplitInfo({ participants, paidBy, sharedBy, price }: {
  participants: Participant[];
  paidBy?: string;
  sharedBy?: string[];
  price?: number;
}) {
  if (!paidBy || !sharedBy || sharedBy.length === 0 || !price) return null;
  const payer = participants.find((p) => p.id === paidBy);
  const perPerson = price / sharedBy.length;
  return (
    <p className="text-[11px] text-muted-foreground mt-0.5">
      Pago por {payer?.name || "?"} · {perPerson.toFixed(2)}€/pessoa
    </p>
  );
}

export function TripDetails({
  flights, accommodations, rentalCars, otherDetails = [],
  participants = [],
  onAddFlight, onAddAccommodation, onAddCar, onAddOther,
  onRemoveFlight, onRemoveAccommodation, onRemoveCar, onRemoveOther,
  compact = false,
}: Props) {
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [flightMode, setFlightMode] = useState<FlightMode>(null);
  const [rtDraft, setRtDraft] = useState(emptyRoundtrip);
  const [owDraft, setOwDraft] = useState(emptyOneway);
  const [accDraft, setAccDraft] = useState({ placeName: "", address: "", checkIn: "", checkOut: "", price: "", paidBy: "", sharedBy: [] as string[], expensePayments: [] as ExpensePayment[] });
  const [carDraft, setCarDraft] = useState({ company: "", pickupDate: "", dropoffDate: "", price: "", paidBy: "", sharedBy: [] as string[], expensePayments: [] as ExpensePayment[] });
  const [otherDraft, setOtherDraft] = useState({ description: "", notes: "", price: "", paidBy: "", sharedBy: [] as string[], expensePayments: [] as ExpensePayment[] });

  const hasItems = flights.length > 0 || accommodations.length > 0 || rentalCars.length > 0 || otherDetails.length > 0;

  const formatDate = (d: string) => {
    try { return format(new Date(d), "d MMM", { locale: pt }); } catch { return d; }
  };

  const initSharedBy = () => participants.map((p) => p.id);

  const resetFlightForm = () => {
    setActiveForm(null);
    setFlightMode(null);
    setRtDraft({ ...emptyRoundtrip, sharedBy: [] });
    setOwDraft({ ...emptyOneway, sharedBy: [] });
  };

  const addRoundtrip = () => {
    if (!rtDraft.origin || !rtDraft.destination) return;
    onAddFlight({
      id: crypto.randomUUID(), type: "roundtrip",
      origin: rtDraft.origin, destination: rtDraft.destination,
      departureTime: rtDraft.departureTime || undefined,
      arrivalTime: rtDraft.arrivalTime || undefined,
      returnDepartureTime: rtDraft.returnDepartureTime || undefined,
      returnArrivalTime: rtDraft.returnArrivalTime || undefined,
      price: rtDraft.price ? parseFloat(rtDraft.price) : undefined,
      paidBy: rtDraft.paidBy || undefined,
      sharedBy: rtDraft.sharedBy.length > 0 ? rtDraft.sharedBy : undefined,
      expensePayments: rtDraft.expensePayments.length > 0 ? rtDraft.expensePayments : undefined,
    });
    resetFlightForm();
  };

  const addOneway = () => {
    if (!owDraft.origin || !owDraft.destination) return;
    onAddFlight({
      id: crypto.randomUUID(), type: "oneway",
      origin: owDraft.origin, destination: owDraft.destination,
      flightNumber: owDraft.flightNumber || undefined,
      departureTime: owDraft.departureTime || undefined,
      arrivalTime: owDraft.arrivalTime || undefined,
      price: owDraft.price ? parseFloat(owDraft.price) : undefined,
      paidBy: owDraft.paidBy || undefined,
      sharedBy: owDraft.sharedBy.length > 0 ? owDraft.sharedBy : undefined,
      expensePayments: owDraft.expensePayments.length > 0 ? owDraft.expensePayments : undefined,
    });
    resetFlightForm();
  };

  const addAccommodation = () => {
    if (!accDraft.placeName || !accDraft.checkIn || !accDraft.checkOut) return;
    onAddAccommodation({
      id: crypto.randomUUID(), placeName: accDraft.placeName, address: accDraft.address || undefined,
      checkIn: accDraft.checkIn, checkOut: accDraft.checkOut,
      price: accDraft.price ? parseFloat(accDraft.price) : undefined,
      paidBy: accDraft.paidBy || undefined,
      sharedBy: accDraft.sharedBy.length > 0 ? accDraft.sharedBy : undefined,
      expensePayments: accDraft.expensePayments.length > 0 ? accDraft.expensePayments : undefined,
    });
    setAccDraft({ placeName: "", address: "", checkIn: "", checkOut: "", price: "", paidBy: "", sharedBy: [], expensePayments: [] });
    setActiveForm(null);
  };

  const addCar = () => {
    if (!carDraft.company || !carDraft.pickupDate || !carDraft.dropoffDate) return;
    onAddCar({
      id: crypto.randomUUID(), company: carDraft.company,
      pickupDate: carDraft.pickupDate, dropoffDate: carDraft.dropoffDate,
      price: carDraft.price ? parseFloat(carDraft.price) : undefined,
      paidBy: carDraft.paidBy || undefined,
      sharedBy: carDraft.sharedBy.length > 0 ? carDraft.sharedBy : undefined,
      expensePayments: carDraft.expensePayments.length > 0 ? carDraft.expensePayments : undefined,
    });
    setCarDraft({ company: "", pickupDate: "", dropoffDate: "", price: "", paidBy: "", sharedBy: [], expensePayments: [] });
    setActiveForm(null);
  };

  const addOther = () => {
    if (!otherDraft.description) return;
    onAddOther?.({
      id: crypto.randomUUID(), description: otherDraft.description,
      notes: otherDraft.notes || undefined,
      price: otherDraft.price ? parseFloat(otherDraft.price) : undefined,
      paidBy: otherDraft.paidBy || undefined,
      sharedBy: otherDraft.sharedBy.length > 0 ? otherDraft.sharedBy : undefined,
      expensePayments: otherDraft.expensePayments.length > 0 ? otherDraft.expensePayments : undefined,
    });
    setOtherDraft({ description: "", notes: "", price: "", paidBy: "", sharedBy: [], expensePayments: [] });
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
        <DropdownMenuItem onClick={() => { setActiveForm("flight"); }}>
          <Plane size={14} className="mr-2" /> Voo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setActiveForm("accommodation"); setAccDraft((d) => ({ ...d, sharedBy: initSharedBy() })); }}>
          <Hotel size={14} className="mr-2" /> Alojamento
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setActiveForm("car"); setCarDraft((d) => ({ ...d, sharedBy: initSharedBy() })); }}>
          <Car size={14} className="mr-2" /> Aluguer de carro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setActiveForm("other"); setOtherDraft((d) => ({ ...d, sharedBy: initSharedBy() })); }}>
          <Package size={14} className="mr-2" /> Outro
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
              <p className="text-sm font-medium text-foreground">
                {f.origin} ↔ {f.destination}
                {f.price != null && <span className="text-muted-foreground font-normal"> — {f.price.toFixed(2)}€</span>}
              </p>
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
              <SplitInfo participants={participants} paidBy={f.paidBy} sharedBy={f.sharedBy} price={f.price} />
            </div>
            <button onClick={() => onRemoveFlight(f.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors mt-1">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={f.id} className="rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0">
            <ArrowRight size={14} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {f.origin} → {f.destination}
              {f.flightNumber && <span className="text-muted-foreground font-normal"> · {f.flightNumber}</span>}
              {f.price != null && <span className="text-muted-foreground font-normal"> — {f.price.toFixed(2)}€</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {f.departureTime && `${f.departureTime}`}{f.arrivalTime && ` → ${f.arrivalTime}`}
            </p>
            <SplitInfo participants={participants} paidBy={f.paidBy} sharedBy={f.sharedBy} price={f.price} />
          </div>
          <button onClick={() => onRemoveFlight(f.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
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

      {flights.map(renderFlightCard)}

      {accommodations.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0">
            <Hotel size={14} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {a.placeName}
              {a.price != null && <span className="text-muted-foreground font-normal"> — {a.price.toFixed(2)}€</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(a.checkIn)} – {formatDate(a.checkOut)}{a.address && ` · ${a.address}`}
            </p>
            <SplitInfo participants={participants} paidBy={a.paidBy} sharedBy={a.sharedBy} price={a.price} />
          </div>
          <button onClick={() => onRemoveAccommodation(a.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
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
            <p className="text-sm font-medium text-foreground truncate">
              {c.company}
              {c.price != null && <span className="text-muted-foreground font-normal"> — {c.price.toFixed(2)}€</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(c.pickupDate)} – {formatDate(c.dropoffDate)}
            </p>
            <SplitInfo participants={participants} paidBy={c.paidBy} sharedBy={c.sharedBy} price={c.price} />
          </div>
          <button onClick={() => onRemoveCar(c.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {otherDetails.map((o) => (
        <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0">
            <Package size={14} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {o.description}
              {o.price != null && <span className="text-muted-foreground font-normal"> — {o.price.toFixed(2)}€</span>}
            </p>
            {o.notes && <p className="text-xs text-muted-foreground italic">{o.notes}</p>}
            <SplitInfo participants={participants} paidBy={o.paidBy} sharedBy={o.sharedBy} price={o.price} />
          </div>
          <button onClick={() => onRemoveOther?.(o.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
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
                <Button size="sm" variant="outline" className="h-10 text-xs flex flex-col gap-0.5" onClick={() => { setFlightMode("roundtrip"); setRtDraft((d) => ({ ...d, sharedBy: initSharedBy() })); }}>
                  <ArrowLeftRight size={14} /> Ida e volta
                </Button>
                <Button size="sm" variant="outline" className="h-10 text-xs flex flex-col gap-0.5" onClick={() => { setFlightMode("oneway"); setOwDraft((d) => ({ ...d, sharedBy: initSharedBy() })); }}>
                  <ArrowRight size={14} /> Voos separados
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
              <ExpenseSplitFields
                participants={participants}
                paidBy={rtDraft.paidBy}
                sharedBy={rtDraft.sharedBy}
                onPaidByChange={(id) => setRtDraft({ ...rtDraft, paidBy: id })}
                onSharedByChange={(ids) => setRtDraft({ ...rtDraft, sharedBy: ids })}
              />
              {rtDraft.price && parseFloat(rtDraft.price) > 0 && participants.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Pagamentos (opcional)</Label>
                  <ExpensePaymentsList
                    totalAmount={parseFloat(rtDraft.price)}
                    payments={rtDraft.expensePayments}
                    participants={participants}
                    onChange={(p) => setRtDraft({ ...rtDraft, expensePayments: p })}
                  />
                </div>
              )}
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
              <ExpenseSplitFields
                participants={participants}
                paidBy={owDraft.paidBy}
                sharedBy={owDraft.sharedBy}
                onPaidByChange={(id) => setOwDraft({ ...owDraft, paidBy: id })}
                onSharedByChange={(ids) => setOwDraft({ ...owDraft, sharedBy: ids })}
              />
              {owDraft.price && parseFloat(owDraft.price) > 0 && participants.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs">Pagamentos (opcional)</Label>
                  <ExpensePaymentsList
                    totalAmount={parseFloat(owDraft.price)}
                    payments={owDraft.expensePayments}
                    participants={participants}
                    onChange={(p) => setOwDraft({ ...owDraft, expensePayments: p })}
                  />
                </div>
              )}
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
          <ExpenseSplitFields
            participants={participants}
            paidBy={accDraft.paidBy}
            sharedBy={accDraft.sharedBy}
            onPaidByChange={(id) => setAccDraft({ ...accDraft, paidBy: id })}
            onSharedByChange={(ids) => setAccDraft({ ...accDraft, sharedBy: ids })}
          />
          {accDraft.price && parseFloat(accDraft.price) > 0 && participants.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Pagamentos (opcional)</Label>
              <ExpensePaymentsList
                totalAmount={parseFloat(accDraft.price)}
                payments={accDraft.expensePayments}
                participants={participants}
                onChange={(p) => setAccDraft({ ...accDraft, expensePayments: p })}
              />
            </div>
          )}
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
          <ExpenseSplitFields
            participants={participants}
            paidBy={carDraft.paidBy}
            sharedBy={carDraft.sharedBy}
            onPaidByChange={(id) => setCarDraft({ ...carDraft, paidBy: id })}
            onSharedByChange={(ids) => setCarDraft({ ...carDraft, sharedBy: ids })}
          />
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={addCar} disabled={!carDraft.company || !carDraft.pickupDate || !carDraft.dropoffDate}>Adicionar</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setActiveForm(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Other form */}
      {activeForm === "other" && (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={14} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Outro detalhe</span>
          </div>
          <div className="space-y-1"><Label className="text-xs">Descrição *</Label><Input className="h-8 text-sm" placeholder="Seguro, transfers..." value={otherDraft.description} onChange={(e) => setOtherDraft({ ...otherDraft, description: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Notas</Label><Textarea className="text-sm resize-none min-h-[50px]" placeholder="Notas..." value={otherDraft.notes} onChange={(e) => setOtherDraft({ ...otherDraft, notes: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">Preço (€)</Label><Input className="h-8 text-sm" type="number" step="0.01" placeholder="0.00" value={otherDraft.price} onChange={(e) => setOtherDraft({ ...otherDraft, price: e.target.value })} /></div>
          <ExpenseSplitFields
            participants={participants}
            paidBy={otherDraft.paidBy}
            sharedBy={otherDraft.sharedBy}
            onPaidByChange={(id) => setOtherDraft({ ...otherDraft, paidBy: id })}
            onSharedByChange={(ids) => setOtherDraft({ ...otherDraft, sharedBy: ids })}
          />
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="flex-1 h-8 text-xs" onClick={addOther} disabled={!otherDraft.description}>Adicionar</Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setActiveForm(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
