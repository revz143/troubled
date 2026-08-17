"use client";

import { useActionState, useMemo, useState } from "react";
import { Banknote, HandCoins, Plus, ReceiptText } from "lucide-react";
import { centavosToDecimal, formatPeso } from "@/lib/money";
import type { ObligationBillingSummary } from "@/lib/billing/ledger";
import {
  createIncomeEntryAction,
  createIncomeSourceAction,
  createObligationAction,
  recordPaymentAction,
  type ActionState,
} from "@/lib/actions";

const initialState: ActionState = { ok: false, message: "" };

type AccountOption = {
  id: string;
  name: string;
  accountType: string;
};

function Status({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p className={`mt-3 rounded-md px-3 py-2 text-sm ${state.ok ? "bg-sage/40 text-moss-deep" : "bg-coral-soft text-moss-deep"}`} role="status">
      {state.message}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-moss-deep">
      {label}
      {children}
    </label>
  );
}

export function ObligationForm() {
  const [state, action, pending] = useActionState(createObligationAction, initialState);
  return (
    <form action={action} className="grid gap-3" data-testid="obligation-form">
      <Field label="Name"><input className="field" name="name" required placeholder="Personal loan" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select className="field" name="type" defaultValue="bill">
            <option value="debt">Debt</option>
            <option value="credit_card">Credit card</option>
            <option value="bill">Bill</option>
            <option value="family_support">Family support</option>
            <option value="budget">Budget</option>
          </select>
        </Field>
        <Field label="Amount"><input className="field" name="scheduled_amount" inputMode="decimal" required placeholder="4200.00" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date"><input className="field" name="start_date" type="date" required /></Field>
        <Field label="End date"><input className="field" name="end_date" type="date" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due day"><input className="field" name="due_day" type="number" min={1} max={31} required defaultValue={25} /></Field>
        <Field label="Frequency">
          <select className="field" name="frequency" defaultValue="monthly">
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>
      </div>
      <Field label="Remaining principal for debts"><input className="field" name="remaining_principal" inputMode="decimal" placeholder="12600.00" /></Field>
      <Field label="Notes"><textarea className="field min-h-24" name="notes" placeholder="Anything future-you should know" /></Field>
      <button className="btn btn-primary" disabled={pending} type="submit"><Banknote size={18} aria-hidden />Add obligation</button>
      <Status state={state} />
    </form>
  );
}

export function IncomeEntryForm() {
  const [state, action, pending] = useActionState(createIncomeEntryAction, initialState);
  return (
    <form action={action} className="grid gap-3" data-testid="income-form">
      <Field label="Amount"><input className="field" name="amount" inputMode="decimal" required placeholder="5500.00" /></Field>
      <Field label="Expected date"><input className="field" name="expected_date" type="date" required /></Field>
      <Field label="Status">
        <select className="field" name="status" defaultValue="expected">
          <option value="expected">Expected</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Field>
      <Field label="Received date"><input className="field" name="received_date" type="date" /></Field>
      <Field label="Source or note"><input className="field" name="source_note" placeholder="Freelance retainer" /></Field>
      <button className="btn btn-coral" disabled={pending} type="submit"><HandCoins size={18} aria-hidden />Add income</button>
      <Status state={state} />
    </form>
  );
}

export function IncomeSourceForm() {
  const [state, action, pending] = useActionState(createIncomeSourceAction, initialState);
  return (
    <form action={action} className="grid gap-3">
      <Field label="Name"><input className="field" name="name" required placeholder="Salary" /></Field>
      <Field label="Amount"><input className="field" name="amount" inputMode="decimal" required placeholder="32000.00" /></Field>
      <Field label="Frequency">
        <select className="field" name="frequency" defaultValue="monthly">
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start"><input className="field" name="start_date" type="date" required /></Field>
        <Field label="Next expected"><input className="field" name="next_expected_date" type="date" required /></Field>
      </div>
      <Field label="End date"><input className="field" name="end_date" type="date" /></Field>
      <button className="btn btn-primary" disabled={pending} type="submit"><Plus size={18} aria-hidden />Add source</button>
      <Status state={state} />
    </form>
  );
}

export function PaymentForm({
  accounts,
  obligations,
  today,
}: {
  accounts: AccountOption[];
  obligations: ObligationBillingSummary[];
  today: string;
}) {
  const [state, action, pending] = useActionState(recordPaymentAction, initialState);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "");
  const [selectedObligationId, setSelectedObligationId] = useState(obligations[0]?.id ?? "");
  const [paymentMode, setPaymentMode] = useState<"full" | "partial">("full");
  const [partialAmount, setPartialAmount] = useState("");
  const selectedObligation = useMemo(
    () => obligations.find((obligation) => obligation.id === selectedObligationId),
    [obligations, selectedObligationId],
  );
  const fullAmount = selectedObligation ? selectedObligation.amountDueNow || selectedObligation.amountDueNext : 0;
  const amount = paymentMode === "full" ? centavosToDecimal(fullAmount) : partialAmount;

  if (!accounts.length || !obligations.length) {
    return (
      <div className="rounded-lg bg-sage/40 p-4 text-sm leading-6 text-moss-deep">
        Add at least one account and one obligation first. Then payments can be tied to the exact bill or loan they belong to.
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3" data-testid="payment-form">
      <Field label="Pay from">
        <select className="field" name="account_id" required value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>{account.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Obligation">
        <select
          className="field"
          name="obligation_id"
          required
          value={selectedObligationId}
          onChange={(event) => setSelectedObligationId(event.target.value)}
        >
          {obligations.map((obligation) => (
            <option key={obligation.id} value={obligation.id}>
              {obligation.name} — {obligation.amountDueNow || obligation.amountDueNext ? formatPeso(obligation.amountDueNow || obligation.amountDueNext) : "paid ahead"}
            </option>
          ))}
        </select>
      </Field>
      {selectedObligation ? (
        <div className="rounded-lg border border-line/70 bg-paper-soft/60 p-3 text-sm leading-6 text-ink-muted">
          {selectedObligation.amountDueNow > 0 ? (
            <p>
              Due now: <strong className="text-moss-deep">{formatPeso(selectedObligation.amountDueNow)}</strong>. Any unpaid remainder will carry into the next billing.
            </p>
          ) : selectedObligation.prepaidAmount > 0 ? (
            <p>
              Already paid ahead by <strong className="text-moss-deep">{formatPeso(selectedObligation.prepaidAmount)}</strong>.
              {selectedObligation.amountDueNext > 0 ? ` Next bill still needs ${formatPeso(selectedObligation.amountDueNext)}.` : " The next bill is covered."}
            </p>
          ) : (
            <p>
              No unpaid carryover right now. Next bill: <strong className="text-moss-deep">{formatPeso(selectedObligation.amountDueNext || selectedObligation.scheduledAmount)}</strong>
              {selectedObligation.nextDueDate ? ` on ${selectedObligation.nextDueDate}.` : "."}
            </p>
          )}
          {selectedObligation.amountDueNext > selectedObligation.scheduledAmount ? (
            <p className="mt-1">
              Next billing with carryover: <strong className="text-moss-deep">{formatPeso(selectedObligation.amountDueNext)}</strong>.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-2 rounded-lg bg-sage/30 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
          <input
            name="payment_mode"
            type="radio"
            value="full"
            checked={paymentMode === "full"}
            onChange={() => setPaymentMode("full")}
          />
          {fullAmount > 0 ? `Mark paid for ${formatPeso(fullAmount)}` : "Nothing due right now"}
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
          <input
            name="payment_mode"
            type="radio"
            value="partial"
            checked={paymentMode === "partial"}
            onChange={() => setPaymentMode("partial")}
          />
          Record a partial payment
        </label>
      </div>
      <Field label="Amount">
        <input
          className="field"
          name="amount"
          inputMode="decimal"
          required
          placeholder="4200.00"
          readOnly={paymentMode === "full"}
          value={amount}
          onChange={(event) => setPartialAmount(event.target.value)}
        />
      </Field>
      <Field label="Payment date"><input className="field" name="occurred_date" type="date" required defaultValue={today} /></Field>
      <Field label="Description"><input className="field" name="description" placeholder="Paid from e-wallet" /></Field>
      <button className="btn btn-secondary" disabled={pending || (paymentMode === "full" && fullAmount <= 0)} type="submit"><ReceiptText size={18} aria-hidden />Record payment</button>
      <Status state={state} />
    </form>
  );
}

export function QuickActions({
  accounts,
  paymentObligations,
  today,
}: {
  accounts: AccountOption[];
  paymentObligations: ObligationBillingSummary[];
  today: string;
}) {
  const [open, setOpen] = useState<"income" | "obligation" | "payment" | null>(null);
  return (
    <section className="paper-panel rounded-lg p-4">
      <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Quick actions</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button className="btn btn-coral" type="button" onClick={() => setOpen("income")}><HandCoins size={18} aria-hidden />Add income</button>
        <button className="btn btn-primary" type="button" onClick={() => setOpen("obligation")}><Banknote size={18} aria-hidden />Add obligation</button>
        <button className="btn btn-secondary" type="button" onClick={() => setOpen("payment")}><ReceiptText size={18} aria-hidden />Record payment</button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-moss-deep/35 p-3 sm:place-items-center" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-paper-soft p-5 shadow-paper">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif-display text-2xl font-semibold text-moss-deep">
                {open === "income" ? "Add income" : open === "obligation" ? "Add obligation" : "Record payment"}
              </h3>
              <button className="btn btn-secondary" type="button" onClick={() => setOpen(null)}>Close</button>
            </div>
            {open === "income" ? <IncomeEntryForm /> : null}
            {open === "obligation" ? <ObligationForm /> : null}
            {open === "payment" ? <PaymentForm accounts={accounts} obligations={paymentObligations} today={today} /> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
