import type { Activity, Word, PhonemeSegment } from "@prisma/client";

type WordWithPhonemes = Word & { phonemes: PhonemeSegment[] };
type ActivityWithWords = Activity & { words: WordWithPhonemes[] };

/**
 * Flattens a Word's related PhonemeSegment rows (one row per phoneme,
 * ordered by `position`) back into a simple ordered string array — the same
 * shape the Assessment 1 frontend already works with, so the builder pages
 * don't need to know the phonemes are relationally stored under the hood.
 */
export function serializeWord(word: WordWithPhonemes) {
  return {
    id: word.id,
    english: word.english,
    hint: word.hint ?? undefined,
    orderIndex: word.orderIndex,
    phonemes: [...word.phonemes].sort((a, b) => a.position - b.position).map((p) => p.ipa),
  };
}

export function serializeActivity(activity: ActivityWithWords) {
  return {
    id: activity.id,
    name: activity.name,
    activityType: activity.activityType,
    difficulty: activity.difficulty,
    gridRows: activity.gridRows ?? undefined,
    gridCols: activity.gridCols ?? undefined,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    words: activity.words.map(serializeWord),
  };
}

export function serializeActivitySummary(
  activity: Activity & { _count: { words: number } }
) {
  return {
    id: activity.id,
    name: activity.name,
    activityType: activity.activityType,
    difficulty: activity.difficulty,
    gridRows: activity.gridRows ?? undefined,
    gridCols: activity.gridCols ?? undefined,
    wordCount: activity._count.words,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
  };
}
