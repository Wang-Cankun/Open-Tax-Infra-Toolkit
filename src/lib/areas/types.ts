export interface AreaConfig {
  slug: string;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  ascNumber: string;
  accent: "navy" | "teal" | "amber" | "danger";
  eftsQueries: string[];
  eftsForms: string[];
  eftsStartDate?: string;
  fetchAll?: boolean;
  limit?: number;
  tableMaxRows?: number;
  tableSource: "efts" | "xbrl";
  xbrl?: {
    tag: string;
    unit: string;
    label: string;
  };
  intro: {
    what: string;
    why: string;
    tracks: string;
  };
}
