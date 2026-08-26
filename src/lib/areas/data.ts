import { readFile } from "fs/promises";
import { join } from "path";
import type { AreaConfig } from "./types";
import type { Filing, XbrlFiler } from "@/lib/edgar/types";

interface AreaCache {
  slug: string;
  refreshedAt: string;
  filingCount: number;
  filings: Filing[];
  xbrlFilers: XbrlFiler[];
}

interface SummaryCache {
  refreshedAt: string;
  areas: Record<string, { filingCount: number; xbrlCount: number }>;
}

async function loadAreaCache(slug: string): Promise<AreaCache | null> {
  try {
    const filePath = join(process.cwd(), "public", "data", `${slug}.json`);
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function loadSummary(): Promise<SummaryCache | null> {
  try {
    const filePath = join(process.cwd(), "public", "data", "summary.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getAreaFilings(config: AreaConfig): Promise<Filing[]> {
  const cache = await loadAreaCache(config.slug);
  if (!cache) return [];
  if (config.fetchAll === false) {
    return cache.filings.slice(0, config.limit ?? 50);
  }
  return cache.filings;
}

export async function getAreaCount(config: AreaConfig): Promise<number> {
  const summary = await loadSummary();
  if (!summary) return 0;
  return summary.areas[config.slug]?.filingCount ?? 0;
}

export async function getAreaTimeline(
  config: AreaConfig,
): Promise<{ month: string; filingCount: number; companies: number }[]> {
  if (config.fetchAll === false) return [];

  const cache = await loadAreaCache(config.slug);
  if (!cache) return [];

  const monthMap = new Map<string, { count: number; ciks: Set<string> }>();

  for (const filing of cache.filings) {
    const month = filing.fileDate?.slice(0, 7);
    if (!month) continue;
    let entry = monthMap.get(month);
    if (!entry) {
      entry = { count: 0, ciks: new Set() };
      monthMap.set(month, entry);
    }
    entry.count += 1;
    if (filing.cik) entry.ciks.add(filing.cik);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { count, ciks }]) => ({
      month,
      filingCount: count,
      companies: ciks.size,
    }))
    .slice(-12);
}

export async function getAreaXbrlFilers(config: AreaConfig): Promise<XbrlFiler[]> {
  if (!config.xbrl) return [];
  const cache = await loadAreaCache(config.slug);
  if (!cache) return [];
  return cache.xbrlFilers ?? [];
}
