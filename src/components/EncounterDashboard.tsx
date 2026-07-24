import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArchiveRestore, ArrowRight, FilePenLine, FolderClock, LogOut, Plus, Upload } from "lucide-react";
import {
  normaliseScreeningDraft,
  readStoredScreenings,
  readTemporaryRecordSummary,
  type LocalScreeningDraft,
  type StoredScreening,
  type TemporaryRecordSummary,
} from "../local-screenings";
import "./EncounterDashboard.css";

type EncounterDashboardProps = {
  clinicianId: string;
  onStartScreening: () => void;
  onEditScreening: (draft: LocalScreeningDraft) => void;
  onViewTemporaryRecord: () => void;
  onEndSession: () => void;
};

const timeLabel = (value: string) => new Intl.DateTimeFormat("en-PH", {
  day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
}).format(new Date(value));

const hasAnyScreeningField = (draft: LocalScreeningDraft) => Object.values(draft).some((value) => value.trim() !== "");

export function EncounterDashboard({ clinicianId, onStartScreening, onEditScreening, onViewTemporaryRecord, onEndSession }: EncounterDashboardProps) {
  const [screenings, setScreenings] = useState<StoredScreening[]>([]);
  const [temporaryRecord, setTemporaryRecord] = useState<TemporaryRecordSummary | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const importInput = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setScreenings(readStoredScreenings());
    setTemporaryRecord(readTemporaryRecordSummary());
  };

  useEffect(() => {
    refresh();
  }, []);

  const importLocalUpdate = (event: ChangeEvent<HTMLInputElement>) => {
    const updateFile = event.target.files?.[0];
    event.target.value = "";
    if (!updateFile) return;
    if (!updateFile.name.toLowerCase().endsWith(".json") && updateFile.type !== "application/json") {
      setImportMessage("Choose a local JSON screening update to review.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { data?: Partial<LocalScreeningDraft> } | Partial<LocalScreeningDraft>;
        const importedData = "data" in parsed && parsed.data ? parsed.data : parsed as Partial<LocalScreeningDraft>;
        const draft = normaliseScreeningDraft(importedData);
        if (!hasAnyScreeningField(draft)) throw new Error("No screening fields");
        setImportMessage("Local update loaded. Review and save it before continuing.");
        onEditScreening(draft);
      } catch {
        setImportMessage("That file could not be read as a local screening update.");
      }
    };
    reader.onerror = () => setImportMessage("The local update could not be read on this device.");
    reader.readAsText(updateFile);
  };

  return (
    <section className="encounter-dashboard" aria-labelledby="encounter-dashboard-title">
      <div className="encounter-dashboard__intro">
        <div className="ready-icon"><FolderClock size={34} /></div>
        <p className="eyebrow">Clinician workspace</p>
        <h1 id="encounter-dashboard-title">You’re signed in as {clinicianId}.</h1>
        <p>Consent is recorded for this encounter. Choose a local screening record or begin a new clinician-led entry.</p>
      </div>

      <div className="encounter-dashboard__actions" aria-label="Screening actions">
        <article className="encounter-action-card encounter-action-card--primary">
          <Plus size={22} aria-hidden="true" />
          <h2>Start screening</h2>
          <p>Create a new local screening draft for the current visit.</p>
          <button className="primary-button" type="button" onClick={onStartScreening}>New screening <ArrowRight size={18} /></button>
        </article>
        <article className="encounter-action-card">
          <ArchiveRestore size={22} aria-hidden="true" />
          <h2>View temporary data</h2>
          <p>{temporaryRecord ? `Saved ${timeLabel(temporaryRecord.savedAt)} · ${temporaryRecord.status}` : "No temporary imaging record is stored on this device."}</p>
          <button className="secondary-button" type="button" disabled={!temporaryRecord} onClick={onViewTemporaryRecord}>Open temporary record <ArrowRight size={18} /></button>
        </article>
        <article className="encounter-action-card">
          <LogOut size={22} aria-hidden="true" />
          <h2>End screening</h2>
          <p>End the demo session. Browser-local drafts remain available for the next sign-in.</p>
          <button className="secondary-button" type="button" onClick={onEndSession}>End session</button>
        </article>
      </div>

      <section className="encounter-history" aria-labelledby="saved-screenings-title">
        <div className="encounter-history__header">
          <div>
            <p className="eyebrow">Local device records</p>
            <h2 id="saved-screenings-title">Previous screenings</h2>
          </div>
          <div className="encounter-history__tools">
            <input ref={importInput} className="visually-hidden" type="file" accept="application/json,.json" onChange={importLocalUpdate} />
            <button className="text-button" type="button" onClick={() => importInput.current?.click()}><Upload size={16} /> Import local update</button>
            <button className="text-button" type="button" onClick={refresh}>Refresh</button>
          </div>
        </div>
        <p className="field-note">Import accepts a local JSON screening update for review only. File bytes are not uploaded or retained. Keep patient identifiers out of demo files.</p>
        {importMessage && <p className="encounter-import-message" role="status">{importMessage}</p>}

        {screenings.length ? (
          <div className="screening-history-list">
            {screenings.map((screening) => (
              <article className="screening-history-item" key={`${screening.id}-${screening.savedAt}`}>
                <div>
                  <p className="screening-history-item__label">Field reference</p>
                  <h3>{screening.data.fieldReference || "Unlabelled local draft"}</h3>
                  <p>Last saved {timeLabel(screening.savedAt)} · {screening.data.barangay || "Location not recorded"}{screening.data.province ? `, ${screening.data.province}` : ""}</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => onEditScreening(screening.data)}><FilePenLine size={17} /> Edit screening</button>
              </article>
            ))}
          </div>
        ) : (
          <div className="encounter-empty-state">
            <FilePenLine size={22} aria-hidden="true" />
            <p>No saved screenings on this device yet. Start a screening, then use Save local draft to make it available here.</p>
          </div>
        )}
      </section>
      <p className="stage-note">Stage preview · TASK-007 · Local browser storage only</p>
    </section>
  );
}
