import { Trip, Participant } from "@/types/trip";

export interface Balance {
  participantId: string;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  net: number; // positive = should receive, negative = owes
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export function calculateBalances(trip: Trip): Balance[] {
  const participants = trip.participants || [];
  if (participants.length === 0) return [];

  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  participants.forEach((p) => {
    paid[p.id] = 0;
    owed[p.id] = 0;
  });

  // Gather all meals, expenses, and activity expenses from all days
  for (const day of trip.days) {
    for (const meal of day.meals || []) {
      if (paid[meal.paidBy] !== undefined) paid[meal.paidBy] += meal.totalBill;
      const share = meal.totalBill / (meal.sharedBy.length || 1);
      for (const pid of meal.sharedBy) {
        if (owed[pid] !== undefined) owed[pid] += share;
      }
    }
    for (const exp of day.expenses || []) {
      if (paid[exp.paidBy] !== undefined) paid[exp.paidBy] += exp.amount;
      const share = exp.amount / (exp.sharedBy.length || 1);
      for (const pid of exp.sharedBy) {
        if (owed[pid] !== undefined) owed[pid] += share;
      }
    }
    // Activity expenses with splitting
    for (const act of day.activities || []) {
      if (act.cost && act.paidBy && act.sharedBy && act.sharedBy.length > 0) {
        if (paid[act.paidBy] !== undefined) paid[act.paidBy] += act.cost;
        const share = act.cost / act.sharedBy.length;
        for (const pid of act.sharedBy) {
          if (owed[pid] !== undefined) owed[pid] += share;
        }
      }
    }
  }

  // Include trip-level detail expenses (flights, accommodations, cars, other)
  const detailItems = [
    ...(trip.flights || []),
    ...(trip.accommodations || []),
    ...(trip.rentalCars || []),
    ...(trip.otherDetails || []),
  ];
  for (const day of trip.days) {
    detailItems.push(
      ...(day.flights || []),
      ...(day.accommodations || []),
      ...(day.rentalCars || []),
      ...(day.otherDetails || []),
    );
  }
  for (const item of detailItems) {
    if (item.price && item.paidBy && item.sharedBy && item.sharedBy.length > 0) {
      if (paid[item.paidBy] !== undefined) paid[item.paidBy] += item.price;
      const share = item.price / item.sharedBy.length;
      for (const pid of item.sharedBy) {
        if (owed[pid] !== undefined) owed[pid] += share;
      }
    }
  }

  // Factor in payments
  for (const payment of trip.payments || []) {
    if (paid[payment.from] !== undefined) paid[payment.from] += payment.amount;
    if (owed[payment.to] !== undefined) owed[payment.to] += payment.amount;
  }

  return participants.map((p) => ({
    participantId: p.id,
    participantName: p.name,
    totalPaid: paid[p.id] || 0,
    totalOwed: owed[p.id] || 0,
    net: (paid[p.id] || 0) - (owed[p.id] || 0),
  }));
}

export function calculateSettlements(balances: Balance[]): Settlement[] {
  const debtors = balances.filter((b) => b.net < 0).map((b) => ({ ...b, remaining: -b.net }));
  const creditors = balances.filter((b) => b.net > 0).map((b) => ({ ...b, remaining: b.net }));

  debtors.sort((a, b) => b.remaining - a.remaining);
  creditors.sort((a, b) => b.remaining - a.remaining);

  const settlements: Settlement[] = [];
  let di = 0, ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di];
    const c = creditors[ci];
    const amount = Math.min(d.remaining, c.remaining);
    if (amount > 0.01) {
      settlements.push({
        from: d.participantId,
        fromName: d.participantName,
        to: c.participantId,
        toName: c.participantName,
        amount: Math.round(amount * 100) / 100,
      });
    }
    d.remaining -= amount;
    c.remaining -= amount;
    if (d.remaining < 0.01) di++;
    if (c.remaining < 0.01) ci++;
  }

  return settlements;
}
