import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { wordUpdateSchema, formatZodError } from "@/lib/validation";
import { serializeWord } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/words/[id] — update a word's spelling, hint, and/or its whole
 * phoneme sequence. Replacing phonemes is delete-then-recreate, wrapped in a
 * transaction so a failure partway through can't leave the word with half
 * its old phonemes and half new ones.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = wordUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const existing = await prisma.word.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Word not found." }, { status: 404 });
  }

  const { phonemes, ...wordData } = parsed.data;

  const word = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (phonemes) {
      await tx.phonemeSegment.deleteMany({ where: { wordId: id } });
    }
    return tx.word.update({
      where: { id },
      data: {
        ...wordData,
        phonemes: phonemes
          ? { create: phonemes.map((ipa, position) => ({ ipa, position })) }
          : undefined,
      },
      include: { phonemes: { orderBy: { position: "asc" } } },
    });
  });

  return NextResponse.json({ word: serializeWord(word) });
}

/** DELETE /api/words/[id] — removes a word and, via cascade, its phoneme segments. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.word.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Word not found." }, { status: 404 });
    }
    throw err;
  }
}
