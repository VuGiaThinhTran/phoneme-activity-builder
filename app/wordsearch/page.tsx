"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { WORD_SEARCH_LIST, findPhoneme, parsePhonemeWordList, formatPhonemeWordList, PhonemeWord } from "@/lib/phonemes";
import { buildWordSearch } from "@/lib/wordsearch";
import { buildWordSearchHtml } from "@/lib/exportHtml";

const BTN = "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none";

export default function WordSearchPage() {
  const [wordsText, setWordsText] = useState(formatPhonemeWordList(WORD_SEARCH_LIST));
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [seed, setSeed] = useState(42);
  const [showAnswers, setShowAnswers] = useState(false);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [banner, setBanner] = useState<{ type: "win" | "lose" | "tip"; text: string } | null>(null);
  const startRef = useRef<{ r: number; c: number } | null>(null);

  const words: PhonemeWord[] = useMemo(() => {
    const parsed = parsePhonemeWordList(wordsText);
    return parsed.length ? parsed : WORD_SEARCH_LIST;
  }, [wordsText]);

  const tokenLists = useMemo(() => words.map((w) => w.phonemes), [words]);
  const puzzle = useMemo(() => buildWordSearch(tokenLists, rows, cols, seed), [tokenLists, rows, cols, seed]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), banner.type === "win" ? 4000 : 2000);
    return () => clearTimeout(t);
  }, [banner]);

  function cellKey(r: number, c: number) {
    return `${r}-${c}`;
  }
  function isAnswerCell(r: number, c: number) {
    return puzzle.placements.some((p) => p.tokens.some((_, i) => p.row + p.dir.dr * i === r && p.col + p.dir.dc * i === c));
  }

  function startSelect(r: number, c: number) {
    setSelecting(true);
    startRef.current = { r, c };
    setSelection([cellKey(r, c)]);
  }
  function computePath(r: number, c: number): string[] {
    if (!startRef.current) return [cellKey(r, c)];
    const { r: sr, c: sc } = startRef.current;
    const dr = Math.sign(r - sr) || 0;
    const dc = Math.sign(c - sc) || 0;
    const cells: string[] = [];
    let rr = sr,
      cc = sc;
    cells.push(cellKey(rr, cc));
    let steps = 0;
    while ((rr !== r || cc !== c) && steps < Math.max(rows, cols)) {
      rr = Math.min(rows - 1, Math.max(0, rr + dr));
      cc = Math.min(cols - 1, Math.max(0, cc + dc));
      cells.push(cellKey(rr, cc));
      steps++;
      if (rr === r && cc === c) break;
    }
    return cells;
  }
  function moveSelect(r: number, c: number) {
    if (!selecting || !startRef.current) return;
    setSelection(computePath(r, c));
  }
  // Evaluates a specific cell path directly (rather than reading `selection`
  // state, which may not have re-rendered yet if called right after a state
  // update in the same event — e.g. the keyboard flow below).
  function commitSelection(cells: string[]) {
    setSelecting(false);
    const tokens = cells.map((k) => {
      const [r, c] = k.split("-").map(Number);
      return puzzle.grid[r]?.[c] ?? "";
    });
    const reversed = [...tokens].reverse();
    const match = words.find(
      (w) => JSON.stringify(w.phonemes) === JSON.stringify(tokens) || JSON.stringify(w.phonemes) === JSON.stringify(reversed)
    );
    if (match && !found.has(match.english)) {
      const nextFound = new Set(found).add(match.english);
      setFound(nextFound);
      if (nextFound.size === words.length) {
        setBanner({ type: "win", text: `🎉 Correct! All ${words.length} words found — nice work!` });
      } else {
        setBanner({
          type: "win",
          text: `🎉 Correct! "${match.english.toUpperCase()}" — ${words.length - nextFound.size} word${
            words.length - nextFound.size === 1 ? "" : "s"
          } to go.`,
        });
      }
    } else if (cells.length > 1 && !match) {
      setBanner({ type: "lose", text: "Not a match — try another direction." });
    }
    setSelection([]);
  }
  function endSelect() {
    commitSelection(selection);
  }

  // Keyboard support: focus a cell and press Enter/Space to mark the start
  // of a word, arrow keys to move, then Enter/Space again on the last
  // letter to check it — a full alternative to click-and-drag.
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  function focusCell(r: number, c: number) {
    const clampedR = Math.min(rows - 1, Math.max(0, r));
    const clampedC = Math.min(cols - 1, Math.max(0, c));
    cellRefs.current[clampedR * cols + clampedC]?.focus();
  }
  function focusFlatIndex(index: number) {
    const total = rows * cols;
    const wrapped = ((index % total) + total) % total;
    cellRefs.current[wrapped]?.focus();
  }
  function handleCellKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>, r: number, c: number) {
    switch (e.key) {
      case "ArrowRight":
        // Reading-order navigation: at the end of a row, continue onto the
        // start of the next row (wrapping from the last cell back to the
        // first), matching the Wordle keyboard's Left/Right behaviour.
        e.preventDefault();
        focusFlatIndex(r * cols + c + 1);
        return;
      case "ArrowLeft":
        e.preventDefault();
        focusFlatIndex(r * cols + c - 1);
        return;
      case "ArrowDown":
        e.preventDefault();
        focusCell(r + 1, c);
        return;
      case "ArrowUp":
        e.preventDefault();
        focusCell(r - 1, c);
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!selecting) {
          startSelect(r, c);
        } else {
          const path = computePath(r, c);
          setSelection(path);
          commitSelection(path);
        }
        return;
      case "Escape":
        setSelecting(false);
        setSelection([]);
        return;
    }
  }

  function handleGeneratePuzzle() {
    setSeed(Math.floor(Math.random() * 100000));
    setFound(new Set());
    setBanner(null);
  }

  function handleDownload() {
    const darkMode = document.documentElement.classList.contains("dark");
    const html = buildWordSearchHtml({ words, rows, cols, seed, revealAnswers: showAnswers, darkMode });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "phoneme-wordsearch.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 grid lg:grid-cols-[320px_1fr] gap-8">
      {banner && (
        <div className={`feedback-banner ${banner.type}`} role="status" aria-live="assertive">
          {banner.text}
        </div>
      )}

      <aside className="rounded-lg border-2 p-5 h-fit" style={{ borderColor: "var(--line)" }}>
        <h1 className="font-display text-xl font-bold">Word Search builder</h1>

        <label className="block mt-6 text-sm font-semibold" htmlFor="words">
          Words (space-separated phonemes)
        </label>
        <textarea
          id="words"
          value={wordsText}
          onChange={(e) => setWordsText(e.target.value)}
          rows={6}
          spellCheck={false}
          className="mt-2 w-full rounded-md border-2 p-2 font-mono text-sm"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
          placeholder={"b e d = bed\nʃ ɪ p = ship"}
        />
        <p className="text-xs opacity-60 mt-1">
          One word per line: phonemes, then <code>= spelling</code>, e.g. <code>tʃ ɪ n = chin</code>.
          Pre-loaded with 8 words from the HCE corpus, spanning 3-5 phonemes.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-sm font-semibold" htmlFor="rows">
              Rows
            </label>
            <input
              id="rows"
              type="number"
              min={6}
              max={16}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value) || 10)}
              className="mt-1 w-full rounded-md border-2 p-2 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="cols">
              Cols
            </label>
            <input
              id="cols"
              type="number"
              min={6}
              max={16}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value) || 10)}
              className="mt-1 w-full rounded-md border-2 p-2 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleGeneratePuzzle}
          className={`mt-5 w-full rounded-md px-4 py-3 font-semibold text-white ${BTN}`}
          style={{ background: "var(--teal)" }}
        >
          Generate Puzzle
        </button>
        <button
          type="button"
          onClick={() => setShowAnswers((v) => !v)}
          aria-pressed={showAnswers}
          className={`mt-2 w-full rounded-md border-2 px-4 py-2.5 text-sm font-semibold ${BTN}`}
          style={{ borderColor: "var(--line)" }}
        >
          {showAnswers ? "Hide Answers" : "Show Answers"}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className={`mt-5 w-full rounded-md border-2 px-4 py-3 font-semibold ${BTN}`}
          style={{ borderColor: "var(--teal)", color: "var(--teal)" }}
        >
          ⬇ Generate playable .html
        </button>

        <div className="mt-6">
          <p className="text-sm font-semibold mb-2">Word list &amp; phoneme hints</p>
          <ul className="space-y-2">
            {words.map((w) => (
              <li
                key={w.english}
                className="text-sm rounded-md border-2 px-3 py-2 flex items-center justify-between gap-2"
                style={{
                  borderColor: "var(--line)",
                  textDecoration: found.has(w.english) ? "line-through" : "none",
                  opacity: found.has(w.english) ? 0.55 : 1,
                }}
              >
                <span className="font-mono font-bold">{w.english.toUpperCase()}</span>
                <span className="flex gap-1">
                  {w.phonemes.map((ipa, i) => {
                    const info = findPhoneme(ipa);
                    return (
                      <span
                        key={i}
                        title={info ? `/${ipa}/ as in ${info.example}` : ipa}
                        className="font-mono text-[11px] rounded px-1.5 py-0.5"
                        style={{ background: "var(--coral-soft)" }}
                      >
                        {info ? info.label : ipa}
                      </span>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section>
        <p className="text-xs font-mono uppercase opacity-60 mb-1">Live preview — click/tap and drag across tokens</p>
        <p className="text-xs opacity-60 mb-3">
          ⌨️ Keyboard support: Tab to a tile, arrow keys to move (Left/Right continue onto the
          next/previous row at the edge), Enter/Space to mark the start of a word and again to
          check it, Escape to cancel.
        </p>
        <div
          className="grid gap-1.5 mx-auto select-none wordsearch-grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, maxWidth: 600, touchAction: "none" }}
          onMouseLeave={() => selecting && endSelect()}
          onTouchMove={(e) => {
            if (!selecting) return;
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
            const cellEl = el?.closest("[data-r]") as HTMLElement | null;
            if (cellEl) moveSelect(Number(cellEl.dataset.r), Number(cellEl.dataset.c));
          }}
          onTouchEnd={() => selecting && endSelect()}
        >
          {puzzle.grid.map((row, r) =>
            row.map((token, c) => {
              const key = cellKey(r, c);
              const isSelected = selection.includes(key);
              const isAnswer = showAnswers && isAnswerCell(r, c);
              return (
                <button
                  key={key}
                  ref={(el) => {
                    cellRefs.current[r * cols + c] = el;
                  }}
                  type="button"
                  data-r={r}
                  data-c={c}
                  className="aspect-square rounded font-mono font-bold text-base sm:text-lg cursor-pointer transition-all duration-100 hover:scale-110 hover:shadow-md hover:z-10 relative"
                  style={{
                    border: isAnswer ? "2.5px dashed var(--teal-strong)" : "1px solid var(--line)",
                    background: isSelected ? "var(--coral)" : isAnswer ? "var(--teal-soft)" : "var(--surface)",
                    color: isSelected ? "#fff" : "var(--ink)",
                  }}
                  aria-label={`Row ${r + 1}, column ${c + 1}: ${token}${isSelected ? ", selected" : ""}`}
                  onMouseDown={() => startSelect(r, c)}
                  onMouseEnter={() => moveSelect(r, c)}
                  onMouseUp={endSelect}
                  onTouchStart={() => startSelect(r, c)}
                  onKeyDown={(e) => handleCellKeyDown(e, r, c)}
                >
                  {token}
                </button>
              );
            })
          )}
        </div>
        <p role="status" aria-live="polite" className="text-center mt-4 text-sm font-semibold">
          {found.size} of {words.length} words found
          {found.size === words.length ? " — all words found!" : ""}
        </p>
      </section>
    </main>
  );
}
