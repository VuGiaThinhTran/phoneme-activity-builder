"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/wordle", label: "Wordle" },
  { href: "/wordsearch", label: "Word Search" },
];

const MENU_LINKS = [
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
];

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}
function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150);
  }
  // Only real mice should trigger hover-open — a tap synthesizes both a
  // "pointerenter" and a "click" for the same gesture, and if both toggled
  // the menu it would open and immediately close again. Checking
  // pointerType keeps hover exclusive to actual mouse users; touch relies
  // solely on the click handler below.
  function onPointerEnterWrapper(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") openMenu();
  }
  function onPointerLeaveWrapper(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") scheduleClose();
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    writeCookie("theme", next ? "dark" : "light");
  }

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
      pathname === href ? "bg-[var(--teal)] text-white" : "hover:bg-[var(--hover-tint)]"
    }`;

  function goTo(href: string) {
    setMenuOpen(false);
    router.push(href);
  }

  return (
    <nav
      className="border-b-2 sticky top-0 z-30 backdrop-blur"
      style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--surface) 92%, transparent)" }}
      aria-label="Primary"
    >
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16 gap-3">
        <Link href="/" className="font-display text-lg font-bold flex items-center gap-2 shrink-0">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-md font-mono text-sm text-white"
            style={{ background: "var(--teal)" }}
            aria-hidden="true"
          >
            ʃ
          </span>
          <span className="hidden sm:inline">Phoneme Builder</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto">
          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle: pulled out of Settings so it's one click from anywhere. */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border-2 cursor-pointer transition-colors hover:bg-[var(--hover-tint)]"
            style={{ borderColor: "var(--line)" }}
            aria-pressed={isDark}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>
          </button>

          {/* Hamburger menu: hover (mouse only) or click/tap to reveal About & Settings. */}
          <div
            className="relative"
            ref={menuRef}
            onPointerEnter={onPointerEnterWrapper}
            onPointerLeave={onPointerLeaveWrapper}
          >
            <button
              type="button"
              className="inline-flex flex-col justify-center gap-1.5 h-10 w-10 rounded-md border-2 cursor-pointer transition-colors hover:bg-[var(--hover-tint)]"
              style={{ borderColor: "var(--line)" }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="hamburger-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="block h-0.5 w-5 mx-auto" style={{ background: "var(--ink)" }} />
              <span className="block h-0.5 w-5 mx-auto" style={{ background: "var(--ink)" }} />
              <span className="block h-0.5 w-5 mx-auto" style={{ background: "var(--ink)" }} />
            </button>

            {menuOpen && (
              <div
                id="hamburger-menu"
                role="menu"
                aria-label="More"
                className="absolute right-0 mt-2 w-44 rounded-lg border-2 shadow-lg overflow-hidden"
                style={{ borderColor: "var(--line)", background: "var(--surface)" }}
              >
                {MENU_LINKS.map((l) => (
                  <button
                    key={l.href}
                    type="button"
                    role="menuitem"
                    onClick={() => goTo(l.href)}
                    className={`dropdown-item w-full text-left px-4 py-3 text-sm font-semibold cursor-pointer ${
                      pathname === l.href ? "active" : ""
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
