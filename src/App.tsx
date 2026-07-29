import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronLeft,
  CircleCheckBig,
  CloudOff,
  Code2,
  Info,
  Link,
  LockKeyhole,
  Mail,
  MapPinned,
  ScanSearch,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  WifiOff,
} from "lucide-react";
import lungMark from "./assets/aeris-mark.svg";
import { EncounterDashboard } from "./components/EncounterDashboard";
import { ScreeningChoiceField } from "./components/ScreeningChoiceField";
import { ScreeningLocationFields } from "./components/ScreeningLocationFields";
import { EnvironmentalRiskPanel } from "./components/EnvironmentalRiskPanel";
import {
  deleteStoredScreening,
  emptyLocalScreeningDraft,
  normaliseScreeningDraft,
  normaliseScreeningInputEvidence,
  normaliseScreeningInputMode,
  readStoredScreenings,
  storeScreeningSnapshot,
  type LocalScreeningDraft,
  type ScreeningAlternativeField,
  type ScreeningInputEvidence,
  type ScreeningInputMode,
} from "./local-screenings";
import { fetchEnvironmentalRiskForLocation, type EnvironmentalRiskSnapshot } from "./environmental-risk";
import { PhilippinesRegionMap } from "./components/PhilippinesRegionMap";
import { populationDataKey, readLocalPopulationFixtureCount, syntheticRegions, type SyntheticRegion } from "./population-dashboard";

type View = "consent" | "login" | "ready" | "about" | "heatmap-status" | "screening" | "ai-consent" | "imaging-metadata" | "temporary-record" | "screening-complete" | "nodule-review" | "risk-estimate" | "aggregation";
type WorkspaceMode = "health-center" | "cancer-registry";

const defaultClinicianId = "HCC-024";
const clinicianIdForMode = (mode: WorkspaceMode, currentId: string) => {
  const suffix = currentId.match(/(\d+)\s*$/)?.[1] ?? "024";
  return `${mode === "health-center" ? "HCC" : "CR"}-${suffix}`;
};

const landscapeSlides = [
  "landscape-sagada",
  "landscape-mountain-province",
  "landscape-benguet",
  "landscape-cebu-forest",
  "landscape-benguet-vista",
];

const teamPlaceholders = [
  { initials: "01", name: "[Name]", title: "[Role / specialty]" },
  { initials: "02", name: "[Name]", title: "[Role / specialty]" },
  { initials: "03", name: "[Name]", title: "[Role / specialty]" },
  { initials: "04", name: "[Name]", title: "[Role / specialty]" },
];

type ScreeningDraft = LocalScreeningDraft;

type ImagingFileMetadata = {
  id: string;
  name: string;
  type: string;
  size: number;
  takenOn: string;
  previewUrl?: string;
};

type LocalImagingFile = { id: string; file: File };
type CxrInference = { nodule_related_signal: number; related_signals: Record<string, number>; model: string; attention_map: string; notice: string };

type ImagingMetadata = {
  modality: string;
  studyReference: string;
  studyDate: string;
  sourceStatus: string;
  facility: string;
  imagingFiles: ImagingFileMetadata[];
};

type PopulationRecord = {
  id: string;
  createdAt: string;
  geography: string;
  ageRange: string;
  sexAtBirth: string;
  smokingStatus: string;
  householdSmoke: string;
  occupationalExposure: string;
  symptomSignalCount: number;
  pathway: "clinician-reviewed";
};

type HeatmapDataMode = "public" | "app-screenings" | "combined";

const normaliseRegionName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const uniqueHeatmapProfiles = (profiles: LocalScreeningDraft[]) => {
  const seenProfileKeys = new Set<string>();

  return profiles.filter((profile) => {
    if (profile.previousSurveyResponse !== "No") return false;
    const fieldReference = profile.fieldReference.trim().toLowerCase();
    const profileKey = fieldReference || JSON.stringify(profile);
    if (seenProfileKeys.has(profileKey)) return false;
    seenProfileKeys.add(profileKey);
    return true;
  });
};

const appScreeningRegionsFor = (profiles: LocalScreeningDraft[]): SyntheticRegion[] => syntheticRegions.map((region) => {
  const regionName = normaliseRegionName(region.label);
  const screenedIndividuals = profiles.filter((profile) => {
    const geography = normaliseRegionName(profile.province);
    return geography === regionName;
  }).length;
  const signalLevel: SyntheticRegion["signalLevel"] = screenedIndividuals === 0 ? "Lower" : screenedIndividuals < 3 ? "Moderate" : "Higher";

  return { ...region, signalLevel, syntheticRecords: screenedIndividuals, coverage: `${screenedIndividuals} app-screened` };
});

const emptyScreeningDraft: ScreeningDraft = {
  ...emptyLocalScreeningDraft,
};

const screeningDraftKey = "aeris-screening-draft-v1";
const temporaryRecordKey = "aeris-temporary-ai-record-v1";
const clinicianReviewKey = "aeris-clinician-nodule-review-v1";
const emptyImagingMetadata: ImagingMetadata = { modality: "", studyReference: "", studyDate: "", sourceStatus: "", facility: "", imagingFiles: [] };
const calendarMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const viewLabels: Record<View, string> = {
  consent: "Field start", login: "Secure login", ready: "Clinician workspace", about: "About Aeris AI", "heatmap-status": "Population dashboard", screening: "Screening", "ai-consent": "AI consent", "imaging-metadata": "Imaging metadata", "temporary-record": "Temporary record", "screening-complete": "Screening complete", "nodule-review": "Clinician review", "risk-estimate": "Risk support", aggregation: "Aggregation",
};

const dateValueFor = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const calendarCellsFor = (year: number, month: number) => Array.from({ length: new Date(year, month + 1, 0).getDate() + new Date(year, month, 1).getDay() }, (_, index) => {
  const day = index - new Date(year, month, 1).getDay() + 1;
  return day > 0 ? day : null;
});

const screeningFields: (keyof ScreeningDraft)[] = [
  "fieldReference", "age", "sexAtBirth", "barangay", "municipality", "province", "occupation",
  "smokingStatus", "packYears", "yearsSinceQuitting", "occupationalExposure",
  "previousTuberculosis", "copd", "asthma", "previousMalignancy", "familyHistory",
  "persistentCough", "breathlessness", "bloodInSputum", "chestPain", "weightLoss", "hoarseness", "fatigue",
  "chestXrayAvailable", "physicalExamFindings", "previousSurveyResponse",
];

const screeningStepForField: Partial<Record<keyof ScreeningDraft, number>> = {
  fieldReference: 1, age: 1, sexAtBirth: 1, barangay: 1, municipality: 1, province: 1, occupation: 1,
  persistentCough: 2, breathlessness: 2, bloodInSputum: 2, chestPain: 2, weightLoss: 2, hoarseness: 2, fatigue: 2,
  chestXrayAvailable: 2, physicalExamFindings: 2, physicalExamOther: 2,
  smokingStatus: 3, packYears: 3, yearsSinceQuitting: 3, occupationalExposure: 3, occupationalExposureOther: 3,
  previousTuberculosis: 3, copd: 3, asthma: 3, previousMalignancy: 3, familyHistory: 3,
  previousSurveyResponse: 4,
};

const exposureChecklistOptions = ["Mining", "Construction", "Asbestos", "Silica", "Biomass fuel exposure", "Secondhand smoke", "Other", "None reported", "Unknown"];
const physicalExamOptions = ["Normal examination", "Decreased breath sounds", "Crackles (rales)", "Wheezing", "Rhonchi", "Dullness to percussion", "Increased work of breathing", "Reduced chest expansion", "Digital clubbing", "Cyanosis", "Palpable supraclavicular lymph node", "Other"];
const responseOptions = ["Yes", "No", "Unknown"];
const selectedChecklistOptions = (value: string) => value ? value.split(" | ") : [];

const ageRangeFor = (age: string) => {
  const years = Number.parseInt(age, 10);
  if (!Number.isFinite(years) || years < 0) return "";
  if (years <= 17) return "0-17";
  if (years <= 29) return "18-29";
  if (years <= 39) return "30-39";
  if (years <= 49) return "40-49";
  if (years <= 59) return "50-59";
  if (years <= 69) return "60-69";
  return "70 or older";
};

const scorePrototypeRisk = (screening: ScreeningDraft) => {
  let score = 5;
  score += ({ "0-17": 0, "18-29": 0, "30-39": 0, "40-49": 3, "50-59": 8, "60-69": 15, "70 or older": 21 } as Record<string, number>)[screening.ageRange] || 0;
  score += ({ "Current smoker": 23, "Former smoker": 13, "Never smoker": 0, "Never smoked": 0, "Not recorded": 4 } as Record<string, number>)[screening.smokingStatus] || 0;
  const packYearFactor = screening.packFrequency === "Pack-years" ? 1 : screening.packFrequency === "Per day" ? 4 : 1.5;
  score += Math.min(Number.parseFloat(screening.packYears) * packYearFactor || 0, 15);
  if (screening.householdSmoke === "Yes") score += 4;
  if (screening.occupationalExposure && !["None reported", "Unknown"].includes(screening.occupationalExposure)) score += 5;
  if (screening.lungHistory && !["None reported", "Unknown"].includes(screening.lungHistory)) score += 5;
  if (screening.familyHistory === "Yes") score += 5;
  score += [screening.persistentCough, screening.breathlessness, screening.bloodInSputum, screening.weightLoss].filter((item) => item === "Yes").length * 6;
  return Math.max(3, Math.min(92, Math.round(score)));
};

const modelReferenceFor = (modality: string) => modality === "CT scan" ? {
  name: "MONAI lung nodule CT detection",
  url: "https://catalog.ngc.nvidia.com/orgs/nvidia/monaitoolkit/models/monai_lung_nodule_ct_detection/0.6.6",
  capability: "Planned research adapter: 3D CT candidate boxes and candidate scores.",
  limitation: "This browser prototype does not run the MONAI bundle or parse DICOM CT volume data.",
} : {
  name: "TorchXRayVision + CXR follow-up research reference",
  url: "https://github.com/mlmed/torchxrayvision",
  capability: "Planned research adapter: chest X-ray nodule-related signal with a reviewable attention visualization.",
  limitation: "This browser prototype does not run pretrained X-ray weights or validate an image-level prediction.",
};

export default function App() {
  const [view, setView] = useState<View>("consent");
  const [hasConsent, setHasConsent] = useState(false);
  const [clinicianId, setClinicianId] = useState(defaultClinicianId);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("health-center");
  const [passcode, setPasscode] = useState("");
  const [offline, setOffline] = useState(true);
  const [screeningStep, setScreeningStep] = useState(1);
  const [screeningDraft, setScreeningDraft] = useState<ScreeningDraft>(emptyScreeningDraft);
  const [screeningInputMode, setScreeningInputMode] = useState<ScreeningInputMode>("structured");
  const [screeningInputEvidence, setScreeningInputEvidence] = useState<ScreeningInputEvidence>({});
  const [aiConsent, setAiConsent] = useState<boolean | null>(null);
  const [imagingMetadata, setImagingMetadata] = useState<ImagingMetadata>(emptyImagingMetadata);
  const [localImagingFiles, setLocalImagingFiles] = useState<LocalImagingFile[]>([]);
  const [cxrInference, setCxrInference] = useState<CxrInference | null>(null);
  const [cxrInferenceStatus, setCxrInferenceStatus] = useState<"idle" | "loading" | "error">("idle");
  const [cxrInferenceMessage, setCxrInferenceMessage] = useState("");
  const [temporaryRecordReady, setTemporaryRecordReady] = useState(false);
  const [reviewOutcome, setReviewOutcome] = useState<"pending" | "needs-info" | "accepted" | "forced">("pending");
  const [aggregationComplete, setAggregationComplete] = useState(false);
  const [populationRecordCount, setPopulationRecordCount] = useState(0);
  const [appScreeningProfiles, setAppScreeningProfiles] = useState<LocalScreeningDraft[]>([]);
  const [heatmapDataMode, setHeatmapDataMode] = useState<HeatmapDataMode>("public");
  const [selectedRegionId, setSelectedRegionId] = useState(syntheticRegions[0].id);
  const [isStudyCalendarOpen, setIsStudyCalendarOpen] = useState(false);
  const [showIncompleteFields, setShowIncompleteFields] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [activeBackdrop, setActiveBackdrop] = useState(0);
  const [isScrollHeaderVisible, setIsScrollHeaderVisible] = useState(true);
  const [isLeavingView, setIsLeavingView] = useState(false);
  const [isSwitchingScreeningStep, setIsSwitchingScreeningStep] = useState(false);
  const [environmentalRisk, setEnvironmentalRisk] = useState<EnvironmentalRiskSnapshot | null>(null);
  const [environmentalStatus, setEnvironmentalStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [environmentalError, setEnvironmentalError] = useState("");
  const [environmentalRefreshKey, setEnvironmentalRefreshKey] = useState(0);
  const navigationTimer = useRef<number | undefined>(undefined);
  const screeningStepTimer = useRef<number | undefined>(undefined);
  const incompleteFieldFocusTimer = useRef<number | undefined>(undefined);
  const previousScrollY = useRef(0);
  const imagingFileInput = useRef<HTMLInputElement | null>(null);
  const conditionalScreeningFields: (keyof ScreeningDraft)[] = [
    ...(selectedChecklistOptions(screeningDraft.occupationalExposure).includes("Other") ? ["occupationalExposureOther" as const] : []),
    ...(selectedChecklistOptions(screeningDraft.physicalExamFindings).includes("Other") ? ["physicalExamOther" as const] : []),
  ];
  const requiredScreeningFields = [...screeningFields, ...conditionalScreeningFields];
  const screeningIsComplete = requiredScreeningFields.every((field) => screeningDraft[field].trim() !== "");
  const firstIncompleteField = requiredScreeningFields.find((field) => !screeningDraft[field].trim());
  const missingFieldClass = (field: keyof ScreeningDraft) => showIncompleteFields && requiredScreeningFields.includes(field) && !screeningDraft[field].trim() ? "is-required-missing" : "";
  const renderScreeningChoice = (
    field: ScreeningAlternativeField,
    label: string,
    options: readonly string[],
    onChange: (value: string) => void = (value) => setScreeningDraft((current) => ({ ...current, [field]: value })),
    className = "",
  ) => (
    <ScreeningChoiceField
      field={field}
      label={label}
      value={screeningDraft[field]}
      options={options}
      mode={screeningInputMode}
      evidence={screeningInputEvidence[field]}
      className={`${className} ${missingFieldClass(field)}`.trim()}
      onChange={onChange}
      onEvidenceChange={(evidence) => setScreeningInputEvidence((current) => ({ ...current, [field]: evidence }))}
    />
  );
  const prototypeRiskScore = useMemo(() => scorePrototypeRisk(screeningDraft), [screeningDraft]);
  const uploadedPreview = imagingMetadata.imagingFiles.find((file) => file.previewUrl)?.previewUrl;
  const prototypeRiskBand = prototypeRiskScore >= 50 ? "Elevated triage signal" : prototypeRiskScore >= 25 ? "Intermediate triage signal" : "Lower triage signal";
  const heatmapEligibleProfiles = useMemo(() => uniqueHeatmapProfiles(appScreeningProfiles), [appScreeningProfiles]);
  const appScreeningRegions = useMemo(() => appScreeningRegionsFor(heatmapEligibleProfiles), [heatmapEligibleProfiles]);
  const priorSurveyProfiles = useMemo(() => appScreeningProfiles.filter((profile) => profile.previousSurveyResponse === "Yes"), [appScreeningProfiles]);
  const duplicateScreeningProfiles = appScreeningProfiles.filter((profile) => profile.previousSurveyResponse === "No").length - heatmapEligibleProfiles.length;
  const heatmapRegions = heatmapDataMode === "app-screenings" ? appScreeningRegions : syntheticRegions;
  const symptomSignals = [
    [screeningDraft.persistentCough, "Persistent cough"],
    [screeningDraft.breathlessness, "Breathlessness"],
    [screeningDraft.bloodInSputum, "Blood in sputum"],
    [screeningDraft.weightLoss, "Unintentional weight loss"],
  ] as const;
  const profileRiskDrivers = [
    screeningDraft.smokingStatus === "Current smoker" ? "Current tobacco use" : screeningDraft.smokingStatus === "Former smoker" ? "Previous tobacco use" : "No tobacco-use signal recorded",
    screeningDraft.householdSmoke === "Yes" ? "Household smoke exposure" : null,
    screeningDraft.occupationalExposure && !["None reported", "Unknown"].includes(screeningDraft.occupationalExposure) ? screeningDraft.occupationalExposure : null,
    screeningDraft.lungHistory && !["None reported", "Unknown"].includes(screeningDraft.lungHistory) ? screeningDraft.lungHistory : null,
    screeningDraft.familyHistory === "Yes" ? "Family lung-cancer history" : null,
    ...symptomSignals.filter(([value]) => value === "Yes").map(([, label]) => label),
  ].filter((value): value is string => Boolean(value));

  useEffect(() => {
    const rotation = window.setInterval(() => {
      setActiveBackdrop((current) => (current + 1) % landscapeSlides.length);
    }, 7200);

    return () => window.clearInterval(rotation);
  }, []);

  useEffect(() => () => {
    if (navigationTimer.current !== undefined) window.clearTimeout(navigationTimer.current);
    if (screeningStepTimer.current !== undefined) window.clearTimeout(screeningStepTimer.current);
    if (incompleteFieldFocusTimer.current !== undefined) window.clearTimeout(incompleteFieldFocusTimer.current);
  }, []);

  useEffect(() => {
    previousScrollY.current = window.scrollY;
    setIsScrollHeaderVisible(true);
    const updateScrollHeader = () => {
      const currentScrollY = window.scrollY;
      setIsScrollHeaderVisible(currentScrollY <= 56 || currentScrollY < previousScrollY.current);
      previousScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", updateScrollHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollHeader);
  }, [view]);

  useEffect(() => {
    const region = screeningDraft.province.trim();
    const municipality = screeningDraft.municipality.trim();
    if (!region || !municipality) {
      setEnvironmentalRisk(null);
      setEnvironmentalStatus("idle");
      setEnvironmentalError("");
      return;
    }

    let active = true;
    setEnvironmentalStatus("loading");
    setEnvironmentalError("");

    void fetchEnvironmentalRiskForLocation({
      region: screeningDraft.province,
      municipality: screeningDraft.municipality,
      barangay: screeningDraft.barangay,
    }).then((result) => {
      if (!active) return;
      if (result.ok) {
        setEnvironmentalRisk(result.snapshot);
        setEnvironmentalStatus("ready");
        return;
      }
      setEnvironmentalRisk(null);
      setEnvironmentalStatus("error");
      setEnvironmentalError(result.error);
    });

    return () => { active = false; };
  }, [screeningDraft.province, screeningDraft.municipality, screeningDraft.barangay, environmentalRefreshKey]);

  const [draftStatus, setDraftStatus] = useState("");

  const navigateTo = (nextView: View) => {
    if (nextView === view || isLeavingView) return;

    setIsLeavingView(true);
    navigationTimer.current = window.setTimeout(() => {
      setView(nextView);
      setIsLeavingView(false);
    }, 220);
  };

  const enterDemo = () => {
    sessionStorage.setItem("idea-demo-clinician", clinicianId || defaultClinicianId);
    navigateTo("ready");
  };

  const changeWorkspaceMode = (mode: WorkspaceMode) => {
    setWorkspaceMode(mode);
    setClinicianId((current) => clinicianIdForMode(mode, current));
  };

  const resetEncounter = () => {
    setHasConsent(false);
  };

  const updateDraft = (field: keyof ScreeningDraft, value: string) => {
    setScreeningDraft((current) => ({ ...current, [field]: value }));
  };

  const toggleChecklistOption = (field: "occupationalExposure" | "physicalExamFindings", option: string, options: string[]) => {
    setScreeningDraft((current) => {
      const selected = new Set(selectedChecklistOptions(current[field]));
      if (selected.has(option)) selected.delete(option);
      else {
        if (option === "None reported" || option === "Unknown" || option === "Normal examination") selected.clear();
        else {
          selected.delete("None reported");
          selected.delete("Unknown");
          selected.delete("Normal examination");
        }
        selected.add(option);
      }
      const next = { ...current, [field]: options.filter((item) => selected.has(item)).join(" | ") };
      if (field === "occupationalExposure") {
        next.householdSmoke = selected.has("Secondhand smoke") ? "Yes" : "No";
        if (!selected.has("Other")) next.occupationalExposureOther = "";
      }
      if (field === "physicalExamFindings" && !selected.has("Other")) next.physicalExamOther = "";
      return next;
    });
  };

  const updateAge = (value: string) => {
    setScreeningDraft((current) => ({ ...current, age: value, ageRange: ageRangeFor(value) }));
  };

  const updateSmokingStatus = (value: string) => {
    setScreeningDraft((current) => ({
      ...current,
      smokingStatus: value,
      packFrequency: "Pack-years",
      packYears: value === "Never smoker" ? "0" : current.packYears,
      yearsSinceQuitting: value === "Former smoker" ? (current.yearsSinceQuitting === "Not applicable" ? "" : current.yearsSinceQuitting) : "Not applicable",
    }));
  };

  const updateWeightLoss = (value: string) => {
    setScreeningDraft((current) => ({ ...current, weightLoss: value, weightLossAmount: value === "Yes" ? current.weightLossAmount : "" }));
  };

  const updateImagingMetadata = (field: Exclude<keyof ImagingMetadata, "imagingFiles">, value: string) => {
    setImagingMetadata((current) => ({ ...current, [field]: value }));
  };

  const recordImagingFiles = (files?: FileList | File[]) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files).map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
      name: file.name,
      type: file.type || "Unspecified file type",
      size: file.size,
      takenOn: "",
    }));
    setImagingMetadata((current) => ({ ...current, imagingFiles: [...current.imagingFiles, ...selectedFiles] }));
    setLocalImagingFiles((current) => [...current, ...selectedFiles.map((selected, index) => ({ id: selected.id, file: Array.from(files)[index] }))]);
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setImagingMetadata((current) => ({
          ...current,
          imagingFiles: current.imagingFiles.map((item) => item.id === selectedFiles[index].id ? { ...item, previewUrl: typeof reader.result === "string" ? reader.result : undefined } : item),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const updateImagingFileDate = (fileId: string, takenOn: string) => {
    setImagingMetadata((current) => ({
      ...current,
      imagingFiles: current.imagingFiles.map((file) => file.id === fileId ? { ...file, takenOn } : file),
    }));
  };

  const removeImagingFile = (fileId: string) => {
    setImagingMetadata((current) => ({ ...current, imagingFiles: current.imagingFiles.filter((file) => file.id !== fileId) }));
    setLocalImagingFiles((current) => current.filter((file) => file.id !== fileId));
    if (imagingFileInput.current) imagingFileInput.current.value = "";
  };

  const deleteTemporaryRecord = () => {
    localStorage.removeItem(temporaryRecordKey);
    setTemporaryRecordReady(false);
    setImagingMetadata(emptyImagingMetadata);
    setLocalImagingFiles([]);
    setCxrInference(null);
    setCxrInferenceStatus("idle");
    setCxrInferenceMessage("");
    setReviewOutcome("pending");
    setIsStudyCalendarOpen(false);
  };

  const deleteSavedScreening = (screeningId: string) => {
    deleteStoredScreening(screeningId);
    setAppScreeningProfiles(readStoredScreenings().map((screening) => screening.data));
  };

  const openStudyCalendar = () => {
    if (imagingMetadata.studyDate) {
      const [year, month] = imagingMetadata.studyDate.split("-").map(Number);
      setCalendarYear(year);
      setCalendarMonth(month - 1);
    }
    setIsStudyCalendarOpen((current) => !current);
  };

  const selectStudyDate = (day: number) => {
    updateImagingMetadata("studyDate", dateValueFor(calendarYear, calendarMonth, day));
    setIsStudyCalendarOpen(false);
  };

  const saveScreeningDraft = () => {
    localStorage.setItem(screeningDraftKey, JSON.stringify({
      data: screeningDraft,
      inputMode: screeningInputMode,
      inputEvidence: screeningInputEvidence,
      savedAt: new Date().toISOString(),
    }));
    storeScreeningSnapshot(screeningDraft, screeningInputEvidence, screeningInputMode, environmentalRisk);
    setAppScreeningProfiles(readStoredScreenings().map((screening) => screening.data));
    setDraftStatus("Screening draft saved on this device.");
  };

  const restoreScreeningDraft = () => {
    const savedDraft = localStorage.getItem(screeningDraftKey);
    if (!savedDraft) {
      setDraftStatus("No saved screening draft is available on this device.");
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft) as { data?: ScreeningDraft; inputMode?: unknown; inputEvidence?: unknown };
      if (parsed.data) {
        setScreeningDraft(normaliseScreeningDraft(parsed.data));
        setScreeningInputMode(normaliseScreeningInputMode(parsed.inputMode));
        setScreeningInputEvidence(normaliseScreeningInputEvidence(parsed.inputEvidence));
        setDraftStatus("Saved screening draft restored on this device.");
      }
    } catch {
      setDraftStatus("The saved draft could not be restored.");
    }
  };

  const startScreening = () => {
    setScreeningDraft(emptyScreeningDraft);
    setScreeningInputMode("structured");
    setScreeningInputEvidence({});
    setScreeningStep(1);
    setDraftStatus("");
    setEnvironmentalRisk(null);
    setEnvironmentalStatus("idle");
    setEnvironmentalError("");
    navigateTo("screening");
  };

  const editSavedScreening = (
    draft: LocalScreeningDraft,
    inputEvidence: ScreeningInputEvidence = {},
    inputMode: ScreeningInputMode = "structured",
  ) => {
    const stored = readStoredScreenings().find((record) => record.id === draft.fieldReference.trim());
    setScreeningDraft(normaliseScreeningDraft(draft));
    setScreeningInputEvidence(normaliseScreeningInputEvidence(inputEvidence));
    setScreeningInputMode(normaliseScreeningInputMode(inputMode));
    setEnvironmentalRisk(stored?.environmentalRisk ?? null);
    setEnvironmentalStatus(stored?.environmentalRisk ? "ready" : "idle");
    setEnvironmentalError("");
    setScreeningStep(1);
    setDraftStatus("Local screening loaded for clinician review.");
    navigateTo("screening");
  };

  const endDemoSession = () => {
    sessionStorage.removeItem("idea-demo-clinician");
    navigateTo("consent");
    resetEncounter();
  };

  const finishScreening = () => {
    if (!screeningIsComplete) {
      setDraftStatus(`Screening is incomplete. Complete all ${requiredScreeningFields.length} required fields before the risk-support eligibility check can run.`);
      return;
    }
    saveScreeningDraft();
    navigateTo("risk-estimate");
  };

  const recordAiConsent = (agrees: boolean) => {
    setAiConsent(agrees);
    if (!agrees) {
      localStorage.setItem("aeris-screening-only-status-v1", JSON.stringify({ savedAt: new Date().toISOString(), aiConsent: false }));
      navigateTo("screening-complete");
      return;
    }
    navigateTo("imaging-metadata");
  };

  const saveTemporaryRecord = () => {
    const readyForReview = ["CT scan", "Chest X-ray"].includes(imagingMetadata.modality) && imagingMetadata.studyReference.trim() !== "" && imagingMetadata.sourceStatus === "Available locally" && imagingMetadata.imagingFiles.length > 0;
    localStorage.setItem(temporaryRecordKey, JSON.stringify({
      savedAt: new Date().toISOString(),
      status: readyForReview ? "ready for clinician nodule review" : "awaiting additional imaging details",
      aiConsent: true,
      imaging: imagingMetadata,
      screening: screeningDraft,
      screeningInputMode,
      screeningInputEvidence,
    }));
    setTemporaryRecordReady(readyForReview);
    navigateTo("temporary-record");
  };

  const saveClinicianReview = (outcome: "accepted" | "needs-info" | "forced") => {
    localStorage.setItem(clinicianReviewKey, JSON.stringify({
      savedAt: new Date().toISOString(),
      outcome,
      reviewSource: "static metadata-only workflow fixture",
      imaging: imagingMetadata,
    }));
    setReviewOutcome(outcome);
  };

  const openNoduleReview = () => {
    setReviewOutcome("pending");
    navigateTo("nodule-review");
  };

  const openRiskEstimate = () => navigateTo("risk-estimate");

  const runCxrInference = async () => {
    const localImage = localImagingFiles.find(({ file }) => file.type.startsWith("image/"));
    if (!localImage) {
      setCxrInferenceStatus("error");
      setCxrInferenceMessage("Choose a PNG, JPEG, or WebP chest X-ray preview before requesting local research inference.");
      return;
    }

    setCxrInferenceStatus("loading");
    setCxrInferenceMessage("");
    try {
      const payload = new FormData();
      payload.append("file", localImage.file);
      const response = await fetch(`${import.meta.env.VITE_LUNG_AI_API || "http://127.0.0.1:8000"}/infer/cxr`, { method: "POST", body: payload });
      const body = await response.json() as CxrInference & { detail?: string };
      if (!response.ok) throw new Error(body.detail || "The local research adapter could not process this image.");
      setCxrInference(body);
      setCxrInferenceStatus("idle");
    } catch (error) {
      setCxrInferenceStatus("error");
      setCxrInferenceMessage(error instanceof Error ? error.message : "The local research adapter is unavailable.");
    }
  };

  const openAggregation = () => {
    setAggregationComplete(false);
    setPopulationRecordCount(readLocalPopulationFixtureCount());
    navigateTo("aggregation");
  };

  const openPopulationDashboard = () => {
    setAppScreeningProfiles(readStoredScreenings().map((screening) => screening.data));
    setPopulationRecordCount(readLocalPopulationFixtureCount());
    setHeatmapDataMode("public");
    setSelectedRegionId(syntheticRegions[0].id);
    navigateTo("heatmap-status");
  };

  const aggregateDeidentifiedRecord = () => {
    const symptomSignalCount = [screeningDraft.persistentCough, screeningDraft.breathlessness, screeningDraft.bloodInSputum, screeningDraft.weightLoss]
      .filter((value) => value === "Yes").length;
    const populationRecord: PopulationRecord = {
      id: `population-${Date.now()}`,
      createdAt: new Date().toISOString(),
      geography: screeningDraft.province.trim() ? `Province-level: ${screeningDraft.province.trim()}` : "Province-level: not recorded",
      ageRange: screeningDraft.ageRange || "Not recorded",
      sexAtBirth: screeningDraft.sexAtBirth || "Not recorded",
      smokingStatus: screeningDraft.smokingStatus || "Not recorded",
      householdSmoke: screeningDraft.householdSmoke || "Not recorded",
      occupationalExposure: screeningDraft.occupationalExposure || "Not recorded",
      symptomSignalCount,
      pathway: "clinician-reviewed",
    };

    try {
      const existing = JSON.parse(localStorage.getItem(populationDataKey) || "[]") as PopulationRecord[];
      const nextRecords = [...existing, populationRecord];
      localStorage.setItem(populationDataKey, JSON.stringify(nextRecords));
      setPopulationRecordCount(nextRecords.length);
      setAggregationComplete(true);
    } catch {
      localStorage.setItem(populationDataKey, JSON.stringify([populationRecord]));
      setPopulationRecordCount(1);
      setAggregationComplete(true);
    }
  };

  const changeScreeningStep = (nextStep: number) => {
    if (isSwitchingScreeningStep || nextStep === screeningStep) return;

    setIsSwitchingScreeningStep(true);
    screeningStepTimer.current = window.setTimeout(() => {
      setScreeningStep(nextStep);
      setIsSwitchingScreeningStep(false);
    }, 260);
  };

  const takeToIncompleteField = () => {
    if (!firstIncompleteField) return;
    setShowIncompleteFields(true);
    const targetStep = screeningStepForField[firstIncompleteField] ?? 1;
    if (targetStep !== screeningStep) changeScreeningStep(targetStep);
    if (incompleteFieldFocusTimer.current !== undefined) window.clearTimeout(incompleteFieldFocusTimer.current);
    incompleteFieldFocusTimer.current = window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[name="${firstIncompleteField}"]`)?.focus();
    }, targetStep === screeningStep ? 0 : 300);
  };

  return (
    <main className={`app-shell view-${view} motion-preview`}>
      <div className="landscape-rotator" aria-hidden="true">
        {landscapeSlides.map((slide, index) => (
          <span className={`landscape-slide ${slide} ${index === activeBackdrop ? "is-active" : ""}`} key={slide} />
        ))}
        <span className="landscape-ripple" key={activeBackdrop} />
      </div>
      <header className={`topbar ${isScrollHeaderVisible ? "is-visible" : ""}`} aria-label="Aeris AI navigation">
        <a className="brand" href="#top" aria-label="Aeris AI home" onClick={() => navigateTo("consent")}>
          <img className="brand-mark" src={lungMark} alt="" aria-hidden="true" />
          <span>
            <strong>Aeris AI</strong>
            <small>Lung screening</small>
          </span>
        </a>
        <div className="topbar-actions">
          <span className="topbar-view-label">{viewLabels[view]}</span>
          {view === "consent" && (
            <button className="nav-link" type="button" onClick={() => navigateTo("about")}>
              <Info size={16} /> About
            </button>
          )}
          <button
            className="network-status"
            type="button"
            aria-pressed={offline}
            onClick={() => setOffline((current) => !current)}
          >
            {offline ? <WifiOff size={16} /> : <CloudOff size={16} />}
            {offline ? "Offline-ready" : "Local sync"}
          </button>
          <span className="role-label"><Stethoscope size={16} /> Medical professional</span>
        </div>
      </header>

      <div className={`view-transition ${isLeavingView ? "is-leaving" : ""}`} key={view}>
      {view === "consent" && (
        <>
          <section className="hero-grid" aria-labelledby="consent-title">
            <div className="intro-panel">
            <p className="eyebrow"><MapPinned size={16} /> Community profiling mission</p>
            <h1>Start every screening with a clear patient choice.</h1>
            <p className="intro-copy">
              Aeris AI helps field teams gather structured lung-cancer screening information
              and prepare reviewed, de-identified population insights.
            </p>
            <div className="principle-list" aria-label="Data handling principles">
              <p><ShieldCheck size={20} /><span><strong>Clinician-led</strong>All interactions are guided by the medical professional.</span></p>
              <p><LockKeyhole size={20} /><span><strong>Purpose-limited</strong>Only consented screening information continues.</span></p>
              <p><CloudOff size={20} /><span><strong>Works offline</strong>Drafts stay on this device until a future sync is approved.</span></p>
            </div>
            <button className="heatmap-status-link" type="button" onClick={openPopulationDashboard}>
              <span className="status-beacon" aria-hidden="true" />
              <span><strong>Heatmap status</strong><small>Open synthetic population dashboard</small></span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>

            <div className="workflow-card">
            <div className="step-indicator"><span>01</span><span aria-hidden="true" /><span>Consent</span></div>
            <p className="card-kicker">Patient participation</p>
            <h2 id="consent-title">Would the patient like to participate in the screening survey?</h2>
            <p className="helper-text">With permission, this screening information is combined without names with other local responses to help health teams estimate which regions may need more lung-health follow-up. It does not diagnose cancer or decide care for any individual.</p>

            <label className="consent-check">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(event) => setHasConsent(event.target.checked)}
              />
              <span>I confirm the patient has agreed to take part in this screening survey.</span>
            </label>
            <div className="button-row">
              <button className="primary-button" type="button" disabled={!hasConsent} onClick={() => navigateTo("login")}>
                Continue to secure login <ArrowRight size={18} />
              </button>
            </div>
            </div>
          </section>

          <section className="faq-section" aria-labelledby="faq-title">
            <div className="faq-heading">
              <p className="eyebrow"><Info size={16} /> Field guide</p>
              <h2 id="faq-title">Questions clinicians ask before screening</h2>
              <p>Quick answers for explaining the demo and recording consent with confidence.</p>
            </div>
            <div className="faq-grid">
              <details className="faq-item">
                <summary>Does Aeris AI diagnose lung cancer?</summary>
                <p>No. Aeris AI is a clinician-led screening and population-insight demo. It does not replace diagnosis, imaging interpretation, or clinical judgment.</p>
              </details>
              <details className="faq-item">
                <summary>What happens if a patient declines?</summary>
                <p>The encounter ends at consent. No screening record is created in the demo flow.</p>
              </details>
              <details className="faq-item">
                <summary>Can the field team work without internet?</summary>
                <p>Yes. This demo is designed around local, offline-ready workflow states. Future syncing remains subject to approval.</p>
              </details>
              <details className="faq-item">
                <summary>Will AI make a final decision for the clinician?</summary>
                <p>No. Any future AI risk output is a clinician-review input only. A medical professional remains responsible for the decision.</p>
              </details>
            </div>
          </section>
        </>
      )}

      {view === "about" && (
        <section className="about-layout" aria-labelledby="about-title">
          <div className="about-hero">
            <button className="back-link" type="button" onClick={() => navigateTo("consent")}>
              <ChevronLeft size={17} /> Back to screening
            </button>
            <p className="eyebrow"><UsersRound size={16} /> About the project</p>
            <h1 id="about-title">A field-friendly path to earlier lung-health follow-up.</h1>
            <p>Aeris AI is a hackathon prototype for clinician-led community profiling, designed with geographic equity in the Philippines in mind.</p>
          </div>

          <div className="about-content">
            <article className="about-story">
              <p className="card-kicker">Our working purpose</p>
              <h2>Make a careful first step more reachable.</h2>
              <p>We are designing a lightweight workflow that helps medical professionals document consent, collect structured screening information, and later review risk-support inputs without presenting AI as a diagnosis.</p>
              <p className="placeholder-note">Project details, partners, and institutional affiliations: [add approved information here].</p>
            </article>

            <section className="about-feature-section" aria-labelledby="features-title">
              <p className="card-kicker">Available now</p>
              <h2 id="features-title">Features</h2>
              <div className="about-feature-grid">
                <article>
                  <h3>Clinician-led local profiling</h3>
                  <p>A four-step screening draft captures location, tobacco and exposure history, symptoms, and past-survey history with clear completeness guidance.</p>
                </article>
                <article>
                  <h3>Private, local temporary records</h3>
                  <p>Screening drafts stay on the device and can be imported, extracted individually, or deleted when they are no longer needed.</p>
                </article>
                <article>
                  <h3>Separated heat-map views</h3>
                  <p>Static public baseline data and profiles screened in this app are shown separately, preventing the two sources from being counted together.</p>
                </article>
                <article>
                  <h3>Review-aware risk support</h3>
                  <p>The prototype keeps risk and imaging details in a clinician-review workflow, with no automated output presented as a diagnosis.</p>
                </article>
              </div>
            </section>

            <section className="about-feature-section" aria-labelledby="future-features-title">
              <p className="card-kicker">Planned next</p>
              <h2 id="future-features-title">Future features</h2>
              <div className="about-feature-grid">
                <article>
                  <h3>Secure identity and governed sync</h3>
                  <p>Role-aware accounts, secure synchronization, and organization-approved data retention controls for production use.</p>
                </article>
                <article>
                  <h3>Clinical workflow integration</h3>
                  <p>Validated referral pathways, richer follow-up documentation, and integrations shaped with healthcare partners.</p>
                </article>
                <article>
                  <h3>Privacy-reviewed population reporting</h3>
                  <p>Aggregated reporting designed with privacy thresholds and governance review before community-level sharing.</p>
                </article>
                <article>
                  <h3>Evaluated imaging support</h3>
                  <p>Careful clinical evaluation and safe imaging-data integration before any future model-assisted review is considered.</p>
                </article>
              </div>
            </section>

            <section className="team-section" aria-labelledby="team-title">
              <div className="team-heading">
                <p className="card-kicker">Meet the team</p>
                <h2 id="team-title">People behind the prototype</h2>
              </div>
              <div className="team-grid">
                {teamPlaceholders.map((member) => (
                  <article className="team-card" key={member.initials}>
                    <div className="avatar-placeholder" role="img" aria-label={`Profile photo placeholder for ${member.name}`}>{member.initials}</div>
                    <h3>{member.name}</h3>
                    <p>{member.title}</p>
                    <div className="social-placeholders" aria-label={`Placeholder social links for ${member.name}`}>
                      <a href="#team-social"><Link size={15} /> LinkedIn</a>
                      <a href="#team-social"><Code2 size={15} /> GitHub</a>
                      <a href="#team-social"><Mail size={15} /> Email</a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      )}

      {view === "heatmap-status" && (
        <section className="heatmap-status-layout" aria-labelledby="heatmap-status-title">
          <div className="heatmap-status-hero">
            <button className="back-link" type="button" onClick={() => navigateTo("consent")}>
              <ChevronLeft size={17} /> Back to screening
            </button>
            <p className="eyebrow"><MapPinned size={16} /> Population dashboard</p>
            <h1 id="heatmap-status-title">Regional follow-up dashboard.</h1>
            <p>Compare the static public baseline, unique profiles saved in this web app, or a layered view that shows both sources without adding their counts together.</p>
          </div>

          <div className="heatmap-status-card">
            <div className="heatmap-status-topline">
              <span className="status-chip"><span className="status-beacon" aria-hidden="true" /> {heatmapDataMode === "public" ? "LCP Registry 2009–2017" : heatmapDataMode === "app-screenings" ? "App screening profiles only" : "Public + app layered view"}</span>
              <span>{heatmapDataMode === "public" ? "Lung Center of the Philippines public data" : heatmapDataMode === "app-screenings" ? `${heatmapEligibleProfiles.length} heatmap-eligible profile${heatmapEligibleProfiles.length === 1 ? "" : "s"}` : "Sources layered, never summed"}</span>
            </div>
            <div className="heatmap-source-switch" role="group" aria-label="Heat map data source">
              <button className={heatmapDataMode === "public" ? "active" : ""} type="button" aria-pressed={heatmapDataMode === "public"} onClick={() => { setHeatmapDataMode("public"); setSelectedRegionId(syntheticRegions[0].id); }}><strong>Public data</strong><span>Static baseline</span></button>
              <button className={heatmapDataMode === "app-screenings" ? "active" : ""} type="button" aria-pressed={heatmapDataMode === "app-screenings"} onClick={() => { setHeatmapDataMode("app-screenings"); setSelectedRegionId(syntheticRegions[0].id); }}><strong>App screenings</strong><span>Eligible profiles only</span></button>
              <button className={heatmapDataMode === "combined" ? "active" : ""} type="button" aria-pressed={heatmapDataMode === "combined"} onClick={() => { setHeatmapDataMode("combined"); setSelectedRegionId(syntheticRegions[0].id); }}><strong>Combined overlay</strong><span>Two separate layers</span></button>
            </div>
            <div className="dashboard-summary-grid">
              {heatmapDataMode === "public" ? <>
                <article><strong>18 regions</strong><span>PSA-aligned regional geometry</span></article>
                <article><strong>LCP Registry</strong><span>2009–2017 hospital admissions</span></article>
                <article><strong>Separate source</strong><span>Not combined with app data</span></article>
                <article><strong>Sharing disabled</strong><span>No external health-network access</span></article>
              </> : heatmapDataMode === "app-screenings" ? <>
                <article><strong>{heatmapEligibleProfiles.length}</strong><span>Heatmap-eligible profiles</span></article>
                <article><strong>Region keyed</strong><span>Uses each profile’s selected region</span></article>
                <article><strong>{priorSurveyProfiles.length} excluded</strong><span>Previously surveyed participants</span></article>
                <article><strong>Local storage</strong><span>Records stay on this device</span></article>
              </> : <>
                <article><strong>Two layers</strong><span>Public fill + screening hatch</span></article>
                <article><strong>{heatmapEligibleProfiles.length}</strong><span>Unique eligible app profiles</span></article>
                <article><strong>{duplicateScreeningProfiles} duplicate{duplicateScreeningProfiles === 1 ? "" : "s"} excluded</strong><span>Matched by field reference</span></article>
                <article><strong>No summed total</strong><span>Sources cannot double-count each other</span></article>
              </>}
            </div>
            <div className="dashboard-workspace">
              <PhilippinesRegionMap regions={heatmapRegions} screeningRegions={heatmapDataMode === "combined" ? appScreeningRegions : undefined} selectedRegionId={selectedRegionId} onSelect={setSelectedRegionId} dataSource={heatmapDataMode} />
              {(() => {
                const selectedRegion: SyntheticRegion = heatmapRegions.find((region) => region.id === selectedRegionId) || heatmapRegions[0];
                const selectedScreeningRegion = appScreeningRegions.find((region) => region.id === selectedRegion.id) || appScreeningRegions[0];
                const isAppScreeningMode = heatmapDataMode === "app-screenings";
                const isCombinedMode = heatmapDataMode === "combined";
                return <aside className="regional-detail" aria-live="polite"><p className="card-kicker">Selected administrative region</p><h2>{selectedRegion.label}</h2><p>{isCombinedMode ? "The LCP public signal is shown as the region fill, with unique app-screening profiles shown as a hatched overlay. Values remain separate because the sources have no shared participant identifier." : isAppScreeningMode ? "This view counts only unique saved profiling drafts marked as not previously surveyed whose selected region matches this boundary. Static public data is excluded." : "This boundary shows public lung cancer data from the Lung Center of the Philippines registry (2009–2017). It does not include profiling drafts saved in this web app."}</p><dl>{isCombinedMode && <div><dt>Public signal</dt><dd>{selectedRegion.signalLevel} (LCP)</dd></div>}<div><dt>{isAppScreeningMode || isCombinedMode ? "Screened individuals" : "Risk level"}</dt><dd>{isCombinedMode ? `${selectedScreeningRegion.syntheticRecords} unique app-screened` : isAppScreeningMode ? `${selectedRegion.syntheticRecords} app-screened` : `${selectedRegion.signalLevel}`}</dd></div><div><dt>{isAppScreeningMode ? "Region key" : "Recorded cases"}</dt><dd>{isAppScreeningMode ? "Selected profile region" : selectedRegion.coverage}</dd></div><div><dt>{isCombinedMode ? "Combination rule" : "Data separation"}</dt><dd>{isCombinedMode ? "Layered, not summed" : isAppScreeningMode ? "Public data excluded" : "App screenings excluded"}</dd></div></dl><small>{isCombinedMode ? "App profiles are deduplicated by normalized field reference. Cross-source totals are never calculated, preventing the public baseline and app layer from being counted twice." : isAppScreeningMode ? "Profiles marked Yes for a previous survey are excluded. Repeated field references are counted once even if letter casing differs." : "Source: LCP Lung Cancer Registry, 2009–2017 (cumulative hospital admissions by region of residence). National estimate: 23,728 new cases/year (GLOBOCAN 2022)."}</small></aside>;
              })()}
            </div>
          </div>
        </section>
      )}

      {view === "screening" && (
        <section className="screening-layout" aria-labelledby="screening-title">
          <div className="screening-intro">
            <button className="back-link" type="button" onClick={() => navigateTo("ready")}>
              <ChevronLeft size={17} /> Back to workspace
            </button>
            <p className="eyebrow"><ShieldCheck size={16} /> Local screening draft</p>
            <h1 id="screening-title">Record the screening information step by step.</h1>
            <p>This clinician-only form keeps its demo draft on this device. Fields marked optional do not block completion; do not enter names or other direct identifiers.</p>
            <label className="screening-input-mode-toggle">
              <span>
                <strong>Text interpretation</strong>
                <small>Replace screening dropdowns with locally interpreted text.</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={screeningInputMode === "text"}
                onChange={(event) => setScreeningInputMode(event.target.checked ? "text" : "structured")}
              />
            </label>
            <div className="screening-steps" aria-label={`Screening step ${screeningStep} of 4`}>
              {["Profile", "Symptoms", "Exposure", "Survey history"].map((label, index) => (
                <div className={screeningStep >= index + 1 ? "active" : ""} key={label}>
                  <span>{index + 1}</span>{label}
                </div>
              ))}
            </div>
          </div>

          <form className={`screening-card ${isSwitchingScreeningStep ? "is-switching" : ""}`} key={screeningStep} onSubmit={(event) => event.preventDefault()}>
            <div className={`screening-step-panel ${isSwitchingScreeningStep ? "is-leaving" : ""} ${showIncompleteFields ? "show-incomplete-fields" : ""}`} key={screeningStep} aria-live="polite">
              {screeningStep === 1 && (
                <>
                <div className="form-heading"><p className="card-kicker">Step 1 of 4</p><h2>Patient profile and place</h2><p>Use a field reference rather than a patient name.</p></div>
                <div className="form-grid">
                  <label className={missingFieldClass("fieldReference")}>Field reference<input name="fieldReference" value={screeningDraft.fieldReference} onChange={(event) => updateDraft("fieldReference", event.target.value)} placeholder="e.g. FIELD-024-001" /></label>
                  <label className={missingFieldClass("age")}>Age<input name="age" type="number" min="0" max="120" inputMode="numeric" value={screeningDraft.age} onChange={(event) => updateAge(event.target.value)} placeholder="Age in years" /></label>
                  {renderScreeningChoice("sexAtBirth", "Sex at birth", ["Female", "Male", "Intersex", "Prefer not to record"])}
                  <label className={missingFieldClass("occupation")}>Occupation<input name="occupation" value={screeningDraft.occupation} onChange={(event) => updateDraft("occupation", event.target.value)} placeholder="Current or primary occupation" /></label>
                  <ScreeningLocationFields
                    region={screeningDraft.province}
                    municipality={screeningDraft.municipality}
                    barangay={screeningDraft.barangay}
                    invalidRegion={showIncompleteFields && !screeningDraft.province.trim()}
                    invalidMunicipality={showIncompleteFields && !screeningDraft.municipality.trim()}
                    invalidBarangay={showIncompleteFields && !screeningDraft.barangay.trim()}
                    onRegionChange={(region) => setScreeningDraft((current) => ({ ...current, province: region, municipality: "", barangay: "" }))}
                    onMunicipalityChange={(municipality) => setScreeningDraft((current) => ({ ...current, municipality, barangay: "" }))}
                    onBarangayChange={(barangay) => updateDraft("barangay", barangay)}
                  />
                  <EnvironmentalRiskPanel
                    status={environmentalStatus}
                    snapshot={environmentalRisk}
                    errorMessage={environmentalError}
                    onRetry={() => setEnvironmentalRefreshKey((current) => current + 1)}
                  />
                </div>
                </>
              )}

              {screeningStep === 3 && (
                <>
                <div className="form-heading"><p className="card-kicker">Step 3 of 4</p><h2>Smoking, exposure, and medical history</h2><p>Record each history item separately and use “Unknown” when the information is unavailable.</p></div>
                <div className="form-grid">
                  <div className="form-section-heading wide-field"><h3>Smoking history</h3></div>
                  {renderScreeningChoice("smokingStatus", "Smoking status", ["Current smoker", "Former smoker", "Never smoker"], updateSmokingStatus)}
                  <label className={missingFieldClass("packYears")}>Pack-years<input name="packYears" type="number" min="0" step="0.1" inputMode="decimal" value={screeningDraft.packYears} disabled={screeningDraft.smokingStatus === "Never smoker"} onChange={(event) => updateDraft("packYears", event.target.value)} placeholder="e.g. 12.5" /></label>
                  <label className={missingFieldClass("yearsSinceQuitting")}>Years since quitting<input name="yearsSinceQuitting" type={screeningDraft.smokingStatus === "Former smoker" ? "number" : "text"} min={screeningDraft.smokingStatus === "Former smoker" ? "0" : undefined} inputMode={screeningDraft.smokingStatus === "Former smoker" ? "numeric" : undefined} value={screeningDraft.yearsSinceQuitting} disabled={screeningDraft.smokingStatus !== "Former smoker"} onChange={(event) => updateDraft("yearsSinceQuitting", event.target.value)} placeholder={screeningDraft.smokingStatus === "Former smoker" ? "Years" : "Not applicable"} /></label>
                  <div className="form-section-heading wide-field"><h3>Occupational or environmental exposure</h3></div>
                  <fieldset className={`screening-checklist ${missingFieldClass("occupationalExposure")}`}>
                    <legend>Occupational/environment exposure</legend>
                    <p>Select all factors that apply.</p>
                    <div className="screening-checklist__options">
                      {exposureChecklistOptions.map((option) => <label key={option}><input name="occupationalExposure" type="checkbox" checked={selectedChecklistOptions(screeningDraft.occupationalExposure).includes(option)} onChange={() => toggleChecklistOption("occupationalExposure", option, exposureChecklistOptions)} />{option}</label>)}
                    </div>
                  </fieldset>
                  {selectedChecklistOptions(screeningDraft.occupationalExposure).includes("Other") && <label className={missingFieldClass("occupationalExposureOther")}>Other exposure (specify)<input name="occupationalExposureOther" value={screeningDraft.occupationalExposureOther} onChange={(event) => updateDraft("occupationalExposureOther", event.target.value)} /></label>}
                  <div className="form-section-heading wide-field"><h3>Medical history</h3></div>
                  {renderScreeningChoice("previousTuberculosis", "Previous case of tuberculosis", responseOptions)}
                  {renderScreeningChoice("copd", "COPD", responseOptions)}
                  {renderScreeningChoice("asthma", "Asthma", responseOptions)}
                  {renderScreeningChoice("previousMalignancy", "Previous case of malignancy", responseOptions)}
                  {renderScreeningChoice("familyHistory", "Does family have history of lung cancer?", responseOptions)}
                </div>
                </>
              )}

              {screeningStep === 2 && (
                <>
                <div className="form-heading"><p className="card-kicker">Step 2 of 4</p><h2>Symptoms and clinical assessment</h2><p>This is not a diagnosis. Record symptoms and relevant examination findings; use “Unknown” when appropriate.</p></div>
                <div className="form-grid symptom-form-grid">
                  <div className="form-section-heading wide-field"><h3>Symptoms</h3></div>
                  {renderScreeningChoice("persistentCough", "Persistent cough (>2–3 weeks)", responseOptions, undefined, "symptom-cough")}
                  {renderScreeningChoice("breathlessness", "Dyspnea", responseOptions, undefined, "symptom-breath")}
                  {renderScreeningChoice("bloodInSputum", "Hemoptysis", responseOptions, undefined, "symptom-blood")}
                  {renderScreeningChoice("chestPain", "Chest pain", responseOptions)}
                  <div className={`weight-loss-field ${screeningDraft.weightLoss === "Yes" ? "has-detail" : ""} ${missingFieldClass("weightLoss")}`}>
                    {renderScreeningChoice("weightLoss", "Weight loss", responseOptions, updateWeightLoss)}
                    {screeningDraft.weightLoss === "Yes" && <label>How much weight did the patient lose? (optional)<input value={screeningDraft.weightLossAmount} onChange={(event) => updateDraft("weightLossAmount", event.target.value)} placeholder="e.g. 5 kg or 11 lb" /></label>}
                  </div>
                  {renderScreeningChoice("hoarseness", "Hoarseness", responseOptions)}
                  {renderScreeningChoice("fatigue", "Fatigue", responseOptions)}
                  <div className="form-section-heading wide-field"><h3>Initial clinical assessment</h3></div>
                  <label>Vital signs (optional)<input name="vitalSigns" value={screeningDraft.vitalSigns} onChange={(event) => updateDraft("vitalSigns", event.target.value)} placeholder="e.g. BP 120/80, pulse 76, temperature 36.8 °C" /></label>
                  <label className="symptom-oxygen">Oxygen saturation (optional)<input name="oxygenSaturation" value={screeningDraft.oxygenSaturation} onChange={(event) => updateDraft("oxygenSaturation", event.target.value)} inputMode="decimal" placeholder="e.g. 97%" /></label>
                  {renderScreeningChoice("chestXrayAvailable", "Chest X-ray available", ["Yes", "No"])}
                  <div className="form-section-heading wide-field"><h3>Relevant physical examination findings</h3></div>
                  <fieldset className={`screening-checklist wide-field ${missingFieldClass("physicalExamFindings")}`}>
                    <legend>Physical examination findings</legend>
                    <p>Select all findings that apply.</p>
                    <div className="screening-checklist__options screening-checklist__options--columns">
                      {physicalExamOptions.map((option) => <label key={option}><input name="physicalExamFindings" type="checkbox" checked={selectedChecklistOptions(screeningDraft.physicalExamFindings).includes(option)} onChange={() => toggleChecklistOption("physicalExamFindings", option, physicalExamOptions)} />{option}</label>)}
                    </div>
                  </fieldset>
                  {selectedChecklistOptions(screeningDraft.physicalExamFindings).includes("Other") && <label className={`wide-field ${missingFieldClass("physicalExamOther")}`}>Other physical finding (specify)<input name="physicalExamOther" value={screeningDraft.physicalExamOther} onChange={(event) => updateDraft("physicalExamOther", event.target.value)} /></label>}
                  <label className="wide-field">Clinician note<textarea value={screeningDraft.clinicianNotes} onChange={(event) => updateDraft("clinicianNotes", event.target.value)} placeholder="Optional screening note; do not include direct identifiers." rows={4} /></label>
                </div>
                </>
              )}

              {screeningStep === 4 && (
                <>
                  <div className="form-heading"><p className="card-kicker">Step 4 of 4</p><h2>Previous survey history</h2><p>Confirm whether this patient has answered a screening survey before so the heat map does not count the same participant twice.</p></div>
                  <div className="form-grid">
                    {renderScreeningChoice("previousSurveyResponse", "Has the patient answered any screening surveys in the past?", ["Yes", "No"], undefined, "wide-field")}
                    {screeningDraft.previousSurveyResponse === "Yes" && <p className="field-note wide-field">This profile can be saved locally for clinician review, but it will be excluded from the app-screenings heat map to avoid duplicate participants.</p>}
                  </div>
                </>
              )}
            </div>

            <div className="draft-actions">
              <div className={`draft-status ${screeningIsComplete ? "is-complete" : ""}`} aria-live="polite">{draftStatus || (screeningIsComplete ? "Screening complete — eligible for prototype risk-support review." : `${requiredScreeningFields.filter((field) => !screeningDraft[field].trim()).length} required screening field(s) still need a value.`)}</div>
              <div className="draft-buttons">
                <button className="text-button" type="button" onClick={restoreScreeningDraft}>Restore local draft</button>
                <button className="secondary-button" type="button" onClick={saveScreeningDraft}>Save local draft</button>
                {screeningStep > 1 && <button className="secondary-button" type="button" disabled={isSwitchingScreeningStep} onClick={() => changeScreeningStep(screeningStep - 1)}>Previous</button>}
                {screeningStep < 4 ? (
                  <button className="primary-button" type="button" disabled={isSwitchingScreeningStep} onClick={() => changeScreeningStep(screeningStep + 1)}>Continue <ArrowRight size={18} /></button>
                ) : (
                  <>
                    {!screeningIsComplete && <button className="secondary-button" type="button" onClick={takeToIncompleteField}>Take to incomplete field <ArrowRight size={18} /></button>}
                    <button className="primary-button" type="button" disabled={!screeningIsComplete} onClick={finishScreening}>Run completeness check <Check size={18} /></button>
                  </>
                )}
              </div>
            </div>
          </form>
        </section>
      )}

      {view === "ai-consent" && (
        <section className="ai-path-layout" aria-labelledby="ai-consent-title">
          <div className="ai-path-context">
            <button className="back-link" type="button" onClick={() => navigateTo("screening")}><ChevronLeft size={17} /> Back to screening</button>
            <p className="eyebrow"><ShieldCheck size={16} /> Optional risk-support path</p>
            <h1 id="ai-consent-title">Would the patient agree to clinician-led AI risk support?</h1>
            <p>The screening completeness gate has passed. Explain that this optional prototype does not diagnose cancer; a medical professional remains responsible for image interpretation and follow-up.</p>
          </div>
          <div className="ai-path-card">
            <p className="card-kicker">Separate consent</p>
            <h2>Record the patient’s choice before collecting imaging details.</h2>
            <p className="helper-text">A local CT, chest X-ray, or DICOM file can be selected. The prototype keeps the file on this device and creates an illustrative triage estimate and attention overlay only; it does not make a diagnosis.</p>
            <div className="ai-choice-list">
              <button className="secondary-button" type="button" onClick={() => recordAiConsent(false)}>No, keep screening only</button>
              <button className="primary-button" type="button" onClick={() => recordAiConsent(true)}>Yes, continue to imaging details <ArrowRight size={18} /></button>
            </div>
          </div>
        </section>
      )}

      {view === "imaging-metadata" && (
        <section className="ai-path-layout" aria-labelledby="imaging-metadata-title">
          <div className="ai-path-context">
            <button className="back-link" type="button" onClick={() => navigateTo("ai-consent")}><ChevronLeft size={17} /> Back to AI consent</button>
            <p className="eyebrow"><ShieldCheck size={16} /> Local imaging metadata</p>
            <h1 id="imaging-metadata-title">Prepare local imaging metadata.</h1>
            <p>The AI imaging model is still under development. This optional step saves local study details for a future clinician-reviewed model workflow; it does not analyse the scan today.</p>
          </div>
          <form className="ai-path-card imaging-form" onSubmit={(event) => event.preventDefault()}>
            <p className="card-kicker">Imaging check</p>
            <h2>Is an imaging study available for future model review?</h2>
            <div className="form-grid">
              <label>Imaging modality<select value={imagingMetadata.modality} onChange={(event) => updateImagingMetadata("modality", event.target.value)}><option value="">Select option</option><option>CT scan</option><option>Chest X-ray</option><option>No imaging available</option></select></label>
              <label>Imaging availability<select value={imagingMetadata.sourceStatus} onChange={(event) => updateImagingMetadata("sourceStatus", event.target.value)}><option value="">Select option</option><option>Available locally</option><option>Patient will return with it</option><option>Not available</option></select></label>
              <label>Study / facility reference<input value={imagingMetadata.studyReference} onChange={(event) => updateImagingMetadata("studyReference", event.target.value)} placeholder="Non-identifying local reference" /></label>
              <div className="study-date-picker"><span className="field-label">Study date (if known)</span>
                <button className="date-picker-trigger" type="button" onClick={openStudyCalendar} aria-label={imagingMetadata.studyDate ? `Selected study date: ${new Date(`${imagingMetadata.studyDate}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}` : "Select study date"} aria-expanded={isStudyCalendarOpen} aria-haspopup="dialog">
                  <span>{imagingMetadata.studyDate ? new Date(`${imagingMetadata.studyDate}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "Select study date"}</span><CalendarDays size={18} aria-hidden="true" />
                </button>
                {isStudyCalendarOpen && (
                  <div className="date-picker-popover" role="dialog" aria-label="Study date calendar">
                    <div className="date-picker-controls">
                      <label>Study month<select value={calendarMonth} onChange={(event) => setCalendarMonth(Number(event.target.value))}>{calendarMonths.map((month, index) => <option value={index} key={month}>{month}</option>)}</select></label>
                      <label>Study year<select value={calendarYear} onChange={(event) => setCalendarYear(Number(event.target.value))}>{Array.from({ length: new Date().getFullYear() - 1989 }, (_, index) => new Date().getFullYear() - index).map((year) => <option value={year} key={year}>{year}</option>)}</select></label>
                    </div>
                    <div className="calendar-weekdays" aria-hidden="true"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
                    <div className="calendar-days">{calendarCellsFor(calendarYear, calendarMonth).map((day, index) => day ? <button className={imagingMetadata.studyDate === dateValueFor(calendarYear, calendarMonth, day) ? "selected" : ""} type="button" key={`${calendarYear}-${calendarMonth}-${day}`} onClick={() => selectStudyDate(day)} aria-label={`Choose ${calendarMonths[calendarMonth]} ${day}, ${calendarYear}`}>{day}</button> : <span key={`blank-${index}`} />)}</div>
                  </div>
                )}
              </div>
              <label className="wide-field">Facility or source (optional)<input value={imagingMetadata.facility} onChange={(event) => updateImagingMetadata("facility", event.target.value)} placeholder="Facility, mobile unit, or source" /></label>
              <div className="wide-field imaging-file-field">
                <span id="imaging-file-label" className="field-label">Imaging files (optional)</span>
                <div
                  className="imaging-dropzone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    recordImagingFiles(event.dataTransfer.files);
                  }}
                >
                  <input
                    ref={imagingFileInput}
                    id="imaging-file"
                    className="visually-hidden"
                    type="file"
                    accept=".dcm,.dicom,image/*,application/dicom"
                    multiple
                    aria-labelledby="imaging-file-label"
                    onChange={(event) => {
                      recordImagingFiles(event.target.files ?? undefined);
                      event.target.value = "";
                    }}
                  />
                  {imagingMetadata.imagingFiles.length ? (
                    <div className="imaging-file-list" aria-live="polite">
                      <div className="imaging-file-list-header"><span><strong>{imagingMetadata.imagingFiles.length} local file{imagingMetadata.imagingFiles.length === 1 ? "" : "s"} selected</strong><small>Assign an optional acquisition date to each file.</small></span><button className="secondary-button" type="button" onClick={() => imagingFileInput.current?.click()}>Add files</button></div>
                      {imagingMetadata.imagingFiles.map((file) => (
                        <article className="imaging-file-selected" key={file.id}>
                          <span><strong>{file.name}</strong><small>{file.type} · {(file.size / 1024).toFixed(1)} KB · Local demo reference only</small></span>
                          <label>Acquisition date (optional)<input type="date" aria-label={`Acquisition date for ${file.name}`} value={file.takenOn} onChange={(event) => updateImagingFileDate(file.id, event.target.value)} /></label>
                          <button className="text-button" type="button" onClick={() => removeImagingFile(file.id)}>Remove file</button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="imaging-file-empty">
                      <span aria-hidden="true">↓</span>
                      <p><strong>Drop CT, CXR, or DICOM files here</strong><small>Image formats can be previewed locally. DICOM is retained as a local reference; this prototype does not parse diagnostic DICOM pixel data.</small></p>
                      <button className="secondary-button" type="button" onClick={() => imagingFileInput.current?.click()}>Choose local files</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="field-note"><CloudOff size={16} /> The AI model is still under development. Files and metadata stay local in this demo and are not interpreted.</p>
            <div className="draft-buttons"><button className="primary-button" type="button" onClick={saveTemporaryRecord}>Save temporary local record <Check size={18} /></button></div>
          </form>
        </section>
      )}

      {view === "temporary-record" && (
        <section className="ready-layout temporary-record-layout" aria-labelledby="temporary-record-title">
          <div className="ready-icon"><ShieldCheck size={34} /></div>
          <p className="eyebrow">Temporary local record</p>
          <h1 id="temporary-record-title">{temporaryRecordReady ? "Local imaging metadata has been saved." : "More imaging details can be added later."}</h1>
          <p>{temporaryRecordReady ? "The AI imaging model is still under development, so no image analysis or additional risk estimate has been generated. The local record is ready for a future clinician-reviewed model workflow." : "This local draft is marked for follow-up. You can return with an available CT or chest X-ray and local study details when ready."}</p>
          <div className="ready-actions">
            <button className="secondary-button" type="button" onClick={() => navigateTo("imaging-metadata")}>Update imaging details</button>
            <button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button>
          </div>
          <p className="stage-note">AI imaging model: under development · clinician review is required before any real clinical action.</p>
        </section>
      )}

      {view === "risk-estimate" && (
        <section className="risk-layout" aria-labelledby="risk-estimate-title">
          <div className="risk-intro">
            <button className="back-link" type="button" onClick={() => navigateTo("screening")}><ChevronLeft size={17} /> Edit screening profile</button>
            <p className="eyebrow"><BrainCircuit size={16} /> Static screening demo</p>
            <h1 id="risk-estimate-title">Estimated lung-cancer follow-up risk.</h1>
            <p>This static demonstration reads the completed screening profile only. It weighs recorded habits, environmental exposure, health history, and symptoms to estimate whether follow-up risk is lower, intermediate, or high.</p>
            <div className="clinical-warning"><AlertTriangle size={19} /><span><strong>Clinician oversight required.</strong> Escalate symptoms or concerning imaging through the appropriate clinical pathway regardless of this prototype display.</span></div>
          </div>
          <div className="risk-workspace">
            <article className="risk-score-card">
              <div className="risk-card-topline"><span>Screening-only estimate</span><span>Static demo</span></div>
              <div className={`risk-score risk-${prototypeRiskScore >= 50 ? "elevated" : prototypeRiskScore >= 25 ? "intermediate" : "lower"}`}><strong>{prototypeRiskScore}<small>/100</small></strong><span>{prototypeRiskBand}</span></div>
              <p>This is a transparent demo calculation, not a cancer probability or a validated clinical score. It does not diagnose or rule out lung cancer.</p>
              <dl className="risk-inputs"><div><dt>Smoking status</dt><dd>{screeningDraft.smokingStatus}</dd></div><div><dt>Exposure</dt><dd>{screeningDraft.occupationalExposure}</dd></div><div><dt>Symptoms recorded</dt><dd>{symptomSignals.filter(([value]) => value === "Yes").length} positive</dd></div><div><dt>Profile completeness</dt><dd>{requiredScreeningFields.length} / {requiredScreeningFields.length} complete</dd></div></dl>
              <div className="static-demo-actions"><button className="secondary-button" type="button" onClick={() => navigateTo("screening")}>Review screening profile</button><button className="primary-button" type="button" onClick={() => navigateTo("imaging-metadata")}>Continue to local imaging metadata <ArrowRight size={18} /></button></div>
            </article>
            <article className="heatmap-card static-driver-card">
              <div className="risk-card-topline"><span>Factors included</span><span>Profile only</span></div>
              <h2>What informed this estimate</h2>
              <p>The static demo considers only the values entered in the screening form. It does not use CT scans, chest X-rays, or a model-generated heatmap.</p>
              <div className="risk-driver-list">{profileRiskDrivers.map((driver) => <span key={driver}>{driver}</span>)}</div>
              <p>Imaging review and image-derived heatmaps are intentionally deferred until the next prototype phase.</p>
            </article>
          </div>
        </section>
      )}

      {view === "nodule-review" && (
        <section className="review-layout" aria-labelledby="nodule-review-title">
          <div className="review-context">
            <button className="back-link" type="button" onClick={() => navigateTo("temporary-record")}><ChevronLeft size={17} /> Back to temporary record</button>
            <p className="eyebrow"><ShieldCheck size={16} /> Clinician review gate</p>
            <h1 id="nodule-review-title">Review the support packet before it can continue.</h1>
            <p>Aeris AI does not diagnose cancer. This checkpoint records the clinician’s workflow decision; it does not replace imaging interpretation or clinical judgment.</p>
          </div>
          <div className="review-card">
            <div className="review-card-topline"><span className="status-chip">Static workflow fixture</span><span>Local only</span></div>
            <h2>Metadata-only review packet</h2>
            <p className="helper-text">No CT pixels have been uploaded, parsed, or interpreted. This fixture is not a nodule finding, malignancy estimate, or diagnosis.</p>
            <dl className="review-facts">
              <div><dt>Modality</dt><dd>{imagingMetadata.modality || "Not recorded"}</dd></div>
              <div><dt>Availability</dt><dd>{imagingMetadata.sourceStatus || "Not recorded"}</dd></div>
              <div><dt>Study reference</dt><dd>{imagingMetadata.studyReference || "Not recorded"}</dd></div>
              <div><dt>Study date</dt><dd>{imagingMetadata.studyDate || "Not recorded"}</dd></div>
              <div><dt>Local imaging files</dt><dd>{imagingMetadata.imagingFiles.length ? imagingMetadata.imagingFiles.map((file) => `${file.name}${file.takenOn ? ` — taken ${file.takenOn}` : ""}`).join("; ") : "Not attached"}</dd></div>
            </dl>

            {reviewOutcome === "pending" && (
              <div className="review-actions">
                <p><strong>Clinician decision</strong> Is this record sufficiently described to move to a later, clinician-reviewed risk-data path?</p>
                <button className="primary-button" type="button" onClick={() => saveClinicianReview("accepted")}>Accept as reviewed workflow data <Check size={18} /></button>
                <button className="secondary-button" type="button" onClick={() => saveClinicianReview("needs-info")}>Request more information</button>
              </div>
            )}

            {reviewOutcome === "needs-info" && (
              <div className="review-resolution" role="status">
                <strong>More information requested.</strong>
                <p>The local record is marked for follow-up. Return with more clinical or imaging context, or continue only when the clinician explicitly accepts the caveat.</p>
                <div className="draft-buttons"><button className="secondary-button" type="button" onClick={() => navigateTo("imaging-metadata")}>Update temporary record</button><button className="primary-button" type="button" onClick={() => saveClinicianReview("forced")}>Force continue with caveat</button></div>
              </div>
            )}

            {(reviewOutcome === "accepted" || reviewOutcome === "forced") && (
              <div className="review-resolution" role="status">
                <strong>{reviewOutcome === "forced" ? "Forced continuation recorded." : "Clinician review recorded."}</strong>
                <p>{reviewOutcome === "forced" ? "The local record is clearly marked as forced and remains subject to later clinician and governance review." : "The local record is marked as clinician-reviewed workflow data. It has not been aggregated or shared."}</p>
                {reviewOutcome === "accepted" ? <div className="draft-buttons"><button className="primary-button" type="button" onClick={openAggregation}>Prepare de-identified population record <ArrowRight size={18} /></button><button className="secondary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button></div> : <button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button>}
              </div>
            )}
          </div>
        </section>
      )}

      {view === "aggregation" && (
        <section className="review-layout" aria-labelledby="aggregation-title">
          <div className="review-context">
            <button className="back-link" type="button" onClick={() => navigateTo("nodule-review")}><ChevronLeft size={17} /> Back to clinician review</button>
            <p className="eyebrow"><ShieldCheck size={16} /> Local aggregation gate</p>
            <h1 id="aggregation-title">Prepare a population record without patient-identifying details.</h1>
            <p>This local demo transforms only a clinician-reviewed workflow record into a minimal population-data fixture. It does not transmit, share, or create a clinical risk result.</p>
          </div>
          <div className="review-card aggregation-card">
            <div className="review-card-topline"><span className="status-chip">De-identification preview</span><span>Local only</span></div>
            <h2>Population-data preview</h2>
            <div className="deid-grid">
              <section><strong>Removed before aggregation</strong><p>Field reference, barangay, clinician notes, facility, study reference, study dates, and local imaging-file metadata.</p></section>
              <section><strong>Retained as grouped signals</strong><p>Province-level geography, age band, recorded exposure categories, symptom signal count, and clinician-reviewed pathway status.</p></section>
            </div>
            <dl className="review-facts aggregation-facts">
              <div><dt>Geography</dt><dd>{screeningDraft.province.trim() ? `Province-level: ${screeningDraft.province.trim()}` : "Province-level: not recorded"}</dd></div>
              <div><dt>Age band</dt><dd>{screeningDraft.ageRange || "Not recorded"}</dd></div>
              <div><dt>Smoking status</dt><dd>{screeningDraft.smokingStatus || "Not recorded"}</dd></div>
              <div><dt>Symptom signals</dt><dd>{[screeningDraft.persistentCough, screeningDraft.breathlessness, screeningDraft.bloodInSputum, screeningDraft.weightLoss].filter((value) => value === "Yes").length} recorded</dd></div>
            </dl>
            {aggregationComplete ? (
              <div className="review-resolution" role="status"><strong>Local population record created.</strong><p>This de-identified fixture is now one of {populationRecordCount} local population record{populationRecordCount === 1 ? "" : "s"}. External sharing and the regional dashboard remain disabled until later tasks.</p><button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button></div>
            ) : (
              <div className="review-actions"><p><strong>Aggregation check</strong> Confirm that only the grouped preview above will be added to the local population-data fixture.</p><button className="primary-button" type="button" onClick={aggregateDeidentifiedRecord}>Create local population record <Check size={18} /></button></div>
            )}
          </div>
        </section>
      )}

      {view === "screening-complete" && (
        <section className="ready-layout temporary-record-layout" aria-labelledby="screening-complete-title">
          <div className="ready-icon"><Check size={34} /></div>
          <p className="eyebrow">Screening-only path</p>
          <h1 id="screening-complete-title">The local screening draft was saved without AI support.</h1>
          <p>The patient did not opt into the separate AI risk-support path. No imaging metadata or AI-related temporary record was created.</p>
          <div className="ready-actions"><button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button></div>
        </section>
      )}

      {view === "login" && (
        <section className="login-layout" aria-labelledby="login-title">
          <div className="login-context">
            <p className="eyebrow"><ShieldCheck size={16} /> Consent recorded</p>
            <h1>Confirm the clinician before starting the survey.</h1>
            <p>Demo credentials are local to this browser. No external account or patient data is transmitted.</p>
            <div className="saved-strip" aria-live="polite"><Check size={16} /> Consent status saved locally</div>
          </div>
          <form className="login-card" onSubmit={(event) => { event.preventDefault(); enterDemo(); }}>
            <p className="card-kicker">Demo access</p>
            <h2 id="login-title">Secure field login</h2>
            <fieldset className="login-mode-field">
              <legend>Workspace mode</legend>
              <div className="login-mode-switch" role="group" aria-label="Workspace mode">
                <button
                  type="button"
                  className={workspaceMode === "health-center" ? "active" : ""}
                  aria-pressed={workspaceMode === "health-center"}
                  onClick={() => changeWorkspaceMode("health-center")}
                >
                  Health Care Center Mode
                </button>
                <button
                  type="button"
                  className={workspaceMode === "cancer-registry" ? "active" : ""}
                  aria-pressed={workspaceMode === "cancer-registry"}
                  onClick={() => changeWorkspaceMode("cancer-registry")}
                >
                  Cancer Registry Mode
                </button>
              </div>
              <p className="login-mode-note">Choose the workspace context. Mode-specific behavior will be added separately.</p>
            </fieldset>
            <label>
              Health professional ID
              <input value={clinicianId} onChange={(event) => setClinicianId(event.target.value)} placeholder={`e.g. ${workspaceMode === "health-center" ? "HCC-024" : "CR-024"}`} autoComplete="username" />
            </label>
            <label>
              Demo passcode
              <input value={passcode} onChange={(event) => setPasscode(event.target.value)} type="password" placeholder="Enter any passcode" autoComplete="current-password" />
            </label>
            <p className="field-note"><LockKeyhole size={15} /> This is a hackathon demo. Authentication will be replaced before clinical use.</p>
            <button className="primary-button full-width" type="submit" disabled={!clinicianId || !passcode}>
              Enter screening workspace <ArrowRight size={18} />
            </button>
            <button className="text-button" type="button" onClick={() => navigateTo("consent")}>Back to consent</button>
          </form>
        </section>
      )}

      {view === "ready" && (
        <EncounterDashboard
            clinicianId={`Health professional · ${clinicianId || defaultClinicianId}`}
            onStartScreening={startScreening}
            onEditScreening={editSavedScreening}
            onDeleteScreening={deleteSavedScreening}
            onViewTemporaryRecord={() => navigateTo("temporary-record")}
          onDeleteTemporaryRecord={deleteTemporaryRecord}
          onEndSession={endDemoSession}
        />
      )}

      {false && view === "ready" && (
        <section className="ready-layout" aria-labelledby="ready-title">
          <div className="ready-icon"><CircleCheckBig size={34} /></div>
          <p className="eyebrow">Workspace ready</p>
          <h1 id="ready-title">You’re signed in as Health professional · {clinicianId || defaultClinicianId}.</h1>
          <p>Consent is recorded for this encounter. Continue with the clinician-led screening draft.</p>
          <div className="ready-actions">
            <button className="primary-button" type="button" onClick={startScreening}>Start screening <ArrowRight size={18} /></button>
            <button className="secondary-button" type="button" onClick={() => { sessionStorage.removeItem("idea-demo-clinician"); navigateTo("consent"); resetEncounter(); }}>End demo session</button>
          </div>
          <p className="stage-note">Stage preview · TASK-002 · Screening drafts stay local</p>
        </section>
      )}
      </div>
    </main>
  );
}
