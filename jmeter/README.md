# JMeter Load Testing — Instructions

> **Note:** an earlier version of `phoneme-builder-load-test.jmx` was missing a
> required `Arguments` property on several samplers, which JMeter reported as
> `Property HTTPsampler.Arguments is unset for element ConfigTestElement@...` when
> opened. This has been fixed — every sampler and the HTTP Request Defaults element
> now carries the property JMeter expects, confirmed by re-parsing the file. If you
> still see that exact error, make sure you're using the file from this version of the
> project rather than an older copy.

This covers the assessment's load-testing requirement: staged traffic levels (x1, x10,
x100, x1000, x10000) against the builder and generated-activity workflow.

## What the test plan covers

`phoneme-builder-load-test.jmx` runs, per simulated user, in this order:

1. `GET /health` — asserts a 200 response
2. `GET /` — home page
3. `GET /manage` — **builder workflow**: the CRUD management page
4. `GET /api/activities` — list activities
5. `POST /api/activities` — **builder workflow**: create a new activity (unique name
   per thread/iteration, so concurrent users don't collide) — asserts a 201 response
6. `GET /wordle` — **generated-activity workflow**
7. `GET /wordsearch` — **generated-activity workflow**
8. `POST /api/metrics/generation` — simulates a successful "Generate" click
9. `GET /api/dashboard` — the observability endpoint this same load test feeds data into

Two listeners (Summary Report, Aggregate Report) write CSV results to `jmeter/results/`.

## Prerequisites

1. **Java** (JMeter requires a JRE) — https://adoptium.net/, any recent LTS version.
2. **Apache JMeter** — download from https://jmeter.apache.org/download_jmeter.cgi
   (the "Binaries" .zip/.tgz), extract it anywhere.
3. **The app running and reachable** — either:
   - `docker compose up --build` (recommended — matches what the video should show), or
   - `npm run build && npm run start` locally.

   Either way, confirm `http://localhost:3000/health` returns `200` before starting
   JMeter — a load test against a server that isn't up will just show 100% errors from
   the very first sample.

## Running a staged test (repeat once per load level)

### Option A — JMeter GUI (easiest to screenshot for the video)

1. Open JMeter (`jmeter.bat` on Windows, `jmeter.sh` on macOS/Linux, inside the
   extracted folder's `bin/` directory).
2. **File → Open** → select `jmeter/phoneme-builder-load-test.jmx`.
3. Click on the **"Builder + Activity Workflow"** Thread Group in the left tree.
4. Set **"Number of Threads (users)"** to the load level you're testing: `1`, `10`,
   `100`, `1000`, or `10000`.
5. Set **"Ramp-up period"** sensibly so JMeter doesn't try to fire all users in the
   same instant — a reasonable default is roughly `users / 10` seconds (e.g. 10 users
   → 1s ramp-up, 1000 users → 100s ramp-up). For very large runs (1000+), a longer
   ramp-up avoids the test itself being the bottleneck rather than your server.
6. Click the green **▶ Start** button (or `Ctrl+R`).
7. Open the **Summary Report** and **Aggregate Report** listeners (left tree) to watch
   results live — these are what you screenshot/screen-record for the video.
8. Once it finishes, note down (or screenshot): **Average response time**, **Error %**,
   **Throughput**, for this load level, then repeat from step 4 at the next level.

### Option B — Command line (faster for very large runs, no GUI overhead)

```bash
jmeter -n -t jmeter/phoneme-builder-load-test.jmx -Jusers=1     -Jrampup=1   -l jmeter/results/run-x1.jtl
jmeter -n -t jmeter/phoneme-builder-load-test.jmx -Jusers=10    -Jrampup=2   -l jmeter/results/run-x10.jtl
jmeter -n -t jmeter/phoneme-builder-load-test.jmx -Jusers=100   -Jrampup=10  -l jmeter/results/run-x100.jtl
jmeter -n -t jmeter/phoneme-builder-load-test.jmx -Jusers=1000  -Jrampup=60  -l jmeter/results/run-x1000.jtl
jmeter -n -t jmeter/phoneme-builder-load-test.jmx -Jusers=10000 -Jrampup=300 -l jmeter/results/run-x10000.jtl
```

Then generate an HTML report from any `.jtl` file for a shareable summary:

```bash
jmeter -g jmeter/results/run-x100.jtl -o jmeter/results/report-x100
```
Open `jmeter/results/report-x100/index.html` in a browser.

## What to actually look for at each level (for the video's explanation)

| Level | What to expect / watch for |
|---|---|
| x1 | Baseline — near-instant responses, 0% errors. This is your reference point. |
| x10 | Should still look close to baseline on a dev machine. |
| x100 | Response times likely start climbing; watch whether errors stay at 0%. |
| x1000 | This is where a single Postgres container + a single Next.js dev/prod process
  commonly shows real strain — rising average response time, and possibly the first
  non-zero error percentage (connection pool exhaustion is a common cause — Prisma's
  default connection pool size is modest). |
| x10000 | Very likely to show meaningful errors and/or timeouts on a single-container
  local setup — this is expected and worth explaining in the video, not something to
  "fix" by pretending it didn't happen. Explain **why** (e.g. Postgres connection
  limits, a single Node.js process handling everything, no horizontal scaling) rather
  than just reporting the number. |

**For the video:** show the Summary/Aggregate Report for at least two contrasting
levels (e.g. x1 vs x1000 or x10000) side by side, and explain in your own words why the
behaviour changed — that explanation is worth more than the raw numbers themselves.

## Troubleshooting

- **All samples fail immediately (Connection refused):** the app isn't running, or
  `HOST`/`PORT` in the test plan (User Defined Variables, top of the tree) don't match
  where it's actually listening. Default is `localhost:3000`.
- **`OutOfMemoryError` at high thread counts:** JMeter's default heap is small. Before
  large runs, increase it via the `JVM_ARGS` environment variable, e.g.
  `set JVM_ARGS=-Xms1g -Xmx4g` (Windows) or `export JVM_ARGS="-Xms1g -Xmx4g"`
  (macOS/Linux) before launching JMeter, or edit `jmeter` startup script's heap
  settings directly.
- **Every `POST /api/activities` fails with a 400:** the `HTTP Request Defaults` config
  element sets JSON as the content type; if that got disabled, re-add a Content-Type
  header of `application/json`, or check the request body under the sampler's "Body
  Data" tab hasn't been altered.