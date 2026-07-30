import type { EnvironmentalRiskSnapshot } from "./environmental-risk";
import type { RegionStatistics } from "./region-statistics";
import type { SyntheticRegion } from "./population-dashboard";

export type RegionRiskSummary = {
  level: SyntheticRegion["signalLevel"];
  headline: string;
  bullets: string[];
  environmentalNote: string;
  sources: string[];
};

const levelPhrase = (level: SyntheticRegion["signalLevel"]) => {
  if (level === "Higher") return "higher";
  if (level === "Moderate") return "moderate";
  return "lower";
};

export const buildRegionRiskSummary = (
  publicRegion: SyntheticRegion,
  statistics: RegionStatistics,
  environmental: EnvironmentalRiskSnapshot | null,
): RegionRiskSummary => {
  const level = publicRegion.signalLevel;
  const bullets: string[] = [];

  bullets.push(
    `Public LCP registry signal is ${level} for this region (${publicRegion.coverage}). This reflects hospital admissions by region of residence from 2009–2017, not a live incidence rate.`,
  );

  if (environmental?.pm25 != null) {
    bullets.push(
      `Current outdoor air near the regional reference point shows PM2.5 at ${environmental.pm25} μg/m³ (${environmental.exposureTier} environmental tier; WHO annual guideline is 5 μg/m³).`,
    );
    environmental.lungCancerRiskFactors.slice(0, 2).forEach((factor) => bullets.push(factor));
  } else {
    bullets.push("Environmental air-quality context is unavailable right now, so this summary is based mainly on the public case baseline and any local screening profiles.");
  }

  if (statistics.appScreenedCount > 0) {
    bullets.push(
      `${statistics.appScreenedCount} unique eligible app screening profile${statistics.appScreenedCount === 1 ? "" : "s"} ${statistics.appScreenedCount === 1 ? "is" : "are"} saved for this region (${statistics.shareOfLocalScreeningsPercent ?? 0}% of local heatmap-eligible profiles).`,
    );
    statistics.topRiskFactors.slice(0, 3).forEach((factor) => {
      bullets.push(`${factor.label}: ${factor.percent}% of this region’s saved eligible profiles (${factor.count}).`);
    });
  } else {
    bullets.push("No eligible local screening profiles are saved for this region yet, so local exposure bars do not contribute to the explanation.");
  }

  if (level === "Higher" && environmental?.exposureTier === "Lower") {
    bullets.push("Note: outdoor PM2.5 is not elevated in the latest reading, so the Higher label is driven mainly by the historical LCP case baseline rather than current air quality alone.");
  }
  if (level === "Lower" && environmental?.exposureTier === "Higher") {
    bullets.push("Note: current outdoor PM2.5 is elevated even though the historical LCP case baseline is Lower for this region. Treat these as separate signals.");
  }

  return {
    level,
    headline: `Why this region is marked ${levelPhrase(level)} risk`,
    bullets,
    environmentalNote: environmental
      ? `Environmental reading from ${environmental.geocodedName} via ${environmental.source}. This is a regional reference point, not a full provincial monitor network.`
      : "Open-Meteo environmental context can be loaded when online for a regional reference point.",
    sources: [
      "LCP Lung Cancer Registry 2009–2017 (public baseline)",
      "Local Aeris screening profiles on this device",
      environmental ? environmental.source : "Open-Meteo air quality (when available)",
    ],
  };
};
