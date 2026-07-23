# TASK-005 review pack

## Goal

Demonstrate the safety gate that turns an accepted clinician-reviewed workflow record into a minimal local population-data fixture without retaining patient-identifying details.

## User-visible feature

- After **Accept as reviewed workflow data**, the clinician can open **Prepare de-identified population record**.
- The preview names which data is removed: field reference, barangay, clinician notes, facility, study reference, study dates, and local imaging-file metadata.
- It shows only grouped signals that can remain: province-level geography, age band, smoking/exposure categories, symptom signal count, and clinician-reviewed pathway status.
- **Create local population record** stores the minimal fixture in browser local storage and reports the local record count.
- The forced-continuation branch has no aggregation action.

## Demo path

1. Complete screening, AI consent, complete CT metadata, and clinician review.
2. Choose **Accept as reviewed workflow data**.
3. Choose **Prepare de-identified population record** and inspect the removal/retention preview.
4. Choose **Create local population record** and confirm the local-only success state.
5. Repeat the review with **Force continue with caveat** to confirm that no aggregation action is offered.

## Changed files

- `src/App.tsx` — local population-record type, de-identification preview, aggregation action, and accepted-review handoff.
- `src/styles.css` — readable removal/retention preview cards and responsive aggregation layout.
- `src/App.test.tsx` — direct coverage proving raw field and study references are absent from the local population fixture; direct-flow timeouts were made explicit after the stage scan found full-suite timing variability.
- `docs/stage/model-provenance.md` — no-model and local-fixture limitations for TASK-005.
- `docs/stage/reviews/assets/task-005-deidentification-preview.png` — visual evidence.

## Verification

- `npm.cmd test -- --run` passed: 13 tests.
- `npm.cmd run build` passed.
- Visual review passed: the preview is clear, names removed versus retained data, and is explicitly local-only.

## Known limitations

- Browser local storage is demo-only and not a secure clinical population-data store.
- Province-level geography may still need governance review before use with real, low-volume data.
- Public/environmental/hospital sources, 18-region aggregation, external sharing, and any dashboard remain out of scope for this task.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: `fd5b69c` — `feat(task-005): add local deidentification gate`.
- Approval command: `Approve TASK-005 for main`.
