import streamlit as st

st.set_page_config(page_title="About | GAAP Tracker", layout="wide")

st.title("About")

st.markdown("""
## What this tracks

This dashboard monitors how U.S. public companies implement complex accounting
standards, using data from SEC EDGAR public filings.

When the Financial Accounting Standards Board (FASB) issues a new standard,
companies must interpret how it applies to their specific transactions. Different
companies often reach different conclusions for economically similar transactions,
because the standards leave room for judgment in complex areas. This dashboard
tracks those implementation patterns across three areas:

- **Topic 832 (Government Grants):** A new standard affecting every company
  receiving federal funding under the CHIPS Act, Inflation Reduction Act, and
  Infrastructure Investment and Jobs Act.
- **ASC 815 (Derivatives & Hedging):** One of the most complex areas of U.S. GAAP,
  with high restatement rates.
- **Restatement Patterns:** Which accounting standard areas produce the most
  financial reporting errors.

## Data sources

All data comes from SEC EDGAR public APIs. No paid data sources.

- **EFTS** (Full-Text Search): Searches the text of all SEC filings
- **XBRL Frames**: Structured financial data across all filers
- **Company Facts**: Detailed XBRL data for individual companies

Filing data refreshes periodically. XBRL data updates quarterly.

## Methodology

Filings are identified by searching for specific ASC topic references
(e.g., "ASU 2025-10", "ASC 815") in 10-K and 10-Q annual and quarterly reports.
Adoption status is classified by keyword matching in the accounting policy
footnotes. See the project's
[methodology documentation](https://github.com/placeholder/gaap-tracker)
for details.

## Open source

This project is open source under the MIT License.
[View on GitHub](https://github.com/placeholder/gaap-tracker).

Contributions welcome. See CONTRIBUTING.md for guidelines.
""")
