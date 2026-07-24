export type LocalScreeningDraft = {
  fieldReference: string;
  ageRange: string;
  sexAtBirth: string;
  barangay: string;
  province: string;
  smokingStatus: string;
  packFrequency: string;
  packYears: string;
  householdSmoke: string;
  occupationalExposure: string;
  lungHistory: string;
  familyHistory: string;
  persistentCough: string;
  breathlessness: string;
  bloodInSputum: string;
  weightLoss: string;
  oxygenSaturation: string;
  clinicianNotes: string;
};

export type StoredScreening = {
  id: string;
  savedAt: string;
  data: LocalScreeningDraft;
};

export type TemporaryRecordSummary = {
  savedAt: string;
  status: string;
  screening?: LocalScreeningDraft;
};

export const screeningHistoryKey = "aeris-screening-history-v1";
export const temporaryRecordKey = "aeris-temporary-ai-record-v1";

export const emptyLocalScreeningDraft: LocalScreeningDraft = {
  fieldReference: "", ageRange: "", sexAtBirth: "", barangay: "", province: "", smokingStatus: "", packFrequency: "", packYears: "", householdSmoke: "", occupationalExposure: "", lungHistory: "", familyHistory: "", persistentCough: "", breathlessness: "", bloodInSputum: "", weightLoss: "", oxygenSaturation: "", clinicianNotes: "",
};

export const normaliseScreeningDraft = (value: Partial<LocalScreeningDraft> | undefined): LocalScreeningDraft => ({
  ...emptyLocalScreeningDraft,
  ...Object.fromEntries(Object.entries(value ?? {}).filter(([key, item]) => key in emptyLocalScreeningDraft && typeof item === "string")),
});

export const readStoredScreenings = (): StoredScreening[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(screeningHistoryKey) ?? "[]") as unknown;
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((item): item is StoredScreening => Boolean(item && typeof item === "object" && "id" in item && "savedAt" in item && "data" in item))
      .map((item) => ({ ...item, data: normaliseScreeningDraft(item.data) }))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
};

export const storeScreeningSnapshot = (draft: LocalScreeningDraft) => {
  const savedAt = new Date().toISOString();
  const reference = draft.fieldReference.trim() || `local-${savedAt}`;
  const history = readStoredScreenings();
  const next = [{ id: reference, savedAt, data: normaliseScreeningDraft(draft) }, ...history.filter((item) => item.id !== reference)].slice(0, 12);
  localStorage.setItem(screeningHistoryKey, JSON.stringify(next));
};

export const readTemporaryRecordSummary = (): TemporaryRecordSummary | null => {
  try {
    const parsed = JSON.parse(localStorage.getItem(temporaryRecordKey) ?? "null") as Partial<TemporaryRecordSummary> | null;
    if (!parsed || typeof parsed.savedAt !== "string" || typeof parsed.status !== "string") return null;
    return { savedAt: parsed.savedAt, status: parsed.status, screening: normaliseScreeningDraft(parsed.screening) };
  } catch {
    return null;
  }
};
