"""Restatement Analysis — which accounting standards produce the most errors."""

import streamlit as st
import plotly.express as px
import pandas as pd

from data.pipeline import get_restatement_filings

st.set_page_config(page_title="Restatements | GAAP Tracker", layout="wide")

st.title("Restatement Analysis")
st.markdown(
    "When companies misapply accounting standards, they file amended reports "
    "(10-K/A, 10-Q/A) disclosing the restatement. This page tracks restatement "
    "filings and identifies which accounting standard areas are most frequently involved."
)

# Load data
restatements = get_restatement_filings()

if restatements.empty:
    st.warning("No restatement data available. Data may still be loading.")
    st.stop()

st.metric("Restatement Filings Since 2024", f"{len(restatements):,}")

st.divider()

# Timeline
st.subheader("Restatement Filings Over Time")
if "file_date" in restatements.columns:
    restatements["file_date"] = pd.to_datetime(restatements["file_date"], errors="coerce")
    restatements["quarter"] = restatements["file_date"].dt.to_period("Q").astype(str)
    quarterly = restatements.groupby("quarter").size().reset_index(name="count")

    fig = px.bar(
        quarterly,
        x="quarter",
        y="count",
        text="count",
        labels={"quarter": "Quarter", "count": "Amended Filings"},
        color_discrete_sequence=["#D64045"],
    )
    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="#FAFAFA",
        xaxis_title=None,
        showlegend=False,
        height=400,
    )
    fig.update_traces(textposition="outside")
    st.plotly_chart(fig, use_container_width=True)

st.divider()

# Form type breakdown
st.subheader("By Filing Type")
if "form_type" in restatements.columns:
    form_counts = restatements["form_type"].value_counts().reset_index()
    form_counts.columns = ["Form Type", "Count"]
    col1, col2 = st.columns([1, 2])
    with col1:
        st.dataframe(form_counts, use_container_width=True, hide_index=True)
    with col2:
        fig2 = px.pie(
            form_counts,
            values="Count",
            names="Form Type",
            color_discrete_sequence=["#D64045", "#E8998D", "#F4D35E"],
        )
        fig2.update_layout(
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            font_color="#FAFAFA",
        )
        st.plotly_chart(fig2, use_container_width=True)

st.divider()

# Filing table
st.subheader("All Restatement Filings")
display_cols = ["company_name", "form_type", "file_date", "period_ending"]
available_cols = [c for c in display_cols if c in restatements.columns]

search = st.text_input("Filter by company name", "", key="restatement_search")
filtered = restatements
if search and "company_name" in restatements.columns:
    filtered = restatements[restatements["company_name"].str.contains(search, case=False, na=False)]

st.dataframe(
    filtered[available_cols].sort_values("file_date", ascending=False) if "file_date" in available_cols else filtered[available_cols],
    use_container_width=True,
    hide_index=True,
    height=500,
)
st.caption(f"{len(filtered):,} amended filings mentioning 'restatement'. Source: SEC EDGAR EFTS.")
