import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PHONEMES } from "@/lib/phonemes";

/**
 * GET /api/dashboard — one call that returns every number the dashboard
 * needs. All of it comes from real aggregate queries against the database —
 * nothing here is a placeholder or a client-side guess.
 */
export async function GET() {
  // Database health — the same check /health does, inline, so the dashboard
  // can show it without a second round-trip from the browser.
  let dbHealthy = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbHealthy = false;
  }

  const [
    activityCounts,
    generationBySuccess,
    generationByType,
    avgDurationOverall,
    avgDurationByPage,
    recentFailures,
    emptyActivities,
    totalWords,
    allWords,
  ] = await Promise.all([
    prisma.activity.groupBy({ by: ["activityType"], _count: { _all: true } }),
    prisma.generationEvent.groupBy({ by: ["success"], _count: { _all: true } }),
    prisma.generationEvent.groupBy({
      by: ["activityType"],
      _count: { _all: true },
      orderBy: { _count: { activityType: "desc" } },
    }),
    prisma.pageViewMetric.aggregate({ _avg: { durationMs: true }, _count: { _all: true } }),
    prisma.pageViewMetric.groupBy({ by: ["page"], _avg: { durationMs: true }, _count: { _all: true } }),
    prisma.generationEvent.findMany({
      where: { success: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.activity.findMany({
      where: { words: { none: {} } },
      select: { id: true, name: true, activityType: true },
      take: 10,
    }),
    prisma.word.count(),
    prisma.word.findMany({
      select: { id: true, english: true, phonemes: { select: { ipa: true } } },
    }),
  ]);

  // Invalid data check: every phoneme symbol a teacher enters should be one
  // of the app's supported IPA tokens (the on-screen keyboard). A word using
  // anything else — a typo, or a symbol outside the 43-symbol set — can't be
  // correctly rendered or guessed, so it's flagged here rather than only
  // discovered by a confused teacher later. See README for a real example of
  // this happening (æɪ vs eɪ, ɐ vs ʌ).
  const validIpa = new Set(PHONEMES.map((p) => p.ipa));
  const wordsWithInvalidPhonemes = allWords
    .map((w: { id: string; english: string; phonemes: { ipa: string }[] }) => ({
      id: w.id,
      english: w.english,
      invalidTokens: w.phonemes.map((p: { ipa: string }) => p.ipa).filter((ipa: string) => !validIpa.has(ipa)),
    }))
    .filter((w: { invalidTokens: string[] }) => w.invalidTokens.length > 0)
    .slice(0, 10);

  const activityCountByType = { WORDLE: 0, WORD_SEARCH: 0 } as Record<string, number>;
  for (const row of activityCounts) activityCountByType[row.activityType] = row._count._all;

  const successCount = generationBySuccess.find((r: { success: boolean }) => r.success)?._count._all ?? 0;
  const failureCount = generationBySuccess.find((r: { success: boolean }) => !r.success)?._count._all ?? 0;

  const mostUsedActivityType = generationByType[0]?.activityType ?? null;

  return NextResponse.json({
    health: { database: dbHealthy ? "connected" : "unreachable" },
    activities: {
      total: activityCountByType.WORDLE + activityCountByType.WORD_SEARCH,
      byType: activityCountByType,
      totalWords,
    },
    generation: {
      successCount,
      failureCount,
      total: successCount + failureCount,
      mostUsedActivityType,
      byType: generationByType.map((r: { activityType: string; _count: { _all: number } }) => ({
        activityType: r.activityType,
        count: r._count._all,
      })),
    },
    timeOnPage: {
      averageMs: avgDurationOverall._avg.durationMs ?? 0,
      sampleCount: avgDurationOverall._count._all,
      byPage: avgDurationByPage.map((r: { page: string; _avg: { durationMs: number | null }; _count: { _all: number } }) => ({
        page: r.page,
        averageMs: r._avg.durationMs ?? 0,
        sampleCount: r._count._all,
      })),
    },
    alerts: {
      recentFailures: recentFailures.map(
        (f: { id: string; activityType: string; errorMessage: string | null; createdAt: Date }) => ({
          id: f.id,
          activityType: f.activityType,
          errorMessage: f.errorMessage,
          createdAt: f.createdAt,
        })
      ),
      emptyActivities,
      invalidPhonemeWords: wordsWithInvalidPhonemes,
    },
  });
}