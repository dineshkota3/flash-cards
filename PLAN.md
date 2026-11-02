# Dutch A2 Vocabulary Quiz PWA — From-Scratch Rewrite Plan

## Context

The current repo (`~/dev/flash-cards`) is a tiny Create React App flash-card app (hardcoded 21 Dutch + 26 Korean pairs, deployed to GitHub Pages). It gets deleted entirely — files, `node_modules`, and git history — and rewritten from scratch as a private, InsForge-backed, iPhone-pinnable vocabulary trainer for the Dutch A2 course.

**What the new app does:** loads ~1,300 word pairs (seeded from `~/dev/dutch/a2-reading-vocabulaire-all-words.md` into InsForge Postgres) and quizzes them in two directions with an adaptive scheduler:

1. **NL → EN** — a Dutch word is shown; the user types the English meaning.
2. **EN → NL** — an English word is shown; the user types the Dutch word.

Words answered correctly surface less and less; new and failed words surface more often and go into a **review pile**. Wrong answers re-queue inside the session until answered correctly. Progress lives server-side in InsForge Postgres, so the pinned phone app and any desktop browser share it.

**Privacy:** the URL is public but access is locked to exactly **two accounts (the user and their wife)** — email/password login gates the whole UI, Postgres RLS restricts every personal row (stats, attempts, review pile) to its owner via `auth.uid()`, the shared word list is readable only by a two-user allowlist, and public signup is disabled on the project after both accounts exist. Each user sees only their own progress; the two never mix.

**Platform:** InsForge (CLI already authenticated). New dedicated project; frontend hosted via InsForge deployments (Vercel under the hood). Region: prefer `eu-central` (lowest latency for NL), fall back to whatever `create` offers.

## Decisions (confirmed with user)

| Question | Decision |
|---|---|
| Quiz mode 1 | Dutch shown → type **English** |
| Old repo/git | Delete everything **including `.git`**; fresh `git init`; GitHub remote re-added; force-push only after confirming with user |
| InsForge project | Create a **new** dedicated project |
| Korean deck | Dropped — Dutch only |
| Users | **Two accounts** (user + wife); all progress strictly per-user |
| Device priority | **Phone-first** (pinned PWA); desktop renders a centered phone-width column |

## Scheduling algorithm (Leitner boxes + due timestamps + weighted sampling)

Tracked **per word per direction** (`nl_en` / `en_nl` independently):

- **Boxes 0–6**, intervals: 0 = due now · 1 = 10 min · 2 = 1 h · 3 = 6 h · 4 = 1 day · 5 = 3 days · 6 = 7 days (mastered).
- **Correct:** box +1 (cap 6), streak +1, `due_at = now + interval[box]`.
- **Wrong:** box − 2 (floor 0), streak = 0, **`due_at = now`** — immediately back in rotation. (One typo doesn't fully reset a mastered word, but it does make it due immediately and marks it "recently wrong".)
- **Session queue (~15 cards, client-side):** weighted sampling without replacement. `weight = 6` unseen · `10/(1+box) + min(wrong_count,5)` for due words (weaker = heavier) · `0.3/(1+box)` for not-due words (learned words still pop up occasionally, ~1–3% of a session).
- **In-session mistake pile:** a wrong answer inserts a copy of the card 3 positions later; it must be answered correctly once to leave the session's pile; wrong again = re-inserted again.
- **Review pile (persistent):** `box = 0` (seen), `wrong_count > correct_count`, or **`last_result = false`** — i.e., every word whose most recent attempt failed ("mistakes go into a pile to revise"). Pile screen shows counts + "Drill now" sessions restricted to pile words.

## Implementation

### Step 1 — Repo reset + this PLAN.md

```bash
cd ~/dev/flash-cards
rm -rf .git build coverage node_modules public src package.json package-lock.json README.md .gitignore
ls -A   # expect only .claude/ and PLAN.md left
git init -b main
```

**Keep `.claude/`** — local Claude tool-permission settings, not app code.

The vocab source md stays **out of the repo** (third-party course content; repo may be public) — the importer reads it from `~/dev/dutch/` at run time.

### Step 2 — Scaffold (hand-written, no interactive generators)

- `package.json` — deps: `react`, `react-dom`, `react-router-dom`, `@insforge/sdk@latest`; dev: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss@^3.4`, `postcss`, `autoprefixer`, `@types/react(-dom)`, `sharp` (icons).
- `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` (iOS palette: `#f2f2f7` bg, `#007aff` blue, system font stack), `postcss.config.js`.
- `vercel.json` — SPA rewrite `/(.*) → /index.html` (required by InsForge deployments).
- `.gitignore` (node_modules, dist, coverage, .env*, .insforge/, data/, .DS_Store), `.env` + `.env.example` (`VITE_INSFORGE_URL`, `VITE_INSFORGE_ANON_KEY`).
- `git add -A && git commit` (fresh history). `git remote add origin git@github.com-dinu:dineshkota3/flash-cards.git`. **Do not push yet.**

### Step 3 — InsForge project + schema

1. `npx -y @insforge/cli create` (new project, links dir, writes `.insforge/project.json`); `current` to verify.
2. `config export` → edit `insforge.toml`: `deployments.subdomain` (e.g. `dutch-a2-vocab`), **`auth.require_email_verification = false`** (single owner; signup closes right after — keeps account creation one step), then `config apply`.
3. `npx -y @insforge/cli secrets get ANON_KEY`; URL from `oss_host` → write `.env`.
4. `npx -y @insforge/cli metadata --json` — record actual auth flags; the login screen has a defensive branch for verification if it can't be turned off.
5. Migration (`db migrations new create-vocab-schema`, then `db migrations up --all`):

```sql
CREATE TABLE public.words (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  english TEXT NOT NULL,
  dutch TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN
    ('easy','medium','difficult','verb','separable_verb','adjective','preposition')),
  english_alts TEXT[] NOT NULL DEFAULT '{}',  -- extra accepted answers (primary excluded)
  dutch_alts TEXT[] NOT NULL DEFAULT '{}',    -- incl. article variants, e.g. "de boom"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX words_unique_pair ON public.words (lower(english), lower(dutch));
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
-- Initially any authenticated user may read the shared vocab; TIGHTENED in Step 7 to the
-- two-user allowlist below once both accounts exist (belt-and-braces vs. a stray account).
CREATE POLICY "authenticated_read_words" ON public.words FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.words FROM anon, authenticated;
GRANT SELECT ON public.words TO authenticated;   -- anon can never read the vocab

-- Two-user allowlist: populated in Step 7 with the owner accounts' UUIDs.
CREATE TABLE public.app_members (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_members ENABLE ROW LEVEL SECURITY;
-- no policies at all: managed only via CLI/admin, invisible to runtime roles
CREATE FUNCTION public.is_app_member() RETURNS BOOLEAN
  LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_members WHERE user_id = (SELECT auth.uid())) $$;

CREATE TABLE public.word_stats (
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('nl_en','en_nl')),
  box SMALLINT NOT NULL DEFAULT 0 CHECK (box BETWEEN 0 AND 6),
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_result BOOLEAN,                -- most recent attempt result (review-pile membership)
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
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE TRIGGER word_stats_updated_at BEFORE UPDATE ON public.word_stats
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TABLE public.attempts (        -- append-only log (powers Stats screen)
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('nl_en','en_nl')),
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

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.word_stats TO authenticated;
```

6. **Write path = one RPC** (`record_attempt`, in the same migration): `SECURITY DEFINER`, pinned `SET search_path = pg_catalog, public, pg_temp`, identity forced from `auth.uid()` inside. Inserts into `attempts`, locks/selects prior stats `FOR UPDATE`, computes new box/streak/due (intervals inline), upserts `word_stats` **including `last_result = p_is_correct`**, returns the fresh row (client updates its cache from it). `REVOKE EXECUTE … FROM PUBLIC, anon; GRANT EXECUTE … TO authenticated`. This is the app's **only** DB write path — avoids `.insert().select()` RLS-RETURNING pitfalls entirely and is one network call per answer.

### Step 4 — Vocabulary import (local script, never shipped)

`scripts/import-vocab.mjs` — reads the md (path via `VOCAB_MD` env, default `~/dev/dutch/a2-reading-vocabulaire-all-words.md`), writes gitignored `data/words.json` + `data/seed-*.sql`, prints per-category counts + dropped-duplicates list.

Parser rules:
1. Track `##` headings (they use an **EN dash** `–`): Easy/Medium/Difficult → `easy/medium/difficult`; `VERBS – Common verbs` → `verb`; `VERBS – Separable verbs` → `separable_verb`; `ADJECTIVES` → `adjective`; `PREPOSITIONS` → `preposition`; any heading containing "how they split" → skip.
2. **Gate on table header shape**: only rows under `| # | English | Dutch |` headers count (the sentence table has `| # | Infinitive | …` and is excluded automatically).
3. Row regex `^\|\s*\d+\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$`; strip `**` defensively.
4. **Adjectives positional split**: rows where both cells split into equal part-counts > 1 on `,` (verified to exist only in ADJECTIVES) emit N independent pairs — "good, bad | goed, slecht" → (good→goed) + (bad→slecht). Never an untypeable "goed, slecht" answer.
5. **Article expansion**: dutch `^(.+),\s*(de|het|een)$` → dutch=`boom`, alts add `"de boom"`.
6. **Alternatives**: split cells on `,` `;` `/`; if one side has 1 part and the other >1, parts 2..n become that side's `_alts` ("from / of" → primary `from`, alts `["of"]`; "very | zeer, heel" → alts `["zeer","heel"]`). Parenthesized variants ("to come across (somebody)") also add the stripped form.
7. **Whole-file dedupe** on `(lower(english), lower(dutch))`, first occurrence wins, log every drop ("to have|hebben" in Easy+Verbs; prepositions dupes; adjectives "old|oud" from two antonym rows).

Seed via generated SQL (`INSERT … ON CONFLICT DO NOTHING`, batches of 200) applied with `npx -y @insforge/cli db query "$(cat data/seed-batch-001.sql)"`. Verify: `SELECT category, count(*) … GROUP BY 1` vs importer report (expected ≈ easy 493 / medium 255 / difficult 364 / verb 90 / separable_verb ~44 / adjective ~64 / preposition ~15 after dedupe; total ~1290–1330).

### Step 5 — Frontend

```
src/
├── main.tsx                    # entry
├── App.tsx                     # AppProvider + AuthGate + <Routes>
├── index.css                   # Tailwind + safe-area utilities (.pt-safe/.pb-safe)
├── lib/
│   ├── insforge.ts             # createClient({ baseUrl, anonKey }) singleton
│   ├── types.ts                # Word, WordStat, Direction, CheckResult
│   ├── scheduler.ts            # BOX_INTERVALS_MS, cardWeight, buildSessionQueue(words, stats,
│   │                           #   direction, {size=15, pool:'all'|'review'}), isInReviewPile
│   ├── answerCheck.ts          # normalizeAnswer, acceptedAnswers, checkAnswer
│   └── storage.ts              # localStorage: words cache (keyed words_v1) + pendingAttempts queue
├── context/AppContext.tsx      # {user, loading, words, stats map, bootstrap(), recordAnswer(),
│                               #   refreshStats(), signOut()}
├── components/                 # AuthGate, Screen (iOS shell + safe areas), PrimaryButton, Spinner
└── screens/
    ├── LoginScreen.tsx         # sign-in; sign-up toggle (defensive verification branch)
    ├── HomeScreen.tsx          # NL→EN / EN→NL cards, due counts, review-pile card + Drill, stats, sign out
    ├── QuizScreen.tsx          # session runner: prompt + category chip, input, instant feedback,
    │                           #   mistake re-queue, progress bar, summary ("Continue next 10" / Done)
    ├── ReviewScreen.tsx        # persistent pile per direction + Drill buttons
    └── StatsScreen.tsx         # per direction: seen/total, box histogram, accuracy, due now
```

Routes: `/login`, `/`, `/quiz/:direction` (`?pool=review`), `/review`, `/stats` — all non-login wrapped in `AuthGate`.

**Layout — phone-first:** the entire app renders inside a `max-w-[26rem]` (~416 px) centered column: full-bleed on a phone, a centered phone-shaped column on a laptop (fully usable, but phone is the design target). Touch targets ≥44 px, bottom-anchored quiz input for thumb typing, safe-area padding for notch + home indicator, large-type prompt cards.

Key behaviors:
- **`bootstrap()`** (after login): `words` select (named columns; ~300 KB once, cached in localStorage), `word_stats` select (≤ ~2,600 rows, small). `refreshStats()` on `visibilitychange→visible`.
- **`recordAnswer()`**: optimistic local update → `insforge.database.rpc('record_attempt', …)` → replace stat with returned row; on failure retry ×3 then buffer in `pendingAttempts` (localStorage), replayed before the next stats fetch. No polling anywhere.
- **Answer checking (`answerCheck.ts`)**: normalize = trim → strip edge punctuation → lowercase → NFD accent-fold (é→e) → collapse spaces. Accepted set = primary + `_alts` (accent-folded). EN→NL adds article-stripped variants of every answer, so `de boom` ↔ `boom` both pass regardless of which is canonical. Feedback shows the canonical answer.
- **Quiz input**: `autoCapitalize="none" autoCorrect="off" autoComplete="off" spellCheck={false} enterKeyHint="done"`, **≥16px font (iOS zoom guard)**, Enter submits; correct → green banner, auto-advance ~800 ms; wrong → red banner with correct answer, Enter advances. Bottom-anchored input bar + `scrollIntoView` on focus (keyboard overlap).
- **Auth cold-load**: `getCurrentUser()` round-trip leaves `user` null briefly — every gated render branches on `loading` (splash), never on `user === null` alone.
- Category chip shown under prompts (disambiguates homographs like `de` = article vs word).

### Step 6 — PWA

- `public/manifest.webmanifest`: `display: standalone`, `start_url: /`, portrait, iOS-gray background/theme, icons 192 + 512 + maskable variants.
- `index.html`: `viewport-fit=cover` viewport, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-mobile-web-app-title`, `apple-touch-icon`, `theme-color`, `noindex` robots meta; `public/robots.txt` = `Disallow: /`.
- `icon.svg` (Dutch-orange rounded square, white "NL") → `scripts/generate-icons.mjs` (sharp, dev-time only) → committed PNGs incl. 180×180 `apple-touch-icon.png`.
- No service worker in v1 (writes need network; pendingAttempts covers short offline gaps) — future enhancement.

### Step 7 — Deploy → two accounts → lockdown (order matters)

1. `npm run build` must pass locally; `npm run preview` smoke test.
2. `deployments env set VITE_INSFORGE_URL <url>` + `deployments env set VITE_INSFORGE_ANON_KEY <key>` (build-time — **before** first deploy), then `deployments deploy .`; poll `deployments status <id>` → READY.
3. **Both users sign up through the deployed app** (user + wife), each choosing their own email + password (entered by them; never stored in repo). Verify sign-in for each + one quiz answer persists (`SELECT * FROM word_stats` — two distinct `user_id`s).
4. **Lock the vocab to the two of them:** capture both account UUIDs (`SELECT id, email FROM auth.users`), insert into `public.app_members`, then replace the words policy with the allowlist version:

   ```sql
   INSERT INTO public.app_members (user_id)
   SELECT id FROM auth.users WHERE email = ANY(ARRAY['<user-email>','<wife-email>']);
   DROP POLICY "authenticated_read_words" ON public.words;
   CREATE POLICY "members_read_words" ON public.words
     FOR SELECT TO authenticated USING (public.is_app_member());
   ```

   From here even a hypothetical extra authenticated account sees zero rows — vocabulary, stats, attempts, everything.
5. Flip `auth.disable_signup = true` in `insforge.toml` → `config plan` → `config apply` → confirm via `metadata --json`. From now on nobody can create an account; exactly the two accounts remain.
6. `npx -y @insforge/cli diagnose advisor` — confirm no security findings.
7. Initial commit → **force-push only after confirming with the user**.

## Verification

1. **Parser/seed:** importer report matches DB (`GROUP BY category` counts); spot-check `boom, de` → alts, `ons/onze`, adjectives split ("good"→"goed"), sentence-table skipped, dedupe list sane.
2. **Local dev:** signup → sign-out → sign-in; NL→EN and EN→NL sessions — correct advances box/due (`SELECT box, due_at, last_result FROM word_stats ORDER BY updated_at DESC LIMIT 5`), wrong re-queues in-session + demotes + piles; `attempts` grows by exactly 1 per answer.
3. **Answer checker:** `of` for "from / of"; `de boom` ↔ `boom`; `cafe` ≟ `café` accepted; `zeer` and `heel` for "very"; wrong words rejected.
4. **Privacy:** `curl` the words REST endpoint without auth → blocked/empty; incognito window → login only; after lockdown, signup attempt rejected; words policy confirmed member-only (`EXPLAIN`/query as a non-member UUID → 0 rows).
5. **Two users:** log in as user A, answer some words → log in as user B → B sees untouched progress and an empty pile; DB check confirms `word_stats`/`attempts` rows carry separate `user_id`s and each account's API view returns only its own rows.
6. **Deployed:** public URL shows only login; either owner sign-in shows that account's server-synced progress.
7. **iPhone:** Safari → Add to Home Screen → launches standalone (no browser chrome, correct icon/splash); a session on the phone appears on desktop with the same account; airplane mode renders cached words and queues answers, replays on reconnect.

## Risks / gotchas

- **Email verification:** config sets it off; login screen keeps a defensive OTP branch from `metadata --json` in case it can't be disabled.
- **Cold-load auth null flash** → gate on `loading`.
- **RLS RETURNING semantics** → avoided (RPC-only writes).
- **iOS quirks** → 16px inputs, safe-area insets, bottom input bar.
- **Homographs/duplicates** → whole-file dedupe + category chip.
- **CORS in dev** → if localhost:5173 is blocked, verify auth flows against the deployed URL.
- **Vercel rewrite vs static files** → filesystem-first; manifest/icons served directly.
- **Force-push** → only after explicit user confirmation.
