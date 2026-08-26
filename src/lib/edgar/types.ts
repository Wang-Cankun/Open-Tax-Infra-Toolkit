export interface Filing {
  accessionNumber: string;
  companyName: string;
  cik: string;
  formType: string;
  fileDate: string;
  periodEnding: string;
}

export interface SearchResult {
  total: number;
  filings: Filing[];
}

export interface XbrlFiler {
  cik: number;
  entityName: string;
  value: number;
  filed: string;
  period: string;
  tag: string;
}

export interface TimelinePoint {
  month: string;
  filingCount: number;
  companies: number;
}
