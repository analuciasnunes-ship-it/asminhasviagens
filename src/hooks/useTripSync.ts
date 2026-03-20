import { supabase } from "@/integrations/supabase/client";
import {
  Trip, DayPlan, Activity, Meal, Expense, Flight, Accommodation,
  RentalCar, OtherDetail, ExpensePayment
} from "@/types/trip";

// ---- Sync helpers ----

export async function syncParticipants(trip: Trip) {
  const { data: existing } = await supabase.from("trip_participants").select("id").eq("trip_id", trip.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(trip.participants.map(p => p.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("trip_participants").delete().in("id", toDelete);

  if (trip.participants.length) {
    await supabase.from("trip_participants").upsert(
      trip.participants.map(p => ({
        id: p.id,
        trip_id: trip.id,
        profile_id: p.userId || null,
        name: p.name,
        email: p.email || null,
        status: (p.status || "invited") as "active" | "invited" | "pending",
      }))
    );
  }
}

export async function syncDays(trip: Trip) {
  const { data: existingDays } = await supabase.from("days").select("id").eq("trip_id", trip.id);
  const existingDayIds = new Set((existingDays || []).map(d => d.id));
  const newDayIds = new Set(trip.days.map(d => d.id));

  const daysToDelete = [...existingDayIds].filter(id => !newDayIds.has(id));
  if (daysToDelete.length) await supabase.from("days").delete().in("id", daysToDelete);

  if (trip.days.length) {
    await supabase.from("days").upsert(
      trip.days.map(d => ({
        id: d.id,
        trip_id: trip.id,
        date: d.date,
        day_number: d.dayNumber,
        title: d.title || null,
      }))
    );
  }

  // Sync activities, meals, expenses for all days in parallel
  await Promise.all(trip.days.map(async (day) => {
    await Promise.all([
      syncActivities(day),
      syncMeals(day),
      syncExpenses(day),
    ]);
  }));
}

async function syncActivities(day: DayPlan) {
  const { data: existing } = await supabase.from("activities").select("id").eq("day_id", day.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(day.activities.map(a => a.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("activities").delete().in("id", toDelete);

  if (day.activities.length) {
    await supabase.from("activities").upsert(
      day.activities.map(a => ({
        id: a.id,
        day_id: day.id,
        title: a.title,
        time: a.time || null,
        time_locked: a.timeLocked || false,
        estimated_duration: a.estimatedDuration || null,
        description: a.description || null,
        cost: a.cost ?? null,
        paid_by: a.paidBy || null,
        shared_by: a.sharedBy || [],
        link: a.link || null,
        location: a.location || null,
        lat: a.lat ?? null,
        lng: a.lng ?? null,
        status: a.status,
        rating: a.rating ?? null,
        comments: a.comments || null,
        order_index: a.orderIndex ?? null,
      }))
    );

    await Promise.all(
      day.activities
        .filter(a => a.expensePayments)
        .map(a => syncExpensePayments("activity", a.id, a.expensePayments!))
    );
  }
}

async function syncMeals(day: DayPlan) {
  const dayMeals = day.meals || [];
  const { data: existing } = await supabase.from("meals").select("id").eq("day_id", day.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(dayMeals.map(m => m.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("meals").delete().in("id", toDelete);

  if (dayMeals.length) {
    await supabase.from("meals").upsert(
      dayMeals.map(m => ({
        id: m.id,
        day_id: day.id,
        time: m.time || null,
        meal_name: m.mealName || "Refeição",
        restaurant_name: m.restaurantName || "",
        notes: m.notes || null,
        rating: m.rating ?? null,
        total_bill: m.totalBill ?? 0,
        paid_by: m.paidBy || null,
        shared_by: m.sharedBy || [],
      }))
    );

    await Promise.all(
      dayMeals
        .filter(m => m.expensePayments)
        .map(m => syncExpensePayments("meal", m.id, m.expensePayments!))
    );
  }
}

async function syncExpenses(day: DayPlan) {
  const dayExpenses = day.expenses || [];
  const { data: existing } = await supabase.from("expenses").select("id").eq("day_id", day.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(dayExpenses.map(e => e.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("expenses").delete().in("id", toDelete);

  if (dayExpenses.length) {
    await supabase.from("expenses").upsert(
      dayExpenses.map(e => ({
        id: e.id,
        day_id: day.id,
        type: e.type,
        description: e.description,
        amount: e.amount,
        paid_by: e.paidBy || null,
        shared_by: e.sharedBy || [],
        notes: e.notes || null,
      }))
    );

    await Promise.all(
      dayExpenses
        .filter(e => e.expensePayments)
        .map(e => syncExpensePayments("expense", e.id, e.expensePayments!))
    );
  }
}

export async function syncFlights(trip: Trip) {
  const { data: existing } = await supabase.from("flights").select("id").eq("trip_id", trip.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(trip.flights.map(f => f.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("flights").delete().in("id", toDelete);

  if (trip.flights.length) {
    await supabase.from("flights").upsert(
      trip.flights.map(f => ({
        id: f.id,
        trip_id: trip.id,
        type: f.type,
        origin: f.origin,
        destination: f.destination,
        flight_number: f.flightNumber || null,
        departure_time: f.departureTime || null,
        arrival_time: f.arrivalTime || null,
        return_departure_time: f.returnDepartureTime || null,
        return_arrival_time: f.returnArrivalTime || null,
        price: f.price ?? null,
        paid_by: f.paidBy || null,
        shared_by: f.sharedBy || [],
      }))
    );

    await Promise.all(
      trip.flights
        .filter(f => f.expensePayments)
        .map(f => syncExpensePayments("flight", f.id, f.expensePayments!))
    );
  }
}

export async function syncAccommodations(trip: Trip) {
  const { data: existing } = await supabase.from("accommodations").select("id").eq("trip_id", trip.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(trip.accommodations.map(a => a.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("accommodations").delete().in("id", toDelete);

  if (trip.accommodations.length) {
    await supabase.from("accommodations").upsert(
      trip.accommodations.map(a => ({
        id: a.id,
        trip_id: trip.id,
        place_name: a.placeName,
        address: a.address || null,
        check_in: a.checkIn,
        check_out: a.checkOut,
        price: a.price ?? null,
        paid_by: a.paidBy || null,
        shared_by: a.sharedBy || [],
      }))
    );

    await Promise.all(
      trip.accommodations
        .filter(a => a.expensePayments)
        .map(a => syncExpensePayments("accommodation", a.id, a.expensePayments!))
    );
  }
}

export async function syncRentalCars(trip: Trip) {
  const { data: existing } = await supabase.from("rental_cars").select("id").eq("trip_id", trip.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(trip.rentalCars.map(r => r.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("rental_cars").delete().in("id", toDelete);

  if (trip.rentalCars.length) {
    await supabase.from("rental_cars").upsert(
      trip.rentalCars.map(r => ({
        id: r.id,
        trip_id: trip.id,
        company: r.company,
        pickup_date: r.pickupDate,
        dropoff_date: r.dropoffDate,
        price: r.price ?? null,
        paid_by: r.paidBy || null,
        shared_by: r.sharedBy || [],
      }))
    );

    await Promise.all(
      trip.rentalCars
        .filter(r => r.expensePayments)
        .map(r => syncExpensePayments("rental_car", r.id, r.expensePayments!))
    );
  }
}

export async function syncOtherDetails(trip: Trip) {
  const details = trip.otherDetails || [];
  const { data: existing } = await supabase.from("other_details").select("id").eq("trip_id", trip.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(details.map(o => o.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("other_details").delete().in("id", toDelete);

  if (details.length) {
    await supabase.from("other_details").upsert(
      details.map(o => ({
        id: o.id,
        trip_id: trip.id,
        description: o.description,
        notes: o.notes || null,
        price: o.price ?? null,
        paid_by: o.paidBy || null,
        shared_by: o.sharedBy || [],
      }))
    );

    await Promise.all(
      details
        .filter(o => o.expensePayments)
        .map(o => syncExpensePayments("other_detail", o.id, o.expensePayments!))
    );
  }
}

export async function syncPayments(trip: Trip) {
  const tripPayments = trip.payments || [];
  const { data: existing } = await supabase.from("payments").select("id").eq("trip_id", trip.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(tripPayments.map(p => p.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("payments").delete().in("id", toDelete);

  if (tripPayments.length) {
    await supabase.from("payments").upsert(
      tripPayments.map(p => ({
        id: p.id,
        trip_id: trip.id,
        from_participant: p.from,
        to_participant: p.to,
        amount: p.amount,
        date: p.date,
      }))
    );
  }
}

async function syncExpensePayments(parentType: string, parentId: string, payments: ExpensePayment[]) {
  const { data: existing } = await supabase.from("expense_payments").select("id").eq("parent_id", parentId);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(payments.map(p => p.id));

  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("expense_payments").delete().in("id", toDelete);

  if (payments.length) {
    await supabase.from("expense_payments").upsert(
      payments.map(p => ({
        id: p.id,
        parent_type: parentType,
        parent_id: parentId,
        amount: p.amount,
        paid_by: p.paidBy || null,
        date: p.date || null,
        status: p.status,
      }))
    );
  }
}

/**
 * Run all sync operations for a trip update in parallel where possible.
 */
export async function syncAllTripData(trip: Trip) {
  await supabase.from("trips").update({
    destination: trip.destination,
    start_date: trip.startDate,
    end_date: trip.endDate,
    cover_image: trip.coverImage || null,
  }).eq("id", trip.id);

  // Sync all independent entities in parallel
  await Promise.all([
    syncParticipants(trip),
    syncDays(trip),
    syncFlights(trip),
    syncAccommodations(trip),
    syncRentalCars(trip),
    syncOtherDetails(trip),
    syncPayments(trip),
  ]);
}
