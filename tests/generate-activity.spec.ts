import { test, expect } from "@playwright/test";

/**
 * User use case: a student/teacher opens the Wordle builder, interacts with
 * the phoneme keyboard to fill in a guess (viewing/using the activity), then
 * generates a downloadable, playable HTML file from it. Verifies both the
 * interaction itself and that the exported file is genuinely valid — this is
 * also what feeds the "successful generation" counter on the dashboard.
 */
test("user can interact with the Wordle board and generate a playable activity file", async ({ page }) => {
  await page.goto("/wordle");
  await expect(page.locator("h1")).toHaveText("Wordle builder");

  // --- View/use: type a guess on the phoneme keyboard ----------------------
  await page.keyboard.press("p");
  const firstTile = page.locator(".phoneme-tile").first();
  await expect(firstTile).toContainText("P");

  await page.keyboard.press("Enter"); // submit the guess
  await expect(page.locator(".feedback-banner")).toBeVisible({ timeout: 5_000 });

  // --- Generate: download a real, playable HTML file -----------------------
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator('button:has-text("Generate playable .html")').click(),
  ]);
  expect(download.suggestedFilename()).toBe("phoneme-wordle.html");

  const filePath = await download.path();
  expect(filePath).toBeTruthy();
  const fs = await import("fs");
  const html = fs.readFileSync(filePath as string, "utf8");

  // The generated file must be genuinely self-contained and syntactically
  // valid — not just "a download happened". This is exactly the kind of
  // check that caught a real ternary-syntax bug earlier in this project.
  expect(html).toContain("<html");
  expect(html).toContain("Phoneme Wordle");
  const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
  expect(scriptMatch).not.toBeNull();
  expect(() => new Function(scriptMatch![1])).not.toThrow();
});