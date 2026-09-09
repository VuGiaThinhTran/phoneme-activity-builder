# Phoneme Activity Builder — Assessment 2

A Next.js + TypeScript app for Speech Pathology teachers to build phoneme-based
**Wordle** and **Word Search** classroom activities. Assessment 1 built the frontend;
Assessment 2 adds the backend, database, and Docker layer described below — the
frontend builder itself is unchanged in spirit, it now just reads and writes real,
persisted data instead of only working with values typed into the browser.

## What's new in Assessment 2

- **PostgreSQL database** (via **Prisma ORM**) storing teacher-created word lists —
  each a named "Activity" (Wordle or Word Search) with its own words and phoneme
  sequences, difficulty, and (for Word Search) grid size.
- **REST API routes** (Next.js Route Handlers) providing full CRUD for activities and
  words, with **Zod** validation and clear error messages.
- **A `/manage` page** — a real CRUD UI: create/list/edit/delete activities and their
  words, backed entirely by the API above.
- **The Wordle and Word Search builders can now load a saved activity from the
  database** ("Load a saved word list") and generate their downloadable `.html`
  output from that real, stored data — not just the static example corpus from
  Assessment 1.
- **`GET /health`** — a real health check that round-trips to the database, not just a
  hardcoded 200.
- **Docker** — the whole app + a Postgres service run via `docker compose up`.

## Tech stack

- Next.js (App Router) + React + TypeScript
- Prisma ORM + PostgreSQL
- Zod for request validation
- Docker + Docker Compose

## Project structure (additions since Assessment 1)

```
prisma/
  schema.prisma            The database schema (see below)
  migrations/               Committed SQL migration(s)
app/
  api/
    activities/route.ts             GET (list) / POST (create)
    activities/[id]/route.ts        GET (one) / PATCH / DELETE
    activities/[id]/words/route.ts  POST (add a word)
    words/[id]/route.ts             PATCH / DELETE
  health/route.ts            GET /health
  manage/page.tsx            CRUD UI for activities & words
lib/
  db.ts                      Prisma Client singleton
  validation.ts              Zod schemas + error formatting
  serialize.ts                Converts Prisma rows -> plain JSON for the frontend
  api-client.ts               Typed fetch() wrappers used by the frontend pages
Dockerfile
docker-compose.yml
docker-entrypoint.sh          Runs `prisma migrate deploy` before starting the app
.env.example
```

Note on file types: Assessment 1 required every frontend source file to be `.tsx` or
`.css`. That constraint was specific to the frontend-only scope of Assessment 1. The
new backend files above are legitimately `.ts` (not `.tsx`) because they contain no
JSX — this is standard practice for API route handlers, database, and validation code
in a Next.js project.

## Database schema

Three related tables (see `prisma/schema.prisma` for the full, commented version):

```
Activity  (id, name, activityType, difficulty, gridRows?, gridCols?, ...)
  |-- Word  (id, english, hint?, orderIndex, ...)
        |-- PhonemeSegment  (id, ipa, position)
```

**Why `PhonemeSegment` is its own table, not a delimited string column:** phoneme
symbols are variable-length -- `"n"` is one character, `"tʃ"` or `"æɪ"` are two. Storing
a word's phonemes as e.g. `"tʃ,ɪ,n"` and splitting on commas works, but storing each
phoneme as its own row with an explicit `position` column is the more robust,
normalized way to guarantee a multi-character symbol is never accidentally split or
corrupted, and it's what's used here.

**Why the phoneme *reference* table (the on-screen keyboard -- 43 IPA symbols, their
labels, and example words) is *not* in the database:** it's fixed, unchanging content --
every teacher sees the same keyboard. Per the assessment clarification, static content
like this can stay as a constant in the frontend code (`lib/phonemes.tsx`, carried over
from Assessment 1) rather than being duplicated into the database. Only the *dynamic*
word lists teachers actually create are persisted.

Cascading deletes are set up throughout: deleting an `Activity` deletes its `Word`s,
which deletes their `PhonemeSegment`s -- confirmed by direct testing (see "How this was
tested" below).

## Running with Docker (recommended)

```bash
docker compose up --build
```

This builds the app image, starts a Postgres container, waits for Postgres to report
healthy, then runs `npx prisma migrate deploy` (applying `prisma/migrations/`) before
starting the Next.js server. Once it's up:

- App: http://localhost:3000
- Health check: http://localhost:3000/health
- Manage activities: http://localhost:3000/manage

The Postgres password is set in plain text directly in `docker-compose.yml`
(`postgres` / `postgres`). This is a deliberate simplification accepted for this
assessment to keep the Docker setup simple -- proper secret management via `.env` files
and encrypted credentials is a later topic.

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

## How this was tested

`npx prisma generate` / `migrate` need to download a native engine binary from
Prisma's CDN -- this succeeds normally with regular internet access (on a real machine,
in CI, or during a Docker build), but was blocked in the specific sandboxed
environment this project was built in. To verify correctness anyway:

- The exact SQL in `prisma/migrations/20260101000000_init/migration.sql` was applied
  directly to a real local PostgreSQL instance and confirmed to create all tables,
  types, indexes, and foreign keys correctly.
- Multi-character phoneme storage (e.g. `"tʃ"`) and cascading deletes were both
  confirmed directly against that database.
- Every API route was exercised end-to-end over real HTTP (create, list, get-one,
  update, add-word, update-word/replace-phonemes, delete-word, delete-activity/cascade,
  and several validation-error cases) using a temporary raw-SQL stand-in for the
  Prisma Client, then reverted -- the actual shipped code uses `@prisma/client` as
  normal.
- The `/manage` page and the Wordle/Word Search builders' "load a saved word list"
  feature, including generating a downloadable `.html` file from data loaded out of
  the database, were tested in a real browser against the running app.
- Two later fixes were verified the same way: editing an existing activity's own
  settings (name/difficulty/grid size) via `/manage` and confirming the change
  persisted through a separate API call, and clearing a word's hint (an edge case
  where sending an empty string has to become an explicit `null` for Prisma to
  actually remove the value, rather than leaving the old one in place).

Running `npx prisma generate` is a completely normal, one-time step for any Prisma
project -- it will succeed as usual with normal internet access.

## How this maps to the marking rubric

| Rubric row | Where it's satisfied |
|---|---|
| Database schema and phoneme data model | `prisma/schema.prisma` — `Activity` → `Word` → `PhonemeSegment`. Multi-character phonemes, activity settings (`difficulty`, `gridRows`/`gridCols`), and multiple saved activity configurations are all modelled, using Prisma. |
| CRUD APIs and healthcheck | All 7 routes under "API reference" above; Zod validation with field-level error messages; `GET /health` round-trips to the DB. `/manage` provides full create/read/update/delete for **both** words and an activity's own settings (name, difficulty, grid size) — not just words. |
| Dockerize | `Dockerfile` + `docker-compose.yml` — multi-stage build, non-root runtime user, healthcheck, auto-migrate on start. |
| Activity generation and frontend-backend integration | The Wordle and Word Search builders' "Load a saved word list" control pulls real data from the API — including the stored **difficulty** and, for Word Search, the stored **grid size** — and Generate produces a downloadable `.html` file from that loaded data. |
| Code quality and GitHub practice | See "Git workflow" below for the branching approach; `.gitignore` excludes `node_modules`/`.next`/`.env`; this README is kept current. |

**Note on the submission brief's demonstration note:** the rubric document as supplied mentions showing *"the RSS Server sending feeds to the RSS Client"* — that doesn't apply to this project (there's no RSS feature here) and looks like it was copied from a different assignment's template and not updated. Worth confirming with the unit coordinator before recording the video, the same way the Assessment 1 brief was clarified by email — don't try to add an unrelated RSS feature based on it.

**Note on Docker "follows the lab pattern closely":** the `Dockerfile` here follows the standard, widely-taught multi-stage Node/Next.js Docker pattern (deps → builder → runner, non-root user, healthcheck). If your unit's lab used a specifically different structure, compare against it and adjust — this wasn't built from that lab material directly since it wasn't provided.

## Git workflow (for the "sensible branches" criterion)

The rubric rewards branches, not just commits on `main`. A simple, defensible structure:

```bash
git checkout -b feature/database-schema    # prisma/schema.prisma, migrations
# ...commit, then merge to main (or open a PR and merge on GitHub)

git checkout main && git checkout -b feature/api-routes    # app/api/**, lib/validation.ts, lib/serialize.ts
# ...

git checkout main && git checkout -b feature/manage-ui     # app/manage/page.tsx, lib/api-client.ts
# ...

git checkout main && git checkout -b feature/docker        # Dockerfile, docker-compose.yml, docker-entrypoint.sh
# ...

git checkout main && git checkout -b feature/frontend-integration   # the "load saved activity" additions to app/wordle and app/wordsearch
```

Each branch gets its own focused commit(s), then merges back into `main` (via `git merge` locally or a Pull Request on GitHub — a PR is the stronger signal for "sensible branches" since it's visible on the repo's Pull Requests tab). This also gives natural talking points for the video's GitHub segment.

## Before you submit

- [ ] Confirm with your instructor whether the "RSS Server/RSS Client" line in the
      demonstration checklist is a template error (see above) — don't build an
      unrelated RSS feature based on it
- [ ] Run `docker compose up --build` yourself once to confirm it works end-to-end on
      your machine
- [ ] Use a branching workflow (see "Git workflow" above) rather than committing
      everything to `main` directly
- [ ] Record the video walkthrough: student ID in the first 30 seconds, face + voice
      throughout, explain the backend/database, demonstrate CRUD on words, show the
      frontend generating output from stored data (including a non-default difficulty
      or grid size actually taking effect), show `/health` returning `200`, show the
      app running in Docker
- [ ] Remove `node_modules` (and `.next`) before zipping
- [ ] Include your GitHub repository link
