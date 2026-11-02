-- Public app configuration flags. Readable by everyone (anon included) — the
-- login screen needs `signup_enabled` before authentication to decide whether
-- to show the sign-up option. Values are not sensitive by design.
CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_app_config" ON public.app_config
  FOR SELECT USING (true);

INSERT INTO public.app_config (key, value) VALUES ('signup_enabled', 'false');

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.app_config TO anon;
