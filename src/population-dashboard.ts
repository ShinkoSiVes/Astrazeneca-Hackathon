export type SyntheticRegion = {
  id: string;
  label: string;
  signalLevel: "Lower" | "Moderate" | "Higher";
  syntheticRecords: number;
  coverage: string;
};

const signalLevels: SyntheticRegion["signalLevel"][] = ["Lower", "Moderate", "Higher"];

/**
 * UI-only fixture data for TASK-006. Region labels align to the PSA's current
 * 18-region roster, while every signal and count remains static demo data.
 */
const officialRegions = [
  ["region-i", "Region I — Ilocos Region"],
  ["region-ii", "Region II — Cagayan Valley"],
  ["region-iii", "Region III — Central Luzon"],
  ["region-iva", "Region IV-A — CALABARZON"],
  ["region-v", "Region V — Bicol Region"],
  ["region-vi", "Region VI — Western Visayas"],
  ["nir", "Negros Island Region (NIR)"],
  ["region-vii", "Region VII — Central Visayas"],
  ["region-viii", "Region VIII — Eastern Visayas"],
  ["region-ix", "Region IX — Zamboanga Peninsula"],
  ["region-x", "Region X — Northern Mindanao"],
  ["region-xi", "Region XI — Davao Region"],
  ["region-xii", "Region XII — SOCCSKSARGEN"],
  ["ncr", "National Capital Region (NCR)"],
  ["car", "Cordillera Administrative Region (CAR)"],
  ["caraga", "Region XIII — Caraga"],
  ["mimaropa", "MIMAROPA Region"],
  ["barmm", "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"],
] as const;

export const syntheticRegions: SyntheticRegion[] = officialRegions.map(([id, label], index) => ({
  id,
  label,
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
