import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generationEventSchema, formatZodError } from "@/lib/validation";

/**
 * POST /api/metrics/generation — records one attempt to generate a
 * downloadable Wordle/Word Search HTML file, success or failure. Called by
 * the builder pages themselves right after a Generate click resolves, so the
 * dashboard's success/failure counts reflect real usage, not a static number.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = generationEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  const event = await prisma.generationEvent.create({ data: parsed.data });
  return NextResponse.json({ event }, { status: 201 });
}