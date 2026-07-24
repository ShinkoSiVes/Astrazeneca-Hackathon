import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
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
  ShieldCheck,
  Stethoscope,
  UsersRound,
  WifiOff,
} from "lucide-react";
import lungMark from "./assets/hinga-mark.svg";
import { EncounterDashboard } from "./components/EncounterDashboard";
import { ScreeningLocationFields } from "./components/ScreeningLocationFields";
import { TobaccoUseAmount } from "./components/TobaccoUseAmount";
import { deleteStoredScreening, storeScreeningSnapshot } from "./local-screenings";
import { PhilippinesRegionMap } from "./components/PhilippinesRegionMap";
import { populationDataKey, readLocalPopulationFixtureCount, syntheticRegions, type SyntheticRegion } from "./population-dashboard";

type View = "consent" | "login" | "ready" | "about" | "heatmap-status" | "screening" | "ai-consent" | "imaging-metadata" | "temporary-record" | "screening-complete" | "nodule-review" | "aggregation";

const defaultBhwId = "BHW-024";

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

type ScreeningDraft = {
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
  oxygenSaturation: string;
  clinicianNotes: string;
};

type ImagingFileMetadata = {
  id: string;
  name: string;
  type: string;
  size: number;
  takenOn: string;
};

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

const emptyScreeningDraft: ScreeningDraft = {
  fieldReference: "", ageRange: "", sexAtBirth: "", barangay: "", municipality: "", province: "", smokingStatus: "", packFrequency: "", packYears: "", householdSmoke: "", occupationalExposure: "", lungHistory: "", familyHistory: "", persistentCough: "", breathlessness: "", bloodInSputum: "", weightLoss: "", oxygenSaturation: "", clinicianNotes: "",
};

const screeningDraftKey = "aeris-screening-draft-v1";
const temporaryRecordKey = "aeris-temporary-ai-record-v1";
const clinicianReviewKey = "aeris-clinician-nodule-review-v1";
const emptyImagingMetadata: ImagingMetadata = { modality: "", studyReference: "", studyDate: "", sourceStatus: "", facility: "", imagingFiles: [] };
const calendarMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const exposureChecklistOptions = ["Dust / mining / construction", "Smoke / biomass fuel", "Chemical exposure", "None reported", "Unknown"];
const lungHistoryChecklistOptions = ["TB history", "COPD / asthma", "Other lung condition", "None reported", "Unknown"];

const viewLabels: Record<View, string> = {
  consent: "Field start", login: "Secure login", ready: "Clinician workspace", about: "About Aeris AI", "heatmap-status": "Population dashboard", screening: "Screening", "ai-consent": "AI consent", "imaging-metadata": "Imaging metadata", "temporary-record": "Temporary record", "screening-complete": "Screening complete", "nodule-review": "Clinician review", aggregation: "Aggregation",
};

const dateValueFor = (year: number, month: number, day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const calendarCellsFor = (year: number, month: number) => Array.from({ length: new Date(year, month + 1, 0).getDate() + new Date(year, month, 1).getDay() }, (_, index) => {
  const day = index - new Date(year, month, 1).getDay() + 1;
  return day > 0 ? day : null;
});

export default function App() {
  const [view, setView] = useState<View>("consent");
  const [hasConsent, setHasConsent] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [bhwId, setBhwId] = useState(defaultBhwId);
  const [passcode, setPasscode] = useState("");
  const [offline, setOffline] = useState(true);
  const [screeningStep, setScreeningStep] = useState(1);
  const [screeningDraft, setScreeningDraft] = useState<ScreeningDraft>(emptyScreeningDraft);
  const [aiConsent, setAiConsent] = useState<boolean | null>(null);
  const [imagingMetadata, setImagingMetadata] = useState<ImagingMetadata>(emptyImagingMetadata);
  const [temporaryRecordReady, setTemporaryRecordReady] = useState(false);
  const [reviewOutcome, setReviewOutcome] = useState<"pending" | "needs-info" | "accepted" | "forced">("pending");
  const [aggregationComplete, setAggregationComplete] = useState(false);
  const [populationRecordCount, setPopulationRecordCount] = useState(0);
  const [selectedRegionId, setSelectedRegionId] = useState(syntheticRegions[0].id);
  const [isStudyCalendarOpen, setIsStudyCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [activeBackdrop, setActiveBackdrop] = useState(0);
  const [isScrollHeaderVisible, setIsScrollHeaderVisible] = useState(true);
  const [isLeavingView, setIsLeavingView] = useState(false);
  const [isSwitchingScreeningStep, setIsSwitchingScreeningStep] = useState(false);
  const navigationTimer = useRef<number | undefined>(undefined);
  const screeningStepTimer = useRef<number | undefined>(undefined);
  const previousScrollY = useRef(0);
  const imagingFileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const rotation = window.setInterval(() => {
      setActiveBackdrop((current) => (current + 1) % landscapeSlides.length);
    }, 7200);

    return () => window.clearInterval(rotation);
  }, []);

  useEffect(() => () => {
    if (navigationTimer.current !== undefined) window.clearTimeout(navigationTimer.current);
    if (screeningStepTimer.current !== undefined) window.clearTimeout(screeningStepTimer.current);
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
    sessionStorage.setItem("idea-demo-clinician", bhwId || defaultBhwId);
    navigateTo("ready");
  };

  const resetEncounter = () => {
    setDeclined(false);
    setHasConsent(false);
  };

  const updateDraft = (field: keyof ScreeningDraft, value: string) => {
    setScreeningDraft((current) => ({ ...current, [field]: value }));
  };

  const selectedChecklistOptions = (value: string) => value ? value.split(" | ") : [];

  const toggleChecklistOption = (field: "occupationalExposure" | "lungHistory", option: string, options: string[]) => {
    setScreeningDraft((current) => {
      const selected = new Set(selectedChecklistOptions(current[field]));
      if (selected.has(option)) selected.delete(option);
      else selected.add(option);
      return { ...current, [field]: options.filter((item) => selected.has(item)).join(" | ") };
    });
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
  };

  const updateImagingFileDate = (fileId: string, takenOn: string) => {
    setImagingMetadata((current) => ({
      ...current,
      imagingFiles: current.imagingFiles.map((file) => file.id === fileId ? { ...file, takenOn } : file),
    }));
  };

  const removeImagingFile = (fileId: string) => {
    setImagingMetadata((current) => ({ ...current, imagingFiles: current.imagingFiles.filter((file) => file.id !== fileId) }));
    if (imagingFileInput.current) imagingFileInput.current.value = "";
  };

  const deleteSavedScreening = (screeningId: string) => {
    deleteStoredScreening(screeningId);
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
    localStorage.setItem(screeningDraftKey, JSON.stringify({ data: screeningDraft, savedAt: new Date().toISOString() }));
    storeScreeningSnapshot(screeningDraft);
    setDraftStatus("Screening draft saved on this device.");
  };

  const restoreScreeningDraft = () => {
    const savedDraft = localStorage.getItem(screeningDraftKey);
    if (!savedDraft) {
      setDraftStatus("No saved screening draft is available on this device.");
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft) as { data?: ScreeningDraft };
      if (parsed.data) {
        setScreeningDraft({ ...emptyScreeningDraft, ...parsed.data });
        setDraftStatus("Saved screening draft restored on this device.");
      }
    } catch {
      setDraftStatus("The saved draft could not be restored.");
    }
  };

  const startScreening = () => {
    setScreeningDraft(emptyScreeningDraft);
    setScreeningStep(1);
    setDraftStatus("");
    navigateTo("screening");
  };

  const finishScreening = () => {
    saveScreeningDraft();
    setAiConsent(null);
    setImagingMetadata(emptyImagingMetadata);
    setTemporaryRecordReady(false);
    navigateTo("ai-consent");
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
    const readyForReview = imagingMetadata.modality === "CT scan" && imagingMetadata.studyReference.trim() !== "" && imagingMetadata.sourceStatus === "Available locally";
    localStorage.setItem(temporaryRecordKey, JSON.stringify({
      savedAt: new Date().toISOString(),
      status: readyForReview ? "ready for clinician nodule review" : "awaiting additional imaging details",
      aiConsent: true,
      imaging: imagingMetadata,
      screening: screeningDraft,
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

  const openAggregation = () => {
    setAggregationComplete(false);
    setPopulationRecordCount(readLocalPopulationFixtureCount());
    navigateTo("aggregation");
  };

  const openPopulationDashboard = () => {
    setPopulationRecordCount(readLocalPopulationFixtureCount());
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
      localStorage.setItem(populationDataKey, JSON.stringify([...existing, populationRecord]));
      setPopulationRecordCount(existing.length + 1);
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
            <p className="helper-text">Explain the purpose in the patient’s preferred language before recording the answer.</p>

            {declined ? (
              <div className="declined-state" role="status">
                <CircleCheckBig size={28} />
                <div>
                  <strong>Encounter ended</strong>
                  <p>No screening record was created.</p>
                </div>
                <button type="button" className="text-button" onClick={resetEncounter}>Start another encounter</button>
              </div>
            ) : (
              <>
                <label className="consent-check">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(event) => setHasConsent(event.target.checked)}
                  />
                  <span>I confirm the patient has agreed to take part in this screening survey.</span>
                </label>
                <div className="button-row">
                  <button className="secondary-button" type="button" onClick={() => setDeclined(true)}>No, end encounter</button>
                  <button className="primary-button" type="button" disabled={!hasConsent} onClick={() => navigateTo("login")}>
                    Continue to secure login <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}
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
            <p>This demo uses real Philippine regional boundary geometry with static synthetic follow-up fixtures. It is not a live patient map, clinical risk estimate, or external public-health feed.</p>
          </div>

          <div className="heatmap-status-card">
            <div className="heatmap-status-topline">
              <span className="status-chip"><span className="status-beacon" aria-hidden="true" /> Static synthetic demo data</span>
              <span>{populationRecordCount} local de-identified fixture{populationRecordCount === 1 ? "" : "s"} not mapped</span>
            </div>
            <div className="dashboard-summary-grid">
              <article><strong>18 regions</strong><span>PSA-aligned regional geometry</span></article>
              <article><strong>Synthetic only</strong><span>No real patient records</span></article>
              <article><strong>Review-gated</strong><span>Local population fixtures only</span></article>
              <article><strong>Sharing disabled</strong><span>No external health-network access</span></article>
            </div>
            <div className="dashboard-workspace">
              <PhilippinesRegionMap regions={syntheticRegions} selectedRegionId={selectedRegionId} onSelect={setSelectedRegionId} />
              {(() => {
                const selectedRegion: SyntheticRegion = syntheticRegions.find((region) => region.id === selectedRegionId) || syntheticRegions[0];
                return <aside className="regional-detail" aria-live="polite"><p className="card-kicker">Selected administrative region</p><h2>{selectedRegion.label}</h2><p>The boundary is a static geographic reference; its signal is a synthetic fixture and does not identify a location with elevated clinical risk.</p><dl><div><dt>Community lung-health attention</dt><dd>{selectedRegion.signalLevel} (synthetic)</dd></div><div><dt>Demo records</dt><dd>{selectedRegion.syntheticRecords} generated</dd></div><div><dt>Fixture coverage</dt><dd>{selectedRegion.coverage} illustrative</dd></div></dl><small>Local aggregation fixtures stay separate until a future, governed regional-mapping task. External sharing remains disabled.</small></aside>;
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
            <p>This clinician-only form keeps its demo draft on this device. Do not enter names or other direct identifiers.</p>
            <div className="screening-steps" aria-label={`Screening step ${screeningStep} of 3`}>
              {["Profile", "Exposure", "Symptoms"].map((label, index) => (
                <div className={screeningStep >= index + 1 ? "active" : ""} key={label}>
                  <span>{index + 1}</span>{label}
                </div>
              ))}
            </div>
          </div>

          <form className={`screening-card ${isSwitchingScreeningStep ? "is-switching" : ""}`} key={screeningStep} onSubmit={(event) => event.preventDefault()}>
            <div className={`screening-step-panel ${isSwitchingScreeningStep ? "is-leaving" : ""}`} key={screeningStep} aria-live="polite">
              {screeningStep === 1 && (
                <>
                <div className="form-heading"><p className="card-kicker">Step 1 of 3</p><h2>Patient profile and place</h2><p>Use a field reference rather than a patient name.</p></div>
                <div className="form-grid">
                  <label>Field reference<input value={screeningDraft.fieldReference} onChange={(event) => updateDraft("fieldReference", event.target.value)} placeholder="e.g. BHW-024-001" /></label>
                  <label>Age range<select value={screeningDraft.ageRange} onChange={(event) => updateDraft("ageRange", event.target.value)}><option value="">Select range</option><option>Under 40</option><option>40-49</option><option>50-59</option><option>60-69</option><option>70 or older</option></select></label>
                  <label>Sex at birth<select value={screeningDraft.sexAtBirth} onChange={(event) => updateDraft("sexAtBirth", event.target.value)}><option value="">Select option</option><option>Female</option><option>Male</option><option>Intersex</option><option>Prefer not to record</option></select></label>
                  <ScreeningLocationFields
                    region={screeningDraft.province}
                    municipality={screeningDraft.municipality}
                    barangay={screeningDraft.barangay}
                    onRegionChange={(region) => setScreeningDraft((current) => ({ ...current, province: region, municipality: "", barangay: "" }))}
                    onMunicipalityChange={(municipality) => setScreeningDraft((current) => ({ ...current, municipality, barangay: "" }))}
                    onBarangayChange={(barangay) => updateDraft("barangay", barangay)}
                  />
                </div>
                </>
              )}

              {screeningStep === 2 && (
                <>
                <div className="form-heading"><p className="card-kicker">Step 2 of 3</p><h2>Exposure and relevant history</h2><p>Record the clinician's screening observations. All fields are optional in this demo.</p></div>
                <div className="form-grid">
                  <label>Smoking status<select value={screeningDraft.smokingStatus} onChange={(event) => updateDraft("smokingStatus", event.target.value)}><option value="">Select option</option><option>Never smoked</option><option>Former smoker</option><option>Current smoker</option><option>Not recorded</option></select></label>
                  <label>Household smoke exposure<select value={screeningDraft.householdSmoke} onChange={(event) => updateDraft("householdSmoke", event.target.value)}><option value="">Select option</option><option>Yes</option><option>No</option><option>Unknown</option></select></label>
                  <TobaccoUseAmount
                    frequency={screeningDraft.packFrequency}
                    packs={screeningDraft.packYears}
                    onFrequencyChange={(frequency) => updateDraft("packFrequency", frequency)}
                    onPacksChange={(packs) => updateDraft("packYears", packs)}
                  />
                  <fieldset className="screening-checklist">
                    <legend>Occupational/environment exposure</legend>
                    <p>Select all factors that apply.</p>
                    <div className="screening-checklist__options">
                      {exposureChecklistOptions.map((option) => <label key={option}><input type="checkbox" checked={selectedChecklistOptions(screeningDraft.occupationalExposure).includes(option)} onChange={() => toggleChecklistOption("occupationalExposure", option, exposureChecklistOptions)} />{option}</label>)}
                    </div>
                  </fieldset>
                  <fieldset className="screening-checklist">
                    <legend>Lung or TB history</legend>
                    <p>Select all factors that apply.</p>
                    <div className="screening-checklist__options">
                      {lungHistoryChecklistOptions.map((option) => <label key={option}><input type="checkbox" checked={selectedChecklistOptions(screeningDraft.lungHistory).includes(option)} onChange={() => toggleChecklistOption("lungHistory", option, lungHistoryChecklistOptions)} />{option}</label>)}
                    </div>
                  </fieldset>
                  <label>Family lung-cancer history<select value={screeningDraft.familyHistory} onChange={(event) => updateDraft("familyHistory", event.target.value)}><option value="">Select option</option><option>Yes</option><option>No</option><option>Unknown</option></select></label>
                </div>
                </>
              )}

              {screeningStep === 3 && (
                <>
                <div className="form-heading"><p className="card-kicker">Step 3 of 3</p><h2>Symptoms and clinician note</h2><p>This is not a diagnosis. Record only information relevant to the screening encounter.</p></div>
                <div className="form-grid">
                  <label>Persistent cough<select value={screeningDraft.persistentCough} onChange={(event) => updateDraft("persistentCough", event.target.value)}><option value="">Select option</option><option>Yes</option><option>No</option><option>Unknown</option></select></label>
                  <label>Breathlessness<select value={screeningDraft.breathlessness} onChange={(event) => updateDraft("breathlessness", event.target.value)}><option value="">Select option</option><option>Yes</option><option>No</option><option>Unknown</option></select></label>
                  <label>Blood in sputum<select value={screeningDraft.bloodInSputum} onChange={(event) => updateDraft("bloodInSputum", event.target.value)}><option value="">Select option</option><option>Yes</option><option>No</option><option>Unknown</option></select></label>
                  <label>Unintentional weight loss<select value={screeningDraft.weightLoss} onChange={(event) => updateDraft("weightLoss", event.target.value)}><option value="">Select option</option><option>Yes</option><option>No</option><option>Unknown</option></select></label>
                  <label>Oxygen saturation (if available)<input value={screeningDraft.oxygenSaturation} onChange={(event) => updateDraft("oxygenSaturation", event.target.value)} inputMode="decimal" placeholder="Optional %" /></label>
                  <label className="wide-field">Clinician note<textarea value={screeningDraft.clinicianNotes} onChange={(event) => updateDraft("clinicianNotes", event.target.value)} placeholder="Optional screening note; do not include direct identifiers." rows={4} /></label>
                </div>
                </>
              )}
            </div>

            <div className="draft-actions">
              <div className="draft-status" aria-live="polite">{draftStatus || "Draft has not been saved yet."}</div>
              <div className="draft-buttons">
                <button className="text-button" type="button" onClick={restoreScreeningDraft}>Restore local draft</button>
                <button className="secondary-button" type="button" onClick={saveScreeningDraft}>Save local draft</button>
                {screeningStep > 1 && <button className="secondary-button" type="button" disabled={isSwitchingScreeningStep} onClick={() => changeScreeningStep(screeningStep - 1)}>Previous</button>}
                {screeningStep < 3 ? (
                  <button className="primary-button" type="button" disabled={isSwitchingScreeningStep} onClick={() => changeScreeningStep(screeningStep + 1)}>Continue <ArrowRight size={18} /></button>
                ) : (
                  <button className="primary-button" type="button" onClick={finishScreening}>Finish screening draft <Check size={18} /></button>
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
            <p>Explain that this optional demo path does not diagnose cancer. A medical professional supplies any imaging details and decides whether a future output is useful.</p>
          </div>
          <div className="ai-path-card">
            <p className="card-kicker">Separate consent</p>
            <h2>Record the patient’s choice before collecting imaging details.</h2>
            <p className="helper-text">A local CT/CXR/DICOM file can be selected for reference, but this demo does not upload, read, or analyse it. The next screen records local metadata for a possible future clinician review.</p>
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
            <h1 id="imaging-metadata-title">Prepare a temporary local record.</h1>
            <p>Record only what is available during the visit. Missing details create an offline temporary record so the clinician can return later with more information.</p>
          </div>
          <form className="ai-path-card imaging-form" onSubmit={(event) => event.preventDefault()}>
            <p className="card-kicker">Imaging check</p>
            <h2>Is an imaging study available for the future review?</h2>
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
                      <p><strong>Drop CT, CXR, or DICOM files here</strong><small>Select multiple files at once. They stay on this device and are not uploaded, read, or interpreted.</small></p>
                      <button className="secondary-button" type="button" onClick={() => imagingFileInput.current?.click()}>Choose local files</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="field-note"><CloudOff size={16} /> This demo stores file metadata locally only. It does not upload, read, or interpret a scan.</p>
            <div className="draft-buttons"><button className="primary-button" type="button" onClick={saveTemporaryRecord}>Save temporary local record <Check size={18} /></button></div>
          </form>
        </section>
      )}

      {view === "temporary-record" && (
        <section className="ready-layout temporary-record-layout" aria-labelledby="temporary-record-title">
          <div className="ready-icon"><ShieldCheck size={34} /></div>
          <p className="eyebrow">Temporary local record</p>
          <h1 id="temporary-record-title">{temporaryRecordReady ? "Imaging details are ready for clinician review." : "More imaging details are needed before clinician review."}</h1>
          <p>{temporaryRecordReady ? "The consented screening draft and imaging metadata are stored only on this device. No AI result has been generated." : "This local draft is marked for follow-up. Return with an available CT study and non-identifying reference before the next review step."}</p>
          <div className="ready-actions">
            <button className="secondary-button" type="button" onClick={() => navigateTo("imaging-metadata")}>Update imaging details</button>
            {temporaryRecordReady ? <button className="primary-button" type="button" onClick={openNoduleReview}>Open clinician review <ArrowRight size={18} /></button> : <button className="primary-button" type="button" onClick={() => navigateTo("ready")}>Return to workspace</button>}
          </div>
          <p className="stage-note">AI is not run in TASK-003. Clinician review remains a later, separate step.</p>
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
            <label>
              Barangay health worker ID
              <input value={bhwId} onChange={(event) => setBhwId(event.target.value)} autoComplete="username" />
            </label>
            <label>
              Demo passcode
              <input value={passcode} onChange={(event) => setPasscode(event.target.value)} type="password" placeholder="Enter any passcode" autoComplete="current-password" />
            </label>
            <p className="field-note"><LockKeyhole size={15} /> This is a hackathon demo. Authentication will be replaced before clinical use.</p>
            <button className="primary-button full-width" type="submit" disabled={!bhwId || !passcode}>
              Enter screening workspace <ArrowRight size={18} />
            </button>
            <button className="text-button" type="button" onClick={() => navigateTo("consent")}>Back to consent</button>
          </form>
        </section>
      )}

      {view === "ready" && (
        <EncounterDashboard
          clinicianId={bhwId || defaultBhwId}
          onStartScreening={startScreening}
          onEditScreening={(draft) => { setScreeningDraft({ ...emptyScreeningDraft, ...draft }); setScreeningStep(1); setDraftStatus("Local screening loaded for clinician review."); navigateTo("screening"); }}
          onDeleteScreening={deleteSavedScreening}
          onViewTemporaryRecord={() => navigateTo("temporary-record")}
          onEndSession={() => { sessionStorage.removeItem("idea-demo-clinician"); navigateTo("consent"); resetEncounter(); }}
        />
      )}

      {false && view === "ready" && (
        <section className="ready-layout" aria-labelledby="ready-title">
          <div className="ready-icon"><CircleCheckBig size={34} /></div>
          <p className="eyebrow">Workspace ready</p>
          <h1 id="ready-title">You’re signed in as {bhwId || defaultBhwId}.</h1>
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
