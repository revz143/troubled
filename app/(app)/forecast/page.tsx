import Link from "next/link";
import { ForecastChart } from "@/components/ForecastChart";
import { MetricCard } from "@/components/MetricCard";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { parseMoneyToCentavos, formatPeso } from "@/lib/money";

type Props = {
  searchParams: Promise<{ horizon?: string; scenario?: string }>;
};

export default async function ForecastPage({ searchParams }: Props) {
  const params = await searchParams;
  const horizon = params.horizon === "3" || params.horizon === "12" ? Number(params.horizon) : 6;
  const scenario = params.scenario ? parseMoneyToCentavos(params.scenario) : 0;
  const snapshot = await getFinanceSnapshot({ horizonMonths: horizon as 3 | 6 | 12, scenarioMonthlyIncome: scenario });
  const privacy = snapshot.settings.privacyMode;

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:ml-52">
      <section className="paper-panel rounded-lg p-5 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Forecast</p>
        <h1 className="mt-3 font-serif-display text-4xl font-semibold text-moss-deep">Look ahead without flinching.</h1>
        <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" action="/forecast">
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">
            Horizon
            <select className="field" name="horizon" defaultValue={String(horizon)}>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">
            Scenario income per month
            <input className="field" name="scenario" inputMode="decimal" defaultValue={params.scenario ?? ""} placeholder="0.00" />
          </label>
          <button className="btn btn-primary self-end" type="submit">Update</button>
        </form>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Opening cash" value={snapshot.forecast.months[0]?.openingCash ?? 0} privacy={privacy} />
        <MetricCard label="Final projected cash" value={snapshot.forecast.months.at(-1)?.closingCash ?? 0} privacy={privacy} tone="moss" />
        <MetricCard label="Debt-free date" value={snapshot.forecast.debtFreeDate ?? "Not yet"} helper={snapshot.forecast.debtFreeIsEstimate ? "Principal-only estimate" : undefined} />
      </div>

      <ForecastChart months={snapshot.forecast.months} privacy={privacy} />

      {snapshot.forecast.firstShortfall ? (
        <p className="rounded-lg border border-coral/40 bg-coral-soft/60 px-4 py-3 text-sm leading-6 text-moss-deep">
          First projected shortfall: {snapshot.forecast.firstShortfall.monthKey}. Add{" "}
          {formatPeso(snapshot.forecast.firstShortfall.amountNeeded, privacy)} or reduce planned outflows before then.
        </p>
      ) : null}

      <section className="paper-panel rounded-lg p-4">
        <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Month by month</h2>
        <div className="mt-4 grid gap-3">
          {snapshot.forecast.months.map((month) => (
            <article key={month.key} className="rounded-lg border border-line/70 bg-paper-soft/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-moss-deep">{month.label}</h3>
                <p className="font-serif-display text-2xl font-semibold text-moss">{formatPeso(month.closingCash, privacy)}</p>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div><dt className="text-ink-muted">Income</dt><dd className="font-bold">{formatPeso(month.expectedIncome + month.scenarioIncome, privacy)}</dd></div>
                <div><dt className="text-ink-muted">Outflows</dt><dd className="font-bold">{formatPeso(month.scheduledOutflows, privacy)}</dd></div>
                <div><dt className="text-ink-muted">Debt paid</dt><dd className="font-bold">{formatPeso(month.debtPayments, privacy)}</dd></div>
                <div><dt className="text-ink-muted">Unlocked</dt><dd className="font-bold">{formatPeso(month.breathingRoomUnlocked, privacy)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="paper-panel rounded-lg p-4">
        <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Breathing-room milestones</h2>
        <div className="mt-3 grid gap-2">
          {snapshot.forecast.milestoneMessages.length ? snapshot.forecast.milestoneMessages.map((message) => (
            <p key={message} className="rounded-lg bg-sage/30 p-3 text-sm leading-6 text-moss-deep">{message}</p>
          )) : <p className="text-sm text-ink-muted">No endings inside this horizon yet. Try a longer view.</p>}
        </div>
        <p className="mt-4 text-xs leading-5 text-ink-muted">{snapshot.forecast.limitations.join(" ")}</p>
      </section>

      <Link className="btn btn-secondary w-fit" href="/plan">Review the plan</Link>
    </div>
  );
}
