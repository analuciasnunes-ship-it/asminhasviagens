import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trip, DayPlan, Activity, Meal, Expense, Flight, Accommodation,
  RentalCar, OtherDetail, Payment, Participant, ExpensePayment
} from "@/types/trip";

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTrips = useCallback(async () => {
    if (!user) { setTrips([]); setLoading(false); return; }

    try {
      // Fetch trips where user is participant or creator
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: false });

      if (tripsError) throw tripsError;
      if (!tripsData?.length) { setTrips([]); setLoading(false); return; }

      const tripIds = tripsData.map(t => t.id);

      // Fetch all related data in parallel
      const [
        { data: participants },
        { data: days },
        { data: flights },
        { data: accommodations },
        { data: rentalCars },
        { data: otherDetails },
        { data: payments },
      ] = await Promise.all([
        supabase.from("trip_participants").select("*").in("trip_id", tripIds),
        supabase.from("days").select("*").in("trip_id", tripIds).order("day_number"),
        supabase.from("flights").select("*").in("trip_id", tripIds),
        supabase.from("accommodations").select("*").in("trip_id", tripIds),
        supabase.from("rental_cars").select("*").in("trip_id", tripIds),
        supabase.from("other_details").select("*").in("trip_id", tripIds),
        supabase.from("payments").select("*").in("trip_id", tripIds),
      ]);

      const dayIds = (days || []).map(d => d.id);

      // Fetch day-level data
      const [
        { data: activities },
        { data: meals },
        { data: expenses },
      ] = await Promise.all([
        dayIds.length ? supabase.from("activities").select("*").in("day_id", dayIds).order("order_index", { ascending: true, nullsFirst: false }) : { data: [] },
        dayIds.length ? supabase.from("meals").select("*").in("day_id", dayIds) : { data: [] },
        dayIds.length ? supabase.from("expenses").select("*").in("day_id", dayIds) : { data: [] },
      ]);

      // Fetch expense payments for all entities
      const activityIds = (activities || []).map(a => a.id);
      const mealIds = (meals || []).map(m => m.id);
      const expenseIds = (expenses || []).map(e => e.id);
      const flightIds = (flights || []).map(f => f.id);
      const accommodationIds = (accommodations || []).map(a => a.id);
      const rentalCarIds = (rentalCars || []).map(r => r.id);
      const otherDetailIds = (otherDetails || []).map(o => o.id);

      const allParentIds = [...activityIds, ...mealIds, ...expenseIds, ...flightIds, ...accommodationIds, ...rentalCarIds, ...otherDetailIds];
      
      const { data: expensePayments } = allParentIds.length
        ? await supabase.from("expense_payments").select("*").in("parent_id", allParentIds)
        : { data: [] };

      // Fetch activity photos
      const { data: photos } = activityIds.length
        ? await supabase.from("activity_photos").select("*").in("activity_id", activityIds)
        : { data: [] };

      // Group data by parent
      const epByParent = new Map<string, ExpensePayment[]>();
      (expensePayments || []).forEach(ep => {
        const list = epByParent.get(ep.parent_id) || [];
        list.push({ id: ep.id, amount: Number(ep.amount), paidBy: ep.paid_by || "", date: ep.date || "", status: ep.status as "paid" | "pending" });
        epByParent.set(ep.parent_id, list);
      });

      const photosByActivity = new Map<string, string[]>();
      (photos || []).forEach(p => {
        const list = photosByActivity.get(p.activity_id) || [];
        list.push(p.url);
        photosByActivity.set(p.activity_id, list);
      });

      // Assemble trips
      const assembledTrips: Trip[] = tripsData.map(t => {
        const tripParticipants: Participant[] = (participants || [])
          .filter(p => p.trip_id === t.id)
          .map(p => ({
            id: p.id,
            name: p.name,
            email: p.email || undefined,
            status: p.status as Participant["status"],
            userId: p.profile_id,
          }));

        const tripDays: DayPlan[] = (days || [])
          .filter(d => d.trip_id === t.id)
          .map(d => {
            const dayActivities: Activity[] = (activities || [])
              .filter(a => a.day_id === d.id)
              .map(a => ({
                id: a.id,
                title: a.title,
                time: a.time || undefined,
                timeLocked: a.time_locked || false,
                estimatedDuration: a.estimated_duration as Activity["estimatedDuration"],
                description: a.description || undefined,
                cost: a.cost ? Number(a.cost) : undefined,
                paidBy: a.paid_by || undefined,
                sharedBy: (a.shared_by as string[]) || [],
                link: a.link || undefined,
                location: a.location || undefined,
                lat: a.lat || undefined,
                lng: a.lng || undefined,
                status: a.status as Activity["status"],
                rating: a.rating || undefined,
                comments: a.comments || undefined,
                photos: photosByActivity.get(a.id) || undefined,
                expensePayments: epByParent.get(a.id),
                orderIndex: a.order_index || undefined,
              }));

            const dayMeals: Meal[] = (meals || [])
              .filter(m => m.day_id === d.id)
              .map(m => ({
                id: m.id,
                type: "meal" as const,
                time: m.time || "",
                restaurantName: m.restaurant_name,
                notes: m.notes || undefined,
                rating: m.rating || undefined,
                totalBill: Number(m.total_bill),
                paidBy: m.paid_by || "",
                sharedBy: (m.shared_by as string[]) || [],
                expensePayments: epByParent.get(m.id),
              }));

            const dayExpenses: Expense[] = (expenses || [])
              .filter(e => e.day_id === d.id)
              .map(e => ({
                id: e.id,
                type: e.type as Expense["type"],
                description: e.description,
                amount: Number(e.amount),
                paidBy: e.paid_by || "",
                sharedBy: (e.shared_by as string[]) || [],
                notes: e.notes || undefined,
                expensePayments: epByParent.get(e.id),
              }));

            return {
              id: d.id,
              date: d.date,
              dayNumber: d.day_number,
              title: d.title || undefined,
              activities: dayActivities,
              meals: dayMeals.length ? dayMeals : undefined,
              expenses: dayExpenses.length ? dayExpenses : undefined,
            };
          });

        const tripFlights: Flight[] = (flights || [])
          .filter(f => f.trip_id === t.id)
          .map(f => ({
            id: f.id,
            type: f.type as Flight["type"],
            origin: f.origin,
            destination: f.destination,
            flightNumber: f.flight_number || undefined,
            departureTime: f.departure_time || undefined,
            arrivalTime: f.arrival_time || undefined,
            returnDepartureTime: f.return_departure_time || undefined,
            returnArrivalTime: f.return_arrival_time || undefined,
            price: f.price ? Number(f.price) : undefined,
            paidBy: f.paid_by || undefined,
            sharedBy: (f.shared_by as string[]) || [],
            expensePayments: epByParent.get(f.id),
          }));

        const tripAccommodations: Accommodation[] = (accommodations || [])
          .filter(a => a.trip_id === t.id)
          .map(a => ({
            id: a.id,
            placeName: a.place_name,
            address: a.address || undefined,
            checkIn: a.check_in,
            checkOut: a.check_out,
            price: a.price ? Number(a.price) : undefined,
            paidBy: a.paid_by || undefined,
            sharedBy: (a.shared_by as string[]) || [],
            expensePayments: epByParent.get(a.id),
          }));

        const tripRentalCars: RentalCar[] = (rentalCars || [])
          .filter(r => r.trip_id === t.id)
          .map(r => ({
            id: r.id,
            company: r.company,
            pickupDate: r.pickup_date,
            dropoffDate: r.dropoff_date,
            price: r.price ? Number(r.price) : undefined,
            paidBy: r.paid_by || undefined,
            sharedBy: (r.shared_by as string[]) || [],
            expensePayments: epByParent.get(r.id),
          }));

        const tripOtherDetails: OtherDetail[] = (otherDetails || [])
          .filter(o => o.trip_id === t.id)
          .map(o => ({
            id: o.id,
            description: o.description,
            notes: o.notes || undefined,
            price: o.price ? Number(o.price) : undefined,
            paidBy: o.paid_by || undefined,
            sharedBy: (o.shared_by as string[]) || [],
            expensePayments: epByParent.get(o.id),
          }));

        const tripPayments: Payment[] = (payments || [])
          .filter(p => p.trip_id === t.id)
          .map(p => ({
            id: p.id,
            from: p.from_participant,
            to: p.to_participant,
            amount: Number(p.amount),
            date: p.date,
          }));

        return {
          id: t.id,
          destination: t.destination,
          startDate: t.start_date,
          endDate: t.end_date,
          coverImage: t.cover_image || undefined,
          inviteToken: (t as any).invite_token || undefined,
          participants: tripParticipants,
          flights: tripFlights,
          accommodations: tripAccommodations,
          rentalCars: tripRentalCars,
          otherDetails: tripOtherDetails.length ? tripOtherDetails : undefined,
          days: tripDays,
          payments: tripPayments.length ? tripPayments : undefined,
        };
      });

      setTrips(assembledTrips);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const addTrip = async (trip: Trip) => {
    if (!user) return;

    const { error: tripError } = await supabase.from("trips").insert({
      id: trip.id,
      destination: trip.destination,
      start_date: trip.startDate,
      end_date: trip.endDate,
      cover_image: trip.coverImage || null,
      created_by: user.id,
    });
    if (tripError) { console.error(tripError); return; }

    // Add creator as active participant
    const creatorParticipant = {
      id: crypto.randomUUID(),
      trip_id: trip.id,
      profile_id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Eu",
      email: user.email || null,
      status: "active" as const,
    };

    const participantInserts = [
      creatorParticipant,
      ...trip.participants.map(p => ({
        id: p.id,
        trip_id: trip.id,
        profile_id: null,
        name: p.name,
        email: p.email || null,
        status: (p.status || "invited") as "active" | "invited" | "pending",
      })),
    ];

    await supabase.from("trip_participants").insert(participantInserts);

    // Insert days
    if (trip.days.length) {
      await supabase.from("days").insert(
        trip.days.map(d => ({
          id: d.id,
          trip_id: trip.id,
          date: d.date,
          day_number: d.dayNumber,
          title: d.title || null,
        }))
      );
    }

    await fetchTrips();
  };

  const updateTrip = async (updated: Trip) => {
    // Update trip metadata
    await supabase.from("trips").update({
      destination: updated.destination,
      start_date: updated.startDate,
      end_date: updated.endDate,
      cover_image: updated.coverImage || null,
    }).eq("id", updated.id);

    // Sync participants
    await syncParticipants(updated);
    // Sync days, activities, meals, expenses
    await syncDays(updated);
    // Sync trip-level entities
    await syncFlights(updated);
    await syncAccommodations(updated);
    await syncRentalCars(updated);
    await syncOtherDetails(updated);
    await syncPayments(updated);

    await fetchTrips();
  };

  const deleteTrip = async (id: string) => {
    await supabase.from("trips").delete().eq("id", id);
    await fetchTrips();
  };

  const getTrip = (id: string) => trips.find(t => t.id === id);

  return { trips, loading, addTrip, updateTrip, deleteTrip, getTrip, refetch: fetchTrips };
}

// ---- Sync helpers ----

async function syncParticipants(trip: Trip) {
  const { data: existing } = await supabase.from("trip_participants").select("id").eq("trip_id", trip.id);
  const existingIds = new Set((existing || []).map(e => e.id));
  const newIds = new Set(trip.participants.map(p => p.id));

  // Delete removed
  const toDelete = [...existingIds].filter(id => !newIds.has(id));
  if (toDelete.length) await supabase.from("trip_participants").delete().in("id", toDelete);

  // Upsert all current
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

async function syncDays(trip: Trip) {
  // Get existing days
  const { data: existingDays } = await supabase.from("days").select("id").eq("trip_id", trip.id);
  const existingDayIds = new Set((existingDays || []).map(d => d.id));
  const newDayIds = new Set(trip.days.map(d => d.id));

  // Delete removed days (cascade will delete activities, meals, expenses)
  const daysToDelete = [...existingDayIds].filter(id => !newDayIds.has(id));
  if (daysToDelete.length) await supabase.from("days").delete().in("id", daysToDelete);

  // Upsert days
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

  // Sync activities, meals, expenses for each day
  for (const day of trip.days) {
    await syncActivities(day);
    await syncMeals(day);
    await syncExpenses(day);
  }
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

    // Sync expense payments for activities
    for (const a of day.activities) {
      if (a.expensePayments) {
        await syncExpensePayments("activity", a.id, a.expensePayments);
      }
    }
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
        restaurant_name: m.restaurantName,
        notes: m.notes || null,
        rating: m.rating ?? null,
        total_bill: m.totalBill,
        paid_by: m.paidBy || null,
        shared_by: m.sharedBy || [],
      }))
    );

    // Sync expense payments for meals
    for (const m of dayMeals) {
      if (m.expensePayments) {
        await syncExpensePayments("meal", m.id, m.expensePayments);
      }
    }
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

    // Sync expense payments for expenses
    for (const e of dayExpenses) {
      if (e.expensePayments) {
        await syncExpensePayments("expense", e.id, e.expensePayments);
      }
    }
  }
}

async function syncFlights(trip: Trip) {
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
  }
}

async function syncAccommodations(trip: Trip) {
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

    // Sync expense payments for accommodations
    for (const a of trip.accommodations) {
      if (a.expensePayments) {
        await syncExpensePayments("accommodation", a.id, a.expensePayments);
      }
    }
  }
}

async function syncRentalCars(trip: Trip) {
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
  }
}

async function syncOtherDetails(trip: Trip) {
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
  }
}

async function syncPayments(trip: Trip) {
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
