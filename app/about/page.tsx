import type { Metadata } from "next";

export const metadata: Metadata = { title: "About — Phoneme Activity Builder" };

export default function About() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl font-bold">About this project</h1>
      <p className="mt-4 opacity-80">
        The Phoneme Activity Builder is a frontend tool that lets Speech Pathology teachers create
        two phoneme-based classroom activities — a Wordle-style guessing game and a Word Search —
        then export each one as a single, playable HTML file for use in any browser.
      </p>

      <div className="mt-6 rounded-lg border-2 p-4 text-sm" style={{ borderColor: "var(--line)", background: "var(--coral-soft)" }}>
        <strong>Assessment 1 scope:</strong> this build is frontend only. The Wordle activity uses a
        fixed set of phoneme-based words, and the Word Search uses a fixed list of five
        phoneme-based words entered as space-separated phonemes. A database and dynamic word-list
        management are introduced in Assessment 2.
      </div>

      <h2 className="font-display text-xl font-bold mt-10">The two tools</h2>
      <ul className="mt-3 space-y-3 opacity-85 text-sm">
        <li>
          <strong>Wordle:</strong> students guess a phoneme-based word one tile at a time, using a
          phoneme keyboard (e.g. SH, CH, TH, NG) instead of standard letters. Tiles reveal the IPA
          symbol on hover and the English spelling once solved.
        </li>
        <li>
          <strong>Word Search:</strong> a grid built from phoneme tokens (one phoneme per cell).
          Teachers type words as space-separated phonemes and set the grid size; each word in the
          list shows its phoneme breakdown, and a Show Answers toggle reveals placed words.
        </li>
      </ul>

      <h2 className="font-display text-xl font-bold mt-10">Video walkthrough</h2>
      <div className="mt-3 aspect-video rounded-lg border-2 flex items-center justify-center text-sm opacity-60" style={{ borderColor: "var(--line)" }}>
        {/* TODO: replace with an embedded <video> or <iframe> of your walkthrough */}
        Video placeholder — embed your walkthrough here
      </div>

      <h2 className="font-display text-xl font-bold mt-10">Author</h2>
      <p className="mt-2 text-sm opacity-80">
        {/* TODO: replace with your real details */}
        Vu Gia Thinh Tran — Student Number 22955225
      </p>
    </main>
  );
}
