-- Supabase Table: ip_quotas
-- Tracks daily guest download quotas by hashed IP with automatic 24h reset

CREATE TABLE IF NOT EXISTS public.ip_quotas (
  ip_hash TEXT PRIMARY KEY,
  trials_left INTEGER NOT NULL DEFAULT 3,
  last_reset_date TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ip_quotas_hash ON public.ip_quotas (ip_hash);

-- Enable Row Level Security
ALTER TABLE public.ip_quotas ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on ip_quotas"
  ON public.ip_quotas
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
