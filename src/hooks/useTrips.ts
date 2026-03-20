import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trip } from "@/types/trip";
import { TRIPS_QUERY_KEY, fetchAllTrips } from "./useTripQueries";
import { syncAllTripData } from "./useTripSync";

export function useTrips() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ---- Query ----
  const {
    data: trips = [],
    isLoading: loading,
  } = useQuery({
    queryKey: TRIPS_QUERY_KEY,
    queryFn: fetchAllTrips,
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 min — avoid re-fetches on tab switches
    refetchOnWindowFocus: false,
  });

  // ---- Add Trip ----
  const addTripMutation = useMutation({
    mutationFn: async (trip: Trip) => {
      if (!user) throw new Error("Not authenticated");

      const { error: tripError } = await supabase.from("trips").insert({
        id: trip.id,
        destination: trip.destination,
        start_date: trip.startDate,
        end_date: trip.endDate,
        cover_image: trip.coverImage || null,
        created_by: user.id,
      });
      if (tripError) throw tripError;

      // Add creator as active participant
      const participantInserts = [
        {
          id: crypto.randomUUID(),
          trip_id: trip.id,
          profile_id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Eu",
          email: user.email || null,
          status: "active" as const,
        },
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

      return trip;
    },
    onMutate: async (newTrip) => {
      await queryClient.cancelQueries({ queryKey: TRIPS_QUERY_KEY });
      const previous = queryClient.getQueryData<Trip[]>(TRIPS_QUERY_KEY);
      queryClient.setQueryData<Trip[]>(TRIPS_QUERY_KEY, old => [newTrip, ...(old || [])]);
      return { previous };
    },
    onError: (_err, _trip, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TRIPS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY });
    },
  });

  // ---- Update Trip ----
  const updateTripMutation = useMutation({
    mutationFn: async (updated: Trip) => {
      await syncAllTripData(updated);
      return updated;
    },
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: TRIPS_QUERY_KEY });
      const previous = queryClient.getQueryData<Trip[]>(TRIPS_QUERY_KEY);

      // Optimistic update: replace trip in cache immediately
      queryClient.setQueryData<Trip[]>(TRIPS_QUERY_KEY, old =>
        (old || []).map(t => t.id === updated.id ? updated : t)
      );

      return { previous };
    },
    onError: (_err, _updated, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TRIPS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      // Re-fetch from server to reconcile after sync completes
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY });
    },
  });

  // ---- Delete Trip ----
  const deleteTripMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("trips").delete().eq("id", id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TRIPS_QUERY_KEY });
      const previous = queryClient.getQueryData<Trip[]>(TRIPS_QUERY_KEY);
      queryClient.setQueryData<Trip[]>(TRIPS_QUERY_KEY, old =>
        (old || []).filter(t => t.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TRIPS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY });
    },
  });

  // ---- Public API (same shape as before) ----
  const addTrip = (trip: Trip) => addTripMutation.mutate(trip);
  const updateTrip = (updated: Trip) => updateTripMutation.mutate(updated);
  const deleteTrip = (id: string) => deleteTripMutation.mutate(id);
  const getTrip = (id: string) => trips.find(t => t.id === id);
  const refetch = () => queryClient.invalidateQueries({ queryKey: TRIPS_QUERY_KEY });

  return { trips, loading, addTrip, updateTrip, deleteTrip, getTrip, refetch };
}
