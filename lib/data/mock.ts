import { buildForecast } from "@/lib/forecast/engine";
import type { ForecastInput } from "@/lib/forecast/types";

export const demoInput: ForecastInput = {
  today: "2026-08-17",
  timezone: "Asia/Manila",
  horizonMonths: 6,
  availableCash: 28_750_00,
  obligations: [
    {
      id: "personal-loan",
      name: "Personal loan",
      type: "debt",
      amount: 4_200_00,
      startDate: "2026-08-01",
      endDate: null,
      dueDay: 20,
      frequency: "monthly",
      remainingPrincipal: 12_600_00,
    },
    {
      id: "internet",
      name: "Internet",
      type: "bill",
      amount: 1_699_00,
      startDate: "2026-08-01",
      endDate: null,
      dueDay: 25,
      frequency: "monthly",
    },
    {
      id: "school-help",
      name: "Family school support",
      type: "family_support",
      amount: 3_000_00,
      startDate: "2026-08-01",
      endDate: "2026-10-15",
      dueDay: 15,
      frequency: "monthly",
    },
  ],
  incomeSources: [
    {
      id: "salary",
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
      id: "freelance",
      amount: 5_500_00,
      expectedDate: "2026-08-24",
      receivedDate: null,
      status: "expected",
      note: "Freelance edit",
    },
  ],
  postedTransactions: [],
};

export function getDemoSnapshot(horizonMonths: 3 | 6 | 12 = 6, scenarioMonthlyIncome = 0) {
  const forecast = buildForecast({ ...demoInput, horizonMonths, scenarioMonthlyIncome });
  return {
    profile: { displayName: "Maya" },
    settings: {
      currency: "PHP",
      timezone: "Asia/Manila",
      reminderLeadDays: 7,
      privacyMode: false,
    },
    accounts: [
      {
        id: "cash",
        name: "Everyday cash",
        accountType: "cash",
        balance: demoInput.availableCash,
      },
    ],
    obligations: demoInput.obligations,
    incomeSources: demoInput.incomeSources,
    incomeEntries: demoInput.incomeEntries,
    availableCash: demoInput.availableCash,
    totalDebt: demoInput.obligations.reduce((sum, item) => sum + (item.remainingPrincipal ?? 0), 0),
    forecast,
    isDemo: true,
  };
}
