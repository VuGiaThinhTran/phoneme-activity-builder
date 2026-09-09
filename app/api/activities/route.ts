import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { activityInputSchema, formatZodError } from "@/lib/validation";
import { serializeActivity, serializeActivitySummary } from "@/lib/serialize";

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
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = activityInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: formatZodError(parsed.error) },
      { status: 400 }
    );
  }
  const { words, ...activityData } = parsed.data;

  const activity = await prisma.activity.create({
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
  });

  return NextResponse.json({ activity: serializeActivity(activity) }, { status: 201 });
}
