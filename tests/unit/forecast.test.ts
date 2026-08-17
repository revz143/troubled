import { describe, expect, it } from "vitest";
import { buildForecast } from "@/lib/forecast/engine";
import type { ForecastInput } from "@/lib/forecast/types";

const baseInput: ForecastInput = {
  today: "2026-08-17",
  timezone: "Asia/Manila",
  horizonMonths: 3,
  availableCash: 10_000_00,
  obligations: [],
  incomeSources: [],
  incomeEntries: [],
  postedTransactions: [],
};

describe("buildForecast", () => {
  it("includes obligations only between start and end dates inclusively", () => {
    const result = buildForecast({
      ...baseInput,
      obligations: [
        {
          id: "rent",
          name: "Apartment",
          type: "bill",
          amount: 5_000_00,
          startDate: "2026-08-01",
          endDate: "2026-09-15",
          dueDay: 15,
          frequency: "monthly",
        },
      ],
    });

    expect(result.months.map((month) => month.scheduledOutflows)).toEqual([0, 5_000_00, 0]);
  });

  it("includes expected current-month income only when it has not happened yet", () => {
    const result = buildForecast({
      ...baseInput,
      incomeEntries: [
        { id: "past", amount: 3_000_00, expectedDate: "2026-08-10", receivedDate: null, status: "expected", note: "late" },
        { id: "future", amount: 4_000_00, expectedDate: "2026-08-25", receivedDate: null, status: "expected", note: "gig" },
      ],
    });

    expect(result.months[0]?.expectedIncome).toBe(4_000_00);
  });

  it("does not count received income again as expected income", () => {
    const result = buildForecast({
      ...baseInput,
      incomeEntries: [
        { id: "received", amount: 4_000_00, expectedDate: "2026-08-25", receivedDate: "2026-08-18", status: "received", note: "gig" },
      ],
    });

    expect(result.months[0]?.expectedIncome).toBe(0);
    expect(result.months[0]?.receivedIncome).toBe(4_000_00);
    expect(result.months[0]?.closingCash).toBe(10_000_00);
  });

  it("caps the final debt payment at remaining principal and unlocks breathing room", () => {
    const result = buildForecast({
      ...baseInput,
      obligations: [
        {
          id: "loan",
          name: "Personal loan",
          type: "debt",
          amount: 4_200_00,
          startDate: "2026-08-01",
          endDate: null,
          dueDay: 20,
          frequency: "monthly",
          remainingPrincipal: 5_000_00,
        },
      ],
    });

    expect(result.months[0]?.debtPayments).toBe(4_200_00);
    expect(result.months[1]?.debtPayments).toBe(800_00);
    expect(result.months[2]?.debtPayments).toBe(0);
    expect(result.months[1]?.breathingRoomUnlocked).toBe(4_200_00);
    expect(result.milestoneMessages[0]).toContain("Personal loan");
  });

  it("reports the first projected negative-cash month", () => {
    const result = buildForecast({
      ...baseInput,
      availableCash: 2_000_00,
      obligations: [
        {
          id: "support",
          name: "Family support",
          type: "family_support",
          amount: 3_000_00,
          startDate: "2026-08-01",
          endDate: null,
          dueDay: 18,
          frequency: "monthly",
        },
      ],
    });

    expect(result.firstShortfall).toEqual({ monthKey: "2026-08", amountNeeded: 1_000_00 });
  });

  it("adds unpaid carryover to the next obligation occurrence once", () => {
    const result = buildForecast({
      ...baseInput,
      today: "2026-08-17",
      obligations: [
        {
          id: "internet",
          name: "Internet",
          type: "bill",
          amount: 1_000_00,
          carryoverAmount: 600_00,
          startDate: "2026-08-01",
          endDate: null,
          dueDay: 25,
          frequency: "monthly",
        },
      ],
    });

    expect(result.months[0]?.scheduledOutflows).toBe(1_600_00);
    expect(result.months[1]?.scheduledOutflows).toBe(1_000_00);
  });

  it("uses prepaid payments to avoid forecasting the same bill twice", () => {
    const result = buildForecast({
      ...baseInput,
      today: "2026-08-17",
      obligations: [
        {
          id: "internet",
          name: "Internet",
          type: "bill",
          amount: 1_000_00,
          prepaidAmount: 1_000_00,
          startDate: "2026-08-01",
          endDate: null,
          dueDay: 25,
          frequency: "monthly",
        },
      ],
    });

    expect(result.months[0]?.scheduledOutflows).toBe(0);
    expect(result.months[1]?.scheduledOutflows).toBe(1_000_00);
  });

  it("applies scenario income without changing stored income inputs", () => {
    const result = buildForecast({ ...baseInput, scenarioMonthlyIncome: 2_000_00 });
    expect(result.months.map((month) => month.scenarioIncome)).toEqual([2_000_00, 2_000_00, 2_000_00]);
    expect(result.months[0]?.closingCash).toBe(12_000_00);
  });
});
