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

## Testing

Database migrations, cascading deletes, and multi-character phoneme storage were
verified directly against PostgreSQL. Every API route (create, read, update, delete,
validation, and cascade behaviour) was tested end-to-end over HTTP. The Wordle and
Word Search builders' database-driven generation was verified in the browser,
including confirming that an activity's own settings (difficulty, grid size) are
correctly applied when a saved activity is loaded, not just its word list.
