import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { signInWithEmail } from "@/app/(auth)/actions";
import { isSupabaseConfigured } from "@/lib/env";

type Props = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center px-5 py-8">
      <section className="ledger-frame w-full rounded-[22px] p-7">
        <div className="grid size-12 place-items-center rounded-[10px] border border-line/80 bg-paper-raised text-moss">
          <ShieldCheck size={24} aria-hidden />
        </div>
        <h1 className="mt-5 font-serif-display text-[40px] font-light leading-tight text-moss-deep">Your private Hinga room.</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Sign in with a magic link. No password to remember, no finance data stored in the browser.
        </p>
        {params.sent ? (
          <p className="mt-4 rounded-lg bg-sage/40 p-3 text-sm leading-6 text-moss-deep" role="status">
            Check your email for the sign-in link.
          </p>
        ) : null}
        {params.error ? (
          <p className="mt-4 rounded-lg bg-coral-soft/60 p-3 text-sm leading-6 text-moss-deep" role="alert">
            Sign-in link could not be used: {params.error}
          </p>
        ) : null}
        {!configured ? (
          <p className="mt-4 rounded-lg bg-coral-soft/60 p-3 text-sm leading-6 text-moss-deep">
            Supabase is not configured yet, so the app opens in demo mode. Add `.env.local` from `.env.example` to enable auth.
          </p>
        ) : null}
        <form action={signInWithEmail} className="mt-5 grid gap-3">
          <label className="grid gap-1 text-sm font-semibold text-moss-deep">
            Email
            <input className="field" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </label>
          <button className="btn btn-primary" type="submit"><Mail size={18} aria-hidden />Send magic link</button>
        </form>
        <Link className="btn btn-secondary mt-3 w-full" href="/">Open demo</Link>
      </section>
    </main>
  );
}
