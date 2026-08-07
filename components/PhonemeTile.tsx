import { findPhoneme } from "@/lib/phonemes";

export type TileState = "correct" | "present" | "absent" | "hint" | undefined;

interface PhonemeTileProps {
  ipa: string | null;
  state?: TileState;
  size?: number;
}

/**
 * A single phoneme tile. Shows the English grapheme label (e.g. "TH")
 * as its face, and reveals the IPA symbol + example word on hover/focus —
 * the mouse-over hint required by the brief.
 */
export default function PhonemeTile({ ipa, state, size = 56 }: PhonemeTileProps) {
  const info = ipa ? findPhoneme(ipa) : undefined;

  return (
    <div
      className="phoneme-tile"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
      data-state={state}
      tabIndex={info ? 0 : -1}
      aria-label={info ? `${info.label}, phoneme /${info.ipa}/, as in ${info.example}` : "empty tile"}
    >
      {info ? info.label : ipa}
      {info && (
        <span className="ipa-tooltip" role="tooltip">
          /{info.ipa}/ · as in {info.example}
        </span>
      )}
    </div>
  );
}
