"""Basic tests for data pipeline modules."""

from data.cache import make_query_hash, get_db
from data.xbrl import pad_cik


def test_query_hash_deterministic():
    h1 = make_query_hash("topic832", start_date="2025-01-01")
    h2 = make_query_hash("topic832", start_date="2025-01-01")
    assert h1 == h2


def test_query_hash_different_for_different_params():
    h1 = make_query_hash("topic832", start_date="2025-01-01")
    h2 = make_query_hash("topic832", start_date="2024-01-01")
    assert h1 != h2


def test_pad_cik():
    assert pad_cik("320193") == "0000320193"
    assert pad_cik(320193) == "0000320193"
    assert pad_cik("0000320193") == "0000320193"


def test_db_creates_tables():
    conn = get_db()
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )
    tables = [row[0] for row in cursor.fetchall()]
    assert "search_results" in tables
    assert "filings" in tables
    assert "filing_content" in tables
    assert "xbrl_frames" in tables
    conn.close()
