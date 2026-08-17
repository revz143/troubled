import { Download, Upload } from "lucide-react";
import {
  archiveAccountAction,
  createAccountFormAction,
  updateAccountAction,
  updateSettingsFormAction,
} from "@/lib/actions";
import { getFinanceSnapshot } from "@/lib/data/finance";
import { centavosToDecimal, formatPeso } from "@/lib/money";

export default async function SettingsPage() {
  const snapshot = await getFinanceSnapshot();

  return (
    <div className="mx-auto grid max-w-4xl gap-7 lg:ml-52">
      <section className="paper-panel px-1 py-7 sm:px-3">
        <p className="mono-label">Settings and data</p>
        <h1 className="mt-3 font-serif-display text-[40px] font-light text-moss-deep">Keep the room private and portable.</h1>
      </section>

      <section className="paper-panel px-1 py-5 sm:px-3">
        <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Preferences</h2>
        <form action={updateSettingsFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Currency<input className="field" name="currency" value="PHP" readOnly /></label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Timezone<input className="field" name="timezone" defaultValue={snapshot.settings.timezone} /></label>
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">Reminder lead days<input className="field" name="reminder_lead_days" type="number" min={0} max={60} defaultValue={snapshot.settings.reminderLeadDays} /></label>
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-line/70 bg-paper-soft/60 px-3 text-sm font-semibold text-moss-deep">
            <input name="privacy_mode" type="checkbox" defaultChecked={snapshot.settings.privacyMode} />
            Privacy mode
          </label>
          <button className="btn btn-primary sm:col-span-2" type="submit">Save settings</button>
        </form>
      </section>

      <section className="paper-panel px-1 py-5 sm:px-3">
        <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Accounts</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <form action={createAccountFormAction} className="grid gap-3 rounded-lg border border-line/70 bg-paper-soft/60 p-3">
            <h3 className="font-bold text-moss-deep">Add account</h3>
            <label className="grid gap-1 text-sm font-semibold text-moss-deep">Name<input className="field" name="name" placeholder="Everyday cash" required /></label>
            <label className="grid gap-1 text-sm font-semibold text-moss-deep">Type
              <select className="field" name="account_type" defaultValue="cash">
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="e_wallet">E-wallet</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-moss-deep">Opening balance<input className="field" name="opening_balance" inputMode="decimal" placeholder="1000.00" required /></label>
            <label className="grid gap-1 text-sm font-semibold text-moss-deep">Balance as of<input className="field" name="balance_as_of" type="date" defaultValue={snapshot.today} required /></label>
            <button className="btn btn-primary" type="submit">Add account</button>
          </form>
          <div>
            {snapshot.accounts.map((account) => (
              <article key={account.id} className="rule-row py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-moss-deep">{account.name}</p>
                    <p className="mt-1 text-sm capitalize text-ink-muted">{account.accountType.replace("_", "-")} · as of {account.balanceAsOf}</p>
                  </div>
                  <p className="font-serif-display text-[21px] text-ink">{formatPeso(account.openingBalance, snapshot.settings.privacyMode)}</p>
                </div>
                <details className="mt-3 rounded-lg border border-line/70 bg-paper/70 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-moss-deep">Edit account</summary>
                  <form action={updateAccountAction} className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input name="id" type="hidden" value={account.id} />
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Name<input className="field" name="name" defaultValue={account.name} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Type
                      <select className="field" name="account_type" defaultValue={account.accountType}>
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                        <option value="e_wallet">E-wallet</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Opening balance<input className="field" name="opening_balance" inputMode="decimal" defaultValue={centavosToDecimal(account.openingBalance)} required /></label>
                    <label className="grid gap-1 text-sm font-semibold text-moss-deep">Balance as of<input className="field" name="balance_as_of" type="date" defaultValue={account.balanceAsOf} required /></label>
                    <button className="btn btn-primary sm:col-span-2" type="submit">Save account</button>
                  </form>
                  <form action={archiveAccountAction} className="mt-3 grid gap-2 rounded-lg bg-coral-soft/50 p-3">
                    <input name="id" type="hidden" value={account.id} />
                    <label className="flex items-center gap-2 text-sm font-semibold text-moss-deep">
                      <input name="confirm_archive" type="checkbox" required />
                      Archive this account.
                    </label>
                    <button className="btn btn-coral" type="submit">Archive account</button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="paper-panel px-1 py-5 sm:px-3">
        <h2 className="font-serif-display text-[28px] font-light text-moss-deep">Data</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a className="btn btn-secondary" href="/api/export"><Download size={18} aria-hidden />Export JSON</a>
          <form action="/api/import" encType="multipart/form-data" method="post" className="grid gap-3 rounded-lg border border-line/70 bg-paper-soft/60 p-3">
            <label className="grid gap-1 text-sm font-semibold text-moss-deep">Hinga backup JSON<input className="field" name="backup" type="file" accept="application/json,.json" /></label>
            <button className="btn btn-coral" type="submit"><Upload size={18} aria-hidden />Import backup</button>
          </form>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          Destructive corrections require an explicit checkbox confirmation. Prefer archive for ongoing records so the history stays legible.
        </p>
      </section>
    </div>
  );
}
