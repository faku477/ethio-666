import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";

export const runtime = "nodejs";
/** Reports live state and is per-administrator; never cache it. */
export const dynamic = "force-dynamic";

/** The only content types a stored receipt may be served as. Serving a receipt
 *  with any other type would let a crafted upload execute in the admin's
 *  browser under this origin. */
const SERVABLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Streams a payment receipt to a signed-in administrator.
 *
 * Receipts are never linked from a page by their storage URL: Vercel Blob has
 * no private access mode, so the storage URL is treated as a secret and the
 * bytes are proxied through this authenticated route instead.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ registrationId: string }> },
) {
  const admin = await getAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { registrationId } = await params;

  const registration = await prisma.registration.findUnique({
    where: { registrationId },
    select: {
      payment: {
        select: { receiptUrl: true, receiptMimeType: true },
      },
    },
  });

  const receiptUrl = registration?.payment?.receiptUrl;
  if (!receiptUrl) {
    return new Response("Not found", { status: 404 });
  }

  const file = await readStoredFile(receiptUrl);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  // Trust the type recorded at upload time — it came from sniffing the bytes,
  // not from the client — and fall back to a download if it is anything else.
  const recorded = registration.payment?.receiptMimeType ?? "";
  const contentType = SERVABLE_TYPES.has(recorded)
    ? recorded
    : "application/octet-stream";

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(file.bytes.length),
      "Content-Disposition": `inline; filename="${registrationId}-receipt"`,
      // Blocks any script or embedded object the file might smuggle from
      // running with this origin's privileges.
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; object-src 'self'",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
