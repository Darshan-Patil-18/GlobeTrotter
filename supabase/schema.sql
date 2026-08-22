-- ============================================================
-- GlobeTrotter — Complete Master Supabase Setup Script
-- ============================================================
-- How to run:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Go to the "SQL Editor" tab from the left sidebar
-- 3. Click "+ New Query", paste this entire script, and click "Run"
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  additional_info TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  description TEXT,
  cover_photo_url TEXT,
  budget NUMERIC(10, 2) DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Trip Stops (Itinerary Sections) Table
CREATE TABLE IF NOT EXISTS public.trip_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  city_name TEXT NOT NULL,
  country TEXT,
  lat NUMERIC(9, 6),
  lon NUMERIC(9, 6),
  start_date DATE,
  end_date DATE,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_stop_id UUID NOT NULL REFERENCES public.trip_stops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  cost NUMERIC(10, 2) DEFAULT 0,
  time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Community Posts Table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Admin Helper Security Definer Function
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ 
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); 
$$;

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR ALL USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "trips_policy" ON public.trips;
CREATE POLICY "trips_policy" ON public.trips FOR ALL USING (auth.uid() = user_id OR is_public OR public.is_admin());

DROP POLICY IF EXISTS "stops_policy" ON public.trip_stops;
CREATE POLICY "stops_policy" ON public.trip_stops FOR ALL USING (true);

DROP POLICY IF EXISTS "activities_policy" ON public.activities;
CREATE POLICY "activities_policy" ON public.activities FOR ALL USING (true);

DROP POLICY IF EXISTS "expenses_policy" ON public.expenses;
CREATE POLICY "expenses_policy" ON public.expenses FOR ALL USING (true);

DROP POLICY IF EXISTS "community_posts_policy" ON public.community_posts;
CREATE POLICY "community_posts_policy" ON public.community_posts FOR ALL USING (true);

-- 10. Automatic User Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN 
  INSERT INTO public.profiles (id, first_name, last_name, role) 
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1)), 
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''), 
    CASE WHEN LOWER(NEW.email) = 'admin123@gmail.com' THEN 'admin' ELSE 'user' END
  ) 
  ON CONFLICT (id) DO NOTHING; 
  RETURN NEW; 
END; 
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 11. Storage Buckets & Policies
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-covers', 'trip-covers', true), ('avatars', 'avatars', true), ('community', 'community', true) ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "storage_authenticated_insert" ON storage.objects;
CREATE POLICY "storage_authenticated_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
