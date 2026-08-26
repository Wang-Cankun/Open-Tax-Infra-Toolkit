"use client";

import { useState, useRef, useCallback } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

const BASE_COLORS: Record<string, string> = {
  navy: "#003366",
  teal: "#0891B2",
  amber: "#D97706",
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function interpolateColor(t: number, base: string): string {
  const start = hexToRgb("#F8FAFC");
  const end = hexToRgb(base);
  const r = Math.round(start[0] + (end[0] - start[0]) * t);
  const g = Math.round(start[1] + (end[1] - start[1]) * t);
  const b = Math.round(start[2] + (end[2] - start[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function formatValue(value: number, prefix = "", suffix = ""): string {
  if (value >= 1e9) return `${prefix}${(value / 1e9).toFixed(1)}B${suffix}`;
  if (value >= 1e6) return `${prefix}${(value / 1e6).toFixed(1)}M${suffix}`;
  if (value >= 1e3) return `${prefix}${(value / 1e3).toFixed(0)}K${suffix}`;
  return `${prefix}${value.toLocaleString()}${suffix}`;
}

interface Props {
  data: Record<string, number>;
  valuePrefix?: string;
  valueSuffix?: string;
  colorScale?: "navy" | "teal" | "amber";
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
  value: number;
}

export default function USMapInner({
  data,
  valuePrefix = "",
  valueSuffix = "",
  colorScale = "navy",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const values = Object.values(data);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 1;
  const range = maxVal - minVal || 1;
  const baseColor = BASE_COLORS[colorScale] ?? "#003366";

  const getFillColor = useCallback(
    (stateCode: string) => {
      const value = data[stateCode];
      if (value === undefined) return "#F1F5F9";
      const t = (value - minVal) / range;
      return interpolateColor(t, baseColor);
    },
    [data, minVal, range, baseColor]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, stateName: string, stateCode: string) => {
      const value = data[stateCode];
      if (value === undefined) {
        setTooltip(null);
        return;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        name: stateName,
        value,
      });
    },
    [data]
  );

  if (!values.length) {
    return <p className="text-sm text-ink-faint">No geographic data available.</p>;
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: 440 }}>
      <ComposableMap
        projection="geoAlbersUsa"
        style={{ width: "100%", height: 400 }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => {
              const fips = String(geo.id);
              const stateCode = FIPS_TO_STATE[fips] ?? "";
              const fillColor = getFillColor(stateCode);
              const stateName: string = geo.properties?.name ?? stateCode;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fillColor}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  onMouseMove={(e: React.MouseEvent) =>
                    handleMouseMove(e, stateName, stateCode)
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", opacity: 0.85 },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-rule bg-white px-3 py-2 shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <p className="text-xs font-semibold text-ink">{tooltip.name}</p>
          <p className="mt-0.5 font-mono text-sm text-ink-muted">
            {formatValue(tooltip.value, valuePrefix, valueSuffix)}
          </p>
        </div>
      )}

      {values.length > 0 && (
        <div className="mt-1 flex flex-col items-center gap-1">
          <div
            className="h-3 w-64 rounded"
            style={{
              background: `linear-gradient(to right, ${interpolateColor(0, baseColor)}, ${interpolateColor(1, baseColor)})`,
            }}
          />
          <div className="flex w-64 justify-between">
            <span className="font-mono text-xs text-ink-muted">
              {formatValue(minVal, valuePrefix, valueSuffix)}
            </span>
            <span className="font-mono text-xs text-ink-muted">
              {formatValue(maxVal, valuePrefix, valueSuffix)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
