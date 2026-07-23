# TASK-003 review pack

## Goal

Add the separate AI-risk-support consent, imaging-metadata, and temporary-local-record path without uploading or interpreting any medical image.

## User-visible feature

- After the three-step screening draft, the clinician records a separate patient choice for the optional AI risk-support path.
- If the patient declines, the app saves a local screening-only status and explicitly confirms that no imaging or AI-related temporary record was created.
- If the patient agrees, the clinician can record imaging modality, local availability, a non-identifying study reference, date, and optional facility/source.
- Incomplete imaging information is saved as a local temporary record with a clear return-for-more-information instruction.
- A complete CT metadata set is marked ready for a later clinician nodule-review task; it does not trigger AI.
- The study-date calendar opens from its calendar control and lets the clinician choose a month, year, and day before the temporary record is saved.

## TASK-003 revision - Local imaging file drop zone

### User-visible effect

- Imaging Metadata now has a drag-and-drop area plus a **Choose local file** control for CT, CXR, and DICOM files.
- The selected file name, MIME type, and size appear locally and can be removed before the temporary record is saved.
- Only this file metadata is persisted with the local temporary record. The actual file is not uploaded, read, parsed, or interpreted.

### Visual evidence

- [Imaging file drop zone](assets/task-003-imaging-file-dropzone.png)

### Verification

- `npm.cmd test -- --run` passed: 12 tests, including local-file metadata coverage.
- `npm.cmd run build` passed.
- Visual review passed: the drop zone remains readable on the Imaging Metadata screen and does not present itself as an AI analysis control.

### Revision limitations

- The browser selection is intentionally not retained as file bytes. Returning later shows only the metadata saved in the temporary record.
- No model, image preview, CT/CXR parsing, or diagnostic result is connected.

## TASK-003 revision - Multiple imaging files and per-file dates

### User-visible effect

- The drop zone and file chooser accept multiple CT, CXR, or DICOM files in one action and allow more files to be added later.
- Each selected file has a separate optional **Acquisition date** field for when that CT/CXR/DICOM file was taken.
- The clinician-review packet lists local file names and any recorded acquisition dates as metadata only.

### Visual evidence

- [Multiple-file drop zone](assets/task-003-multifile-imaging.png)

### Verification

- `npm.cmd test -- --run` passed: 12 tests, including two selected files and a persisted per-file acquisition date.
- `npm.cmd run build` passed.

### Revision limitations

- No image files, previews, or DICOM tags are stored. Only selected-file metadata and optional acquisition dates remain in the local temporary record.

## Demo path

1. Complete consent, demo login, and the three screening steps.
2. On **AI risk support**, choose **No** to verify the screening-only local path.
3. Repeat and choose **Yes**, then select **No imaging available** and save the temporary local record.
4. Confirm the follow-up message; use **Update imaging details** to return safely.

## Changed files

- `src/App.tsx` — AI consent state, imaging metadata state, local temporary-record persistence, and all user-facing branches.
- `src/styles.css` — clear clinical layouts for AI consent, metadata capture, and temporary-record confirmation.
- `src/App.test.tsx` — screening-only decline coverage and incomplete-imaging temporary-record coverage.
- `src/App.tsx`, `src/styles.css`, and `src/App.test.tsx` — custom study-date calendar with month/year selectors, day grid, and direct interaction coverage.
- `docs/stage/model-provenance.md` — no-model, metadata-only limitation for TASK-003.
- `docs/stage/reviews/assets/task-003-ai-consent.png` and `docs/stage/reviews/assets/task-003-temporary-record.png` — visual review evidence.
- `docs/stage/reviews/assets/task-003-study-calendar.png` — visual evidence of the full calendar picker.

## Verification

- `npm.cmd test` passes: 11 tests.
- `npm.cmd run build` passes.
- Visual review passed: the AI-consent choice is clinician-led and explicitly non-diagnostic; an incomplete imaging encounter reaches the temporary-local-record confirmation screen.
- Calendar visual review passed: the picker opens from the calendar control and keeps the full month, year, and day grid inside the screen.

## Known limitations

- Browser local storage is demo-only and not a secure clinical record store.
- The temporary record contains metadata only; it does not store, upload, view, parse, or interpret a scan.
- No AI model, risk prediction, nodule detection, aggregation, or external transfer is included.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: `264454d` — `feat(task-003): add AI consent temporary record path`.
- Proposed TASK-003 revision: `f818f6e` — `feat(task-003): add study date calendar`.
- Proposed TASK-003 revision: `ef45a61` — `feat(task-003): add local imaging file drop zone`.
- Proposed TASK-003 revision: `a42d3b0` — `feat(task-003): support multiple imaging files`.
- Approval command: `Approve TASK-003 for main`.
