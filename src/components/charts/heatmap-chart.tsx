"use client";

import { useState } from "react";

interface HeatmapChartProps {
  rows: string[];
  cols: string[];
  data: Record<string, Record<string, number>>;
  colorScale?: "navy" | "danger" | "amber";
}

const COLOR_MAP = {
  navy: { r: 0, g: 51, b: 102 },
  danger: { r: 185, g: 28, b: 28 },
  amber: { r: 217, g: 119, b: 6 },
};

function interpolateColor(
  intensity: number,
  scale: "navy" | "danger" | "amber"
): string {
  const { r, g, b } = COLOR_MAP[scale];
  const ri = Math.round(255 + (r - 255) * intensity);
  const gi = Math.round(255 + (g - 255) * intensity);
  const bi = Math.round(255 + (b - 255) * intensity);
  return `rgb(${ri},${gi},${bi})`;
}

function textColor(intensity: number): string {
  return intensity > 0.55 ? "#ffffff" : "#1B2332";
}

export default function HeatmapChart({
  rows,
  cols,
  data,
  colorScale = "navy",
}: HeatmapChartProps) {
  const [tooltip, setTooltip] = useState<{
    value: number;
    row: string;
    col: string;
    x: number;
    y: number;
  } | null>(null);

  if (!rows.length || !cols.length) {
    return (
      <div className="flex items-center justify-center h-40 text-ink-faint text-sm">
        No data
      </div>
    );
  }

  // Find global max for normalization
  let maxVal = 0;
  for (const row of rows) {
    for (const col of cols) {
      const v = data[row]?.[col] ?? 0;
      if (v > maxVal) maxVal = v;
    }
  }

  return (
    <div className="relative overflow-x-auto">
      <table className="border-collapse text-xs select-none" style={{ minWidth: cols.length * 56 + 120 }}>
        <thead>
          <tr>
            <th className="w-28 min-w-[7rem]" />
            {cols.map((col) => (
              <th
                key={col}
                className="pb-2 px-1 font-semibold text-ink-muted text-center whitespace-nowrap"
                style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  minWidth: 48,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td
                className="pr-3 py-1 font-semibold text-ink-muted whitespace-nowrap text-right"
                style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
              >
                {row}
              </td>
              {cols.map((col) => {
                const value = data[row]?.[col] ?? 0;
                const intensity = maxVal > 0 ? value / maxVal : 0;
                const bg = interpolateColor(intensity, colorScale);
                const fg = textColor(intensity);
                return (
                  <td key={col} className="p-0.5">
                    <div
                      className="flex items-center justify-center rounded cursor-default transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: bg,
                        color: fg,
                        height: 36,
                        minWidth: 44,
                        fontFamily: '"JetBrains Mono", Menlo, monospace',
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setTooltip({
                          value,
                          row,
                          col,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {value > 0 ? value : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {tooltip && (
        <div
          className="fixed z-50 bg-surface border border-rule rounded-lg px-3 py-2 shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <p className="text-xs font-semibold text-ink-muted">
            {tooltip.row} / {tooltip.col}
          </p>
          <p className="text-sm font-mono font-medium text-ink mt-0.5">
            {tooltip.value.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
