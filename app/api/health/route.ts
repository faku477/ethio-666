import { prisma } from "@/lib/prisma";

/** Needs the Node runtime for the database driver. */
export const runtime = "nodejs";
/** Must never be cached: it reports live state. */
export const dynamic = "force-dynamic";

/**
 * Deployment diagnostic.
 *
 * Reports which runtime dependencies are configured and reachable, so a failing
 * deployment can be diagnosed without reading platform logs.
 *
 * It deliberately reports only booleans and redacted error text — never the
 * connection string, credentials or token values. Delete this route, or put it
 * behind auth, once the deployment is healthy: it still discloses which
 * services the app uses.
 */

/** Strips credentials from anything a driver error might echo back. */
function redact(message: string): string {
  return message
    .replace(/\/\/[^@\s]*@/g, "//***:***@")
    .replace(/(api_key|password|token)=[^&\s"']+/gi, "$1=***")
    .slice(0, 300);
}

type Check = { ok: boolean; detail?: string };

export async function GET() {
  const checks: Record<string, Check> = {};

  // 1. Is the database URL present at all?
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  checks.databaseUrlConfigured = {
    ok: hasDatabaseUrl,
    detail: hasDatabaseUrl
      ? undefined
      : "DATABASE_URL is not set for this environment.",
  };

  // 2. Can we actually reach it?
  if (hasDatabaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.databaseReachable = { ok: true };
    } catch (error) {
      checks.databaseReachable = {
        ok: false,
        detail: redact(error instanceof Error ? error.message : String(error)),
      };
    }

    // 3. Have the migrations been applied? A reachable database with no tables
    //    is the single most common "it deployed but nothing works" cause.
    if (checks.databaseReachable.ok) {
      try {
        const count = await prisma.registration.count();
        checks.tablesPresent = {
          ok: true,
          detail: `${count} registration(s)`,
        };
      } catch (error) {
        checks.tablesPresent = {
          ok: false,
          detail:
            "Tables are missing. Run: prisma migrate deploy against this database. " +
            redact(error instanceof Error ? error.message : String(error)),
        };
      }
    }
  }

  // 4. Photo storage. Without this, registration fails at the upload step.
  //    Either credential works: an explicit token, or BLOB_STORE_ID with OIDC,
  //    which is what connecting a Blob store to the project provisions.
  const blobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const blobStoreId = Boolean(process.env.BLOB_STORE_ID);
  checks.photoStorageConfigured = {
    ok: blobToken || blobStoreId,
    detail: blobToken
      ? "using BLOB_READ_WRITE_TOKEN"
      : blobStoreId
        ? "using BLOB_STORE_ID with OIDC"
        : "No Blob credentials; uploads fail in production.",
  };

  // 5. The origin baked into certificate QR codes.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  checks.appUrlConfigured = {
    ok: Boolean(appUrl),
    detail: appUrl ?? "NEXT_PUBLIC_APP_URL is not set; QR codes fall back to the request origin.",
  };

  const healthy = Object.values(checks).every((check) => check.ok);

  return Response.json(
    { healthy, checks },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
