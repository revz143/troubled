import { ObligationForm } from "@/components/forms/ActionForms";
import { MetricCard } from "@/components/MetricCard";
import { archiveObligationAction, updateObligationAction } from "@/lib/actions";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { centavosToDecimal, formatPeso } from "@/lib/money";

export default async function PlanPage() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 12 });
  const privacy = snapshot.settings.privacyMode;
  const billingByObligation = new Map(snapshot.obligationBilling.map((item) => [item.id, item]));

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:ml-52">
      <section className="paper-panel rounded-lg p-5 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Plan</p>
        <h1 className="mt-3 font-serif-display text-4xl font-semibold text-moss-deep">Every obligation gets a beginning and, when possible, an end.</h1>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Active obligations" value={String(snapshot.obligations.length)} />
        <MetricCard label="Total debt" value={snapshot.totalDebt} privacy={privacy} tone="coral" />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="paper-panel rounded-lg p-4">
          <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Obligations</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.obligations.map((item) => (
              <article key={item.id} className="rounded-lg border border-line/70 bg-paper-soft/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-moss-deep">{item.name}</p>
                    <p className="mt-1 text-sm capitalize text-ink-muted">{item.type.replace("_", " ")} · due day {item.dueDay}</p>
                  </div>
                  <p className="font-bold text-coral">{formatPeso(item.amount, privacy)}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  Starts {item.startDate}. {item.endDate ? `Ends ${item.endDate}.` : item.remainingPrincipal ? "Payoff estimated from remaining principal." : "Ongoing until you add an end date."}
                </p>
                {billingByObligation.get(item.id) ? (
                  <p className="mt-2 rounded-md bg-sage/30 px-3 py-2 text-sm leading-6 text-moss-deep">
                    {billingByObligation.get(item.id)?.amountDueNow
                      ? `${billingByObligation.get(item.id)?.status === "partial" ? "Partial payment recorded" : "Unpaid"}: ${formatPeso(billingByObligation.get(item.id)?.amountDueNow ?? 0, privacy)} carries into the next billing.`
                      : "Paid up through the latest due date."}
                  </p>
                ) : null}
                <details className="mt-3 rounded-lg border border-line/70 bg-paper/70 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-moss-deep">Edit obligation</summary>
                  <form action={updateObligationAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input name="id" type="hidden" value={item.id} />
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Name<input className="field" name="name" defaultValue={item.name} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Type
                      <select className="field" name="type" defaultValue={item.type}>
                        <option value="debt">Debt</option>
                        <option value="credit_card">Credit card</option>
                        <option value="bill">Bill</option>
                        <option value="family_support">Family support</option>
                        <option value="budget">Budget</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Amount<input className="field" name="scheduled_amount" inputMode="decimal" defaultValue={centavosToDecimal(item.amount)} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Due day<input className="field" name="due_day" type="number" min={1} max={31} defaultValue={item.dueDay} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Start date<input className="field" name="start_date" type="date" defaultValue={item.startDate} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">End date<input className="field" name="end_date" type="date" defaultValue={item.endDate ?? ""} /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Frequency
                      <select className="field" name="frequency" defaultValue={item.frequency}>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Remaining principal<input className="field" name="remaining_principal" inputMode="decimal" defaultValue={item.remainingPrincipal ? centavosToDecimal(item.remainingPrincipal) : ""} /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep sm:col-span-2">Notes<textarea className="field min-h-20" name="notes" defaultValue={item.notes ?? ""} /></label>
                    <button className="btn btn-primary sm:col-span-2" type="submit">Save obligation</button>
                  </form>
                  <form action={archiveObligationAction} className="mt-3 grid gap-2 rounded-lg bg-coral-soft/50 p-3">
                    <input name="id" type="hidden" value={item.id} />
                    <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
                      <input name="confirm_archive" type="checkbox" required />
                      I want to archive this obligation.
                    </label>
                    <button className="btn btn-coral" type="submit">Archive obligation</button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </div>
        <aside className="paper-panel rounded-lg p-4">
          <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Add obligation</h2>
          <div className="mt-4"><ObligationForm /></div>
        </aside>
      </section>
    </div>
  );
}
