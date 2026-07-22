import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { cookies } from "next/headers";

import "server-only";

import type { AdminUser } from "./generated/prisma/client";
import { prisma } from "./prisma";

/**
 * Administrator authentication.
 *
 * Deliberately server-side sessions rather than a signed token: logging out,
 * disabling an account, or approving a registration must all take effect
 * immediately, and a stateless token cannot be revoked before it expires.
 */

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "admin_session";

/** Sessions are short: an admin dashboard left open on a shared machine is a
 *  standing grant over everybody's personal data. */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

/** Minimum password length, enforced on seeding and on password change. */
export const PASSWORD_MIN_LENGTH = 12;

/**
 * Hashes a password with scrypt.
 *
 * scrypt ships with Node, so there is no native dependency to build on the
 * deployment platform. The parameters and salt are stored alongside the digest
 * so they can be raised later without invalidating existing hashes.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("base64")}$${derived.toString("base64")}`;
}

/**
 * Verifies a password against a stored hash.
 *
 * Comparison is constant-time: a byte-by-byte `===` leaks how much of the
 * digest matched through its timing.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, "base64");
  let derived: Buffer;
  try {
    derived = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  } catch {
    return false;
  }

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

/** Sessions are looked up by the hash of the token, never by the token. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type AdminIdentity = Pick<
  AdminUser,
  "id" | "email" | "name" | "mustChangePassword"
>;

/**
 * Creates a session for `admin` and sets the session cookie.
 *
 * Must be called from a Route Handler or Server Function — cookies cannot be
 * set while a Server Component renders.
 */
export async function createSession(
  adminId: number,
  request?: Request,
): Promise<void> {
  const token = `${randomUUID()}.${randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      adminId,
      expiresAt,
      ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request?.headers.get("user-agent")?.slice(0, 300),
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // `lax` — not `strict` — so returning to the dashboard from an external
    // link keeps you logged in. Cross-site POSTs still carry no cookie under
    // `lax`, which is the CSRF property that matters here; `assertSameOrigin`
    // covers the rest.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Deletes the current session row and clears the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    // The row may already be gone (expired, or logged out in another tab);
    // deleting a missing row must not turn logout into an error.
    await prisma.adminSession
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }

  store.delete(SESSION_COOKIE);
}

/**
 * Resolves the signed-in administrator, or null.
 *
 * Every call hits the database on purpose: that is what makes revocation and
 * account deactivation immediate.
 */
export async function getAdmin(): Promise<AdminIdentity | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let session;
  try {
    session = await prisma.adminSession.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        expiresAt: true,
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            mustChangePassword: true,
            isActive: true,
          },
        },
      },
    });
  } catch (error) {
    // An unreachable database must read as "not signed in", never as an
    // unhandled exception inside a layout.
    console.error("session lookup failed", error);
    return null;
  }

  if (!session || !session.admin.isActive) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
    return null;
  }

  return {
    id: session.admin.id,
    email: session.admin.email,
    name: session.admin.name,
    mustChangePassword: session.admin.mustChangePassword,
  };
}

/**
 * Rejects requests that did not originate from this site.
 *
 * Defence in depth behind the `lax` session cookie: browsers do not attach it
 * to cross-site POSTs, and any request that reaches here with a foreign
 * `Origin` is refused outright. Returns an error response, or null when the
 * request may proceed.
 */
export function assertSameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  // Non-browser clients (curl, server-to-server) send no Origin at all. They
  // also carry no ambient cookie, so there is nothing to forge.
  if (!origin) return null;

  const host = request.headers.get("host");
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    // Malformed Origin — treat as hostile.
  }

  return Response.json(
    { success: false, error: "forbidden" },
    { status: 403 },
  );
}

/**
 * Guard for admin route handlers: same-origin check plus a valid session.
 *
 * Returns either the acting administrator or the response to send back. Callers
 * must check `"response" in result` before continuing.
 */
export async function requireAdminRequest(
  request: Request,
): Promise<{ admin: AdminIdentity } | { response: Response }> {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return { response: crossOrigin };

  const admin = await getAdmin();
  if (!admin) {
    return {
      response: Response.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      ),
    };
  }

  return { admin };
}

/** Removes expired sessions. Cheap enough to run on each successful login. */
export async function pruneExpiredSessions(): Promise<void> {
  await prisma.adminSession
    .deleteMany({ where: { expiresAt: { lte: new Date() } } })
    .catch(() => undefined);
}
