# Stage changelog

## TASK-003 revision - Multiple imaging files and per-file dates

- Status: awaiting owner review with TASK-003
- The local imaging selector now accepts multiple CT/CXR/DICOM files through drag-and-drop or the file chooser.
- Each selected file has its own optional acquisition date, which is retained with file metadata in the temporary local record and visible at clinician review.
- File bytes remain outside the app state and local storage; no files are uploaded, read, parsed, or interpreted.

## TASK-003 revision - Local imaging file drop zone

- Status: awaiting owner review with TASK-003
- Added a CT/CXR/DICOM drop zone and file chooser to Imaging Metadata, with selected file name, type, and size shown as a local demo reference.
- No file bytes are uploaded, parsed, stored, or interpreted; only the selected-file metadata joins the temporary local record.

## TASK-004 revision - Layered clinical backdrops

- Status: awaiting owner review with TASK-004
- Extended the one local, static Philippine landscape from screening through AI consent, imaging metadata, temporary-record, and clinician-review pages.
- Consent is the most visibly contextual clinical screen; data entry is more subdued; temporary and review decisions use the strongest pale wash for the clearest reading surface.
- Clinical backgrounds do not rotate, crossfade, or ripple, so imagery never resembles progress or a diagnostic result.

## TASK-004 - Clinician nodule-review screen and decision branches

- Status: awaiting owner review
- Added a clinician-only review gate for a complete CT metadata record, with accept, request-more-information, and forced-continue-with-caveat branches.
- The review source is explicitly a static metadata-only workflow fixture; no CT pixels, model output, nodule finding, malignancy estimate, or diagnosis is shown.

## TASK-002 revision - Static transparent screening backdrop

- Status: awaiting owner review with TASK-002
- Restored one locally cached Philippine landscape behind the screening wizard, held static with a strong pale transparency wash.
- The screening form card remains 90% opaque; AI-consent and imaging metadata screens stay clear and image-free.

## TASK-002 revision - Full screening-card fade handoff

- Status: awaiting owner review with TASK-002
- Continue and Previous now fade the complete local-screening card out before the next step fades in, rather than swapping only the fields inside a persistent card.
- The 260 ms exit prevents duplicate clicks and makes the direction of the form handoff visible.

## TASK-003 revision - Study-date calendar

- Status: awaiting owner review with TASK-003
- Replaced the study-date browser field with an in-app calendar that opens from its calendar control.
- The clinician can choose month, year, and day; the chosen date is retained in the local temporary record metadata.

## TASK-003 - AI consent, imaging metadata, and temporary-record path

- Status: awaiting owner review
- Added a distinct AI-risk-support consent decision after the local screening wizard.
- A declined AI path retains only a local screening-only status; consented encounters collect local imaging metadata and produce a temporary local record when details are incomplete.
- No imaging file is uploaded, parsed, or interpreted, and no AI result is produced in this task.

## TASK-002 revision - Screening-step fade handoff

- Status: awaiting owner review with TASK-002
- The clinician wizard now fades the outgoing step upward over 180 ms, then fades and rises the next step into place.
- Navigation controls are briefly disabled during the handoff to avoid accidental double transitions.

## Delivery process revision - Required task showcase

- Status: active for every new stage task
- Each task review now includes the user-visible feature, a concise demo path, screenshots or a short recording, test results, known limitations, and the exact proposed stage commit before owner review or any promotion request.

## TASK-002 revision - Profiling fade-in

- Status: awaiting owner review with TASK-002
- Added an explicit fade-and-rise entrance for the profiling workspace, followed by a slight stagger on the form card.
- The stage preview's motion override now applies this entrance even when the local viewer reports reduced motion.

## TASK-002 revision - Continuous owner-demo motion

- Status: awaiting owner review with TASK-002
- Removed the Play/Pause motion control at the owner's request.
- The public-flow landscape rotation and ripple transition now remain continuously enabled in the stage demo.

## TASK-001 revision - Collapsed FAQ default

- Status: awaiting owner review with TASK-001
- Removed the default-open FAQ state so every answer starts collapsed and independently expandable.

## TASK-002 revision - Aesthetic page handoff

- Status: awaiting owner review with TASK-002
- Navigation now briefly fades and lifts the current page away before the keyed next page fades and rises into place.
- The handoff lasts 220 ms and blocks duplicate navigation presses during the transition.

## TASK-002 revision - Enable owner-demo landscape motion

- Status: awaiting owner review with TASK-002
- The stage demo now enables the rotating landscape motion on load, even in the local preview environment that reports reduced motion.
- A visible Pause motion control remains available whenever that preference is reported.

## TASK-002 revision - Ripple landscape transitions

- Status: awaiting owner review with TASK-002
- Replaced the background's buffered-looking image switch with a double-ripple transition layered over the crossfade.
- When a device requests reduced motion, the app remains static by default and shows an explicit Play motion control for an intentional preview.

## TASK-002 revision - Diverse animated landscape rotation

- Status: awaiting owner review with TASK-002
- Replaced the brittle timed CSS cycle with an app-controlled 7.2-second rotation and a visible 1.5-second crossfade plus slow image movement.
- Added locally cached Cebu forest and Benguet mountain-vista images so the public flow is no longer only terraces.
- Profiling remains intentionally clear, without any background imagery.

## TASK-002 revision - Flowing view transitions

- Status: awaiting owner review with TASK-002
- Added a short, calm page-entry transition whenever the user moves between consent, login, workspace, profiling, About, or Heatmap status views.
- Reduced-motion preferences continue to suppress the animation.

## TASK-002 revision - Clear screening workspace

- Status: awaiting owner review with TASK-002
- Removed the rotating landscape backdrop from the clinician profiling/screening workspace and restored a clean, light clinical background.
- The real landscape rotation remains limited to the public-facing flow.

## TASK-002 revision - Tobacco-use period

- Status: awaiting owner review with TASK-002
- Added a period selector before the estimated-pack input: per day, week, month, or year.
- The selected period and estimated amount are saved together in the local demo draft.

## TASK-001 revision - Independent FAQ cards

- Status: awaiting owner review with TASK-001
- Fixed the FAQ grid so opening one answer does not stretch the neighboring closed card.

## TASK-002 revision - Full-page landscape rotation

- Status: awaiting owner review with TASK-002
- Expanded the landscape treatment to the full page and added a slow, low-key crossfade between three real Philippine terrace images.
- The foreground keeps a contrast overlay and reduced-motion users receive a single static image.

## TASK-002 revision - Grounded front-page background

- Status: awaiting owner review with TASK-002
- Replaced the abstract-only hero treatment with a locally cached Sagada Rice Terraces photograph and high-contrast overlay.
- The photo has no identifiable patient or clinician and is optimized to a 455 KB local asset for the offline demo.

## TASK-002 revision - Home navigation

- Status: awaiting owner review with TASK-002
- Made the Aeris AI wordmark return to the front/consent page from any current view.
- Returning home does not erase the saved local screening draft.

## TASK-002 - Screening wizard with local draft save

- Status: awaiting owner review
- Added a three-step clinician-only wizard for profile/location, exposure/history, and symptoms/notes.
- Added local device draft save and restore under a demo-only key; direct patient identifiers are explicitly discouraged.
- Added direct automated coverage for the local-save path.

## TASK-001 - Final stage QA

- Status: passed on stage; awaiting explicit main-promotion approval
- Confirmed the consent decline branch, consented login, staged workspace handoff, FAQ/About/Heatmap status entry points, responsive UI, and clean stage history.

## TASK-001 revision - Aeris AI working identity

- Status: pending owner review with TASK-001
- Renamed the temporary product identity from `Hinga Atlas` to `Aeris AI` at the owner's request.
- The name change does not alter the clinician-review gate, demo-data limitation, or placeholder logo status.

## TASK-001 revision - Heatmap status

- Status: pending owner review with TASK-001
- Added a front-page Heatmap status entry point and a static demo-readiness view.
- The status screen explicitly distinguishes planned regional coverage from a live map and confirms that no live patient data is displayed or shared.

## TASK-001 revision - Distinctive working name

- Status: pending owner review with TASK-001
- Updated the temporary product identity from `Hinga` to `Hinga Atlas`.
- `Atlas` reflects the intended geographic-equity, population-mapping direction without implying a diagnosis or medical certification.

## TASK-001 revision - FAQ and About

- Status: pending owner review with TASK-001
- Added a clinician-oriented FAQ to the consent screen and a static About view reachable from the front page.
- Added four clearly labeled placeholder team cards with placeholder profile-photo, name, role, and social-link fields.

## Repository setup - GitHub branch workflow

- Status: stage documentation current
- Connected the local repository to `ShinkoSiVes/Astrazeneca-Hackathon` as `origin`.
- Added the stage/main version-control record; published history will remain append-only and task-scoped.

## TASK-001 revision - Temporary product identity

- Status: pending owner review with TASK-001
- Replaced the placeholder letter mark with an original local vector mark and the temporary product name `Hinga`.
- `Hinga` is used with the clear descriptor `Lung screening`; it is not a clinical claim or final brand decision.

## TASK-001 revision - Accessible motion

- Status: pending owner review with TASK-001
- Added subtle entrance, confirmation, and handoff motion to the consent and demo-login flow.
- Added a calm background drift and primary-action feedback; all motion is suppressed when the device requests reduced motion.

## TASK-001 - Consent and demo login

- Status: pending owner review
- Added clinician-led survey consent, decline-without-record outcome, local demo login, and a ready state.
- Added build and interaction coverage for consent and login branches.
