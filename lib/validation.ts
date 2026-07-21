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

/** Validates the photo the same way on both sides, minus the byte sniffing. */
export function validatePhotoMeta(file: File | null): string | null {
  if (!file || file.size === 0) return "photoRequired";
  if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
    return "photoType";
  }
  if (file.size > PHOTO_MAX_BYTES) return "photoTooLarge";
  return null;
}
