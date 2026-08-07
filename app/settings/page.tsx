"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

type Layout = "comfortable" | "compact";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}
function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export default function Settings() {
  const [layout, setLayout] = useState<Layout>("comfortable");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const savedLayout = readCookie("layout");
    if (savedLayout === "compact" || savedLayout === "comfortable") setLayout(savedLayout);
    setReduceMotion(document.documentElement.classList.contains("reduce-motion"));
  }, []);

  function chooseLayout(value: Layout) {
    setLayout(value);
    writeCookie("layout", value);
    document.documentElement.classList.toggle("layout-compact", value === "compact");
  }

  function toggleReduceMotion() {
    const next = !reduceMotion;
    setReduceMotion(next);
    document.documentElement.classList.toggle("reduce-motion", next);
    writeCookie("reduceMotion", String(next));
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-14">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="mt-3 opacity-75 text-sm">
        Preferences are saved in your browser (cookies) so they persist across visits.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold">Appearance</h2>
        <p className="text-sm opacity-70 mt-1 mb-3">Switch between light and dark mode.</p>
        <ThemeToggle />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold">Layout density</h2>
        <p className="text-sm opacity-70 mt-1 mb-3">
          Compact shrinks tiles, keys, and spacing on the Wordle and Word Search builder pages —
          fits more on screen at once.
        </p>
        <div className="flex gap-3">
          {(["comfortable", "compact"] as Layout[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => chooseLayout(opt)}
              aria-pressed={layout === opt}
              className={`settings-btn rounded-md px-4 py-2 text-sm font-semibold capitalize ${layout === opt ? "active" : ""}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold">Motion</h2>
        <p className="text-sm opacity-70 mt-1 mb-3">
          Turn off animations and transitions site-wide (banners, hover effects, tile flips) —
          useful if motion is distracting or triggers discomfort.
        </p>
        <button
          type="button"
          onClick={toggleReduceMotion}
          aria-pressed={reduceMotion}
          className={`settings-btn rounded-md px-4 py-2 text-sm font-semibold ${reduceMotion ? "active" : ""}`}
        >
          {reduceMotion ? "Reduced motion on" : "Reduced motion off"}
        </button>
      </section>
    </main>
  );
}
