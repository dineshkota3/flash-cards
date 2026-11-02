-- Dutch A2 vocab app schema: words (shared reference), word_stats (per user
-- per word per direction), attempts (append-only log), record_attempt RPC,
-- and the two-member allowlist used to lock the vocab table down.

-- ============ words: shared reference data ============
CREATE TABLE public.words (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  english TEXT NOT NULL,
  dutch TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN
    ('easy', 'medium', 'difficult', 'verb', 'separable_verb', 'adjective', 'preposition')),
  english_alts TEXT[] NOT NULL DEFAULT '{}',
  dutch_alts TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX words_unique_pair ON public.words (lower(english), lower(dutch));

ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
-- Initially any authenticated user may read the vocab. Tightened to the
-- two-member allowlist after both owner accounts exist (see app_members).
CREATE POLICY "authenticated_read_words" ON public.words
  FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.words FROM anon, authenticated;
GRANT SELECT ON public.words TO authenticated;

-- ============ two-member allowlist (populated post-signup) ============
CREATE TABLE public.app_members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_members ENABLE ROW LEVEL SECURITY;
-- No policies: invisible to runtime roles; managed only via CLI/admin.

CREATE FUNCTION public.is_app_member() RETURNS BOOLEAN
  LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_members WHERE user_id = (SELECT auth.uid())) $$;

-- ============ word_stats: one row per user + word + direction ============
CREATE TABLE public.word_stats (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('nl_en', 'en_nl')),
  box SMALLINT NOT NULL DEFAULT 0 CHECK (box BETWEEN 0 AND 6),
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_result BOOLEAN,
  last_seen_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, word_id, direction)
);

CREATE INDEX idx_word_stats_due ON public.word_stats (user_id, direction, due_at);

ALTER TABLE public.word_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_word_stats" ON public.word_stats
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "owner_insert_word_stats" ON public.word_stats
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "owner_update_word_stats" ON public.word_stats
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE TRIGGER word_stats_updated_at
  BEFORE UPDATE ON public.word_stats
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

-- ============ attempts: append-only log ============
CREATE TABLE public.attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('nl_en', 'en_nl')),
  is_correct BOOLEAN NOT NULL,
  typed_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_user_time ON public.attempts (user_id, created_at DESC);

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select_attempts" ON public.attempts
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "owner_insert_attempts" ON public.attempts
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

-- ============ grants (RLS decides row access) ============
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.word_stats TO authenticated;
GRANT SELECT, INSERT ON public.attempts TO authenticated;

-- ============ record_attempt: the ONLY write path from the app ============
CREATE FUNCTION public.record_attempt(
  p_word_id INTEGER,
  p_direction TEXT,
  p_is_correct BOOLEAN,
  p_typed_answer TEXT DEFAULT NULL
) RETURNS public.word_stats
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_box SMALLINT;
  v_streak INTEGER;
  v_correct INTEGER;
  v_wrong INTEGER;
  v_due TIMESTAMPTZ;
  v_row public.word_stats;
BEGIN
  v_uid := (SELECT auth.uid());
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.attempts (user_id, word_id, direction, is_correct, typed_answer)
  VALUES (v_uid, p_word_id, p_direction, p_is_correct, NULLIF(btrim(p_typed_answer), ''));

  SELECT box, streak, correct_count, wrong_count
    INTO v_box, v_streak, v_correct, v_wrong
    FROM public.word_stats
   WHERE user_id = v_uid AND word_id = p_word_id AND direction = p_direction
   FOR UPDATE;
  IF NOT FOUND THEN
    v_box := 0;
    v_streak := 0;
    v_correct := 0;
    v_wrong := 0;
  END IF;

  -- Correct: climb one box (cap 6). Wrong: drop two (floor 0) and due now.
  IF p_is_correct THEN
    v_box := LEAST(v_box + 1, 6);
    v_streak := v_streak + 1;
    v_correct := v_correct + 1;
  ELSE
    v_box := GREATEST(v_box - 2, 0);
    v_streak := 0;
    v_wrong := v_wrong + 1;
  END IF;

  v_due := CASE v_box
    WHEN 0 THEN now()
    WHEN 1 THEN now() + interval '10 minutes'
    WHEN 2 THEN now() + interval '1 hour'
    WHEN 3 THEN now() + interval '6 hours'
    WHEN 4 THEN now() + interval '1 day'
    WHEN 5 THEN now() + interval '3 days'
    ELSE        now() + interval '7 days'
  END;

  INSERT INTO public.word_stats AS ws
    (user_id, word_id, direction, box, correct_count, wrong_count, streak,
     last_result, last_seen_at, due_at)
  VALUES
    (v_uid, p_word_id, p_direction, v_box, v_correct, v_wrong, v_streak,
     p_is_correct, now(), v_due)
  ON CONFLICT (user_id, word_id, direction) DO UPDATE
    SET box = EXCLUDED.box,
        correct_count = EXCLUDED.correct_count,
        wrong_count = EXCLUDED.wrong_count,
        streak = EXCLUDED.streak,
        last_result = EXCLUDED.last_result,
        last_seen_at = EXCLUDED.last_seen_at,
        due_at = EXCLUDED.due_at;

  SELECT * INTO v_row FROM public.word_stats
   WHERE user_id = v_uid AND word_id = p_word_id AND direction = p_direction;
  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_attempt(INTEGER, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_attempt(INTEGER, TEXT, BOOLEAN, TEXT) TO authenticated;
