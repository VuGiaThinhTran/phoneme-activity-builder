export async function logGenerationEvent(input: {
  activityType: "WORDLE" | "WORD_SEARCH";
  success: boolean;
  errorMessage?: string;
  wordCount?: number;
}): Promise<void> {
  try {
    await fetch("/api/metrics/generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // Metrics are best-effort — a failed log call should never interrupt the
    // teacher's actual generate/download action.
  }
}

/**
 * Reports how long the visitor spent on `page` once they leave it. Uses
 * `navigator.sendBeacon` when available — a `fetch` call started inside a
 * `pagehide`/`visibilitychange` handler is frequently aborted by the browser
 * before the request completes, especially on tab close, while a beacon is
 * specifically designed to survive that.
 */
export function reportPageViewOnLeave(page: string): () => void {
  const startedAt = Date.now();
  let reported = false;

  function send() {
    if (reported) return;
    reported = true;
    const durationMs = Date.now() - startedAt;
    if (durationMs < 500) return; // ignore accidental instant navigations

    const payload = JSON.stringify({ page, durationMs });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/metrics/page-view", blob);
    } else {
      fetch("/api/metrics/page-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === "hidden") send();
  }

  window.addEventListener("pagehide", send);
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Cleanup function for React's useEffect — also sends on unmount (e.g.
  // client-side navigation to another route within the app).
  return () => {
    send();
    window.removeEventListener("pagehide", send);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}