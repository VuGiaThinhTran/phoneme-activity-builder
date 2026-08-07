import { forwardRef } from "react";
import type { KeyboardEvent } from "react";
import { findPhoneme } from "@/lib/phonemes";

interface PhonemeKeyProps {
  ipa: string;
  onPress: (ipa: string) => void;
  shortcut?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

const PhonemeKey = forwardRef<HTMLButtonElement, PhonemeKeyProps>(function PhonemeKey(
  { ipa, onPress, shortcut, onKeyDown },
  ref
) {
  const info = findPhoneme(ipa);
  const hint = info ? `/${info.ipa}/ as in ${info.example}${shortcut ? ` (${shortcut})` : ""}` : ipa;
  return (
    <button
      ref={ref}
      type="button"
      data-testid={`phoneme-key-${ipa}`}
      onClick={() => onPress(ipa)}
      onKeyDown={onKeyDown}
      className="relative group rounded-md border-2 font-bold text-sm flex items-center justify-center shrink-0 w-11 h-10 sm:w-14 sm:h-12"
      style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
      title={hint}
      aria-label={info ? `${info.label}, phoneme /${info.ipa}/, as in ${info.example}${shortcut ? `, shortcut ${shortcut}` : ""}` : ipa}
    >
      {info ? info.label : ipa}
      {info && (
        <span
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-[11px] font-mono opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
        >
          /{info.ipa}/ · {info.example}
          {shortcut ? ` · ${shortcut}` : ""}
        </span>
      )}
    </button>
  );
});

export default PhonemeKey;
