// Seeds a small set of example Wordle / Word Search activities through the
// app's own REST API, so the demo (and the dashboard) has realistic data
// straight after a fresh `docker compose up`.
//
//   node scripts/seed-demo.mjs                (app on http://localhost:3000)
//   BASE_URL=http://localhost:3001 node scripts/seed-demo.mjs
//
// Safe to re-run: activities whose name already exists are skipped.
// Every phoneme below comes from the app's 43-symbol keyboard.

import { pathToFileURL } from "node:url";

export const ACTIVITIES = [
  {
    name: "Demo Wordle - Digraph sounds (Hard)",
    activityType: "WORDLE",
    difficulty: "HARD",
    words: [
      { english: "thin", phonemes: ["θ", "ɪ", "n"], hint: "The opposite of thick" },
      { english: "then", phonemes: ["ð", "e", "n"], hint: "After that" },
      { english: "ship", phonemes: ["ʃ", "ɪ", "p"], hint: "A large boat that carries people or cargo" },
      { english: "chin", phonemes: ["tʃ", "ɪ", "n"], hint: "The part of your face below your mouth" },
      { english: "jam", phonemes: ["dʒ", "æ", "m"], hint: "A sweet fruit spread for toast" },
      { english: "ring", phonemes: ["ɹ", "ɪ", "ŋ"], hint: "A round piece of jewellery for your finger" },
    ],
  },
  {
    name: "Demo Wordle - Everyday words (Easy)",
    activityType: "WORDLE",
    difficulty: "EASY",
    words: [
      { english: "fan", phonemes: ["f", "æ", "n"], hint: "A machine that blows air to cool you" },
      { english: "van", phonemes: ["v", "æ", "n"], hint: "A vehicle bigger than a car, for carrying things" },
      { english: "sun", phonemes: ["s", "ɐ", "n"], hint: "The star that lights and warms the Earth" },
      { english: "zip", phonemes: ["z", "ɪ", "p"], hint: "To close with a zipper" },
      { english: "hat", phonemes: ["h", "æ", "t"], hint: "You wear this on your head" },
      { english: "frog", phonemes: ["f", "ɹ", "ɔ", "g"], hint: "A green animal that hops near water" },
    ],
  },
  {
    name: "Demo Word Search - Short words (10x10)",
    activityType: "WORD_SEARCH",
    difficulty: "NORMAL",
    gridRows: 10,
    gridCols: 10,
    words: [
      { english: "frog", phonemes: ["f", "ɹ", "ɔ", "g"] },
      { english: "milk", phonemes: ["m", "ɪ", "l", "k"] },
      { english: "stop", phonemes: ["s", "t", "ɔ", "p"] },
      { english: "ship", phonemes: ["ʃ", "ɪ", "p"] },
      { english: "thin", phonemes: ["θ", "ɪ", "n"] },
      { english: "clap", phonemes: ["k", "l", "æ", "p"] },
    ],
  },
  {
    name: "Demo Word Search - Beginner (8x8)",
    activityType: "WORD_SEARCH",
    difficulty: "EASY",
    gridRows: 8,
    gridCols: 8,
    words: [
      { english: "ring", phonemes: ["ɹ", "ɪ", "ŋ"] },
      { english: "log", phonemes: ["l", "ɔ", "g"] },
      { english: "fan", phonemes: ["f", "æ", "n"] },
      { english: "sun", phonemes: ["s", "ɐ", "n"] },
      { english: "hat", phonemes: ["h", "æ", "t"] },
    ],
  },
  {
    // Deliberately has no words -- gives the dashboard's "no words yet" alert
    // something real to show. Add words on /manage to clear the alert.
    name: "Demo - No words yet (alert example)",
    activityType: "WORDLE",
    difficulty: "NORMAL",
  },
];

async function main() {
  const base = process.env.BASE_URL || "http://localhost:3000";

  let existing;
  try {
    const res = await fetch(`${base}/api/activities`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    existing = new Set((await res.json()).activities.map((a) => a.name));
  } catch (err) {
    console.error(`Couldn't reach ${base}/api/activities (${err.message}).`);
    console.error("Is the app running? Try: docker compose up --build");
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const activity of ACTIVITIES) {
    if (existing.has(activity.name)) {
      console.log(`skip     ${activity.name} (already exists)`);
      skipped++;
      continue;
    }
    const res = await fetch(`${base}/api/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity),
    });
    if (res.status === 201) {
      const wordCount = activity.words ? activity.words.length : 0;
      console.log(`created  ${activity.name} (${wordCount} words)`);
      created++;
    } else {
      console.error(`FAILED   ${activity.name} -> HTTP ${res.status}`, await res.text());
      failed++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

// Only run when executed directly, so the data above can be imported and checked.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
