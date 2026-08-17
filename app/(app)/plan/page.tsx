import { ObligationForm } from "@/components/forms/ActionForms";
import { MetricCard } from "@/components/MetricCard";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { formatPeso } from "@/lib/money";

export default async function PlanPage() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 12 });
  const privacy = snapshot.settings.privacyMode;

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
