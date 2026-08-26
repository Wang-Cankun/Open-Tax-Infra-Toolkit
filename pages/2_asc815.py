"""ASC 815 Derivatives & Hedging Disclosure Analysis."""

import streamlit as st
import plotly.express as px
import pandas as pd

from data.pipeline import get_asc815_overview
from data.xbrl import get_derivative_filers

st.set_page_config(page_title="ASC 815 | GAAP Tracker", layout="wide")

st.title("ASC 815: Derivatives & Hedging")
st.markdown(
    "Derivatives accounting under ASC 815 is one of the most complex areas of "
    "U.S. GAAP. Companies must classify instruments, designate hedging relationships, "
    "test effectiveness, and disclose fair values. This page analyzes disclosure "
    "patterns across SEC filers using XBRL data."
)

# Load data
overview = get_asc815_overview()

col1, col2 = st.columns(2)
col1.metric("Companies Reporting Derivative Positions", f"{overview['filer_count']:,}")
col2.metric("Filings Mentioning ASC 815", f"{overview['total_filings_mentioning']:,}")

st.divider()

# Derivative filers analysis
st.subheader("Companies with Derivative Positions (XBRL)")
st.markdown(
    "Companies that reported DerivativeAssets in their most recent quarterly filing, "
    "sourced from the XBRL Frames API."
)

filers = overview["filers"]
if isinstance(filers, pd.DataFrame) and not filers.empty:
    # Top filers by reported value
    if "value" in filers.columns:
        top_filers = filers.nlargest(20, "value").copy()
        top_filers["value_billions"] = top_filers["value"] / 1e9

        fig = px.bar(
            top_filers,
            x="value_billions",
            y="entity_name" if "entity_name" in top_filers.columns else top_filers.index,
            orientation="h",
            labels={"value_billions": "Derivative Assets ($ Billions)", "entity_name": ""},
            color_discrete_sequence=["#2E86AB"],
        )
        fig.update_layout(
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            font_color="#FAFAFA",
            height=600,
            yaxis={"categoryorder": "total ascending"},
        )
        st.plotly_chart(fig, use_container_width=True)

    # Full table
    st.subheader("All Filers")
    display_cols = [c for c in ["entity_name", "value", "filed", "cik"] if c in filers.columns]
    search = st.text_input("Filter by company name", "", key="asc815_search")
    filtered = filers
    if search and "entity_name" in filers.columns:
        filtered = filers[filers["entity_name"].str.contains(search, case=False, na=False)]
    st.dataframe(
        filtered[display_cols].sort_values("value", ascending=False) if "value" in display_cols else filtered[display_cols],
        use_container_width=True,
        hide_index=True,
        height=500,
    )
    st.caption(f"{len(filtered):,} companies. Source: SEC EDGAR XBRL Frames API.")
else:
    st.info("Derivative filer data not available. XBRL data may still be loading.")
