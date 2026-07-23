# Stage decisions

## Accepted - Heatmap status before dashboard implementation

- A status view may describe the readiness of the future population dashboard, but it must never resemble or claim to be a live clinical-risk heatmap.
- The current status is static: 18-region coverage is planned, only synthetic data is allowed, aggregation is gated, and external sharing is disabled.
- TASK-006 remains the only task permitted to implement the actual population dashboard and map.

## Accepted - Public-facing placeholder content

- The front-page FAQ answers workflow and consent questions only. It explicitly states that Hinga is not diagnostic and AI cannot make the final decision.
- The About view is static demo content. Team profiles use visibly bracketed placeholders until the owner supplies approved names, roles, photos, and links.
- Placeholder social links do not leave the demo or represent real accounts.

## Pending owner confirmation - Temporary name and logo

- Proposed working product name: `Hinga Atlas`, with the descriptor `Lung screening`.
- The name keeps `Hinga` as the locally legible breath reference and adds `Atlas` to reflect geographic equity and future population insights.
- The placeholder logo is an original teal vector mark: a simplified paired-lung form with a calm waveform, not a diagnostic or regulatory symbol.

## Accepted - TASK-001 motion revision

- Motion serves orientation and confirmation only: it must not imply clinical progress, hide information, or delay a clinician action.
- The UI uses short entrance and confirmation transitions, with no looping attention-grabbing element beyond a very slow background drift.
- `prefers-reduced-motion` is mandatory and disables the added animation.

## Accepted direction

- Use `stage` for all implementation and review evidence; promote only explicit user-approved tasks to `main`.
- Keep the MVP offline-first, browser-local, and based on synthetic data.
- Use clinician review for all future AI outputs; the app must not diagnose cancer.
- Prioritize calm, high-contrast, touch-friendly field UI over dense dashboards or decorative animation.

## Pending decisions

- A visual source must be selected before final design QA.
- Local CT/CXR adapters remain later stretch work and do not block the demo workflow.
