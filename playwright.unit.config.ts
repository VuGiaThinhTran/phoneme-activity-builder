import { defineConfig, devices } from "@playwright/test";

/**
 * Fast tests that need NO running app, NO database and NO Docker:
 *   - pure logic (word-list parser, word-search placement, request validation)
 *   - the generated .html files, loaded into a real Chromium page, to prove
 *     teacher-typed text can't inject script (the XSS regression test)
 *
 * Run with: npm run test:unit
 * (The end-to-end tests in tests/*.spec.ts use playwright.config.ts instead.)
 */
export default defineConfig({
  testDir: "./tests/unit",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
