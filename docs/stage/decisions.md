# Stage decisions

## Accepted - Clear clinician profiling workspace

- The public-facing consent flow may retain the slow landscape rotation, while the clinician profiling/screening workspace uses a plain, light background.
- This keeps clinical data entry visually calm and avoids imagery behind patient-screening fields.

## Accepted - Full-page rotating landscape background

- A small local set of real, non-identifying Philippine landscapes may crossfade behind the demo to avoid a generic generated-page appearance.
- Cycle timing must be slow and purely atmospheric; content must remain readable and no clinical UI state may be encoded in the image rotation.
- Reduced-motion preference uses a single static image instead of a rotating backdrop.

## Accepted - Real landscape imagery for the front page

- The front-page background may use real, licensed landscape imagery when it supports place, trust, and geographic-equity framing without distracting from consent.
- Avoid patient, clinician, and clinical-facility photography in the active screening flow unless explicit consent and usage authority are established.
- The first chosen image is locally cached so the demo does not rely on an external image host at runtime.

## Accepted - Persistent home navigation

- The Aeris AI wordmark is always a return-to-front-page control.
- It changes the visible view only; saved local draft data is preserved until a later explicit data-management feature is approved.

## Accepted - TASK-002 local screening draft

- The wizard is clinician-led and intentionally avoids collecting a patient name; a local field reference is used instead.
- Draft data is stored only in browser local storage for the demo and can be restored on the same device.
- TASK-002 does not create final screening data, aggregate records, call AI, or transmit data. Those decisions remain in later tasks.

## Accepted - Heatmap status before dashboard implementation

- A status view may describe the readiness of the future population dashboard, but it must never resemble or claim to be a live clinical-risk heatmap.
- The current status is static: 18-region coverage is planned, only synthetic data is allowed, aggregation is gated, and external sharing is disabled.
- TASK-006 remains the only task permitted to implement the actual population dashboard and map.

## Accepted - Public-facing placeholder content

- The front-page FAQ answers workflow and consent questions only. It explicitly states that Aeris AI is not diagnostic and AI cannot make the final decision.
- The About view is static demo content. Team profiles use visibly bracketed placeholders until the owner supplies approved names, roles, photos, and links.
- Placeholder social links do not leave the demo or represent real accounts.

## Pending owner confirmation - Temporary name and logo

- Proposed working product name: `Aeris AI`, with the descriptor `Lung screening`.
- The name is a short, distinctive temporary product identifier. It does not represent a clinical claim, a validated AI model, or a final brand decision.
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
