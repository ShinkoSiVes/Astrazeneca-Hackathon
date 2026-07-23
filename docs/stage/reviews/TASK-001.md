# TASK-001 review pack

## Goal

Deliver a clinician-led survey-consent and demo-login flow that can safely start a field-screening encounter.

## User-visible feature

- The clinician records consent before login.
- A declined survey ends the encounter without a screening record.
- A consented encounter requires local demo login and lands in a ready workspace state.
- The flow uses restrained status and transition motion without delaying clinician actions.
- The temporary product identity is displayed as `Hinga | Lung screening` with an original vector placeholder mark.

## Changed files

- React/Vite application shell and TASK-001 screen implementation.
- Consent/login interaction tests.
- Stage governance, steering, and model-provenance documentation.
- Revision: accessible UI motion styles and a view-state hook for motion targeting.
- Revision: temporary name, browser title, and vector logo asset.

## Verification

- `pnpm run build` passes.
- `pnpm test` passes: 2 tests.
- Visual review: consent, declined encounter, login, and workspace-ready states verified in the stage preview.
- Motion is intentionally limited to a short screen entrance, consent confirmation, secure-login handoff, and ready-state confirmation; `prefers-reduced-motion` disables it.
- Motion revision verification: build and interaction tests passed; the stage preview was visually checked with the consent confirmation control enabled and reset afterwards.
- Identity is a placeholder pending owner confirmation; no trademark, logo clearance, or external brand research has been performed.

## Known limitations

- Login is local demo-only; no production identity provider is implemented.
- The screening wizard begins in TASK-002 after this task is approved.
- No real patient data, images, or AI model output is handled.

## Promotion

- Status: **awaiting owner approval**
- Proposed promotion: the TASK-001 base commit plus its owner-requested motion revision commit.
- Approval command: `Approve TASK-001 for main`.
