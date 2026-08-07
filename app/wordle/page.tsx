"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import PhonemeTile, { TileState } from "@/components/PhonemeTile";
import PhonemeKey from "@/components/PhonemeKey";
import {
  WORDLE_PRESETS,
  PhonemeWord,
  KEYBOARD_ROWS,
  parsePhonemeWordList,
  formatPhonemeWordList,
} from "@/lib/phonemes";
import { buildWordleHtml } from "@/lib/exportHtml";

type Difficulty = "easy" | "normal" | "hard";

// Physical-keyboard shortcuts: consonants that match an ASCII letter map
// straight to that key (e.g. "p" -> /p/). A handful of digraphs that would
// otherwise collide with a plain consonant use Shift+letter. The 19 vowel/
// diphthong symbols have no direct shortcut (too many for a clean mnemonic
// scheme) — they're reachable via click/tap or Tab + arrow keys + Enter.
const PHYSICAL_KEY_MAP: Record<string, string> = {
  p: "p", t: "t", k: "k", b: "b", d: "d", g: "g", n: "n", m: "m",
  f: "f", s: "s", v: "v", z: "z", l: "l", r: "ɹ", w: "w", j: "j", h: "h",
};
const PHYSICAL_SHIFT_KEY_MAP: Record<string, string> = {
  n: "ŋ", // Shift+N -> NG
  t: "θ", // Shift+T -> TH (thin)
  d: "ð", // Shift+D -> TH (then)
  s: "ʃ", // Shift+S -> SH
  z: "ʒ", // Shift+Z -> ZH
  c: "tʃ", // Shift+C -> CH
  j: "dʒ", // Shift+J -> J (jam)
};

// Reverse lookup so each on-screen key can show its own shortcut in its tooltip.
const SHORTCUT_BY_IPA: Record<string, string> = {};
for (const [key, ipa] of Object.entries(PHYSICAL_KEY_MAP)) SHORTCUT_BY_IPA[ipa] = key.toUpperCase();
for (const [key, ipa] of Object.entries(PHYSICAL_SHIFT_KEY_MAP)) SHORTCUT_BY_IPA[ipa] = `Shift+${key.toUpperCase()}`;

const BTN = "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none";

function tileState(guessToken: string, target: string[], index: number): TileState {
  if (guessToken === target[index]) return "correct";
  if (target.includes(guessToken)) return "present";
  return "absent";
}

// Build a session order of `length` word-indices from the pool, shuffled,
// repeating the shuffled pool if the session needs more words than it has.
function buildSessionOrder(poolSize: number, length: number, seed: number): number[] {
  const base = Array.from({ length: poolSize }, (_, i) => i);
  // simple seeded shuffle so "restart" gives a different order
  let s = seed || 1;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  const order: number[] = [];
  while (order.length < length) order.push(...base);
  return order.slice(0, length);
}

export default function WordlePage() {
  const [wordsText, setWordsText] = useState(formatPhonemeWordList(WORDLE_PRESETS));
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [seed, setSeed] = useState(1);

  const pool: PhonemeWord[] = useMemo(() => {
    const parsed = parsePhonemeWordList(wordsText);
    return parsed.length ? parsed : WORDLE_PRESETS;
  }, [wordsText]);

  const sessionLength = difficulty === "hard" ? 4 : 6;
  const revealFirst = difficulty === "easy";

  const order = useMemo(() => buildSessionOrder(pool.length, sessionLength, seed), [pool.length, sessionLength, seed]);
  const sessionWords = order.map((i) => pool[i]);

  const [guesses, setGuesses] = useState<(string[] | null)[]>(() => Array(sessionLength).fill(null));
  const [current, setCurrent] = useState<string[]>([]);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ type: "win" | "lose" | "tip"; text: string } | null>(null);

  // reset the round whenever the word list, difficulty, or session changes
  useEffect(() => {
    setGuesses(Array(sessionLength).fill(null));
    setCurrent([]);
    setBanner(null);
  }, [sessionLength, wordsText, seed]);

  const activeRow = guesses.findIndex((g) => g === null);
  const finished = activeRow === -1;
  const activeTarget = finished ? null : sessionWords[activeRow];
  const correctCount = guesses.filter((g, i) => g && sessionWords[i] && g.every((t, j) => t === sessionWords[i].phonemes[j])).length;

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), banner.type === "tip" ? 2200 : 5000);
    return () => clearTimeout(t);
  }, [banner]);

  function pressKey(ipa: string) {
    if (!activeTarget) return;
    if (current.length < activeTarget.phonemes.length) setCurrent((c) => [...c, ipa]);
  }
  function backspace() {
    setCurrent((c) => c.slice(0, -1));
  }
  function submit() {
    if (!activeTarget) return;
    if (current.length !== activeTarget.phonemes.length) {
      setBanner({ type: "tip", text: `Keep building the word — need ${activeTarget.phonemes.length} phoneme tiles.` });
      return;
    }
    const won = current.every((tok, i) => tok === activeTarget.phonemes[i]);
    const rowIndex = activeRow;
    const nextGuesses = [...guesses];
    nextGuesses[rowIndex] = current;
    setGuesses(nextGuesses);
    setCurrent([]);

    const isLastRow = rowIndex === sessionLength - 1;
    if (won) {
      setBanner({ type: "win", text: `🎉 Correct! "${activeTarget.english}" — moving to the next word.` });
    } else {
      setShakeRow(rowIndex);
      setTimeout(() => setShakeRow(null), 500);
      setBanner({ type: "lose", text: `Not quite — that word was "${activeTarget.english}".` });
    }
    if (isLastRow) {
      const finalCorrect = nextGuesses.filter((g, i) => g && g.every((t, j) => t === sessionWords[i].phonemes[j])).length;
      setTimeout(() => {
        setBanner({ type: "win", text: `Session complete! ${finalCorrect} of ${sessionLength} correct.` });
      }, 1600);
    }
  }
  function restartSession() {
    setSeed((s) => s + 1);
  }

  // Arrow-key navigation across the on-screen phoneme keyboard, based on its
  // logical structure (KEYBOARD_ROWS), not pixel position:
  //  - Up/Down move to the row above/below, keeping the closest column.
  //  - Right moves to the next key in reading order; at the end of a row it
  //    continues onto the start of the next row (wrapping back to the very
  //    first key after the last one).
  //  - Left is the mirror of Right.
  const keyElsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  function registerKeyEl(ipa: string, el: HTMLButtonElement | null) {
    if (el) keyElsRef.current.set(ipa, el);
    else keyElsRef.current.delete(ipa);
  }
  const FLAT_KEYS = KEYBOARD_ROWS.flat();
  function findKeyPosition(ipa: string): { row: number; col: number } {
    for (let r = 0; r < KEYBOARD_ROWS.length; r++) {
      const c = KEYBOARD_ROWS[r].indexOf(ipa);
      if (c !== -1) return { row: r, col: c };
    }
    return { row: 0, col: 0 };
  }
  function focusKey(ipa: string) {
    keyElsRef.current.get(ipa)?.focus();
  }
  function handleKeyNav(e: ReactKeyboardEvent<HTMLButtonElement>, ipa: string) {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const { row, col } = findKeyPosition(ipa);

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const targetRow = e.key === "ArrowUp" ? Math.max(0, row - 1) : Math.min(KEYBOARD_ROWS.length - 1, row + 1);
      const targetCol = Math.min(col, KEYBOARD_ROWS[targetRow].length - 1);
      focusKey(KEYBOARD_ROWS[targetRow][targetCol]);
      return;
    }

    const flatIndex = FLAT_KEYS.indexOf(ipa);
    const nextIndex =
      e.key === "ArrowRight"
        ? (flatIndex + 1) % FLAT_KEYS.length
        : (flatIndex - 1 + FLAT_KEYS.length) % FLAT_KEYS.length;
    focusKey(FLAT_KEYS[nextIndex]);
  }

  // Keyboard support: type phoneme letters directly, Enter to submit,
  // Backspace to delete. Ignored while typing in the word-list textarea.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return;
      // If a specific button already has focus (e.g. a phoneme key, or the
      // Submit/Backspace/Restart buttons), let its own native Enter/Space
      // activation run instead of double-handling the key globally.
      const isButtonFocused = target && target.tagName === "BUTTON";
      if (e.key === "Enter") {
        if (isButtonFocused) return;
        e.preventDefault();
        submit();
      } else if (e.key === "Backspace") {
        if (isButtonFocused) return;
        e.preventDefault();
        backspace();
      } else {
        const base = e.key.toLowerCase();
        const mapped = e.shiftKey ? PHYSICAL_SHIFT_KEY_MAP[base] : PHYSICAL_KEY_MAP[base];
        if (mapped) {
          e.preventDefault();
          pressKey(mapped);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function handleGenerate() {
    const darkMode = document.documentElement.classList.contains("dark");
    const html = buildWordleHtml({ words: pool, difficulty, darkMode });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "phoneme-wordle.html";
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
        <h1 className="font-display text-xl font-bold">Wordle builder</h1>

        <label className="block mt-5 text-sm font-semibold" htmlFor="wordle-words">
          Word list (phonemes = spelling, optional hint after |)
        </label>
        <textarea
          id="wordle-words"
          value={wordsText}
          onChange={(e) => setWordsText(e.target.value)}
          rows={10}
          spellCheck={false}
          className="mt-2 w-full rounded-md border-2 p-2 font-mono text-xs"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
        />
        <p className="text-xs opacity-60 mt-1">
          One word per line: phonemes, then <code>= spelling</code> (e.g. <code>ʃ ɪ p = ship</code>).
          Comes pre-loaded with the full 90-word HCE corpus (30 each of 3/4/5 phonemes). Each round
          steps through the list, one word per row — Generate bundles the whole list into the file.
        </p>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold mb-2">Difficulty</legend>
          <div className="flex flex-col gap-2">
            {[
              { id: "easy" as const, label: "Easy — first sound revealed, 6 words" },
              { id: "normal" as const, label: "Normal — 6 words" },
              { id: "hard" as const, label: "Hard — 4 words" },
            ].map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  className="cursor-pointer"
                  checked={difficulty === opt.id}
                  onChange={() => setDifficulty(opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={restartSession}
          className={`mt-6 w-full rounded-md border-2 px-4 py-2 text-sm font-semibold ${BTN}`}
          style={{ borderColor: "var(--line)" }}
        >
          🔄 Restart session ({pool.length} words in list)
        </button>

        <button
          type="button"
          onClick={handleGenerate}
          className={`mt-3 w-full rounded-md px-4 py-3 font-semibold text-white ${BTN}`}
          style={{ background: "var(--teal)" }}
        >
          ⬇ Generate playable .html
        </button>
        <p className="text-xs opacity-60 mt-2">
          Downloads one self-contained file with the entire word list and an answer key for the
          teacher — no server needed.
        </p>
      </aside>

      <section>
        <p className="text-xs font-mono uppercase opacity-60 mb-1">Live preview</p>
        <p className="text-xs opacity-60 mb-3">
          ⌨️ Keyboard support: type P T K B D G N M F S V Z L R W J H directly for those sounds, and{" "}
          <kbd className="font-mono">Shift</kbd>+N/T/D/S/Z/C/J for NG/TH/TH/SH/ZH/CH/J. Vowels and
          diphthongs don't have letter shortcuts (too many to map cleanly) — Tab to any tile/key,
          then arrow keys to move across the keyboard and Enter/Space to press it. Enter submits,
          Backspace deletes.
        </p>
        {activeTarget?.hint && (
          <p className="text-center text-sm font-semibold mb-4 rounded-md py-2" style={{ background: "var(--coral-soft)" }}>
            💡 Clue: {activeTarget.hint}
          </p>
        )}
        {finished && (
          <p className="text-center text-sm font-semibold mb-4 rounded-md py-2" style={{ background: "var(--coral-soft)" }}>
            ✅ Session complete — {correctCount} of {sessionLength} correct. Click Restart to go again.
          </p>
        )}

        <div className="flex flex-col items-center gap-2">
          {sessionWords.map((word, r) => {
            const rowGuess = guesses[r];
            const isActive = r === activeRow;
            return (
              <div key={r} className={`flex items-center gap-3 ${shakeRow === r ? "shake" : ""}`}>
                <div className="flex gap-2">
                  {word.phonemes.map((_, c) => {
                    const tok = rowGuess ? rowGuess[c] : isActive ? current[c] || (revealFirst && c === 0 ? word.phonemes[0] : null) : null;
                    const state: TileState = rowGuess
                      ? tileState(rowGuess[c], word.phonemes, c)
                      : isActive && revealFirst && c === 0 && !current[0]
                      ? "hint"
                      : undefined;
                    return <PhonemeTile key={c} ipa={tok} state={state} size={48} />;
                  })}
                </div>
                {rowGuess && (
                  <span className="text-xs font-mono opacity-70 whitespace-nowrap">
                    {rowGuess.every((t, i) => t === word.phonemes[i]) ? "✓" : "→"} {word.english.toUpperCase()}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="flex flex-col gap-2 mx-auto keyboard-flex-col-gap" style={{ width: "fit-content" }}>
            {KEYBOARD_ROWS.map((row, r) => (
              <div key={r} className="flex gap-2">
                {row.map((ipa) => (
                  <PhonemeKey
                    key={ipa}
                    ref={(el) => registerKeyEl(ipa, el)}
                    ipa={ipa}
                    onPress={pressKey}
                    shortcut={SHORTCUT_BY_IPA[ipa]}
                    onKeyDown={(e) => handleKeyNav(e, ipa)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-4">
          <button type="button" onClick={backspace} className={`rounded-md border-2 px-4 py-2 text-sm font-semibold ${BTN}`} style={{ borderColor: "var(--line)" }}>
            ⌫ Back
          </button>
          <button type="button" onClick={submit} className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${BTN}`} style={{ background: "var(--coral)" }}>
            Submit guess
          </button>
          <button type="button" onClick={restartSession} className={`rounded-md border-2 px-4 py-2 text-sm font-semibold ${BTN}`} style={{ borderColor: "var(--line)" }}>
            Reset
          </button>
        </div>
      </section>
    </main>
  );
}
