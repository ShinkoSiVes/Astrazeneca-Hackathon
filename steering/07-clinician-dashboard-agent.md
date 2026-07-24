# TASK-007 — Clinician dashboard agent

## Concise goal

Give the signed-in clinician one clear local workspace to start a screening, reopen a prior local screening, view temporary data, or end the demo session.

## One-task protocol

1. Work only on `stage`; do not merge, rebase, or edit `main`.
2. Implement only the clinician dashboard and its direct tests. Do not broaden this task into external sync, identity management, patient matching, or model inference.
3. Keep records browser-local and clearly state that imported update files are not uploaded or retained.
4. Finish with a build, focused tests, visual showcase, and stage documentation update.
5. Report: feature completed, user-visible effect, files changed, tests, visual evidence, documentation update, and `TASK-007 ready for main`.

## Acceptance criteria

- After demo login, the clinician sees Start screening, View temporary data, and End screening actions.
- Saved local screenings appear as edit-ready non-identifying field-reference records.
- A local JSON screening update can be loaded into the screening form for review; its bytes are not retained.
- A temporary record is only opened when it exists locally.
- No external network transfer, real patient matching, diagnosis, or model inference is introduced.
