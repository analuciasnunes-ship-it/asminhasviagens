import { Trip, Participant, ExpensePayment } from "@/types/trip";

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

/**
 * Returns the effectively paid amount for an item.
 * If the item has expensePayments, only sum "paid" ones.
 * If no expensePayments, treat as fully paid (backward compat).
 */
export function getEffectivePaidAmount(
  totalAmount: number,
  expensePayments?: ExpensePayment[]
): number {
  if (!expensePayments || expensePayments.length === 0) return totalAmount;
  return expensePayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Returns { paid, remaining } for display purposes.
 */
export function getPaymentStatus(
  totalAmount: number,
  expensePayments?: ExpensePayment[]
): { paid: number; remaining: number; hasPlan: boolean } {
  if (!expensePayments || expensePayments.length === 0) {
    return { paid: totalAmount, remaining: 0, hasPlan: false };
  }
  const paid = expensePayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  return { paid, remaining: totalAmount - paid, hasPlan: true };
}

/**
 * Calculates trip-wide paid and pending totals across all expense types.
 */
export function calculateTripTotals(trip: Trip): { total: number; paid: number; pending: number } {
  let total = 0;
  let paid = 0;

  const processItem = (amount: number, ep?: ExpensePayment[]) => {
    total += amount;
    paid += getEffectivePaidAmount(amount, ep);
  };

  for (const day of trip.days) {
    for (const m of day.meals || []) processItem(m.totalBill, m.expensePayments);
    for (const e of day.expenses || []) processItem(e.amount, e.expensePayments);
    for (const a of day.activities || []) {
      if (a.cost) processItem(a.cost, a.expensePayments);
    }
  }

  const detailItems = [
    ...(trip.flights || []),
    ...(trip.accommodations || []),
    ...(trip.rentalCars || []),
    ...(trip.otherDetails || []),
    ...trip.days.flatMap((d) => [
      ...(d.flights || []),
      ...(d.accommodations || []),
      ...(d.rentalCars || []),
      ...(d.otherDetails || []),
    ]),
  ];
  for (const item of detailItems) {
    if (item.price) processItem(item.price, item.expensePayments);
  }

  return { total, paid, pending: total - paid };
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

  // Helper: process an item with potential partial payments
  const processItem = (
    totalAmount: number,
    paidBy: string,
    sharedBy: string[],
    expensePayments?: ExpensePayment[]
  ) => {
    const effectiveAmount = getEffectivePaidAmount(totalAmount, expensePayments);

    if (expensePayments && expensePayments.length > 0) {
      // With partial payments, each payment's paidBy is credited
      for (const ep of expensePayments) {
        if (ep.status === "paid" && paid[ep.paidBy] !== undefined) {
          paid[ep.paidBy] += ep.amount;
        }
      }
    } else {
      // Legacy: single payer for full amount
      if (paid[paidBy] !== undefined) paid[paidBy] += totalAmount;
    }

    // Only owe the effectively paid portion
    const share = effectiveAmount / (sharedBy.length || 1);
    for (const pid of sharedBy) {
      if (owed[pid] !== undefined) owed[pid] += share;
    }
  };

  // Gather all meals, expenses, and activity expenses from all days
  for (const day of trip.days) {
    for (const meal of day.meals || []) {
      if ((meal.totalBill ?? 0) > 0 && meal.paidBy && meal.sharedBy && meal.sharedBy.length > 0) {
        processItem(meal.totalBill!, meal.paidBy, meal.sharedBy, meal.expensePayments);
      }
    }
    for (const exp of day.expenses || []) {
      processItem(exp.amount, exp.paidBy, exp.sharedBy, exp.expensePayments);
    }
    // Activity expenses with splitting
    for (const act of day.activities || []) {
      if (act.cost && act.paidBy && act.sharedBy && act.sharedBy.length > 0) {
        processItem(act.cost, act.paidBy, act.sharedBy, act.expensePayments);
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
      processItem(item.price, item.paidBy, item.sharedBy, item.expensePayments);
    }
  }

  // Factor in payments (trip-level settlement payments)
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
