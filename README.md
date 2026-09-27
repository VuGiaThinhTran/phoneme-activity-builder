# Phoneme Activity Builder — Assessment 3

A Next.js + TypeScript app for Speech Pathology teachers to build phoneme-based
**Wordle** and **Word Search** classroom activities. Assessment 1 built the frontend;
Assessment 2 added the backend, database, and Docker layer; Assessment 3 (this stage)
adds a data-driven operational dashboard, observability, alerts, and a full testing
pass (Playwright, JMeter, Lighthouse).

## What's new in Assessment 3

- **A live `/dashboard` page** showing real, database-backed metrics: activities
  created (by type), words stored, successful vs failed generation counts, generation
  success rate, average time on page (overall and per page), and the most-used
  activity type. Auto-refreshes every 15 seconds.
- **Two new database tables purely for observability** -- `GenerationEvent` (one row
  per attempt to generate a downloadable file, success or failure) and
  `PageViewMetric` (one row per page visit's measured duration) -- so every number on
  the dashboard is a real aggregate query, not a placeholder.
- **Alerts** -- the dashboard surfaces recent failed generations, any saved activity
  that still has no words, and any word using an unsupported phoneme symbol, each
  with a direct link to fix it on `/manage`. The builder pages themselves also warn
  inline if you try to generate from a genuinely empty word list, instead of silently
  generating from the default corpus.
- **Two Playwright end-to-end tests** (`tests/`) -- one covering the builder's CRUD
  workflow, one covering a user generating and interacting with a Wordle activity.
- **A JMeter load-testing plan** (`jmeter/`) covering the builder and generated-activity
  workflow at staged traffic levels (1 to 10,000 simulated users).
- **A full Lighthouse accessibility pass** -- every page scores **100**, including the
  downloaded activity files themselves, not just the builder pages that generate them
  (see "Accessibility" below for what was found and fixed to get there).

## Tech stack

- Next.js (App Router) + React + TypeScript
- Prisma ORM + PostgreSQL
- Zod for request validation
- Docker + Docker Compose
- Playwright (end-to-end testing) + Apache JMeter (load testing) + Lighthouse
  (accessibility)

## Project structure (additions since Assessment 2)

```
app/
  dashboard/page.tsx                Live operational dashboard
  api/
    dashboard/route.ts              GET — aggregates every dashboard metric
    metrics/generation/route.ts     POST — log a generate attempt (success/failure)
    metrics/page-view/route.ts      POST — log time spent on a page
lib/
  metrics-client.ts                 Client helpers: logGenerationEvent, reportPageViewOnLeave
prisma/
  migrations/20260201000000_add_observability/   GenerationEvent + PageViewMetric tables
tests/
  builder-crud.spec.ts              Playwright: builder use case (CRUD via /manage)
  generate-activity.spec.ts         Playwright: user use case (play + generate Wordle)
playwright.config.ts
jmeter/
  phoneme-builder-load-test.jmx     JMeter test plan
  README.md                         Step-by-step instructions for staged load testing
```

## Database schema

Five tables in total (see `prisma/schema.prisma` for the full, commented version):

```
Activity  (id, name, activityType, difficulty, gridRows?, gridCols?, ...)
  |-- Word  (id, english, hint?, orderIndex, ...)
        |-- PhonemeSegment  (id, ipa, position)

GenerationEvent   (id, activityType, success, errorMessage?, wordCount, createdAt)
PageViewMetric    (id, page, durationMs, createdAt)
```

`Activity`/`Word`/`PhonemeSegment` are unchanged from Assessment 2 (see the code
comments in `schema.prisma` for why phonemes are stored one-per-row rather than as a
delimited string). `GenerationEvent` and `PageViewMetric` are new in Assessment 3 --
they're not user-facing content, they're a log of the app's own usage, which is what
turns the dashboard's numbers into real observability rather than numbers made up on
page load.

## Running with Docker (recommended)

```bash
docker compose up --build
```

This builds the app image, starts a Postgres container, waits for Postgres to report
healthy, then runs `npx prisma migrate deploy` (applying both migrations in
`prisma/migrations/`) before starting the Next.js server. Once it's up:

- App: http://localhost:3000
- Health check: http://localhost:3000/health
- Manage activities: http://localhost:3000/manage
- Dashboard: http://localhost:3000/dashboard

The Postgres password is set in plain text directly in `docker-compose.yml`
(`postgres` / `postgres`) -- a deliberate, accepted simplification to keep the Docker
setup simple; proper secret management is a later topic.

To stop: `docker compose down` (add `-v` to also wipe the database volume and start
fresh next time).

## Running locally without Docker

Requires a PostgreSQL server running locally.

```bash
npm install
cp .env.example .env      # edit DATABASE_URL if your Postgres isn't on localhost:5432
npx prisma generate
npx prisma migrate deploy  # applies prisma/migrations/
npm run dev
```

## API reference

All endpoints return JSON. Validation errors return `400` with
`{ "error": "...", "fields": { "<field>": ["..."] } }`; not-found returns `404`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check -- round-trips to the DB, returns `200` (ok) or `503` (DB unreachable) |
| GET | `/api/activities` | List all activities, with each one's word count |
| POST | `/api/activities` | Create an activity (optionally with a full nested word list) |
| GET | `/api/activities/:id` | One activity with its full, ordered word list |
| PATCH | `/api/activities/:id` | Update an activity's own settings (name, difficulty, grid size) |
| DELETE | `/api/activities/:id` | Delete an activity (cascades to its words) |
| POST | `/api/activities/:id/words` | Add one word to an activity |
| PATCH | `/api/words/:id` | Update a word (spelling, hint, and/or its whole phoneme sequence) |
| DELETE | `/api/words/:id` | Delete a word |
| GET | `/api/dashboard` | Every dashboard metric in one call (health, activity/word counts, generation success/failure, average time on page, most-used type, alerts) |
| POST | `/api/metrics/generation` | Log one generate attempt (`activityType`, `success`, optional `errorMessage`, `wordCount`) |
| POST | `/api/metrics/page-view` | Log time spent on a page (`page`, `durationMs`) |

Example -- creating a Wordle activity with two words in one request:

```bash
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Term 2 - SH sounds",
    "activityType": "WORDLE",
    "difficulty": "NORMAL",
    "words": [
      { "english": "ship", "hint": "a large boat", "phonemes": ["ʃ","ɪ","p"] },
      { "english": "chin", "phonemes": ["tʃ","ɪ","n"] }
    ]
  }'
```

## Dashboard

`/dashboard` reads from `GET /api/dashboard` and shows:

- **System status** -- a live health indicator (same check as `/health`, shown inline).
- **Alerts** -- three categories, each only shown when real: recent failed
  generations (with the error reason), any activity that has no words yet, and any
  saved word using a phoneme symbol outside the app's 43-symbol keyboard (e.g. a typo
  like `ʌ` instead of `ɐ`, or `eɪ` instead of `æɪ` -- symbols that look similar but
  have no matching key, so the word becomes impossible to guess correctly). Each
  alert links straight to `/manage` to fix it.
- **Stat cards** -- activities created (by type), words stored, most-used activity
  type, average time on page, successful/failed generation counts, and the resulting
  success rate.
- **Breakdown tables** -- average time on page per individual page, and generation
  counts per activity type.

Every number comes from a real aggregate query (`groupBy`, `aggregate`, `count`)
against the two new tables plus the existing `Activity`/`Word` tables -- see
`app/api/dashboard/route.ts`.

## Testing

### Manual/integration verification

Database migrations, cascading deletes, multi-character phoneme storage, and the
dashboard's aggregate queries were all verified directly against PostgreSQL. Every API
route was tested end-to-end over HTTP, including the new metrics endpoints and the
dashboard's alert conditions (a failed generation, an activity with zero words, a word
using an unsupported phoneme). `npx eslint .` runs clean with zero errors across the
whole project.

### End-to-end tests (Playwright)

```bash
docker compose up --build          # or otherwise have the app + DB running
npm run test:e2e
```

Two tests, matching the two required use cases:

- **`tests/builder-crud.spec.ts`** -- a builder use case: create an activity, add a
  word, edit the word, edit the activity's own settings separately, reload the page to
  confirm the change actually persisted (not just React state), then delete the word
  and the activity.
- **`tests/generate-activity.spec.ts`** -- a user use case: type a phoneme guess on
  the Wordle keyboard, submit it, then generate a downloadable `.html` file and verify
  it's genuinely valid (parses as JavaScript, contains the expected content) rather
  than just confirming a download happened.

### Load testing (JMeter)

See **`jmeter/README.md`** for full instructions. In short: `jmeter/phoneme-builder-load-test.jmx`
exercises the builder workflow (`/manage`, create-activity) and the generated-activity
workflow (`/wordle`, `/wordsearch`, `/api/dashboard`) with a configurable thread count,
so the same plan can be re-run at 1, 10, 100, 1,000, and 10,000 simulated users to
observe how response time and error rate change with load.

### Accessibility (Lighthouse)

Every page scores **100/100** on Lighthouse's accessibility audit -- and critically,
that includes not just the admin-facing builder pages but the **downloaded, playable
`.html` files themselves** (`phoneme-wordle.html`, `phoneme-wordsearch.html`), since
those are what a student actually opens and uses. Testing only the builder pages
would have missed real problems, because the exported files use their own
self-contained CSS (`lib/exportHtml.tsx`), entirely separate from the app's
`globals.css`.

**Builder pages** (`/`, `/wordle`, `/wordsearch`, `/manage`, `/dashboard`, `/about`) --
five real issues found and fixed:

| Issue | Where | Fix |
|---|---|---|
| `aria-prohibited-attr` | Every phoneme tile used `aria-label` on a plain `<div>` with no ARIA role, which the ARIA spec doesn't allow | Added `role="img"` to `PhonemeTile` |
| `link-name` | The navbar logo's visible text is hidden below the `sm` breakpoint, and the icon next to it is `aria-hidden` -- on small screens the link had no accessible name at all | Added a fixed `aria-label="Phoneme Builder — Home"` on the link itself |
| `color-contrast` (app) | Secondary/muted text used `opacity-60`/`opacity-50`, dropping below the 4.5:1 ratio needed for small text; a filled coral button used pure white text at ~3:1 | Raised muted text to `opacity-70`; switched that button to the existing `--coral-strong` token |

**Exported/downloaded activity files** -- a further two issues, only visible once the
actual output files were audited, not just the builder that generates them:

| Issue | Where | Fix |
|---|---|---|
| `color-contrast` (export) | The export's own CSS (`.kb-hint`, `footer`) independently used `opacity:.6`, and two theme-sensitive elements (the clue box, the "keep building" tip banner) inherited `var(--ink)` for both background and text, which flips in dark mode and made them nearly invisible | Raised the muted-text opacity in the export CSS; gave the clue box and tip banner fixed (non-theme-dependent) colour pairs, matching the already-correct win/lose banners |
| `aria-required-children` | The Word Search grid container used `role="grid"` but its cells were appended as plain buttons with no `role="row"` wrapper, which ARIA requires for that role | Removed `role="grid"`/kept `role="group"` with an `aria-label` instead -- the cells are native, fully keyboard-accessible `<button>`s and don't need the stricter grid pattern |

Run it yourself against a running instance:

```bash
npx lighthouse http://localhost:3000/wordle --only-categories=accessibility --view
```

To audit an exported file, generate one from the builder, serve it locally (e.g.
`npx serve .` in the folder it downloaded to, or Python's `python3 -m http.server`),
then point Lighthouse at that local URL the same way.