-- Promotion now requires consecutive correct answers at the current box:
-- 3 corrects to leave box 0, 2 corrects for box 1→2 and box 2→3, then 1
-- correct per box from 3 upward. Wrong answers still drop two boxes and
-- reset the count. `streak` now means "consecutive corrects in the current
-- box" (reset on promotion and on any mistake).

CREATE OR REPLACE FUNCTION public.record_attempt(
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
  v_needed INTEGER;
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

  IF p_is_correct THEN
    -- Corrects needed at the current box before promotion: 3 / 2 / 2 / 1 / 1 / 1 / 1.
    v_needed := CASE WHEN v_box = 0 THEN 3 WHEN v_box <= 2 THEN 2 ELSE 1 END;
    IF v_streak + 1 >= v_needed THEN
      v_box := LEAST(v_box + 1, 6);
      v_streak := 0;              -- counter resets on entering the new box
    ELSE
      v_streak := v_streak + 1;   -- stays in the current box, count toward promotion
    END IF;
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
