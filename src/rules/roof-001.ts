export const ROOF_001 = {
  id: "ROOF-001",
  version: "0.1.0",
  vertical: "roofing",
  eventTypes: ["SEVERE_WEATHER_HAIL", "HAIL"],
  serviceTerms: ["roof repair", "roof inspection", "storm damage repair"],
  consequenceSignalTypes: [
    "PROPERTY_DAMAGE",
    "ROOFING_DAMAGE",
    "STRUCTURAL_DAMAGE",
  ],
  behaviorSignalPrefix: "SEARCH_",
  demandWindowHours: 336,
  minimumIndependentEvidenceGroups: 2,
} as const;
