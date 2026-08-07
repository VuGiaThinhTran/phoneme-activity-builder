import Link from "next/link";
import PhonemeTile from "@/components/PhonemeTile";

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-14">
      <section className="grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div>
          <p className="font-mono text-sm uppercase tracking-wide" style={{ color: "var(--teal)" }}>
            Speech Pathology · classroom activity builder
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mt-2">
            Build phoneme-based
            <br />
            Wordle &amp; Word Search activities
          </h1>
          <p className="mt-5 text-base md:text-lg opacity-80 max-w-prose">
            Configure a phoneme-based word, preview it as a playable game, and generate a single
            HTML file your students can open in any browser — no accounts, no installs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/wordle" className="rounded-md px-5 py-3 font-semibold text-white" style={{ background: "var(--teal)" }}>
              Build a Wordle activity
            </Link>
            <Link href="/wordsearch" className="rounded-md px-5 py-3 font-semibold border-2" style={{ borderColor: "var(--line)" }}>
              Build a Word Search
            </Link>
          </div>
        </div>

        <div className="rounded-xl border-2 p-6" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <p className="text-xs font-mono uppercase opacity-60 mb-3">Preview — target phoneme word</p>
          <div className="flex gap-2 justify-center">
            {["ʃ", "ɪ", "p"].map((ipa) => (
              <PhonemeTile key={ipa} ipa={ipa} size={56} />
            ))}
          </div>
          <p className="text-center text-sm mt-4 opacity-70">Hover a tile to see its phoneme symbol.</p>
        </div>
      </section>

      <section className="mt-16 grid sm:grid-cols-3 gap-5">
        {[
          { title: "1 · Configure", body: "Choose the phoneme word or word list, and set the difficulty for your class." },
          { title: "2 · Preview", body: "See the activity exactly as students will — tiles, hints, and feedback included." },
          { title: "3 · Generate", body: "Download one HTML file. Open it in any browser or share it on your class page." },
        ].map((step) => (
          <div key={step.title} className="rounded-lg border-2 p-5" style={{ borderColor: "var(--line)" }}>
            <h2 className="font-display text-lg font-bold">{step.title}</h2>
            <p className="text-sm opacity-75 mt-2">{step.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
