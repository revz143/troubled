import { z } from "zod";
import { centavosToDecimal, parseMoneyToCentavos } from "@/lib/money";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const moneyString = z
  .string()
  .min(1)
  .transform((value) => centavosToDecimal(parseMoneyToCentavos(value)));

export const obligationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["debt", "credit_card", "bill", "family_support", "budget"]),
  scheduled_amount: moneyString,
  start_date: dateString,
  end_date: dateString.optional().or(z.literal("")).transform((value) => value || null),
  due_day: z.coerce.number().int().min(1).max(31),
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]),
  notes: z.string().trim().max(500).optional().transform((value) => value || null),
  remaining_principal: moneyString.optional().or(z.literal("")).transform((value) => value || null),
});

export const incomeEntrySchema = z.object({
  amount: moneyString,
  expected_date: dateString,
  received_date: dateString.optional().or(z.literal("")).transform((value) => value || null),
  source_note: z.string().trim().max(160).optional().transform((value) => value || null),
  status: z.enum(["expected", "received", "cancelled"]),
});

export const incomeSourceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: moneyString,
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]),
  start_date: dateString,
  end_date: dateString.optional().or(z.literal("")).transform((value) => value || null),
  next_expected_date: dateString,
});

export const accountSchema = z.object({
  name: z.string().trim().min(1).max(120),
  account_type: z.enum(["cash", "bank", "e_wallet"]),
  opening_balance: moneyString,
  balance_as_of: dateString,
});

export const paymentSchema = z.object({
  account_id: z.string().uuid(),
  obligation_id: z.string().uuid(),
  amount: moneyString,
  occurred_date: dateString,
  description: z.string().trim().max(160).optional().transform((value) => value || null),
  idempotency_key: z.string().trim().min(8).max(160).optional(),
});

export const settingsSchema = z.object({
  currency: z.literal("PHP"),
  timezone: z.string().trim().min(1).default("Asia/Manila"),
  reminder_lead_days: z.coerce.number().int().min(0).max(60),
  privacy_mode: z.coerce.boolean().default(false),
});

export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}
