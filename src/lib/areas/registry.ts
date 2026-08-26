import { AreaConfig } from "./types";

export const AREAS: AreaConfig[] = [
  {
    slug: "topic-832",
    name: "Topic 832: Government Grants",
    shortName: "Topic 832",
    subtitle:
      "Tracking adoption of the first U.S. GAAP standard for government grant accounting.",
    description:
      "New standard for CHIPS Act, IRA, and infrastructure grant accounting.",
    ascNumber: "832",
    accent: "navy",
    eftsQueries: ['"ASU 2025-10"', '"Topic 832"', '"ASC 832"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "efts",
    tableMaxRows: 100,
    intro: {
      what: "In 2025, FASB issued ASU 2025-10, creating the first U.S. accounting standard specifically for government grants received by business entities. Before this, there was no authoritative U.S. GAAP guidance for how companies should report government grants in their financial statements.",
      why: "The federal government has committed hundreds of billions of dollars through the CHIPS and Science Act, the Inflation Reduction Act, and the Infrastructure Investment and Jobs Act. Every company receiving this funding must now decide how to account for it: which recognition method to use (net vs. gross), when to record the income, and how to present it.",
      tracks:
        "We search SEC filings for references to ASU 2025-10, Topic 832, and ASC 832 to monitor which companies are disclosing the standard and how adoption is progressing across industries.",
    },
  },
  {
    slug: "asc-815",
    name: "ASC 815: Derivatives & Hedging",
    shortName: "ASC 815",
    subtitle: "Disclosure patterns and derivative positions across SEC filers.",
    description:
      "Complex derivatives classification, hedge accounting, and effectiveness testing.",
    ascNumber: "815",
    accent: "teal",
    eftsQueries: ['"ASC 815"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "xbrl",
    xbrl: {
      tag: "DerivativeAssets",
      unit: "USD",
      label: "Derivative Assets",
    },
    intro: {
      what: "ASC 815 governs how companies report derivatives (financial instruments whose value depends on an underlying asset, rate, or index) and hedging activities. It covers recognition, measurement, and disclosure of instruments like interest rate swaps, foreign currency forwards, and commodity futures.",
      why: "Companies must classify each derivative, decide whether it qualifies for hedge accounting, document the hedging relationship, and test effectiveness on an ongoing basis. Different classification decisions for the same economic instrument produce different financial statement results.",
      tracks:
        "Using XBRL structured data from the SEC, we identify every company that reported derivative asset positions in their most recent filings and analyze disclosure patterns across industries.",
    },
  },
  {
    slug: "asc-820",
    name: "ASC 820: Fair Value Measurement",
    shortName: "ASC 820",
    subtitle:
      "Fair value hierarchy and measurement patterns across SEC filers.",
    description:
      "Level 1/2/3 hierarchy classification and unobservable input disclosures.",
    ascNumber: "820",
    accent: "amber",
    eftsQueries: ['"ASC 820"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "xbrl",
    xbrl: {
      tag: "FairValueMeasurementWithUnobservableInputsReconciliationRecurringBasisAssetValue",
      unit: "USD",
      label: "Level 3 Fair Value Assets",
    },
    intro: {
      what: "ASC 820 defines fair value as the price that would be received to sell an asset in an orderly transaction. It establishes a three-level hierarchy: Level 1 (quoted market prices), Level 2 (observable inputs), and Level 3 (unobservable inputs requiring management judgment).",
      why: "Level 3 measurements rely on management estimates that cannot be independently verified. Different valuation techniques and assumptions for the same type of asset can produce materially different fair values, affecting reported earnings and balance sheet strength.",
      tracks:
        "We track companies reporting Level 3 fair value assets using XBRL data, showing which filers have the largest concentrations of hard-to-value assets.",
    },
  },
  {
    slug: "asc-810",
    name: "ASC 810: Consolidation",
    shortName: "ASC 810",
    subtitle: "Variable interest entity analysis and consolidation patterns.",
    description:
      "VIE identification, primary beneficiary assessment, and consolidation decisions.",
    ascNumber: "810",
    accent: "danger",
    eftsQueries: ['"ASC 810"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "efts",
    intro: {
      what: "ASC 810 determines when a company must consolidate another entity into its financial statements. The key question: does the company have a controlling financial interest? For variable interest entities (VIEs), this requires analyzing who has the power to direct activities and the obligation to absorb losses.",
      why: "Consolidation decisions significantly affect a company's reported assets, liabilities, and risk profile. Companies with identical economic arrangements can reach different conclusions about whether consolidation is required, depending on how they assess power and economics.",
      tracks:
        "We search SEC filings for references to ASC 810 to identify companies disclosing consolidation judgments and VIE arrangements.",
    },
  },
  {
    slug: "asc-842",
    name: "ASC 842: Leases",
    shortName: "ASC 842",
    subtitle:
      "Lease liability recognition and classification across SEC filers.",
    description:
      "Operating vs. finance lease classification and right-of-use asset measurement.",
    ascNumber: "842",
    accent: "navy",
    eftsQueries: ['"ASC 842"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "xbrl",
    xbrl: {
      tag: "OperatingLeaseLiability",
      unit: "USD",
      label: "Operating Lease Liabilities",
    },
    intro: {
      what: "ASC 842 requires companies to recognize lease liabilities and right-of-use assets on the balance sheet for virtually all leases. This was a major change from the prior standard, which allowed operating leases to remain off-balance-sheet.",
      why: "Companies must classify leases as operating or finance, determine the lease term (including options to extend or terminate), and calculate the present value of lease payments. Different discount rates and term assumptions produce different liability amounts.",
      tracks:
        "We track operating lease liabilities reported via XBRL across all SEC filers, showing the scale of lease obligations by company and industry.",
    },
  },
  {
    slug: "asc-606",
    name: "ASC 606: Revenue Recognition",
    shortName: "ASC 606",
    subtitle:
      "Revenue recognition patterns and contract accounting across industries.",
    description:
      "Five-step revenue model, performance obligations, and contract modifications.",
    ascNumber: "606",
    accent: "teal",
    eftsQueries: ['"ASC 606"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "xbrl",
    xbrl: {
      tag: "Revenues",
      unit: "USD",
      label: "Revenue from Contracts",
    },
    intro: {
      what: "ASC 606 establishes a five-step model for recognizing revenue from contracts with customers: identify the contract, identify performance obligations, determine the transaction price, allocate the price, and recognize revenue as obligations are satisfied.",
      why: "The standard requires significant judgment in areas like variable consideration, contract modifications, and determining when performance obligations are satisfied over time versus at a point in time. Companies in the same industry can recognize revenue at different points for similar arrangements.",
      tracks:
        "We track revenue from customer contracts reported via XBRL across SEC filers, and search filings for ASC 606 implementation disclosures.",
    },
  },
  {
    slug: "asc-326",
    name: "ASC 326: Credit Losses (CECL)",
    shortName: "ASC 326",
    subtitle:
      "Current expected credit loss estimates across financial institutions.",
    description:
      "CECL methodology, lifetime loss estimation, and allowance adequacy.",
    ascNumber: "326",
    accent: "amber",
    eftsQueries: ['"ASC 326"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "xbrl",
    xbrl: {
      tag: "FinancingReceivableAllowanceForCreditLosses",
      unit: "USD",
      label: "Allowance for Credit Losses",
    },
    intro: {
      what: "ASC 326 introduced the current expected credit losses (CECL) model, requiring companies to estimate expected credit losses over the lifetime of financial assets at origination. This replaced the prior incurred-loss model, which recognized losses only when probable.",
      why: "CECL requires forward-looking estimates using historical data, current conditions, and reasonable forecasts. Different modeling approaches, economic assumptions, and forecast horizons produce different allowance levels for similar loan portfolios.",
      tracks:
        "We track allowance for credit losses reported via XBRL across SEC filers, focusing on financial institutions where CECL has the largest impact.",
    },
  },
  {
    slug: "asc-718",
    name: "ASC 718: Stock Compensation",
    shortName: "ASC 718",
    subtitle: "Stock compensation expense and equity award patterns.",
    description:
      "Option valuation, RSU accounting, and compensation expense recognition.",
    ascNumber: "718",
    accent: "danger",
    eftsQueries: ['"ASC 718"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "xbrl",
    xbrl: {
      tag: "AllocatedShareBasedCompensationExpense",
      unit: "USD",
      label: "Share-Based Compensation",
    },
    intro: {
      what: "ASC 718 requires companies to measure the cost of employee stock options, restricted stock units, and other share-based payments at fair value on the grant date and recognize that cost as compensation expense over the vesting period.",
      why: "Fair value estimation of stock options requires choosing a valuation model (Black-Scholes, binomial, Monte Carlo) and inputs including expected volatility, expected term, and risk-free rate. Different assumptions for the same option grant produce different expense amounts.",
      tracks:
        "We track share-based compensation expense reported via XBRL across SEC filers, showing how compensation costs vary by company size and industry.",
    },
  },
  {
    slug: "asc-740",
    name: "ASC 740: Income Taxes",
    shortName: "ASC 740",
    subtitle: "Deferred tax positions and income tax accounting patterns.",
    description:
      "Deferred tax assets/liabilities, valuation allowances, and uncertain tax positions.",
    ascNumber: "740",
    accent: "navy",
    eftsQueries: ['"ASC 740"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "xbrl",
    xbrl: {
      tag: "DeferredIncomeTaxLiabilities",
      unit: "USD",
      label: "Deferred Tax Liabilities",
    },
    intro: {
      what: "ASC 740 governs how companies account for income taxes, including current tax expense, deferred tax assets and liabilities arising from temporary differences between book and tax reporting, and uncertain tax positions that require probability-weighted measurement.",
      why: "Deferred tax accounting requires judgment about future taxable income, the likelihood of realizing deferred tax assets, and whether tax positions will be sustained on examination. Different assumptions about future profitability and tax law interpretation produce different effective tax rates.",
      tracks:
        "We track deferred income tax liabilities reported via XBRL across SEC filers, showing the scale of tax timing differences by company.",
    },
  },
  {
    slug: "asc-350",
    name: "ASC 350: Goodwill & Intangibles",
    shortName: "ASC 350",
    subtitle: "Goodwill balances and impairment testing patterns.",
    description:
      "Goodwill impairment testing, reporting unit determination, and write-down triggers.",
    ascNumber: "350",
    accent: "teal",
    eftsQueries: ['"ASC 350"'],
    eftsForms: ["10-K", "10-Q"],
    tableSource: "xbrl",
    xbrl: {
      tag: "Goodwill",
      unit: "USD",
      label: "Goodwill",
    },
    intro: {
      what: "ASC 350 requires companies to test goodwill for impairment at least annually. Goodwill arises when a company pays more than the fair value of net assets in an acquisition. If the carrying value of a reporting unit exceeds its fair value, the company must write down goodwill.",
      why: "Impairment testing requires estimating the fair value of reporting units, which involves projecting future cash flows, selecting discount rates, and choosing valuation methodologies. Different assumptions can determine whether a multi-billion dollar write-down is triggered or avoided.",
      tracks:
        "We track goodwill balances reported via XBRL across SEC filers, showing which companies carry the largest goodwill amounts relative to their total assets.",
    },
  },
  {
    slug: "restatements",
    name: "Restatements",
    shortName: "Restatements",
    subtitle:
      "Tracking amended SEC filings that disclose financial restatements.",
    description:
      "Amended filings disclosing corrections to previously issued financial statements.",
    ascNumber: "",
    accent: "danger",
    eftsQueries: ['"restatement"'],
    eftsForms: ["10-K/A", "10-Q/A"],
    eftsStartDate: "2024-01-01",
    fetchAll: false,
    limit: 50,
    tableSource: "efts",
    intro: {
      what: "A financial restatement occurs when a company discovers that previously issued financial statements contained errors and must be corrected. The company files an amended report (10-K/A or 10-Q/A) with the SEC disclosing the nature and impact of the error.",
      why: "In complex areas of U.S. GAAP, including derivatives, fair value measurement, and consolidation, the accounting standards require significant professional judgment. When companies apply the same standard differently and an auditor or regulator later determines one approach was incorrect, a restatement results.",
      tracks:
        "We search SEC EDGAR for amended filings (10-K/A and 10-Q/A) that contain the word 'restatement,' providing a real-time view of how many companies are correcting their financial statements.",
    },
  },
];

export function getAllAreas(): AreaConfig[] {
  return AREAS;
}

export function getAreaBySlug(slug: string): AreaConfig | undefined {
  return AREAS.find((area) => area.slug === slug);
}
