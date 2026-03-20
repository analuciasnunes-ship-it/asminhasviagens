import { Trip } from "@/types/trip";

/**
 * Calculate the total cost of a trip across all days and detail items.
 * Reusable across TripPage, DayPage, TripExpenseSummaryCard, TripExpensesPage.
 */
export function calculateTotalTripCost(trip: Trip): number {
  const dayCost = trip.days.reduce((sum, day) => {
    const mealCost = (day.meals || []).reduce((s, m) => s + (m.totalBill ?? 0), 0);
    const expCost = (day.expenses || []).reduce((s, e) => s + e.amount, 0);
    const actCost = (day.activities || []).reduce((s, a) => s + (a.cost || 0), 0);
    return sum + mealCost + expCost + actCost;
  }, 0);

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
  const detailCost = detailItems.reduce((s, item) => s + (item.price || 0), 0);

  return dayCost + detailCost;
}

/**
 * Count expense-related items in a trip.
 */
export function countTripExpenseItems(trip: Trip) {
  const mealCount = trip.days.reduce((s, d) => s + (d.meals || []).length, 0);
  const expenseCount = trip.days.reduce((s, d) => s + (d.expenses || []).length, 0);
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
  const detailCount = detailItems.filter((d) => d.price).length;
  return { mealCount, expenseCount, detailCount, totalItems: mealCount + expenseCount + detailCount };
}
