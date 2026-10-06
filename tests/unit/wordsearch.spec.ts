import { test, expect } from "@playwright/test";
import { buildWordSearch, findUnplacedWords } from "../../lib/wordsearch";
import { WORD_SEARCH_LIST } from "../../lib/phonemes";

const WORDS = [
  ["ʃ", "ɪ", "p"],
  ["tʃ", "ɪ", "n"],
  ["f", "ɹ", "ɔ", "g"],
  ["m", "ɪ", "l", "k"],
];

test.describe("buildWordSearch", () => {
  test("returns a full rows x cols grid with no empty cells", () => {
    const { grid } = buildWordSearch(WORDS, 8, 12, 7);
    expect(grid).toHaveLength(8);
    for (const row of grid) {
      expect(row).toHaveLength(12);
      for (const cell of row) expect(cell).toBeTruthy();
    }
  });

  test("is deterministic: the same seed gives the same puzzle, another seed a different one", () => {
    const a = buildWordSearch(WORDS, 10, 10, 123);
    const b = buildWordSearch(WORDS, 10, 10, 123);
    const c = buildWordSearch(WORDS, 10, 10, 124);
    expect(b.grid).toEqual(a.grid);
    expect(c.grid).not.toEqual(a.grid);
  });

  test("every placed word can be read back from the grid along its direction", () => {
    const { grid, placements } = buildWordSearch(WORDS, 10, 10, 99);
    expect(placements.length).toBeGreaterThan(0);
    for (const p of placements) {
      p.tokens.forEach((token, i) => {
        expect(grid[p.row + p.dir.dr * i][p.col + p.dir.dc * i]).toBe(token);
      });
    }
  });

  test("places the whole built-in word list in the default 10x10 grid", () => {
    const { placements, unplaced } = buildWordSearch(WORD_SEARCH_LIST.map((w) => w.phonemes), 10, 10, 42);
    expect(unplaced).toEqual([]);
    expect(placements).toHaveLength(WORD_SEARCH_LIST.length);
  });

  test("a word too long for the grid is reported as unplaced, not silently dropped", () => {
    const tooLong = ["p", "t", "k", "b", "d", "g"]; // 6 tokens can never fit in 5x5
    const { placements, unplaced } = buildWordSearch([tooLong, ["p", "t"]], 5, 5, 1);
    expect(unplaced).toEqual([tooLong]);
    expect(placements).toHaveLength(1);
    expect(placements[0].tokens).toEqual(["p", "t"]);
  });
});

test.describe("findUnplacedWords", () => {
  const word = (english: string, phonemes: string[]) => ({ english, phonemes });

  test("maps unplaced phoneme sequences back to the words that own them", () => {
    const words = [word("ship", ["ʃ", "ɪ", "p"]), word("chin", ["tʃ", "ɪ", "n"])];
    expect(findUnplacedWords(words, [["tʃ", "ɪ", "n"]]).map((w) => w.english)).toEqual(["chin"]);
  });

  test("counts words with identical phonemes (homophones) one-for-one", () => {
    const words = [word("to", ["t", "u"]), word("too", ["t", "u"])];
    expect(findUnplacedWords(words, [["t", "u"]])).toHaveLength(1);
    expect(findUnplacedWords(words, [["t", "u"], ["t", "u"]])).toHaveLength(2);
  });

  test("returns nothing when every word was placed", () => {
    expect(findUnplacedWords([word("ship", ["ʃ", "ɪ", "p"])], [])).toEqual([]);
  });
});
