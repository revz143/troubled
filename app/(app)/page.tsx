import { AlertCircle, CalendarClock, HeartPulse } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { QuickActions } from "@/components/forms/ActionForms";
import { deletePaymentAction, updatePaymentAction } from "@/lib/actions";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { centavosToDecimal, formatPeso } from "@/lib/money";

export default async function TodayPage() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 3 });
  const privacy = snapshot.settings.privacyMode;
  const currentMonth = snapshot.forecast.months[0];
  const dueSoon = snapshot.obligationBilling.slice(0, 3);
  const obligationsById = new Map(snapshot.obligations.map((item) => [item.id, item.name]));

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:ml-52">
      <section className="paper-panel rounded-lg p-5 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Today</p>
        <h1 className="mt-3 font-serif-display text-4xl font-semibold leading-tight text-moss-deep sm:text-5xl">
          A quiet look at what needs attention.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
          No scolding, no red dashboard panic. Just cash, due dates, income, and the next bit of breathing room.
        </p>
      </section>

      {snapshot.isDemo ? (
        <p className="rounded-lg border border-coral/30 bg-coral-soft/50 px-4 py-3 text-sm text-moss-deep">
          Demo mode is using seeded data because Supabase environment variables are not set yet.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Available cash" value={snapshot.availableCash} tone="moss" privacy={privacy} helper="Opening balances plus posted transactions." />
        <MetricCard label="Debt remaining" value={snapshot.totalDebt} tone="coral" privacy={privacy} helper="Principal-only until amortization is added." />
        <MetricCard label="Expected this month" value={currentMonth?.expectedIncome ?? 0} privacy={privacy} helper="Future expected income, not already received." />
        <MetricCard label="This month closes at" value={currentMonth?.closingCash ?? 0} privacy={privacy} helper="Forecasted after upcoming income and obligations." />
      </div>

      <QuickActions accounts={snapshot.accounts} paymentObligations={snapshot.obligationBilling} today={snapshot.today} />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="paper-panel rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="text-coral" size={20} aria-hidden />
            <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Due soon</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {dueSoon.length ? dueSoon.map((item) => (
              <div key={item.id} className="rounded-lg border border-line/70 bg-paper-soft/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-moss-deep">{item.name}</p>
                  <p className="font-bold text-coral">{formatPeso(item.amountDueNow || item.amountDueNext, privacy)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {item.amountDueNow > 0
                    ? `${item.status === "partial" ? "Partially paid" : "Unpaid"} · carries ${formatPeso(item.carryoverAmount, privacy)} forward`
                    : item.nextDueDate
                      ? `Next due ${item.nextDueDate}`
                      : "No upcoming date"}
                </p>
              </div>
            )) : <p className="text-sm text-ink-muted">Nothing due soon. That space counts.</p>}
          </div>
        </div>

        <div className="paper-panel rounded-lg p-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-coral" size={20} aria-hidden />
            <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Calm status</h2>
          </div>
          {snapshot.forecast.firstShortfall ? (
            <p className="mt-4 flex gap-2 rounded-lg bg-coral-soft/70 p-3 text-sm leading-6 text-moss-deep">
              <AlertCircle size={18} aria-hidden />
              First shortfall appears in {snapshot.forecast.firstShortfall.monthKey}. You need{" "}
              {formatPeso(snapshot.forecast.firstShortfall.amountNeeded, privacy)} to avoid dipping below zero.
            </p>
          ) : (
            <p className="mt-4 rounded-lg bg-sage/40 p-3 text-sm leading-6 text-moss-deep">
              The next three months stay above zero in this forecast. Keep it gentle and keep it updated.
            </p>
          )}
          <div className="mt-4 grid gap-2">
            {snapshot.forecast.milestoneMessages.slice(0, 2).map((message) => (
              <p key={message} className="text-sm leading-6 text-ink-muted">{message}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="paper-panel rounded-lg p-4">
        <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Recent payments</h2>
        <div className="mt-4 grid gap-3">
          {snapshot.paymentTransactions.length ? snapshot.paymentTransactions.slice(0, 6).map((payment) => (
            <article key={payment.id} className="rounded-lg border border-line/70 bg-paper-soft/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-moss-deep">{obligationsById.get(payment.obligationId) ?? "Obligation payment"}</p>
                  <p className="mt-1 text-sm text-ink-muted">{payment.occurredDate} · {payment.description || "No note"}</p>
                </div>
                <p className="font-bold text-coral">{formatPeso(payment.amount, privacy)}</p>
              </div>
              <details className="mt-3 rounded-lg border border-line/70 bg-paper/70 p-3">
                <summary className="cursor-pointer text-sm font-bold text-moss-deep">Edit payment</summary>
                <form action={updatePaymentAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input name="id" type="hidden" value={payment.id} />
                  <label className="grid gap-1 text-sm font-semibold text-moss-deep">Account
                    <select className="field" name="account_id" defaultValue={payment.accountId}>
                      {snapshot.accounts.map((account) => (
                        <option key={account.id} value={account.id}>{account.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-moss-deep">Obligation
                    <select className="field" name="obligation_id" defaultValue={payment.obligationId}>
                      {snapshot.obligationBilling.map((obligation) => (
                        <option key={obligation.id} value={obligation.id}>{obligation.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-moss-deep">Amount<input className="field" name="amount" inputMode="decimal" defaultValue={centavosToDecimal(payment.amount)} required /></label>
                  <label className="grid gap-1 text-sm font-semibold text-moss-deep">Date<input className="field" name="occurred_date" type="date" defaultValue={payment.occurredDate} required /></label>
                  <label className="grid gap-1 text-sm font-semibold text-moss-deep sm:col-span-2">Description<input className="field" name="description" defaultValue={payment.description} /></label>
                  <button className="btn btn-primary sm:col-span-2" type="submit">Save payment</button>
                </form>
                <form action={deletePaymentAction} className="mt-3 grid gap-2 rounded-lg bg-coral-soft/50 p-3">
                  <input name="id" type="hidden" value={payment.id} />
                  <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
                    <input name="confirm_delete" type="checkbox" required />
                    Delete this payment transaction.
                  </label>
                  <button className="btn btn-coral" type="submit">Delete payment</button>
                </form>
              </details>
            </article>
          )) : (
            <p className="rounded-lg bg-sage/30 p-3 text-sm leading-6 text-ink-muted">
              No payments recorded yet. When something is mistyped, this is where you’ll be able to fix it.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
