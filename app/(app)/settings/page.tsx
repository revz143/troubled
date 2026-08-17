import { Download, Upload } from "lucide-react";
import { updateSettingsFormAction } from "@/lib/actions";
import { getFinanceSnapshot } from "@/lib/data/finance";

export default async function SettingsPage() {
  const snapshot = await getFinanceSnapshot();

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:ml-52">
      <section className="paper-panel rounded-lg p-5 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-coral">Settings and data</p>
        <h1 className="mt-3 font-serif-display text-4xl font-semibold text-moss-deep">Keep the room private and portable.</h1>
      </section>

      <section className="paper-panel rounded-lg p-4">
        <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Preferences</h2>
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

      <section className="paper-panel rounded-lg p-4">
        <h2 className="font-serif-display text-2xl font-semibold text-moss-deep">Data</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a className="btn btn-secondary" href="/api/export"><Download size={18} aria-hidden />Export JSON</a>
          <form action="/api/import" encType="multipart/form-data" method="post" className="grid gap-3 rounded-lg border border-line/70 bg-paper-soft/60 p-3">
            <label className="grid gap-1 text-sm font-semibold text-moss-deep">Hinga backup JSON<input className="field" name="backup" type="file" accept="application/json,.json" /></label>
            <button className="btn btn-coral" type="submit"><Upload size={18} aria-hidden />Import backup</button>
          </form>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          Destructive actions are intentionally absent from this first pass; when added, they must require explicit confirmation.
        </p>
      </section>
    </div>
  );
}
