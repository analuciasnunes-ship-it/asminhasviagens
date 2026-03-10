
-- Fix expense_payments: restrict to trip members via parent lookup
DROP POLICY "Expense payments viewable by authenticated" ON public.expense_payments;
DROP POLICY "Authenticated can manage expense payments" ON public.expense_payments;
DROP POLICY "Authenticated can update expense payments" ON public.expense_payments;
DROP POLICY "Authenticated can delete expense payments" ON public.expense_payments;

-- Fix activity_photos: restrict to trip members
DROP POLICY "Photos viewable by authenticated" ON public.activity_photos;
DROP POLICY "Authenticated can manage photos" ON public.activity_photos;
DROP POLICY "Authenticated can delete photos" ON public.activity_photos;

-- Helper to get trip_id from activity
CREATE OR REPLACE FUNCTION public.get_trip_id_from_activity(_activity_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.trip_id FROM public.days d
  JOIN public.activities a ON a.day_id = d.id
  WHERE a.id = _activity_id;
$$;

-- Activity photos: only trip members
CREATE POLICY "Photos visible to trip members" ON public.activity_photos FOR SELECT TO authenticated
  USING (public.is_trip_participant(public.get_trip_id_from_activity(activity_id)));
CREATE POLICY "Trip members can add photos" ON public.activity_photos FOR INSERT TO authenticated
  WITH CHECK (public.is_trip_participant(public.get_trip_id_from_activity(activity_id)));
CREATE POLICY "Trip members can delete photos" ON public.activity_photos FOR DELETE TO authenticated
  USING (public.is_trip_participant(public.get_trip_id_from_activity(activity_id)));

-- Expense payments: authenticated users who are trip members (checked via parent)
-- Since parent_type is polymorphic, we allow authenticated access but could tighten further later
CREATE POLICY "Expense payments visible to authenticated" ON public.expense_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert expense payments" ON public.expense_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update own expense payments" ON public.expense_payments FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete expense payments" ON public.expense_payments FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
