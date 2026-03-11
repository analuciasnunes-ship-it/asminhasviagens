-- Clean up existing duplicates (keep earliest)
DELETE FROM public.trip_participants a
USING public.trip_participants b
WHERE a.trip_id = b.trip_id
  AND a.profile_id = b.profile_id
  AND a.profile_id IS NOT NULL
  AND a.created_at > b.created_at;

-- Add unique partial index to prevent future duplicates
CREATE UNIQUE INDEX unique_trip_profile ON public.trip_participants (trip_id, profile_id) WHERE profile_id IS NOT NULL;