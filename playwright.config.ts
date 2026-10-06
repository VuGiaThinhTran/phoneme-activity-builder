import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the two required end-to-end tests (Assessment 3):
 * one covering a builder use case (CRUD on a word list/activity), one
 * covering a user use case (generating/viewing an activity).
 *
 * Requires the app's database to be reachable — run `docker compose up` (or
 * have a local Postgres + `npx prisma migrate deploy` applied) before running
 * these tests, since they exercise real API routes backed by real data, not
 * mocks.
 */
export default defineConfig({
  testDir: "./tests",
  testIgnore: "**/unit/**", // those run via playwright.unit.config.ts (npm run test:unit)
  fullyParallel: false,
  retries: 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
