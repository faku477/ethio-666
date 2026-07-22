import { NextResponse } from "next/server";

import {
  assertSameOrigin,
  createSession,
  pruneExpiredSessions,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export type AdminLoginResult =
  | { success: true; mustChangePassword: boolean }
  /** `error` is a key under `dict.admin.errors`. */
  | { success: false; error: string };

export async function POST(request: Request) {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  // Tighter than the public limiter: this endpoint guards every registrant's
  // personal data, so an online guessing attempt must run out of budget fast.
  const limit = checkRateLimit(`admin-login:${clientIp(request)}`, {
    max: 8,
    windowMs: 5 * 60_000,
  });
  if (!limit.allowed) {
    return NextResponse.json<AdminLoginResult>(
      { success: false, error: "rateLimited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<AdminLoginResult>(
      { success: false, error: "serverError" },
      { status: 400 },
    );
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<AdminLoginResult>(
      { success: false, error: parsed.error.issues[0]!.message },
      { status: 422 },
    );
  }

  let admin;
  try {
    admin = await prisma.adminUser.findUnique({
      where: { email: parsed.data.email },
      select: {
        id: true,
        passwordHash: true,
        isActive: true,
        mustChangePassword: true,
      },
    });
  } catch (error) {
    console.error("admin lookup failed", error);
    return NextResponse.json<AdminLoginResult>(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }

  // Hash even when the account does not exist, so response timing does not
  // reveal which emails are administrators.
  const passwordOk = await verifyPassword(
    parsed.data.password,
    admin?.passwordHash ??
      "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  );

  // One message for every failure mode: a wrong password, an unknown email and
  // a disabled account must be indistinguishable to the caller.
  if (!admin || !admin.isActive || !passwordOk) {
    return NextResponse.json<AdminLoginResult>(
      { success: false, error: "invalidCredentials" },
      { status: 401 },
    );
  }

  try {
    await createSession(admin.id, request);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    await pruneExpiredSessions();
  } catch (error) {
    console.error("session creation failed", error);
    return NextResponse.json<AdminLoginResult>(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }

  return NextResponse.json<AdminLoginResult>({
    success: true,
    mustChangePassword: admin.mustChangePassword,
  });
}
