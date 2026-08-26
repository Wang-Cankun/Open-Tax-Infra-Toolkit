"use client";

import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
} from "recharts";

interface TreemapItem {
  name: string;
  value: number;
  color?: string;
}

interface TreemapChartProps {
  data: TreemapItem[];
}

const DEFAULT_COLORS = [
  "#003366",
  "#0891B2",
  "#D97706",
  "#B91C1C",
  "#004488",
  "#0E7490",
  "#B45309",
  "#991B1B",
];

function formatValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
  root?: { children?: TreemapItem[] };
}

function CustomContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name,
  value,
  index = 0,
  root,
}: CustomContentProps) {
  const item = root?.children?.[index];
  const color = item?.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  const showText = width > 60 && height > 40;
  const showValue = width > 80 && height > 60;

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        style={{ fill: color, stroke: "#ffffff", strokeWidth: 2 }}
        rx={4}
      />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showValue ? 8 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: "#ffffff",
            fontSize: Math.min(14, width / 8),
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontWeight: 600,
          }}
        >
          {name && name.length > 12 ? name.slice(0, 11) + "…" : name}
        </text>
      )}
      {showValue && value !== undefined && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fill: "rgba(255,255,255,0.85)",
            fontSize: Math.min(12, width / 10),
            fontFamily: '"JetBrains Mono", Menlo, monospace',
          }}
        >
          {formatValue(value)}
        </text>
      )}
    </g>
  );
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload as TreemapItem;
  return (
    <div className="bg-surface border border-rule rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
        {name}
      </p>
      <p className="text-sm font-mono font-medium text-ink mt-0.5">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

export default function TreemapChart({ data }: TreemapChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-ink-faint text-sm">
        No data
      </div>
    );
  }

  return (
    <div style={{ minHeight: 300 }}>
      <ResponsiveContainer width="100%" height={300}>
        <Treemap
          data={data}
          dataKey="value"
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
