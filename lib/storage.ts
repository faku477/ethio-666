import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import "server-only";

export type StoredPhoto = {
  url: string;
  mimeType: string;
  size: number;
};

/** Alias: receipts are stored through the same driver as photos. */
export type StoredFile = StoredPhoto;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Directory used by the local development driver only. */
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");

/**
 * Stores a participant photo and returns its public URL.
 *
 * Two drivers:
 *   - Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set. This is the production
 *     path — Vercel's function filesystem is ephemeral, so anything written
 *     there disappears between invocations.
 *   - Local disk under `.uploads/` otherwise, for development without a Blob
 *     token. It refuses to run in production so a missing token fails loudly at
 *     deploy time instead of silently losing every photo.
 *
 * The filename is a random UUID: the original name is attacker-controlled and
 * a predictable name would let anyone enumerate participant photos.
 */
export async function storePhoto(
  file: File,
  mimeType: string,
): Promise<StoredPhoto> {
  return storeFile(file, mimeType, "photos");
}

/**
 * Stores a payment receipt.
 *
 * Receipts are proof-of-payment documents belonging to one participant and are
 * never linked publicly: the stored URL is read back only by
 * `/api/admin/registrations/[registrationId]/receipt`, which requires an admin
 * session and streams the bytes itself.
 *
 * NOTE on Vercel Blob: every blob is served from an unguessable public URL —
 * the product has no private access mode. That URL is therefore treated as a
 * secret; it is never rendered into a page, an API response or a log line.
 */
export async function storeReceipt(
  file: File,
  mimeType: string,
): Promise<StoredFile> {
  return storeFile(file, mimeType, "receipts");
}

async function storeFile(
  file: File,
  mimeType: string,
  folder: "photos" | "receipts",
): Promise<StoredFile> {
  const extension = EXTENSIONS[mimeType] ?? "bin";
  const key = `${folder}/${randomUUID()}.${extension}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // Two ways Vercel Blob authenticates:
  //   - an explicit read/write token, or
  //   - OIDC, where the SDK combines VERCEL_OIDC_TOKEN with BLOB_STORE_ID.
  // Connecting a Blob store to a project now provisions BLOB_STORE_ID and no
  // token, so requiring the token would refuse to upload on a correctly
  // configured deployment. When there is no token, omit it and let the SDK
  // resolve OIDC itself.
  if (token || process.env.BLOB_STORE_ID) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, file, {
      access: "public",
      contentType: mimeType,
      ...(token ? { token } : {}),
    });
    return { url: blob.url, mimeType, size: file.size };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No Blob credentials found. Set BLOB_READ_WRITE_TOKEN, or connect a Blob " +
        "store to the project so BLOB_STORE_ID and OIDC are available.",
    );
  }

  const destination = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await file.arrayBuffer()));

  return { url: `/api/uploads/${key}`, mimeType, size: file.size };
}

/**
 * Reads a stored file back into memory, whichever driver wrote it.
 *
 * Used by the routes that must stream a file through the application rather
 * than hand out its storage URL — receipts, and the photo embedded in a
 * certificate PDF. Returns null when the file cannot be read; callers decide
 * whether that is fatal.
 */
export async function readStoredFile(
  storedUrl: string,
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  try {
    if (storedUrl.startsWith("/api/uploads/")) {
      const relative = storedUrl.slice("/api/uploads/".length);

      // The stored URL comes from our own database, but resolve-then-verify
      // anyway: a single bad row must not become an arbitrary file read.
      const resolved = path.resolve(LOCAL_UPLOAD_DIR, relative);
      const root = path.resolve(LOCAL_UPLOAD_DIR);
      if (!resolved.startsWith(root + path.sep)) return null;

      const extension = path.extname(resolved).toLowerCase().slice(1);
      const mimeType = Object.entries(EXTENSIONS).find(
        ([, ext]) => ext === extension,
      )?.[0];
      if (!mimeType) return null;

      const { readFile } = await import("node:fs/promises");
      return { bytes: await readFile(resolved), mimeType };
    }

    const response = await fetch(storedUrl);
    if (!response.ok) return null;

    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      mimeType: (response.headers.get("content-type") ?? "application/octet-stream")
        .split(";")[0]!
        .trim(),
    };
  } catch {
    return null;
  }
}
