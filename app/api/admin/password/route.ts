import { NextResponse } from "next/server";

import {
  createSession,
  hashPassword,
  requireAdminRequest,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema } from "@/lib/validation";

export const runtime = "nodejs";

export type PasswordChangeResult =
  | { success: true }
  | { success: false; error?: string; fieldErrors?: Record<string, string> };

/** Changes the signed-in administrator's own password. */
export async function POST(request: Request) {
  const guard = await requireAdminRequest(request);
  if ("response" in guard) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<PasswordChangeResult>(
      { success: false, error: "serverError" },
      { status: 400 },
    );
  }

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
    return NextResponse.json<PasswordChangeResult>(
      { success: false, fieldErrors },
      { status: 422 },
    );
  }

  const account = await prisma.adminUser.findUnique({
    where: { id: guard.admin.id },
    select: { passwordHash: true },
  });

  if (
    !account ||
    !(await verifyPassword(parsed.data.currentPassword, account.passwordHash))
  ) {
    return NextResponse.json<PasswordChangeResult>(
      { success: false, fieldErrors: { currentPassword: "invalidCredentials" } },
      { status: 401 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: guard.admin.id },
      data: { passwordHash, mustChangePassword: false },
    }),
    // Every existing session for this account is invalidated: if the password
    // was changed because it may have leaked, leaving old sessions alive
    // defeats the point.
    prisma.adminSession.deleteMany({ where: { adminId: guard.admin.id } }),
  ]);

  // ...including this browser's, so issue it a fresh one rather than signing
  // the administrator out of the page they are standing on.
  await createSession(guard.admin.id, request);

  return NextResponse.json<PasswordChangeResult>({ success: true });
}
