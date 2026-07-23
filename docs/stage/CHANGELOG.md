# Stage changelog

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
