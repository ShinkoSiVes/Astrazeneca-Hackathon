import { describe, expect, it } from "vitest";
import { estimatePlcom2012NoRace } from "./plcom2012-norace";
import { estimateAerisRisk } from "./risk-estimate";
import { emptyLocalScreeningDraft, type LocalScreeningDraft } from "./local-screenings";

/** Matches yellow-cell defaults in the PLCOm2012noRace Excel reference (≈2.191%). */
const excelReferenceCase = {
  ageYears: 60,
  education: 4 as const,
  bmi: 25.8,
  copd: true,
  personalHistoryOfCancer: false,
  familyHistoryOfLungCancer: false,
  currentSmoker: true,
  cigarettesPerDay: 20,
  yearsSmoked: 30,
  yearsSinceQuit: 0,
};

const everSmokerBase: LocalScreeningDraft = {
  ...emptyLocalScreeningDraft,
  fieldReference: "FIELD-1",
  age: "60",
  ageRange: "60-69",
  sexAtBirth: "Male",
  educationLevel: "4",
  heightCm: "170",
  weightKg: "74.6",
  bmi: "25.8",
  province: "National Capital Region (NCR)",
  municipality: "City of Makati",
  barangay: "Poblacion",
  smokingStatus: "Current smoker",
  cigarettesPerDay: "20",
  yearsSmoked: "30",
  packYears: "30",
  yearsSinceQuitting: "Not applicable",
  householdSmoke: "No",
  occupationalExposure: "None reported",
  previousTuberculosis: "No",
  copd: "Yes",
  asthma: "No",
  previousMalignancy: "No",
  familyHistory: "No",
  persistentCough: "No",
  breathlessness: "No",
  bloodInSputum: "No",
  chestPain: "No",
  weightLoss: "No",
  hoarseness: "No",
  fatigue: "No",
  previousSurveyResponse: "No",
  chestXrayAvailable: "No",
  physicalExamFindings: "No abnormal findings",
};

describe("PLCOm2012noRace calculator", () => {
  it("matches the Excel reference probability (~2.19%)", () => {
    const result = estimatePlcom2012NoRace(excelReferenceCase);
    expect(result.applicable).toBe(true);
    if (!result.applicable) return;
    expect(result.percent).toBeCloseTo(2.2, 1);
    expect(result.probability).toBeCloseTo(0.02191, 4);
  });
});

describe("Aeris risk estimate (PLCOm2012noRace only)", () => {
  it("returns the noRace probability for a complete ever-smoker profile", () => {
    const estimate = estimateAerisRisk(everSmokerBase);
    expect(estimate.applicable).toBe(true);
    expect(estimate.percent).toBeCloseTo(2.2, 1);
    expect(estimate.usedEnvironmental).toBe(false);
    expect(estimate.usedPublicRegion).toBe(false);
    expect(estimate.modelId).toBe("PLCOm2012noRace");
  });

  it("marks never-smokers as outside the model", () => {
    const estimate = estimateAerisRisk({
      ...everSmokerBase,
      smokingStatus: "Never smoker",
      cigarettesPerDay: "0",
      yearsSmoked: "0",
      packYears: "0",
    });
    expect(estimate.applicable).toBe(false);
    expect(estimate.percent).toBeNull();
    expect(estimate.unavailableReason).toMatch(/never-smokers/i);
  });

  it("lists symptoms as clinical flags without changing the PLCO percentage", () => {
    const withSymptoms = estimateAerisRisk({
      ...everSmokerBase,
      bloodInSputum: "Yes",
      persistentCough: "Yes",
    });
    const withoutSymptoms = estimateAerisRisk(everSmokerBase);

    expect(withSymptoms.percent).toBe(withoutSymptoms.percent);
    expect(withSymptoms.clinicalFlags.some((flag) => flag.id === "hemoptysis")).toBe(true);
    expect(withoutSymptoms.clinicalFlags).toHaveLength(0);
  });

  it("reduces former-smoker probability when quit years are longer", () => {
    const recentQuit = estimateAerisRisk({
      ...everSmokerBase,
      smokingStatus: "Former smoker",
      yearsSinceQuitting: "1",
    });
    const longQuit = estimateAerisRisk({
      ...everSmokerBase,
      smokingStatus: "Former smoker",
      yearsSinceQuitting: "20",
    });
    expect(longQuit.applicable && recentQuit.applicable).toBe(true);
    expect(longQuit.percent!).toBeLessThan(recentQuit.percent!);
  });

  it("does not mix environmental PM2.5 into the PLCO percentage", () => {
    const environmental = {
      location: { region: everSmokerBase.province, municipality: everSmokerBase.municipality, barangay: everSmokerBase.barangay },
      geocodedName: "Makati",
      latitude: 14.55,
      longitude: 121.03,
      fetchedAt: new Date().toISOString(),
      pm25: 28,
      pm10: 40,
      nitrogenDioxide: 30,
      usAqi: 85,
      whoGuidelineRatio: 5.6,
      exposureTier: "Higher" as const,
      lungCancerRiskFactors: ["Elevated PM2.5"],
      dataLevel: "city" as const,
      source: "Open-Meteo",
      sourceUrl: "https://open-meteo.com",
    };
    const withoutEnv = estimateAerisRisk(everSmokerBase, null);
    const withEnv = estimateAerisRisk(everSmokerBase, environmental);
    expect(withEnv.percent).toBe(withoutEnv.percent);
    expect(withEnv.usedEnvironmental).toBe(true);
    expect(withEnv.localConsiderations.find((item) => item.id === "outdoor-air")?.status).toBe("present");
  });

  it("surfaces local clinician considerations without changing PLCO output", () => {
    const estimate = estimateAerisRisk({
      ...everSmokerBase,
      sexAtBirth: "Female",
      smokingStatus: "Never smoker",
      cigarettesPerDay: "0",
      yearsSmoked: "0",
      packYears: "0",
      previousTuberculosis: "Yes",
      occupationalExposure: "Biomass fuel exposure | Asbestos | Secondhand smoke",
      householdSmoke: "Yes",
    }, null);

    expect(estimate.applicable).toBe(false);
    expect(estimate.localConsiderations).toHaveLength(6);
    expect(estimate.localConsiderations.find((item) => item.id === "never-smoker")?.priority).toBe("high");
    expect(estimate.localConsiderations.find((item) => item.id === "indoor-air")?.status).toBe("present");
    expect(estimate.localConsiderations.find((item) => item.id === "occupational")?.status).toBe("present");
    expect(estimate.localConsiderations.find((item) => item.id === "tb-history")?.status).toBe("present");
    expect(estimate.localConsiderations.find((item) => item.id === "genetic-context")?.priority).toBe("high");
  });
});
