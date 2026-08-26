"""
SQLite caching layer for the GAAP tracker Streamlit dashboard.

Avoids re-fetching data from SEC EDGAR APIs on every page load.
Database file: data/db/gaap_tracker.db (relative to repo root)
"""

import hashlib
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

__all__ = [
    "get_db",
    "make_query_hash",
    "get_cached_search",
    "cache_search",
    "get_filing",
    "cache_filing",
    "get_filing_content",
    "cache_filing_content",
    "get_cached_xbrl",
    "cache_xbrl",
]

_DB_PATH = Path(__file__).parent / "db" / "gaap_tracker.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS search_results (
    query_hash   TEXT PRIMARY KEY,
    query        TEXT,
    results_json TEXT,
    result_count INTEGER,
    fetched_at   TIMESTAMP,
    expires_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS filings (
    accession_number TEXT PRIMARY KEY,
    cik              TEXT,
    company_name     TEXT,
    form_type        TEXT,
    file_date        TEXT,
    period_ending    TEXT,
    sic_code         TEXT,
    raw_json         TEXT
);

CREATE TABLE IF NOT EXISTS filing_content (
    accession_number TEXT,
    section_name     TEXT,
    content          TEXT,
    extracted_at     TIMESTAMP,
    PRIMARY KEY (accession_number, section_name)
);

CREATE TABLE IF NOT EXISTS xbrl_frames (
    tag        TEXT,
    period     TEXT,
    data_json  TEXT,
    fetched_at TIMESTAMP,
    PRIMARY KEY (tag, period)
);
"""


def get_db() -> sqlite3.Connection:
    """Return a sqlite3 connection, creating tables on first use."""
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.executescript(_SCHEMA)
    conn.commit()
    return conn


def make_query_hash(query: str, **params) -> str:
    """Return a deterministic MD5 hash for a query + params combination."""
    key = json.dumps({"query": query, "params": params}, sort_keys=True)
    return hashlib.md5(key.encode()).hexdigest()


# ---------------------------------------------------------------------------
# search_results
# ---------------------------------------------------------------------------


def get_cached_search(query_hash: str, max_age_hours: int = 24) -> Optional[list]:
    """Return cached search results or None if missing / expired."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT results_json, expires_at FROM search_results WHERE query_hash = ?",
            (query_hash,),
        ).fetchone()

    if row is None:
        return None

    expires_at = datetime.fromisoformat(row["expires_at"])
    if datetime.utcnow() > expires_at:
        return None

    return json.loads(row["results_json"])


def cache_search(
    query_hash: str,
    query: str,
    results: list[dict],
    ttl_hours: int = 24,
) -> None:
    """Store search results in the cache."""
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=ttl_hours)

    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO search_results
                (query_hash, query, results_json, result_count, fetched_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                query_hash,
                query,
                json.dumps(results),
                len(results),
                now.isoformat(),
                expires_at.isoformat(),
            ),
        )
        conn.commit()


# ---------------------------------------------------------------------------
# filings
# ---------------------------------------------------------------------------


def get_filing(accession_number: str) -> Optional[dict]:
    """Return cached filing metadata or None if not found."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM filings WHERE accession_number = ?",
            (accession_number,),
        ).fetchone()

    if row is None:
        return None

    return dict(row)


def cache_filing(filing: dict) -> None:
    """Store filing metadata.  filing must contain 'accession_number'."""
    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO filings
                (accession_number, cik, company_name, form_type,
                 file_date, period_ending, sic_code, raw_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                filing.get("accession_number"),
                filing.get("cik"),
                filing.get("company_name"),
                filing.get("form_type"),
                filing.get("file_date"),
                filing.get("period_ending"),
                filing.get("sic_code"),
                json.dumps(filing),
            ),
        )
        conn.commit()


# ---------------------------------------------------------------------------
# filing_content
# ---------------------------------------------------------------------------


def get_filing_content(accession_number: str, section: str) -> Optional[str]:
    """Return cached extracted text for a filing section or None if not found."""
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT content FROM filing_content
            WHERE accession_number = ? AND section_name = ?
            """,
            (accession_number, section),
        ).fetchone()

    return row["content"] if row else None


def cache_filing_content(
    accession_number: str,
    section: str,
    content: str,
) -> None:
    """Store extracted text for a filing section."""
    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO filing_content
                (accession_number, section_name, content, extracted_at)
            VALUES (?, ?, ?, ?)
            """,
            (accession_number, section, content, datetime.utcnow().isoformat()),
        )
        conn.commit()


# ---------------------------------------------------------------------------
# xbrl_frames
# ---------------------------------------------------------------------------


def get_cached_xbrl(
    tag: str,
    period: str,
    max_age_hours: int = 168,
) -> Optional[dict]:
    """Return cached XBRL frames data or None if missing / expired."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT data_json, fetched_at FROM xbrl_frames WHERE tag = ? AND period = ?",
            (tag, period),
        ).fetchone()

    if row is None:
        return None

    fetched_at = datetime.fromisoformat(row["fetched_at"])
    if datetime.utcnow() > fetched_at + timedelta(hours=max_age_hours):
        return None

    return json.loads(row["data_json"])


def cache_xbrl(tag: str, period: str, data: dict) -> None:
    """Store XBRL frames API data."""
    with get_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO xbrl_frames (tag, period, data_json, fetched_at)
            VALUES (?, ?, ?, ?)
            """,
            (tag, period, json.dumps(data), datetime.utcnow().isoformat()),
        )
        conn.commit()
