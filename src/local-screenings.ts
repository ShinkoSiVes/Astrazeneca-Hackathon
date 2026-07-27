export type LocalScreeningDraft = {
  fieldReference: string;
  age: string;
  ageRange: string;
  sexAtBirth: string;
  barangay: string;
  municipality: string;
  province: string;
  occupation: string;
  smokingStatus: string;
  packFrequency: string;
  packYears: string;
  yearsSinceQuitting: string;
  householdSmoke: string;
  occupationalExposure: string;
  occupationalExposureOther: string;
  lungHistory: string;
  previousTuberculosis: string;
  copd: string;
  asthma: string;
  previousMalignancy: string;
  familyHistory: string;
  persistentCough: string;
  breathlessness: string;
  bloodInSputum: string;
  chestPain: string;
  weightLoss: string;
  weightLossAmount: string;
  hoarseness: string;
  fatigue: string;
  previousSurveyResponse: string;
  vitalSigns: string;
  oxygenSaturation: string;
  chestXrayAvailable: string;
  physicalExamFindings: string;
  physicalExamOther: string;
  clinicianNotes: string;
};

export const screeningAlternativeFields = [
  "sexAtBirth",
  "smokingStatus",
  "previousTuberculosis",
  "copd",
  "asthma",
  "previousMalignancy",
  "familyHistory",
  "persistentCough",
  "breathlessness",
  "bloodInSputum",
  "chestPain",
  "weightLoss",
  "hoarseness",
  "fatigue",
  "chestXrayAvailable",
  "previousSurveyResponse",
] as const;

export type ScreeningAlternativeField = typeof screeningAlternativeFields[number];
export type ScreeningInputMode = "structured" | "text";
export type ScreeningInputEvidenceItem = {
  rawText: string;
  suggestedValue: string;
  confirmedValue: string;
};
export type ScreeningInputEvidence = Partial<Record<ScreeningAlternativeField, ScreeningInputEvidenceItem>>;

export type ScreeningRecordUpdate = {
  id: string;
  savedAt: string;
  data: LocalScreeningDraft;
  inputMode: ScreeningInputMode;
  inputEvidence: ScreeningInputEvidence;
};

export type StoredScreening = {
  id: string;
  savedAt: string;
  data: LocalScreeningDraft;
  inputMode: ScreeningInputMode;
  inputEvidence: ScreeningInputEvidence;
  updates: ScreeningRecordUpdate[];
};

export type TemporaryRecordSummary = {
  savedAt: string;
  status: string;
  screening?: LocalScreeningDraft;
  screeningInputMode?: ScreeningInputMode;
  screeningInputEvidence?: ScreeningInputEvidence;
};

export const screeningHistoryKey = "aeris-screening-history-v1";
export const temporaryRecordKey = "aeris-temporary-ai-record-v1";

export const emptyLocalScreeningDraft: LocalScreeningDraft = {
  fieldReference: "", age: "", ageRange: "", sexAtBirth: "", barangay: "", municipality: "", province: "", occupation: "", smokingStatus: "", packFrequency: "", packYears: "", yearsSinceQuitting: "", householdSmoke: "", occupationalExposure: "", occupationalExposureOther: "", lungHistory: "", previousTuberculosis: "", copd: "", asthma: "", previousMalignancy: "", familyHistory: "", persistentCough: "", breathlessness: "", bloodInSputum: "", chestPain: "", weightLoss: "", weightLossAmount: "", hoarseness: "", fatigue: "", previousSurveyResponse: "", vitalSigns: "", oxygenSaturation: "", chestXrayAvailable: "", physicalExamFindings: "", physicalExamOther: "", clinicianNotes: "",
};

export const normaliseScreeningDraft = (value: Partial<LocalScreeningDraft> | undefined): LocalScreeningDraft => {
  const normalised = {
    ...emptyLocalScreeningDraft,
    ...Object.fromEntries(Object.entries(value ?? {}).filter(([key, item]) => key in emptyLocalScreeningDraft && typeof item === "string")),
  };

  if (!normalised.occupationalExposure.includes("Secondhand smoke") && normalised.householdSmoke === "Yes") {
    normalised.occupationalExposure = [normalised.occupationalExposure, "Secondhand smoke"].filter(Boolean).join(" | ");
  }
  if (normalised.smokingStatus === "Never smoked") normalised.smokingStatus = "Never smoker";

  return normalised;
};

export const normaliseScreeningInputMode = (value: unknown): ScreeningInputMode => value === "text" ? "text" : "structured";

export const normaliseScreeningInputEvidence = (value: unknown): ScreeningInputEvidence => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return Object.fromEntries(screeningAlternativeFields.flatMap((field) => {
    const item = source[field];
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const candidate = item as Record<string, unknown>;
    const evidence: ScreeningInputEvidenceItem = {
      rawText: typeof candidate.rawText === "string" ? candidate.rawText : "",
      suggestedValue: typeof candidate.suggestedValue === "string" ? candidate.suggestedValue : "",
      confirmedValue: typeof candidate.confirmedValue === "string" ? candidate.confirmedValue : "",
    };
    return evidence.rawText || evidence.suggestedValue || evidence.confirmedValue ? [[field, evidence]] : [];
  })) as ScreeningInputEvidence;
};

type RecordLike = {
  id: unknown;
  savedAt: unknown;
  data: unknown;
  inputMode?: unknown;
  inputEvidence?: unknown;
  updates?: unknown;
};

const isRecordLike = (value: unknown): value is RecordLike => Boolean(value && typeof value === "object" && !Array.isArray(value) && "id" in value && "savedAt" in value && "data" in value);

const normaliseStoredScreening = (value: RecordLike): StoredScreening | null => {
  if (typeof value.id !== "string" || typeof value.savedAt !== "string" || !value.id || !value.savedAt || !value.data || typeof value.data !== "object") return null;
  const legacySnapshot: ScreeningRecordUpdate = {
    id: `${value.id}-${value.savedAt}`,
    savedAt: value.savedAt,
    data: normaliseScreeningDraft(value.data as Partial<LocalScreeningDraft>),
    inputMode: normaliseScreeningInputMode(value.inputMode),
    inputEvidence: normaliseScreeningInputEvidence(value.inputEvidence),
  };
  const updates = Array.isArray(value.updates)
    ? value.updates
      .filter((update): update is RecordLike => Boolean(update && typeof update === "object" && "id" in update && "savedAt" in update && "data" in update))
      .filter((update) => typeof update.id === "string" && typeof update.savedAt === "string" && Boolean(update.id) && Boolean(update.savedAt) && Boolean(update.data) && typeof update.data === "object")
      .map((update) => ({
        id: update.id as string,
        savedAt: update.savedAt as string,
        data: normaliseScreeningDraft(update.data as Partial<LocalScreeningDraft>),
        inputMode: normaliseScreeningInputMode(update.inputMode),
        inputEvidence: normaliseScreeningInputEvidence(update.inputEvidence),
      }))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    : [];
  const recordUpdates = updates.length ? updates : [legacySnapshot];
  const latest = recordUpdates[0];
  return {
    id: value.id,
    savedAt: latest.savedAt,
    data: latest.data,
    inputMode: latest.inputMode,
    inputEvidence: latest.inputEvidence,
    updates: recordUpdates,
  };
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

export const storeScreeningSnapshot = (
  draft: LocalScreeningDraft,
  inputEvidence: ScreeningInputEvidence = {},
  inputMode: ScreeningInputMode = "structured",
) => {
  const savedAt = new Date().toISOString();
  const reference = draft.fieldReference.trim() || `local-${savedAt}`;
  const history = readStoredScreenings();
  const snapshot: ScreeningRecordUpdate = {
    id: `${reference}-${savedAt}`,
    savedAt,
    data: normaliseScreeningDraft(draft),
    inputMode: normaliseScreeningInputMode(inputMode),
    inputEvidence: normaliseScreeningInputEvidence(inputEvidence),
  };
  const existingRecord = history.find((item) => item.id === reference);
  const record: StoredScreening = {
    id: reference,
    savedAt,
    data: snapshot.data,
    inputMode: snapshot.inputMode,
    inputEvidence: snapshot.inputEvidence,
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
    return {
      savedAt: parsed.savedAt,
      status: parsed.status,
      screening: normaliseScreeningDraft(parsed.screening),
      screeningInputMode: normaliseScreeningInputMode(parsed.screeningInputMode),
      screeningInputEvidence: normaliseScreeningInputEvidence(parsed.screeningInputEvidence),
    };
  } catch {
    return null;
  }
};
