"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function setThemeCookie(theme: Theme) {
  document.cookie = `theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current: Theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    setThemeCookie(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`settings-btn inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${theme === "dark" ? "active" : ""}`}
      aria-pressed={theme === "dark"}
    >
      
    </button>
  );
}
