#!/usr/bin/env node
/**
 * Creates (or resets) an administrator account.
 *
 *   npm run admin:create
 *   npm run admin:create -- --reset-password
 *
 * Reads credentials from the environment so nothing sensitive is ever written
 * into the repository:
 *
 *   ADMIN_EMAIL     default: admin@example.com
 *   ADMIN_PASSWORD  default: Admin@123456   (the documented first-run password)
 *   ADMIN_NAME      default: Administrator
 *
 * The account is always created with `mustChangePassword = true`: the default
 * password is published in the README, so it is a bootstrap credential, not a
 * usable one. The dashboard nags until it has been replaced.
 *
 * Plain `pg` rather than Prisma Client on purpose — this runs under bare Node,
 * outside the Next.js/TypeScript build, so it must not depend on the generated
 * TypeScript client.
 */

import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import pg from "pg";

const scrypt = promisify(scryptCallback);

const DEFAULT_EMAIL = "admin@example.com";
const DEFAULT_PASSWORD = "Admin@123456";
const MIN_PASSWORD_LENGTH = 12;

/** Must match `hashPassword` in lib/auth.ts. */
async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${derived.toString("base64")}`;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "DATABASE_URL is not set. Run with `node --env-file=.env scripts/create-admin.mjs`, " +
        "or export it first.",
    );
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL || DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const name = process.env.ADMIN_NAME || "Administrator";
  const resetPassword = process.argv.includes("--reset-password");

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const existing = await client.query(
      'SELECT id FROM "AdminUser" WHERE email = $1',
      [email],
    );

    const passwordHash = await hashPassword(password);
    const now = new Date();

    if (existing.rowCount > 0) {
      if (!resetPassword) {
        console.log(
          `Administrator ${email} already exists. ` +
            "Re-run with --reset-password to set a new password.",
        );
        return;
      }

      await client.query(
        'UPDATE "AdminUser" SET "passwordHash" = $1, "mustChangePassword" = true, ' +
          '"isActive" = true, "updatedAt" = $2 WHERE email = $3',
        [passwordHash, now, email],
      );
      console.log(`Password reset for ${email}.`);
    } else {
      await client.query(
        'INSERT INTO "AdminUser" (email, name, "passwordHash", "mustChangePassword", ' +
          '"isActive", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, true, $4, $4)',
        [email, name, passwordHash, now],
      );
      console.log(`Administrator ${email} created.`);
    }

    if (password === DEFAULT_PASSWORD) {
      console.log(
        "\n⚠  This account uses the documented default password. " +
          "Change it immediately after the first login.",
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
