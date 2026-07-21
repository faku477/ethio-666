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

  if (token) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, file, {
      access: "public",
      contentType: mimeType,
      token,
    });
    return { url: blob.url, mimeType, size: file.size };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Photo storage is unavailable in production.",
    );
  }

  const destination = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await file.arrayBuffer()));

  return { url: `/api/uploads/${key}`, mimeType, size: file.size };
}
