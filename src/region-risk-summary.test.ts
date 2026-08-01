import { describe, expect, it } from "vitest";
import type { EnvironmentalRiskSnapshot } from "./environmental-risk";
import { emptyLocalScreeningDraft } from "./local-screenings";
import { syntheticRegions } from "./population-dashboard";
import { buildRegionRiskSummary } from "./region-risk-summary";
import { buildRegionStatistics } from "./region-statistics";

const environmental = (overrides: Partial<EnvironmentalRiskSnapshot> = {}): EnvironmentalRiskSnapshot => ({
  location: {
    region: "Region III — Central Luzon",
    municipality: "San Fernando, Pampanga — regional reference",
    barangay: "",
  },
  geocodedName: "San Fernando, Pampanga (regional reference)",
  latitude: 15.03,
  longitude: 120.69,
  fetchedAt: "2026-07-30T08:00:00.000Z",
  pm25: 18.2,
  pm10: 24,
  nitrogenDioxide: 28,
  usAqi: 64,
  whoGuidelineRatio: 3.6,
  exposureTier: "Higher",
  lungCancerRiskFactors: [
    "Elevated PM2.5 — fine particulate matter linked to lung cancer from chronic air pollution exposure.",
    "Elevated nitrogen dioxide — marker of traffic-related outdoor air pollution.",
  ],
  dataLevel: "city",
  source: "Open-Meteo Air Quality API (Copernicus CAMS)",
  sourceUrl: "https://open-meteo.com/en/docs/air-quality-api",
  ...overrides,
});

describe("buildRegionRiskSummary", () => {
  const centralLuzon = syntheticRegions.find((region) => region.id === "region-iii")!;

  it("explains Higher risk using LCP baseline, environmental PM2.5, and local screening factors", () => {
    const statistics = buildRegionStatistics(centralLuzon, centralLuzon, [
      {
        ...emptyLocalScreeningDraft,
        fieldReference: "A",
        province: "Region III — Central Luzon",
        smokingStatus: "Current smoker",
        previousSurveyResponse: "No",
      },
    ]);
    const summary = buildRegionRiskSummary(centralLuzon, statistics, environmental());

    expect(summary.level).toBe("Higher");
    expect(summary.headline).toMatch(/higher risk/i);
    expect(summary.bullets.some((bullet) => /public lcp registry signal is higher/i.test(bullet))).toBe(true);
    expect(summary.bullets.some((bullet) => /pm2\.5 at 18\.2/i.test(bullet))).toBe(true);
    expect(summary.bullets.some((bullet) => /current or former smoking/i.test(bullet))).toBe(true);
    expect(summary.sources.some((source) => /open-meteo/i.test(source))).toBe(true);
  });

  it("notes when environmental context is missing", () => {
    const statistics = buildRegionStatistics(centralLuzon, centralLuzon, []);
    const summary = buildRegionRiskSummary(centralLuzon, statistics, null);

    expect(summary.bullets.some((bullet) => /environmental air-quality context is unavailable/i.test(bullet))).toBe(true);
    expect(summary.environmentalNote).toMatch(/when online/i);
  });

  it("flags mismatch when Lower LCP baseline has elevated outdoor PM2.5", () => {
    const lowerRegion = syntheticRegions.find((region) => region.signalLevel === "Lower")!;
    const statistics = buildRegionStatistics(lowerRegion, lowerRegion, []);
    const summary = buildRegionRiskSummary(lowerRegion, statistics, environmental({ exposureTier: "Higher", pm25: 20 }));

    expect(summary.bullets.some((bullet) => /elevated even though the historical lcp case baseline is lower/i.test(bullet))).toBe(true);
  });
});
