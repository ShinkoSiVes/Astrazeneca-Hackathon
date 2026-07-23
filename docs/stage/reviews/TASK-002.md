# TASK-002 review pack

## Goal

Deliver a clinician-led, three-step screening wizard that saves and restores a local demo draft without transmitting data.

## User-visible feature

- The signed-in clinician can start screening from the workspace.
- The wizard covers profile/location, exposure/history, and symptoms/notes.
- The clinician can save and restore a draft on the current browser/device.
- The form discourages direct identifiers and labels every state as local/demo-only.
- The Aeris AI wordmark returns the user to the front page without deleting a saved local draft.
- The front page uses a real, locally cached Philippine landscape background with a contrast overlay.
- The landscape treatment now covers the full page and crossfades through a small local Philippine terrace set, with reduced-motion fallback.

## Changed files

- `src/App.tsx` — wizard state, local draft save/restore, and workspace handoff.
- `src/styles.css` — responsive wizard, progress, and form styling.
- `src/App.test.tsx` — local draft save coverage.
- `src/App.tsx` and `src/App.test.tsx` — persistent home navigation and direct coverage.
- `src/assets/sagada-rice-terraces.jpg` and `src/styles.css` — local background image and readable hero treatment.
- `src/assets/mountain-province-terraces.jpg`, `src/assets/benguet-terraces.jpg`, and `src/App.tsx` — local rotating landscape set and backdrop layers.
- `docs/stage/assets.md` — source, license, local optimization, and usage record for the landscape asset.
- Stage backlog, decisions, and changelog.

## Verification

- `pnpm run build` passes.
- `pnpm test` passes: 6 tests.
- Visual review passed: consented login led to the wizard, a non-identifying field reference was saved locally, and the local-only confirmation was visible.
- Landscape visual review remains available in the stage preview. Automated reload was blocked by browser URL policy after the local-asset changes; build and test checks remain green.

## Known limitations

- Browser local storage is a demo mechanism, not a secure clinical record store.
- All fields are optional for the demo; completeness validation arrives with the AI-consent and temporary-record path.
- No AI, CT/CXR, aggregation, or external transmission occurs in TASK-002.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: the stage commit created for TASK-002 only.
- Approval command: `Approve TASK-002 for main`.
