import { AlertCircle, CalendarClock, HeartPulse } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { QuickActions } from "@/components/forms/ActionForms";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { formatPeso } from "@/lib/money";

export default async function TodayPage() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 3 });
  const privacy = snapshot.settings.privacyMode;
  const currentMonth = snapshot.forecast.months[0];
  const dueSoon = snapshot.obligations.filter((item) => item.dueDay <= 25).slice(0, 3);
  const accountId = snapshot.accounts[0]?.id;
  const obligationId = snapshot.obligations[0]?.id;

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

      <QuickActions accountId={accountId} obligationId={obligationId} />

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
                  <p className="font-bold text-coral">{formatPeso(item.amount, privacy)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-muted">Due day {item.dueDay}</p>
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
    </div>
  );
}
