# Stage changelog

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
