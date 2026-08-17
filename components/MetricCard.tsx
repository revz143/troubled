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
    <section className="paper-panel px-1 py-5 sm:px-3">
      <p className="mono-label">{label}</p>
      <p className={`mt-3 font-serif-display text-[38px] font-light leading-none sm:text-[46px] ${color}`}>
        {typeof value === "number" ? formatPeso(value, privacy) : value}
      </p>
      {helper ? <p className="mt-3 max-w-[34ch] text-[13px] leading-6 text-ink-muted">{helper}</p> : null}
    </section>
  );
}
