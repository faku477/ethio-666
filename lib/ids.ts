import type { Prisma } from "./generated/prisma/client";

const SEQUENCE_KEY = "REGISTRATION";
const PAD = 6;

export type AllocatedNumbers = {
  registrationId: string;
  certificateNumber: string;
};

/**
 * Allocates the next registration and certificate numbers for `year`.
 *
 * Must be called with a transaction client. The `upsert` takes a row lock on
 * (prefix, year), so two concurrent registrations serialize here and can never
 * receive the same number — unlike a `SELECT max()+1`, which would race.
 *
 * Both numbers come from a single counter so `REG-2026-000001` and
 * `CERT-2026-000001` always refer to the same registration.
 */
export async function allocateNumbers(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<AllocatedNumbers> {
  const sequence = await tx.numberSequence.upsert({
    where: { prefix_year: { prefix: SEQUENCE_KEY, year } },
    create: { prefix: SEQUENCE_KEY, year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
    select: { lastValue: true },
  });

  const serial = String(sequence.lastValue).padStart(PAD, "0");

  return {
    registrationId: `REG-${year}-${serial}`,
    certificateNumber: `CERT-${year}-${serial}`,
  };
}
