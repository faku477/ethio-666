import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { ReadableOptions } from "node:stream";

import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/**
 * Serves photos written by the local development storage driver.
 *
 * Development only. In production photos live in Vercel Blob and are served
 * from its own domain, so this route refuses to run — it would otherwise be a
 * filesystem read endpoint exposed to the internet.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { path: segments } = await params;

  // Resolve, then verify the result is still inside the upload directory.
  // Segments are URL-controlled, so `..` must not be able to climb out.
  const resolved = path.resolve(LOCAL_UPLOAD_DIR, ...segments);
  const root = path.resolve(LOCAL_UPLOAD_DIR);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(resolved).toLowerCase()];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const info = await stat(resolved);
    if (!info.isFile()) return new Response("Not found", { status: 404 });

    const stream = createReadStream(resolved) as unknown as ReadableOptions &
      AsyncIterable<Uint8Array>;

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) controller.enqueue(chunk);
          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(info.size),
          "Cache-Control": "private, max-age=3600",
        },
      },
    );
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
