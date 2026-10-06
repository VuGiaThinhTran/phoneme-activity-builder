import { test, expect } from "@playwright/test";
import { parsePhonemeWordList } from "../../lib/phonemes";

test.describe("parsePhonemeWordList", () => {
  test("reads phonemes, spelling and hint from 'phonemes = spelling | hint'", () => {
    const [word] = parsePhonemeWordList("ʃ ɪ p = ship | A large boat");
    expect(word.phonemes).toEqual(["ʃ", "ɪ", "p"]);
    expect(word.english).toBe("ship");
    expect(word.hint).toBe("A large boat");
  });

  test("keeps multi-character phoneme symbols as single tokens", () => {
    const [word] = parsePhonemeWordList("tʃ ɪ n = chin");
    expect(word.phonemes).toEqual(["tʃ", "ɪ", "n"]);
    expect(word.phonemes).toHaveLength(3);
  });

  test("hint is optional, and an empty hint after the bar becomes undefined", () => {
    expect(parsePhonemeWordList("p t k = pat")[0].hint).toBeUndefined();
    expect(parsePhonemeWordList("p t k = pat |")[0].hint).toBeUndefined();
  });

  test("ignores blank lines and tolerates extra whitespace", () => {
    const words = parsePhonemeWordList("\n  ʃ   ɪ  p = ship  \n\n\t p t k = pat\n");
    expect(words.map((w) => w.english)).toEqual(["ship", "pat"]);
  });

  test("without '=' the spelling is derived from the phoneme labels", () => {
    expect(parsePhonemeWordList("p t k")[0].english).toBe("ptk");
  });

  test("an empty list parses to no words", () => {
    expect(parsePhonemeWordList("")).toEqual([]);
    expect(parsePhonemeWordList("   \n  \n")).toEqual([]);
  });
});
