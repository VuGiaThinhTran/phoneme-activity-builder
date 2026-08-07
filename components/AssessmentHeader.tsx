export default function AssessmentHeader() {
  return (
    <header
      className="border-b-2 py-3 text-center"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <p className="font-display text-sm md:text-base font-bold tracking-wide" style={{ color: "var(--teal)" }}>
        Assessment 1 — Frontend Design and Usability
      </p>
    </header>
  );
}
