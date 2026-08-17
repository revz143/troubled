import { describe, expect, it } from "vitest";
import { centavosToDecimal, parseMoneyToCentavos } from "@/lib/money";

describe("money helpers", () => {
  it("converts peso strings to integer centavos without floating point math", () => {
    expect(parseMoneyToCentavos("1,234.50")).toBe(123450);
    expect(parseMoneyToCentavos("42")).toBe(4200);
    expect(parseMoneyToCentavos("-15.05")).toBe(-1505);
  });

  it("formats centavos back to NUMERIC-compatible decimals", () => {
    expect(centavosToDecimal(123450)).toBe("1234.50");
    expect(centavosToDecimal(-505)).toBe("-5.05");
  });
});
