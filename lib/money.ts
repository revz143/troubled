export type Centavos = number;

const moneyPattern = /^-?\d+(\.\d{1,2})?$/;

export function parseMoneyToCentavos(value: string | number): Centavos {
  const text = String(value).replace(/,/g, "").trim();
  if (!moneyPattern.test(text)) {
    throw new Error(`Invalid money value: ${value}`);
  }

  const negative = text.startsWith("-");
  const normalized = negative ? text.slice(1) : text;
  const [pesos, cents = ""] = normalized.split(".");
  const centavos = Number.parseInt(pesos, 10) * 100 + Number.parseInt(cents.padEnd(2, "0"), 10);
  return negative ? -centavos : centavos;
}

export function centavosToDecimal(value: Centavos): string {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  const pesos = Math.trunc(absolute / 100);
  const cents = String(absolute % 100).padStart(2, "0");
  return `${sign}${pesos}.${cents}`;
}

export function formatPeso(value: Centavos, privacy = false) {
  if (privacy) return "₱••••";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value / 100);
}
