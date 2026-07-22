import { NextResponse } from "next/server";

import { allocateNumbers } from "@/lib/ids";
import { readImageDimensions } from "@/lib/image-size";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { storePhoto } from "@/lib/storage";
import {
  collectFieldErrors,
  registrationSchema,
  sniffImageType,
  validatePhotoDimensions,
  validatePhotoMeta,
  type FieldErrors,
} from "@/lib/validation";

export type RegisterSuccess = {
  success: true;
  registrationId: string;
  certificateNumber: string;
};

export type RegisterFailure = {
  success: false;
  /** Dictionary key for a form-level message. */
  error?: string;
  fieldErrors?: FieldErrors;
};

function failure(
  body: RegisterFailure,
  status: number,
  headers?: HeadersInit,
): NextResponse<RegisterFailure> {
  return NextResponse.json(body, { status, headers });
}

export async function POST(request: Request) {
  const limit = checkRateLimit(clientIp(request));
  if (!limit.allowed) {
    return failure({ success: false, error: "rateLimited" }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure({ success: false, error: "badRequest" }, 400);
  }

  // Re-validate everything server-side. The client ran the same schema, but a
  // request can be crafted by hand and never touched the form at all.
  const parsed = registrationSchema.safeParse({
    fullName: form.get("fullName"),
    identificationId: form.get("identificationId"),
    phoneNumber: form.get("phoneNumber"),
    bankAccountNumber: form.get("bankAccountNumber"),
    email: form.get("email") ?? "",
  });

  const photo = form.get("photo");
  const photoFile = photo instanceof File ? photo : null;
  const photoMetaError = validatePhotoMeta(photoFile);

  if (!parsed.success || photoMetaError) {
    const fieldErrors: FieldErrors = parsed.success
      ? {}
      : collectFieldErrors(parsed.error);
    if (photoMetaError) fieldErrors.photo = photoMetaError;
    return failure({ success: false, fieldErrors }, 422);
  }

  const data = parsed.data;
  const file = photoFile as File;

  // A declared MIME type is just a header. Verify the bytes actually are one of
  // the accepted image formats before storing the file anywhere.
  //
  // The first 64 KB rather than 16 bytes: PNG and WebP state their dimensions
  // within the first 30 bytes, but a JPEG's frame header sits after however
  // many EXIF and colour-profile segments the camera wrote first.
  const header = new Uint8Array(await file.slice(0, 65_536).arrayBuffer());
  const sniffedType = sniffImageType(header);
  if (!sniffedType) {
    return failure({ success: false, fieldErrors: { photo: "photoType" } }, 422);
  }

  // Passport or 4x4 shape, checked here and not only in the form: the form is a
  // convenience, and a request can be crafted without ever loading it.
  const dimensions = readImageDimensions(header);
  if (!dimensions) {
    return failure(
      { success: false, fieldErrors: { photo: "photoUnreadable" } },
      422,
    );
  }

  const dimensionError = validatePhotoDimensions(
    dimensions.width,
    dimensions.height,
  );
  if (dimensionError) {
    return failure(
      { success: false, fieldErrors: { photo: dimensionError } },
      422,
    );
  }

  // Duplicate check before the upload, so an obvious rejection does not leave a
  // stray object in storage.
  //
  // Guarded: an unreachable or unconfigured database throws here, and an
  // unhandled throw makes Next return an HTML error page. The client then fails
  // to parse it as JSON and reports a connection problem, hiding the real
  // cause. Every exit from this route must be structured JSON.
  let existing: { identificationId: string; phoneNumber: string } | null;
  try {
    existing = await prisma.registration.findFirst({
      where: {
        OR: [
          { identificationId: data.identificationId },
          { phoneNumber: data.phoneNumber },
        ],
      },
      select: { identificationId: true, phoneNumber: true },
    });
  } catch (error) {
    console.error("duplicate check failed", error);
    return failure({ success: false, error: "serverError" }, 500);
  }

  if (existing) {
    return failure(
      {
        success: false,
        fieldErrors:
          existing.identificationId === data.identificationId
            ? { identificationId: "identificationIdTaken" }
            : { phoneNumber: "phoneNumberTaken" },
      },
      409,
    );
  }

  let stored;
  try {
    // Deliberately outside the transaction: this is network I/O and would hold
    // a database transaction open for its full duration.
    stored = await storePhoto(file, sniffedType);
  } catch (error) {
    console.error("photo upload failed", error);
    return failure({ success: false, error: "uploadFailed" }, 500);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const numbers = await allocateNumbers(tx, new Date().getFullYear());

      await tx.registration.create({
        data: {
          ...numbers,
          fullName: data.fullName,
          identificationId: data.identificationId,
          phoneNumber: data.phoneNumber,
          bankAccountNumber: data.bankAccountNumber,
          email: data.email,
          photoUrl: stored.url,
          photoMimeType: stored.mimeType,
          photoSize: stored.size,
        },
        select: { id: true },
      });

      return numbers;
    });

    // Only the public identifiers are returned. The bank account number is
    // never echoed back, not even to the person who just typed it.
    return NextResponse.json<RegisterSuccess>({
      success: true,
      registrationId: result.registrationId,
      certificateNumber: result.certificateNumber,
    });
  } catch (error) {
    // Unique-constraint violation from a concurrent duplicate submission.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return failure({ success: false, error: "duplicate" }, 409);
    }

    // Log the failure, never the payload — it holds a bank account number.
    console.error("registration failed", error);
    return failure({ success: false, error: "serverError" }, 500);
  }
}
