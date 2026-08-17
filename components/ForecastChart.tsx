"use client";

import { formatPeso } from "@/lib/money";
import type { ForecastMonth } from "@/lib/forecast/types";

export function ForecastChart({ months, privacy }: { months: ForecastMonth[]; privacy: boolean }) {
  const values = months.map((month) => month.closingCash);
  const max = Math.max(...values.map(Math.abs), 1);

  return (
    <div className="paper-panel rounded-lg p-4" aria-label="Monthly closing balance chart">
      <div className="flex h-48 items-end gap-3">
        {months.map((month) => {
          const height = Math.max(10, Math.round((Math.abs(month.closingCash) / max) * 100));
          const positive = month.closingCash >= 0;
          return (
            <div key={month.key} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-md ${positive ? "bg-moss" : "bg-coral"}`}
                style={{ height: `${height}%` }}
                title={`${month.label}: ${formatPeso(month.closingCash, privacy)}`}
              />
              <span className="text-[0.68rem] font-bold text-ink-muted">{month.key.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
