export type SyntheticRegion = {
  id: string;
  label: string;
  signalLevel: "Lower" | "Moderate" | "Higher";
  syntheticRecords: number;
  coverage: string;
};

const signalLevels: SyntheticRegion["signalLevel"][] = ["Lower", "Moderate", "Higher"];

/**
 * UI-only fixture data for TASK-006. These numbered regions are intentionally
 * not attributed to real administrative boundaries or live health data.
 */
export const syntheticRegions: SyntheticRegion[] = Array.from({ length: 18 }, (_, index) => ({
  id: `region-${index + 1}`,
  label: `Region ${String(index + 1).padStart(2, "0")}`,
  signalLevel: signalLevels[index % signalLevels.length],
  syntheticRecords: 24 + ((index * 13) % 57),
  coverage: `${62 + ((index * 7) % 31)}%`,
}));

export const populationDataKey = "aeris-population-data-v1";

export const readLocalPopulationFixtureCount = () => {
  try {
    const records = JSON.parse(localStorage.getItem(populationDataKey) || "[]");
    return Array.isArray(records) ? records.length : 0;
  } catch {
    return 0;
  }
};
