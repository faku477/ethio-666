import { z } from "zod";

/**
 * Validation rules shared by the browser and the server.
 *
 * Messages are dictionary *keys*, not sentences: the same schema runs in both
 * places and the server has no business deciding which language to answer in.
 * The UI resolves the key through `dict.register.errors`.
 */

// 4 MB, deliberately under Vercel's 4.5 MB serverless request body limit.
// A larger cap would let the platform reject the request with a 413 before our
// own validation ever runs, producing an unexplained failure instead of a
// readable "photo too large" message.
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Magic-byte signatures, checked server-side. A client-supplied MIME type is
 *  just a string and can claim anything. */
const PHOTO_SIGNATURES: { type: string; bytes: number[]; offset: number }[] = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff], offset: 0 },
  {
    type: "image/png",
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    offset: 0,
  },
  // WebP: "RIFF" .... "WEBP" — the second marker sits at byte 8.
  { type: "image/webp", bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
];

/**
 * Returns the image type implied by the file's leading bytes, or null when the
 * content matches none of the accepted formats.
 */
export function sniffImageType(buffer: Uint8Array): string | null {
  for (const sig of PHOTO_SIGNATURES) {
    const slice = buffer.subarray(sig.offset, sig.offset + sig.bytes.length);
    if (
      slice.length === sig.bytes.length &&
      sig.bytes.every((b, i) => slice[i] === b)
    ) {
      return sig.type;
    }
  }
  return null;
}

/**
 * Normalizes an Ethiopian mobile number to E.164 (+251XXXXXXXXX).
 *
 * Accepts 09XXXXXXXX, 07XXXXXXXX, 2519XXXXXXXX, +2519XXXXXXXX and the same with
 * spaces, dashes or parentheses. Returns null if the number is not a valid
 * Ethiopian mobile number.
 *
 * Storing one canonical form is what makes the `phoneNumber` unique constraint
 * meaningful — otherwise 0912345678 and +251912345678 are two different rows
 * for the same person.
 */
export function normalizePhoneNumber(raw: string): string | null {
  const cleaned = raw.replace(/[\s()\-.]/g, "");

  let national: string;
  if (cleaned.startsWith("+251")) {
    national = cleaned.slice(4);
  } else if (cleaned.startsWith("251")) {
    national = cleaned.slice(3);
  } else if (cleaned.startsWith("0")) {
    national = cleaned.slice(1);
  } else {
    national = cleaned;
  }

  // Ethiopian mobile numbers are 9 digits and begin with 9 or 7.
  if (!/^[79]\d{8}$/.test(national)) return null;

  return `+251${national}`;
}

export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "fullNameTooShort")
    .max(100, "fullNameTooLong"),

  identificationId: z
    .string()
    .trim()
    .min(4, "identificationIdInvalid")
    .max(30, "identificationIdInvalid")
    .regex(/^[A-Za-z0-9/-]+$/, "identificationIdInvalid"),

  phoneNumber: z
    .string()
    .trim()
    .min(1, "phoneNumberRequired")
    .refine((v) => normalizePhoneNumber(v) !== null, "phoneNumberInvalid")
    .transform((v) => normalizePhoneNumber(v) as string),

  bankAccountNumber: z
    .string()
    .trim()
    .min(5, "bankAccountNumberInvalid")
    .max(30, "bankAccountNumberInvalid")
    .regex(/^[0-9-]+$/, "bankAccountNumberInvalid"),

  // An empty input must mean "not provided", not "invalid email".
  email: z
    .union([z.literal(""), z.string().trim().email("emailInvalid")])
    .optional()
    .transform((v) => (v ? v : null)),
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationData = z.output<typeof registrationSchema>;

export type RegistrationField = keyof RegistrationInput | "photo";

/** Field -> first error key, the shape the form renders from. */
export type FieldErrors = Partial<Record<RegistrationField, string>>;

export function collectFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as RegistrationField | undefined;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

/* -------------------------------------------------------------------------
 * Payment proof
 * ---------------------------------------------------------------------- */

/** Same 4 MB ceiling as photos, for the same reason: Vercel rejects a larger
 *  request body itself, before this validation could produce a readable error. */
export const RECEIPT_MAX_BYTES = 4 * 1024 * 1024;

export const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

/** `%PDF-` — the only non-image receipt format accepted. */
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

/**
 * Returns the receipt type implied by the file's leading bytes, or null.
 *
 * A receipt is uploaded by an unauthenticated visitor and later opened by an
 * administrator, so the declared MIME type is worth nothing: the bytes decide
 * what the file is and therefore what `Content-Type` it may be served with.
 */
export function sniffReceiptType(buffer: Uint8Array): string | null {
  const image = sniffImageType(buffer);
  if (image) return image;

  const head = buffer.subarray(0, PDF_SIGNATURE.length);
  if (
    head.length === PDF_SIGNATURE.length &&
    PDF_SIGNATURE.every((b, i) => head[i] === b)
  ) {
    return "application/pdf";
  }

  return null;
}

/** Validates receipt metadata on both sides. Returns a dictionary key or null. */
export function validateReceiptMeta(file: File | null): string | null {
  if (!file || file.size === 0) return null; // A receipt is optional.
  if (
    !ALLOWED_RECEIPT_TYPES.includes(
      file.type as (typeof ALLOWED_RECEIPT_TYPES)[number],
    )
  ) {
    return "receiptType";
  }
  if (file.size > RECEIPT_MAX_BYTES) return "receiptTooLarge";
  return null;
}

export const paymentReferenceSchema = z
  .string()
  .trim()
  .min(4, "referenceInvalid")
  .max(60, "referenceInvalid")
  // Bank references vary widely; allow the printable set they actually use and
  // nothing else, so nothing that could be mistaken for markup is ever stored.
  .regex(/^[A-Za-z0-9/\-_. ]+$/, "referenceInvalid");

export type PaymentFieldErrors = Partial<
  Record<"reference" | "receipt" | "form", string>
>;

/**
 * Validates a payment submission: a reference number, a receipt file, or both.
 *
 * Returns field errors keyed the same way the form renders them; an empty
 * object means the submission is valid.
 */
export function validatePaymentSubmission(input: {
  reference: string;
  receipt: File | null;
}): PaymentFieldErrors {
  const errors: PaymentFieldErrors = {};

  const hasReference = input.reference.trim().length > 0;
  const hasReceipt = Boolean(input.receipt && input.receipt.size > 0);

  if (!hasReference && !hasReceipt) {
    errors.form = "paymentProofRequired";
    return errors;
  }

  if (hasReference) {
    const parsed = paymentReferenceSchema.safeParse(input.reference);
    if (!parsed.success) errors.reference = parsed.error.issues[0]!.message;
  }

  const receiptError = validateReceiptMeta(input.receipt);
  if (receiptError) errors.receipt = receiptError;

  return errors;
}

/* -------------------------------------------------------------------------
 * Admin
 * ---------------------------------------------------------------------- */

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("emailInvalid"),
  password: z.string().min(1, "passwordRequired"),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "passwordRequired"),
    // Long rather than gimmicky: length is the property that actually resists
    // guessing, and complexity rules push people towards Password1!.
    newPassword: z.string().min(12, "passwordTooShort").max(200, "passwordTooLong"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwordMismatch",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "passwordUnchanged",
  });

export const paymentSettingsSchema = z.object({
  paymentMethod: z.string().trim().min(2, "required").max(100, "tooLong"),
  accountName: z.string().trim().min(2, "required").max(120, "tooLong"),
  accountNumber: z.string().trim().min(2, "required").max(60, "tooLong"),
  paymentAddress: z.string().trim().min(2, "required").max(300, "tooLong"),
  amount: z.string().trim().max(60, "tooLong").optional(),
  instructions: z.string().trim().max(1000, "tooLong").optional(),
});

/** Rejection reason an administrator may attach when refusing a registration. */
export const rejectionReasonSchema = z
  .string()
  .trim()
  .max(500, "tooLong")
  .optional();

/**
 * The identification number used to look a registration up.
 *
 * Same rules as registration, so a lookup can never be a different shape from
 * what was stored.
 */
export const identificationLookupSchema = z
  .string()
  .trim()
  .min(4, "identificationIdInvalid")
  .max(30, "identificationIdInvalid")
  .regex(/^[A-Za-z0-9/-]+$/, "identificationIdInvalid");

/** Validates the photo the same way on both sides, minus the byte sniffing. */
export function validatePhotoMeta(file: File | null): string | null {
  if (!file || file.size === 0) return "photoRequired";
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
    return "photoType";
  }
  if (file.size > PHOTO_MAX_BYTES) return "photoTooLarge";
  return null;
}
