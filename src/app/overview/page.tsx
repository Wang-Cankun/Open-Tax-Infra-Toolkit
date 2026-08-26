export const metadata = { title: "Overview Diagram | GAAP Tracker" };

export default function OverviewPage() {
  return (
    <div className="max-w-[1100px] mx-auto -mx-6 sm:mx-auto">
      <style>{`
        .bp-canvas {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 40px;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        }
        @media (max-width: 640px) {
          .bp-canvas { padding: 20px; }
        }

        .bp-header {
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 16px;
          margin-bottom: 32px;
        }
        .bp-title {
          font-size: 22px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .bp-subtitle {
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .bp-section-label {
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }
        .bp-divider {
          border-top: 1px solid #cbd5e1;
          margin: 4px 0 24px 0;
        }

        .bp-problem {
          border: 1px solid #cbd5e1;
          padding: 20px 24px;
          margin-bottom: 32px;
          background: #fffbeb;
          border-left: 3px solid #92400e;
        }
        .bp-problem-label {
          font-size: 11px;
          font-weight: 600;
          color: #92400e;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
        }
        .bp-problem p {
          font-size: 14px;
          color: #0f172a;
          line-height: 1.6;
          margin: 0;
        }

        .bp-flow-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 0;
          align-items: center;
          margin-bottom: 36px;
        }
        @media (max-width: 768px) {
          .bp-flow-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .bp-arrow { transform: rotate(90deg); }
        }
        .bp-flow-box {
          border: 1px solid #cbd5e1;
          padding: 20px;
          text-align: center;
        }
        .bp-flow-box.source {
          background: #eff6ff;
          border-color: #1e40af;
        }
        .bp-flow-box.process {
          background: #ffffff;
        }
        .bp-flow-box.output {
          background: #f0fdf4;
          border-color: #166534;
        }
        .bp-flow-icon { margin-bottom: 8px; }
        .bp-flow-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .bp-flow-desc {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }
        .bp-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
        }

        .bp-coverage-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 36px;
        }
        @media (max-width: 900px) {
          .bp-coverage-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .bp-coverage-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .bp-area-card {
          border: 1px solid #cbd5e1;
          padding: 14px 16px;
        }
        .bp-area-code {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 11px;
          font-weight: 500;
          color: #1e40af;
          margin-bottom: 4px;
        }
        .bp-area-name {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 2px;
        }
        .bp-area-example {
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }

        .bp-usecases {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 36px;
        }
        @media (max-width: 640px) {
          .bp-usecases { grid-template-columns: 1fr; }
        }
        .bp-usecase {
          border: 1px solid #cbd5e1;
          padding: 16px;
        }
        .bp-uc-who {
          font-size: 11px;
          font-weight: 600;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 6px;
        }
        .bp-uc-what {
          font-size: 13px;
          color: #0f172a;
          line-height: 1.5;
        }

        .bp-metrics-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 36px;
          padding-top: 24px;
          border-top: 1px solid #cbd5e1;
        }
        @media (max-width: 640px) {
          .bp-metrics-bar { grid-template-columns: repeat(2, 1fr); }
        }
        .bp-metric {
          text-align: center;
          padding: 16px 12px;
          border: 1px solid #cbd5e1;
        }
        .bp-metric-value {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 22px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .bp-metric-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .bp-sources {
          border-top: 1px solid #cbd5e1;
          padding-top: 20px;
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .bp-source-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .bp-source-dot {
          width: 8px;
          height: 8px;
          border: 2px solid #64748b;
          flex-shrink: 0;
        }
        .bp-source-text {
          font-size: 12px;
          color: #64748b;
        }
      `}</style>

      <div className="bp-canvas">
        {/* Header */}
        <div className="bp-header">
          <div className="bp-title">GAAP Tracker</div>
          <div className="bp-subtitle">How Companies Interpret Accounting Standards &mdash; Made Visible</div>
        </div>

        {/* Problem Statement */}
        <div className="bp-problem">
          <div className="bp-problem-label">The Problem</div>
          <p>
            FASB accounting standards often leave <strong>judgment calls</strong> to practitioners.
            The same economic transaction can be reported differently by different companies.
            These differences are buried in thousands of SEC filings &mdash; making comparison nearly impossible by hand.
          </p>
        </div>

        {/* 3-Step Flow */}
        <div className="bp-section-label">How It Works</div>
        <div className="bp-divider" />
        <div className="bp-flow-row">
          <div className="bp-flow-box source">
            <div className="bp-flow-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="bp-flow-title">SEC Filings</div>
            <div className="bp-flow-desc">
              10-K and 10-Q reports<br/>
              filed by public companies<br/>
              with the SEC (EDGAR)
            </div>
          </div>
          <div className="bp-arrow">
            <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
              <line x1="0" y1="10" x2="32" y2="10" stroke="#cbd5e1" strokeWidth="2"/>
              <polyline points="28,5 34,10 28,15" stroke="#cbd5e1" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <div className="bp-flow-box process">
            <div className="bp-flow-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
              </svg>
            </div>
            <div className="bp-flow-title">GAAP Tracker</div>
            <div className="bp-flow-desc">
              Reads filings &amp; XBRL data,<br/>
              organizes by accounting topic,<br/>
              surfaces interpretation patterns
            </div>
          </div>
          <div className="bp-arrow">
            <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
              <line x1="0" y1="10" x2="32" y2="10" stroke="#cbd5e1" strokeWidth="2"/>
              <polyline points="28,5 34,10 28,15" stroke="#cbd5e1" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <div className="bp-flow-box output">
            <div className="bp-flow-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div className="bp-flow-title">Comparable Insights</div>
            <div className="bp-flow-desc">
              See how companies differ<br/>
              in applying the same standard<br/>
              &mdash; side by side
            </div>
          </div>
        </div>

        {/* 11 Areas */}
        <div className="bp-section-label">Accounting Areas Tracked (11 ASC Topics)</div>
        <div className="bp-divider" />
        <div className="bp-coverage-grid">
          <div className="bp-area-card">
            <div className="bp-area-code">Topic 832</div>
            <div className="bp-area-name">Government Grants</div>
            <div className="bp-area-example">CHIPS Act, IRA Clean Energy, Infrastructure programs</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 606</div>
            <div className="bp-area-name">Revenue Recognition</div>
            <div className="bp-area-example">When and how revenue is recorded from contracts</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 842</div>
            <div className="bp-area-name">Leases</div>
            <div className="bp-area-example">Operating vs. finance lease classification choices</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 820</div>
            <div className="bp-area-name">Fair Value</div>
            <div className="bp-area-example">Level 1 / 2 / 3 hierarchy &mdash; how assets are valued</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 815</div>
            <div className="bp-area-name">Derivatives &amp; Hedging</div>
            <div className="bp-area-example">Hedge accounting election and effectiveness</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 810</div>
            <div className="bp-area-name">Consolidation</div>
            <div className="bp-area-example">Variable interest entity (VIE) analysis decisions</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 326</div>
            <div className="bp-area-name">Credit Losses (CECL)</div>
            <div className="bp-area-example">Expected loss estimation methods</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 718</div>
            <div className="bp-area-name">Stock Compensation</div>
            <div className="bp-area-example">Options &amp; RSU valuation approaches</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 740</div>
            <div className="bp-area-name">Income Taxes</div>
            <div className="bp-area-example">Deferred tax positions and valuation allowances</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">ASC 350</div>
            <div className="bp-area-name">Goodwill &amp; Intangibles</div>
            <div className="bp-area-example">Impairment testing methods and triggers</div>
          </div>
          <div className="bp-area-card">
            <div className="bp-area-code">Restatements</div>
            <div className="bp-area-name">Amended Filings</div>
            <div className="bp-area-example">Corrections to previously filed financial statements</div>
          </div>
          <div className="bp-area-card" style={{ border: "1px dashed #cbd5e1", background: "#f8fafc" }}>
            <div className="bp-area-code" style={{ color: "#64748b" }}>Enforcement</div>
            <div className="bp-area-name" style={{ color: "#64748b" }}>SEC Actions</div>
            <div className="bp-area-example">Accounting-related enforcement cases &amp; penalties</div>
          </div>
        </div>

        {/* Who Benefits */}
        <div className="bp-section-label">Who Can Use This</div>
        <div className="bp-divider" />
        <div className="bp-usecases">
          <div className="bp-usecase">
            <div className="bp-uc-who">Auditors</div>
            <div className="bp-uc-what">Compare how peer companies apply the same standard to benchmark audit judgments</div>
          </div>
          <div className="bp-usecase">
            <div className="bp-uc-who">Financial Analysts</div>
            <div className="bp-uc-what">Identify where accounting choices mask or inflate economic performance</div>
          </div>
          <div className="bp-usecase">
            <div className="bp-uc-who">Accounting Researchers</div>
            <div className="bp-uc-what">Study adoption patterns and interpretation trends across industries</div>
          </div>
        </div>

        {/* Key Numbers */}
        <div className="bp-section-label">Scale</div>
        <div className="bp-metrics-bar">
          <div className="bp-metric">
            <div className="bp-metric-value">100K+</div>
            <div className="bp-metric-label">Filings Analyzed</div>
          </div>
          <div className="bp-metric">
            <div className="bp-metric-value">11</div>
            <div className="bp-metric-label">GAAP Areas</div>
          </div>
          <div className="bp-metric">
            <div className="bp-metric-value">1,000+</div>
            <div className="bp-metric-label">Public Companies</div>
          </div>
          <div className="bp-metric">
            <div className="bp-metric-value">6 hrs</div>
            <div className="bp-metric-label">Data Refresh Cycle</div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bp-sources">
          <div className="bp-source-item">
            <div className="bp-source-dot" />
            <div className="bp-source-text">Data from <strong>SEC EDGAR</strong> (public filings)</div>
          </div>
          <div className="bp-source-item">
            <div className="bp-source-dot" />
            <div className="bp-source-text">Federal grant data from <strong>USAspending.gov</strong></div>
          </div>
          <div className="bp-source-item">
            <div className="bp-source-dot" />
            <div className="bp-source-text">All data is <strong>publicly available</strong> &mdash; no proprietary sources</div>
          </div>
        </div>
      </div>
    </div>
  );
}
