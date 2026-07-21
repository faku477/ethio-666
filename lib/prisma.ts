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
      "DATABASE_URL is not set. Set it in your environment (locally in .env, " +
        "on Vercel under Settings > Environment Variables).",
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

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * The client is created on first *use*, not on import.
 *
 * `next build` evaluates every route module to collect page data. Constructing
 * the client at module scope therefore ran `createClient()` during the build,
 * which failed the whole build with "DATABASE_URL is not set" — the database is
 * a runtime dependency and is deliberately not exposed to the build step.
 * Opening a connection pool at build time would be wrong even where the
 * variable happens to be present.
 *
 * Methods are bound to the real client so `this` still refers to it, which
 * matters for `$transaction` and the model delegates.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property) as unknown;
    return typeof value === "function" ? value.bind(client) : value;
  },
});
