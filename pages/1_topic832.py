"""Topic 832 Government Grants Adoption Tracker."""

import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

from data.pipeline import get_topic832_filings, get_topic832_timeline

st.set_page_config(page_title="Topic 832 | GAAP Tracker", layout="wide")

st.title("Topic 832: Government Grants Adoption")
st.markdown(
    "FASB issued ASU 2025-10, establishing the first U.S. GAAP standard for "
    "accounting for government grants by business entities. Every company "
    "receiving federal funding under the CHIPS Act, Inflation Reduction Act, "
    "or infrastructure programs will need to adopt it. "
    "This page tracks adoption patterns as companies begin implementation."
)

# Load data
filings = get_topic832_filings()
timeline = get_topic832_timeline()

if filings.empty:
    st.warning("No Topic 832 filings found. Data may still be loading.")
    st.stop()

# Key metrics
col1, col2, col3 = st.columns(3)
col1.metric("Total Filings Referencing Topic 832", f"{len(filings):,}")
col2.metric("Unique Companies", f"{filings['company_name'].nunique():,}" if "company_name" in filings.columns else "N/A")
if "form_type" in filings.columns:
    col3.metric("10-K Filings", f"{len(filings[filings['form_type'] == '10-K']):,}")

st.divider()

# Timeline
st.subheader("Filing Timeline")
st.markdown("Filings mentioning ASU 2025-10, Topic 832, or ASC 832 by month.")

if not timeline.empty:
    fig = px.bar(
        timeline,
        x="month",
        y="filing_count",
        text="filing_count",
        labels={"month": "Month", "filing_count": "Filings"},
        color_discrete_sequence=["#0A6EBD"],
    )
    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="#FAFAFA",
        xaxis_title=None,
        yaxis_title="Filings",
        showlegend=False,
        height=400,
    )
    fig.update_traces(textposition="outside")
    st.plotly_chart(fig, use_container_width=True)

st.divider()

# Industry breakdown
st.subheader("Industry Breakdown")
if "sic_code" in filings.columns:
    sic_counts = filings["sic_code"].value_counts().head(15).reset_index()
    sic_counts.columns = ["SIC Code", "Filing Count"]
    fig2 = px.bar(
        sic_counts,
        x="Filing Count",
        y="SIC Code",
        orientation="h",
        color_discrete_sequence=["#2E86AB"],
    )
    fig2.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="#FAFAFA",
        yaxis_title=None,
        height=500,
    )
    st.plotly_chart(fig2, use_container_width=True)
else:
    st.info("Industry data not available in current filing records.")

st.divider()

# Filing table
st.subheader("All Filings")
st.markdown("Filings referencing Topic 832, sorted by date.")

display_cols = ["company_name", "form_type", "file_date", "period_ending", "cik"]
available_cols = [c for c in display_cols if c in filings.columns]

search_term = st.text_input("Filter by company name", "")
filtered = filings
if search_term and "company_name" in filings.columns:
    filtered = filings[filings["company_name"].str.contains(search_term, case=False, na=False)]

st.dataframe(
    filtered[available_cols].sort_values("file_date", ascending=False) if "file_date" in available_cols else filtered[available_cols],
    use_container_width=True,
    hide_index=True,
    height=600,
)

st.caption(f"Showing {len(filtered):,} of {len(filings):,} filings. Source: SEC EDGAR EFTS.")
