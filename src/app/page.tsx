import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { getAllAreas } from "@/lib/areas/registry";
import TreemapChart from "@/components/charts/treemap-chart";

export const dynamic = "force-dynamic";
export const revalidate = 21600;

const ACCENT_BORDER = {
  navy: "border-l-navy",
  teal: "border-l-teal",
  amber: "border-l-amber",
  danger: "border-l-danger",
} as const;

const ACCENT_TEXT = {
  navy: "text-navy",
  teal: "text-teal",
  amber: "text-amber",
  danger: "text-danger",
} as const;

type SummaryJson = {
  areas: Record<string, { filingCount: number; xbrlCount: number }>;
};

type GrantsJson = {
  totalGrants: number;
  byProgram: Record<string, { count: number; totalAmount: number }>;
};

type EnforcementJson = {
  yearCounts: Record<string, Record<string, number>>;
};

function formatBillions(amount: number): string {
  const b = amount / 1_000_000_000;
  return b >= 10 ? `$${Math.round(b)}B` : `$${b.toFixed(1)}B`;
}

export default async function Home() {
  const dataDir = path.join(process.cwd(), "public", "data");

  const [summaryRaw, grantsRaw, enforcementRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, "summary.json"), "utf-8"),
    fs.readFile(path.join(dataDir, "federal-grants.json"), "utf-8"),
    fs.readFile(path.join(dataDir, "enforcement.json"), "utf-8"),
  ]);

  const summary: SummaryJson = JSON.parse(summaryRaw);
  const grants: GrantsJson = JSON.parse(grantsRaw);
  const enforcement: EnforcementJson = JSON.parse(enforcementRaw);

  // Aggregate stats
  const summaryAreas = Object.values(summary.areas);
  const totalFilings = summaryAreas.reduce((s, a) => s + a.filingCount, 0);
  const totalCompanies = summaryAreas.reduce((s, a) => s + a.xbrlCount, 0);

  const totalGrantAmount = Object.values(grants.byProgram).reduce(
    (s, p) => s + p.totalAmount,
    0
  );

  const totalEnforcement = Object.values(enforcement.yearCounts).reduce(
    (yearSum, cats) =>
      yearSum + Object.values(cats).reduce((s, v) => s + v, 0),
    0
  );

  // Build area list with counts from summary, sorted by filingCount desc
  const areas = getAllAreas();
  const areasWithCounts = areas
    .map((area) => ({
      area,
      filingCount: summary.areas[area.slug]?.filingCount ?? 0,
      xbrlCount: summary.areas[area.slug]?.xbrlCount ?? 0,
    }))
    .sort((a, b) => b.filingCount - a.filingCount);

  // Build treemap data
  const AREA_COLORS: Record<string, string> = {
    "navy": "#003366",
    "teal": "#0891B2",
    "amber": "#D97706",
    "danger": "#B91C1C",
  };

  const treemapData = areas
    .map((area) => ({
      name: area.shortName,
      value: summary.areas[area.slug]?.filingCount ?? 0,
      color: AREA_COLORS[area.accent] ?? "#003366",
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-8">
        <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight text-ink leading-tight">
          How are companies implementing<br />
          new accounting standards?
        </h1>
        <p className="mt-4 text-lg text-ink-muted max-w-2xl leading-relaxed">
          When the FASB issues a complex standard, companies interpret it
          differently. This tool tracks those differences across 11 areas of
          U.S. GAAP using SEC EDGAR public filing data, so practitioners can
          see how peer companies are handling the same accounting questions.
        </p>
        <p className="mt-3 text-base font-mono text-ink-muted">
          Analyzing{" "}
          <span className="text-ink font-semibold">
            {totalFilings.toLocaleString()}+
          </span>{" "}
          SEC filings across{" "}
          <span className="text-ink font-semibold">11</span> accounting standard
          areas
        </p>
      </section>

      {/* Headline stats row */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-rule rounded-lg p-5">
            <p className="text-3xl font-display font-semibold text-ink">
              {totalFilings >= 100000
                ? `${Math.floor(totalFilings / 1000)}K+`
                : totalFilings.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-ink-muted">SEC filings analyzed</p>
          </div>
          <div className="bg-surface border border-rule rounded-lg p-5">
            <p className="text-3xl font-display font-semibold text-ink">11</p>
            <p className="mt-1 text-sm text-ink-muted">GAAP areas tracked</p>
          </div>
          <div className="bg-surface border border-rule rounded-lg p-5">
            <p className="text-3xl font-display font-semibold text-ink">
              {grants.totalGrants.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Federal grants tracked
            </p>
          </div>
          <div className="bg-surface border border-rule rounded-lg p-5">
            <p className="text-3xl font-display font-semibold text-ink">
              {totalCompanies >= 1000
                ? `${(totalCompanies / 1000).toFixed(1)}K+`
                : totalCompanies.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Companies with XBRL data
            </p>
          </div>
        </div>
      </section>

      {/* Filing Volume Treemap */}
      <section>
        <h2 className="text-2xl font-display font-semibold mb-2">Filing Volume by Area</h2>
        <p className="text-sm text-ink-muted mb-4">Relative volume of SEC filings referencing each accounting standard area.</p>
        <div className="bg-surface border border-rule rounded-lg p-6">
          <TreemapChart data={treemapData} />
        </div>
      </section>

      {/* Area card grid */}
      <section>
        <h2 className="text-xl font-display font-semibold text-ink mb-4">
          Browse by accounting standard
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areasWithCounts.map(({ area, filingCount, xbrlCount }) => (
            <Link
              key={area.slug}
              href={`/areas/${area.slug}`}
              className={`bg-surface rounded-lg border border-rule border-l-4 ${ACCENT_BORDER[area.accent]} p-5 hover:shadow-md transition-shadow group`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink">{area.shortName}</p>
                {filingCount >= 5000 && (
                  <span
                    className={`shrink-0 text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-surface border border-rule ${ACCENT_TEXT[area.accent]}`}
                  >
                    {filingCount.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-muted leading-snug">
                {area.description}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-sm font-mono text-ink-muted">
                  {filingCount > 0
                    ? `${filingCount.toLocaleString()} filings`
                    : "—"}
                </p>
                {xbrlCount > 0 && (
                  <p className="text-xs text-ink-muted">
                    {xbrlCount.toLocaleString()} with XBRL
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured sections */}
      <section className="grid md:grid-cols-2 gap-6">
        {/* Federal grants spotlight */}
        <div className="bg-surface border border-rule border-l-4 border-l-teal rounded-lg p-6 flex flex-col">
          <p className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">
            Featured
          </p>
          <h3 className="text-lg font-display font-semibold text-ink">
            Federal Grants Accounting
          </h3>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed flex-1">
            Tracking{" "}
            <span className="font-semibold text-ink">
              {formatBillions(totalGrantAmount)}
            </span>{" "}
            in federal funding across{" "}
            <span className="font-semibold text-ink">
              {grants.totalGrants}
            </span>{" "}
            grants under the CHIPS Act, Inflation Reduction Act, and
            Infrastructure programs. Topic 832 — the first U.S. GAAP standard
            for government grants — is now in effect.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono text-ink-muted">
            {Object.entries(grants.byProgram).map(([name, prog]) => (
              <span
                key={name}
                className="px-2 py-1 bg-surface border border-rule rounded"
              >
                {name}: {formatBillions(prog.totalAmount)}
              </span>
            ))}
          </div>
          <Link
            href="/federal-grants"
            className="mt-4 text-sm font-medium text-teal hover:underline"
          >
            View federal grants data →
          </Link>
        </div>

        {/* Enforcement spotlight */}
        <div className="bg-surface border border-rule border-l-4 border-l-danger rounded-lg p-6 flex flex-col">
          <p className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">
            Featured
          </p>
          <h3 className="text-lg font-display font-semibold text-ink">
            SEC Enforcement &amp; Restatements
          </h3>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed flex-1">
            <span className="font-semibold text-ink">
              {totalEnforcement.toLocaleString()}
            </span>{" "}
            enforcement-related filings since 2020, covering accounting fraud
            cases, restatements with material weaknesses, and SEC enforcement
            actions. When GAAP judgment goes wrong, it shows up here.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {Object.entries(enforcement.yearCounts)
              .slice(0, 3)
              .map(([year, cats]) => {
                const total = Object.values(cats).reduce((s, v) => s + v, 0);
                return (
                  <div
                    key={year}
                    className="text-center px-2 py-2 bg-surface border border-rule rounded"
                  >
                    <p className="font-mono font-semibold text-ink">{total}</p>
                    <p className="text-ink-muted">{year}</p>
                  </div>
                );
              })}
          </div>
          <Link
            href="/enforcement"
            className="mt-4 text-sm font-medium text-danger hover:underline"
          >
            View enforcement data →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface border border-rule rounded-lg p-8">
        <h2 className="text-2xl font-display font-semibold mb-4">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 text-sm text-ink-muted leading-relaxed">
          <div>
            <p className="font-semibold text-ink mb-2 font-body">
              1. Search SEC filings
            </p>
            <p>
              We use the EDGAR Full-Text Search API to find 10-K and 10-Q
              filings that reference specific accounting standards (ASC 815,
              ASC 820, Topic 832, etc.).
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-2 font-body">
              2. Extract patterns
            </p>
            <p>
              For each filing, we extract the relevant footnote disclosures and
              classify the implementation approach: which recognition method,
              which measurement technique, which presentation format.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink mb-2 font-body">
              3. Track differences
            </p>
            <p>
              We compare across companies and industries. When two companies
              with the same economic transaction choose different accounting
              treatments, that variance becomes visible here.
            </p>
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section className="border-t border-rule pt-6">
        <p className="text-xs font-mono text-ink-muted uppercase tracking-wider mb-3">
          Data sources
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
          <span>SEC EDGAR Full-Text Search</span>
          <span>SEC EDGAR XBRL Viewer</span>
          <span>USAspending.gov</span>
          <span>FASB Accounting Standards Codification</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Data refreshed every 6 hours. Filing counts include 10-K and 10-Q
          filings. XBRL data reflects the most recent structured disclosures
          available in SEC EDGAR.
        </p>
      </section>
    </div>
  );
}
