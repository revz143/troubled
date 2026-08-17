import { IncomeEntryForm, IncomeSourceForm } from "@/components/forms/ActionForms";
import { MetricCard } from "@/components/MetricCard";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { formatPeso } from "@/lib/money";

export default async function IncomePage() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 3 });
  const privacy = snapshot.settings.privacyMode;
  const currentMonthIncome = snapshot.forecast.months[0]?.expectedIncome ?? 0;

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:ml-52">
      <section className="paper-panel rounded-lg p-5 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Income</p>
        <h1 className="mt-3 font-serif-display text-4xl font-semibold text-moss-deep">Money coming in, counted once.</h1>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Current-month expected" value={currentMonthIncome} privacy={privacy} tone="moss" />
        <MetricCard label="Recurring sources" value={String(snapshot.incomeSources.length)} />
        <MetricCard label="One-off entries" value={String(snapshot.incomeEntries.length)} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="paper-panel rounded-lg p-4">
          <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">One-off income</h2>
          <div className="mt-4"><IncomeEntryForm /></div>
          <div className="mt-5 grid gap-3">
            {snapshot.incomeEntries.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-line/70 bg-paper-soft/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-moss-deep">{entry.note || "Income entry"}</p>
                  <p className="font-bold text-coral">{formatPeso(entry.amount, privacy)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{entry.status} · expected {entry.expectedDate}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="paper-panel rounded-lg p-4">
          <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Recurring income</h2>
          <div className="mt-4"><IncomeSourceForm /></div>
          <div className="mt-5 grid gap-3">
            {snapshot.incomeSources.map((source) => (
              <article key={source.id} className="rounded-lg border border-line/70 bg-paper-soft/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-moss-deep">{source.name}</p>
                  <p className="font-bold text-coral">{formatPeso(source.amount, privacy)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{source.frequency} · next {source.nextExpectedDate}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
