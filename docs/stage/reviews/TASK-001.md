# TASK-001 review pack

## Goal

Deliver a clinician-led survey-consent and demo-login flow that can safely start a field-screening encounter.

## User-visible feature

- The clinician records consent before login.
- A declined survey ends the encounter without a screening record.
- A consented encounter requires local demo login and lands in a ready workspace state.

## Changed files

- React/Vite application shell and TASK-001 screen implementation.
- Consent/login interaction tests.
- Stage governance, steering, and model-provenance documentation.

## Verification

- `pnpm run build` passes.
- `pnpm test` passes: 2 tests.
- Visual review: consent, declined encounter, login, and workspace-ready states verified in the stage preview.

## Known limitations

- Login is local demo-only; no production identity provider is implemented.
- The screening wizard begins in TASK-002 after this task is approved.
- No real patient data, images, or AI model output is handled.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: the stage commit created for TASK-001 only.
- Approval command: `Approve TASK-001 for main`.
