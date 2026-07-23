import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheckBig,
  CloudOff,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  Stethoscope,
  WifiOff,
} from "lucide-react";
import hingaMark from "./assets/hinga-mark.svg";

type View = "consent" | "login" | "ready";

const defaultBhwId = "BHW-024";

export default function App() {
  const [view, setView] = useState<View>("consent");
  const [hasConsent, setHasConsent] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [bhwId, setBhwId] = useState(defaultBhwId);
  const [passcode, setPasscode] = useState("");
  const [offline, setOffline] = useState(true);

  const enterDemo = () => {
    sessionStorage.setItem("idea-demo-clinician", bhwId || defaultBhwId);
    setView("ready");
  };

  const resetEncounter = () => {
    setDeclined(false);
    setHasConsent(false);
  };

  return (
    <main className={`app-shell view-${view}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Hinga home">
          <img className="brand-mark" src={hingaMark} alt="" aria-hidden="true" />
          <span>
            <strong>Hinga</strong>
            <small>Lung screening</small>
          </span>
        </a>
        <div className="topbar-actions">
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

      {view === "consent" && (
        <section className="hero-grid" aria-labelledby="consent-title">
          <div className="intro-panel">
            <p className="eyebrow"><MapPinned size={16} /> Community profiling mission</p>
            <h1>Start every screening with a clear patient choice.</h1>
            <p className="intro-copy">
              Hinga helps field teams gather structured lung-cancer screening information
              and prepare reviewed, de-identified population insights.
            </p>
            <div className="principle-list" aria-label="Data handling principles">
              <p><ShieldCheck size={20} /><span><strong>Clinician-led</strong>All interactions are guided by the medical professional.</span></p>
              <p><LockKeyhole size={20} /><span><strong>Purpose-limited</strong>Only consented screening information continues.</span></p>
              <p><CloudOff size={20} /><span><strong>Works offline</strong>Drafts stay on this device until a future sync is approved.</span></p>
            </div>
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
          <p>Consent is recorded for this encounter. The screening wizard is the next staged feature.</p>
          <div className="ready-actions">
            <button className="primary-button" type="button" disabled title="Available after TASK-002 is approved">Start screening in TASK-002 <ArrowRight size={18} /></button>
            <button className="secondary-button" type="button" onClick={() => { sessionStorage.removeItem("idea-demo-clinician"); setView("consent"); resetEncounter(); }}>End demo session</button>
          </div>
          <p className="stage-note">Stage preview · TASK-001 · Pending your review</p>
        </section>
      )}
    </main>
  );
}
