import { describe, expect, it } from "vitest";
import { emptyLocalScreeningDraft, type LocalScreeningDraft } from "./local-screenings";
import { buildRegionStatistics } from "./region-statistics";
import { syntheticRegions } from "./population-dashboard";

const profile = (overrides: Partial<LocalScreeningDraft>): LocalScreeningDraft => ({
  ...emptyLocalScreeningDraft,
  fieldReference: overrides.fieldReference ?? "FIELD-1",
  previousSurveyResponse: "No",
  ...overrides,
});

describe("buildRegionStatistics", () => {
  const centralLuzon = syntheticRegions.find((region) => region.id === "region-iii")!;

  it("computes share of local screenings and ranked risk-factor bars for a region", () => {
    const profiles = [
      profile({
        fieldReference: "A",
        province: "Region III — Central Luzon",
        smokingStatus: "Current smoker",
        previousTuberculosis: "Yes",
        occupationalExposure: "Construction | Biomass fuel exposure",
      }),
      profile({
        fieldReference: "B",
        province: "Region III — Central Luzon",
        smokingStatus: "Never smoker",
        householdSmoke: "Yes",
      }),
      profile({
        fieldReference: "C",
        province: "National Capital Region (NCR)",
        smokingStatus: "Current smoker",
      }),
    ];

    const statistics = buildRegionStatistics(centralLuzon, centralLuzon, profiles);

    expect(statistics.appScreenedCount).toBe(2);
    expect(statistics.shareOfLocalScreeningsPercent).toBe(66.7);
    expect(statistics.publicRiskLevel).toBe("Higher");
    expect(statistics.publicCasesLabel).toMatch(/765 recorded/i);
    expect(statistics.topRiskFactors[0]).toMatchObject({ label: "Current or former smoking", percent: 50, count: 1 });
    expect(statistics.topRiskFactors.some((factor) => factor.label === "Biomass fuel exposure" && factor.percent === 50)).toBe(true);
    expect(statistics.futureFeatures.length).toBeGreaterThan(0);
  });

  it("returns empty factor bars when the region has no local profiles", () => {
    const statistics = buildRegionStatistics(centralLuzon, centralLuzon, [
      profile({ province: "National Capital Region (NCR)", smokingStatus: "Current smoker" }),
    ]);

    expect(statistics.appScreenedCount).toBe(0);
    expect(statistics.shareOfLocalScreeningsPercent).toBe(0);
    expect(statistics.topRiskFactors).toEqual([]);
  });
});
