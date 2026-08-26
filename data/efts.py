"""
SEC EDGAR Full-Text Search (EFTS) API wrapper.

Base URL: https://efts.sec.gov/LATEST/search-index
Rate limit: 10 req/sec (enforced via sleep-based throttling).
"""

from __future__ import annotations

import time
import httpx

__all__ = [
    "search_filings",
    "search_all_filings",
    "count_filings",
    "search_topic832",
    "search_by_asc_topic",
]

_BASE_URL = "https://efts.sec.gov/LATEST/search-index"
_HEADERS = {"User-Agent": "GAAP-Tracker research@gaap-tracker.org"}
_MIN_INTERVAL = 1.0 / 10  # 10 req/sec
_last_request_time: float = 0.0


def _throttle() -> None:
    """Enforce 10 req/sec rate limit via sleep-based throttling."""
    global _last_request_time
    elapsed = time.monotonic() - _last_request_time
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)
    _last_request_time = time.monotonic()


def _extract_hit(hit: dict) -> dict:
    """Extract normalized fields from a raw EFTS hit."""
    src = hit.get("_source", {})
    return {
        "accession_number": src.get("file_num") or hit.get("_id", ""),
        "company_name": src.get("display_names", [None])[0] or src.get("entity_name", ""),
        "cik": src.get("ciks", [None])[0] or "",
        "form_type": src.get("form_type", ""),
        "file_date": src.get("file_date", ""),
        "period_ending": src.get("period_of_report", ""),
    }


def search_filings(
    query: str,
    forms: list[str] | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    start: int = 0,
    limit: int = 50,
) -> dict:
    """Search EFTS for filings matching query.

    Args:
        query: Search query. Supports exact phrases with quotes,
               e.g. '"ASU 2025-10"'.
        forms: Filter by form type, e.g. ["10-K", "10-Q"].
        start_date: Earliest filing date, ISO format "YYYY-MM-DD".
        end_date: Latest filing date, ISO format "YYYY-MM-DD".
        start: Offset for pagination.
        limit: Max results per page (max 50 per EFTS).

    Returns:
        Raw JSON response dict with hits.
    """
    params: dict = {
        "q": query,
        "dateRange": "custom" if (start_date or end_date) else None,
        "startdt": start_date,
        "enddt": end_date,
        "from": start,
        "size": limit,
    }
    # Remove None values
    params = {k: v for k, v in params.items() if v is not None}

    if forms:
        params["forms"] = ",".join(forms)

    _throttle()
    response = httpx.get(_BASE_URL, params=params, headers=_HEADERS, timeout=30)
    response.raise_for_status()
    return response.json()


def search_all_filings(
    query: str,
    forms: list[str] | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    """Paginate through all EFTS results for a query.

    Args:
        query: Search query string.
        forms: Filter by form type.
        start_date: Earliest filing date, ISO format "YYYY-MM-DD".
        end_date: Latest filing date, ISO format "YYYY-MM-DD".

    Returns:
        Flat list of normalized filing dicts, each with keys:
        accession_number, company_name, cik, form_type,
        file_date, period_ending.
    """
    page_size = 50
    results: list[dict] = []
    start = 0

    while True:
        data = search_filings(
            query=query,
            forms=forms,
            start_date=start_date,
            end_date=end_date,
            start=start,
            limit=page_size,
        )
        hits = data.get("hits", {}).get("hits", [])
        if not hits:
            break

        results.extend(_extract_hit(h) for h in hits)

        total = data.get("hits", {}).get("total", {}).get("value", 0)
        start += len(hits)
        if start >= total:
            break

    return results


def count_filings(
    query: str,
    forms: list[str] | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> int:
    """Return the total count of filings matching query without fetching all results.

    Args:
        query: Search query string.
        forms: Filter by form type.
        start_date: Earliest filing date, ISO format "YYYY-MM-DD".
        end_date: Latest filing date, ISO format "YYYY-MM-DD".

    Returns:
        Total hit count as integer.
    """
    data = search_filings(
        query=query,
        forms=forms,
        start_date=start_date,
        end_date=end_date,
        start=0,
        limit=1,
    )
    return data.get("hits", {}).get("total", {}).get("value", 0)


def search_topic832(start_date: str = "2025-01-01") -> list[dict]:
    """Search for filings mentioning ASU 2025-10 / Topic 832 / ASC 832.

    Searches 10-K and 10-Q filings and returns deduplicated results
    by accession number.

    Args:
        start_date: Earliest filing date, ISO format "YYYY-MM-DD".
                    Defaults to "2025-01-01".

    Returns:
        Deduplicated list of normalized filing dicts.
    """
    queries = ['"ASU 2025-10"', '"Topic 832"', '"ASC 832"']
    forms = ["10-K", "10-Q"]

    seen: set[str] = set()
    results: list[dict] = []

    for q in queries:
        hits = search_all_filings(query=q, forms=forms, start_date=start_date)
        for hit in hits:
            key = hit["accession_number"]
            if key not in seen:
                seen.add(key)
                results.append(hit)

    return results


def search_by_asc_topic(
    topic: str,
    start_date: str | None = None,
) -> list[dict]:
    """Search 10-K and 10-Q filings by ASC topic number.

    Args:
        topic: ASC topic number string, e.g. "815", "820", "810".
        start_date: Earliest filing date, ISO format "YYYY-MM-DD".

    Returns:
        List of normalized filing dicts.
    """
    query = f'"ASC {topic}"'
    return search_all_filings(
        query=query,
        forms=["10-K", "10-Q"],
        start_date=start_date,
    )
