"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";

interface BarItem {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarItem[];
  layout?: "vertical" | "horizontal";
  valuePrefix?: string;
  valueSuffix?: string;
}

const PALETTE = ["#003366", "#0891B2", "#D97706", "#B91C1C"];

function formatLabel(
  value: number,
  prefix: string,
  suffix: string
): string {
  const formatted =
    value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : value >= 1_000
      ? `${(value / 1_000).toFixed(1)}K`
      : value.toLocaleString();
  return `${prefix}${formatted}${suffix}`;
}

function CustomTooltip({
  active,
  payload,
  prefix = "",
  suffix = "",
}: TooltipProps<number, string> & { prefix?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as BarItem;
  return (
    <div className="bg-surface border border-rule rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
        {item.name}
      </p>
      <p className="text-sm font-mono font-medium text-ink mt-0.5">
        {prefix}
        {item.value.toLocaleString()}
        {suffix}
      </p>
    </div>
  );
}

export default function BarChart({
  data,
  layout = "horizontal",
  valuePrefix = "",
  valueSuffix = "",
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-ink-faint text-sm">
        No data
      </div>
    );
  }

  // Height auto-scales: 30px per item + 40px padding
  const chartHeight = data.length * 30 + 40;

  const isHorizontal = layout === "horizontal";

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <RechartsBarChart
        data={data}
        layout={isHorizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#E2E8F0"
          horizontal={!isHorizontal}
          vertical={isHorizontal}
        />
        {isHorizontal ? (
          <>
            <XAxis
              type="number"
              tick={{
                fontSize: 11,
                fill: "#94A3B8",
                fontFamily: '"JetBrains Mono", Menlo, monospace',
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{
                fontSize: 12,
                fill: "#64748B",
                fontFamily: '"DM Sans", system-ui, sans-serif',
              }}
              axisLine={false}
              tickLine={false}
            />
          </>
        ) : (
          <>
            <XAxis
              type="category"
              dataKey="name"
              tick={{
                fontSize: 12,
                fill: "#64748B",
                fontFamily: '"DM Sans", system-ui, sans-serif',
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="number"
              tick={{
                fontSize: 11,
                fill: "#94A3B8",
                fontFamily: '"JetBrains Mono", Menlo, monospace',
              }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
          </>
        )}
        <Tooltip
          content={<CustomTooltip prefix={valuePrefix} suffix={valueSuffix} />}
        />
        <Bar
          dataKey="value"
          radius={
            isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
          }
          maxBarSize={24}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? PALETTE[index % PALETTE.length]}
            />
          ))}
          <LabelList
            dataKey="value"
            position={isHorizontal ? "right" : "top"}
            formatter={(v: number) => formatLabel(v, valuePrefix, valueSuffix)}
            style={{
              fontSize: 11,
              fill: "#64748B",
              fontFamily: '"JetBrains Mono", Menlo, monospace',
            }}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
