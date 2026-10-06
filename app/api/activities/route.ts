import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { activityInputSchema, formatZodError } from "@/lib/validation";
import { serializeActivity, serializeActivitySummary } from "@/lib/serialize";
import { withDbSpan, withSpan } from "@/lib/telemetry";

const wordsInclude = {
  words: {
    include: { phonemes: { orderBy: { position: "asc" as const } } },
    orderBy: { orderIndex: "asc" as const },
  },
};

/** GET /api/activities — list every saved activity, with a word count for each. */
export async function GET() {
  const activities = await prisma.activity.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { words: true } } },
  });
  return NextResponse.json({ activities: activities.map(serializeActivitySummary) });
}

/**
 * POST /api/activities — create a new activity (Wordle or Word Search
 * configuration), optionally with its full word list in the same request.
 *
 * The body is wrapped in spans so a trace shows where the time went:
 *   activities.create  >  activities.validate
 *                      >  db INSERT activities   (the hop to the db container)
 *                      >  activities.serialize
 */
export async function POST(req: NextRequest) {
  return withSpan("activities.create", {}, async (span) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      span.setAttribute("validation.failed", true);
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = await withSpan("activities.validate", { "validation.library": "zod" }, (vspan) => {
      const result = activityInputSchema.safeParse(body);
      vspan.setAttribute("validation.success", result.success);
      return result;
    });
    if (!parsed.success) {
      span.setAttribute("validation.failed", true);
      return NextResponse.json(
        { error: "Validation failed.", fields: formatZodError(parsed.error) },
        { status: 400 }
      );
    }
    const { words, ...activityData } = parsed.data;
    span.setAttributes({
      "activity.type": activityData.activityType,
      "activity.difficulty": activityData.difficulty ?? "NORMAL",
      "activity.word_count": words?.length ?? 0,
    });

    const activity = await withDbSpan(
      "INSERT",
      "activities",
      () =>
        prisma.activity.create({
          data: {
            ...activityData,
            words: words
              ? {
                  create: words.map((w, i) => ({
                    english: w.english,
                    hint: w.hint,
                    orderIndex: w.orderIndex ?? i,
                    phonemes: { create: w.phonemes.map((ipa, position) => ({ ipa, position })) },
                  })),
                }
              : undefined,
          },
          include: wordsInclude,
        }),
      { "db.note": "one nested write: activities + words + phoneme_segments, in one transaction" }
    );

    const payload = await withSpan("activities.serialize", {}, () => serializeActivity(activity));
    return NextResponse.json({ activity: payload }, { status: 201 });
  });
}
