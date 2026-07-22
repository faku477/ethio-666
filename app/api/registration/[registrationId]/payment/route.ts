import { NextResponse } from "next/server";

import { assertSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { storeReceipt } from "@/lib/storage";
import {
  sniffReceiptType,
  validatePaymentSubmission,
  type PaymentFieldErrors,
} from "@/lib/validation";

/** Needs the Node runtime: file storage and the database driver. */
export const runtime = "nodejs";

export type PaymentSubmitSuccess = {
  success: true;
  registrationStatus: "PAYMENT_SUBMITTED";
};

export type PaymentSubmitFailure = {
  success: false;
  /** Dictionary key under `dict.payment.errors` for a form-level message. */
  error?: string;
  fieldErrors?: PaymentFieldErrors;
};

function failure(
  body: PaymentSubmitFailure,
  status: number,
  headers?: HeadersInit,
): NextResponse<PaymentSubmitFailure> {
  return NextResponse.json(body, { status, headers });
}

/**
 * Submits proof of payment for a registration.
 *
 * Open to the registrant, who is identified only by possession of their
 * registration number — there are no participant accounts in this system. That
 * is acceptable because the endpoint can only *attach* payment proof: it never
 * discloses anything about the registration, never approves anything, and
 * refuses outright once an administrator has verified the payment, so a guessed
 * registration number cannot be used to erase a verified record.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> },
) {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limit = checkRateLimit(`payment:${clientIp(request)}`, { max: 10 });
  if (!limit.allowed) {
    return failure({ success: false, error: "rateLimited" }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  const { registrationId } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure({ success: false, error: "badRequest" }, 400);
  }

  const reference = String(form.get("reference") ?? "");
  const receiptEntry = form.get("receipt");
  const receipt =
    receiptEntry instanceof File && receiptEntry.size > 0 ? receiptEntry : null;

  const fieldErrors = validatePaymentSubmission({ reference, receipt });
  if (Object.keys(fieldErrors).length > 0) {
    const { form: formError, ...fields } = fieldErrors;
    return failure(
      {
        success: false,
        ...(formError ? { error: formError } : {}),
        ...(Object.keys(fields).length > 0 ? { fieldErrors: fields } : {}),
      },
      422,
    );
  }

  let registration;
  try {
    registration = await prisma.registration.findUnique({
      where: { registrationId },
      select: {
        id: true,
        status: true,
        payment: { select: { id: true, status: true, receiptUrl: true } },
      },
    });
  } catch (error) {
    console.error("payment lookup failed", error);
    return failure({ success: false, error: "serverError" }, 500);
  }

  if (!registration) {
    return failure({ success: false, error: "notFound" }, 404);
  }

  if (registration.status === "APPROVED") {
    return failure({ success: false, error: "alreadyApproved" }, 409);
  }

  // A verified payment is an administrator's decision. Overwriting it from an
  // unauthenticated endpoint would let anyone holding a registration number
  // wipe the evidence behind an approval.
  if (registration.payment?.status === "VERIFIED") {
    return failure({ success: false, error: "locked" }, 409);
  }

  let stored: { url: string; mimeType: string; size: number } | null = null;

  if (receipt) {
    // The declared type is just a header; the bytes decide what this file is.
    const header = new Uint8Array(await receipt.slice(0, 16).arrayBuffer());
    const sniffed = sniffReceiptType(header);
    if (!sniffed) {
      return failure(
        { success: false, fieldErrors: { receipt: "receiptType" } },
        422,
      );
    }

    try {
      // Network I/O, deliberately outside the transaction below.
      stored = await storeReceipt(receipt, sniffed);
    } catch (error) {
      console.error("receipt upload failed", error);
      return failure({ success: false, error: "uploadFailed" }, 500);
    }
  }

  const trimmedReference = reference.trim();

  try {
    await prisma.$transaction(async (tx) => {
      const paymentData = {
        referenceNumber: trimmedReference || null,
        // A re-submission with no new file keeps the receipt already on record,
        // so correcting a typo in the reference does not silently drop it.
        ...(stored
          ? {
              receiptUrl: stored.url,
              receiptMimeType: stored.mimeType,
              receiptSize: stored.size,
            }
          : {}),
        status: "SUBMITTED" as const,
        submittedAt: new Date(),
        // A previous rejection is cleared by the new attempt.
        verifiedAt: null,
        verifiedById: null,
      };

      await tx.payment.upsert({
        where: { registrationId: registration.id },
        create: { registrationId: registration.id, ...paymentData },
        update: paymentData,
      });

      await tx.registration.update({
        where: { id: registration.id },
        data: {
          status: "PAYMENT_SUBMITTED",
          paymentSubmittedAt: new Date(),
          // Re-submitting after a rejection puts the registration back in the
          // review queue; the stale rejection must not linger on the record.
          rejectedAt: null,
          rejectionReason: null,
        },
      });
    });
  } catch (error) {
    console.error("payment submission failed", error);
    return failure({ success: false, error: "serverError" }, 500);
  }

  return NextResponse.json<PaymentSubmitSuccess>({
    success: true,
    registrationStatus: "PAYMENT_SUBMITTED",
  });
}
