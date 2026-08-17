import { formatPeso, type Centavos } from "@/lib/money";

export function MetricCard({
  label,
  value,
  tone = "default",
  helper,
  privacy = false,
}: {
  label: string;
  value: Centavos | string;
  tone?: "default" | "coral" | "moss";
  helper?: string;
  privacy?: boolean;
}) {
  const color = tone === "coral" ? "text-coral" : tone === "moss" ? "text-moss" : "text-ink";
  return (
    <section className="paper-panel rounded-lg p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">{label}</p>
      <p className={`mt-3 font-serif-display text-3xl font-semibold ${color}`}>
        {typeof value === "number" ? formatPeso(value, privacy) : value}
      </p>
      {helper ? <p className="mt-2 text-sm leading-6 text-ink-muted">{helper}</p> : null}
    </section>
  );
}
