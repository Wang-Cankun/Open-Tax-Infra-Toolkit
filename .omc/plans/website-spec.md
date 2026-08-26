# GAAP Tracker Website Spec

## What This Website IS

A public tool that shows ONE thing: when FASB issues a complex standard, companies interpret it differently. The website makes this visible using real SEC filing data.

It is NOT a generic financial data dashboard. It is NOT a FASB reference site. It is a focused tool that tracks implementation patterns.

## Target Audience

1. Technical accountants and auditors (primary users)
2. Accounting researchers and faculty
3. Data journalists covering financial reporting
4. GitHub users interested in SEC data projects
5. (Implicitly) A USCIS officer who clicks the link

## Pages

### 1. Home / Landing

Purpose: explain what this is in 10 seconds, show one compelling visualization.

Content:
- Headline: "How are companies implementing new accounting standards?"
- Subheadline: one sentence explaining the tool
- Hero visualization: Topic 832 adoption curve (bar chart, filings per month)
- Three stat cards: total Topic 832 filings, companies reporting derivatives, restatement count
- Brief "How it works" section: we search SEC EDGAR for filings mentioning specific accounting standards, extract disclosure patterns, and track how implementation approaches differ across companies
- CTA: "Explore Topic 832" button

NO dark theme. Light, clean, professional. Think Bloomberg Terminal crossed with a research paper.

### 2. Topic 832: Government Grants

Purpose: track adoption of the new government grants standard in real time.

Sections:
- **Adoption curve**: filings per month mentioning ASU 2025-10 (bar chart)
- **Adoption status breakdown**: pie or donut chart showing "evaluating impact" vs "adopted" vs "early adopted" (classified by keyword matching in footnote text)
- **Company table**: searchable, sortable table of all companies that mentioned Topic 832, with columns: company, form type, filing date, SIC industry
- **Industry distribution**: horizontal bar chart showing which industries reference Topic 832 most (by SIC code grouping)

Future (Phase 2):
- Side-by-side disclosure comparison: pick two companies, see their Topic 832 footnotes next to each other
- Recognition method tracker: which companies chose net method vs gross method

### 3. ASC 815: Derivatives

Purpose: show the scale and complexity of derivatives reporting across SEC filers.

Sections:
- **Filer count**: how many companies report derivative positions (from XBRL)
- **Top filers bar chart**: largest derivative positions by company (horizontal bars)
- **Industry breakdown**: derivative exposure by sector
- **Company table**: searchable list of all filers with derivative assets, sortable by value

Future (Phase 2):
- Hedge designation patterns: how many use fair value hedges vs cash flow hedges
- Disclosure depth analysis: some companies file 5 derivative tags, others 50+

### 4. Restatements

Purpose: quantify the cost of inconsistent GAAP implementation.

Sections:
- **Restatement volume by quarter**: bar chart of amended filings (10-K/A, 10-Q/A) mentioning "restatement"
- **Form type breakdown**: 10-K/A vs 10-Q/A split
- **Company table**: searchable restatement filings

Future (Phase 2):
- ASC topic heatmap: which standards are cited most in restatement disclosures
- Material weakness correlation

### 5. About

Purpose: explain methodology, data sources, and how to contribute.

Content:
- What this tracks (2-3 paragraphs)
- Data sources (SEC EDGAR EFTS, XBRL Frames)
- Update frequency
- Open source link
- Brief author bio (professional, no immigration language)

## Visualizations Summary

| Viz | Page | Chart Type | Data Source |
|---|---|---|---|
| Topic 832 adoption curve | Home + Topic 832 | Bar chart (monthly) | EFTS |
| Key metrics (3-4 cards) | Home | Stat cards | EFTS + XBRL |
| Adoption status breakdown | Topic 832 | Donut/pie | EFTS + keyword classification |
| Industry distribution | Topic 832 | Horizontal bars | EFTS (SIC codes) |
| Top derivative filers | ASC 815 | Horizontal bars | XBRL Frames |
| Derivative industry breakdown | ASC 815 | Horizontal bars | XBRL Frames |
| Restatement volume by quarter | Restatements | Bar chart | EFTS |
| Form type split | Restatements | Pie/donut | EFTS |

## Design Direction

- Light background (white/off-white)
- Clean typography, professional
- Color palette: SEC blue (#003366) as primary, warm accent for highlights
- Data-dense but not cluttered
- Tables are first-class citizens (practitioners want data, not just charts)
- Mobile-responsive but desktop-first
- No gradients, no glassmorphism, no dark mode gimmicks
- Think: Stripe documentation meets Bloomberg data

## Tech Decisions

- Next.js 14 App Router (already set up)
- Tailwind CSS (already set up)
- Recharts for charts (lighter than Tremor, more control)
- Native HTML tables styled with Tailwind (no heavy table library)
- Server components for data fetching
- ISR caching (6h revalidate)

## What Makes This Worth Starring

1. Real data from a free public API that most people don't know exists (EFTS)
2. Focused on a gap nobody else fills (GAAP implementation tracking)
3. Clean, useful UI that practitioners actually use
4. Well-documented codebase (README, methodology, contributing guide)
5. Active maintenance (weekly data refresh, responses to issues)
