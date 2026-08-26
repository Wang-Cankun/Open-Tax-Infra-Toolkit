import { notFound } from "next/navigation";
import { getAreaBySlug } from "@/lib/areas/registry";
import {
  getAreaFilings,
  getAreaCount,
  getAreaTimeline,
  getAreaXbrlFilers,
} from "@/lib/areas/data";
import MetricCard from "@/components/metric-card";
import SectionIntro from "@/components/section-intro";
import DataTable from "@/components/data-table";
import AreaTimelineChart from "@/components/charts/area-timeline-chart";
import DonutChart from "@/components/charts/donut-chart";
import BarChart from "@/components/charts/bar-chart";

export const dynamic = "force-dynamic";
export const revalidate = 21600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getAreaBySlug(slug);
  if (!config) return { title: "Not Found | GAAP Tracker" };
  return { title: `${config.name} | GAAP Tracker` };
}

function fmtValue(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getAreaBySlug(slug);
  if (!config) notFound();

  // --- Data fetching ---
  let filings: Awaited<ReturnType<typeof getAreaFilings>>;
  let xbrlFilers: Awaited<ReturnType<typeof getAreaXbrlFilers>>;
  let filingCount: number;
  let timeline: Awaited<ReturnType<typeof getAreaTimeline>>;

  if (config.xbrl) {
    [filings, xbrlFilers, filingCount, timeline] = await Promise.all([
      getAreaFilings(config),
      getAreaXbrlFilers(config),
      getAreaCount(config),
      getAreaTimeline(config),
    ]);
  } else {
    [filings, filingCount, timeline] = await Promise.all([
      getAreaFilings(config),
      getAreaCount(config),
      getAreaTimeline(config),
    ]);
    xbrlFilers = [];
  }

  // --- Derived stats ---
  const uniqueCompanies = new Set(filings.map((f) => f.companyName)).size;

  // Filings by year
  const yearCounts = new Map<string, number>();
  for (const f of filings) {
    const year = f.fileDate?.slice(0, 4);
    if (!year) continue;
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }
  const filingsByYear = Array.from(yearCounts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));
  const peakYear =
    filingsByYear.length > 0
      ? filingsByYear.reduce((a, b) => (b.count > a.count ? b : a))
      : null;

  // Form type split
  const formCounts = new Map<string, number>();
  for (const f of filings) {
    const ft = f.formType?.trim();
    if (ft) formCounts.set(ft, (formCounts.get(ft) ?? 0) + 1);
  }
  const isRestatement = config.eftsForms.some((f) => f.includes("/A"));
  const annualKey = isRestatement ? "10-K/A" : "10-K";
  const quarterlyKey = isRestatement ? "10-Q/A" : "10-Q";
  const annualCount = formCounts.get(annualKey) ?? 0;
  const quarterlyCount = formCounts.get(quarterlyKey) ?? 0;
  const formTotal = annualCount + quarterlyCount;

  // Top companies by filing frequency
  const companyCounts = new Map<string, number>();
  for (const f of filings) {
    if (f.companyName) {
      companyCounts.set(
        f.companyName,
        (companyCounts.get(f.companyName) ?? 0) + 1,
      );
    }
  }
  const topCompanies = Array.from(companyCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  const mostActiveFiler = topCompanies[0] ?? null;

  // Timeline (last 12 months)
  const recentTimeline = timeline.slice(-12);

  // XBRL: top filers chart
  const sortedFilers = (xbrlFilers ?? [])
    .filter((f) => f.entityName && !isNaN(f.value) && f.value > 0)
    .sort((a, b) => b.value - a.value);
  const top20 = sortedFilers.slice(0, 20);

  // XBRL: value distribution buckets
  const valueBuckets = [
    { label: "$0 – 1M", min: 0, max: 1e6, count: 0 },
    { label: "$1M – 10M", min: 1e6, max: 1e7, count: 0 },
    { label: "$10M – 100M", min: 1e7, max: 1e8, count: 0 },
    { label: "$100M – 1B", min: 1e8, max: 1e9, count: 0 },
    { label: "$1B+", min: 1e9, max: Infinity, count: 0 },
  ];
  if (config.xbrl && sortedFilers.length > 0) {
    for (const f of sortedFilers) {
      const bucket = valueBuckets.find(
        (b) => f.value >= b.min && f.value < b.max,
      );
      if (bucket) bucket.count += 1;
    }
  }
  // XBRL: largest position
  const largestPosition = top20[0] ?? null;

  // --- Table rows ---
  const tableColumns =
    config.tableSource === "xbrl"
      ? [
          { key: "company", label: "Company" },
          {
            key: "value",
            label: config.xbrl?.label ?? "Value",
            align: "right" as const,
            mono: true,
          },
          { key: "period", label: "Period", mono: true },
        ]
      : [
          { key: "company", label: "Company" },
          { key: "form", label: "Form" },
          { key: "filed", label: "Filed", mono: true },
          { key: "period", label: "Period", mono: true },
        ];

  const tableRows =
    config.tableSource === "xbrl" && sortedFilers.length > 0
      ? sortedFilers.map((f) => ({
          company: f.entityName || "Unknown",
          value: isNaN(f.value)
            ? "N/A"
            : f.value >= 1e9
              ? `$${(f.value / 1e9).toFixed(1)}B`
              : `$${(f.value / 1e6).toFixed(0)}M`,
          period: f.filed || "",
        }))
      : filings
          .sort((a, b) => (b.fileDate > a.fileDate ? 1 : -1))
          .map((f) => ({
            company: f.companyName,
            form: f.formType,
            filed: f.fileDate,
            period: f.periodEnding,
          }));

  return (
    <div className="space-y-12">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-3xl font-display font-semibold">{config.name}</h1>
        <p className="mt-2 text-ink-muted">{config.subtitle}</p>
      </div>

      {/* ─── Intro ─── */}
      <SectionIntro>
        <p>
          <strong>What is {config.shortName}?</strong> {config.intro.what}
        </p>
        <p className="mt-3">
          <strong>Why does it matter?</strong> {config.intro.why}
        </p>
        <p className="mt-3">
          <strong>What this page tracks:</strong> {config.intro.tracks}
        </p>
      </SectionIntro>

      {/* ─── Stats Ribbon ─── */}
      <div
        className={`grid grid-cols-2 md:grid-cols-3 ${config.xbrl ? "lg:grid-cols-6" : "lg:grid-cols-4"} gap-3`}
      >
        <MetricCard
          title="Total Filings"
          value={filingCount.toLocaleString()}
          subtitle={`Referencing ${config.shortName}`}
          accent={config.accent}
        />
        <MetricCard
          title="Unique Companies"
          value={uniqueCompanies.toLocaleString()}
          accent={config.accent}
        />
        {peakYear && (
          <MetricCard
            title="Peak Year"
            value={peakYear.year}
            subtitle={`${peakYear.count.toLocaleString()} filings`}
            accent={config.accent}
          />
        )}
        {mostActiveFiler && (
          <MetricCard
            title="Most Active Filer"
            value={mostActiveFiler.count.toLocaleString()}
            subtitle={
              mostActiveFiler.name.length > 30
                ? mostActiveFiler.name.slice(0, 28) + "..."
                : mostActiveFiler.name
            }
            accent={config.accent}
          />
        )}
        {config.xbrl && xbrlFilers && (
          <MetricCard
            title={`${config.xbrl.label} Filers`}
            value={xbrlFilers.length.toLocaleString()}
            subtitle={`Via XBRL ${config.xbrl.tag} tag`}
            accent={config.accent}
          />
        )}
        {config.xbrl && largestPosition && (
          <MetricCard
            title="Largest Position"
            value={fmtValue(largestPosition.value)}
            subtitle={
              largestPosition.entityName.length > 30
                ? largestPosition.entityName.slice(0, 28) + "..."
                : largestPosition.entityName
            }
            accent={config.accent}
          />
        )}
      </div>

      {/* ─── Two-Column Charts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Filing Timeline (last 12 months) */}
          {recentTimeline.length > 0 && (
            <div className="bg-surface border border-rule rounded-lg p-6">
              <h3 className="text-lg font-display font-semibold mb-1">
                Filing Timeline
              </h3>
              <p className="text-sm text-ink-muted mb-4">
                Filings per month, last 12 months.
              </p>
              <AreaTimelineChart
                data={recentTimeline.map((t) => ({
                  period: t.month,
                  filings: t.filingCount,
                  companies: t.companies,
                }))}
                series={[
                  { key: "filings", label: "Filings", color: "#003366" },
                  { key: "companies", label: "Companies", color: "#0891B2" },
                ]}
              />
            </div>
          )}

          {/* Filings by Year */}
          {filingsByYear.length > 0 && (
            <div className="bg-surface border border-rule rounded-lg p-6">
              <h3 className="text-lg font-display font-semibold mb-1">
                Filings by Year
              </h3>
              <p className="text-sm text-ink-muted mb-4">
                Long-term filing volume trend.
              </p>
              <BarChart
                data={filingsByYear.map((y) => ({ name: y.year, value: y.count }))}
                layout="horizontal"
              />
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Form Type Breakdown */}
          {formTotal > 0 && (
            <div className="bg-surface border border-rule rounded-lg p-6">
              <h3 className="text-lg font-display font-semibold mb-4">
                Form Type Breakdown
              </h3>
              <DonutChart
                data={[
                  { name: `${annualKey} (Annual)`, value: annualCount, color: "#003366" },
                  { name: `${quarterlyKey} (Quarterly)`, value: quarterlyCount, color: "#0891B2" },
                ]}
                innerLabel="Form Split"
              />
            </div>
          )}

          {/* Most Active Filers */}
          {topCompanies.length > 0 && (
            <div className="bg-surface border border-rule rounded-lg p-6">
              <h3 className="text-lg font-display font-semibold mb-1">
                Most Active Filers
              </h3>
              <p className="text-sm text-ink-muted mb-4">
                Top 10 companies by filing count.
              </p>
              <BarChart
                data={topCompanies.map((c) => ({ name: c.name, value: c.count }))}
                layout="horizontal"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── XBRL Section (full width) ─── */}
      {config.xbrl && top20.length > 0 && (
        <div className="space-y-8">
          {/* Top 20 Positions */}
          <div className="bg-surface border border-rule rounded-lg p-6">
            <h3 className="text-lg font-display font-semibold mb-1">
              Top 20 {config.xbrl.label} Positions
            </h3>
            <p className="text-sm text-ink-muted mb-4">
              Largest reported {config.xbrl.label.toLowerCase()} by SEC filers
              (USD).
            </p>
            <BarChart
              data={top20.map((f) => ({ name: f.entityName, value: f.value }))}
              valuePrefix="$"
              layout="horizontal"
            />
          </div>

          {/* Value Distribution */}
          {valueBuckets.some((b) => b.count > 0) && (
            <div className="bg-surface border border-rule rounded-lg p-6">
              <h3 className="text-lg font-display font-semibold mb-1">
                Value Distribution
              </h3>
              <p className="text-sm text-ink-muted mb-4">
                Number of filers in each {config.xbrl.label.toLowerCase()}{" "}
                bracket.
              </p>
              <BarChart
                data={valueBuckets.map((b) => ({ name: b.label, value: b.count }))}
                layout="horizontal"
              />
            </div>
          )}
        </div>
      )}

      {/* ─── Data Table ─── */}
      <section>
        <h2 className="text-xl font-display font-semibold mb-4">
          {config.tableSource === "xbrl" ? "All Filers" : "All Filings"}
        </h2>
        <DataTable
          columns={tableColumns}
          rows={tableRows}
          searchKey="company"
          searchPlaceholder="Filter by company name..."
          maxRows={config.tableMaxRows ?? 50}
        />
      </section>
    </div>
  );
}
