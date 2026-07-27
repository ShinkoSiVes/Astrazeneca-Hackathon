import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ArchiveRestore, ArrowRight, Download, FilePenLine, LogOut, Plus, Trash2, Upload } from "lucide-react";
import {
  normaliseScreeningDraft,
  readStoredScreenings,
  readTemporaryRecordSummary,
  temporaryRecordKey,
  type LocalScreeningDraft,
  type StoredScreening,
  type TemporaryRecordSummary,
} from "../local-screenings";
import "./EncounterDashboard.css";

type EncounterDashboardProps = {
  clinicianId: string;
  onStartScreening: () => void;
  onEditScreening: (draft: LocalScreeningDraft) => void;
  onDeleteScreening: (screeningId: string) => void;
  onViewTemporaryRecord: () => void;
  onDeleteTemporaryRecord: () => void;
  onEndSession: () => void;
};

const timeLabel = (value: string) => new Intl.DateTimeFormat("en-PH", {
  day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
}).format(new Date(value));

const hasAnyScreeningField = (draft: LocalScreeningDraft) => Object.values(draft).some((value) => value.trim() !== "");

export function EncounterDashboard({ clinicianId, onStartScreening, onEditScreening, onDeleteScreening, onViewTemporaryRecord, onDeleteTemporaryRecord, onEndSession }: EncounterDashboardProps) {
  const [screenings, setScreenings] = useState<StoredScreening[]>([]);
  const [temporaryRecord, setTemporaryRecord] = useState<TemporaryRecordSummary | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [isConfirmingTemporaryDeletion, setIsConfirmingTemporaryDeletion] = useState(false);
  const [temporaryDeletionMessage, setTemporaryDeletionMessage] = useState("");
  const [screeningPendingDeletion, setScreeningPendingDeletion] = useState<StoredScreening | null>(null);
  const [screeningDeletionMessage, setScreeningDeletionMessage] = useState("");
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
        const parsed = JSON.parse(String(reader.result)) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid local record");
        const record = parsed as { data?: unknown; screening?: unknown };
        const importedData = record.screening ?? record.data ?? record;
        if (!importedData || typeof importedData !== "object" || Array.isArray(importedData)) throw new Error("Invalid screening data");
        const draft = normaliseScreeningDraft(importedData as Partial<LocalScreeningDraft>);
        if (!hasAnyScreeningField(draft)) throw new Error("No screening fields");
        setImportMessage(record.screening ? "Temporary record loaded. Review the screening profile and save it before continuing." : "Local screening update loaded. Review and save it before continuing.");
        onEditScreening(draft);
      } catch {
        setImportMessage("That file could not be read as a local screening or temporary record.");
      }
    };
    reader.onerror = () => setImportMessage("The local update could not be read on this device.");
    reader.readAsText(updateFile);
  };

  const deleteTemporaryRecord = () => {
    onDeleteTemporaryRecord();
    setTemporaryRecord(null);
    setIsConfirmingTemporaryDeletion(false);
    setTemporaryDeletionMessage("Local temporary data was deleted from this device.");
  };

  const extractTemporaryRecord = () => {
    const savedRecord = localStorage.getItem(temporaryRecordKey);
    if (!savedRecord) return;

    try {
      const parsed = JSON.parse(savedRecord) as { imaging?: { imagingFiles?: Array<Record<string, unknown>> } } & Record<string, unknown>;
      const imaging = parsed.imaging && typeof parsed.imaging === "object"
        ? {
          ...parsed.imaging,
          imagingFiles: Array.isArray(parsed.imaging.imagingFiles) ? parsed.imaging.imagingFiles.map(({ previewUrl: _previewUrl, ...file }) => file) : [],
        }
        : parsed.imaging;
      const exportRecord = { ...parsed, imaging };
      const blob = new Blob([JSON.stringify(exportRecord, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url;
      download.download = `aeris-temporary-record-${new Date().toISOString().slice(0, 10)}.json`;
      download.click();
      URL.revokeObjectURL(url);
      setTemporaryDeletionMessage("Temporary record extracted as a local JSON file. Image preview and file bytes were not included.");
    } catch {
      setTemporaryDeletionMessage("The temporary record could not be extracted on this device.");
    }
  };

  const deleteScreening = () => {
    if (!screeningPendingDeletion) return;
    onDeleteScreening(screeningPendingDeletion.id);
    setScreenings((current) => current.filter((screening) => screening.id !== screeningPendingDeletion.id));
    setScreeningDeletionMessage(`Local screening ${screeningPendingDeletion.data.fieldReference || screeningPendingDeletion.id} was deleted from this device.`);
    setScreeningPendingDeletion(null);
  };

  return (
    <section className="encounter-dashboard" aria-labelledby="encounter-dashboard-title">
      <div className="encounter-dashboard__intro">
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
          <button className="text-button temporary-extract-button" type="button" disabled={!temporaryRecord} onClick={extractTemporaryRecord}><Download size={16} /> Extract local temporary data</button>
          {isConfirmingTemporaryDeletion ? (
            <div className="temporary-delete-confirmation" role="group" aria-label="Confirm temporary data deletion">
              <span>Delete this temporary record from this device?</span>
              <div>
                <button className="danger-button" type="button" onClick={deleteTemporaryRecord}>Confirm delete</button>
                <button className="text-button" type="button" onClick={() => setIsConfirmingTemporaryDeletion(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="text-button temporary-delete-button" type="button" disabled={!temporaryRecord} onClick={() => { setIsConfirmingTemporaryDeletion(true); setTemporaryDeletionMessage(""); }}><Trash2 size={16} /> Delete local temporary data</button>
          )}
          {temporaryDeletionMessage && <p className="temporary-deletion-message" role="status">{temporaryDeletionMessage}</p>}
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
            <h2 id="saved-screenings-title">Screening records</h2>
          </div>
          <div className="encounter-history__tools">
            <input ref={importInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Import local screening or temporary record" onChange={importLocalUpdate} />
            <button className="text-button" type="button" onClick={() => importInput.current?.click()}><Upload size={16} /> Import local record</button>
            <button className="text-button" type="button" onClick={refresh}>Refresh</button>
          </div>
        </div>
        <p className="field-note">Import accepts one local JSON screening update or one temporary record from a screening record. The embedded screening profile opens for review; file bytes are not uploaded or retained.</p>
        {importMessage && <p className="encounter-import-message" role="status">{importMessage}</p>}
        {screeningDeletionMessage && <p className="encounter-import-message" role="status">{screeningDeletionMessage}</p>}

        {screenings.length ? (
          <div className="screening-history-list">
            {screenings.map((screening) => (
              <article className="screening-history-item" key={`${screening.id}-${screening.savedAt}`}>
                <div className="screening-history-item__summary">
                  <p className="screening-history-item__label">Field reference</p>
                  <h3>{screening.data.fieldReference || "Unlabelled local draft"}</h3>
                  <p>Last saved {timeLabel(screening.savedAt)} · {screening.data.barangay || "Location not recorded"}{screening.data.province ? `, ${screening.data.province}` : ""}</p>
                </div>
                <div className="screening-history-item__actions">
                  <button className="secondary-button" type="button" onClick={() => onEditScreening(screening.data)}><FilePenLine size={17} /> Update screening</button>
                  <button className="text-button danger-text-button" type="button" onClick={() => { setScreeningPendingDeletion(screening); setScreeningDeletionMessage(""); }}><Trash2 size={16} /> Delete local copy</button>
                </div>
                <div className="screening-history-item__updates">
                  <p className="screening-history-item__label">Saved updates · {screening.updates.length}</p>
                  <ol>
                    {screening.updates.map((update, index) => (
                      <li key={update.id}><strong>Update {screening.updates.length - index}</strong><span>{timeLabel(update.savedAt)}</span><span>{update.data.barangay || "Location not recorded"}{update.data.province ? `, ${update.data.province}` : ""}</span></li>
                    ))}
                  </ol>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="encounter-empty-state">
            <FilePenLine size={22} aria-hidden="true" />
            <p>No saved screenings on this device yet. Start a screening, then use Save local draft to make it available here.</p>
          </div>
        )}
        {screeningPendingDeletion && (
          <div className="screening-delete-confirmation" role="dialog" aria-modal="true" aria-labelledby="delete-screening-title">
            <div className="screening-delete-confirmation__content">
              <p className="eyebrow">Delete local copy</p>
              <h3 id="delete-screening-title">Delete this screening record?</h3>
              <p>This removes only the selected local screening from this device. It does not affect temporary imaging data.</p>
              <div className="screening-delete-confirmation__actions">
                <button className="danger-button" type="button" onClick={deleteScreening}>Delete screening</button>
                <button className="secondary-button" type="button" onClick={() => setScreeningPendingDeletion(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </section>
      <p className="stage-note">Stage preview · TASK-007 · Local browser storage only</p>
    </section>
  );
}
