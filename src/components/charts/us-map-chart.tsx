"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./us-map-inner"), { ssr: false });

interface USMapChartProps {
  data: Record<string, number>;
  valuePrefix?: string;
  valueSuffix?: string;
  colorScale?: "navy" | "teal" | "amber";
}

export default function USMapChart(props: USMapChartProps) {
  return <MapInner {...props} />;
}
