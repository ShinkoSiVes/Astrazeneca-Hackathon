import { useEffect, useState } from "react";
import {
  ArrowRight,
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

type View = "consent" | "login" | "ready" | "about" | "heatmap-status" | "screening";

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

const emptyScreeningDraft: ScreeningDraft = {
  fieldReference: "", ageRange: "", sexAtBirth: "", barangay: "", province: "", smokingStatus: "", packFrequency: "", packYears: "", householdSmoke: "", occupationalExposure: "", lungHistory: "", familyHistory: "", persistentCough: "", breathlessness: "", bloodInSputum: "", weightLoss: "", oxygenSaturation: "", clinicianNotes: "",
};

const screeningDraftKey = "aeris-screening-draft-v1";

export default function App() {
  const [view, setView] = useState<View>("consent");
  const [hasConsent, setHasConsent] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [bhwId, setBhwId] = useState(defaultBhwId);
  const [passcode, setPasscode] = useState("");
  const [offline, setOffline] = useState(true);
  const [screeningStep, setScreeningStep] = useState(1);
  const [screeningDraft, setScreeningDraft] = useState<ScreeningDraft>(emptyScreeningDraft);
  const [activeBackdrop, setActiveBackdrop] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReducedMotion) return undefined;

    const rotation = window.setInterval(() => {
      setActiveBackdrop((current) => (current + 1) % landscapeSlides.length);
    }, 7200);

    return () => window.clearInterval(rotation);
  }, []);
  const [draftStatus, setDraftStatus] = useState("");

  const enterDemo = () => {
    sessionStorage.setItem("idea-demo-clinician", bhwId || defaultBhwId);
    setView("ready");
  };

  const resetEncounter = () => {
    setDeclined(false);
    setHasConsent(false);
  };

  const updateDraft = (field: keyof ScreeningDraft, value: string) => {
    setScreeningDraft((current) => ({ ...current, [field]: value }));
  };

  const saveScreeningDraft = () => {
    localStorage.setItem(screeningDraftKey, JSON.stringify({ data: screeningDraft, savedAt: new Date().toISOString() }));
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
    setScreeningStep(1);
    setDraftStatus("");
    setView("screening");
  };

  return (
    <main className={`app-shell view-${view}`}>
      <div className="landscape-rotator" aria-hidden="true">
        {landscapeSlides.map((slide, index) => (
          <span className={`landscape-slide ${slide} ${index === activeBackdrop ? "is-active" : ""}`} key={slide} />
        ))}
      </div>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Aeris AI home" onClick={() => setView("consent")}>
          <img className="brand-mark" src={lungMark} alt="" aria-hidden="true" />
          <span>
            <strong>Aeris AI</strong>
            <small>Lung screening</small>
          </span>
        </a>
        <div className="topbar-actions">
          {view === "consent" && (
            <button className="nav-link" type="button" onClick={() => setView("about")}>
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

      <div className="view-transition" key={view}>
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
            <button className="heatmap-status-link" type="button" onClick={() => setView("heatmap-status")}>
              <span className="status-beacon" aria-hidden="true" />
              <span><strong>Heatmap status</strong><small>View current demo readiness</small></span>
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
                  <button className="primary-button" type="button" disabled={!hasConsent} onClick={() => setView("login")}>
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
              <details className="faq-item" open>
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
            <button className="back-link" type="button" onClick={() => setView("consent")}>
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
            <button className="back-link" type="button" onClick={() => setView("consent")}>
              <ChevronLeft size={17} /> Back to screening
            </button>
            <p className="eyebrow"><MapPinned size={16} /> Population dashboard</p>
            <h1 id="heatmap-status-title">Heatmap status: preparing the regional view.</h1>
            <p>This preview reports the dashboard's current demo readiness. It does not show live patient records, clinical risk estimates, or a live public-health map.</p>
          </div>

          <div className="heatmap-status-card">
            <div className="heatmap-status-topline">
              <span className="status-chip"><span className="status-beacon" aria-hidden="true" /> Demo preparation</span>
              <span>Next planned feature: TASK-006</span>
            </div>
            <div className="heatmap-status-grid">
              <article><strong>18 regions</strong><span>Planned Philippine coverage</span></article>
              <article><strong>Synthetic only</strong><span>No real patient records in this demo</span></article>
              <article><strong>Aggregation gated</strong><span>Requires reviewed, de-identified inputs</span></article>
              <article><strong>Live sharing disabled</strong><span>External publishing is not enabled</span></article>
            </div>
            <div className="heatmap-placeholder" role="img" aria-label="Placeholder grid for the future regional heatmap">
              <span>Regional heatmap preview</span>
              <div className="heatmap-cells" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <small>Available after the population dashboard task is approved.</small>
            </div>
          </div>
        </section>
      )}

      {view === "screening" && (
        <section className="screening-layout" aria-labelledby="screening-title">
          <div className="screening-intro">
            <button className="back-link" type="button" onClick={() => setView("ready")}>
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

          <form className="screening-card" onSubmit={(event) => event.preventDefault()}>
            {screeningStep === 1 && (
              <>
                <div className="form-heading"><p className="card-kicker">Step 1 of 3</p><h2>Patient profile and place</h2><p>Use a field reference rather than a patient name.</p></div>
                <div className="form-grid">
                  <label>Field reference<input value={screeningDraft.fieldReference} onChange={(event) => updateDraft("fieldReference", event.target.value)} placeholder="e.g. BHW-024-001" /></label>
                  <label>Age range<select value={screeningDraft.ageRange} onChange={(event) => updateDraft("ageRange", event.target.value)}><option value="">Select range</option><option>Under 40</option><option>40-49</option><option>50-59</option><option>60-69</option><option>70 or older</option></select></label>
                  <label>Sex at birth<select value={screeningDraft.sexAtBirth} onChange={(event) => updateDraft("sexAtBirth", event.target.value)}><option value="">Select option</option><option>Female</option><option>Male</option><option>Intersex</option><option>Prefer not to record</option></select></label>
                  <label>Barangay / municipality<input value={screeningDraft.barangay} onChange={(event) => updateDraft("barangay", event.target.value)} placeholder="Local area" /></label>
                  <label className="wide-field">Province / region<input value={screeningDraft.province} onChange={(event) => updateDraft("province", event.target.value)} placeholder="Province or region" /></label>
                </div>
              </>
            )}

            {screeningStep === 2 && (
              <>
                <div className="form-heading"><p className="card-kicker">Step 2 of 3</p><h2>Exposure and relevant history</h2><p>Record the clinician's screening observations. All fields are optional in this demo.</p></div>
                <div className="form-grid">
                  <label>Smoking status<select value={screeningDraft.smokingStatus} onChange={(event) => updateDraft("smokingStatus", event.target.value)}><option value="">Select option</option><option>Never smoked</option><option>Former smoker</option><option>Current smoker</option><option>Not recorded</option></select></label>
                  <label>Tobacco-use frequency<select value={screeningDraft.packFrequency} onChange={(event) => updateDraft("packFrequency", event.target.value)}><option value="">Select period first</option><option>Per day</option><option>Per week</option><option>Per month</option><option>Per year</option></select></label>
                  <label>Estimated packs<input value={screeningDraft.packYears} onChange={(event) => updateDraft("packYears", event.target.value)} inputMode="decimal" placeholder="e.g. 1.5" /></label>
                  <label>Household smoke exposure<select value={screeningDraft.householdSmoke} onChange={(event) => updateDraft("householdSmoke", event.target.value)}><option value="">Select option</option><option>Yes</option><option>No</option><option>Unknown</option></select></label>
                  <label>Occupational/environment exposure<select value={screeningDraft.occupationalExposure} onChange={(event) => updateDraft("occupationalExposure", event.target.value)}><option value="">Select option</option><option>Dust / mining / construction</option><option>Smoke / biomass fuel</option><option>Chemical exposure</option><option>None reported</option><option>Unknown</option></select></label>
                  <label>Lung or TB history<select value={screeningDraft.lungHistory} onChange={(event) => updateDraft("lungHistory", event.target.value)}><option value="">Select option</option><option>TB history</option><option>COPD / asthma</option><option>Other lung condition</option><option>None reported</option><option>Unknown</option></select></label>
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

            <div className="draft-actions">
              <div className="draft-status" aria-live="polite">{draftStatus || "Draft has not been saved yet."}</div>
              <div className="draft-buttons">
                <button className="text-button" type="button" onClick={restoreScreeningDraft}>Restore local draft</button>
                <button className="secondary-button" type="button" onClick={saveScreeningDraft}>Save local draft</button>
                {screeningStep > 1 && <button className="secondary-button" type="button" onClick={() => setScreeningStep((current) => current - 1)}>Previous</button>}
                {screeningStep < 3 ? (
                  <button className="primary-button" type="button" onClick={() => setScreeningStep((current) => current + 1)}>Continue <ArrowRight size={18} /></button>
                ) : (
                  <button className="primary-button" type="button" onClick={() => { saveScreeningDraft(); setView("ready"); }}>Finish screening draft <Check size={18} /></button>
                )}
              </div>
            </div>
          </form>
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
            <button className="text-button" type="button" onClick={() => setView("consent")}>Back to consent</button>
          </form>
        </section>
      )}

      {view === "ready" && (
        <section className="ready-layout" aria-labelledby="ready-title">
          <div className="ready-icon"><CircleCheckBig size={34} /></div>
          <p className="eyebrow">Workspace ready</p>
          <h1 id="ready-title">You’re signed in as {bhwId || defaultBhwId}.</h1>
          <p>Consent is recorded for this encounter. Continue with the clinician-led screening draft.</p>
          <div className="ready-actions">
            <button className="primary-button" type="button" onClick={startScreening}>Start screening <ArrowRight size={18} /></button>
            <button className="secondary-button" type="button" onClick={() => { sessionStorage.removeItem("idea-demo-clinician"); setView("consent"); resetEncounter(); }}>End demo session</button>
          </div>
          <p className="stage-note">Stage preview · TASK-002 · Screening drafts stay local</p>
        </section>
      )}
      </div>
    </main>
  );
}
