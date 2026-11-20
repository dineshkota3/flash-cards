-- Reject blank vocab rows. A blank "word" (slipped in from an empty markdown
-- table row) can never be answered correctly, so it accrues wrongs forever and
-- its 1 + wrong_count weight makes it hog the due slots of every session.
ALTER TABLE public.words
  ADD CONSTRAINT words_not_blank
  CHECK (btrim(english) <> '' AND btrim(dutch) <> '');
