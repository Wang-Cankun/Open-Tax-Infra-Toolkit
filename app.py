import streamlit as st

st.set_page_config(
    page_title="GAAP Implementation Tracker",
    page_icon=":bar_chart:",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("GAAP Implementation Tracker")
st.markdown(
    "Tracking how U.S. public companies implement complex accounting standards. "
    "Built on SEC EDGAR public data."
)

# Overview page content
from data.pipeline import get_dashboard_stats, get_topic832_timeline
import plotly.express as px

stats = get_dashboard_stats()

col1, col2, col3, col4 = st.columns(4)
col1.metric("Topic 832 Filings", f"{stats['topic832_filings']:,}")
col2.metric("ASC 815 Filings", f"{stats['asc815_filings']:,}")
col3.metric("ASC 820 Filings", f"{stats['asc820_filings']:,}")
col4.metric("Restatements (2024+)", f"{stats['restatements_since_2024']:,}")

st.caption(f"Data as of {stats['as_of']}. Source: SEC EDGAR.")

st.divider()

st.subheader("Topic 832 Adoption Timeline")
st.markdown(
    "FASB finalized the government grants standard (ASU 2025-10). "
    "This chart tracks filings that reference it as companies prepare to adopt."
)

timeline = get_topic832_timeline()
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
        yaxis_title="Number of Filings",
        showlegend=False,
    )
    fig.update_traces(textposition="outside")
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("No Topic 832 filings found yet. Check back as companies begin adopting.")

st.divider()

st.subheader("Recent Filings")
from data.pipeline import get_topic832_filings

recent = get_topic832_filings()
if not recent.empty:
    display_cols = ["company_name", "form_type", "file_date", "period_ending"]
    available_cols = [c for c in display_cols if c in recent.columns]
    st.dataframe(
        recent[available_cols].head(15),
        use_container_width=True,
        hide_index=True,
    )
