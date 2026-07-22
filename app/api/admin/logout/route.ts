import { NextResponse } from "next/server";

import { assertSameOrigin, destroySession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  // Logging out is idempotent and must always appear to succeed — a failure
  // here would leave someone stuck on a machine they are trying to leave.
  await destroySession();

  return NextResponse.json({ success: true });
}
