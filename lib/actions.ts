"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import {
  accountSchema,
  accountUpdateSchema,
  formDataToObject,
  idSchema,
  incomeEntrySchema,
  incomeEntryUpdateSchema,
  incomeSourceSchema,
  incomeSourceUpdateSchema,
  obligationSchema,
  obligationUpdateSchema,
  paymentSchema,
  paymentUpdateSchema,
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

function revalidateFinancePaths() {
  revalidatePath("/");
  revalidatePath("/forecast");
  revalidatePath("/income");
  revalidatePath("/plan");
  revalidatePath("/settings");
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

export async function updateObligationAction(formData: FormData): Promise<void> {
  const parsed = obligationUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { id, remaining_principal, ...obligation } = parsed.data;
  const { error } = await supabase
    .from("obligations")
    .update(obligation)
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (obligation.type === "debt" || obligation.type === "credit_card") {
    if (remaining_principal) {
      const { error: debtError } = await supabase.from("debt_details").upsert({
        obligation_id: id,
        original_balance: remaining_principal,
        remaining_principal,
      });
      if (debtError) throw new Error(debtError.message);
    }
  } else {
    await supabase.from("debt_details").delete().eq("obligation_id", id);
  }

  revalidateFinancePaths();
}

export async function archiveObligationAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || formData.get("confirm_archive") !== "on" || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase
    .from("obligations")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
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

export async function updateIncomeEntryAction(formData: FormData): Promise<void> {
  const parsed = incomeEntryUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { id, ...incomeEntry } = parsed.data;
  const { error } = await supabase
    .from("income_entries")
    .update(incomeEntry)
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
}

export async function deleteIncomeEntryAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || formData.get("confirm_delete") !== "on" || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase
    .from("income_entries")
    .delete()
    .eq("user_id", userId)
    .eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
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

export async function updateIncomeSourceAction(formData: FormData): Promise<void> {
  const parsed = incomeSourceUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { id, ...incomeSource } = parsed.data;
  const { error } = await supabase
    .from("income_sources")
    .update(incomeSource)
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
}

export async function archiveIncomeSourceAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || formData.get("confirm_archive") !== "on" || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase
    .from("income_sources")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
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

export async function createAccountFormAction(formData: FormData): Promise<void> {
  await createAccountAction({ ok: false, message: "" }, formData);
}

export async function updateAccountAction(formData: FormData): Promise<void> {
  const parsed = accountUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { id, ...account } = parsed.data;
  const { error } = await supabase
    .from("accounts")
    .update(account)
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
}

export async function archiveAccountAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || formData.get("confirm_archive") !== "on" || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
}

export async function recordPaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = paymentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, message: "Please check the payment details." };
  if (!isSupabaseConfigured()) return demoState;

  const { supabase, userId } = await currentUserId();
  const obligationResult = await supabase
    .from("obligations")
    .select("id")
    .eq("user_id", userId)
    .eq("id", parsed.data.obligation_id)
    .maybeSingle();

  if (obligationResult.error) return { ok: false, message: obligationResult.error.message };
  if (!obligationResult.data) return { ok: false, message: "Choose one of your obligations before recording the payment." };

  const { error } = await supabase.from("transactions").insert({
    ...parsed.data,
    account_id: null,
    idempotency_key: parsed.data.idempotency_key ?? `manual-${randomUUID()}`,
    user_id: userId,
    direction: "debit",
    transaction_type: "obligation_payment",
  });

  if (error) {
    if (error.code === "23505") return { ok: true, message: "That payment was already recorded once." };
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/forecast");
  revalidatePath("/plan");
  return { ok: true, message: "Payment recorded and linked to the obligation." };
}

export async function updatePaymentAction(formData: FormData): Promise<void> {
  const parsed = paymentUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const obligationResult = await supabase
    .from("obligations")
    .select("id")
    .eq("user_id", userId)
    .eq("id", parsed.data.obligation_id)
    .maybeSingle();
  if (!obligationResult.data || obligationResult.error) throw new Error("Choose one of your obligations before updating the payment.");

  const { id, ...payment } = parsed.data;
  const { error } = await supabase
    .from("transactions")
    .update({
      ...payment,
      account_id: null,
      direction: "debit",
      transaction_type: "obligation_payment",
    })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
}

export async function deletePaymentAction(formData: FormData): Promise<void> {
  const parsed = idSchema.safeParse(formDataToObject(formData));
  if (!parsed.success || formData.get("confirm_delete") !== "on" || !isSupabaseConfigured()) return;

  const { supabase, userId } = await currentUserId();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("id", parsed.data.id);
  if (error) throw new Error(error.message);
  revalidateFinancePaths();
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
