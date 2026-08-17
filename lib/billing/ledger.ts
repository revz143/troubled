import { addMonths, parseDateOnly, toDateString } from "@/lib/dates";
import type { Centavos } from "@/lib/money";
import type { Frequency, ObligationType } from "@/lib/forecast/types";

export type BillingObligationInput = {
  id: string;
  name: string;
  type: ObligationType;
  amount: Centavos;
  startDate: string;
  endDate: string | null;
  dueDay: number;
  frequency: Frequency;
};

export type BillingTransactionInput = {
  id: string;
  amount: Centavos;
  direction: "credit" | "debit";
  occurredDate: string;
  transactionType: string;
  obligationId?: string | null;
};

export type ObligationPaymentStatus = "upcoming" | "paid" | "partial" | "unpaid";

export type ObligationBillingSummary = {
  id: string;
  name: string;
  type: ObligationType;
  scheduledAmount: Centavos;
  latestDueDate: string | null;
  nextDueDate: string | null;
  scheduledThroughToday: Centavos;
  paidThroughToday: Centavos;
  amountDueNow: Centavos;
  amountDueNext: Centavos;
  carryoverAmount: Centavos;
  prepaidAmount: Centavos;
  status: ObligationPaymentStatus;
};

function compareDates(left: string, right: string) {
  return left.localeCompare(right);
}

function clampDueDate(year: number, month: number, dueDay: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  return toDateString(new Date(Date.UTC(year, month, Math.min(dueDay, lastDay), 12)));
}

function increment(date: Date, frequency: Frequency) {
  const next = new Date(date);
  if (frequency === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  if (frequency === "biweekly") next.setUTCDate(next.getUTCDate() + 14);
  if (frequency === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  if (frequency === "quarterly") next.setUTCMonth(next.getUTCMonth() + 3);
  if (frequency === "yearly") next.setUTCFullYear(next.getUTCFullYear() + 1);
  return next;
}

export function obligationOccurrenceDates(
  obligation: BillingObligationInput,
  rangeStart: string,
  rangeEnd: string,
) {
  const dates: string[] = [];
  const start = parseDateOnly(obligation.startDate);
  let cursor =
    obligation.frequency === "monthly" ||
    obligation.frequency === "quarterly" ||
    obligation.frequency === "yearly"
      ? parseDateOnly(clampDueDate(start.getUTCFullYear(), start.getUTCMonth(), obligation.dueDay))
      : start;

  while (compareDates(toDateString(cursor), obligation.startDate) < 0) {
    cursor = increment(cursor, obligation.frequency);
  }

  while (compareDates(toDateString(cursor), rangeStart) < 0) {
    cursor = increment(cursor, obligation.frequency);
  }

  while (compareDates(toDateString(cursor), rangeEnd) <= 0) {
    const current = toDateString(cursor);
    const withinEnd = !obligation.endDate || compareDates(current, obligation.endDate) <= 0;
    if (withinEnd && compareDates(current, obligation.startDate) >= 0) {
      dates.push(current);
    }
    cursor = increment(cursor, obligation.frequency);
  }

  return dates;
}

function nextOccurrenceDate(obligation: BillingObligationInput, today: string) {
  const horizonEnd = toDateString(addMonths(parseDateOnly(today), 36));
  return obligationOccurrenceDates(obligation, today, horizonEnd).find((date) => compareDates(date, today) > 0) ?? null;
}

export function buildObligationBillingSummaries(
  obligations: BillingObligationInput[],
  transactions: BillingTransactionInput[],
  today: string,
): ObligationBillingSummary[] {
  return obligations
    .map((obligation) => {
      const dueDates = obligationOccurrenceDates(obligation, obligation.startDate, today);
      const scheduledThroughToday = dueDates.length * obligation.amount;
      const paidThroughToday = transactions
        .filter((transaction) => transaction.obligationId === obligation.id)
        .filter((transaction) => transaction.direction === "debit")
        .filter((transaction) => compareDates(transaction.occurredDate, today) <= 0)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const amountDueNow = Math.max(0, scheduledThroughToday - paidThroughToday);
      const prepaidAmount = Math.max(0, paidThroughToday - scheduledThroughToday);
      const nextDueDate = nextOccurrenceDate(obligation, today);
      const amountDueNext = nextDueDate ? Math.max(0, amountDueNow + obligation.amount - prepaidAmount) : amountDueNow;
      const latestDueDate = dueDates.at(-1) ?? null;
      const status: ObligationPaymentStatus =
        scheduledThroughToday === 0 && prepaidAmount === 0
          ? "upcoming"
          : amountDueNow === 0
            ? "paid"
            : paidThroughToday > 0
              ? "partial"
              : "unpaid";

      return {
        id: obligation.id,
        name: obligation.name,
        type: obligation.type,
        scheduledAmount: obligation.amount,
        latestDueDate,
        nextDueDate,
        scheduledThroughToday,
        paidThroughToday,
        amountDueNow,
        amountDueNext,
        carryoverAmount: amountDueNow,
        prepaidAmount,
        status,
      };
    })
    .sort((left, right) => {
      if (left.amountDueNow !== right.amountDueNow) return right.amountDueNow - left.amountDueNow;
      return (left.nextDueDate ?? "9999-12-31").localeCompare(right.nextDueDate ?? "9999-12-31");
    });
}
