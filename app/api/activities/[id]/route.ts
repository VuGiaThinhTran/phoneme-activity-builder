import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { activityUpdateSchema, formatZodError } from "@/lib/validation";
import { serializeActivity } from "@/lib/serialize";

const wordsInclude = {
  words: {
    include: { phonemes: { orderBy: { position: "asc" as const } } },
    orderBy: { orderIndex: "asc" as const },
  },
};

type Params = { params: Promise<{ id: string }> };

/** GET /api/activities/[id] — one activity with its full, ordered word list. */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const activity = await prisma.activity.findUnique({ where: { id }, include: wordsInclude });
  if (!activity) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }
  return NextResponse.json({ activity: serializeActivity(activity) });
}

/**
 * PATCH /api/activities/[id] — update an activity's own settings (name,
 * difficulty, grid size). Word list edits go through the word-specific
 * endpoints below, so this route only ever touches the activity's own
 * columns.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = activityUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: formatZodError(parsed.error) },
      { status: 400 }
    );
  }
  const { words: _words, ...activityData } = parsed.data;

  try {
    const activity = await prisma.activity.update({
      where: { id },
      data: activityData,
      include: wordsInclude,
    });
    return NextResponse.json({ activity: serializeActivity(activity) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Activity not found." }, { status: 404 });
    }
    throw err;
  }
}

/** DELETE /api/activities/[id] — deletes the activity and, via cascade, every word and phoneme under it. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Activity not found." }, { status: 404 });
    }
    throw err;
  }
}
