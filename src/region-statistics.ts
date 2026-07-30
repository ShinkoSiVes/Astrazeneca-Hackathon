import type { LocalScreeningDraft } from "./local-screenings";
import type { SyntheticRegion } from "./population-dashboard";

export type RegionRiskFactor = {
  label: string;
  percent: number;
  count: number;
};

export type RegionStatistics = {
  regionId: string;
  regionLabel: string;
  publicRiskLevel: SyntheticRegion["signalLevel"];
  publicCasesLabel: string;
  appScreenedCount: number;
  totalEligibleProfiles: number;
  shareOfLocalScreeningsPercent: number | null;
  topRiskFactors: RegionRiskFactor[];
  futureFeatures: string[];
};

const normaliseRegionName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const checklistOptions = (value: string) => (value ? value.split(" | ").map((item) => item.trim()).filter(Boolean) : []);

const isCurrentOrFormerSmoker = (status: string) => {
  const normalised = status.trim().toLowerCase();
  return normalised.includes("current") || normalised.includes("former") || normalised.includes("ex-smoker") || normalised.includes("ex smoker");
};

const hasOccupationalExposure = (value: string) => checklistOptions(value).some((option) => {
  const normalised = option.toLowerCase();
  return normalised !== "none" && normalised !== "none reported" && normalised !== "unknown" && normalised !== "";
});

const factorMatchers: { label: string; matches: (profile: LocalScreeningDraft) => boolean }[] = [
  { label: "Current or former smoking", matches: (profile) => isCurrentOrFormerSmoker(profile.smokingStatus) },
  { label: "Secondhand / household smoke", matches: (profile) => profile.householdSmoke === "Yes" || checklistOptions(profile.occupationalExposure).some((option) => /secondhand/i.test(option)) },
  { label: "Biomass fuel exposure", matches: (profile) => checklistOptions(profile.occupationalExposure).some((option) => /biomass/i.test(option)) },
  { label: "Occupational exposure", matches: (profile) => hasOccupationalExposure(profile.occupationalExposure) },
  { label: "Previous tuberculosis", matches: (profile) => profile.previousTuberculosis === "Yes" },
  { label: "Family history of lung cancer", matches: (profile) => profile.familyHistory === "Yes" },
  { label: "COPD history", matches: (profile) => profile.copd === "Yes" },
];

export const profilesForRegion = (profiles: LocalScreeningDraft[], regionLabel: string) => {
  const regionKey = normaliseRegionName(regionLabel);
  return profiles.filter((profile) => normaliseRegionName(profile.province) === regionKey);
};

export const buildRegionStatistics = (
  region: SyntheticRegion,
  publicRegion: SyntheticRegion,
  eligibleProfiles: LocalScreeningDraft[],
): RegionStatistics => {
  const regionProfiles = profilesForRegion(eligibleProfiles, region.label);
  const appScreenedCount = regionProfiles.length;
  const totalEligibleProfiles = eligibleProfiles.length;
  const shareOfLocalScreeningsPercent = totalEligibleProfiles === 0
    ? null
    : Number(((appScreenedCount / totalEligibleProfiles) * 100).toFixed(1));

  const topRiskFactors = factorMatchers
    .map(({ label, matches }) => {
      const count = regionProfiles.filter(matches).length;
      const percent = appScreenedCount === 0 ? 0 : Number(((count / appScreenedCount) * 100).toFixed(1));
      return { label, percent, count };
    })
    .filter((factor) => factor.count > 0)
    .sort((left, right) => right.percent - left.percent || right.count - left.count);

  return {
    regionId: region.id,
    regionLabel: region.label,
    publicRiskLevel: publicRegion.signalLevel,
    publicCasesLabel: publicRegion.coverage,
    appScreenedCount,
    totalEligibleProfiles,
    shareOfLocalScreeningsPercent,
    topRiskFactors,
    futureFeatures: [
      "Monthly risk and screening trends",
      "Referral, CT completion, and confirmed-case funnel",
      "Population-level smoking / pollution prevalence layers",
      "AI risk-score averages and planning forecasts",
    ],
  };
};
