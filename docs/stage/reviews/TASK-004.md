# TASK-004 review pack

## Goal

Provide a clinician-only nodule-review workflow checkpoint with safe, explicit decision branches while no imaging model is connected.

## User-visible feature

- A complete local CT metadata record can open the clinician review screen.
- The packet displays modality, availability, study reference, and date as local metadata.
- It clearly states that it is a static workflow fixture and not a nodule finding, malignancy estimate, or diagnosis.
- The clinician can accept the workflow record, request more information, or force continuation with a visible caveat.
- Every outcome is saved locally only; nothing is aggregated, sent externally, or treated as AI output.

## Demo path

1. Complete screening, agree to AI risk support, and enter a CT modality, local availability, and non-identifying study reference.
2. Save the temporary local record, then choose **Open clinician review**.
3. Choose **Request more information** to return to the temporary-record path, or choose **Force continue with caveat** to record the clearly labeled exception.
4. Repeat and choose **Accept as reviewed workflow data** to record the accepted branch.

## Changed files

- `src/App.tsx` — review route, local decision persistence, and complete-record handoff.
- `src/styles.css` — clinician-review layout, review facts, responsive behavior, and resolution states.
- `src/App.test.tsx` — direct coverage for the request-more-information and forced-continuation branches.
- `docs/stage/model-provenance.md` — static-fixture limitation and no-model status.
- `docs/stage/reviews/assets/task-004-clinician-review.png` — visual evidence.

## Verification

- `npm.cmd test` — direct clinician-review test added; the prior suite had 11 passing tests before TASK-004.
- `npm.cmd run build` — pending final workspace completion check.
- Visual review passed: the complete CT metadata path reaches the clearly labeled review gate and exposes no diagnostic output.

## Known limitations

- Browser local storage is demo-only and is not a secure clinical record store.
- The screen does not inspect images or invoke an AI model.
- “Force continue” records a workflow caveat only; it must not be interpreted as clinical validation or permission to aggregate data.

## TASK-004 revision - Clinical backdrop hierarchy showcase

### User-visible effect

- The local Philippine landscape now continues after screening instead of dropping to a plain canvas.
- AI consent is the most visible of the clinical backdrops; imaging metadata is quieter; temporary-record and clinician-review screens are almost clear for legibility.
- The clinical workflow uses one static image only: no cycling, ripple, or motion is shown after the screening flow begins.

### Visual evidence

- [AI consent backdrop](assets/task-004-ai-consent-backdrop.png)
- [Imaging metadata backdrop](assets/task-004-imaging-backdrop.png)

### Verification

- `npm.cmd run build` passed on 2026-07-24.
- Visual review passed for AI consent and imaging metadata at the stage preview. The form surface remains readable over its increasingly pale backdrop.

### Revision limitations

- The imagery is decorative and locally cached. It is not patient, environmental, risk, or AI data.
- This revision does not alter the screening data, temporary-record state, or clinician-review decision logic.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: `306f6d0` — `feat(task-004): add clinician review branches`.
- Approval command: `Approve TASK-004 for main`.
