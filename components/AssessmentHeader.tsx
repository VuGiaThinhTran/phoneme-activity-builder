export default function AssessmentHeader() {
  return (
    <header
      className="border-b-2 py-3 text-center"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <p className="font-display text-sm md:text-base font-bold tracking-wide" style={{ color: "var(--teal)" }}>
        Assessment 2 — Backend Implementation and Database Integration
      </p>
    </header>
  );
}
