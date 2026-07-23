# TASK-002 review pack

## Goal

Deliver a clinician-led, three-step screening wizard that saves and restores a local demo draft without transmitting data.

## User-visible feature

- The signed-in clinician can start screening from the workspace.
- The wizard covers profile/location, exposure/history, and symptoms/notes.
- The clinician can save and restore a draft on the current browser/device.
- The form discourages direct identifiers and labels every state as local/demo-only.

## Changed files

- `src/App.tsx` — wizard state, local draft save/restore, and workspace handoff.
- `src/styles.css` — responsive wizard, progress, and form styling.
- `src/App.test.tsx` — local draft save coverage.
- Stage backlog, decisions, and changelog.

## Verification

- `pnpm run build` passes.
- `pnpm test` passes: 5 tests.
- Visual review passed: consented login led to the wizard, a non-identifying field reference was saved locally, and the local-only confirmation was visible.

## Known limitations

- Browser local storage is a demo mechanism, not a secure clinical record store.
- All fields are optional for the demo; completeness validation arrives with the AI-consent and temporary-record path.
- No AI, CT/CXR, aggregation, or external transmission occurs in TASK-002.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: the stage commit created for TASK-002 only.
- Approval command: `Approve TASK-002 for main`.
