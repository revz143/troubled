import type { Centavos } from "@/lib/money";

export type Frequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
export type ObligationType = "debt" | "credit_card" | "bill" | "family_support" | "budget";

export type ForecastObligation = {
  id: string;
  name: string;
  type: ObligationType;
  amount: Centavos;
  startDate: string;
  endDate: string | null;
  dueDay: number;
  frequency: Frequency;
  notes?: string | null;
  carryoverAmount?: Centavos;
  prepaidAmount?: Centavos;
  remainingPrincipal?: Centavos;
  manualPayoffDate?: string | null;
};

export type ForecastIncomeSource = {
  id: string;
  name: string;
  amount: Centavos;
  startDate: string;
  endDate: string | null;
  nextExpectedDate: string;
  frequency: Frequency;
};

export type ForecastIncomeEntry = {
  id: string;
  amount: Centavos;
  expectedDate: string;
  receivedDate: string | null;
  status: "expected" | "received" | "cancelled";
  note: string;
};

export type ForecastTransaction = {
  id: string;
  accountId?: string | null;
  amount: Centavos;
  direction: "credit" | "debit";
  occurredDate: string;
  transactionType: string;
  obligationId?: string | null;
  incomeEntryId?: string | null;
};

export type ForecastInput = {
  today: string;
  timezone: string;
  horizonMonths: 3 | 6 | 12;
  availableCash: Centavos;
  obligations: ForecastObligation[];
  incomeSources: ForecastIncomeSource[];
  incomeEntries: ForecastIncomeEntry[];
  postedTransactions: ForecastTransaction[];
  scenarioMonthlyIncome?: Centavos;
};

export type ForecastMonth = {
  key: string;
  label: string;
  openingCash: Centavos;
  expectedIncome: Centavos;
  receivedIncome: Centavos;
  scenarioIncome: Centavos;
  scheduledOutflows: Centavos;
  debtPayments: Centavos;
  closingCash: Centavos;
  surplusOrShortfall: Centavos;
  remainingDebt: Centavos;
  obligationsEnding: Array<{ id: string; name: string; amount: Centavos; estimated: boolean }>;
  breathingRoomUnlocked: Centavos;
};

export type ForecastResult = {
  months: ForecastMonth[];
  firstShortfall:
    | {
        monthKey: string;
        amountNeeded: Centavos;
      }
    | null;
  debtFreeDate: string | null;
  debtFreeIsEstimate: boolean;
  milestoneMessages: string[];
  limitations: string[];
};
