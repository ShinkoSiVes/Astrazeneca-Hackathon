# TASK-002 review pack

## Goal

Deliver a clinician-led, three-step screening wizard that saves and restores a local demo draft without transmitting data.

## User-visible feature

- The signed-in clinician can start screening from the workspace.
- The wizard covers profile/location, exposure/history, and symptoms/notes.
- The clinician can save and restore a draft on the current browser/device.
- Tobacco-use capture asks for its period before the estimated number of packs.
- The form discourages direct identifiers and labels every state as local/demo-only.
- The Aeris AI wordmark returns the user to the front page without deleting a saved local draft.
- The front page uses a real, locally cached Philippine landscape background with a contrast overlay.
- The landscape treatment now covers the full page and crossfades through a small local Philippine terrace set, with reduced-motion fallback.
- The clinician profiling/screening workspace deliberately uses a clear, light background without the rotating landscape imagery.
- Each route change now has a brief, unobtrusive page-entry transition; the persistent top bar remains stable for orientation.
- Public-flow backgrounds now rotate across five locally cached Philippine landscapes, crossfading every 7.2 seconds; profiling remains deliberately clear.
- Each public-background change includes a double-ripple effect, continuously enabled for the owner stage preview without a Play/Pause control.
- View changes now have an exit-and-entry handoff: the current page fades upward before the next page rises in, preventing the abrupt content swap.
- The profiling workspace now has its own explicit fade-and-rise entrance, with the form card following slightly after the guidance column.

## Changed files

- `src/App.tsx` and `src/styles.css` — keyed page-entry transition for smooth view changes.
- `src/App.tsx`, `src/styles.css`, and `src/App.test.tsx` — exit-and-entry page handoff with flow tests updated for the short transition.

- `src/App.tsx` — wizard state, local draft save/restore, and workspace handoff.
- `src/App.tsx` and `src/App.test.tsx` — tobacco-use period and local-draft coverage.
- `src/styles.css` — responsive wizard, progress, and form styling.
- `src/App.test.tsx` — local draft save coverage.
- `src/App.tsx` and `src/App.test.tsx` — persistent home navigation and direct coverage.
- `src/assets/sagada-rice-terraces.jpg` and `src/styles.css` — local background image and readable hero treatment.
- `src/assets/mountain-province-terraces.jpg`, `src/assets/benguet-terraces.jpg`, and `src/App.tsx` — local rotating landscape set and backdrop layers.
- `docs/stage/assets.md` — source, license, local optimization, and usage record for the landscape asset.
- Stage backlog, decisions, and changelog.

## Verification

- `pnpm run build` passes.
- `pnpm test` passes: 8 tests, including the public-landscape rotation interval.
- Rotation verification: the automated check advances one 7.2-second interval and confirms the next landscape becomes active.
- Motion behavior: the ripple uses a keyed element on each active-background change, while the Play motion control is reserved for an intentional override of a system reduced-motion preference.
- Navigation verification: consent, login, workspace, profiling, About, and Heatmap test flows wait for and complete the short exit-and-entry handoff.
- Visual transition check passed: moving from consent to secure login applied the `view-flow-in` animation while the top bar stayed present.
- Visual review passed: consented login led to the wizard, a non-identifying field reference was saved locally, and the local-only confirmation was visible.
- Landscape visual review remains available in the stage preview. Automated reload was blocked by browser URL policy after the local-asset changes; build and test checks remain green.

## Known limitations

- Browser local storage is a demo mechanism, not a secure clinical record store.
- All fields are optional for the demo; completeness validation arrives with the AI-consent and temporary-record path.
- No AI, CT/CXR, aggregation, or external transmission occurs in TASK-002.

## TASK-002 revision - Screening-step fade handoff showcase

### User-visible feature

- Profile, Exposure, and Symptoms now transition inside the screening card: the outgoing step fades upward for 180 ms, then the next step fades and rises into place.
- Continue and Previous are briefly disabled during the handoff, preventing accidental double changes.

### Demo path

1. Complete consent and demo login, then choose **Start screening**.
2. On Profile, select **Continue**.
3. Observe the Profile fields fade out and Exposure fade into the same card; use **Previous** to verify the reverse route.

### Visual evidence

- `docs/stage/reviews/assets/task-002-screening-step-1.png` — Profile step in the clear clinician workspace.
- `docs/stage/reviews/assets/task-002-screening-step-2.png` — Exposure step after the completed handoff, with the active-step indicator updated.

### Verification and limitation

- `npm.cmd test` — 9 passing tests, including direct coverage that the wizard enters the step-leaving state before Exposure loads.
- `npm.cmd run build` — passes.
- The 180 ms motion is decorative only. It does not imply clinical processing, validate data completeness, or make a diagnosis.

## TASK-002 revision - Full screening-card fade showcase

### User-visible feature

- Continue and Previous fade the full local-screening card upward for 260 ms, then the next step's card fades in.
- Controls remain disabled during the exit, preventing duplicate transitions.

### Visual evidence

- `docs/stage/reviews/assets/task-002-screening-card-fade-out.png` — Profile card during the outgoing fade.
- `docs/stage/reviews/assets/task-002-screening-card-fade-in.png` — Exposure card after its entry animation.

### Verification and limitation

- `npm.cmd test` — 11 passing tests, including direct coverage for the leaving state on both the card and form panel.
- `npm.cmd run build` — passes.
- Motion is decorative only and does not indicate data processing or validation.

## Promotion

- Status: **awaiting owner approval**
- Proposed TASK-002 revision: `2b0f4dc` — `style(task-002): animate screening step handoffs`.
- Proposed TASK-002 revision: `d78d4c3` — `style(task-002): fade complete screening cards`.
- Proposed promotion: the stage commits created for TASK-002 only.
- Approval command: `Approve TASK-002 for main`.
