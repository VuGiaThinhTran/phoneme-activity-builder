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

## Changes since Assessment 3

- **Distributed tracing** with OpenTelemetry and Jaeger (see "Tracing" below).
- **Word Search no longer drops words silently.** The placement algorithm now reports
  any word it could not fit in the grid. The builder page warns about it live, counts
  "found X of N" over the words that are really in the puzzle, and refuses to generate
  an incomplete puzzle -- recording that as a failed generation so the dashboard's
  alert shows it. The exported file lists only words that are in its grid.
- **Unsupported phoneme symbols are rejected by the API** (`400`), instead of only being
  flagged afterwards on the dashboard.
- **The dashboard reports an unreachable database** ("Unhealthy -- database unreachable")
  instead of failing with a generic error.
- **An empty hint is stored as "no hint"** when creating a word (a schema bug had
  stored an empty string).
- **Security**: XSS fixes in the generated files, plus response headers (see "Security").
- **Unit and security tests** that need no server or database (see "Testing").

## Tech stack

- Next.js (App Router) + React + TypeScript
- Prisma ORM + PostgreSQL
- Zod for request validation
- Docker + Docker Compose
- OpenTelemetry (`@vercel/otel`) + Jaeger v2 for distributed tracing
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
instrumentation.ts                  Switches OpenTelemetry on when the server starts
lib/
  metrics-client.ts                 Client helpers: logGenerationEvent, reportPageViewOnLeave
  telemetry.ts                      withSpan / withDbSpan helpers for our own trace spans
prisma/
  migrations/20260201000000_add_observability/   GenerationEvent + PageViewMetric tables
tests/
  builder-crud.spec.ts              Playwright: builder use case (CRUD via /manage)
  generate-activity.spec.ts         Playwright: user use case (play + generate Wordle)
  unit/                             Fast tests, no server needed: parser, word-search
                                    placement, validation, and the XSS regression test
playwright.config.ts                End-to-end tests (npm run test:e2e)
playwright.unit.config.ts           Unit tests (npm run test:unit)
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

This builds the app image, starts a Postgres container and a Jaeger container (the
trace viewer, see "Tracing" below), waits for Postgres to report healthy, then runs
`npx prisma migrate deploy` (applying both migrations in `prisma/migrations/`) before
starting the Next.js server. Once it's up:

- App: http://localhost:3000
- Health check: http://localhost:3000/health
- Manage activities: http://localhost:3000/manage
- Dashboard: http://localhost:3000/dashboard
- Traces (Jaeger UI): http://localhost:16686

The Postgres password is set in plain text directly in `docker-compose.yml`
(`postgres` / `postgres`) -- a deliberate, accepted simplification to keep the Docker
setup simple; proper secret management is a later topic.

To stop: `docker compose down` (add `-v` to also wipe the database volume and start
fresh next time).

### Optional: load example data

With the app running, `npm run seed:demo` adds five example activities (two Wordle, two
Word Search, and one deliberately empty one so the dashboard's "no words yet" alert has
something to show) through the app's own API. It skips any activity that already exists,
so it's safe to run more than once.

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
Phoneme symbols must be one of the app's 43 supported symbols (the on-screen
keyboard), so a look-alike such as `ʌ` is rejected with a field message.

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
  If the database cannot be reached it says "Unhealthy -- database unreachable", states
  that the figures are unavailable, and keeps checking every 15 seconds.
- **Alerts** -- three categories, each only shown when real: recent failed
  generations (with the error reason -- including a Word Search whose words do not
  fit the grid), any activity that has no words yet, and any saved word using a
  phoneme symbol outside the app's 43-symbol keyboard. The API now rejects such
  symbols when a word is saved, so this last alert is a safety net for rows that got
  in another way (data saved before that check existed, or edited directly in the
  database). Each alert links straight to `/manage` to fix it.
- **Stat cards** -- activities created (by type), words stored, most-used activity
  type, average time on page, successful/failed generation counts, and the resulting
  success rate.
- **Breakdown tables** -- average time on page per individual page, and generation
  counts per activity type.

Every number comes from a real aggregate query (`groupBy`, `aggregate`, `count`)
against the two new tables plus the existing `Activity`/`Word` tables -- see
`app/api/dashboard/route.ts`.

## Tracing (OpenTelemetry + Jaeger)

The dashboard answers "how is the system doing overall?" (counts and rates stored in
PostgreSQL). Tracing answers a different question: "what happened inside *this one*
request, and where did the time go?"

`instrumentation.ts` turns on OpenTelemetry when the server starts. Next.js then
records a span for every request it handles, and `lib/telemetry.ts` lets us add our
own child spans inside it. The spans are exported over OTLP/HTTP to Jaeger, which
`docker-compose.yml` runs as a third container. Open http://localhost:16686, pick the
service `phoneme-builder`, and search.

Creating an activity (`POST /api/activities`) produces this trace:

```
POST /api/activities                      Next.js: the HTTP request
  executing api route (app) /api/activities   Next.js: the route handler
    activities.create                     ours: whole handler (activity.type, activity.word_count)
      activities.validate                 ours: Zod check (validation.success)
      db INSERT activities                ours: the call to PostgreSQL (kind CLIENT,
                                                  server.address = db, server.port = 5432)
      activities.serialize                ours: turn DB rows into the JSON response
```

Also traced the same way: `GET /api/activities/[id]` (spans `activities.get` and
`db SELECT activities`, with `activity.found`) and `POST /api/metrics/generation`
(`metrics.record_generation` and `db INSERT generation_events`). A request rejected by
validation shows `validation.failed = true` and, correctly, no database span.

Where the spans go is configured with environment variables, not code
(`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`, set for the app in
`docker-compose.yml`). If Jaeger is not running the spans are dropped and the app is
unaffected.

Limits worth knowing: the trace starts at the server (the browser is not
instrumented, so the `fetch` from the page is not a span); Jaeger keeps traces in
memory, so they disappear when its container restarts; and Docker's healthcheck calls
`/health` every 15 seconds, so Jaeger also lists a steady stream of `GET /health`
traces -- filter by operation to hide them. Metrics remain the database-backed ones
described above; Prometheus is not used.

## Security

- **SQL injection:** every query goes through Prisma, which sends values as bound
  parameters. The only raw SQL in the project is the constant `SELECT 1` health check,
  with no user input in it.
- **Cross-site scripting:** React escapes everything the app's own pages render, and
  nothing uses `dangerouslySetInnerHTML`. The risk was the generated `.html` files,
  which are built as plain strings, so a teacher-typed spelling, hint or phoneme could
  have run as script for whoever opened the file. Three defences, one per context:
  `escapeHtml()` for text and attributes, `safeJsonForScript()` (turns every `<` into
  `\u003c`) for data embedded in a `<script>` tag so `</script>` cannot break out, and
  `escHtml()` inside the file's own script before it uses `innerHTML`. Every other
  write into the page uses `textContent`. `tests/unit/export-security.spec.ts` loads
  the generated files into a real browser with hostile text and fails if anything runs
  -- it was checked to fail when the three defences are removed.
- **Input validation:** every body is validated on the server with Zod (lengths, grid
  size, the phoneme set), never trusting the browser.
- **Response headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options:
  SAMEORIGIN`, `Referrer-Policy`, and no `X-Powered-By`.
- **Dependencies:** Next.js was upgraded to 16.3.6 after a critical remote-code-execution
  advisory in 16.2.12. `npm audit` still reports 4 high-severity issues, all in the
  build tooling (`prisma`, `source-map-js`), not in code that runs for users.

Known gaps, deliberately out of scope: the API has no authentication or rate limiting
(anyone who can reach the port can read and write); no Content-Security-Policy (the app
and its theme script use inline scripts, so a correct policy needs per-request nonces);
and the database password is plain text in `docker-compose.yml` with port 5432
published, both accepted simplifications for this project.

## Testing

### Manual/integration verification

Database migrations, cascading deletes, multi-character phoneme storage, and the
dashboard's aggregate queries were all verified directly against PostgreSQL. Every API
route was tested end-to-end over HTTP, including the new metrics endpoints and the
dashboard's alert conditions (a failed generation, an activity with zero words, a word
using an unsupported phoneme). `npx eslint .` runs clean with zero errors across the
whole project.

### Unit and security tests (no server needed)

```bash
npm run test:unit
```

26 fast tests, using the Playwright runner but needing no app, database or Docker:
the word-list parser (multi-character symbols, optional hints), the word-search
placement (deterministic by seed, every placed word readable in the grid, words that
do not fit are reported, homophones counted one-for-one), request validation (grid
limits, the phoneme set, empty hints), and the XSS regression test described under
"Security".

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
