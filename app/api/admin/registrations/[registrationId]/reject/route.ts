import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rejectionReasonSchema } from "@/lib/validation";

export const runtime = "nodejs";

export type RejectionResult =
  | { success: true; status: "REJECTED" }
  | { success: false; error: string };

/**
 * Rejects a registration, optionally recording a reason the registrant sees on
 * the status page.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> },
) {
  const guard = await requireAdminRequest(request);
  if ("response" in guard) return guard.response;

  const { registrationId } = await params;

  let reason: string | undefined;
  try {
    const body = (await request.json()) as { reason?: unknown };
    const parsed = rejectionReasonSchema.safeParse(
      typeof body.reason === "string" ? body.reason : undefined,
    );
    if (!parsed.success) {
      return NextResponse.json<RejectionResult>(
        { success: false, error: parsed.error.issues[0]!.message },
        { status: 422 },
      );
    }
    reason = parsed.data || undefined;
  } catch {
    // An empty body is a rejection with no reason, which is allowed.
  }

  try {
    const registration = await prisma.registration.findUnique({
      where: { registrationId },
      select: { id: true, status: true, payment: { select: { id: true } } },
    });

    if (!registration) {
      return NextResponse.json<RejectionResult>(
        { success: false, error: "notFound" },
        { status: 404 },
      );
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          status: "REJECTED",
          rejectedAt: now,
          rejectionReason: reason ?? null,
          // A rejection revokes any earlier approval, and with it the
          // certificate: leaving these set would leave a stale audit trail
          // claiming the registration is approved.
          approvedAt: null,
          approvedById: null,
        },
      });

      if (registration.payment) {
        await tx.payment.update({
          where: { id: registration.payment.id },
          data: {
            status: "REJECTED",
            verifiedAt: now,
            verifiedById: guard.admin.id,
          },
        });
      }
    });
  } catch (error) {
    console.error("rejection failed", error);
    return NextResponse.json<RejectionResult>(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }

  revalidatePath("/[lang]/admin", "layout");

  return NextResponse.json<RejectionResult>({ success: true, status: "REJECTED" });
}
