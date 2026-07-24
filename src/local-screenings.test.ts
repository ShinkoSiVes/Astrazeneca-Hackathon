import { afterEach, describe, expect, it, vi } from "vitest";
import { readStoredScreenings, screeningHistoryKey, storeScreeningSnapshot, type LocalScreeningDraft } from "./local-screenings";

const baseDraft = {
  fieldReference: "FIELD-2026-014", ageRange: "50-59", sexAtBirth: "Female", barangay: "Banaue", municipality: "Banaue — Ifugao", province: "Cordillera Administrative Region (CAR)", smokingStatus: "Former smoker", packFrequency: "Per day", packYears: "12", householdSmoke: "No", occupationalExposure: "None reported", lungHistory: "None reported", familyHistory: "No", persistentCough: "No", breathlessness: "No", bloodInSputum: "No", weightLoss: "No", weightLossAmount: "", oxygenSaturation: "97", clinicianNotes: "Demo entry",
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
  });
});
