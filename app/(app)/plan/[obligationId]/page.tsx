import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { PaymentForm } from "@/components/forms/ActionForms";
import {
  archiveObligationAction,
  deletePaymentAction,
  updateObligationAction,
  updatePaymentAction,
} from "@/lib/actions";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { centavosToDecimal, formatPeso } from "@/lib/money";

type Props = {
  params: Promise<{ obligationId: string }>;
};

function statusLabel(status: string) {
  if (status === "paid") return "Paid this cycle";
  if (status === "partial") return "Partially paid";
  if (status === "unpaid") return "Due / carried over";
  return "Upcoming";
}

function statusClass(status: string) {
  if (status === "paid") return "status-paid";
  if (status === "partial") return "status-partial";
  if (status === "unpaid") return "status-carried";
  return "status-upcoming";
}

export default async function ObligationDetailPage({ params }: Props) {
  const { obligationId } = await params;
  const snapshot = await getFinanceSnapshot({ horizonMonths: 12 });
  const privacy = snapshot.settings.privacyMode;
  const obligation = snapshot.obligations.find((item) => item.id === obligationId);
  const billing = snapshot.obligationBilling.find((item) => item.id === obligationId);
  const payments = snapshot.paymentTransactions.filter((payment) => payment.obligationId === obligationId);

  if (!obligation || !billing) notFound();

  return (
    <div className="mx-auto grid max-w-4xl gap-7 lg:ml-52">
      <Link className="inline-flex w-fit items-center gap-2 text-sm font-bold text-moss-deep underline decoration-coral/50 underline-offset-4" href="/plan">
        <ArrowLeft size={16} aria-hidden />
        Back to obligations
      </Link>

      <section className="paper-panel px-1 py-7 sm:px-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mono-label">Obligation detail</p>
            <h1 className="mt-3 font-serif-display text-[40px] font-light leading-tight text-moss-deep sm:text-[56px]">
              {obligation.name}
            </h1>
            <p className="mt-3 text-sm capitalize leading-6 text-ink-muted">
              {obligation.type.replace("_", " ")} · {obligation.frequency} · due day {obligation.dueDay}
            </p>
          </div>
          <span className={`status-stamp ${statusClass(billing.status)}`}>
            {statusLabel(billing.status)}
          </span>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="paper-panel px-1 py-5 sm:px-3">
          <p className="mono-label">Due now</p>
          <p className="mt-2 font-serif-display text-[38px] font-light leading-none text-moss-deep">{formatPeso(billing.amountDueNow, privacy)}</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {billing.amountDueNow > 0 ? "Unpaid amount carried from due occurrences." : "Covered through the latest due date."}
          </p>
        </div>
        <div className="paper-panel px-1 py-5 sm:px-3">
          <p className="mono-label">Next billing</p>
          <p className="mt-2 font-serif-display text-[38px] font-light leading-none text-moss-deep">{formatPeso(billing.amountDueNext, privacy)}</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {billing.nextDueDate ? `Expected on ${billing.nextDueDate}.` : "No upcoming occurrence."}
          </p>
        </div>
        <div className="paper-panel px-1 py-5 sm:px-3">
          <p className="mono-label">Paid so far</p>
          <p className="mt-2 font-serif-display text-[38px] font-light leading-none text-moss-deep">{formatPeso(billing.paidThroughToday, privacy)}</p>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Payments are ledger records; no account balance maintenance required.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="paper-panel px-1 py-5 sm:px-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="text-coral" size={20} aria-hidden />
            <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Record payment</h2>
          </div>
          <div className="mt-4">
            <PaymentForm obligations={[billing]} today={snapshot.today} />
          </div>
        </aside>

        <div className="paper-panel px-1 py-5 sm:px-3">
          <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Payment history</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Corrections live here, beside the obligation they affect.
          </p>
          <div className="mt-4 grid gap-3">
            {payments.length ? payments.map((payment) => (
              <article id={`payment-${payment.id}`} key={payment.id} className="rule-row py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-moss-deep">{payment.occurredDate}</p>
                    <p className="mt-1 text-sm text-ink-muted">{payment.description || "No note"}</p>
                  </div>
                  <p className="font-serif-display text-[21px] text-ink">{formatPeso(payment.amount, privacy)}</p>
                </div>
                <details className="mt-3 rounded-lg border border-line/70 bg-paper/70 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-moss-deep">Correct this payment</summary>
                  <form action={updatePaymentAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input name="id" type="hidden" value={payment.id} />
                    <input name="obligation_id" type="hidden" value={obligation.id} />
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Amount<input className="field" name="amount" inputMode="decimal" defaultValue={centavosToDecimal(payment.amount)} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Date<input className="field" name="occurred_date" type="date" defaultValue={payment.occurredDate} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep sm:col-span-2">Description<input className="field" name="description" defaultValue={payment.description} /></label>
                    <button className="btn btn-primary sm:col-span-2" type="submit">Save payment</button>
                  </form>
                  <form action={deletePaymentAction} className="mt-3 grid gap-2 rounded-lg bg-coral-soft/50 p-3">
                    <input name="id" type="hidden" value={payment.id} />
                    <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
                      <input name="confirm_delete" type="checkbox" required />
                      Delete this mistaken payment.
                    </label>
                    <button className="btn btn-coral" type="submit">Delete payment</button>
                  </form>
                </details>
              </article>
            )) : (
              <p className="rounded-lg bg-sage/30 p-3 text-sm leading-6 text-ink-muted">
                No payments recorded yet for this obligation.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="paper-panel px-1 py-5 sm:px-3">
        <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Edit obligation</h2>
        <form action={updateObligationAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input name="id" type="hidden" value={obligation.id} />
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Name<input className="field" name="name" defaultValue={obligation.name} required /></label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Type
            <select className="field" name="type" defaultValue={obligation.type}>
              <option value="debt">Debt</option>
              <option value="credit_card">Credit card</option>
              <option value="bill">Bill</option>
              <option value="family_support">Family support</option>
              <option value="budget">Budget</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Amount<input className="field" name="scheduled_amount" inputMode="decimal" defaultValue={centavosToDecimal(obligation.amount)} required /></label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Due day<input className="field" name="due_day" type="number" min={1} max={31} defaultValue={obligation.dueDay} required /></label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Start date<input className="field" name="start_date" type="date" defaultValue={obligation.startDate} required /></label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">End date<input className="field" name="end_date" type="date" defaultValue={obligation.endDate ?? ""} /></label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Frequency
            <select className="field" name="frequency" defaultValue={obligation.frequency}>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Remaining principal<input className="field" name="remaining_principal" inputMode="decimal" defaultValue={obligation.remainingPrincipal ? centavosToDecimal(obligation.remainingPrincipal) : ""} /></label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep sm:col-span-2">Notes<textarea className="field min-h-20" name="notes" defaultValue={obligation.notes ?? ""} /></label>
          <button className="btn btn-primary sm:col-span-2" type="submit">Save obligation</button>
        </form>
        <form action={archiveObligationAction} className="mt-4 grid gap-2 rounded-lg bg-coral-soft/50 p-3">
          <input name="id" type="hidden" value={obligation.id} />
          <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
            <input name="confirm_archive" type="checkbox" required />
            I want to archive this obligation.
          </label>
          <button className="btn btn-coral" type="submit">Archive obligation</button>
        </form>
      </section>
    </div>
  );
}
