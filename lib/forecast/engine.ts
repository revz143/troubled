import { addMonths, endOfMonth, monthKey, parseDateOnly, toDateString } from "@/lib/dates";
import { formatPeso, type Centavos } from "@/lib/money";
import type {
  ForecastIncomeEntry,
  ForecastIncomeSource,
  ForecastInput,
  ForecastMonth,
  ForecastObligation,
  ForecastResult,
  Frequency,
} from "@/lib/forecast/types";

function labelForMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1, 12)),
  );
}

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

function occurrenceDates(
  item: { startDate: string; endDate: string | null; frequency: Frequency; dueDay?: number; nextExpectedDate?: string },
  horizonStart: string,
  horizonEnd: string,
) {
  const dates: string[] = [];
  const seed = item.nextExpectedDate ?? item.startDate;
  let cursor =
    item.frequency === "monthly" || item.frequency === "quarterly" || item.frequency === "yearly"
      ? parseDateOnly(clampDueDate(parseDateOnly(seed).getUTCFullYear(), parseDateOnly(seed).getUTCMonth(), item.dueDay ?? parseDateOnly(seed).getUTCDate()))
      : parseDateOnly(seed);

  while (compareDates(toDateString(cursor), item.startDate) < 0) {
    cursor = increment(cursor, item.frequency);
  }

  while (compareDates(toDateString(cursor), horizonStart) < 0) {
    cursor = increment(cursor, item.frequency);
  }

  while (compareDates(toDateString(cursor), horizonEnd) <= 0) {
    const current = toDateString(cursor);
    const withinEnd = !item.endDate || compareDates(current, item.endDate) <= 0;
    if (withinEnd && compareDates(current, item.startDate) >= 0) {
      dates.push(current);
    }
    cursor = increment(cursor, item.frequency);
  }

  return dates;
}

function isInMonth(date: string, key: string) {
  return date.startsWith(key);
}

function expectedIrregularIncome(entries: ForecastIncomeEntry[], month: string, today: string) {
  return entries
    .filter((entry) => entry.status === "expected")
    .filter((entry) => isInMonth(entry.expectedDate, month))
    .filter((entry) => month !== monthKey(parseDateOnly(today)) || compareDates(entry.expectedDate, today) >= 0)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function receivedIncome(entries: ForecastIncomeEntry[], month: string) {
  return entries
    .filter((entry) => entry.status === "received" && entry.receivedDate && isInMonth(entry.receivedDate, month))
    .reduce((sum, entry) => sum + entry.amount, 0);
}

function scheduledIncome(source: ForecastIncomeSource, month: string, horizonStart: string, horizonEnd: string) {
  return occurrenceDates(source, horizonStart, horizonEnd)
    .filter((date) => isInMonth(date, month))
    .reduce((sum) => sum + source.amount, 0);
}

function debtBalance(obligations: ForecastObligation[]) {
  return obligations.reduce((sum, obligation) => sum + (obligation.remainingPrincipal ?? 0), 0);
}

export function buildForecast(input: ForecastInput): ForecastResult {
  const start = parseDateOnly(input.today);
  const principalByDebt = new Map<string, Centavos>();
  const prepaidByObligation = new Map<string, Centavos>();
  const carryoverApplied = new Set<string>();
  const months: ForecastMonth[] = [];
  const milestoneMessages: string[] = [];
  const limitations = ["Debt payoff dates are principal-only estimates. APR is stored but full amortization is not included in this milestone."];

  input.obligations.forEach((obligation) => {
    if (obligation.remainingPrincipal !== undefined) {
      principalByDebt.set(obligation.id, obligation.remainingPrincipal);
    }
    if (obligation.prepaidAmount) {
      prepaidByObligation.set(obligation.id, obligation.prepaidAmount);
    }
  });

  let openingCash = input.availableCash;
  let firstShortfall: ForecastResult["firstShortfall"] = null;
  let debtFreeDate: string | null = null;
  let debtFreeIsEstimate = false;

  for (let index = 0; index < input.horizonMonths; index += 1) {
    const monthDate = addMonths(start, index);
    const key = monthKey(monthDate);
    const monthStart = `${key}-01`;
    const monthEnd = toDateString(endOfMonth(monthDate));
    const monthForecastStart = index === 0 ? input.today : monthStart;
    const scenarioIncome = input.scenarioMonthlyIncome ?? 0;
    const recurringIncome = input.incomeSources.reduce(
      (sum, source) => sum + scheduledIncome(source, key, monthForecastStart, monthEnd),
      0,
    );
    const irregularIncome = expectedIrregularIncome(input.incomeEntries, key, input.today);
    const received = receivedIncome(input.incomeEntries, key);
    const expectedIncome = recurringIncome + irregularIncome;
    const obligationsEnding: ForecastMonth["obligationsEnding"] = [];
    let scheduledOutflows = 0;
    let monthlyDebtPayments = 0;

    for (const obligation of input.obligations) {
      const dates = occurrenceDates(obligation, monthForecastStart, monthEnd);
      for (const date of dates) {
        if (!isInMonth(date, key)) continue;
        const isDebt = obligation.type === "debt" || obligation.type === "credit_card";
        const carryover = carryoverApplied.has(obligation.id) ? 0 : obligation.carryoverAmount ?? 0;
        const grossOccurrenceAmount = obligation.amount + carryover;
        const prepaid = prepaidByObligation.get(obligation.id) ?? 0;
        const occurrenceAmount = Math.max(0, grossOccurrenceAmount - prepaid);
        if (prepaid > 0) {
          prepaidByObligation.set(obligation.id, Math.max(0, prepaid - grossOccurrenceAmount));
        }
        if (carryover > 0) carryoverApplied.add(obligation.id);

        if (isDebt) {
          const remaining = principalByDebt.get(obligation.id) ?? 0;
          if (remaining <= 0) continue;
          const payment = Math.min(occurrenceAmount, remaining);
          principalByDebt.set(obligation.id, remaining - payment);
          monthlyDebtPayments += payment;

          if (remaining - payment <= 0) {
            debtFreeDate = date;
            debtFreeIsEstimate = !obligation.manualPayoffDate;
            obligationsEnding.push({ id: obligation.id, name: obligation.name, amount: obligation.amount, estimated: true });
          }
        } else {
          scheduledOutflows += occurrenceAmount;
          if (obligation.endDate && isInMonth(obligation.endDate, key)) {
            obligationsEnding.push({ id: obligation.id, name: obligation.name, amount: obligation.amount, estimated: false });
          }
        }
      }
    }

    const breathingRoomUnlocked = obligationsEnding.reduce((sum, ending) => sum + ending.amount, 0);
    const closingCash = openingCash + expectedIncome + scenarioIncome - scheduledOutflows - monthlyDebtPayments;
    const remainingDebt = Array.from(principalByDebt.values()).reduce((sum, value) => sum + value, 0);

    if (!firstShortfall && closingCash < 0) {
      firstShortfall = { monthKey: key, amountNeeded: Math.abs(closingCash) };
    }

    obligationsEnding.forEach((ending) => {
      const prefix = ending.estimated ? "After the estimated payoff for" : "After";
      milestoneMessages.push(
        `${prefix} ${ending.name} ends in ${labelForMonth(key)}, ${formatPeso(ending.amount)}/month becomes available.`,
      );
    });

    months.push({
      key,
      label: labelForMonth(key),
      openingCash,
      expectedIncome,
      receivedIncome: received,
      scenarioIncome,
      scheduledOutflows,
      debtPayments: monthlyDebtPayments,
      closingCash,
      surplusOrShortfall: closingCash,
      remainingDebt,
      obligationsEnding,
      breathingRoomUnlocked,
    });

    openingCash = closingCash;
  }

  if (debtBalance(input.obligations) > 0 && months.at(-1)?.remainingDebt === 0) {
    debtFreeIsEstimate = true;
  }

  return {
    months,
    firstShortfall,
    debtFreeDate,
    debtFreeIsEstimate,
    milestoneMessages,
    limitations,
  };
}
