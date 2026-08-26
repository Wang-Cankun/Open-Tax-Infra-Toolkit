import Link from "next/link";
import { getAllAreas } from "@/lib/areas/registry";

export const metadata = { title: "About | GAAP Tracker" };

export default function AboutPage() {
  const areas = getAllAreas();

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-3xl font-display font-semibold">About</h1>

      <section className="space-y-4 text-ink-muted leading-relaxed">
        <h2 className="text-xl font-display font-semibold text-ink">
          What this tracks
        </h2>
        <p>
          GAAP Tracker monitors how U.S. public companies implement complex
          accounting standards, using data from SEC EDGAR public filings.
        </p>
        <p>
          The Financial Accounting Standards Board (FASB) issues accounting
          standards that all U.S. public companies must follow. For routine
          transactions, these standards provide clear answers. But for complex
          transactions involving derivatives, fair value estimates,
          consolidation of variable interest entities, or government grants,
          the standards require significant professional judgment. Different
          companies often reach different accounting conclusions for
          economically similar transactions.
        </p>
        <p>
          This dashboard makes those differences visible. By searching SEC
          filings for references to specific accounting standards and analyzing
          XBRL structured data, we can track which companies are adopting new
          standards, how they are implementing them, and where implementation
          approaches diverge across industries.
        </p>
      </section>

      <section className="space-y-4 text-ink-muted leading-relaxed">
        <h2 className="text-xl font-display font-semibold text-ink">
          Areas covered
        </h2>
        <div className="grid gap-4">
          {areas.map((area) => (
            <Link
              key={area.slug}
              href={`/areas/${area.slug}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <div className="bg-surface border border-rule rounded-lg p-5">
                <p className="font-semibold text-ink font-body">
                  {area.name}
                </p>
                <p className="mt-1.5 text-sm">
                  {area.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4 text-ink-muted leading-relaxed">
        <h2 className="text-xl font-display font-semibold text-ink">
          Data sources
        </h2>
        <p>
          All data comes from free, publicly available SEC EDGAR APIs. No paid
          data sources are used. No API key is required.
        </p>
        <div className="bg-gray-50 border border-rule rounded-lg p-5 text-sm space-y-3">
          <div>
            <p className="font-semibold text-ink font-body">
              EFTS (Full-Text Search)
            </p>
            <p>
              Searches the full text of all SEC filings. We use exact-phrase
              queries (e.g., &quot;ASU 2025-10&quot;) to find filings that
              reference specific accounting standards. Returns filing metadata
              including company name, CIK, filing date, and form type.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink font-body">
              XBRL Frames API
            </p>
            <p>
              Provides structured financial data tagged with XBRL (eXtensible
              Business Reporting Language) across all SEC filers. We use this
              to extract specific data points, such as the dollar value of
              derivative assets reported by each company.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink font-body">
              Company Facts API
            </p>
            <p>
              Returns all XBRL-tagged financial facts for a single company
              across all of its historical filings, enabling company-level
              trend analysis.
            </p>
          </div>
        </div>
        <p className="text-sm">
          Filing data refreshes every 6 hours via Next.js ISR caching. XBRL
          data updates quarterly as companies file new reports.
        </p>
      </section>

      <section className="space-y-4 text-ink-muted leading-relaxed">
        <h2 className="text-xl font-display font-semibold text-ink">
          Methodology
        </h2>
        <p>
          Filings are identified by searching EFTS for exact phrases matching
          accounting standard references (e.g., &quot;ASU 2025-10&quot;,
          &quot;ASC 815&quot;). Results are deduplicated by accession number
          when multiple search terms match the same filing.
        </p>
        <p>
          XBRL data is retrieved via the Frames API, which returns one
          financial data tag across all filers for a given reporting period.
          We use the &quot;DerivativeAssets&quot; tag to identify companies
          with derivative positions and the fair value hierarchy tags to
          analyze Level 3 asset concentrations.
        </p>
        <p>
          Restatements are identified by searching for the word
          &quot;restatement&quot; in amended filings (10-K/A and 10-Q/A).
          This is a broad filter that captures formal restatements as well
          as references to restatement risk or policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-display font-semibold text-ink">
          Open source
        </h2>
        <p className="text-ink-muted">
          This project is open source under the MIT License.{" "}
          <a
            href="https://github.com/placeholder/gaap-tracker"
            className="text-navy underline underline-offset-2 hover:text-navy-hover"
          >
            View on GitHub
          </a>
          . Contributions welcome.
        </p>
      </section>
    </div>
  );
}
