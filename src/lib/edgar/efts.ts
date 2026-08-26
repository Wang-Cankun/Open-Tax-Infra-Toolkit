"use server";

import type { Filing, SearchResult, TimelinePoint } from "./types";

const BASE_URL = "https://efts.sec.gov/LATEST/search-index";
const HEADERS = { "User-Agent": "GAAP-Tracker research@gaap-tracker.org" };
const FETCH_OPTS = { next: { revalidate: 21600 } } as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFiling(hit: any): Filing {
  const src = hit._source ?? {};
  return {
    accessionNumber: src.file_num ?? hit._id ?? "",
    companyName: src.display_names?.[0] ?? src.entity_name ?? "",
    cik: src.ciks?.[0] ?? "",
    formType: src.form_type ?? "",
    fileDate: src.file_date ?? "",
    periodEnding: src.period_of_report ?? "",
  };
}

export async function searchFilings(
  query: string,
  opts?: {
    forms?: string[];
    startDate?: string;
    endDate?: string;
    start?: number;
    limit?: number;
  },
): Promise<SearchResult> {
  const { forms, startDate, endDate, start = 0, limit = 50 } = opts ?? {};

  const params = new URLSearchParams();
  params.set("q", query);
  if (startDate || endDate) params.set("dateRange", "custom");
  if (startDate) params.set("startdt", startDate);
  if (endDate) params.set("enddt", endDate);
  params.set("from", String(start));
  params.set("size", String(limit));
  if (forms?.length) params.set("forms", forms.join(","));

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: HEADERS,
    ...FETCH_OPTS,
  });
  if (!res.ok) {
    console.error(`EFTS ${res.status} for query: ${query}`);
    return { total: 0, filings: [] };
  }

  const data = await res.json();
  const hits: unknown[] = data?.hits?.hits ?? [];
  const total: number = data?.hits?.total?.value ?? 0;

  return { total, filings: hits.map(extractFiling) };
}

export async function countFilings(
  query: string,
  opts?: { forms?: string[]; startDate?: string; endDate?: string },
): Promise<number> {
  const { total } = await searchFilings(query, { ...opts, start: 0, limit: 1 });
  return total;
}

export async function searchAllFilings(
  query: string,
  opts?: { forms?: string[]; startDate?: string; endDate?: string },
): Promise<Filing[]> {
  const PAGE_SIZE = 50;
  const results: Filing[] = [];
  let start = 0;

  while (true) {
    const { total, filings } = await searchFilings(query, {
      ...opts,
      start,
      limit: PAGE_SIZE,
    });
    if (!filings.length) break;
    results.push(...filings);
    start += filings.length;
    if (start >= total) break;
  }

  return results;
}

export async function searchTopic832(startDate?: string): Promise<Filing[]> {
  const queries = ['"ASU 2025-10"', '"Topic 832"', '"ASC 832"'];
  const forms = ["10-K", "10-Q"];

  const seen = new Set<string>();
  const results: Filing[] = [];

  for (const q of queries) {
    const filings = await searchAllFilings(q, { forms, startDate });
    for (const filing of filings) {
      if (!seen.has(filing.accessionNumber)) {
        seen.add(filing.accessionNumber);
        results.push(filing);
      }
    }
  }

  return results;
}

export async function searchByAscTopic(
  topic: string,
  startDate?: string,
): Promise<Filing[]> {
  return searchAllFilings(`"ASC ${topic}"`, {
    forms: ["10-K", "10-Q"],
    startDate,
  });
}

export async function getTopic832Timeline(
  startDate?: string,
): Promise<TimelinePoint[]> {
  const filings = await searchTopic832(startDate);

  const monthMap = new Map<string, { count: number; ciks: Set<string> }>();

  for (const filing of filings) {
    const month = filing.fileDate.slice(0, 7); // "YYYY-MM"
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
    }));
}
