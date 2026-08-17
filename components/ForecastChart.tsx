"use client";

import { formatPeso } from "@/lib/money";
import type { ForecastMonth } from "@/lib/forecast/types";

export function ForecastChart({ months, privacy }: { months: ForecastMonth[]; privacy: boolean }) {
  const values = months.map((month) => month.closingCash);
  const max = Math.max(...values.map(Math.abs), 1);

  return (
    <div className="paper-panel px-1 py-6 sm:px-3" aria-label="Monthly closing balance chart">
      <div className="relative flex h-56 items-end gap-3 border-b border-[color:var(--chart-baseline)]">
        <div className="absolute inset-x-0 top-10 border-t border-dashed border-[color:var(--chart-goal)]" aria-hidden />
        {months.map((month) => {
          const height = Math.max(10, Math.round((Math.abs(month.closingCash) / max) * 100));
          const positive = month.closingCash >= 0;
          return (
            <div key={month.key} className="relative flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div
                className="w-full max-w-8 rounded-[2px]"
                style={{ height: `${height}%`, background: positive ? "var(--chart-bar)" : "var(--chart-bar-neg)" }}
                title={`${month.label}: ${formatPeso(month.closingCash, privacy)}`}
              />
              <span className={`font-mono-ledger text-[11px] ${positive ? "text-ink-muted" : "text-coral"}`}>{month.key.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
