import { z } from "zod";
import { centavosToDecimal, parseMoneyToCentavos } from "@/lib/money";

const looseBackupSchema = z.record(z.string(), z.unknown());

type ImportWarning = {
  path: string;
  message: string;
};

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function date(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function money(value: unknown) {
  try {
    if (typeof value === "number" || typeof value === "string") return centavosToDecimal(parseMoneyToCentavos(value));
  } catch {
    return "0.00";
  }
  return "0.00";
}

export function normalizeHingaBackup(raw: unknown) {
  const parsed = looseBackupSchema.safeParse(raw);
  const warnings: ImportWarning[] = [];
  const obligations: Array<Record<string, unknown>> = [];
  const incomeEntries: Array<Record<string, unknown>> = [];

  if (!parsed.success) {
    return { obligations, incomeEntries, warnings: [{ path: "$", message: "Backup was not a JSON object." }] };
  }

  const source = parsed.data;
  const rawObligations = [
    ...asArray(source.obligations),
    ...asArray(source.debts),
    ...asArray(source.bills),
  ];

  rawObligations.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const object = item as Record<string, unknown>;
    const name = text(object.name ?? object.title, `Imported item ${index + 1}`);
    const startDate = date(object.startDate ?? object.start_date);
    const endDate = date(object.endDate ?? object.end_date);

    if (!startDate) warnings.push({ path: `obligations[${index}].start_date`, message: `${name} needs a start date.` });
    if (!endDate) warnings.push({ path: `obligations[${index}].end_date`, message: `${name} has no end date; imported as ongoing.` });

    obligations.push({
      name,
      type: text(object.type, "bill").replace("-", "_"),
      scheduled_amount: money(object.amount ?? object.monthlyAmount ?? object.monthly_amount),
      start_date: startDate || new Date().toISOString().slice(0, 10),
      end_date: endDate || null,
      due_day: Number(object.dueDay ?? object.due_day ?? 25),
      frequency: text(object.frequency, "monthly"),
      notes: text(object.notes),
      remaining_principal: money(object.remainingPrincipal ?? object.remaining_principal ?? object.balance),
    });
  });

  const rawIncome = [...asArray(source.incomeEntries), ...asArray(source.income), ...asArray(source.incomes)];
  rawIncome.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const object = item as Record<string, unknown>;
    const expectedDate = date(object.expectedDate ?? object.date ?? object.expected_date);
    if (!expectedDate) warnings.push({ path: `incomeEntries[${index}].expected_date`, message: "Income entry needs an expected date." });
    incomeEntries.push({
      amount: money(object.amount),
      expected_date: expectedDate || new Date().toISOString().slice(0, 10),
      received_date: date(object.receivedDate ?? object.received_date) || null,
      source_note: text(object.source ?? object.note ?? object.name),
      status: text(object.status, "expected"),
    });
  });

  return { obligations, incomeEntries, warnings };
}
