/**
 * Pre-download all data into public/data/ as static JSON files.
 * Run: bun scripts/refresh-data.ts
 *
 * Data sources:
 *   - SEC EDGAR EFTS (full-text search) — filing counts + metadata
 *   - SEC EDGAR XBRL Frames — structured financial data by company
 *   - SEC company_tickers.json — CIK/ticker/name mapping
 *   - SEC SIC codes — industry classification
 *   - USAspending.gov — federal grants (CHIPS/IRA/IIJA)
 */

const BASE_EFTS = "https://efts.sec.gov/LATEST/search-index";
const BASE_XBRL = "https://data.sec.gov/api/xbrl/frames";
const HEADERS = { "User-Agent": "GAAP-Tracker research@gaap-tracker.org" };
const OUT_DIR = "public/data";

// --- Areas config ---
const AREAS = [
  { slug: "topic-832", queries: ['"ASU 2025-10"', '"Topic 832"', '"ASC 832"'], forms: "10-K,10-Q", startDate: "2025-01-01", xbrl: null },
  { slug: "asc-815", queries: ['"ASC 815"'], forms: "10-K,10-Q", xbrl: { tag: "DerivativeAssets", unit: "USD", period: "CY2024Q4I" } },
  { slug: "asc-820", queries: ['"ASC 820"'], forms: "10-K,10-Q", xbrl: { tag: "FairValueMeasurementWithUnobservableInputsReconciliationRecurringBasisAssetValue", unit: "USD", period: "CY2024Q4I" } },
  { slug: "asc-810", queries: ['"ASC 810"'], forms: "10-K,10-Q", xbrl: null },
  { slug: "asc-842", queries: ['"ASC 842"'], forms: "10-K,10-Q", xbrl: { tag: "OperatingLeaseLiability", unit: "USD", period: "CY2024Q4I" } },
  { slug: "asc-606", queries: ['"ASC 606"'], forms: "10-K,10-Q", xbrl: { tag: "Revenues", unit: "USD", period: "CY2024" } },
  { slug: "asc-326", queries: ['"ASC 326"'], forms: "10-K,10-Q", xbrl: { tag: "FinancingReceivableAllowanceForCreditLosses", unit: "USD", period: "CY2024Q4I" } },
  { slug: "asc-718", queries: ['"ASC 718"'], forms: "10-K,10-Q", xbrl: { tag: "AllocatedShareBasedCompensationExpense", unit: "USD", period: "CY2024" } },
  { slug: "asc-740", queries: ['"ASC 740"'], forms: "10-K,10-Q", xbrl: { tag: "DeferredIncomeTaxLiabilities", unit: "USD", period: "CY2024Q4I" } },
  { slug: "asc-350", queries: ['"ASC 350"', '"goodwill impairment"', '"ASC 350-20"'], forms: "10-K,10-Q", xbrl: { tag: "Goodwill", unit: "USD", period: "CY2024Q4I" } },
  { slug: "restatements", queries: ['"restatement"'], forms: "10-K/A,10-Q/A", startDate: "2024-01-01", limit: 200, xbrl: null },
];

// Date windows for breaking the 10,000 EFTS cap
const YEAR_WINDOWS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];

interface Filing {
  accessionNumber: string;
  companyName: string;
  cik: string;
  formType: string;
  fileDate: string;
  periodEnding: string;
}

function extractFiling(hit: any): Filing {
  const src = hit._source ?? {};
  return {
    accessionNumber: src.file_num ?? hit._id ?? "",
    companyName: src.display_names?.[0] ?? src.entity_name ?? "",
    cik: String(src.ciks?.[0] ?? ""),
    formType: src.form_type ?? "",
    fileDate: src.file_date ?? "",
    periodEnding: src.period_of_report ?? "",
  };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function searchPage(query: string, forms: string, startDate?: string, endDate?: string, start = 0, limit = 50) {
  const params = new URLSearchParams({ q: query, from: String(start), size: String(limit), forms });
  if (startDate || endDate) {
    params.set("dateRange", "custom");
    if (startDate) params.set("startdt", startDate);
    if (endDate) params.set("enddt", endDate);
  }
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(200 + attempt * 500);
    res = await fetch(`${BASE_EFTS}?${params}`, { headers: HEADERS });
    if (res.ok) break;
    if (attempt < 2) console.error(`  EFTS ${res.status} retry ${attempt + 1} for ${query}`);
  }
  if (!res || !res.ok) { console.error(`  EFTS FAILED for ${query} [${startDate}-${endDate}]`); return { total: 0, hits: [] }; }
  const data = await res.json();
  return { total: data?.hits?.total?.value ?? 0, hits: data?.hits?.hits ?? [] };
}

// Paginate through one date window (max 10,000 per window)
async function searchWindow(query: string, forms: string, startDate: string, endDate: string, maxPerWindow = 5000): Promise<Filing[]> {
  const results: Filing[] = [];
  let start = 0;
  const pageSize = 50;

  while (true) {
    const { total, hits } = await searchPage(query, forms, startDate, endDate, start, pageSize);
    if (!hits.length) break;
    results.push(...hits.map(extractFiling));
    start += hits.length;
    if (start >= total || start >= maxPerWindow) break;
  }
  return results;
}

// Search with date windowing to break the 2000/10000 cap
async function searchAllWindowed(query: string, forms: string, areaStartDate?: string): Promise<Filing[]> {
  const allResults: Filing[] = [];
  const seen = new Set<string>();

  for (const year of YEAR_WINDOWS) {
    const startDate = areaStartDate && areaStartDate > `${year}-01-01` ? areaStartDate : `${year}-01-01`;
    const endDate = `${year}-12-31`;
    if (areaStartDate && endDate < areaStartDate) continue;

    const filings = await searchWindow(query, forms, startDate, endDate);
    for (const f of filings) {
      if (!seen.has(f.accessionNumber)) {
        seen.add(f.accessionNumber);
        allResults.push(f);
      }
    }
    if (filings.length > 0) {
      process.stdout.write(`    ${year}: ${filings.length} `);
    }
  }
  return allResults;
}

// Simple search with limit (for restatements)
async function searchLimited(query: string, forms: string, startDate?: string, limit = 200): Promise<Filing[]> {
  const results: Filing[] = [];
  let start = 0;
  while (results.length < limit) {
    const { hits } = await searchPage(query, forms, startDate, undefined, start, 50);
    if (!hits.length) break;
    results.push(...hits.map(extractFiling));
    start += hits.length;
  }
  return results.slice(0, limit);
}

async function fetchXbrl(tag: string, unit: string, period = "CY2024Q4I"): Promise<any[]> {
  const url = `${BASE_XBRL}/us-gaap/${tag}/${unit}/${period}.json`;
  await sleep(200);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) { console.error(`  XBRL ${res.status} for ${tag}`); return []; }
  const data = await res.json();
  const rows: any[] = data?.data ?? [];
  return rows
    .map((row: any) => ({
      cik: row.cik ?? row[1],
      entityName: row.entityName ?? row[2],
      value: row.val ?? row[5],
      filed: row.end ?? row[4],
    }))
    .filter((f: any) => f.entityName && !isNaN(f.value) && f.value > 0);
}

// --- SIC code mapping ---
async function downloadSicCodes(): Promise<void> {
  console.log("\n=== SIC Codes ===");
  const url = "https://www.sec.gov/files/company_tickers.json";
  await sleep(200);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) { console.error(`SIC download failed: ${res.status}`); return; }
  const data = await res.json();
  // Extract unique tickers for CIK mapping
  const entries = Object.values(data) as any[];
  console.log(`  ${entries.length} companies`);
  await Bun.write(`${OUT_DIR}/company-tickers.json`, JSON.stringify(data));

  // SIC mapping (hardcoded top industries)
  const sicMap: Record<string, string> = {
    "1000": "Metal Mining", "1311": "Crude Petroleum & Gas", "1389": "Oil & Gas Services",
    "2000": "Food & Kindred Products", "2080": "Beverages", "2300": "Apparel",
    "2711": "Newspapers", "2741": "Miscellaneous Publishing", "2761": "Manifold Business Forms",
    "2800": "Chemicals", "2810": "Industrial Chemicals", "2820": "Plastics & Synthetic",
    "2830": "Drugs", "2834": "Pharmaceutical Preparations", "2836": "Biological Products",
    "2860": "Industrial Chemicals", "2911": "Petroleum Refining",
    "3411": "Metal Cans", "3559": "Special Industry Machinery", "3569": "General Industrial Machinery",
    "3570": "Computer & Office Equipment", "3572": "Computer Storage Devices",
    "3576": "Computer Communications Equipment", "3577": "Computer Peripheral Equipment",
    "3580": "Refrigeration & Service Industry Machinery", "3590": "Misc Industrial & Commercial Machinery",
    "3621": "Motors & Generators", "3630": "Household Appliances",
    "3661": "Telephone & Telegraph Apparatus", "3669": "Communications Equipment",
    "3672": "Printed Circuit Boards", "3674": "Semiconductors",
    "3679": "Electronic Components", "3711": "Motor Vehicles & Passenger Car Bodies",
    "3714": "Motor Vehicle Parts & Accessories", "3720": "Aircraft & Parts",
    "3812": "Defense Electronics", "3825": "Instruments for Measuring",
    "3826": "Laboratory Analytical Instruments", "3827": "Optical Instruments & Lenses",
    "3841": "Surgical & Medical Instruments", "3845": "Electromedical & Electrotherapeutic",
    "3861": "Photographic Equipment & Supplies",
    "4011": "Railroads", "4013": "Railroad Switching",
    "4210": "Trucking", "4213": "Trucking (No Local)", "4412": "Deep Sea Foreign Transportation",
    "4511": "Air Transportation", "4512": "Air Transportation, Scheduled",
    "4522": "Air Transportation, Nonscheduled", "4581": "Airports, Flying Fields",
    "4731": "Freight Transportation Arrangement",
    "4812": "Telephone Communications", "4813": "Telephone Communications",
    "4822": "Telegraph & Other Message Communications",
    "4833": "Television Broadcasting", "4841": "Cable & Other Pay TV",
    "4899": "Communications Services",
    "4911": "Electric Services", "4922": "Natural Gas Distribution",
    "4931": "Electric & Other Services Combined", "4941": "Water Supply",
    "4953": "Refuse Systems", "4955": "Hazardous Waste Management",
    "5000": "Durable Goods - Wholesale", "5040": "Professional & Commercial Equipment",
    "5045": "Computers & Computer Peripherals", "5047": "Medical & Hospital Equipment",
    "5065": "Electronic Parts & Equipment",
    "5122": "Drugs, Drug Proprietaries & Druggists' Sundries",
    "5141": "Groceries & Related Products", "5160": "Chemicals & Allied Products",
    "5200": "Building Materials", "5311": "Department Stores", "5331": "Variety Stores",
    "5411": "Grocery Stores", "5412": "Convenience Stores", "5500": "Auto Dealers",
    "5531": "Auto & Home Supply Stores", "5600": "Apparel & Accessory Stores",
    "5621": "Women's Clothing Stores", "5651": "Family Clothing Stores",
    "5700": "Home Furniture & Equipment", "5731": "Radio, TV & Consumer Electronics",
    "5812": "Eating Places", "5912": "Drug Stores & Proprietary Stores",
    "5940": "Sporting Goods & Hobby", "5944": "Jewelry Stores", "5945": "Hobby, Toy & Game Shops",
    "5961": "Catalog & Mail-Order Houses", "5990": "Retail Stores, NEC",
    "6020": "State Commercial Banks", "6021": "National Commercial Banks",
    "6022": "State Commercial Banks - Federal Reserve", "6035": "Savings Institutions",
    "6099": "Functions Related to Deposit Banking",
    "6111": "Federal-Sponsored Credit Agencies", "6141": "Personal Credit Institutions",
    "6153": "Short-Term Business Credit", "6159": "Federal-Sponsored Credit Agencies",
    "6162": "Mortgage Bankers & Loan Correspondents",
    "6199": "Finance Services", "6200": "Security & Commodity Services",
    "6211": "Security Brokers & Dealers", "6282": "Investment Advice",
    "6311": "Life Insurance", "6321": "Accident & Health Insurance",
    "6324": "Hospital & Medical Service Plans", "6331": "Fire, Marine & Casualty Insurance",
    "6350": "Surety Insurance", "6399": "Services Allied with Exchange of Securities",
    "6500": "Real Estate", "6510": "Real Estate Operators", "6512": "Operators of Apartment Buildings",
    "6531": "Real Estate Agents & Managers", "6552": "Land Subdividers & Developers",
    "6726": "Investment Offices",
    "7011": "Hotels & Motels", "7200": "Personal Services",
    "7310": "Services To Buildings & Dwellings", "7320": "Services to Dwellings & Other Buildings",
    "7363": "Help Supply Services", "7370": "Computer Programming & Data Processing",
    "7371": "Computer Programming, Data Processing", "7372": "Prepackaged Software",
    "7374": "Computer Processing & Data Preparation", "7380": "Misc Business Services",
    "7389": "Services, NEC",
    "7812": "Motion Picture & Tape Distribution", "7819": "Services Allied to Motion Picture Production",
    "7900": "Amusement & Recreation Services", "7990": "Services, NEC",
    "8000": "Health Services", "8011": "Offices & Clinics of Doctors",
    "8049": "Offices & Clinics of Other Health Practitioners",
    "8051": "Skilled Nursing Care Facilities", "8060": "Hospitals",
    "8062": "General Medical & Surgical Hospitals",
    "8071": "Health Services", "8082": "Home Health Care Services",
    "8090": "Health Services, NEC", "8093": "Specialty Outpatient Facilities",
    "8111": "Legal Services", "8200": "Educational Services",
    "8300": "Social Services", "8700": "Engineering & Management Services",
    "8711": "Engineering Services", "8731": "Commercial Physical & Biological Research",
    "8734": "Testing Laboratories", "8741": "Management Services",
    "8742": "Management Consulting Services", "8900": "Services, NEC",
  };
  await Bun.write(`${OUT_DIR}/sic-codes.json`, JSON.stringify(sicMap, null, 2));
  console.log(`  ${Object.keys(sicMap).length} SIC codes mapped`);
}

// --- USAspending.gov federal grants ---
async function downloadGrants(): Promise<void> {
  console.log("\n=== Federal Grants (USAspending) ===");
  const baseUrl = "https://api.usaspending.gov/api/v2";

  // Search for CHIPS Act awards
  const programs = [
    { name: "CHIPS Act", cfda: "11.032", keyword: "CHIPS" },
    { name: "IRA Clean Energy", cfda: "", keyword: "Inflation Reduction Act" },
    { name: "Infrastructure (IIJA)", cfda: "", keyword: "Infrastructure Investment" },
  ];

  const allGrants: any[] = [];

  for (const prog of programs) {
    console.log(`  Searching: ${prog.name}`);
    await sleep(300);

    const body: any = {
      filters: {
        time_period: [{ start_date: "2022-01-01", end_date: "2026-12-31" }],
        award_type_codes: ["02", "03", "04", "05"], // grants
      },
      fields: ["Award ID", "Recipient Name", "Award Amount", "Awarding Agency", "Start Date", "Description", "recipient_id", "Place of Performance State Code"],
      limit: 100,
      page: 1,
      sort: "Award Amount",
      order: "desc",
    };

    if (prog.keyword) {
      body.filters.keywords = [prog.keyword];
    }

    try {
      const res = await fetch(`${baseUrl}/search/spending_by_award/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error(`  USAspending ${res.status} for ${prog.name}`);
        continue;
      }

      const data = await res.json();
      const results = data?.results ?? [];
      console.log(`    ${results.length} awards found`);

      for (const r of results) {
        allGrants.push({
          program: prog.name,
          awardId: r["Award ID"],
          recipient: r["Recipient Name"],
          amount: r["Award Amount"],
          agency: r["Awarding Agency"],
          startDate: r["Start Date"],
          description: r["Description"]?.slice(0, 200),
          state: r["Place of Performance State Code"],
        });
      }
    } catch (e: any) {
      console.error(`  Error fetching ${prog.name}: ${e.message}`);
    }
  }

  // Summary stats
  const byProgram: Record<string, { count: number; totalAmount: number }> = {};
  for (const g of allGrants) {
    const p = g.program;
    if (!byProgram[p]) byProgram[p] = { count: 0, totalAmount: 0 };
    byProgram[p].count++;
    byProgram[p].totalAmount += g.amount || 0;
  }

  const byState: Record<string, number> = {};
  for (const g of allGrants) {
    if (g.state) byState[g.state] = (byState[g.state] || 0) + (g.amount || 0);
  }

  await Bun.write(`${OUT_DIR}/federal-grants.json`, JSON.stringify({
    refreshedAt: new Date().toISOString(),
    totalGrants: allGrants.length,
    byProgram,
    byState,
    grants: allGrants,
  }, null, 2));

  console.log(`  Total: ${allGrants.length} grants`);
}

// --- SEC Enforcement ---
async function downloadEnforcement(): Promise<void> {
  console.log("\n=== SEC Enforcement ===");

  // Search EFTS for enforcement-related 8-K filings and litigation releases
  const queries = [
    { name: "Accounting fraud", query: '"accounting fraud"', forms: "8-K,LIT" },
    { name: "Restatement + material weakness", query: '"material weakness" "restatement"', forms: "10-K,10-Q,8-K" },
    { name: "SEC enforcement action", query: '"SEC enforcement" "accounting"', forms: "8-K,LIT" },
  ];

  const results: any[] = [];
  const yearCounts: Record<string, Record<string, number>> = {};

  for (const q of queries) {
    console.log(`  ${q.name}`);
    for (const year of ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]) {
      const filings = await searchWindow(q.query, q.forms, `${year}-01-01`, `${year}-12-31`, 500);
      if (!yearCounts[year]) yearCounts[year] = {};
      yearCounts[year][q.name] = filings.length;
      if (filings.length > 0) {
        results.push(...filings.slice(0, 50).map(f => ({ ...f, category: q.name, year })));
      }
    }
  }

  await Bun.write(`${OUT_DIR}/enforcement.json`, JSON.stringify({
    refreshedAt: new Date().toISOString(),
    yearCounts,
    recentFilings: results.slice(0, 200),
  }, null, 2));

  console.log(`  ${results.length} enforcement-related filings`);
}

// --- Main ---
async function main() {
  const summary: Record<string, { filingCount: number; xbrlCount: number }> = {};

  // Phase 1: EFTS + XBRL for all 11 areas
  for (const area of AREAS) {
    console.log(`\n--- ${area.slug} ---`);

    let allFilings: Filing[] = [];
    const seen = new Set<string>();

    if ((area as any).limit) {
      // Restatements: limited, no windowing
      console.log(`  EFTS (limited to ${(area as any).limit}):`);
      allFilings = await searchLimited(area.queries[0], area.forms, (area as any).startDate, (area as any).limit);
    } else {
      // All other areas: date-windowed search
      for (const query of area.queries) {
        console.log(`  EFTS windowed: ${query}`);
        const filings = await searchAllWindowed(query, area.forms, (area as any).startDate);
        for (const f of filings) {
          if (!seen.has(f.accessionNumber)) { seen.add(f.accessionNumber); allFilings.push(f); }
        }
        console.log();
      }
    }
    console.log(`  Total: ${allFilings.length} filings`);

    // XBRL
    let xbrlFilers: any[] = [];
    if (area.xbrl) {
      console.log(`  XBRL: ${area.xbrl.tag}`);
      xbrlFilers = await fetchXbrl(area.xbrl.tag, area.xbrl.unit, (area.xbrl as any).period);
      console.log(`  ${xbrlFilers.length} filers`);
    }

    const areaData = {
      slug: area.slug,
      refreshedAt: new Date().toISOString(),
      filingCount: allFilings.length,
      filings: allFilings,
      xbrlFilers,
    };
    await Bun.write(`${OUT_DIR}/${area.slug}.json`, JSON.stringify(areaData));
    summary[area.slug] = { filingCount: allFilings.length, xbrlCount: xbrlFilers.length };
  }

  // Write area summary
  await Bun.write(`${OUT_DIR}/summary.json`, JSON.stringify({
    refreshedAt: new Date().toISOString(),
    areas: summary,
  }, null, 2));

  // Phase 2: Additional data sources
  await downloadSicCodes();
  await downloadGrants();
  await downloadEnforcement();

  console.log("\n=== COMPLETE ===");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(console.error);
