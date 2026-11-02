# Nederlands Flashcards

A private, phone-first Dutch A2 vocabulary trainer. Two quiz directions (Dutch → English and English → Dutch) over ~1,200 word pairs, with an adaptive Leitner-box scheduler: words you answer correctly resurface less and less, while new and failed words stay in heavy rotation and land in a review pile.

Built with Vite + React + TypeScript + Tailwind, backed by [InsForge](https://insforge.dev) (Postgres + auth + hosting). Designed as an iPhone home-screen web app.

## Features

- **Two quiz modes** — type the English meaning of a Dutch word, or the Dutch word for an English prompt.
- **Adaptive scheduling** — per word per direction: boxes 0–6 with intervals from 10 minutes to 7 days; correct answers promote, mistakes demote and make the word immediately due again.
- **Review pile** — every word whose latest attempt failed (or that you get wrong more often than right) collects in a drillable pile.
- **In-session re-queue** — wrong answers reappear a few questions later until answered correctly.
- **Lenient answer checking** — case, punctuation, and accent-insensitive; accepts alternatives ("from / of"), article variants ("de boom" ↔ "boom"), and parenthesized-optional parts.
- **Two private accounts** — per-user progress via Postgres RLS; the word list itself is locked to a member allowlist; public signup is disabled after setup.
- **Offline tolerance** — answers that fail to reach the server are queued per-user and replayed on next load.

## Development

```bash
npm install
npm run dev          # local dev server
npm test             # vitest suite (scheduler, answer checking, parser, storage, auth gate)
npm run build        # typecheck + production build
npm run icons        # regenerate PWA icons from icon.svg
npm run import-vocab # re-parse the vocab markdown → data/seed-words-*.sql (needs backend access)
```

Copy `.env.example` to `.env` and fill in the InsForge URL and anon key (backend connection values, see `.insforge/project.json`).

**Note:** in production the app proxies `/api/*` through its own origin (see `vercel.json`) so the auth refresh cookie is first-party — sessions survive reloads. Local `npm run dev` has no proxy, so point `VITE_INSFORGE_URL` at the deployment origin for read-only UI work; full auth flows are best tested against the deployed app.

## Deployment

Hosted via InsForge deployments (`npx -y @insforge/cli deployments deploy .`). `vercel.json` provides SPA routing. Environment variables `VITE_INSFORGE_URL` / `VITE_INSFORGE_ANON_KEY` are set as persistent deployment env vars.

## Data model

- `words` — shared reference data (English, Dutch, category, accepted alternatives).
- `word_stats` — one row per user per word per direction (box, counts, streak, due time).
- `attempts` — append-only answer log powering the stats screen.
- `record_attempt` — the only write path: one RPC inserting the attempt and upserting stats atomically.
- `app_members` — allowlist locking the word list to the two owner accounts.

See `PLAN.md` for the full design document.
