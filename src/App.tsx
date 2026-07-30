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
import philippinesMapMini from "./assets/philippines-map-mini.jpg";
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
import { fetchEnvironmentalRiskForLocation, parseMunicipalityLabel, type EnvironmentalRiskSnapshot } from "./environmental-risk";
import { PLCO_EDUCATION_OPTIONS } from "./plcom2012-norace";
import { estimateAerisRisk } from "./risk-estimate";
import { PhilippinesRegionMap, type ProvinceScreeningSignal } from "./components/PhilippinesRegionMap";
import { RegionRiskSummaryPanel } from "./components/RegionRiskSummaryPanel";
import { RegionStatisticsPanel } from "./components/RegionStatisticsPanel";
import { populationDataKey, readLocalPopulationFixtureCount, syntheticRegions, type SyntheticRegion } from "./population-dashboard";
import { fetchEnvironmentalRiskForRegion } from "./region-environment";
import { buildRegionRiskSummary } from "./region-risk-summary";
import { buildRegionStatistics } from "./region-statistics";

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
type HeatmapViewLevel = "national" | "province";

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

const appScreeningProvincesFor = (profiles: LocalScreeningDraft[]): ProvinceScreeningSignal[] => {
  const countsByProvince = new Map<string, ProvinceScreeningSignal>();

  profiles.forEach((profile) => {
    const municipality = parseMunicipalityLabel(profile.municipality);
    const provinceName = municipality.province
      || (/puerto princesa/i.test(municipality.name) ? "Palawan" : "");
    if (!provinceName) return;
    const provinceKey = normaliseRegionName(provinceName);
    const current = countsByProvince.get(provinceKey);
    countsByProvince.set(provinceKey, {
      provinceName,
      screenedIndividuals: (current?.screenedIndividuals ?? 0) + 1,
    });
  });

  return [...countsByProvince.values()];
};

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
  "fieldReference", "age", "sexAtBirth", "educationLevel", "heightCm", "weightKg", "barangay", "municipality", "province", "occupation",
  "smokingStatus", "cigarettesPerDay", "yearsSmoked", "yearsSinceQuitting", "occupationalExposure",
  "previousTuberculosis", "copd", "asthma", "previousMalignancy", "familyHistory",
  "persistentCough", "breathlessness", "bloodInSputum", "chestPain", "weightLoss", "hoarseness", "fatigue",
  "chestXrayAvailable", "physicalExamFindings", "previousSurveyResponse",
];

const screeningStepForField: Partial<Record<keyof ScreeningDraft, number>> = {
  fieldReference: 1, age: 1, sexAtBirth: 1, educationLevel: 1, heightCm: 1, weightKg: 1, barangay: 1, municipality: 1, province: 1, occupation: 1,
  persistentCough: 2, breathlessness: 2, bloodInSputum: 2, chestPain: 2, weightLoss: 2, hoarseness: 2, fatigue: 2,
  chestXrayAvailable: 2, physicalExamFindings: 2, physicalExamOther: 2,
  smokingStatus: 3, cigarettesPerDay: 3, yearsSmoked: 3, yearsSinceQuitting: 3, occupationalExposure: 3, occupationalExposureOther: 3,
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
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [heatmapViewLevel, setHeatmapViewLevel] = useState<HeatmapViewLevel>("national");
  const [drilledRegionId, setDrilledRegionId] = useState<string | null>(null);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string | null>(null);
  const [showRegionStatistics, setShowRegionStatistics] = useState(false);
  const [showRegionRiskSummary, setShowRegionRiskSummary] = useState(false);
  const [regionEnvironmentalRisk, setRegionEnvironmentalRisk] = useState<EnvironmentalRiskSnapshot | null>(null);
  const [regionEnvironmentalStatus, setRegionEnvironmentalStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [regionEnvironmentalError, setRegionEnvironmentalError] = useState("");
  const [regionEnvironmentalRefreshKey, setRegionEnvironmentalRefreshKey] = useState(0);
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
  const heatmapRegionClickRef = useRef<{ id: string; at: number } | null>(null);
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
  const aerisRiskEstimate = useMemo(() => estimateAerisRisk(screeningDraft, environmentalRisk), [screeningDraft, environmentalRisk]);
  const uploadedPreview = imagingMetadata.imagingFiles.find((file) => file.previewUrl)?.previewUrl;
  const heatmapEligibleProfiles = useMemo(() => uniqueHeatmapProfiles(appScreeningProfiles), [appScreeningProfiles]);
  const appScreeningRegions = useMemo(() => appScreeningRegionsFor(heatmapEligibleProfiles), [heatmapEligibleProfiles]);
  const appScreeningProvinces = useMemo(() => appScreeningProvincesFor(heatmapEligibleProfiles), [heatmapEligibleProfiles]);
  const priorSurveyProfiles = useMemo(() => appScreeningProfiles.filter((profile) => profile.previousSurveyResponse === "Yes"), [appScreeningProfiles]);
  const duplicateScreeningProfiles = appScreeningProfiles.filter((profile) => profile.previousSurveyResponse === "No").length - heatmapEligibleProfiles.length;
  const heatmapRegions = heatmapDataMode === "app-screenings" ? appScreeningRegions : syntheticRegions;

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

  useEffect(() => {
    setShowRegionRiskSummary(false);
    setRegionEnvironmentalRisk(null);
    setRegionEnvironmentalStatus("idle");
    setRegionEnvironmentalError("");
  }, [selectedRegionId]);

  useEffect(() => {
    if (!selectedRegionId || (!showRegionStatistics && !showRegionRiskSummary)) return;

    const regionLabel = syntheticRegions.find((region) => region.id === selectedRegionId)?.label ?? selectedRegionId;
    const controller = new AbortController();
    let active = true;
    setRegionEnvironmentalStatus("loading");
    setRegionEnvironmentalError("");

    const fetchImpl: typeof fetch = (input, init) => globalThis.fetch(input, { ...init, signal: controller.signal });

    void fetchEnvironmentalRiskForRegion(selectedRegionId, regionLabel, fetchImpl).then((result) => {
      if (!active || controller.signal.aborted) return;
      if (result.ok) {
        setRegionEnvironmentalRisk(result.snapshot);
        setRegionEnvironmentalStatus("ready");
        return;
      }
      setRegionEnvironmentalRisk(null);
      setRegionEnvironmentalStatus("error");
      setRegionEnvironmentalError(result.error);
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [selectedRegionId, showRegionStatistics, showRegionRiskSummary, regionEnvironmentalRefreshKey]);

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
      cigarettesPerDay: value === "Never smoker" ? "0" : current.cigarettesPerDay === "0" ? "" : current.cigarettesPerDay,
      yearsSmoked: value === "Never smoker" ? "0" : current.yearsSmoked === "0" ? "" : current.yearsSmoked,
      packYears: value === "Never smoker" ? "0" : current.packYears,
      yearsSinceQuitting: value === "Former smoker" ? (current.yearsSinceQuitting === "Not applicable" ? "" : current.yearsSinceQuitting) : "Not applicable",
    }));
  };

  const updateSmokingIntensity = (field: "cigarettesPerDay" | "yearsSmoked", value: string) => {
    setScreeningDraft((current) => {
      const next = { ...current, [field]: value };
      const cigarettesPerDay = Number.parseFloat(field === "cigarettesPerDay" ? value : next.cigarettesPerDay);
      const yearsSmoked = Number.parseFloat(field === "yearsSmoked" ? value : next.yearsSmoked);
      if (Number.isFinite(cigarettesPerDay) && cigarettesPerDay > 0 && Number.isFinite(yearsSmoked) && yearsSmoked > 0) {
        next.packYears = String(Math.round((cigarettesPerDay / 20) * yearsSmoked * 10) / 10);
      }
      return next;
    });
  };

  const updateBodyMeasure = (field: "heightCm" | "weightKg", value: string) => {
    setScreeningDraft((current) => {
      const next = { ...current, [field]: value };
      const heightCm = Number.parseFloat(field === "heightCm" ? value : next.heightCm);
      const weightKg = Number.parseFloat(field === "weightKg" ? value : next.weightKg);
      if (Number.isFinite(heightCm) && heightCm > 0 && Number.isFinite(weightKg) && weightKg > 0) {
        const heightM = heightCm / 100;
        next.bmi = String(Math.round((weightKg / (heightM * heightM)) * 10) / 10);
      } else {
        next.bmi = "";
      }
      return next;
    });
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

  const resetHeatmapView = (selectedRegion: string | null = null) => {
    heatmapRegionClickRef.current = null;
    setSelectedRegionId(selectedRegion);
    setHeatmapViewLevel("national");
    setDrilledRegionId(null);
    setSelectedProvinceName(null);
    setShowRegionStatistics(false);
    setShowRegionRiskSummary(false);
  };

  const changeHeatmapDataMode = (mode: HeatmapDataMode) => {
    setHeatmapDataMode(mode);
    resetHeatmapView();
  };

  const activateHeatmapRegion = (regionId: string) => {
    if (heatmapViewLevel === "province") return;

    const now = performance.now();
    const previousClick = heatmapRegionClickRef.current;
    const isConsecutiveDoubleClick = Boolean(
      previousClick
      && previousClick.id === regionId
      && now - previousClick.at <= 400,
    );

    if (isConsecutiveDoubleClick) {
      heatmapRegionClickRef.current = null;
      setSelectedRegionId(regionId);
      setDrilledRegionId(regionId);
      setHeatmapViewLevel("province");
      setSelectedProvinceName(null);
      setShowRegionStatistics(false);
      setShowRegionRiskSummary(false);
      return;
    }

    heatmapRegionClickRef.current = { id: regionId, at: now };
    setSelectedRegionId(regionId);
    setSelectedProvinceName(null);
    setShowRegionStatistics(false);
    setShowRegionRiskSummary(false);
  };

  const returnToNationalHeatmap = () => {
    heatmapRegionClickRef.current = null;
    setHeatmapViewLevel("national");
    setDrilledRegionId(null);
    setSelectedProvinceName(null);
    setShowRegionStatistics(false);
    setShowRegionRiskSummary(false);
  };

  const openPopulationDashboard = () => {
    setAppScreeningProfiles(readStoredScreenings().map((screening) => screening.data));
    setPopulationRecordCount(readLocalPopulationFixtureCount());
    setHeatmapDataMode("public");
    resetHeatmapView();
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

            <button
              className="heatmap-mini-card"
              type="button"
              aria-label="Heatmap status: view heatmap dashboard"
              onClick={openPopulationDashboard}
            >
              <img className="heatmap-mini-map" src={philippinesMapMini} alt="" />
              <span className="heatmap-mini-copy">
                <span className="eyebrow"><MapPinned size={14} /> Population dashboard</span>
                <strong>Regional signals</strong>
                <span>Compare public registry patterns with screening profiles saved in this app.</span>
                <span className="heatmap-mini-action">View heatmap <ArrowRight size={16} aria-hidden="true" /></span>
              </span>
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
              <p>We are designing a lightweight workflow that helps medical professionals document consent, collect structured screening information, and review risk-support inputs without presenting AI as a diagnosis.</p>
            </article>

            <section className="about-feature-section" aria-labelledby="clinical-review-title">
              <p className="card-kicker">Clinical governance</p>
              <h2 id="clinical-review-title">Clinical review and support</h2>
              <div className="clinical-review-status">
                <span className="review-status-badge">Pending clinical review</span>
                <dl className="review-details">
                  <div>
                    <dt>Proposed clinical reviewer</dt>
                    <dd>[Doctor&apos;s name]</dd>
                  </div>
                  <div>
                    <dt>Current status</dt>
                    <dd>Clinical review, approval, and support have not yet been confirmed.</dd>
                  </div>
                </dl>
                <p>A formal review is planned for a future stage. Until that review is complete, Aeris AI remains a hackathon prototype and must not be presented as clinically approved or supported.</p>
              </div>
            </section>

            <section className="about-feature-section" aria-labelledby="attribution-title">
              <p className="card-kicker">Model attribution</p>
              <h2 id="attribution-title">Risk estimate credit</h2>
              <p>The current Risk support percentage uses the Tammemägi <strong>PLCOm2012noRace</strong> model (Ver1-13OCT2016-MT), a published 6-year lung-cancer probability calculator that omits race/ethnicity and is recommended for many non-US populations. Coefficients follow the non-commercial reference calculator by Professor Martin Tammemägi; commercial use requires contacting the author. Aeris does not modify those coefficients. Local Philippine/Asian context factors are shown beside the score for clinician judgment only.</p>
            </section>

            <section className="about-feature-section" aria-labelledby="features-title">
              <p className="card-kicker">Available now</p>
              <h2 id="features-title">Features</h2>
              <div className="about-feature-grid">
                <article>
                  <h3>Clinician-led local profiling</h3>
                  <p>A four-step screening draft captures location, tobacco and exposure history, symptoms, and past-survey history with clear completeness guidance.</p>
                </article>
                <article>
                  <h3>Private, local screening drafts</h3>
                  <p>Screening drafts stay on the device and can be imported, extracted individually, or deleted when they are no longer needed.</p>
                </article>
                <article>
                  <h3>Separated heat-map views</h3>
                  <p>Static public baseline data and profiles screened in this app are shown separately, preventing the two sources from being counted together.</p>
                </article>
                <article>
                  <h3>Region risk explanations</h3>
                  <p>Each public risk level opens a short summary that combines the LCP case baseline, local screening factors, and Open-Meteo air quality at a regional reference point.</p>
                </article>
                <article>
                  <h3>PLCOm2012noRace risk support</h3>
                  <p>Validated ever-smoker probability with separate local clinical considerations (never-smoker gaps, indoor/outdoor air, occupation, TB, EGFR context) — never presented as a diagnosis.</p>
                </article>
              </div>
            </section>

            <section className="about-feature-section" aria-labelledby="future-features-title">
              <p className="card-kicker">Planned next</p>
              <h2 id="future-features-title">Future features</h2>
              <div className="about-feature-grid">
                <article>
                  <h3>Local imaging metadata workflow</h3>
                  <p>Archived for now. A later release will restore local CT/chest X-ray metadata capture, temporary imaging records, and clinician review gates without claiming automated diagnosis.</p>
                </article>
                <article>
                  <h3>Aeris custom risk-estimation calculator</h3>
                  <p>Our own field-oriented risk index that can incorporate Philippine context modifiers (air quality, exposures, TB, never-smoker patterns) while keeping any validated model output clearly separated.</p>
                </article>
                <article>
                  <h3>Evaluated imaging model support</h3>
                  <p>Careful clinical evaluation and safe imaging-data integration before any future model-assisted review is considered.</p>
                </article>
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
            <p className="eyebrow"><MapPinned size={16} /> Population dashboard · Version 0.8</p>
            <h1 id="heatmap-status-title">Regional follow-up dashboard.</h1>
            <p>
              Compare the static public baseline, unique profiles saved in this web app, or a layered view that shows both sources without adding their counts together. Open a region for risk explanations and live air-quality context when online.
            </p>
          </div>

          <div className="heatmap-status-card">
            <div className="heatmap-status-topline">
              <span className="status-chip"><span className="status-beacon" aria-hidden="true" /> {heatmapDataMode === "public" ? "LCP Registry 2009–2017" : heatmapDataMode === "app-screenings" ? "App screening profiles only" : "Public + app layered view"}</span>
              <span>{heatmapDataMode === "public" ? "Lung Center of the Philippines public data" : heatmapDataMode === "app-screenings" ? `${heatmapEligibleProfiles.length} heatmap-eligible profile${heatmapEligibleProfiles.length === 1 ? "" : "s"}` : "Sources layered, never summed"}</span>
            </div>
            <div className="heatmap-source-switch" role="group" aria-label="Heat map data source">
              <button className={heatmapDataMode === "public" ? "active" : ""} type="button" aria-pressed={heatmapDataMode === "public"} onClick={() => changeHeatmapDataMode("public")}><strong>Public data</strong><span>Static baseline</span></button>
              <button className={heatmapDataMode === "app-screenings" ? "active" : ""} type="button" aria-pressed={heatmapDataMode === "app-screenings"} onClick={() => changeHeatmapDataMode("app-screenings")}><strong>App screenings</strong><span>Eligible profiles only</span></button>
              <button className={heatmapDataMode === "combined" ? "active" : ""} type="button" aria-pressed={heatmapDataMode === "combined"} onClick={() => changeHeatmapDataMode("combined")}><strong>Combined overlay</strong><span>Two separate layers</span></button>
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
              <PhilippinesRegionMap
                regions={heatmapRegions}
                screeningRegions={heatmapDataMode === "combined" ? appScreeningRegions : undefined}
                selectedRegionId={selectedRegionId}
                onSelect={activateHeatmapRegion}
                dataSource={heatmapDataMode}
                viewLevel={heatmapViewLevel}
                drilledRegionId={drilledRegionId}
                selectedProvinceName={selectedProvinceName}
                provinceScreeningSignals={appScreeningProvinces}
                onSelectProvince={setSelectedProvinceName}
                onResetView={returnToNationalHeatmap}
              />
              {(() => {
                const detailRegionId = heatmapViewLevel === "province" && drilledRegionId ? drilledRegionId : selectedRegionId;
                const selectedRegion = detailRegionId
                  ? heatmapRegions.find((region) => region.id === detailRegionId) ?? null
                  : null;
                const selectedScreeningRegion = selectedRegion
                  ? appScreeningRegions.find((region) => region.id === selectedRegion.id) || appScreeningRegions[0]
                  : null;
                const publicRegion = selectedRegion
                  ? syntheticRegions.find((region) => region.id === selectedRegion.id) || selectedRegion
                  : null;
                const isAppScreeningMode = heatmapDataMode === "app-screenings";
                const isCombinedMode = heatmapDataMode === "combined";
                const isDrilledView = heatmapViewLevel === "province";
                const isProvinceSelected = isDrilledView && Boolean(selectedProvinceName);
                const canOpenRegionStatistics = Boolean(selectedRegion) && !isDrilledView;
                const provinceAreaKind = selectedRegion?.id === "ncr" ? "district" : "province";
                const provinceScreeningCount = selectedProvinceName
                  ? appScreeningProvinces.find((signal) => signal.provinceName.toLowerCase().replace(/[^a-z0-9]/g, "") === selectedProvinceName.toLowerCase().replace(/[^a-z0-9]/g, ""))?.screenedIndividuals ?? 0
                  : 0;
                const regionStatistics = selectedRegion && publicRegion && canOpenRegionStatistics
                  ? buildRegionStatistics(selectedRegion, publicRegion, heatmapEligibleProfiles)
                  : null;
                const regionRiskSummary = selectedRegion && publicRegion && regionStatistics
                  ? buildRegionRiskSummary(publicRegion, regionStatistics, regionEnvironmentalRisk)
                  : null;
                const retryRegionEnvironmental = () => setRegionEnvironmentalRefreshKey((current) => current + 1);

                if (!selectedRegion) {
                  return (
                    <aside className="regional-detail" aria-live="polite">
                      <p className="card-kicker">No region selected</p>
                      <h2>Choose a region on the map</h2>
                      <p>
                        Activate any administrative region to inspect its public registry baseline or locally saved screening activity. Nothing is preselected when you open this dashboard.
                      </p>
                      <dl>
                        <div>
                          <dt>Selection</dt>
                          <dd>None yet</dd>
                        </div>
                        <div>
                          <dt>Regions available</dt>
                          <dd>18 PSA-aligned regions</dd>
                        </div>
                        <div>
                          <dt>Data modes</dt>
                          <dd>Public, app screenings, or combined</dd>
                        </div>
                        <div>
                          <dt>Next step</dt>
                          <dd>Click a region once to select it</dd>
                        </div>
                      </dl>
                      <small>
                        Public values come from the LCP Lung Cancer Registry (2009–2017). App-screening counts use unique profiles saved on this device.
                      </small>
                    </aside>
                  );
                }

                if (showRegionRiskSummary && regionRiskSummary) {
                  return (
                    <RegionRiskSummaryPanel
                      summary={regionRiskSummary}
                      environmental={regionEnvironmentalRisk}
                      environmentalStatus={regionEnvironmentalStatus}
                      environmentalError={regionEnvironmentalError}
                      backLabel={showRegionStatistics ? "Back to region statistics" : "Back to region summary"}
                      onClose={() => setShowRegionRiskSummary(false)}
                      onRetryEnvironmental={retryRegionEnvironmental}
                    />
                  );
                }

                if (showRegionStatistics && regionStatistics) {
                  return (
                    <RegionStatisticsPanel
                      statistics={regionStatistics}
                      environmental={regionEnvironmentalRisk}
                      environmentalStatus={regionEnvironmentalStatus}
                      environmentalError={regionEnvironmentalError}
                      onClose={() => setShowRegionStatistics(false)}
                      onRetryEnvironmental={retryRegionEnvironmental}
                      onOpenRiskSummary={() => setShowRegionRiskSummary(true)}
                    />
                  );
                }

                if (isProvinceSelected && selectedProvinceName) {
                  return (
                    <aside className="regional-detail" aria-live="polite">
                      <p className="card-kicker">Selected {provinceAreaKind}</p>
                      <h2>{selectedProvinceName}</h2>
                      <p>
                        {isAppScreeningMode
                          ? "This outline is a province or district boundary used to group locally saved screening profiles. City and municipality choropleths are not available in this demo."
                          : "This outline is a province or district boundary for orientation only. Aeris AI does not currently display lung cancer case counts per city or municipality."}
                      </p>
                      <dl>
                        <div>
                          <dt>City-level LC counts</dt>
                          <dd>Future feature</dd>
                        </div>
                        <div>
                          <dt>Parent region</dt>
                          <dd>{selectedRegion.label}</dd>
                        </div>
                        {isAppScreeningMode || isCombinedMode ? (
                          <div>
                            <dt>App-screened in this {provinceAreaKind}</dt>
                            <dd>{provinceScreeningCount} unique profile{provinceScreeningCount === 1 ? "" : "s"}</dd>
                          </div>
                        ) : (
                          <div>
                            <dt>Parent LCP cases</dt>
                            <dd>{selectedRegion.coverage}</dd>
                          </div>
                        )}
                        {isCombinedMode && (
                          <div>
                            <dt>Public signal</dt>
                            <dd>{selectedRegion.signalLevel} (regional LCP only)</dd>
                          </div>
                        )}
                        <div>
                          <dt>Public data depth</dt>
                          <dd>Region-level only</dd>
                        </div>
                      </dl>
                      <small>
                        LCP publishes confirmed cases by region of residence, not by city. Limited Metro Manila city rates exist in older Philippine Cancer Society / DOH Rizal registry reports, but no nationwide open city-level lung cancer dataset is wired into this demo.
                      </small>
                    </aside>
                  );
                }

                if (isDrilledView) {
                  return (
                    <aside className="regional-detail" aria-live="polite">
                      <p className="card-kicker">Province drill-down</p>
                      <h2>{selectedRegion.label}</h2>
                      <p>
                        Select a {provinceAreaKind} outline on the map. City and municipality lung cancer counts are a future feature; the public LCP source only provides regional totals.
                      </p>
                      <dl>
                        <div>
                          <dt>City-level LC counts</dt>
                          <dd>Future feature</dd>
                        </div>
                        <div>
                          <dt>Parent risk level</dt>
                          <dd>{isAppScreeningMode ? `${selectedRegion.syntheticRecords} app-screened` : selectedRegion.signalLevel}</dd>
                        </div>
                        <div>
                          <dt>{isAppScreeningMode ? "App profiles in region" : "Parent LCP cases"}</dt>
                          <dd>{isAppScreeningMode ? `${selectedRegion.syntheticRecords} unique profiles` : selectedRegion.coverage}</dd>
                        </div>
                        <div>
                          <dt>Next step</dt>
                          <dd>Click a {provinceAreaKind} outline</dd>
                        </div>
                      </dl>
                      <small>
                        Province and district geometry is for orientation only. Public registry values stay at the parent-region level until a trusted city-level source is added. Region statistics stay on the national view.
                      </small>
                    </aside>
                  );
                }

                return (
                  <aside className="regional-detail" aria-live="polite">
                    <p className="card-kicker">Selected administrative region</p>
                    <h2>{selectedRegion.label}</h2>
                    <p>
                      {isCombinedMode
                        ? "The LCP public signal is shown as the region fill, with unique app-screening profiles shown as a hatched overlay. Values remain separate because the sources have no shared participant identifier."
                        : isAppScreeningMode
                          ? "This view counts only unique saved profiling drafts marked as not previously surveyed whose selected region matches this boundary. Static public data is excluded."
                          : "This boundary shows public lung cancer data from the Lung Center of the Philippines registry (2009–2017). It does not include profiling drafts saved in this web app."}
                    </p>
                    <dl>
                      {isCombinedMode && (
                        <div>
                          <dt>Public signal</dt>
                          <dd>{selectedRegion.signalLevel} (LCP)</dd>
                        </div>
                      )}
                      <div>
                        <dt>{isAppScreeningMode || isCombinedMode ? "Screened individuals" : "Risk level"}</dt>
                        <dd>
                          {isCombinedMode
                            ? `${selectedScreeningRegion?.syntheticRecords ?? 0} unique app-screened`
                            : isAppScreeningMode
                              ? `${selectedRegion.syntheticRecords} app-screened`
                              : (
                                <span className={`region-risk-level-chip signal-${selectedRegion.signalLevel.toLowerCase()}`}>
                                  {selectedRegion.signalLevel}
                                </span>
                              )}
                        </dd>
                      </div>
                      <div>
                        <dt>{isAppScreeningMode ? "Region key" : "Recorded cases"}</dt>
                        <dd>{isAppScreeningMode ? "Selected profile region" : selectedRegion.coverage}</dd>
                      </div>
                      <div>
                        <dt>{isCombinedMode ? "Combination rule" : "Data separation"}</dt>
                        <dd>{isCombinedMode ? "Layered, not summed" : isAppScreeningMode ? "Public data excluded" : "App screenings excluded"}</dd>
                      </div>
                    </dl>
                    <div className="region-detail-actions">
                      {!isAppScreeningMode && (
                        <button
                          className="secondary-button region-statistics-button"
                          type="button"
                          onClick={() => setShowRegionRiskSummary(true)}
                        >
                          Why this {selectedRegion.signalLevel.toLowerCase()} risk level
                        </button>
                      )}
                      <button className="secondary-button region-statistics-button" type="button" onClick={() => setShowRegionStatistics(true)}>
                        Region statistics
                      </button>
                    </div>
                    <small>
                      {isCombinedMode
                        ? "App profiles are deduplicated by normalized field reference. Cross-source totals are never calculated, preventing the public baseline and app layer from being counted twice."
                        : isAppScreeningMode
                          ? "Profiles marked Yes for a previous survey are excluded. Repeated field references are counted once even if letter casing differs."
                          : "Source: LCP Lung Cancer Registry, 2009–2017 (cumulative hospital admissions by region of residence). National estimate: 23,728 new cases/year (GLOBOCAN 2022). Environmental air quality is included in the risk explanation and region statistics when online."}
                    </small>
                  </aside>
                );
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
                  <label className={missingFieldClass("educationLevel")}>Education (PLCOm2012 level)
                    <select name="educationLevel" value={screeningDraft.educationLevel} onChange={(event) => updateDraft("educationLevel", event.target.value)}>
                      <option value="">Select highest level obtained</option>
                      {PLCO_EDUCATION_OPTIONS.map((option) => <option key={option.value} value={String(option.value)}>{option.label}</option>)}
                    </select>
                  </label>
                  <label className={missingFieldClass("heightCm")}>Height (cm)<input name="heightCm" type="number" min="50" max="250" step="0.1" inputMode="decimal" value={screeningDraft.heightCm} onChange={(event) => updateBodyMeasure("heightCm", event.target.value)} placeholder="e.g. 165" /></label>
                  <label className={missingFieldClass("weightKg")}>Weight (kg)<input name="weightKg" type="number" min="20" max="300" step="0.1" inputMode="decimal" value={screeningDraft.weightKg} onChange={(event) => updateBodyMeasure("weightKg", event.target.value)} placeholder="e.g. 70" /></label>
                  <label>BMI (auto)<input name="bmi" value={screeningDraft.bmi ? `${screeningDraft.bmi} kg/m²` : "Enter height and weight"} readOnly /></label>
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
                  <div className="form-section-heading wide-field"><h3>Smoking history (PLCOm2012noRace inputs)</h3></div>
                  {renderScreeningChoice("smokingStatus", "Smoking status", ["Current smoker", "Former smoker", "Never smoker"], updateSmokingStatus)}
                  <label className={missingFieldClass("cigarettesPerDay")}>Average cigarettes per day<input name="cigarettesPerDay" type="number" min="0" step="0.1" inputMode="decimal" value={screeningDraft.cigarettesPerDay} disabled={screeningDraft.smokingStatus === "Never smoker"} onChange={(event) => updateSmokingIntensity("cigarettesPerDay", event.target.value)} placeholder="e.g. 20" /></label>
                  <label className={missingFieldClass("yearsSmoked")}>Years smoked<input name="yearsSmoked" type="number" min="0" step="0.1" inputMode="decimal" value={screeningDraft.yearsSmoked} disabled={screeningDraft.smokingStatus === "Never smoker"} onChange={(event) => updateSmokingIntensity("yearsSmoked", event.target.value)} placeholder="e.g. 30" /></label>
                  <label className={missingFieldClass("yearsSinceQuitting")}>Years since quitting<input name="yearsSinceQuitting" type={screeningDraft.smokingStatus === "Former smoker" ? "number" : "text"} min={screeningDraft.smokingStatus === "Former smoker" ? "0" : undefined} inputMode={screeningDraft.smokingStatus === "Former smoker" ? "numeric" : undefined} value={screeningDraft.yearsSinceQuitting} disabled={screeningDraft.smokingStatus !== "Former smoker"} onChange={(event) => updateDraft("yearsSinceQuitting", event.target.value)} placeholder={screeningDraft.smokingStatus === "Former smoker" ? "Years" : "Not applicable"} /></label>
                  <label>Pack-years (derived)<input name="packYears" value={screeningDraft.packYears || "—"} readOnly /></label>
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
                  <fieldset className="vital-signs-group wide-field">
                    <legend>Vital signs (optional)</legend>
                    <p>Enter available measurements using the units shown. These readings do not affect the prototype risk estimate.</p>
                    <div className="vital-signs-grid">
                      <label>Temperature (°C)<input name="temperatureC" type="number" step="0.1" inputMode="decimal" value={screeningDraft.temperatureC} onChange={(event) => updateDraft("temperatureC", event.target.value)} placeholder="e.g. 36.8" /></label>
                      <label>Respiratory rate (breaths/min)<input name="respiratoryRate" type="number" step="1" inputMode="numeric" value={screeningDraft.respiratoryRate} onChange={(event) => updateDraft("respiratoryRate", event.target.value)} placeholder="e.g. 16" /></label>
                      <label>Systolic blood pressure (mmHg)<input name="systolicBloodPressure" type="number" step="1" inputMode="numeric" value={screeningDraft.systolicBloodPressure} onChange={(event) => updateDraft("systolicBloodPressure", event.target.value)} placeholder="e.g. 120" /></label>
                      <label>Diastolic blood pressure (mmHg)<input name="diastolicBloodPressure" type="number" step="1" inputMode="numeric" value={screeningDraft.diastolicBloodPressure} onChange={(event) => updateDraft("diastolicBloodPressure", event.target.value)} placeholder="e.g. 80" /></label>
                      <label>Pulse rate (bpm)<input name="pulseRate" type="number" step="1" inputMode="numeric" value={screeningDraft.pulseRate} onChange={(event) => updateDraft("pulseRate", event.target.value)} placeholder="e.g. 76" /></label>
                      <label>Oxygen saturation (%)<input name="oxygenSaturation" type="number" step="1" inputMode="numeric" value={screeningDraft.oxygenSaturation} onChange={(event) => updateDraft("oxygenSaturation", event.target.value)} placeholder="e.g. 97" /></label>
                    </div>
                  </fieldset>
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
        <section className="ready-layout temporary-record-layout" aria-labelledby="archived-imaging-title">
          <div className="ready-icon"><CloudOff size={34} /></div>
          <p className="eyebrow">Archived for later</p>
          <h1 id="archived-imaging-title">Local imaging metadata is paused.</h1>
          <p>This workflow is archived while we pursue imaging support as a future feature. Current risk support uses PLCOm2012noRace only. See About for the planned imaging metadata path and Aeris custom risk calculator.</p>
          <div className="ready-actions">
            <button className="secondary-button" type="button" onClick={() => navigateTo("about")}>View future features</button>
            <button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button>
          </div>
        </section>
      )}

      {view === "imaging-metadata" && (
        <section className="ready-layout temporary-record-layout" aria-labelledby="archived-imaging-metadata-title">
          <div className="ready-icon"><CloudOff size={34} /></div>
          <p className="eyebrow">Archived for later</p>
          <h1 id="archived-imaging-metadata-title">Local imaging metadata is archived.</h1>
          <p>CT/chest X-ray metadata capture is not part of the active demo path right now. It remains listed under About → Future features for the next build.</p>
          <div className="ready-actions">
            <button className="secondary-button" type="button" onClick={() => navigateTo("about")}>View future features</button>
            <button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button>
          </div>
        </section>
      )}

      {view === "temporary-record" && (
        <section className="ready-layout temporary-record-layout" aria-labelledby="temporary-record-title">
          <div className="ready-icon"><CloudOff size={34} /></div>
          <p className="eyebrow">Archived for later</p>
          <h1 id="temporary-record-title">Temporary imaging records are archived.</h1>
          <p>Local imaging temporary records are paused for this release. Screening drafts and PLCOm2012noRace risk support remain available. See About → Future features for the planned return of this path.</p>
          <div className="ready-actions">
            <button className="secondary-button" type="button" onClick={() => navigateTo("about")}>View future features</button>
            <button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button>
          </div>
        </section>
      )}

      {view === "risk-estimate" && (
        <section className="risk-layout" aria-labelledby="risk-estimate-title">
          <div className="risk-intro">
            <button className="back-link" type="button" onClick={() => navigateTo("screening")}><ChevronLeft size={17} /> Edit screening profile</button>
            <p className="eyebrow"><BrainCircuit size={16} /> Aeris risk estimate</p>
            <h1 id="risk-estimate-title">PLCOm2012noRace 6-year lung-cancer probability.</h1>
            <p>Credit: Tammemägi <strong>PLCOm2012noRace</strong> (Ver1-13OCT2016-MT). The percentage uses only that published calculator. Local Philippine and East/Southeast Asian context factors appear beside it for clinician judgment and are never mixed into the score.</p>
            <div className="clinical-warning"><AlertTriangle size={19} /><span><strong>Clinician oversight required.</strong> Escalate concerning symptoms through the appropriate clinical pathway regardless of this percentage. A missing or low PLCO score does not clear never-smokers or locally relevant exposures.</span></div>
          </div>
          <div className="risk-workspace">
            <article className="risk-score-card">
              <div className="risk-card-topline"><span>{aerisRiskEstimate.modelId}</span><span>{aerisRiskEstimate.band} band</span></div>
              <div className={`risk-score risk-${aerisRiskEstimate.band === "Elevated" ? "elevated" : aerisRiskEstimate.band === "Intermediate" ? "intermediate" : aerisRiskEstimate.band === "Lower" ? "lower" : "lower"}`}>
                {aerisRiskEstimate.applicable && aerisRiskEstimate.percent !== null ? (
                  <>
                    <strong>{aerisRiskEstimate.percent.toFixed(1)}<small>%</small></strong>
                    <span>{aerisRiskEstimate.bandLabel}</span>
                  </>
                ) : (
                  <>
                    <strong>N/A</strong>
                    <span>{aerisRiskEstimate.unavailableReason}</span>
                  </>
                )}
              </div>
              <p>{aerisRiskEstimate.methodNote}</p>
              <p className="field-note">{aerisRiskEstimate.eligibilityNote}</p>
              <dl className="risk-inputs">
                <div><dt>Model version</dt><dd>{aerisRiskEstimate.modelVersion}</dd></div>
                <div><dt>Smoking status</dt><dd>{screeningDraft.smokingStatus || "Not recorded"}</dd></div>
                <div><dt>Cigarettes / day</dt><dd>{aerisRiskEstimate.inputsSummary.cigarettesPerDay ?? "—"}</dd></div>
                <div><dt>Years smoked</dt><dd>{aerisRiskEstimate.inputsSummary.yearsSmoked ?? "—"}</dd></div>
                <div><dt>BMI</dt><dd>{aerisRiskEstimate.inputsSummary.bmi ?? "—"}</dd></div>
                <div><dt>Education level</dt><dd>{aerisRiskEstimate.inputsSummary.education ?? "—"}</dd></div>
                <div><dt>Clinical flags</dt><dd>{aerisRiskEstimate.clinicalFlags.length} symptom flag{aerisRiskEstimate.clinicalFlags.length === 1 ? "" : "s"}</dd></div>
                <div><dt>Pack-years (derived)</dt><dd>{aerisRiskEstimate.inputsSummary.packYearsDerived ?? "—"}</dd></div>
              </dl>
              <div className="static-demo-actions"><button className="secondary-button" type="button" onClick={() => navigateTo("screening")}>Review screening profile</button><button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace <ArrowRight size={18} /></button></div>
            </article>
            <article className="heatmap-card static-driver-card">
              <div className="risk-card-topline"><span>Model predictors</span><span>PLCOm2012noRace only</span></div>
              <h2>What informed this estimate</h2>
              <p>Each row is a published model predictor contribution to the logistic score. Symptoms stay as clinical flags and do not enter the probability.</p>
              <div className="risk-driver-list">
                {aerisRiskEstimate.contributions.length > 0 ? aerisRiskEstimate.contributions.map((item) => (
                  <span key={item.id}>{item.label}: {item.inputValue} → contribution {item.contribution.toFixed(4)}</span>
                )) : (
                  <span>No PLCOm2012noRace contributions available for this profile.</span>
                )}
              </div>
              {aerisRiskEstimate.clinicalFlags.length > 0 && (
                <div className="clinical-flags-panel">
                  <strong>Clinical flags (not in percentage)</strong>
                  <ul>
                    {aerisRiskEstimate.clinicalFlags.map((flag) => <li key={flag.id} data-severity={flag.severity}>{flag.label}</li>)}
                  </ul>
                </div>
              )}
              <p>Local imaging metadata and image-derived review are archived for a later release — see About → Future features.</p>
            </article>
            <article className="heatmap-card local-considerations-card">
              <div className="risk-card-topline"><span>Local clinical considerations</span><span>Not in PLCO %</span></div>
              <h2>What the healthcare worker should also weigh</h2>
              <p>{aerisRiskEstimate.considerationsNote}</p>
              <div className="local-considerations-list">
                {aerisRiskEstimate.localConsiderations.map((item) => (
                  <div key={item.id} className="local-consideration-item" data-status={item.status} data-priority={item.priority}>
                    <div className="local-consideration-topline">
                      <strong>{item.title}</strong>
                      <span>{item.status === "present" ? "Recorded" : item.status === "absent" ? "Not recorded" : item.status === "unknown" ? "Unknown" : "Context only"}</span>
                    </div>
                    <p>{item.detail}</p>
                    <small>{item.recordedSignal}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      {view === "nodule-review" && (
        <section className="ready-layout temporary-record-layout" aria-labelledby="nodule-review-title">
          <div className="ready-icon"><CloudOff size={34} /></div>
          <p className="eyebrow">Archived for later</p>
          <h1 id="nodule-review-title">Clinician imaging review is archived.</h1>
          <p>The nodule/imaging review gate will return with the local imaging metadata future feature. It is not active in the current demo path.</p>
          <div className="ready-actions">
            <button className="secondary-button" type="button" onClick={() => navigateTo("about")}>View future features</button>
            <button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button>
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
                  Health Care Center
                </button>
                <button
                  type="button"
                  className={workspaceMode === "cancer-registry" ? "active" : ""}
                  aria-pressed={workspaceMode === "cancer-registry"}
                  onClick={() => changeWorkspaceMode("cancer-registry")}
                >
                  Cancer Registry
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

