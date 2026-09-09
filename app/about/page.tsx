import type { Metadata } from "next";

export const metadata: Metadata = { title: "About — Phoneme Activity Builder" };

export default function About() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl font-bold">About this project</h1>
      <p className="mt-4 opacity-80">
        The Phoneme Activity Builder lets Speech Pathology teachers create two
        phoneme-based classroom activities — a Wordle-style guessing game and a Word
        Search — save and manage their word lists in a real database, and export each
        activity as a single, playable HTML file for use in any browser.
      </p>

      <div className="mt-6 rounded-lg border-2 p-4 text-sm" style={{ borderColor: "var(--line)", background: "var(--coral-soft)" }}>
        <strong>Assessment 2 scope:</strong> this build adds a full backend — a
        PostgreSQL database (via Prisma), CRUD API routes with validation, and a{" "}
        <code>/manage</code> page for creating, editing, and deleting word lists and
        activity settings. The Wordle and Word Search builders can now load a saved
        activity from the database, so generated output is driven by real, persisted
        data instead of a fixed example. The whole app also runs inside Docker.
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
        <li>
          <strong>Manage:</strong> a CRUD dashboard where teachers create, view,
          edit, and delete saved activities and their words — backed by a
          PostgreSQL database through a set of validated REST API routes.
        </li>
      </ul>

      <h2 className="font-display text-xl font-bold mt-10">Video walkthrough</h2>
      <div className="mt-3 aspect-video rounded-lg border-2 overflow-hidden" style={{ borderColor: "var(--line)" }}>
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/V7p9qQZHeyI"
          title="Assessment 2 video walkthrough"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {/* TODO: replace the src above with your Assessment 2 video's real YouTube ID once recorded/uploaded */}

      <h2 className="font-display text-xl font-bold mt-10">Author</h2>
      <p className="mt-2 text-sm opacity-80">
        Vu Gia Thinh Tran — Student Number 22955225
      </p>
    </main>
  );
}
