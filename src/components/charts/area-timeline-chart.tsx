"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";

interface SeriesConfig {
  key: string;
  label: string;
  color?: string;
}

interface AreaTimelineChartProps {
  data: { period: string; [key: string]: number | string }[];
  series: SeriesConfig[];
}

const PALETTE = ["#003366", "#0891B2", "#D97706", "#B91C1C"];

function CustomTooltip({
  active,
  payload,
  label,
  series,
}: TooltipProps<number, string> & { series: SeriesConfig[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-rule rounded-lg px-3 py-2 shadow-lg min-w-[140px]">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
        {label}
      </p>
      {payload.map((entry, i) => {
        const s = series.find((s) => s.key === entry.dataKey);
        return (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-ink-muted">
                {s?.label ?? entry.dataKey}
              </span>
            </div>
            <span className="text-xs font-mono font-medium text-ink">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AreaTimelineChart({
  data,
  series,
}: AreaTimelineChartProps) {
  if (!data || data.length === 0 || !series || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-ink-faint text-sm">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? PALETTE[i % PALETTE.length];
            return (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{
            fontSize: 11,
            fill: "#94A3B8",
            fontFamily: '"DM Sans", system-ui, sans-serif',
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{
            fontSize: 11,
            fill: "#94A3B8",
            fontFamily: '"JetBrains Mono", Menlo, monospace',
          }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip series={series} />} />
        {series.map((s, i) => {
          const color = s.color ?? PALETTE[i % PALETTE.length];
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              stackId="1"
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
