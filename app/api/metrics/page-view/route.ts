import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pageViewMetricSchema, formatZodError } from "@/lib/validation";

/**
 * POST /api/metrics/page-view — records how long a visitor spent on a
 * builder page. Called via navigator.sendBeacon (falling back to fetch) when
 * the page is hidden/unloaded, so it fires reliably even on tab close —
 * `fetch` in a beforeunload/pagehide handler is frequently cancelled by the
 * browser before it completes.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = pageViewMetricSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: formatZodError(parsed.error) },
      { status: 400 }
    );
  }

  await prisma.pageViewMetric.create({ data: parsed.data });
  return NextResponse.json({ ok: true }, { status: 201 });
}