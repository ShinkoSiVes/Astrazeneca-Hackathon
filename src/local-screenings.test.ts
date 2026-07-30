import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyLocalScreeningDraft, normaliseScreeningDraft, readStoredScreenings, screeningHistoryKey, storeScreeningSnapshot, type LocalScreeningDraft } from "./local-screenings";

const baseDraft = {
  ...emptyLocalScreeningDraft,
  fieldReference: "FIELD-2026-014", age: "56", ageRange: "50-59", sexAtBirth: "Female", barangay: "Banaue", municipality: "Banaue — Ifugao", province: "Cordillera Administrative Region (CAR)", occupation: "Teacher", smokingStatus: "Former smoker", packFrequency: "Pack-years", packYears: "12", yearsSinceQuitting: "4", householdSmoke: "No", occupationalExposure: "None reported", previousTuberculosis: "No", copd: "No", asthma: "No", previousMalignancy: "No", familyHistory: "No", persistentCough: "No", breathlessness: "No", bloodInSputum: "No", chestPain: "No", weightLoss: "No", hoarseness: "No", fatigue: "No", previousSurveyResponse: "No", oxygenSaturation: "97", chestXrayAvailable: "No", physicalExamFindings: "Normal examination", clinicianNotes: "Demo entry",
} as LocalScreeningDraft;

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("local screening records", () => {
  it("keeps new screenings under the same field reference as timestamped updates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T09:30:00.000Z"));
    storeScreeningSnapshot(baseDraft);
    vi.setSystemTime(new Date("2026-07-25T09:30:00.000Z"));
    storeScreeningSnapshot({ ...baseDraft, persistentCough: "Yes" });

    const [record] = readStoredScreenings();
    expect(readStoredScreenings()).toHaveLength(1);
    expect(record.id).toBe(baseDraft.fieldReference);
    expect(record.data.persistentCough).toBe("Yes");
    expect(record.updates).toHaveLength(2);
    expect(record.updates.map((update) => update.savedAt)).toEqual(["2026-07-25T09:30:00.000Z", "2026-07-24T09:30:00.000Z"]);
  });

  it("shows a legacy saved screening as its first update", () => {
    localStorage.setItem(screeningHistoryKey, JSON.stringify([{ id: baseDraft.fieldReference, savedAt: "2026-07-24T09:30:00.000Z", data: baseDraft }]));

    const [record] = readStoredScreenings();
    expect(record.updates).toHaveLength(1);
    expect(record.updates[0].data.fieldReference).toBe(baseDraft.fieldReference);
    expect(record.inputMode).toBe("structured");
    expect(record.inputEvidence).toEqual({});
  });

  it("retains source text and confirmation separately for each update", () => {
    storeScreeningSnapshot(baseDraft, {
      smokingStatus: {
        rawText: "used to smoke",
        suggestedValue: "Former smoker",
        confirmedValue: "Former smoker",
      },
    }, "text");

    const [record] = readStoredScreenings();
    expect(record.inputMode).toBe("text");
    expect(record.data.smokingStatus).toBe("Former smoker");
    expect(record.inputEvidence.smokingStatus?.rawText).toBe("used to smoke");
    expect(record.updates[0].inputEvidence.smokingStatus?.confirmedValue).toBe("Former smoker");
  });

  it("retains new profile variables and migrates legacy secondhand-smoke exposure", () => {
    const profile = normaliseScreeningDraft({
      fieldReference: "FIELD-NEW",
      occupation: "Miner",
      householdSmoke: "Yes",
      physicalExamFindings: "Crackles (rales) | Digital clubbing",
      vitalSigns: "BP 118/76, pulse 72",
      temperatureC: "36.7",
      respiratoryRate: "16",
      systolicBloodPressure: "118",
      diastolicBloodPressure: "76",
      pulseRate: "72",
    });

    expect(profile.occupation).toBe("Miner");
    expect(profile.occupationalExposure).toBe("Secondhand smoke");
    expect(profile.physicalExamFindings).toContain("Digital clubbing");
    expect(profile).toEqual(expect.objectContaining({
      vitalSigns: "BP 118/76, pulse 72",
      temperatureC: "36.7",
      respiratoryRate: "16",
      systolicBloodPressure: "118",
      diastolicBloodPressure: "76",
      pulseRate: "72",
    }));
  });
});
