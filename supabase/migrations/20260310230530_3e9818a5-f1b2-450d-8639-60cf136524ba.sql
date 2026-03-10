ALTER TABLE public.meals ADD COLUMN meal_name text NOT NULL DEFAULT 'Refeição';
ALTER TABLE public.meals ALTER COLUMN total_bill SET DEFAULT 0;
ALTER TABLE public.meals ALTER COLUMN restaurant_name SET DEFAULT '';