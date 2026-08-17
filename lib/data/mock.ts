import { buildForecast } from "@/lib/forecast/engine";
import { buildObligationBillingSummaries } from "@/lib/billing/ledger";
import type { ForecastInput } from "@/lib/forecast/types";

export const demoInput: ForecastInput = {
  today: "2026-08-17",
  timezone: "Asia/Manila",
  horizonMonths: 6,
  availableCash: 27_750_00,
  obligations: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Personal loan",
      type: "debt",
      amount: 4_200_00,
      startDate: "2026-08-01",
      endDate: null,
      dueDay: 20,
      frequency: "monthly",
      notes: "Principal-only estimate for now.",
      remainingPrincipal: 12_600_00,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Internet",
      type: "bill",
      amount: 1_699_00,
      startDate: "2026-08-01",
      endDate: null,
      dueDay: 25,
      frequency: "monthly",
      notes: "Fiber plan.",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Family school support",
      type: "family_support",
      amount: 3_000_00,
      startDate: "2026-08-01",
      endDate: "2026-10-15",
      dueDay: 15,
      frequency: "monthly",
      notes: "Temporary school help.",
    },
  ],
  incomeSources: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      name: "Salary",
      amount: 32_000_00,
      startDate: "2026-08-01",
      endDate: null,
      nextExpectedDate: "2026-08-30",
      frequency: "monthly",
    },
  ],
  incomeEntries: [
    {
      id: "55555555-5555-4555-8555-555555555555",
      amount: 5_500_00,
      expectedDate: "2026-08-24",
      receivedDate: null,
      status: "expected",
      note: "Freelance edit",
    },
  ],
  postedTransactions: [
    {
        id: "66666666-6666-4666-8666-666666666666",
      accountId: "77777777-7777-4777-8777-777777777777",
      amount: 1_000_00,
      direction: "debit",
      occurredDate: "2026-08-16",
      transactionType: "obligation_payment",
      obligationId: "33333333-3333-4333-8333-333333333333",
      incomeEntryId: null,
    },
  ],
};

export function getDemoSnapshot(horizonMonths: 3 | 6 | 12 = 6, scenarioMonthlyIncome = 0) {
  const obligationBilling = buildObligationBillingSummaries(demoInput.obligations, demoInput.postedTransactions, demoInput.today);
  const carryoverByObligation = new Map(obligationBilling.map((item) => [item.id, item.carryoverAmount]));
  const prepaidByObligation = new Map(obligationBilling.map((item) => [item.id, item.prepaidAmount]));
  const obligations = demoInput.obligations.map((item) => ({
    ...item,
    carryoverAmount: carryoverByObligation.get(item.id) ?? 0,
    prepaidAmount: prepaidByObligation.get(item.id) ?? 0,
  }));
  const forecast = buildForecast({ ...demoInput, obligations, horizonMonths, scenarioMonthlyIncome });
  return {
    profile: { displayName: "Maya" },
    settings: {
      currency: "PHP",
      timezone: "Asia/Manila",
      reminderLeadDays: 7,
      privacyMode: false,
    },
    today: demoInput.today,
    accounts: [
      {
        id: "77777777-7777-4777-8777-777777777777",
        name: "Everyday cash",
        accountType: "cash",
        openingBalance: demoInput.availableCash,
        balance: demoInput.availableCash,
        balanceAsOf: demoInput.today,
        isActive: true,
      },
    ],
    obligations,
    obligationBilling,
    paymentTransactions: [
      {
        id: "66666666-6666-4666-8666-666666666666",
        accountId: "77777777-7777-4777-8777-777777777777",
        obligationId: "33333333-3333-4333-8333-333333333333",
        amount: 1_000_00,
        occurredDate: "2026-08-16",
        description: "Partial support payment",
      },
    ],
    incomeSources: demoInput.incomeSources,
    incomeEntries: demoInput.incomeEntries,
    availableCash: demoInput.availableCash,
    totalDebt: demoInput.obligations.reduce((sum, item) => sum + (item.remainingPrincipal ?? 0), 0),
    forecast,
    isDemo: true,
  };
}
