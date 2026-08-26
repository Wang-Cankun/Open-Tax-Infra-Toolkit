import { readFile } from "fs/promises";
import path from "path";
import MetricCard from "@/components/metric-card";
import SectionIntro from "@/components/section-intro";
import DataTable from "@/components/data-table";
import DonutChart from "@/components/charts/donut-chart";
import BarChart from "@/components/charts/bar-chart";
import USMapChart from "@/components/charts/us-map-chart";

export const metadata = { title: "Federal Grants | GAAP Analytics" };

interface Grant {
  program: string;
  recipient: string;
  amount: number;
  agency: string;
  startDate: string | null;
  state: string;
  description: string;
}

interface GrantsData {
  refreshedAt: string;
  totalGrants: number;
  byProgram: Record<string, { count: number; totalAmount: number }>;
  byState: Record<string, number>;
  grants: Grant[];
}

function formatDollars(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(0)}M`;
  return `$${amount.toLocaleString()}`;
}

function formatDollarsExact(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  return `$${amount.toLocaleString()}`;
}

const PROGRAM_ACCENT: Record<string, string> = {
  "CHIPS Act": "border-l-navy",
  "IRA Clean Energy": "border-l-teal",
  "Infrastructure (IIJA)": "border-l-amber",
};


export default async function FederalGrantsPage() {
  const filePath = path.join(process.cwd(), "public", "data", "federal-grants.json");
  const raw = await readFile(filePath, "utf-8");
  const data: GrantsData = JSON.parse(raw);

  const grants = data.grants ?? [];

  // --- Totals ---
  const totalAmount = Object.values(data.byProgram).reduce(
    (sum, p) => sum + (p.totalAmount ?? 0),
    0
  );
  const stateCount = Object.keys(data.byState ?? {}).length;

  // --- Program avg grant size ---
  const programStats = Object.entries(data.byProgram).map(([name, prog]) => ({
    name,
    count: prog.count ?? 0,
    totalAmount: prog.totalAmount ?? 0,
    avgSize: prog.count > 0 ? (prog.totalAmount ?? 0) / prog.count : 0,
  }));

  // --- Top 15 recipients ---
  const recipientMap = new Map<string, number>();
  for (const g of grants) {
    const key = g.recipient ?? "Unknown";
    recipientMap.set(key, (recipientMap.get(key) ?? 0) + (g.amount ?? 0));
  }
  const topRecipients = Array.from(recipientMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // --- By agency ---
  const agencyMap = new Map<string, { count: number; total: number }>();
  for (const g of grants) {
    const key = g.agency ?? "Unknown";
    const cur = agencyMap.get(key) ?? { count: 0, total: 0 };
    agencyMap.set(key, { count: cur.count + 1, total: cur.total + (g.amount ?? 0) });
  }
  const byAgency = Array.from(agencyMap.entries())
    .sort((a, b) => b[1].total - a[1].total);
  const agencyCount = byAgency.length;

  // --- Top 15 states ---
  const sortedStates = Object.entries(data.byState ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  // --- Program-level totals for stats ribbon ---
  const chipsTotal = data.byProgram["CHIPS Act"]?.totalAmount ?? 0;
  const iraTotal = data.byProgram["IRA Clean Energy"]?.totalAmount ?? 0;

  // --- Table rows ---
  const tableColumns = [
    { key: "recipient", label: "Recipient" },
    { key: "program", label: "Program" },
    { key: "amount", label: "Amount", align: "right" as const, mono: true },
    { key: "agency", label: "Agency" },
    { key: "state", label: "State" },
    { key: "date", label: "Date", mono: true },
  ];

  const tableRows = grants.map((g) => ({
    recipient: g.recipient ?? "",
    program: g.program ?? "",
    amount: formatDollarsExact(g.amount ?? 0),
    agency: g.agency ?? "",
    state: g.state ?? "",
    date: g.startDate ?? "—",
  }));

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-semibold">
          Federal Grants &amp; Government Funding
        </h1>
        <p className="mt-2 text-ink-muted">
          USAspending.gov data — CHIPS Act, IRA Clean Energy, and Infrastructure (IIJA) awards.
        </p>
      </div>

      {/* Section Intro */}
      <SectionIntro>
        <p>
          <strong>What are these grants?</strong> The CHIPS and Science Act, the Inflation Reduction Act (IRA), and the Infrastructure Investment and Jobs Act (IIJA) represent three of the largest federal spending programs enacted since 2021. Together they direct hundreds of billions of dollars toward semiconductor manufacturing, clean energy deployment, and physical infrastructure — channeled through grants, cooperative agreements, and direct awards to states, municipalities, universities, and private companies.
        </p>
        <p className="mt-3">
          <strong>Why they matter for accounting.</strong> Recipients must assess whether these grants constitute government assistance under ASC 832 (Government Assistance), requiring disclosure of the nature, amounts, and accounting policies applied. Depending on the structure, awards may also trigger revenue recognition questions under ASC 606, asset-related government grant accounting, or tax credit accounting under the IRA&apos;s direct-pay provisions. Early adoption of ASC 832 disclosure requirements has become a key area of auditor scrutiny for fiscal years beginning after December 15, 2021.
        </p>
        <p className="mt-3">
          <strong>What this page tracks.</strong> This page aggregates award data pulled from USAspending.gov for CHIPS Act, IRA Clean Energy, and IIJA programs. It shows total award counts and dollar volumes by program, top recipients and agencies, geographic distribution across states, and a searchable table of individual grant recipients. Data is refreshed periodically and reflects publicly reported award obligations.
        </p>
      </SectionIntro>

      {/* Stats Ribbon — 6 MetricCards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Total Grants"
          value={data.totalGrants.toLocaleString()}
          subtitle="All programs"
          accent="navy"
        />
        <MetricCard
          title="Total Funding"
          value={formatDollars(totalAmount)}
          subtitle="Aggregate obligations"
          accent="teal"
        />
        <MetricCard
          title="States Reached"
          value={stateCount.toLocaleString()}
          subtitle="Receiving grants"
          accent="amber"
        />
        <MetricCard
          title="Agencies"
          value={agencyCount.toLocaleString()}
          subtitle="Awarding agencies"
          accent="navy"
        />
        <MetricCard
          title="CHIPS Act"
          value={formatDollars(chipsTotal)}
          subtitle="Semiconductor awards"
          accent="navy"
        />
        <MetricCard
          title="IRA Clean Energy"
          value={formatDollars(iraTotal)}
          subtitle="Clean energy awards"
          accent="teal"
        />
      </div>

      {/* Program Comparison */}
      <section>
        <h2 className="text-xl font-display font-semibold mb-1">Program Comparison</h2>
        <p className="text-sm text-ink-muted mb-5">
          Total obligations, grant count, and average award size by legislative program.
        </p>
        <div className="bg-surface border border-rule rounded-lg p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Donut chart */}
            <div className="flex items-center justify-center">
              <DonutChart
                data={programStats.map((p) => ({
                  name: p.name,
                  value: p.totalAmount,
                  color:
                    p.name === "CHIPS Act"
                      ? "#003366"
                      : p.name === "IRA Clean Energy"
                      ? "#0891B2"
                      : "#D97706",
                }))}
                innerLabel="By Program"
              />
            </div>
            {/* Program detail cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-1">
              {programStats.map((prog) => (
                <div
                  key={prog.name}
                  className={`border-l-4 ${PROGRAM_ACCENT[prog.name] ?? "border-l-navy"} pl-4`}
                >
                  <p className="text-xs font-semibold font-body uppercase tracking-widest text-ink-muted">
                    {prog.name}
                  </p>
                  <p className="mt-2 text-2xl font-mono font-medium text-ink">
                    {formatDollars(prog.totalAmount)}
                  </p>
                  <p className="mt-1 text-sm text-ink-faint">
                    {prog.count.toLocaleString()} awards
                  </p>
                  <p className="mt-0.5 text-sm text-ink-faint">
                    Avg {formatDollars(prog.avgSize)} per grant
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top 15 Recipients */}
      <section>
        <h2 className="text-xl font-display font-semibold mb-1">Top 15 Recipients</h2>
        <p className="text-sm text-ink-muted mb-5">
          Organizations receiving the largest total award amounts.
        </p>
        <div className="bg-surface border border-rule rounded-lg p-6">
          <BarChart
            data={topRecipients.map(([name, amt]) => ({ name, value: amt }))}
            valuePrefix="$"
            layout="horizontal"
          />
        </div>
      </section>

      {/* State Distribution */}
      <section>
        <h2 className="text-xl font-display font-semibold mb-1">State Distribution</h2>
        <p className="text-sm text-ink-muted mb-5">
          Total award obligations by state across all programs.
        </p>
        <div className="bg-surface border border-rule rounded-lg p-6">
          <USMapChart
            data={data.byState}
            valuePrefix="$"
            colorScale="navy"
          />
        </div>
        <div className="mt-6 bg-surface border border-rule rounded-lg p-6">
          <p className="text-sm font-medium text-ink mb-4">Top 15 States by Award Volume</p>
          <BarChart
            data={sortedStates.map(([state, amt]) => ({ name: state, value: amt }))}
            valuePrefix="$"
          />
          <p className="mt-4 text-xs text-ink-faint">
            {stateCount} states and territories received federal grant funding.
          </p>
        </div>
      </section>

      {/* By Agency */}
      <section>
        <h2 className="text-xl font-display font-semibold mb-1">Funding by Agency</h2>
        <p className="text-sm text-ink-muted mb-5">
          Federal agencies ranked by total award volume distributed.
        </p>
        <div className="bg-surface border border-rule rounded-lg p-6">
          <BarChart
            data={byAgency.map(([name, info]) => ({ name, value: info.total }))}
            valuePrefix="$"
            layout="horizontal"
          />
        </div>
      </section>

      {/* Data Table */}
      <section>
        <h2 className="text-xl font-display font-semibold mb-1">All Grants</h2>
        <p className="text-sm text-ink-muted mb-5">
          Searchable record of all {data.totalGrants.toLocaleString()} awards across CHIPS Act, IRA Clean Energy, and IIJA programs.
        </p>
        <DataTable
          columns={tableColumns}
          rows={tableRows}
          searchKey="recipient"
          searchPlaceholder="Search by recipient name..."
          maxRows={100}
        />
      </section>
    </div>
  );
}
