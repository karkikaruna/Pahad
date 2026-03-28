-- =========================================
-- PAHAD Mental Health Monitoring System
-- Supabase PostgreSQL Schema
-- =========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries (optional)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- =========================================
-- Table: household_logs
-- =========================================
CREATE TABLE IF NOT EXISTS public.household_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fchv_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_name      TEXT NOT NULL,
  ward_number         INTEGER NOT NULL CHECK (ward_number >= 1 AND ward_number <= 33),
  respondent_name     TEXT NOT NULL,

  -- Mental health indicators (boolean)
  sleep_change        BOOLEAN NOT NULL DEFAULT FALSE,
  appetite_change     BOOLEAN NOT NULL DEFAULT FALSE,
  social_withdrawal   BOOLEAN NOT NULL DEFAULT FALSE,
  trauma              BOOLEAN NOT NULL DEFAULT FALSE,
  daily_activity_stop BOOLEAN NOT NULL DEFAULT FALSE,
  hopelessness        BOOLEAN NOT NULL DEFAULT FALSE,
  substance_use       BOOLEAN NOT NULL DEFAULT FALSE,
  self_harm           BOOLEAN NOT NULL DEFAULT FALSE,

  -- Computed scores & AI output
  risk_score          INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  ai_explanation      TEXT NOT NULL DEFAULT '',

  -- Geolocation
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_household_logs_fchv_id ON public.household_logs(fchv_id);
CREATE INDEX IF NOT EXISTS idx_household_logs_risk_score ON public.household_logs(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_household_logs_created_at ON public.household_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_household_logs_ward ON public.household_logs(ward_number);

-- =========================================
-- Row Level Security (RLS)
-- =========================================
ALTER TABLE public.household_logs ENABLE ROW LEVEL SECURITY;

-- FCHVs can only read/write their own logs
CREATE POLICY "FCHVs can read own logs"
  ON public.household_logs FOR SELECT
  USING (auth.uid() = fchv_id);

CREATE POLICY "FCHVs can insert own logs"
  ON public.household_logs FOR INSERT
  WITH CHECK (auth.uid() = fchv_id);

CREATE POLICY "FCHVs can update own logs"
  ON public.household_logs FOR UPDATE
  USING (auth.uid() = fchv_id)
  WITH CHECK (auth.uid() = fchv_id);

-- Admins can read all logs (requires setting user metadata role = 'admin')
CREATE POLICY "Admins can read all logs"
  ON public.household_logs FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- =========================================
-- Profiles table (FCHV user details)
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  ward        INTEGER,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Useful views
-- =========================================

-- High risk households view
CREATE OR REPLACE VIEW public.high_risk_households AS
SELECT
  hl.*,
  p.full_name AS fchv_name,
  p.ward AS fchv_ward
FROM public.household_logs hl
LEFT JOIN public.profiles p ON p.id = hl.fchv_id
WHERE hl.risk_score >= 70
ORDER BY hl.risk_score DESC, hl.created_at DESC;

-- Ward summary view
CREATE OR REPLACE VIEW public.ward_risk_summary AS
SELECT
  ward_number,
  COUNT(*) AS total_surveys,
  AVG(risk_score)::INTEGER AS avg_risk,
  COUNT(CASE WHEN risk_score >= 70 THEN 1 END) AS critical_count,
  COUNT(CASE WHEN risk_score >= 50 AND risk_score < 70 THEN 1 END) AS high_count,
  COUNT(CASE WHEN risk_score >= 25 AND risk_score < 50 THEN 1 END) AS medium_count,
  COUNT(CASE WHEN risk_score < 25 THEN 1 END) AS low_count
FROM public.household_logs
GROUP BY ward_number
ORDER BY avg_risk DESC;
