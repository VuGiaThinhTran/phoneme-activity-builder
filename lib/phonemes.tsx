// Shared phoneme reference data.
export interface Phoneme {
  ipa: string; // IPA token used inside words/tiles (no slashes)
  label: string; // short grapheme shown on tiles/keys
  example: string; // example word for the mouse-over hint
}

// Full HCE (Hawai'i Creole English) broad-transcription phoneme set,
// matching the supplied Wordle Phoneme Corpus keyboard layout.
export const PHONEMES: Phoneme[] = [
  { ipa: "p", label: "P", example: "pin" },
  { ipa: "t", label: "T", example: "top" },
  { ipa: "k", label: "K", example: "cat" },
  { ipa: "b", label: "B", example: "bat" },
  { ipa: "d", label: "D", example: "dog" },
  { ipa: "g", label: "G", example: "gum" },
  { ipa: "n", label: "N", example: "net" },
  { ipa: "m", label: "M", example: "mat" },
  { ipa: "ŋ", label: "NG", example: "ring" },
  { ipa: "f", label: "F", example: "fan" },
  { ipa: "s", label: "S", example: "sun" },
  { ipa: "θ", label: "TH", example: "thin" },
  { ipa: "ʃ", label: "SH", example: "ship" },
  { ipa: "v", label: "V", example: "van" },
  { ipa: "z", label: "Z", example: "zip" },
  { ipa: "ð", label: "TH", example: "then" },
  { ipa: "ʒ", label: "ZH", example: "vision" },
  { ipa: "l", label: "L", example: "log" },
  { ipa: "ɹ", label: "R", example: "ring" },
  { ipa: "w", label: "W", example: "win" },
  { ipa: "j", label: "Y", example: "yes" },
  { ipa: "h", label: "H", example: "hat" },
  { ipa: "tʃ", label: "CH", example: "chin" },
  { ipa: "dʒ", label: "J", example: "jam" },
  { ipa: "iː", label: "EE", example: "scream" },
  { ipa: "ɪ", label: "I", example: "bid" },
  { ipa: "e", label: "E", example: "bed" },
  { ipa: "eː", label: "EH", example: "bared" },
  { ipa: "æ", label: "A", example: "bad" },
  { ipa: "ɐ", label: "U", example: "bud" },
  { ipa: "ɐː", label: "AA", example: "bark" },
  { ipa: "ɜː", label: "ER", example: "bird" },
  { ipa: "ʉː", label: "UW", example: "boot" },
  { ipa: "ɔ", label: "O", example: "log" },
  { ipa: "oː", label: "OR", example: "fork" },
  { ipa: "ʊ", label: "OO", example: "book" },
  { ipa: "æɪ", label: "AY", example: "bait" },
  { ipa: "ɑe", label: "IGH", example: "bike" },
  { ipa: "oɪ", label: "OY", example: "boil" },
  { ipa: "əʉ", label: "OH", example: "boat" },
  { ipa: "æɔ", label: "OW", example: "cloud" },
  { ipa: "ɪə", label: "EAR", example: "beard" },
  { ipa: "ə", label: "UH", example: "ago" },
];

// On-screen phoneme keyboard layout, grouped exactly as in the supplied corpus:
// rows 1-7 are consonants, rows 8-12 are vowels/diphthongs.
// On-screen phoneme keyboard layout: the 43 symbols in the corpus's own
// reading order (consonants, then vowels/diphthongs), rechunked into 7
// balanced rows of ~6 keys so nothing sits alone on a short, staggered row.
export const KEYBOARD_ROWS: string[][] = [
  ["p", "t", "k", "b", "d", "g"],
  ["n", "m", "ŋ", "f", "s", "θ"],
  ["ʃ", "v", "z", "ð", "ʒ", "l"],
  ["ɹ", "w", "j", "h", "tʃ", "dʒ"],
  ["iː", "ɪ", "e", "eː", "æ", "ɐ"],
  ["ɐː", "ɜː", "ʉː", "ɔ", "oː", "ʊ"],
  ["æɪ", "ɑe", "oɪ", "əʉ", "æɔ", "ɪə", "ə"],
];

export function findPhoneme(ipa: string): Phoneme | undefined {
  return PHONEMES.find((p) => p.ipa === ipa);
}

export interface PhonemeWord {
  phonemes: string[]; // ordered list of IPA tokens, e.g. ["b","e","d"]
  english: string; // real spelling, e.g. "bed"
  hint?: string; // optional teacher-written clue
}

// Full 90-word HCE corpus supplied for this assessment: 30 words each
// with 3, 4, and 5 phonemes. Used as the default Wordle word bank.
export const WORDLE_CORPUS: PhonemeWord[] = [
  { phonemes: ["b", "e", "d"], english: "bed", hint: "Where you sleep at night" },
  { phonemes: ["b", "ɪ", "d"], english: "bid", hint: "To offer money at an auction" },
  { phonemes: ["b", "æ", "d"], english: "bad", hint: "The opposite of good" },
  { phonemes: ["b", "ɐ", "d"], english: "bud", hint: "A flower before it opens" },
  { phonemes: ["b", "ɜː", "d"], english: "bird", hint: "An animal with feathers that can fly" },
  { phonemes: ["b", "ɐː", "k"], english: "bark", hint: "The sound a dog makes" },
  { phonemes: ["b", "ʊ", "k"], english: "book", hint: "You read this" },
  { phonemes: ["b", "ʉː", "t"], english: "boot", hint: "A tall shoe worn in rain or snow" },
  { phonemes: ["b", "əʉ", "t"], english: "boat", hint: "It floats and travels on water" },
  { phonemes: ["b", "ɑe", "k"], english: "bike", hint: "You ride this with two wheels" },
  { phonemes: ["b", "æɪ", "t"], english: "bait", hint: "Food used to catch fish" },
  { phonemes: ["b", "oɪ", "l"], english: "boil", hint: "To heat water until it bubbles" },
  { phonemes: ["b", "ɪə", "d"], english: "beard", hint: "Hair that grows on a man's chin" },
  { phonemes: ["tʃ", "oɪ", "s"], english: "choice", hint: "Picking one thing over another" },
  { phonemes: ["θ", "ɪ", "n"], english: "thin", hint: "The opposite of thick" },
  { phonemes: ["ð", "e", "n"], english: "then", hint: "After that" },
  { phonemes: ["ʃ", "ɪ", "p"], english: "ship", hint: "A large boat that carries people or cargo" },
  { phonemes: ["tʃ", "ɪ", "n"], english: "chin", hint: "The part of your face below your mouth" },
  { phonemes: ["dʒ", "æ", "m"], english: "jam", hint: "A sweet fruit spread for toast" },
  { phonemes: ["j", "e", "s"], english: "yes", hint: "The opposite of no" },
  { phonemes: ["w", "ɪ", "n"], english: "win", hint: "To come first in a game or race" },
  { phonemes: ["ɹ", "ɪ", "ŋ"], english: "ring", hint: "A round piece of jewellery for your finger" },
  { phonemes: ["l", "ɔ", "g"], english: "log", hint: "A cut piece of a tree trunk" },
  { phonemes: ["f", "æ", "n"], english: "fan", hint: "A machine that blows air to cool you" },
  { phonemes: ["v", "æ", "n"], english: "van", hint: "A vehicle bigger than a car, for carrying things" },
  { phonemes: ["s", "ɐ", "n"], english: "sun", hint: "The star that lights and warms the Earth" },
  { phonemes: ["z", "ɪ", "p"], english: "zip", hint: "To close with a zipper" },
  { phonemes: ["g", "ɐ", "m"], english: "gum", hint: "You chew this but don't swallow it" },
  { phonemes: ["h", "æ", "t"], english: "hat", hint: "You wear this on your head" },
  { phonemes: ["f", "oː", "k"], english: "fork", hint: "A utensil with prongs, used for eating" },
  { phonemes: ["s", "t", "ɔ", "p"], english: "stop", hint: "To not go any further" },
  { phonemes: ["f", "ɹ", "ɔ", "g"], english: "frog", hint: "A green animal that hops near water" },
  { phonemes: ["k", "l", "æ", "p"], english: "clap", hint: "To hit your hands together" },
  { phonemes: ["s", "l", "ɪ", "p"], english: "slip", hint: "To lose your footing and fall" },
  { phonemes: ["d", "ɹ", "ɐ", "m"], english: "drum", hint: "A musical instrument you hit to make a beat" },
  { phonemes: ["g", "ɹ", "ɪ", "n"], english: "grin", hint: "A big smile" },
  { phonemes: ["t", "ɹ", "æɪ", "n"], english: "train", hint: "A vehicle that runs on tracks" },
  { phonemes: ["k", "l", "æɔ", "d"], english: "cloud", hint: "A white fluffy thing in the sky" },
  { phonemes: ["s", "n", "æɪ", "k"], english: "snake", hint: "A long animal with no legs that slithers" },
  { phonemes: ["s", "m", "ɑe", "l"], english: "smile", hint: "What you do when you're happy" },
  { phonemes: ["m", "ɪ", "l", "k"], english: "milk", hint: "A white drink that comes from cows" },
  { phonemes: ["h", "æ", "n", "d"], english: "hand", hint: "The part of your arm with fingers" },
  { phonemes: ["t", "e", "n", "t"], english: "tent", hint: "A shelter you sleep in when camping" },
  { phonemes: ["dʒ", "ɐ", "m", "p"], english: "jump", hint: "To push off the ground into the air" },
  { phonemes: ["l", "æ", "m", "p"], english: "lamp", hint: "A light you turn on in a room" },
  { phonemes: ["b", "æ", "ŋ", "k"], english: "bank", hint: "A place where you keep your money" },
  { phonemes: ["f", "ɹ", "æɪ", "m"], english: "frame", hint: "A border around a picture" },
  { phonemes: ["k", "əʉ", "l", "d"], english: "cold", hint: "The opposite of hot" },
  { phonemes: ["w", "ɪ", "n", "d"], english: "wind", hint: "Moving air you can feel but not see" },
  { phonemes: ["s", "ɔ", "f", "t"], english: "soft", hint: "The opposite of hard" },
  { phonemes: ["g", "ɪ", "f", "t"], english: "gift", hint: "A present you give someone" },
  { phonemes: ["d", "e", "s", "k"], english: "desk", hint: "A table you sit at to work or study" },
  { phonemes: ["l", "e", "f", "t"], english: "left", hint: "The opposite of right" },
  { phonemes: ["p", "ɔ", "n", "d"], english: "pond", hint: "A small area of still water" },
  { phonemes: ["g", "ɔ", "l", "f"], english: "golf", hint: "A sport played by hitting a small ball into holes" },
  { phonemes: ["s", "ɪ", "l", "k"], english: "silk", hint: "A smooth, shiny fabric made by silkworms" },
  { phonemes: ["g", "ɹ", "æɪ", "t"], english: "great", hint: "Very good" },
  { phonemes: ["k", "ɹ", "æ", "b"], english: "crab", hint: "A sea animal with claws that walks sideways" },
  { phonemes: ["p", "l", "ɐ", "g"], english: "plug", hint: "You put this into a socket for electricity" },
  { phonemes: ["k", "w", "ɪ", "z"], english: "quiz", hint: "A short test" },
  { phonemes: ["s", "t", "æ", "m", "p"], english: "stamp", hint: "A small piece of paper you stick on an envelope" },
  { phonemes: ["p", "l", "æ", "n", "t"], english: "plant", hint: "Something green that grows from the ground" },
  { phonemes: ["b", "l", "æ", "ŋ", "k"], english: "blank", hint: "Empty, with nothing on it" },
  { phonemes: ["g", "ɹ", "æ", "n", "d"], english: "grand", hint: "Very large or impressive" },
  { phonemes: ["k", "l", "æ", "m", "p"], english: "clamp", hint: "A tool that holds things tightly together" },
  { phonemes: ["t", "w", "ɪ", "s", "t"], english: "twist", hint: "To turn something around" },
  { phonemes: ["t", "ɹ", "ɐ", "s", "t"], english: "trust", hint: "To believe someone won't let you down" },
  { phonemes: ["d", "ɹ", "ɪ", "ŋ", "k"], english: "drink", hint: "To swallow a liquid" },
  { phonemes: ["b", "ɹ", "ɪ", "s", "k"], english: "brisk", hint: "Quick and energetic" },
  { phonemes: ["ʃ", "ɹ", "ɪ", "m", "p"], english: "shrimp", hint: "A small sea creature you can eat" },
  { phonemes: ["s", "k", "ɹ", "æ", "p"], english: "scrap", hint: "A small leftover piece" },
  { phonemes: ["s", "k", "ɹ", "ɑe", "b"], english: "scribe", hint: "A person who writes things down by hand" },
  { phonemes: ["s", "k", "ɹ", "iː", "m"], english: "scream", hint: "A loud, high-pitched cry" },
  { phonemes: ["s", "p", "l", "æ", "ʃ"], english: "splash", hint: "The sound water makes when disturbed" },
  { phonemes: ["s", "p", "ɹ", "ɪ", "ŋ"], english: "spring", hint: "The season after winter" },
  { phonemes: ["s", "t", "ɹ", "æ", "p"], english: "strap", hint: "A strip of material that holds something in place" },
  { phonemes: ["s", "t", "ɹ", "iː", "t"], english: "street", hint: "A road in a town or city" },
  { phonemes: ["s", "k", "ɹ", "ɐ", "b"], english: "scrub", hint: "To rub hard to clean something" },
  { phonemes: ["f", "l", "ɐː", "s", "k"], english: "flask", hint: "A container for carrying a drink" },
  { phonemes: ["k", "l", "ɐː", "s", "p"], english: "clasp", hint: "To hold something tightly, or a small fastener" },
  { phonemes: ["k", "l", "e", "f", "t"], english: "cleft", hint: "A split or crack in something" },
  { phonemes: ["g", "l", "ɪ", "n", "t"], english: "glint", hint: "A quick flash of light" },
  { phonemes: ["b", "l", "e", "n", "d"], english: "blend", hint: "To mix things together" },
  { phonemes: ["s", "t", "ɹ", "æɪ", "n"], english: "strain", hint: "To stretch or filter something" },
  { phonemes: ["θ", "ɹ", "ɐ", "s", "t"], english: "thrust", hint: "A sudden strong push" },
  { phonemes: ["s", "p", "ɹ", "oː", "l"], english: "sprawl", hint: "To lie or sit with arms and legs spread out" },
  { phonemes: ["s", "k", "ɹ", "oː", "l"], english: "scrawl", hint: "Untidy, hard-to-read handwriting" },
  { phonemes: ["s", "p", "ɹ", "ɪ", "g"], english: "sprig", hint: "A small stem with leaves, from a plant" },
  { phonemes: ["s", "p", "ɹ", "æɔ", "t"], english: "sprout", hint: "A new, young plant just starting to grow" },
  { phonemes: ["s", "m", "əʉ", "k", "t"], english: "smoked", hint: "Cooked or preserved using smoke" },
];

export const WORDLE_PRESETS = WORDLE_CORPUS;
export const WORDLE_TARGET = WORDLE_CORPUS[0];

// Default Word Search list: a manageable subset of the corpus spanning
// 3/4/5-phoneme words. Teachers can replace this list in the builder.
export const WORD_SEARCH_LIST: PhonemeWord[] = [
  { phonemes: ["b", "e", "d"], english: "bed" },
  { phonemes: ["b", "ɜː", "d"], english: "bird" },
  { phonemes: ["b", "əʉ", "t"], english: "boat" },
  { phonemes: ["s", "t", "ɔ", "p"], english: "stop" },
  { phonemes: ["g", "ɹ", "ɪ", "n"], english: "grin" },
  { phonemes: ["m", "ɪ", "l", "k"], english: "milk" },
  { phonemes: ["s", "t", "æ", "m", "p"], english: "stamp" },
  { phonemes: ["t", "ɹ", "ɐ", "s", "t"], english: "trust" },
];
// Parse a teacher's textarea input. One word per line, phonemes space-separated,
// followed by "= <english spelling>" and an optional "| <hint>":
//   b e d = bed
//   ʃ ɪ p = ship | a large boat
// The "= english" part is optional for quick custom entries — if omitted, the
// spelling is auto-derived from each phoneme's grapheme label (best-effort;
// works for simple words, but irregular spellings should be given explicitly).
export function parsePhonemeWordList(text: string): PhonemeWord[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [beforeEq, afterEq] = line.split("=");
      const phonemes = beforeEq.trim().split(/\s+/).filter(Boolean);
      let english: string;
      let hint: string | undefined;
      if (afterEq !== undefined) {
        const [engPart, hintPart] = afterEq.split("|");
        english = (engPart ?? "").trim();
        hint = hintPart?.trim() || undefined;
      } else {
        english = phonemes.map((tok) => findPhoneme(tok)?.label ?? tok).join("").toLowerCase();
      }
      return { phonemes, english: english || phonemes.join(""), hint };
    });
}

// Render a PhonemeWord list back into textarea form ("phonemes = english | hint").
export function formatPhonemeWordList(words: PhonemeWord[]): string {
  return words
    .map((w) => `${w.phonemes.join(" ")} = ${w.english}${w.hint ? ` | ${w.hint}` : ""}`)
    .join("\n");
}
