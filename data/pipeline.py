"""
Data pipeline for GAAP Tracker.
Orchestrates EFTS search, XBRL data, and caching to produce
analysis-ready DataFrames for the dashboard.
"""

import pandas as pd
from datetime import datetime

from data.efts import search_all_filings, search_topic832, search_by_asc_topic, count_filings
from data.cache import get_cached_search, cache_search, make_query_hash
from data.xbrl import get_frames, get_derivative_filers, get_fair_value_filers

__all__ = [
    "get_topic832_filings",
    "get_topic832_timeline",
    "get_asc815_overview",
    "get_restatement_filings",
    "get_dashboard_stats",
]


def get_topic832_filings(start_date: str = "2025-01-01") -> pd.DataFrame:
    """Fetch all filings mentioning Topic 832 / ASU 2025-10, with caching."""
    query_hash = make_query_hash("topic832", start_date=start_date)
    cached = get_cached_search(query_hash, max_age_hours=12)
    if cached:
        return pd.DataFrame(cached)

    results = search_topic832(start_date=start_date)
    cache_search(query_hash, "topic832", results, ttl_hours=12)
    return pd.DataFrame(results)


def get_topic832_timeline(start_date: str = "2025-01-01") -> pd.DataFrame:
    """Topic 832 filings aggregated by month for timeline chart."""
    df = get_topic832_filings(start_date)
    if df.empty:
        return df
    df["file_date"] = pd.to_datetime(df["file_date"])
    df["month"] = df["file_date"].dt.to_period("M").astype(str)
    timeline = df.groupby("month").agg(
        filing_count=("accession_number", "count"),
        companies=("company_name", "nunique"),
    ).reset_index()
    return timeline


def get_asc815_overview(period: str = "CY2024Q4I") -> dict:
    """Overview stats for ASC 815 derivatives section."""
    derivative_filers = get_derivative_filers(period)
    filing_count = count_filings('"ASC 815"', forms=["10-K", "10-Q"])
    return {
        "filer_count": len(derivative_filers),
        "total_filings_mentioning": filing_count,
        "filers": derivative_filers,
    }


def get_restatement_filings(start_date: str = "2024-01-01") -> pd.DataFrame:
    """Fetch amended filings mentioning restatement."""
    query_hash = make_query_hash("restatements", start_date=start_date)
    cached = get_cached_search(query_hash, max_age_hours=48)
    if cached:
        return pd.DataFrame(cached)

    results = search_all_filings(
        query='"restatement"',
        forms=["10-K/A", "10-Q/A"],
        start_date=start_date,
    )
    cache_search(query_hash, "restatements", results, ttl_hours=48)
    return pd.DataFrame(results)


def get_dashboard_stats() -> dict:
    """Key stats for the overview page."""
    topic832_count = count_filings(
        '"ASU 2025-10" OR "Topic 832"',
        forms=["10-K", "10-Q"],
        start_date="2025-01-01",
    )
    asc815_count = count_filings('"ASC 815"', forms=["10-K", "10-Q"])
    asc820_count = count_filings('"ASC 820"', forms=["10-K", "10-Q"])
    restatement_count = count_filings(
        '"restatement"',
        forms=["10-K/A", "10-Q/A"],
        start_date="2024-01-01",
    )
    return {
        "topic832_filings": topic832_count,
        "asc815_filings": asc815_count,
        "asc820_filings": asc820_count,
        "restatements_since_2024": restatement_count,
        "as_of": datetime.now().strftime("%Y-%m-%d"),
    }
