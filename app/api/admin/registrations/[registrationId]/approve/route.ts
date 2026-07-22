import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export type ApprovalResult =
  | { success: true; status: "APPROVED" }
  /** `error` is a key under `dict.admin.errors`. */
  | { success: false; error: string };

/**
 * Approves a registration.
 *
 * The approval is the single event that makes a certificate downloadable, so
 * everything about it is recorded: who approved, and when. Authorization is
 * checked here on the server — the button in the dashboard is a convenience,
 * never the control.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> },
) {
  const guard = await requireAdminRequest(request);
  if ("response" in guard) return guard.response;

  const { registrationId } = await params;

  try {
    const registration = await prisma.registration.findUnique({
      where: { registrationId },
      select: { id: true, status: true, payment: { select: { id: true } } },
    });

    if (!registration) {
      return NextResponse.json<ApprovalResult>(
        { success: false, error: "notFound" },
        { status: 404 },
      );
    }

    if (registration.status === "APPROVED") {
      // Already in the target state — report success so a double-click, or a
      // second administrator acting on the same row, is not an error.
      return NextResponse.json<ApprovalResult>({
        success: true,
        status: "APPROVED",
      });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedById: guard.admin.id,
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      // Approving a registration is also the act of accepting its payment, so
      // the payment record is marked verified by the same administrator.
      if (registration.payment) {
        await tx.payment.update({
          where: { id: registration.payment.id },
          data: {
            status: "VERIFIED",
            verifiedAt: now,
            verifiedById: guard.admin.id,
          },
        });
      }
    });
  } catch (error) {
    console.error("approval failed", error);
    return NextResponse.json<ApprovalResult>(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }

  // The dashboard, its statistics and this registration's detail page all read
  // from the database on request; drop any cached render of them so the new
  // status shows up immediately.
  revalidatePath("/[lang]/admin", "layout");

  return NextResponse.json<ApprovalResult>({ success: true, status: "APPROVED" });
}
