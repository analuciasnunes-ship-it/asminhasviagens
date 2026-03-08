import { useParams, useNavigate } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import { ArrowLeft, Wallet, ArrowRight, Trash2, Pencil, Plane, Home, UtensilsCrossed, MapPin, ShoppingCart, Receipt, PieChart } from "lucide-react";
import { Trip, Payment } from "@/types/trip";
import { calculateBalances, calculateSettlements, calculateTripTotals } from "@/lib/expenseUtils";
import { AddPaymentDialog } from "@/components/AddPaymentDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

function useExpenseCategories(trip: Trip): CategoryData[] {
  return useMemo(() => {
    // Flights
    const flightItems = [
      ...(trip.flights || []),
      ...trip.days.flatMap((d) => d.flights || []),
    ];
    const flights = flightItems.reduce((s, f) => s + (f.price || 0), 0);

    // Accommodation
    const accItems = [
      ...(trip.accommodations || []),
      ...trip.days.flatMap((d) => d.accommodations || []),
    ];
    const accommodation = accItems.reduce((s, a) => s + (a.price || 0), 0);

    // Meals
    const meals = trip.days.reduce(
      (s, d) => s + (d.meals || []).reduce((ms, m) => ms + m.totalBill, 0),
      0
    );

    // Activities
    const activities = trip.days.reduce(
      (s, d) => s + (d.activities || []).reduce((as, a) => as + (a.cost || 0), 0),
      0
    );

    // Supermarket
    const supermarket = trip.days.reduce(
      (s, d) =>
        s +
        (d.expenses || [])
          .filter((e) => e.type === "supermarket")
          .reduce((es, e) => es + e.amount, 0),
      0
    );

    // Other (rental cars, other details, other expenses)
    const carItems = [
      ...(trip.rentalCars || []),
      ...trip.days.flatMap((d) => d.rentalCars || []),
    ];
    const otherDetailItems = [
      ...(trip.otherDetails || []),
      ...trip.days.flatMap((d) => d.otherDetails || []),
    ];
    const otherExpenses = trip.days.reduce(
      (s, d) =>
        s +
        (d.expenses || [])
          .filter((e) => e.type === "other")
          .reduce((es, e) => es + e.amount, 0),
      0
    );
    const other =
      carItems.reduce((s, c) => s + (c.price || 0), 0) +
      otherDetailItems.reduce((s, o) => s + (o.price || 0), 0) +
      otherExpenses;

    const COLORS = [
      "hsl(var(--primary))",
      "hsl(220, 70%, 55%)",
      "hsl(var(--warning))",
      "hsl(150, 60%, 45%)",
      "hsl(30, 80%, 55%)",
      "hsl(280, 50%, 55%)",
    ];

    return [
      { name: "Voos", value: flights, color: COLORS[0], icon: <Plane size={14} /> },
      { name: "Alojamento", value: accommodation, color: COLORS[1], icon: <Home size={14} /> },
      { name: "Refeições", value: meals, color: COLORS[2], icon: <UtensilsCrossed size={14} /> },
      { name: "Atividades", value: activities, color: COLORS[3], icon: <MapPin size={14} /> },
      { name: "Supermercado", value: supermarket, color: COLORS[4], icon: <ShoppingCart size={14} /> },
      { name: "Outros", value: other, color: COLORS[5], icon: <Receipt size={14} /> },
    ].filter((c) => c.value > 0);
  }, [trip]);
}

const TripExpensesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrip, updateTrip } = useTrips();
  const trip = getTrip(id!);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Viagem não encontrada.</p>
      </div>
    );
  }

  const participants = trip.participants || [];
  const categories = useExpenseCategories(trip);
  const grandTotal = categories.reduce((s, c) => s + c.value, 0);
  const tripTotals = calculateTripTotals(trip);
  const balances = calculateBalances(trip);
  const settlements = calculateSettlements(balances);
  const payments = trip.payments || [];

  const handleAddPayment = (payment: Payment) => {
    const existing = (trip.payments || []).find((p) => p.id === payment.id);
    if (existing) {
      updateTrip({ ...trip, payments: (trip.payments || []).map((p) => (p.id === payment.id ? payment : p)) });
    } else {
      updateTrip({ ...trip, payments: [...(trip.payments || []), payment] });
    }
  };

  const handleDeletePayment = (pid: string) => {
    updateTrip({ ...trip, payments: (trip.payments || []).filter((p) => p.id !== pid) });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value.toFixed(2)}€</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/trip/${id}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Despesas da viagem</h1>
          <p className="text-sm text-muted-foreground mt-1">{trip.destination}</p>
          {grandTotal > 0 && (
            <div className="mt-3 inline-flex items-center bg-secondary px-3 py-1.5 rounded-full">
              <span className="text-sm font-semibold text-foreground">
                Total: {grandTotal.toFixed(2)}€
              </span>
            </div>
          )}
        </header>

        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="balance" className="text-xs">Balanço</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">Categorias</TabsTrigger>
            <TabsTrigger value="settlements" className="text-xs">Acertos</TabsTrigger>
          </TabsList>

          {/* Balance Tab */}
          <TabsContent value="balance" className="space-y-2">
            {balances.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem despesas registadas.</p>
            ) : (
              balances.map((b) => (
                <div key={b.participantId} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
                  <span className="text-sm font-medium text-foreground">{b.participantName}</span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Pagou: {b.totalPaid.toFixed(2)}€</p>
                    <p className={`text-xs font-semibold ${b.net > 0.01 ? "text-success" : b.net < -0.01 ? "text-destructive" : "text-muted-foreground"}`}>
                      {b.net > 0.01 ? `Recebe ${b.net.toFixed(2)}€` : b.net < -0.01 ? `Deve ${(-b.net).toFixed(2)}€` : "Equilibrado"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem despesas registadas.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: cat.color + "20", color: cat.color }}
                        >
                          {cat.icon}
                        </div>
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">{cat.value.toFixed(2)}€</span>
                        {grandTotal > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            {((cat.value / grandTotal) * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Donut Chart */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PieChart size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Distribuição</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsPie>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {categories.map((cat, i) => (
                          <Cell key={i} fill={cat.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RechartsPie>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                    {categories.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-4">
            {settlements.length === 0 && payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem acertos pendentes.</p>
            ) : (
              <>
                {settlements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Acertos sugeridos</h4>
                    {settlements.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-sm">
                        <span className="font-medium text-foreground">{s.fromName}</span>
                        <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground">{s.toName}</span>
                        <span className="ml-auto font-semibold text-primary">{s.amount.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                )}

                {payments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Pagamentos registados</h4>
                    {payments.map((p) => {
                      const fromName = participants.find((x) => x.id === p.from)?.name || "?";
                      const toName = participants.find((x) => x.id === p.to)?.name || "?";
                      return (
                        <div key={p.id} className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-3 py-2.5 text-sm">
                          <span className="text-foreground">{fromName}</span>
                          <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                          <span className="text-foreground">{toName}</span>
                          <span className="ml-auto font-medium text-success">{p.amount.toFixed(2)}€</span>
                          <button onClick={() => { setEditPayment(p); setEditOpen(true); }} className="text-muted-foreground/40 hover:text-primary transition-colors ml-1">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDeletePayment(p.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <AddPaymentDialog participants={participants} onAdd={handleAddPayment} />
            <AddPaymentDialog
              participants={participants}
              onAdd={handleAddPayment}
              editPayment={editPayment || undefined}
              open={editOpen}
              onOpenChange={setEditOpen}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TripExpensesPage;
