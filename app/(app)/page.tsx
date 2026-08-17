import Link from "next/link";
import { AlertCircle, CalendarClock, HeartPulse } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { QuickActions } from "@/components/forms/ActionForms";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { formatPeso } from "@/lib/money";

export default async function TodayPage() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 3 });
  const privacy = snapshot.settings.privacyMode;
  const currentMonth = snapshot.forecast.months[0];
  const dueSoon = snapshot.obligationBilling.slice(0, 3);
  const obligationsById = new Map(snapshot.obligations.map((item) => [item.id, item.name]));

  return (
    <div className="mx-auto grid max-w-4xl gap-7 lg:ml-52">
      <section className="paper-panel px-1 py-7 sm:px-3">
        <p className="mono-label">Today</p>
        <h1 className="mt-3 max-w-3xl font-serif-display text-[40px] font-light leading-tight text-moss-deep sm:text-[56px]">
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

      <QuickActions paymentObligations={snapshot.obligationBilling} today={snapshot.today} />

      <section className="grid gap-6 md:grid-cols-2">
        <div className="paper-panel px-1 py-5 sm:px-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="text-coral" size={20} aria-hidden />
            <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Due soon</h2>
          </div>
          <div className="mt-4">
            {dueSoon.length ? dueSoon.map((item) => (
              <div key={item.id} className="rule-row py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-moss-deep">{item.name}</p>
                  <p className="font-serif-display text-[21px] text-ink">{formatPeso(item.amountDueNow || item.amountDueNext, privacy)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {item.amountDueNow > 0
                    ? `${item.status === "partial" ? "Partially paid" : "Unpaid"} · carries ${formatPeso(item.carryoverAmount, privacy)} forward`
                    : item.nextDueDate
                      ? `Next due ${item.nextDueDate}`
                      : "No upcoming date"}
                </p>
                <Link aria-label={`View ${item.name} obligation`} className="mt-3 inline-flex text-sm font-bold text-moss-deep underline decoration-coral/50 underline-offset-4" href={`/plan/${item.id}`}>
                  View obligation
                </Link>
              </div>
            )) : <p className="text-sm text-ink-muted">Nothing due soon. That space counts.</p>}
          </div>
        </div>

        <div className="paper-panel px-1 py-5 sm:px-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-coral" size={20} aria-hidden />
            <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Calm status</h2>
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

      <section className="paper-panel px-1 py-5 sm:px-3">
        <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Recent payments</h2>
        <div className="mt-4">
          {snapshot.paymentTransactions.length ? snapshot.paymentTransactions.slice(0, 6).map((payment) => (
            <article key={payment.id} className="rule-row py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-moss-deep">{obligationsById.get(payment.obligationId) ?? "Obligation payment"}</p>
                  <p className="mt-1 text-sm text-ink-muted">{payment.occurredDate} · {payment.description || "No note"}</p>
                </div>
                <p className="font-serif-display text-[21px] text-ink">{formatPeso(payment.amount, privacy)}</p>
              </div>
              <Link aria-label={`Open ${obligationsById.get(payment.obligationId) ?? "obligation"} details`} className="btn btn-secondary mt-3 w-full sm:w-fit" href={`/plan/${payment.obligationId}#payment-${payment.id}`}>
                Open obligation details
              </Link>
            </article>
          )) : (
            <p className="rounded-lg bg-sage/30 p-3 text-sm leading-6 text-ink-muted">
              No payments recorded yet. Corrections live on each obligation’s detail page, where the history has context.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
