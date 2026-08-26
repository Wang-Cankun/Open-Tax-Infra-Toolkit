import { readFile } from "fs/promises";
import path from "path";
import MetricCard from "@/components/metric-card";
import SectionIntro from "@/components/section-intro";
import DataTable from "@/components/data-table";
import AreaTimelineChart from "@/components/charts/area-timeline-chart";
import HeatmapChart from "@/components/charts/heatmap-chart";
import DonutChart from "@/components/charts/donut-chart";
import BarChart from "@/components/charts/bar-chart";

export const metadata = { title: "SEC Enforcement | GAAP Analytics" };

interface YearCounts {
  "Accounting fraud": number;
  "Restatement + material weakness": number;
  "SEC enforcement action": number;
}

interface Filing {
  accessionNumber: string | string[];
  companyName: string;
  cik: string;
  formType: string;
  fileDate: string;
  periodEnding: string;
  category: string;
  year: string;
}

interface EnforcementData {
  refreshedAt: string;
  yearCounts: Record<string, YearCounts>;
  recentFilings: Filing[];
}

const CATEGORIES: Array<{
  key: keyof YearCounts;
  label: string;
  barBg: string;
  textColor: string;
  accent: "danger" | "amber" | "navy";
}> = [
  {
    key: "Accounting fraud",
    label: "Accounting Fraud",
    barBg: "bg-danger",
    textColor: "text-danger",
    accent: "danger",
  },
  {
    key: "Restatement + material weakness",
    label: "Restatement + Material Weakness",
    barBg: "bg-amber",
    textColor: "text-amber",
    accent: "amber",
  },
  {
    key: "SEC enforcement action",
    label: "SEC Enforcement Action",
    barBg: "bg-navy",
    textColor: "text-navy",
    accent: "navy",
  },
];

function formatCompanyName(raw: string): string {
  return raw.replace(/\s*\(.*?\)\s*/g, " ").trim().replace(/\s+/g, " ") || raw.trim();
}

export default async function EnforcementPage() {
  const filePath = path.join(process.cwd(), "public", "data", "enforcement.json");
  const raw = await readFile(filePath, "utf-8");
  const data: EnforcementData = JSON.parse(raw);

  const years = Object.keys(data.yearCounts).sort();
  const yearRange =
    years.length >= 2 ? `${years[0]}–${years[years.length - 1]}` : (years[0] ?? "—");

  // --- Computed stats ---

  // 1. totalByCategory
  const totalByCategory: Record<keyof YearCounts, number> = {
    "Accounting fraud": 0,
    "Restatement + material weakness": 0,
    "SEC enforcement action": 0,
  };
  for (const yc of Object.values(data.yearCounts)) {
    totalByCategory["Accounting fraud"] += yc["Accounting fraud"] ?? 0;
    totalByCategory["Restatement + material weakness"] += yc["Restatement + material weakness"] ?? 0;
    totalByCategory["SEC enforcement action"] += yc["SEC enforcement action"] ?? 0;
  }

  // 2. yearTotals
  const yearTotals: Record<string, number> = {};
  for (const [year, yc] of Object.entries(data.yearCounts)) {
    yearTotals[year] =
      (yc["Accounting fraud"] ?? 0) +
      (yc["Restatement + material weakness"] ?? 0) +
      (yc["SEC enforcement action"] ?? 0);
  }

  const totalFilings = Object.values(yearTotals).reduce((s, v) => s + v, 0);

  // 3. peakYear
  const peakYear = Object.entries(yearTotals).reduce(
    (best, [yr, total]) => (total > best.total ? { year: yr, total } : best),
    { year: years[0] ?? "—", total: 0 }
  );

  // 4. trendDirection — compare last 2 full years (exclude current partial year)
  const completedYears = years.filter((y) => parseInt(y) < new Date().getFullYear());
  const lastTwo = completedYears.slice(-2);
  const trendDirection =
    lastTwo.length === 2
      ? yearTotals[lastTwo[1]] >= yearTotals[lastTwo[0]]
        ? "increasing"
        : "decreasing"
      : "stable";

  // 5. topCompanies — top 10 by frequency in recentFilings
  const companyCounts: Record<string, number> = {};
  for (const f of data.recentFilings) {
    const name = formatCompanyName(f.companyName);
    companyCounts[name] = (companyCounts[name] ?? 0) + 1;
  }
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // 6. byFormType
  const byFormType: Record<string, number> = {};
  for (const f of data.recentFilings) {
    const ft = f.formType || "Unknown";
    byFormType[ft] = (byFormType[ft] ?? 0) + 1;
  }
  const sortedFormTypes = Object.entries(byFormType).sort((a, b) => b[1] - a[1]);
  const maxFormTypeCount = sortedFormTypes[0]?.[1] ?? 1;

  // Max per category for grouped bar scaling
  const maxPerCategory: Record<keyof YearCounts, number> = {
    "Accounting fraud": 0,
    "Restatement + material weakness": 0,
    "SEC enforcement action": 0,
  };
  for (const yc of Object.values(data.yearCounts)) {
    for (const cat of CATEGORIES) {
      const v = yc[cat.key] ?? 0;
      if (v > maxPerCategory[cat.key]) maxPerCategory[cat.key] = v;
    }
  }

  // Table rows
  const tableRows = data.recentFilings.map((f) => ({
    company: formatCompanyName(f.companyName),
    category: f.category,
    formType: f.formType || "—",
    fileDate: f.fileDate || "—",
  }));

  const tableColumns = [
    { key: "company", label: "Company" },
    { key: "category", label: "Category" },
    { key: "formType", label: "Form", mono: true },
    { key: "fileDate", label: "Filed", mono: true, align: "right" as const },
  ];

  // --- Chart data ---

  const areaTimelineData = years.map((y) => ({ period: y, total: yearTotals[y] ?? 0 }));
  const areaTimelineSeries = [{ key: "total", label: "Total Filings", color: "#B91C1C" }];

  const heatmapCols = [
    "Accounting fraud",
    "Restatement + material weakness",
    "SEC enforcement action",
  ];

  const donutData = [
    { name: "Accounting Fraud", value: totalByCategory["Accounting fraud"], color: "#B91C1C" },
    { name: "Restatement + MW", value: totalByCategory["Restatement + material weakness"], color: "#D97706" },
    { name: "SEC Enforcement", value: totalByCategory["SEC enforcement action"], color: "#003366" },
  ];

  const barChartData = topCompanies.map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="pt-4">
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-ink leading-tight">
          SEC Enforcement &amp; Accounting Errors
        </h1>
        <p className="mt-3 text-lg text-ink-muted max-w-2xl leading-relaxed">
          Year-over-year trends in accounting fraud, restatements, and SEC
          enforcement actions drawn from public EDGAR filings — {yearRange}.
        </p>
      </section>

      {/* Editorial context */}
      <SectionIntro>
        <p className="mb-3">
          <strong>What this tracks.</strong> The SEC pursues enforcement actions
          when companies misstate financial results, fail to maintain adequate
          internal controls, or commit outright fraud. These actions often begin
          with a restatement or material weakness disclosure — public signals
          that prior financials cannot be relied upon. Each filing in this
          dataset represents a company that disclosed accounting problems
          significant enough to warrant a public SEC filing.
        </p>
        <p className="mb-3">
          <strong>Why accounting errors escalate.</strong> A material weakness
          in internal controls raises the probability of misstatement. When
          auditors or management discover errors, companies must file amended
          returns and disclose the weakness. Persistent or egregious errors
          attract SEC investigation and, eventually, formal enforcement action.
          The chain — weakness, restatement, investigation, enforcement — can
          span years and destroy shareholder value along the way.
        </p>
        <p>
          <strong>What this page shows.</strong> Filing counts by year across
          three categories — accounting fraud, restatements with material
          weakness, and SEC enforcement actions — drawn from EDGAR full-text
          search. The charts show both aggregate trends and per-category
          breakdowns. The recent filings table shows the underlying source filings.
        </p>
      </SectionIntro>

      {/* Stats ribbon — 6 MetricCards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Enforcement Filings"
          value={totalFilings.toLocaleString()}
          subtitle={`Across all categories, ${yearRange}`}
          accent="navy"
        />
        <MetricCard
          title="Accounting Fraud Cases"
          value={totalByCategory["Accounting fraud"].toLocaleString()}
          subtitle="Fraud filings across all years"
          accent="danger"
        />
        <MetricCard
          title="Restatement + MW Cases"
          value={totalByCategory["Restatement + material weakness"].toLocaleString()}
          subtitle="Restatements with material weakness"
          accent="amber"
        />
        <MetricCard
          title="SEC Enforcement Actions"
          value={totalByCategory["SEC enforcement action"].toLocaleString()}
          subtitle="Formal SEC enforcement filings"
          accent="navy"
        />
        <MetricCard
          title="Peak Year"
          value={peakYear.year}
          subtitle={`${peakYear.total.toLocaleString()} total filings — highest on record`}
          accent="danger"
        />
        <MetricCard
          title="Trend"
          value={trendDirection === "increasing" ? "↑ Increasing" : "↓ Decreasing"}
          subtitle={
            lastTwo.length === 2
              ? `${lastTwo[0]}: ${yearTotals[lastTwo[0]]} → ${lastTwo[1]}: ${yearTotals[lastTwo[1]]}`
              : "Insufficient data"
          }
          accent={trendDirection === "increasing" ? "danger" : "navy"}
        />
      </section>

      {/* Overall Trend — AreaTimelineChart */}
      <section>
        <h2 className="text-xl font-display font-semibold text-ink mb-1">
          Overall Trend
        </h2>
        <p className="text-sm text-ink-muted mb-5">
          Total enforcement filings per year across all three categories.
        </p>
        <div className="bg-surface border border-rule rounded-lg p-6">
          <AreaTimelineChart data={areaTimelineData} series={areaTimelineSeries} />
        </div>
      </section>

      {/* Category Breakdown — full width grouped bars + heatmap */}
      <section>
        <h2 className="text-xl font-display font-semibold text-ink mb-1">
          Category Breakdown
        </h2>
        <p className="text-sm text-ink-muted mb-4">
          Per-category filing counts by year. Each color represents one enforcement category.
        </p>
        {/* Legend */}
        <div className="flex flex-wrap gap-5 mb-5">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-sm ${cat.barBg} opacity-80`} />
              <span className="text-xs text-ink-muted">{cat.label}</span>
            </div>
          ))}
        </div>
        <div className="bg-surface border border-rule rounded-lg overflow-hidden">
          {years.map((year, yi) => {
            const yc = data.yearCounts[year] ?? ({} as YearCounts);
            return (
              <div
                key={year}
                className={`px-5 py-4 ${yi < years.length - 1 ? "border-b border-rule/50" : ""}`}
              >
                <p className="text-sm font-mono font-semibold text-ink mb-3">
                  {year}
                </p>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => {
                    const count = yc[cat.key] ?? 0;
                    const max = maxPerCategory[cat.key] || 1;
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={cat.key} className="flex items-center gap-3">
                        <span className="text-xs text-ink-muted w-52 shrink-0 leading-tight">
                          {cat.label}
                        </span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                          {count > 0 && (
                            <div
                              className={`h-full ${cat.barBg} opacity-80 rounded-sm`}
                              style={{ width: `${Math.max(pct, 1)}%` }}
                            />
                          )}
                        </div>
                        <span className="text-xs font-mono text-ink-muted w-10 text-right shrink-0">
                          {count > 0 ? count.toLocaleString() : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Heatmap — year × category intensity */}
        <div className="mt-6 bg-surface border border-rule rounded-lg p-6">
          <p className="text-sm font-semibold text-ink mb-4">Intensity Heatmap</p>
          <HeatmapChart
            rows={years}
            cols={heatmapCols}
            data={data.yearCounts as unknown as Record<string, Record<string, number>>}
            colorScale="danger"
          />
        </div>
      </section>

      {/* Category Totals + Most Cited Companies */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Category Totals — DonutChart + stat cards */}
        <section>
          <h2 className="text-xl font-display font-semibold text-ink mb-1">
            Category Totals
          </h2>
          <p className="text-sm text-ink-muted mb-5">
            Cumulative filings per category across all years.
          </p>
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Donut */}
            <div className="bg-surface border border-rule rounded-lg p-6">
              <DonutChart data={donutData} innerLabel="By Type" />
            </div>
            {/* Stat cards */}
            <div className="space-y-4">
              {CATEGORIES.map((cat) => {
                const total = totalByCategory[cat.key];
                return (
                  <div
                    key={cat.key}
                    className={`bg-surface border border-rule border-l-4 border-l-${cat.accent} rounded-lg p-4`}
                  >
                    <p className="text-xs font-semibold font-body uppercase tracking-widest text-ink-muted leading-tight">
                      {cat.label}
                    </p>
                    <p className="mt-1 text-2xl font-mono font-medium text-ink">
                      {total.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right: Most Cited Companies — BarChart */}
        <section>
          <h2 className="text-xl font-display font-semibold text-ink mb-1">
            Most Cited Companies
          </h2>
          <p className="text-sm text-ink-muted mb-5">
            Top 10 companies by number of enforcement-related filings.
          </p>
          <div className="bg-surface border border-rule rounded-lg p-6">
            <BarChart data={barChartData} layout="horizontal" />
          </div>
        </section>
      </div>

      {/* By Form Type */}
      <section>
        <h2 className="text-xl font-display font-semibold text-ink mb-1">
          Filing Type Breakdown
        </h2>
        <p className="text-sm text-ink-muted mb-5">
          Recent enforcement filings grouped by SEC form type.
        </p>
        <div className="bg-surface border border-rule rounded-lg p-6">
          {sortedFormTypes.length === 0 ? (
            <p className="text-sm text-ink-faint">No form type data available.</p>
          ) : (
            <div className="space-y-3">
              {sortedFormTypes.map(([ft, count]) => {
                const pct = Math.round((count / maxFormTypeCount) * 100);
                return (
                  <div key={ft} className="flex items-center gap-4">
                    <span className="text-sm font-mono font-semibold text-ink w-24 shrink-0">
                      {ft}
                    </span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-amber opacity-75 rounded-sm"
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-ink-muted w-16 text-right shrink-0">
                      {count.toLocaleString()} filing{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* DataTable */}
      <section>
        <h2 className="text-xl font-display font-semibold text-ink mb-1">
          Recent Filings
        </h2>
        <p className="text-sm text-ink-muted mb-5">
          Source filings pulled from EDGAR. Search by company name.
        </p>
        <DataTable
          columns={tableColumns}
          rows={tableRows}
          searchKey="company"
          searchPlaceholder="Search by company..."
          maxRows={100}
        />
      </section>
    </div>
  );
}
