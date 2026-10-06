import { test, expect, type Page } from "@playwright/test";
import { buildWordleHtml, buildWordSearchHtml } from "../../lib/exportHtml";

/**
 * XSS regression test for the generated .html files.
 *
 * The exports are built as plain strings (not through React), so teacher-typed
 * text gets none of JSX's automatic escaping. This loads the real generated
 * files into a real browser with hostile text in every field a teacher controls
 * (spelling, hint, phoneme symbol) and checks that nothing executes and the
 * text is shown as plain text.
 */
const SPELLING = `<img src=x onerror="window.__pwned=1">`;
const HINT = `</script><script>window.__pwned=1</script>`;
const hostileWord = { english: SPELLING, hint: HINT, phonemes: ["<im", "ɪ", "p"] };

type Pwnable = { __pwned?: number };

async function load(page: Page, html: string) {
  const dialogs: string[] = [];
  page.on("dialog", async (d) => {
    dialogs.push(d.message());
    await d.dismiss();
  });
  await page.setContent(html);
  return dialogs;
}

test("Wordle export: hostile spelling, hint and phoneme are shown as text and run nothing", async ({ page }) => {
  const dialogs = await load(page, buildWordleHtml({ words: [hostileWord], difficulty: "easy", darkMode: false }));

  expect(await page.evaluate(() => (window as unknown as Pwnable).__pwned)).toBeUndefined();
  expect(dialogs).toEqual([]);
  expect(await page.locator("img").count()).toBe(0); // the <img onerror> never became an element
  expect(await page.locator("im").count()).toBe(0); // nor did the "<im" phoneme become a tag

  // The answer key shows the spelling and hint as literal text.
  await page.locator("details summary").click();
  const cells = page.locator("details table tbody td");
  await expect(cells.first()).toHaveText(SPELLING.toUpperCase());
  await expect(cells.nth(2)).toHaveText(HINT);

  // The clue box shows the hint as text; the revealed first tile shows "<im" as text.
  await expect(page.locator("#clue")).toContainText(HINT);
  await expect(page.locator("#board [data-state='hint']").first()).toContainText("<im");
});

test("Word Search export: hostile spelling and phoneme are shown as text and run nothing", async ({ page }) => {
  const words = [hostileWord, { english: "ship", phonemes: ["ʃ", "ɪ", "p"] }];
  const dialogs = await load(page, buildWordSearchHtml({ words, rows: 10, cols: 10, seed: 3, revealAnswers: true, darkMode: false }));

  expect(await page.evaluate(() => (window as unknown as Pwnable).__pwned)).toBeUndefined();
  expect(dialogs).toEqual([]);
  expect(await page.locator("img").count()).toBe(0);

  await expect(page.locator("li strong").first()).toHaveText(SPELLING.toUpperCase());
});

test("a word list with a closing script tag inside the data cannot break out of the page script", async ({ page }) => {
  const html = buildWordleHtml({ words: [hostileWord], difficulty: "normal", darkMode: false });
  // The raw sequence that would end the <script> block must not appear inside the embedded data.
  const dataLine = html.split("\n").find((line) => line.includes("const DATA ="))!;
  expect(dataLine).not.toContain("</script>");
  await load(page, html);
  expect(await page.evaluate(() => (window as unknown as Pwnable).__pwned)).toBeUndefined();
});
