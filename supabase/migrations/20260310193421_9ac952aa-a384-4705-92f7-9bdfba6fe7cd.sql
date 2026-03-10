
-- Add invite_token column to trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS invite_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Update existing trips to have tokens
UPDATE public.trips SET invite_token = encode(gen_random_bytes(16), 'hex') WHERE invite_token IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE public.trips ALTER COLUMN invite_token SET NOT NULL;

-- Create a function to join a trip by invite token (bypasses RLS)
CREATE OR REPLACE FUNCTION public.join_trip_by_token(_invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _trip_id uuid;
  _user_id uuid;
  _user_email text;
  _user_name text;
  _existing_participant uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  -- Find trip by token
  SELECT id INTO _trip_id FROM public.trips WHERE invite_token = _invite_token;
  IF _trip_id IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid_token');
  END IF;

  -- Get user info
  SELECT name, email INTO _user_name, _user_email FROM public.profiles WHERE id = _user_id;

  -- Check if already a participant (by profile_id)
  SELECT id INTO _existing_participant FROM public.trip_participants
  WHERE trip_id = _trip_id AND profile_id = _user_id;
  
  IF _existing_participant IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'trip_id', _trip_id, 'already_member', true);
  END IF;

  -- Check if there's an invited participant matching email
  SELECT id INTO _existing_participant FROM public.trip_participants
  WHERE trip_id = _trip_id AND email = _user_email AND profile_id IS NULL;

  IF _existing_participant IS NOT NULL THEN
    -- Link existing invitation
    UPDATE public.trip_participants
    SET profile_id = _user_id, status = 'active'
    WHERE id = _existing_participant;
  ELSE
    -- Add as new participant
    INSERT INTO public.trip_participants (trip_id, name, email, profile_id, status)
    VALUES (_trip_id, COALESCE(_user_name, split_part(_user_email, '@', 1)), _user_email, _user_id, 'active');
  END IF;

  RETURN jsonb_build_object('success', true, 'trip_id', _trip_id, 'already_member', false);
END;
$$;
