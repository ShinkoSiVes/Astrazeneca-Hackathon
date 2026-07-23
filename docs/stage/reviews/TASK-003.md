# TASK-003 review pack

## Goal

Add the separate AI-risk-support consent, imaging-metadata, and temporary-local-record path without uploading or interpreting any medical image.

## User-visible feature

- After the three-step screening draft, the clinician records a separate patient choice for the optional AI risk-support path.
- If the patient declines, the app saves a local screening-only status and explicitly confirms that no imaging or AI-related temporary record was created.
- If the patient agrees, the clinician can record imaging modality, local availability, a non-identifying study reference, date, and optional facility/source.
- Incomplete imaging information is saved as a local temporary record with a clear return-for-more-information instruction.
- A complete CT metadata set is marked ready for a later clinician nodule-review task; it does not trigger AI.

## Demo path

1. Complete consent, demo login, and the three screening steps.
2. On **AI risk support**, choose **No** to verify the screening-only local path.
3. Repeat and choose **Yes**, then select **No imaging available** and save the temporary local record.
4. Confirm the follow-up message; use **Update imaging details** to return safely.

## Changed files

- `src/App.tsx` — AI consent state, imaging metadata state, local temporary-record persistence, and all user-facing branches.
- `src/styles.css` — clear clinical layouts for AI consent, metadata capture, and temporary-record confirmation.
- `src/App.test.tsx` — screening-only decline coverage and incomplete-imaging temporary-record coverage.
- `docs/stage/model-provenance.md` — no-model, metadata-only limitation for TASK-003.
- `docs/stage/reviews/assets/task-003-ai-consent.png` and `docs/stage/reviews/assets/task-003-temporary-record.png` — visual review evidence.

## Verification

- `npm.cmd test` passes: 11 tests.
- `npm.cmd run build` passes.
- Visual review passed: the AI-consent choice is clinician-led and explicitly non-diagnostic; an incomplete imaging encounter reaches the temporary-local-record confirmation screen.

## Known limitations

- Browser local storage is demo-only and not a secure clinical record store.
- The temporary record contains metadata only; it does not store, upload, view, parse, or interpret a scan.
- No AI model, risk prediction, nodule detection, aggregation, or external transfer is included.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: `264454d` — `feat(task-003): add AI consent temporary record path`.
- Approval command: `Approve TASK-003 for main`.
