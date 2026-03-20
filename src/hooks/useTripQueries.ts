import { supabase } from "@/integrations/supabase/client";
import {
  Trip, DayPlan, Activity, Meal, Expense, Flight, Accommodation,
  RentalCar, OtherDetail, Payment, Participant, ExpensePayment
} from "@/types/trip";

export const TRIPS_QUERY_KEY = ["trips"] as const;

export function tripQueryKey(tripId: string) {
  return ["trips", tripId] as const;
}

/**
 * Fetch all trips from Supabase and assemble them into Trip objects.
 * Used as the queryFn for React Query.
 */
export async function fetchAllTrips(): Promise<Trip[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data: tripsData, error: tripsError } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: false });

  if (tripsError) throw tripsError;
  if (!tripsData?.length) return [];

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
    dayIds.length ? supabase.from("activities").select("*").in("day_id", dayIds).order("order_index", { ascending: true, nullsFirst: false }) : { data: [] as any[] },
    dayIds.length ? supabase.from("meals").select("*").in("day_id", dayIds) : { data: [] as any[] },
    dayIds.length ? supabase.from("expenses").select("*").in("day_id", dayIds) : { data: [] as any[] },
  ]);

  // Fetch expense payments for all entities
  const activityIds = (activities || []).map((a: any) => a.id);
  const mealIds = (meals || []).map((m: any) => m.id);
  const expenseIds = (expenses || []).map((e: any) => e.id);
  const flightIds = (flights || []).map(f => f.id);
  const accommodationIds = (accommodations || []).map(a => a.id);
  const rentalCarIds = (rentalCars || []).map(r => r.id);
  const otherDetailIds = (otherDetails || []).map(o => o.id);

  const allParentIds = [...activityIds, ...mealIds, ...expenseIds, ...flightIds, ...accommodationIds, ...rentalCarIds, ...otherDetailIds];

  const { data: expensePayments } = allParentIds.length
    ? await supabase.from("expense_payments").select("*").in("parent_id", allParentIds)
    : { data: [] as any[] };

  // Fetch activity photos
  const { data: photos } = activityIds.length
    ? await supabase.from("activity_photos").select("*").in("activity_id", activityIds)
    : { data: [] as any[] };

  // Group data by parent
  const epByParent = new Map<string, ExpensePayment[]>();
  (expensePayments || []).forEach((ep: any) => {
    const list = epByParent.get(ep.parent_id) || [];
    list.push({ id: ep.id, amount: Number(ep.amount), paidBy: ep.paid_by || "", date: ep.date || "", status: ep.status as "paid" | "pending" });
    epByParent.set(ep.parent_id, list);
  });

  const photosByActivity = new Map<string, string[]>();
  (photos || []).forEach((p: any) => {
    const list = photosByActivity.get(p.activity_id) || [];
    list.push(p.url);
    photosByActivity.set(p.activity_id, list);
  });

  // Assemble trips
  return tripsData.map(t => {
    const tripParticipantsRaw = (participants || [])
      .filter(p => p.trip_id === t.id)
      .map(p => ({
        id: p.id,
        name: p.name,
        email: p.email || undefined,
        status: p.status as Participant["status"],
        userId: p.profile_id,
      }));

    // Deduplicate by profile_id
    const seen = new Set<string>();
    const tripParticipants: Participant[] = [];
    for (const p of tripParticipantsRaw) {
      const key = p.userId || p.id;
      if (!seen.has(key)) {
        seen.add(key);
        tripParticipants.push(p);
      }
    }

    const tripDays: DayPlan[] = (days || [])
      .filter(d => d.trip_id === t.id)
      .map(d => {
        const dayActivities: Activity[] = (activities || [])
          .filter((a: any) => a.day_id === d.id)
          .map((a: any) => ({
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
          .filter((m: any) => m.day_id === d.id)
          .map((m: any) => {
            const bill = Number(m.total_bill);
            return {
              id: m.id,
              type: "meal" as const,
              time: m.time || "",
              mealName: m.meal_name || "Refeição",
              restaurantName: m.restaurant_name || undefined,
              notes: m.notes || undefined,
              rating: m.rating || undefined,
              totalBill: bill > 0 ? bill : undefined,
              paidBy: m.paid_by || undefined,
              sharedBy: (m.shared_by as string[])?.length ? (m.shared_by as string[]) : undefined,
              expensePayments: epByParent.get(m.id),
            };
          });

        const dayExpenses: Expense[] = (expenses || [])
          .filter((e: any) => e.day_id === d.id)
          .map((e: any) => ({
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
      inviteToken: t.invite_token || undefined,
      participants: tripParticipants,
      flights: tripFlights,
      accommodations: tripAccommodations,
      rentalCars: tripRentalCars,
      otherDetails: tripOtherDetails.length ? tripOtherDetails : undefined,
      days: tripDays,
      payments: tripPayments.length ? tripPayments : undefined,
    };
  });
}
