export type SyntheticRegion = {
  id: string;
  label: string;
  signalLevel: "Lower" | "Moderate" | "Higher";
  syntheticRecords: number;
  coverage: string;
};

/**
 * Public baseline data sourced from the Lung Center of the Philippines (LCP)
 * Lung Cancer Registry Monograph, 2009–2017 (published December 2025).
 * Figures represent confirmed lung cancer patients by region of permanent
 * address at time of first hospital admission (n = 3,969 total).
 *
 * Source: Balanag VM Jr, et al. Monograph on Lung Cancer: Lung Cancer Registry
 * Data of 2009 to 2017. LCP Scientific Proceedings. Vol 13 No. 2, Dec 2025.
 * https://lcpscientificproceedings.com/index.php/splcp/article/view/16895
 *
 * National context: GLOBOCAN 2022 estimates 23,728 new lung cancer cases
 * nationally per year (IARC, 2022). The LCP registry is hospital-based and
 * covers a 9-year cumulative period; figures should not be read as annual rates.
 *
 * NIR (Negros Island Region) is not separately reported in the LCP registry.
 * The count shown is an estimate derived from Western Visayas and Central
 * Visayas proportions; it is marked as an estimate in the coverage label.
 */
type RegionEntry = {
  id: string;
  label: string;
  cases: number;
  signalLevel: SyntheticRegion["signalLevel"];
};

const publicBaselineRegions: RegionEntry[] = [
  { id: "ncr",        label: "National Capital Region (NCR)",                              cases: 1796, signalLevel: "Higher" },
  { id: "region-iva", label: "Region IV-A — CALABARZON",                                  cases: 776,  signalLevel: "Higher" },
  { id: "region-iii", label: "Region III — Central Luzon",                                cases: 765,  signalLevel: "Higher" },
  { id: "region-i",   label: "Region I — Ilocos Region",                                  cases: 95,   signalLevel: "Moderate" },
  { id: "region-v",   label: "Region V — Bicol Region",                                   cases: 95,   signalLevel: "Moderate" },
  { id: "region-ii",  label: "Region II — Cagayan Valley",                                cases: 91,   signalLevel: "Moderate" },
  { id: "mimaropa",   label: "MIMAROPA Region",                                            cases: 66,   signalLevel: "Moderate" },
  { id: "region-viii",label: "Region VIII — Eastern Visayas",                             cases: 63,   signalLevel: "Moderate" },
  { id: "region-vi",  label: "Region VI — Western Visayas",                               cases: 33,   signalLevel: "Lower" },
  { id: "car",        label: "Cordillera Administrative Region (CAR)",                     cases: 21,   signalLevel: "Lower" },
  { id: "nir",        label: "Negros Island Region (NIR)",                                 cases: 19,   signalLevel: "Lower" },
  { id: "region-vii", label: "Region VII — Central Visayas",                              cases: 5,    signalLevel: "Lower" },
  { id: "region-ix",  label: "Region IX — Zamboanga Peninsula",                           cases: 11,   signalLevel: "Lower" },
  { id: "region-xii", label: "Region XII — SOCCSKSARGEN",                                 cases: 11,   signalLevel: "Lower" },
  { id: "region-x",   label: "Region X — Northern Mindanao",                              cases: 8,    signalLevel: "Lower" },
  { id: "region-xi",  label: "Region XI — Davao Region",                                  cases: 1,    signalLevel: "Lower" },
  { id: "caraga",     label: "Region XIII — Caraga",                                       cases: 3,    signalLevel: "Lower" },
  { id: "barmm",      label: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",   cases: 4,    signalLevel: "Lower" },
];

export const syntheticRegions: SyntheticRegion[] = publicBaselineRegions.map(({ id, label, cases, signalLevel }) => ({
  id,
  label,
  signalLevel,
  syntheticRecords: cases,
  coverage: id === "nir" ? "~19 estimated (LCP 2009–2017)" : `${cases} recorded (LCP 2009–2017)`,
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
