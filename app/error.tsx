"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4">
      <section className="paper-panel rounded-lg p-6">
        <h1 className="font-serif-display text-3xl font-semibold text-moss-deep">Something needs a second look.</h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">The app hit an error while loading this view.</p>
        <button className="btn btn-primary mt-5" onClick={reset} type="button">Try again</button>
      </section>
    </main>
  );
}
