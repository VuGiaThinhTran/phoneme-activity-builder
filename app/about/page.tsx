import type { Metadata } from "next";

export const metadata: Metadata = { title: "About — Phoneme Activity Builder" };

export default function About() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl font-bold">About this project</h1>
      <p className="mt-4 opacity-80">
        The Phoneme Activity Builder lets Speech Pathology teachers create two
        phoneme-based classroom activities — a Wordle-style guessing game and a Word
        Search — save and manage their word lists in a real database, export each
        activity as a single, playable HTML file, and monitor how the system is
        actually being used through a live operational dashboard.
      </p>

      <div className="mt-6 rounded-lg border-2 p-4 text-sm" style={{ borderColor: "var(--line)", background: "var(--coral-soft)" }}>
        <strong>Assessment 3 scope:</strong> this build adds a data-driven dashboard —
        activity and word counts, generation success/failure counts, average time on
        page, and the most-used activity type, all backed by real database queries, not
        placeholder numbers. It also adds visible alerts for failed generations and
        empty word lists, two Playwright end-to-end tests (a builder CRUD workflow and a
        user generate/view workflow), a JMeter load-testing plan covering staged traffic
        from 1 to 10,000 simulated users, and a Lighthouse accessibility pass with every
        page scoring 100.
      </div>

      <h2 className="font-display text-xl font-bold mt-10">The tools</h2>
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
        <li>
          <strong>Dashboard:</strong> live operational metrics — health status, how
          many activities and words are stored, successful vs failed generation
          counts, average time on page, and the most-used activity type — plus
          alerts when a generation fails or an activity has no words yet.
        </li>
      </ul>

      <h2 className="font-display text-xl font-bold mt-10">Video walkthrough</h2>
      <div className="mt-3 aspect-video rounded-lg border-2 overflow-hidden" style={{ borderColor: "var(--line)" }}>
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/zrW7AzJzclA"
          title="Assessment 3 video walkthrough"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {/* TODO: replace the src above with your Assessment 3 video's real YouTube ID once recorded/uploaded */}

      <h2 className="font-display text-xl font-bold mt-10">Author</h2>
      <p className="mt-2 text-sm opacity-80">
        Vu Gia Thinh Tran — Student Number 22955225
      </p>
    </main>
  );
}