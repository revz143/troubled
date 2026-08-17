import { describe, expect, it } from "vitest";
import { buildObligationBillingSummaries } from "@/lib/billing/ledger";

const obligation = {
  id: "bill",
  name: "Internet",
  type: "bill" as const,
  amount: 1_000_00,
  startDate: "2026-08-01",
  endDate: null,
  dueDay: 10,
  frequency: "monthly" as const,
};

describe("buildObligationBillingSummaries", () => {
  it("carries a fully unpaid bill into the next billing", () => {
    const [summary] = buildObligationBillingSummaries([obligation], [], "2026-08-15");

    expect(summary?.amountDueNow).toBe(1_000_00);
    expect(summary?.amountDueNext).toBe(2_000_00);
    expect(summary?.status).toBe("unpaid");
    expect(summary?.nextDueDate).toBe("2026-09-10");
  });

  it("carries only the unpaid remainder after a partial payment", () => {
    const [summary] = buildObligationBillingSummaries(
      [obligation],
      [
        {
          id: "payment",
          amount: 400_00,
          direction: "debit",
          occurredDate: "2026-08-12",
          transactionType: "obligation_payment",
          obligationId: "bill",
        },
      ],
      "2026-08-15",
    );

    expect(summary?.paidThroughToday).toBe(400_00);
    expect(summary?.amountDueNow).toBe(600_00);
    expect(summary?.amountDueNext).toBe(1_600_00);
    expect(summary?.status).toBe("partial");
  });

  it("marks an obligation as paid when linked payments cover due occurrences", () => {
    const [summary] = buildObligationBillingSummaries(
      [obligation],
      [
        {
          id: "payment",
          amount: 1_000_00,
          direction: "debit",
          occurredDate: "2026-08-10",
          transactionType: "obligation_payment",
          obligationId: "bill",
        },
      ],
      "2026-08-15",
    );

    expect(summary?.amountDueNow).toBe(0);
    expect(summary?.amountDueNext).toBe(1_000_00);
    expect(summary?.status).toBe("paid");
  });

  it("treats payments before the first due date as prepaid instead of due again", () => {
    const [summary] = buildObligationBillingSummaries(
      [obligation],
      [
        {
          id: "early-payment",
          amount: 1_000_00,
          direction: "debit",
          occurredDate: "2026-08-05",
          transactionType: "obligation_payment",
          obligationId: "bill",
        },
      ],
      "2026-08-08",
    );

    expect(summary?.prepaidAmount).toBe(1_000_00);
    expect(summary?.amountDueNow).toBe(0);
    expect(summary?.amountDueNext).toBe(0);
    expect(summary?.status).toBe("paid");
  });
});
