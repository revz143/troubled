import Link from "next/link";
import { ObligationForm } from "@/components/forms/ActionForms";
import { MetricCard } from "@/components/MetricCard";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { formatPeso } from "@/lib/money";

function statusLabel(status: string) {
  if (status === "paid") return "Paid this cycle";
  if (status === "partial") return "Partially paid";
  if (status === "unpaid") return "Due / carried";
  return "Upcoming";
}

function statusClass(status: string) {
  if (status === "paid") return "status-paid";
  if (status === "partial") return "status-partial";
  if (status === "unpaid") return "status-carried";
  return "status-upcoming";
}

export default async function PlanPage() {
  const snapshot = await getFinanceSnapshot({ horizonMonths: 12 });
  const privacy = snapshot.settings.privacyMode;
  const billingByObligation = new Map(snapshot.obligationBilling.map((item) => [item.id, item]));

  return (
    <div className="mx-auto grid max-w-4xl gap-7 lg:ml-52">
      <section className="paper-panel px-1 py-7 sm:px-3">
        <p className="mono-label">Plan</p>
        <h1 className="mt-3 max-w-2xl font-serif-display text-[40px] font-light leading-tight text-moss-deep">Every obligation gets a beginning and, when possible, an end.</h1>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Active obligations" value={String(snapshot.obligations.length)} />
        <MetricCard label="Total debt" value={snapshot.totalDebt} privacy={privacy} tone="coral" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="paper-panel px-1 py-5 sm:px-3">
          <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Obligations</h2>
          <div className="mt-4">
            {snapshot.obligations.map((item) => (
              <article key={item.id} className="rule-row py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-moss-deep">{item.name}</p>
                      {billingByObligation.get(item.id) ? (
                        <span className={`status-stamp ${statusClass(billingByObligation.get(item.id)?.status ?? "upcoming")}`}>
                          {statusLabel(billingByObligation.get(item.id)?.status ?? "upcoming")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm capitalize text-ink-muted">{item.type.replace("_", " ")} · due day {item.dueDay}</p>
                  </div>
                  <p className="font-serif-display text-[21px] text-ink">{formatPeso(item.amount, privacy)}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-muted">
                  Starts {item.startDate}. {item.endDate ? `Ends ${item.endDate}.` : item.remainingPrincipal ? "Payoff estimated from remaining principal." : "Ongoing until you add an end date."}
                </p>
                {billingByObligation.get(item.id) ? (
                  <p className="mt-2 text-sm leading-6 text-moss-deep">
                    {billingByObligation.get(item.id)?.amountDueNow
                      ? `${billingByObligation.get(item.id)?.status === "partial" ? "Partial payment recorded" : "Unpaid"}: ${formatPeso(billingByObligation.get(item.id)?.amountDueNow ?? 0, privacy)} carries into the next billing.`
                      : "Paid up through the latest due date."}
                  </p>
                ) : null}
                <Link aria-label={`View details for ${item.name}`} className="mt-3 inline-flex text-sm font-bold text-moss underline decoration-[color:var(--rule-strong)] underline-offset-4" href={`/plan/${item.id}`}>
                  View details
                </Link>
              </article>
            ))}
          </div>
        </div>
        <aside className="paper-panel px-1 py-5 sm:px-3">
          <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Add obligation</h2>
          <div className="mt-4"><ObligationForm /></div>
        </aside>
      </section>
    </div>
  );
}
