import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import "server-only";

export type StoredPhoto = {
  url: string;
  mimeType: string;
  size: number;
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
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
  const extension = EXTENSIONS[mimeType] ?? "bin";
  const key = `photos/${randomUUID()}.${extension}`;

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
