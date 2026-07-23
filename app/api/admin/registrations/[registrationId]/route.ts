import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";

export const runtime = "nodejs";

export type DeleteResult =
  | { success: true }
  /** `error` is a key under `dict.admin.errors`. */
  | { success: false; error: string };

/**
 * Permanently deletes a registration.
 *
 * This is destructive and irreversible: it removes the registrant's record, the
 * payment attached to it, and the uploaded photo and receipt. It is reachable
 * only behind an admin session, and the dashboard asks for confirmation before
 * calling it — but the authorization, like every admin action, is enforced here
 * on the server, not by the dialog.
 *
 * The `Payment` row is removed by the cascade declared on the relation; the
 * stored files are not in the database and are deleted explicitly.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> },
) {
  const guard = await requireAdminRequest(request);
  if ("response" in guard) return guard.response;

  const { registrationId } = await params;

  let registration;
  try {
    registration = await prisma.registration.findUnique({
      where: { registrationId },
      select: {
        id: true,
        photoUrl: true,
        payment: { select: { receiptUrl: true } },
      },
    });
  } catch (error) {
    console.error("delete lookup failed", error);
    return NextResponse.json<DeleteResult>(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }

  if (!registration) {
    // Already gone — report success so a double-click, or two administrators
    // acting at once, is not surfaced as an error.
    return NextResponse.json<DeleteResult>({ success: true });
  }

  try {
    // Delete the row first. If the file deletions below fail we are left with an
    // orphaned blob, which is harmless; the reverse — files gone but the record
    // kept — would leave a registration whose photo 404s.
    await prisma.registration.delete({ where: { id: registration.id } });
  } catch (error) {
    console.error("registration deletion failed", error);
    return NextResponse.json<DeleteResult>(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }

  // Best-effort, and after the row is gone: an orphaned file is not worth
  // failing the request over.
  await deleteStoredFile(registration.photoUrl);
  if (registration.payment?.receiptUrl) {
    await deleteStoredFile(registration.payment.receiptUrl);
  }

  revalidatePath("/[lang]/admin", "layout");

  return NextResponse.json<DeleteResult>({ success: true });
}
