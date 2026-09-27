import { test, expect } from "@playwright/test";

/**
 * Builder use case: a teacher creates a saved activity, adds a word, edits
 * both the word and the activity's own settings, confirms the change
 * persisted (a real reload, not just React state), then deletes the word and
 * the activity. This is the CRUD workflow the Assessment 2 backend added and
 * Assessment 3's dashboard reports on.
 */
test("teacher can create, read, update, and delete an activity and its words", async ({ page }) => {
  const activityName = `E2E Builder Test ${Date.now()}`;

  await page.goto("/manage");
  await expect(page.locator("h1")).toHaveText("Manage activities");

  // --- Create -----------------------------------------------------------
  await page.fill("#new-name", activityName);
  await page.selectOption("#new-type", "WORDLE");
  await page.locator('button:has-text("Create activity")').click();
  await expect(page.locator(`h2:has-text("${activityName}")`)).toBeVisible({ timeout: 10_000 });

  // --- Create (add a word) -----------------------------------------------
  await page.fill('input[placeholder="Spelling, e.g. ship"]', "ship");
  await page.fill('input[placeholder="Phonemes, e.g. ʃ ɪ p"]', "ʃ ɪ p");
  await page.fill('input[placeholder="Hint (optional)"]', "a large boat");
  await page.locator('button:has-text("Add")').click();
  await expect(page.locator("span.font-mono.font-bold", { hasText: "SHIP" })).toBeVisible({ timeout: 5_000 });

  // --- Update (edit the word) ---------------------------------------------
  await page.locator("li").filter({ hasText: "SHIP" }).locator('button:has-text("Edit")').click();
  const englishInput = page.locator('input[value="ship"]');
  await englishInput.fill("chip");
  await page.locator('button:has-text("Save")').click();
  await expect(page.locator("span.font-mono.font-bold", { hasText: "CHIP" })).toBeVisible({ timeout: 5_000 });

  // --- Update (edit the activity's own settings, separate from the word) --
  await page.locator('button:has-text("Edit settings")').click();
  await page.selectOption("#edit-act-difficulty", "HARD");
  await page.locator('button:has-text("Save")').click();
  await expect(page.locator("text=hard difficulty")).toBeVisible({ timeout: 5_000 });

  // --- Read (confirm it's really persisted, not just in-memory state) -----
  await page.reload();
  await expect(page.locator(`h2:has-text("${activityName}")`)).not.toBeVisible();
  await page.locator("li", { hasText: activityName }).first().click();
  await expect(page.locator("text=hard difficulty")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("span.font-mono.font-bold", { hasText: "CHIP" })).toBeVisible();

  // --- Delete (the word, then the whole activity) --------------------------
  page.once("dialog", (d) => d.accept());
  await page.locator("li").filter({ hasText: "CHIP" }).locator('button:has-text("Delete")').click();
  await expect(page.locator("h3:has-text('Word list')")).toContainText("(0)", { timeout: 5_000 });

  page.once("dialog", (d) => d.accept());
  await page.locator('button:has-text("Delete activity")').click();
  await expect(page.locator(`h2:has-text("${activityName}")`)).not.toBeVisible({ timeout: 5_000 });
});