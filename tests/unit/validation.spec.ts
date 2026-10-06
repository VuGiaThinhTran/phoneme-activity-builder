import { test, expect } from "@playwright/test";
import { activityInputSchema, wordInputSchema } from "../../lib/validation";

const goodWord = { english: "ship", phonemes: ["ʃ", "ɪ", "p"] };

test.describe("activityInputSchema", () => {
  test("accepts a Wordle activity with no grid size", () => {
    expect(activityInputSchema.safeParse({ name: "A", activityType: "WORDLE" }).success).toBe(true);
  });

  test("a Word Search activity must have both gridRows and gridCols", () => {
    const missing = activityInputSchema.safeParse({ name: "A", activityType: "WORD_SEARCH" });
    expect(missing.success).toBe(false);
    const ok = activityInputSchema.safeParse({ name: "A", activityType: "WORD_SEARCH", gridRows: 10, gridCols: 10 });
    expect(ok.success).toBe(true);
  });

  test("grid size is limited to 5-20", () => {
    const grid = (n: number) => activityInputSchema.safeParse({ name: "A", activityType: "WORD_SEARCH", gridRows: n, gridCols: 10 }).success;
    expect([grid(4), grid(5), grid(20), grid(21)]).toEqual([false, true, true, false]);
  });

  test("rejects an empty name and an unknown activity type", () => {
    expect(activityInputSchema.safeParse({ name: "", activityType: "WORDLE" }).success).toBe(false);
    expect(activityInputSchema.safeParse({ name: "A", activityType: "CROSSWORD" }).success).toBe(false);
  });

  test("validates the nested words too", () => {
    const bad = activityInputSchema.safeParse({ name: "A", activityType: "WORDLE", words: [{ english: "", phonemes: ["p"] }] });
    expect(bad.success).toBe(false);
  });
});

test.describe("wordInputSchema", () => {
  test("accepts multi-character phoneme symbols", () => {
    expect(wordInputSchema.safeParse({ english: "chin", phonemes: ["tʃ", "ɪ", "n"] }).success).toBe(true);
  });

  test("rejects a symbol that is not on the keyboard (the 'ʌ' vs 'ɐ' mix-up)", () => {
    const result = wordInputSchema.safeParse({ english: "sun", phonemes: ["s", "ʌ", "n"] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["phonemes", 1]);
  });

  test("rejects an over-long token and an empty word", () => {
    expect(wordInputSchema.safeParse({ english: "x", phonemes: ["abcde"] }).success).toBe(false);
    expect(wordInputSchema.safeParse({ english: "x", phonemes: [] }).success).toBe(false);
  });

  test("an empty hint becomes 'no hint'; an over-long hint is rejected", () => {
    const empty = wordInputSchema.safeParse({ ...goodWord, hint: "" });
    expect(empty.success && empty.data.hint).toBeUndefined();
    expect(wordInputSchema.safeParse({ ...goodWord, hint: "x".repeat(281) }).success).toBe(false);
    expect(wordInputSchema.safeParse({ ...goodWord, hint: "x".repeat(280) }).success).toBe(true);
  });
});
