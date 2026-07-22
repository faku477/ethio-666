import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/lib/auth";
import { PAYMENT_SETTINGS_ID } from "@/lib/payment-settings";
import { prisma } from "@/lib/prisma";
import { paymentSettingsSchema } from "@/lib/validation";

export const runtime = "nodejs";

export type SettingsResult =
  | { success: true }
  | { success: false; error?: string; fieldErrors?: Record<string, string> };

/** Updates the payment instructions shown to registrants. */
export async function POST(request: Request) {
  const guard = await requireAdminRequest(request);
  if ("response" in guard) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<SettingsResult>(
      { success: false, error: "serverError" },
      { status: 400 },
    );
  }

  const parsed = paymentSettingsSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      fieldErrors[field] ??= issue.message;
    }
    return NextResponse.json<SettingsResult>(
      { success: false, fieldErrors },
      { status: 422 },
    );
  }

  const data = {
    paymentMethod: parsed.data.paymentMethod,
    accountName: parsed.data.accountName,
    accountNumber: parsed.data.accountNumber,
    paymentAddress: parsed.data.paymentAddress,
    amount: parsed.data.amount || null,
    instructions: parsed.data.instructions || null,
    updatedById: guard.admin.id,
  };

  try {
    await prisma.paymentSetting.upsert({
      where: { id: PAYMENT_SETTINGS_ID },
      create: { id: PAYMENT_SETTINGS_ID, ...data },
      update: data,
    });
  } catch (error) {
    console.error("payment settings update failed", error);
    return NextResponse.json<SettingsResult>(
      { success: false, error: "serverError" },
      { status: 500 },
    );
  }

  // Payment details are rendered on the public success and status pages too.
  revalidatePath("/[lang]", "layout");

  return NextResponse.json<SettingsResult>({ success: true });
}
