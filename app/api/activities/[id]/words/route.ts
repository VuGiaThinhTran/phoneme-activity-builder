import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { wordInputSchema, formatZodError } from "@/lib/validation";
import { serializeWord } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

/** POST /api/activities/[id]/words — add one word (with its phoneme sequence) to an activity. */
export async function POST(req: NextRequest, { params }: Params) {
  const { id: activityId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = wordInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) {
    return NextResponse.json({ error: "Activity not found." }, { status: 404 });
  }

  const { phonemes, ...wordData } = parsed.data;
  const word = await prisma.word.create({
    data: {
      ...wordData,
      activityId,
      phonemes: { create: phonemes.map((ipa, position) => ({ ipa, position })) },
    },
    include: { phonemes: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json({ word: serializeWord(word) }, { status: 201 });
}
