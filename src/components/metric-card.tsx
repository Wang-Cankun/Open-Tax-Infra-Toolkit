interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: "navy" | "teal" | "amber" | "danger";
}

const ACCENT = {
  navy: "border-l-navy",
  teal: "border-l-teal",
  amber: "border-l-amber",
  danger: "border-l-danger",
} as const;

export default function MetricCard({
  title,
  value,
  subtitle,
  accent = "navy",
}: MetricCardProps) {
  return (
    <div
      className={`bg-surface rounded-lg border border-rule border-l-4 ${ACCENT[accent]} p-5`}
    >
      <p className="text-xs font-semibold font-body uppercase tracking-widest text-ink-muted">
        {title}
      </p>
      <p className="mt-2 text-3xl font-mono font-medium text-ink fade-up">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1.5 text-sm text-ink-faint">{subtitle}</p>
      )}
    </div>
  );
}
