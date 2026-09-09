import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /health — used by Docker healthchecks and manual verification. This
 * does a real round-trip to the database rather than just returning 200
 * unconditionally, so it actually reflects whether the backend can serve
 * requests, not just whether the Node process is running.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", database: "connected", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
