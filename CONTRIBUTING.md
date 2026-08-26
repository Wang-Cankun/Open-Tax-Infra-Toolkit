# Contributing

Contributions welcome. This project tracks how U.S. public companies implement complex accounting standards using SEC EDGAR public data.

## How to contribute

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests (`python -m pytest tests/`)
5. Submit a pull request

## What we need

- **New ASC topic analyses** — add a notebook or dashboard page for an accounting standard area not yet covered
- **Disclosure classification improvements** — better parsing of footnote text to identify accounting method choices
- **Data quality fixes** — corrections to how filings are categorized or classified
- **Documentation** — clearer methodology descriptions, better docstrings

## Data sources

All data comes from SEC EDGAR public APIs. No paid data sources. No proprietary content.

- EFTS (full-text search): `https://efts.sec.gov/LATEST/search-index`
- XBRL Frames: `https://data.sec.gov/api/xbrl/frames/`
- Company Facts: `https://data.sec.gov/api/xbrl/companyfacts/`

## Code style

- Python 3.10+
- Functions over classes unless state management is needed
- Type hints on function signatures
- Docstrings on public functions
- No unnecessary abstractions
