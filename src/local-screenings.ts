export type LocalScreeningDraft = {
  fieldReference: string;
  ageRange: string;
  sexAtBirth: string;
  barangay: string;
  municipality: string;
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
  weightLossAmount: string;
  oxygenSaturation: string;
  clinicianNotes: string;
};

export type ScreeningRecordUpdate = {
  id: string;
  savedAt: string;
  data: LocalScreeningDraft;
};

export type StoredScreening = {
  id: string;
  savedAt: string;
  data: LocalScreeningDraft;
  updates: ScreeningRecordUpdate[];
};

export type TemporaryRecordSummary = {
  savedAt: string;
  status: string;
  screening?: LocalScreeningDraft;
};

export const screeningHistoryKey = "aeris-screening-history-v1";
export const temporaryRecordKey = "aeris-temporary-ai-record-v1";

export const emptyLocalScreeningDraft: LocalScreeningDraft = {
  fieldReference: "", ageRange: "", sexAtBirth: "", barangay: "", municipality: "", province: "", smokingStatus: "", packFrequency: "", packYears: "", householdSmoke: "", occupationalExposure: "", lungHistory: "", familyHistory: "", persistentCough: "", breathlessness: "", bloodInSputum: "", weightLoss: "", weightLossAmount: "", oxygenSaturation: "", clinicianNotes: "",
};

export const normaliseScreeningDraft = (value: Partial<LocalScreeningDraft> | undefined): LocalScreeningDraft => ({
  ...emptyLocalScreeningDraft,
  ...Object.fromEntries(Object.entries(value ?? {}).filter(([key, item]) => key in emptyLocalScreeningDraft && typeof item === "string")),
});

const isRecordLike = (value: unknown): value is { id: unknown; savedAt: unknown; data: unknown; updates?: unknown } => Boolean(value && typeof value === "object" && !Array.isArray(value) && "id" in value && "savedAt" in value && "data" in value);

const normaliseStoredScreening = (value: { id: unknown; savedAt: unknown; data: unknown; updates?: unknown }): StoredScreening | null => {
  if (typeof value.id !== "string" || typeof value.savedAt !== "string" || !value.id || !value.savedAt || !value.data || typeof value.data !== "object") return null;
  const legacySnapshot: ScreeningRecordUpdate = { id: `${value.id}-${value.savedAt}`, savedAt: value.savedAt, data: normaliseScreeningDraft(value.data as Partial<LocalScreeningDraft>) };
  const updates = Array.isArray(value.updates)
    ? value.updates
      .filter((update): update is { id: unknown; savedAt: unknown; data: unknown } => Boolean(update && typeof update === "object" && "id" in update && "savedAt" in update && "data" in update))
      .filter((update) => typeof update.id === "string" && typeof update.savedAt === "string" && Boolean(update.id) && Boolean(update.savedAt) && Boolean(update.data) && typeof update.data === "object")
      .map((update) => ({ id: update.id as string, savedAt: update.savedAt as string, data: normaliseScreeningDraft(update.data as Partial<LocalScreeningDraft>) }))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    : [];
  const recordUpdates = updates.length ? updates : [legacySnapshot];
  const latest = recordUpdates[0];
  return { id: value.id, savedAt: latest.savedAt, data: latest.data, updates: recordUpdates };
};

export const readStoredScreenings = (): StoredScreening[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(screeningHistoryKey) ?? "[]") as unknown;
    if (!Array.isArray(saved)) return [];
    return saved
      .filter(isRecordLike)
      .map(normaliseStoredScreening)
      .filter((item): item is StoredScreening => item !== null)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
};

export const storeScreeningSnapshot = (draft: LocalScreeningDraft) => {
  const savedAt = new Date().toISOString();
  const reference = draft.fieldReference.trim() || `local-${savedAt}`;
  const history = readStoredScreenings();
  const snapshot: ScreeningRecordUpdate = { id: `${reference}-${savedAt}`, savedAt, data: normaliseScreeningDraft(draft) };
  const existingRecord = history.find((item) => item.id === reference);
  const record: StoredScreening = {
    id: reference,
    savedAt,
    data: snapshot.data,
    updates: [snapshot, ...(existingRecord?.updates ?? [])].slice(0, 20),
  };
  const next = [record, ...history.filter((item) => item.id !== reference)].slice(0, 12);
  localStorage.setItem(screeningHistoryKey, JSON.stringify(next));
};

export const deleteStoredScreening = (screeningId: string) => {
  const next = readStoredScreenings().filter((screening) => screening.id !== screeningId);
  localStorage.setItem(screeningHistoryKey, JSON.stringify(next));
  return next;
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
