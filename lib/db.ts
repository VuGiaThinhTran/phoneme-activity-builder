import { PrismaClient } from "@prisma/client";

// Standard Next.js + Prisma singleton pattern: in dev, Next's hot-reload would
// otherwise create a brand new PrismaClient (and a new DB connection pool) on
// every file save, eventually exhausting the database's connection limit.
// Stashing the instance on `globalThis` survives module reloads in dev while
// still being a fresh, single instance in production.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
