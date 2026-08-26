/**
 * xbrl.ts — SEC EDGAR XBRL API wrapper for GAAP Tracker.
 *
 * Server-only module. Uses Next.js ISR cache (6h revalidation).
 *
 * Endpoints:
 *   Frames API:        https://data.sec.gov/api/xbrl/frames/{taxonomy}/{tag}/{unit}/{period}.json
 *   Company Facts API: https://data.sec.gov/api/xbrl/companyfacts/CIK{cik10}.json
 */

// server-only — do not import from client components
import type { XbrlFiler } from "./types";

const BASE = "https://data.sec.gov/api/xbrl";
const HEADERS = { "User-Agent": "GAAP-Tracker research@gaap-tracker.org" };

// Fields order returned by the Frames API data arrays.
const FRAMES_FIELDS = ["accn", "cik", "entityName", "loc", "end", "val"] as const;

type FramesApiRow = [string, number, string, string, string, number];

interface FramesApiResponse {
  taxonomy: string;
  tag: string;
  cik: string;
  entityName: string;
  loc: string;
  end: string;
  data: FramesApiRow[];
  fields?: string[];
}

async function fetchJson<T>(url: string): Promise<T> {
  // Next.js extends RequestInit with `next` for ISR cache control (6h revalidate).
  // Cast needed when `next` types are not yet installed in node_modules.
  const fetchOpts = { headers: HEADERS, next: { revalidate: 21600 } } as RequestInit;
  const res = await fetch(url, fetchOpts);
  if (!res.ok) {
    console.error(`EDGAR ${res.status} for ${url}`);
    return {} as T;
  }
  return res.json() as Promise<T>;
}

export function padCik(cik: string | number): string {
  return String(Number(cik)).padStart(10, "0");
}

export async function getFrames(
  tag: string,
  opts?: { unit?: string; period?: string; taxonomy?: string }
): Promise<XbrlFiler[]> {
  const unit = opts?.unit ?? "USD";
  const period = opts?.period ?? "CY2024Q4I";
  const taxonomy = opts?.taxonomy ?? "us-gaap";

  const url = `${BASE}/frames/${taxonomy}/${tag}/${unit}/${period}.json`;
  const body = await fetchJson<FramesApiResponse>(url);

  const rows: any[] = body.data ?? [];

  return rows.map((row: any) => ({
    cik: (row.cik ?? row[1]) as number,
    entityName: (row.entityName ?? row[2]) as string,
    value: (row.val ?? row[5]) as number,
    filed: (row.end ?? row[4]) as string,
    period,
    tag,
  }));
}

export async function getCompanyFacts(cik: string): Promise<unknown> {
  const cik10 = padCik(cik);
  const url = `${BASE}/companyfacts/CIK${cik10}.json`;
  return fetchJson<unknown>(url);
}

export async function getDerivativeFilers(period?: string): Promise<XbrlFiler[]> {
  return getFrames("DerivativeAssets", { period });
}

export async function getFairValueFilers(period?: string): Promise<XbrlFiler[]> {
  return getFrames(
    "FairValueMeasurementWithUnobservableInputsReconciliationRecurringBasisAssetValue",
    { period }
  );
}
