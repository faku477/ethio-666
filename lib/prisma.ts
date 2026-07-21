import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

/**
 * Prisma 7 requires an explicit driver adapter — there is no built-in engine
 * connection any more.
 *
 * The client is cached on `globalThis` in development because Next.js reloads
 * modules on every edit; without the cache each reload opens a new pool and the
 * database runs out of connections within a few minutes.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
    );
  }

  // Pool size must be set here, not via `?connection_limit=` in the URL: that
  // parameter is read by Prisma's own engine, and with a driver adapter the
  // pool belongs to `pg`, which ignores it and defaults to 10.
  //
  // A small pool is what serverless wants anyway — each function instance
  // handles one request at a time, so a large pool just exhausts the database's
  // connection budget as instances scale out.
  const max = Number(process.env.DATABASE_POOL_MAX ?? 5);

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, max }),
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
