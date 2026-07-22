import "server-only";

import { prisma } from "./prisma";

/**
 * Payment instructions shown to participants.
 *
 * One editable row (`id = 1`). Environment variables provide the initial values
 * so a fresh deployment shows something sensible before an administrator has
 * opened the settings page, but the row — once written — always wins: bank
 * details change more often than deployments do.
 */

export const PAYMENT_SETTINGS_ID = 1;

export type PaymentSettings = {
  paymentMethod: string;
  accountName: string;
  accountNumber: string;
  paymentAddress: string;
  amount: string | null;
  instructions: string | null;
  /**
   * False when nobody has published payment details yet — neither the settings
   * row nor the environment fallback. The UI then says so instead of printing a
   * row of placeholder dashes for someone to pay into.
   */
  configured: boolean;
};

function envDefaults(): Omit<PaymentSettings, "configured"> {
  return {
    paymentMethod: process.env.PAYMENT_METHOD || "Bank transfer",
    accountName: process.env.PAYMENT_ACCOUNT_NAME || "—",
    accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || "—",
    paymentAddress: process.env.PAYMENT_ADDRESS || "—",
    amount: process.env.PAYMENT_AMOUNT || null,
    instructions: process.env.PAYMENT_INSTRUCTIONS || null,
  };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const row = await prisma.paymentSetting.findUnique({
      where: { id: PAYMENT_SETTINGS_ID },
      select: {
        paymentMethod: true,
        accountName: true,
        accountNumber: true,
        paymentAddress: true,
        amount: true,
        instructions: true,
      },
    });

    if (row) return { ...row, configured: true };
  } catch (error) {
    // Payment instructions are informational. A database problem must not take
    // down the page that tells someone their registration succeeded.
    console.error("payment settings lookup failed", error);
  }

  return {
    ...envDefaults(),
    configured: Boolean(
      process.env.PAYMENT_ACCOUNT_NUMBER && process.env.PAYMENT_ACCOUNT_NAME,
    ),
  };
}
