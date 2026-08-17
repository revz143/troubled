import { IncomeEntryForm, IncomeSourceForm } from "@/components/forms/ActionForms";
import { MetricCard } from "@/components/MetricCard";
import {
  archiveIncomeSourceAction,
  deleteIncomeEntryAction,
  updateIncomeEntryAction,
  updateIncomeSourceAction,
} from "@/lib/actions";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { centavosToDecimal, formatPeso } from "@/lib/money";

export default async function IncomePage() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 3 });
  const privacy = snapshot.settings.privacyMode;
  const currentMonthIncome = snapshot.forecast.months[0]?.expectedIncome ?? 0;

  return (
    <div className="mx-auto grid max-w-4xl gap-7 lg:ml-52">
      <section className="paper-panel px-1 py-7 sm:px-3">
        <p className="mono-label">Income</p>
        <h1 className="mt-3 font-serif-display text-[40px] font-light text-moss-deep">Money coming in, counted once.</h1>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Current-month expected" value={currentMonthIncome} privacy={privacy} tone="moss" />
        <MetricCard label="Recurring sources" value={String(snapshot.incomeSources.length)} />
        <MetricCard label="One-off entries" value={String(snapshot.incomeEntries.length)} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="paper-panel px-1 py-5 sm:px-3">
          <h2 className="font-serif-display text-[28px] font-light text-moss-deep">One-off income</h2>
          <div className="mt-4"><IncomeEntryForm /></div>
          <div className="mt-5">
            {snapshot.incomeEntries.map((entry) => (
              <article key={entry.id} className="rule-row py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-moss-deep">{entry.note || "Income entry"}</p>
                  <p className="font-serif-display text-[21px] text-ink">{formatPeso(entry.amount, privacy)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{entry.status} · expected {entry.expectedDate}</p>
                <details className="mt-3 rounded-lg border border-line/70 bg-paper/70 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-moss-deep">Edit income entry</summary>
                  <form action={updateIncomeEntryAction} className="mt-3 grid gap-3">
                    <input name="id" type="hidden" value={entry.id} />
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Amount<input className="field" name="amount" inputMode="decimal" defaultValue={centavosToDecimal(entry.amount)} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Expected date<input className="field" name="expected_date" type="date" defaultValue={entry.expectedDate} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Status
                      <select className="field" name="status" defaultValue={entry.status}>
                        <option value="expected">Expected</option>
                        <option value="received">Received</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Received date<input className="field" name="received_date" type="date" defaultValue={entry.receivedDate ?? ""} /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Source or note<input className="field" name="source_note" defaultValue={entry.note} /></label>
                    <button className="btn btn-primary" type="submit">Save income entry</button>
                  </form>
                  <form action={deleteIncomeEntryAction} className="mt-3 grid gap-2 rounded-lg bg-coral-soft/50 p-3">
                    <input name="id" type="hidden" value={entry.id} />
                    <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
                      <input name="confirm_delete" type="checkbox" required />
                      Delete this one-off income entry.
                    </label>
                    <button className="btn btn-coral" type="submit">Delete entry</button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </div>

        <div className="paper-panel px-1 py-5 sm:px-3">
          <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Recurring income</h2>
          <div className="mt-4"><IncomeSourceForm /></div>
          <div className="mt-5">
            {snapshot.incomeSources.map((source) => (
              <article key={source.id} className="rule-row py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-moss-deep">{source.name}</p>
                  <p className="font-serif-display text-[21px] text-ink">{formatPeso(source.amount, privacy)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{source.frequency} · next {source.nextExpectedDate}</p>
                <details className="mt-3 rounded-lg border border-line/70 bg-paper/70 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-moss-deep">Edit recurring source</summary>
                  <form action={updateIncomeSourceAction} className="mt-3 grid gap-3">
                    <input name="id" type="hidden" value={source.id} />
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Name<input className="field" name="name" defaultValue={source.name} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Amount<input className="field" name="amount" inputMode="decimal" defaultValue={centavosToDecimal(source.amount)} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Frequency
                      <select className="field" name="frequency" defaultValue={source.frequency}>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Start date<input className="field" name="start_date" type="date" defaultValue={source.startDate} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">End date<input className="field" name="end_date" type="date" defaultValue={source.endDate ?? ""} /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Next expected<input className="field" name="next_expected_date" type="date" defaultValue={source.nextExpectedDate} required /></label>
                    <button className="btn btn-primary" type="submit">Save recurring source</button>
                  </form>
                  <form action={archiveIncomeSourceAction} className="mt-3 grid gap-2 rounded-lg bg-coral-soft/50 p-3">
                    <input name="id" type="hidden" value={source.id} />
                    <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
                      <input name="confirm_archive" type="checkbox" required />
                      Archive this recurring source.
                    </label>
                    <button className="btn btn-coral" type="submit">Archive source</button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
