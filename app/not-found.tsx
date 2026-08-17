import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4">
      <section className="paper-panel rounded-lg p-6">
        <h1 className="font-serif-display text-3xl font-semibold text-moss-deep">This page is not here.</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">Nothing financial was changed.</p>
        <Link className="btn btn-primary mt-5" href="/">Back to Today</Link>
      </section>
    </main>
  );
}
