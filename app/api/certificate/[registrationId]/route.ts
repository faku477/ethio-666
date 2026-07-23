import { readFile } from "node:fs/promises";
import path from "node:path";

import QRCode from "qrcode";

import { renderCertificatePdf, type CertificateData } from "@/lib/certificate";
import { DEFAULT_LOCALE, formatDate, getDictionary, isLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { canDownloadCertificate } from "@/lib/status";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

/** @react-pdf/renderer and the font loader need Node APIs, not the edge runtime. */
export const runtime = "nodejs";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function appUrl(request: Request): string {
  // Falls back to the request origin so certificates still work when the app is
  // reached over a LAN address or a preview URL.
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

function toDataUri(bytes: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

/**
 * Loads the participant photo as a data URI.
 *
 * Photos live either in Vercel Blob (absolute URL) or, in development, on local
 * disk. Returns null on any failure — a missing photo must not stop someone
 * from downloading their certificate.
 */
async function loadPhoto(photoUrl: string): Promise<string | null> {
  try {
    if (photoUrl.startsWith("/api/uploads/")) {
      const relative = photoUrl.replace("/api/uploads/", "");
      const resolved = path.resolve(LOCAL_UPLOAD_DIR, relative);
      const root = path.resolve(LOCAL_UPLOAD_DIR);
      if (!resolved.startsWith(root + path.sep)) return null;

      const mimeType = MIME_BY_EXTENSION[path.extname(resolved).toLowerCase()];
      if (!mimeType) return null;

      return toDataUri(await readFile(resolved), mimeType);
    }

    const response = await fetch(photoUrl);
    if (!response.ok) return null;

    const mimeType = response.headers.get("content-type") ?? "image/jpeg";
    return toDataUri(
      Buffer.from(await response.arrayBuffer()),
      mimeType.split(";")[0]!,
    );
  } catch {
    return null;
  }
}

/**
 * Loads an optional branding asset from `public/`.
 *
 * Returns null when the file is absent so the certificate still renders — the
 * stamp and emblems are decoration, and a missing one must not stop somebody
 * downloading their certificate.
 */
async function loadPublicImage(filename: string): Promise<string | null> {
  try {
    const file = path.join(process.cwd(), "public", filename);
    const mimeType = MIME_BY_EXTENSION[path.extname(file).toLowerCase()];
    if (!mimeType) return null;

    return toDataUri(await readFile(file), mimeType);
  } catch {
    return null;
  }
}

/** Watermark drawn behind the whole certificate. */
const BACKGROUND_IMAGE = "cert-1.jpg";

/** Emblems arranged beside the stamp in the signature block. */
const EMBLEM_IMAGES = ["cert-2.jpg", "cert-4.jpg"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ registrationId: string }> },
) {
  const { registrationId } = await params;

  const requested = new URL(request.url).searchParams.get("lang");
  const locale = requested && isLocale(requested) ? requested : DEFAULT_LOCALE;
  const dict = await getDictionary(locale);

  // Narrow select. `bankAccountNumber` is not listed, so it cannot reach the
  // PDF even if the template were changed to print every field it receives.
  //
  // Guarded: an unreachable database throws here, and an unhandled throw makes
  // the download fail with an opaque platform error page. A 503 with a readable
  // reason is what tells you the database is the problem.
  let registration;
  try {
    registration = await prisma.registration.findUnique({
      where: { registrationId },
      select: {
        fullName: true,
        identificationId: true,
        registrationId: true,
        certificateNumber: true,
        photoUrl: true,
        status: true,
        approvedAt: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("certificate lookup failed", error);
    return new Response("Certificate service unavailable", { status: 503 });
  }

  if (!registration) {
    return new Response("Not found", { status: 404 });
  }

  // THE authorization check for certificates. Hiding the download button is a
  // UI courtesy; this is the control. A registration that has not been approved
  // has no certificate, however the URL is reached.
  if (!canDownloadCertificate(registration.status)) {
    return new Response(dict.status.certificateLocked, {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  }

  // The QR encodes the certificate number, never the registration id — the
  // verification page is public and the certificate number is its only key.
  const verifyUrl = `${appUrl(request)}/verify/${registration.certificateNumber}`;

  const [qrCode, photo, stamp, background, flagLeft, flagRight, ...emblems] =
    await Promise.all([
      QRCode.toDataURL(verifyUrl, { margin: 1, width: 320 }),
      loadPhoto(registration.photoUrl),
      loadPublicImage("stamp.png"),
      loadPublicImage(BACKGROUND_IMAGE),
      loadPublicImage("ethiopain_flag.png"),
      loadPublicImage("usa_flag.png"),
      ...EMBLEM_IMAGES.map(loadPublicImage),
    ]);

  const data: CertificateData = {
    fullName: registration.fullName,
    identificationId: registration.identificationId,
    registrationId: registration.registrationId,
    certificateNumber: registration.certificateNumber,
    registeredOn: formatDate(registration.createdAt, locale),
    // The certificate is issued at approval, not at registration.
    issuedOn: formatDate(registration.approvedAt ?? registration.createdAt, locale),
    qrCode,
    photo,
    stamp,
    background,
    flagLeft,
    flagRight,
    // Whichever files are actually present; a missing one is simply absent.
    emblems: emblems.filter((emblem): emblem is string => emblem !== null),
  };

  const pdf = await renderCertificatePdf(data, dict);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${registration.registrationId}-Certificate.pdf"`,
      "Content-Length": String(pdf.length),
      // Certificates are personal documents; keep them out of shared caches.
      "Cache-Control": "private, no-store",
    },
  });
}
