"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";

interface DonutItem {
  name: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutItem[];
  innerLabel?: string;
}

const PALETTE = ["#003366", "#0891B2", "#D97706", "#B91C1C"];

function CustomTooltip({
  active,
  payload,
}: TooltipProps<number, string> & { total?: number }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as DonutItem & { total: number };
  const pct =
    item.total > 0 ? ((item.value / item.total) * 100).toFixed(1) : "0";
  return (
    <div className="bg-surface border border-rule rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
        {item.name}
      </p>
      <p className="text-sm font-mono font-medium text-ink mt-0.5">
        {item.value.toLocaleString()}
      </p>
      <p className="text-xs font-mono text-ink-faint">{pct}%</p>
    </div>
  );
}

interface CenterLabelProps {
  cx?: number;
  cy?: number;
  label: string;
}

function CenterLabel({ cx = 0, cy = 0, label }: CenterLabelProps) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan
        x={cx}
        dy="-0.3em"
        style={{
          fontSize: 22,
          fontFamily: '"JetBrains Mono", Menlo, monospace',
          fontWeight: 600,
          fill: "#1B2332",
        }}
      >
        {label}
      </tspan>
    </text>
  );
}

export default function DonutChart({ data, innerLabel }: DonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-ink-faint text-sm">
        No data
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const centerText =
    innerLabel ?? (total >= 1000 ? `${(total / 1000).toFixed(1)}K` : String(total));

  // Attach total to each datum for tooltip percentage calc
  const enriched = data.map((d) => ({ ...d, total }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={enriched}
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
        >
          {enriched.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? PALETTE[index % PALETTE.length]}
            />
          ))}
        </Pie>
        {/* Center label via custom label on Pie */}
        <Pie
          data={[{ value: 1 }]}
          cx="50%"
          cy="45%"
          innerRadius={0}
          outerRadius={0}
          dataKey="value"
          label={<CenterLabel cx={0} cy={0} label={centerText} />}
          labelLine={false}
          isAnimationActive={false}
          fill="transparent"
          stroke="none"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{
            fontSize: 12,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            color: "#64748B",
            paddingTop: 8,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
