// Deterministic-ish word search grid builder that places one phoneme
// TOKEN per cell (a token may be multi-character, e.g. "tʃ"), so the
// grid reads as real phoneme sequences rather than single letters.

export interface Direction {
  dr: number;
  dc: number;
}

export interface Placement {
  tokens: string[];
  row: number;
  col: number;
  dir: Direction;
}

export interface WordSearchResult {
  grid: string[][];
  placements: Placement[];
  rows: number;
  cols: number;
}

const DIRECTIONS: Direction[] = [
  { dr: 0, dc: 1 }, // across
  { dr: 1, dc: 0 }, // down
  { dr: 1, dc: 1 }, // diagonal down-right
];

const FILLER_TOKENS = ["s", "t", "n", "k", "m", "æ", "ɪ", "ʃ", "ɹ", "p", "b", "d", "f", "v"];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildWordSearch(
  words: string[][],
  rows = 10,
  cols = 10,
  seed = 42
): WordSearchResult {
  const rand = seededRandom(seed);
  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const placements: Placement[] = [];

  const sorted = [...words].sort((a, b) => b.length - a.length);

  for (const tokens of sorted) {
    let placed = false;
    for (let attempt = 0; attempt < 250 && !placed; attempt++) {
      const dir = DIRECTIONS[Math.floor(rand() * DIRECTIONS.length)];
      const maxRow = rows - (dir.dr ? tokens.length - 1 : 0);
      const maxCol = cols - (dir.dc ? tokens.length - 1 : 0);
      if (maxRow <= 0 || maxCol <= 0) continue;
      const row = Math.floor(rand() * maxRow);
      const col = Math.floor(rand() * maxCol);

      let fits = true;
      for (let i = 0; i < tokens.length; i++) {
        const r = row + dir.dr * i;
        const c = col + dir.dc * i;
        const existing = grid[r][c];
        if (existing && existing !== tokens[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;

      for (let i = 0; i < tokens.length; i++) {
        const r = row + dir.dr * i;
        const c = col + dir.dc * i;
        grid[r][c] = tokens[i];
      }
      placements.push({ tokens, row, col, dir });
      placed = true;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c]) {
        grid[r][c] = FILLER_TOKENS[Math.floor(rand() * FILLER_TOKENS.length)];
      }
    }
  }

  return { grid: grid as string[][], placements, rows, cols };
}
