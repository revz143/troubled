"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  accountSchema,
  formDataToObject,
  incomeEntrySchema,
  incomeSourceSchema,
  obligationSchema,
  paymentSchema,
  settingsSchema,
} from "@/lib/schemas";

export type ActionState = {
  ok: boolean;
  message: string;
};

const demoState: ActionState = {
  ok: true,
  message: "Saved in demo mode. Connect Supabase to persist this.",
};

async function currentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You need to sign in again.");
  return { supabase, userId: data.user.id };
}

export async function createObligationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = obligationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please check the obligation details." };
  if (!isSupabaseConfigured()) return demoState;

  const { supabase, userId } = await currentUserId();
  const { remaining_principal, ...obligation } = parsed.data;
  const { data, error } = await supabase
    .from("obligations")
    .insert({ ...obligation, user_id: userId, is_active: true })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  if ((obligation.type === "debt" || obligation.type === "credit_card") && remaining_principal) {
    const debtError = await supabase.from("debt_details").insert({
      obligation_id: data.id,
      original_balance: remaining_principal,
      remaining_principal,
    });
    if (debtError.error) return { ok: false, message: debtError.error.message };
  }

  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/forecast");
  return { ok: true, message: "Obligation added. One less loose thread." };
}

export async function createIncomeEntryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = incomeEntrySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please check the income details." };
  if (!isSupabaseConfigured()) return demoState;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("income_entries").insert({ ...parsed.data, user_id: userId });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/income");
  revalidatePath("/forecast");
  return { ok: true, message: "Income added without double-counting it." };
}

export async function createIncomeSourceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = incomeSourceSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please check the recurring income details." };
  if (!isSupabaseConfigured()) return demoState;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase
    .from("income_sources")
    .insert({ ...parsed.data, user_id: userId, is_active: true });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/income");
  revalidatePath("/forecast");
  return { ok: true, message: "Recurring income added." };
}

export async function createAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = accountSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please check the account details." };
  if (!isSupabaseConfigured()) return demoState;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("accounts").insert({ ...parsed.data, user_id: userId, is_active: true });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true, message: "Account added." };
}

export async function recordPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = paymentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please check the payment details." };
  if (!isSupabaseConfigured()) return demoState;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("transactions").insert({
    ...parsed.data,
    idempotency_key: parsed.data.idempotency_key ?? `manual-${randomUUID()}`,
    user_id: userId,
    direction: "debit",
    transaction_type: "debt_payment",
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/forecast");
  revalidatePath("/plan");
  return { ok: true, message: "Payment recorded once." };
}

export async function updateSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = settingsSchema.safeParse({
    ...formDataToObject(formData),
    privacy_mode: formData.get("privacy_mode") === "on",
  });
  if (!parsed.success) return { ok: false, message: "Please check your settings." };
  if (!isSupabaseConfigured()) return demoState;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase.from("finance_settings").upsert({ ...parsed.data, user_id: userId });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/settings");
  return { ok: true, message: "Settings saved." };
}

export async function updateSettingsFormAction(formData: FormData): Promise<void> {
  await updateSettingsAction({ ok: false, message: "" }, formData);
}
