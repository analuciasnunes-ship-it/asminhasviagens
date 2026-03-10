
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trip participants
CREATE TYPE public.participant_status AS ENUM ('active', 'invited', 'pending');

CREATE TABLE public.trip_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  status participant_status NOT NULL DEFAULT 'invited',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

-- RLS: Users can see/manage trips they participate in
CREATE OR REPLACE FUNCTION public.is_trip_participant(_trip_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_participants
    WHERE trip_id = _trip_id AND profile_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = _trip_id AND created_by = auth.uid()
  );
$$;

CREATE POLICY "Trip participants can view trip" ON public.trips FOR SELECT TO authenticated USING (public.is_trip_participant(id));
CREATE POLICY "Trip creator can insert" ON public.trips FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Trip participants can update" ON public.trips FOR UPDATE TO authenticated USING (public.is_trip_participant(id));
CREATE POLICY "Trip creator can delete" ON public.trips FOR DELETE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Participants visible to trip members" ON public.trip_participants FOR SELECT TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can add participants" ON public.trip_participants FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can update participants" ON public.trip_participants FOR UPDATE TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can delete participants" ON public.trip_participants FOR DELETE TO authenticated USING (public.is_trip_participant(trip_id));

-- Days table
CREATE TABLE public.days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Days visible to trip members" ON public.days FOR SELECT TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can manage days" ON public.days FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can update days" ON public.days FOR UPDATE TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can delete days" ON public.days FOR DELETE TO authenticated USING (public.is_trip_participant(trip_id));

-- Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TEXT,
  time_locked BOOLEAN DEFAULT false,
  estimated_duration TEXT,
  description TEXT,
  cost NUMERIC,
  paid_by UUID REFERENCES public.trip_participants(id) ON DELETE SET NULL,
  shared_by UUID[] DEFAULT '{}',
  link TEXT,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'planeado',
  rating INTEGER,
  comments TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_trip_id_from_day(_day_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT trip_id FROM public.days WHERE id = _day_id;
$$;

CREATE POLICY "Activities visible to trip members" ON public.activities FOR SELECT TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can manage activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can update activities" ON public.activities FOR UPDATE TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can delete activities" ON public.activities FOR DELETE TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Meals table
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  time TEXT,
  restaurant_name TEXT NOT NULL,
  notes TEXT,
  rating INTEGER,
  total_bill NUMERIC NOT NULL DEFAULT 0,
  paid_by UUID REFERENCES public.trip_participants(id) ON DELETE SET NULL,
  shared_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Meals visible to trip members" ON public.meals FOR SELECT TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can manage meals" ON public.meals FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can update meals" ON public.meals FOR UPDATE TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can delete meals" ON public.meals FOR DELETE TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_by UUID REFERENCES public.trip_participants(id) ON DELETE SET NULL,
  shared_by UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expenses visible to trip members" ON public.expenses FOR SELECT TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can manage expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE POLICY "Trip members can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (public.is_trip_participant(public.get_trip_id_from_day(day_id)));
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Flights table
CREATE TABLE public.flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'oneway',
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  flight_number TEXT,
  departure_time TEXT,
  arrival_time TEXT,
  return_departure_time TEXT,
  return_arrival_time TEXT,
  price NUMERIC,
  paid_by UUID REFERENCES public.trip_participants(id) ON DELETE SET NULL,
  shared_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Flights visible to trip members" ON public.flights FOR SELECT TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can manage flights" ON public.flights FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can update flights" ON public.flights FOR UPDATE TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can delete flights" ON public.flights FOR DELETE TO authenticated USING (public.is_trip_participant(trip_id));

-- Accommodations table
CREATE TABLE public.accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  place_name TEXT NOT NULL,
  address TEXT,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  price NUMERIC,
  paid_by UUID REFERENCES public.trip_participants(id) ON DELETE SET NULL,
  shared_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Accommodations visible to trip members" ON public.accommodations FOR SELECT TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can manage accommodations" ON public.accommodations FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can update accommodations" ON public.accommodations FOR UPDATE TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can delete accommodations" ON public.accommodations FOR DELETE TO authenticated USING (public.is_trip_participant(trip_id));

-- Rental cars table
CREATE TABLE public.rental_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  pickup_date TEXT NOT NULL,
  dropoff_date TEXT NOT NULL,
  price NUMERIC,
  paid_by UUID REFERENCES public.trip_participants(id) ON DELETE SET NULL,
  shared_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rental_cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rental cars visible to trip members" ON public.rental_cars FOR SELECT TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can manage rental cars" ON public.rental_cars FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can update rental cars" ON public.rental_cars FOR UPDATE TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can delete rental cars" ON public.rental_cars FOR DELETE TO authenticated USING (public.is_trip_participant(trip_id));

-- Other details table
CREATE TABLE public.other_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  notes TEXT,
  price NUMERIC,
  paid_by UUID REFERENCES public.trip_participants(id) ON DELETE SET NULL,
  shared_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.other_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Other details visible to trip members" ON public.other_details FOR SELECT TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can manage other details" ON public.other_details FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can update other details" ON public.other_details FOR UPDATE TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can delete other details" ON public.other_details FOR DELETE TO authenticated USING (public.is_trip_participant(trip_id));

-- Expense payments table (polymorphic - for activities, meals, expenses, flights, etc.)
CREATE TABLE public.expense_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL,
  parent_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_by UUID REFERENCES public.trip_participants(id) ON DELETE SET NULL,
  date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Expense payments viewable by authenticated" ON public.expense_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage expense payments" ON public.expense_payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update expense payments" ON public.expense_payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete expense payments" ON public.expense_payments FOR DELETE TO authenticated USING (true);

-- Payments table (settlements between participants)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_participant UUID NOT NULL REFERENCES public.trip_participants(id) ON DELETE CASCADE,
  to_participant UUID NOT NULL REFERENCES public.trip_participants(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Payments visible to trip members" ON public.payments FOR SELECT TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can manage payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can update payments" ON public.payments FOR UPDATE TO authenticated USING (public.is_trip_participant(trip_id));
CREATE POLICY "Trip members can delete payments" ON public.payments FOR DELETE TO authenticated USING (public.is_trip_participant(trip_id));

-- Activity photos table
CREATE TABLE public.activity_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photos viewable by authenticated" ON public.activity_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage photos" ON public.activity_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can delete photos" ON public.activity_photos FOR DELETE TO authenticated USING (true);

-- Auto-link invited participants when they register
CREATE OR REPLACE FUNCTION public.link_invited_participant()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.trip_participants
  SET profile_id = NEW.id, status = 'active'
  WHERE email = NEW.email AND profile_id IS NULL AND status = 'invited';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_user_created_link_participant
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_invited_participant();

-- Indexes
CREATE INDEX idx_trip_participants_trip_id ON public.trip_participants(trip_id);
CREATE INDEX idx_trip_participants_profile_id ON public.trip_participants(profile_id);
CREATE INDEX idx_trip_participants_email ON public.trip_participants(email);
CREATE INDEX idx_days_trip_id ON public.days(trip_id);
CREATE INDEX idx_activities_day_id ON public.activities(day_id);
CREATE INDEX idx_meals_day_id ON public.meals(day_id);
CREATE INDEX idx_expenses_day_id ON public.expenses(day_id);
CREATE INDEX idx_flights_trip_id ON public.flights(trip_id);
CREATE INDEX idx_accommodations_trip_id ON public.accommodations(trip_id);
CREATE INDEX idx_expense_payments_parent ON public.expense_payments(parent_type, parent_id);
