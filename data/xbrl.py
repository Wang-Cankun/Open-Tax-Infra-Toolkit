"""
xbrl.py — SEC EDGAR XBRL API wrapper for GAAP Tracker.

Endpoints used:
  Frames API:         https://data.sec.gov/api/xbrl/frames/{taxonomy}/{tag}/{unit}/{period}.json
  Company Facts API:  https://data.sec.gov/api/xbrl/companyfacts/CIK{cik10}.json
  Company Concept API: https://data.sec.gov/api/xbrl/companyconcept/CIK{cik10}/{taxonomy}/{tag}.json
"""

from __future__ import annotations

import time
import httpx
import pandas as pd

__all__ = [
    "pad_cik",
    "get_frames",
    "get_company_facts",
    "get_company_concept",
    "get_derivative_filers",
    "get_fair_value_filers",
]

_BASE = "https://data.sec.gov/api/xbrl"
_HEADERS = {"User-Agent": "GAAP-Tracker research@gaap-tracker.org"}
_MIN_INTERVAL = 1.0 / 10  # 10 req/sec

_last_request_time: float = 0.0


def _get(url: str) -> dict:
    """Send a rate-limited GET request and return parsed JSON."""
    global _last_request_time
    elapsed = time.monotonic() - _last_request_time
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)
    response = httpx.get(url, headers=_HEADERS, timeout=30)
    response.raise_for_status()
    _last_request_time = time.monotonic()
    return response.json()


def pad_cik(cik: str | int) -> str:
    """Zero-pad a CIK to 10 digits."""
    return str(int(cik)).zfill(10)


def get_frames(
    tag: str,
    unit: str = "USD",
    period: str = "CY2024Q4I",
    taxonomy: str = "us-gaap",
) -> pd.DataFrame:
    """
    Fetch one XBRL tag across all filers for a given period.

    Returns DataFrame with columns:
      accn, cik, entityName, loc, end, val
    plus normalized columns: entity_name, value, period.
    """
    url = f"{_BASE}/frames/{taxonomy}/{tag}/{unit}/{period}.json"
    data = _get(url)
    rows = data.get("data", [])
    cols = data.get("fields", ["accn", "cik", "entityName", "loc", "end", "val"])
    df = pd.DataFrame(rows, columns=cols)
    df = df.rename(columns={"entityName": "entity_name", "val": "value"})
    df["period"] = period
    df["taxonomy"] = taxonomy
    df["tag"] = tag
    df["unit"] = unit
    return df


def get_company_facts(cik: str) -> dict:
    """
    Fetch all XBRL facts for one company.

    Returns the raw JSON dict (keyed by taxonomy → tag → unit → list of facts).
    """
    cik10 = pad_cik(cik)
    url = f"{_BASE}/companyfacts/CIK{cik10}.json"
    return _get(url)


def get_company_concept(
    cik: str,
    tag: str,
    taxonomy: str = "us-gaap",
) -> pd.DataFrame:
    """
    Fetch the full filing history of one XBRL tag for one company.

    Returns a DataFrame with columns from the API units list, plus:
      taxonomy, tag, cik, entity_name.
    """
    cik10 = pad_cik(cik)
    url = f"{_BASE}/companyconcept/CIK{cik10}/{taxonomy}/{tag}.json"
    data = _get(url)

    entity_name = data.get("entityName", "")
    units: dict = data.get("units", {})

    frames: list[pd.DataFrame] = []
    for unit_label, facts in units.items():
        df = pd.DataFrame(facts)
        df["unit"] = unit_label
        frames.append(df)

    if not frames:
        return pd.DataFrame()

    result = pd.concat(frames, ignore_index=True)
    result["taxonomy"] = taxonomy
    result["tag"] = tag
    result["cik"] = cik10
    result["entity_name"] = entity_name
    return result


def get_derivative_filers(period: str = "CY2024Q4I") -> pd.DataFrame:
    """
    Return all filers that reported DerivativeAssets for the given period.
    """
    return get_frames(tag="DerivativeAssets", unit="USD", period=period)


def get_fair_value_filers(period: str = "CY2024Q4I") -> pd.DataFrame:
    """
    Return all filers that reported Level 3 fair value assets for the given period.

    Uses FairValueMeasurementWithUnobservableInputsReconciliationRecurringBasisAssetValue,
    which is the standard GAAP tag for Level 3 recurring fair value assets.
    """
    tag = "FairValueMeasurementWithUnobservableInputsReconciliationRecurringBasisAssetValue"
    return get_frames(tag=tag, unit="USD", period=period)
