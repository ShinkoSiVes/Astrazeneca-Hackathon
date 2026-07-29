# Stage decisions

## Screening alternative input mode

- Accepted: use one global switch for dropdowns in the four-step screening form; existing free-text fields, checklists, offline location selectors, login controls, and imaging controls keep their current input method.
- Accepted: interpret text locally from field-specific allowed options and aliases. No screening text is transmitted to an external service.
- Accepted: a suggested value does not become screening data until the clinician explicitly confirms it. Unconfirmed text remains incomplete and cannot affect risk-support or aggregation logic.
- Accepted: retain the original wording, suggestion, and confirmed canonical value with each browser-local saved update so later clinician review can compare the source text with the value used by the application.
- Accepted: preserve backward compatibility with local records created before interpretation evidence was introduced.

## Population dashboard - Layered public and screening overlay

- Accepted: add a third dashboard mode that displays the static public signal as the regional fill and unique local app-screening profiles as a separate hatched overlay.
- Accepted: never sum public fixture counts and app-screening counts because the aggregate public fixture has no participant identity that can support cross-source deduplication.
- Accepted: app-screening profiles are eligible only when marked as not previously surveyed and are deduplicated by normalized field reference before regional grouping.
- The combined view remains a local, synthetic demo comparison. It must not be described as a live clinical-risk heatmap, incidence estimate, or operational GIS output.

## TASK-008B - Connected tobacco-use amount control

- Accepted: display tobacco-use frequency directly above estimated packs as one connected input group.
- Accepted: require a frequency before a non-zero pack estimate can be entered.
- Accepted: preserve `Not a smoker` as an explicit no-use state with a zero estimate, avoiding contradictory input.

## TASK-008 revision - Full offline PSGC location directory

- Accepted: replace the representative fixture after the owner identified that it was incomplete.
- Accepted: bundle the normalized directory and load it only in the screening flow, keeping field selection available without a live lookup.
- Accepted: use the explicit Region -> City / municipality -> Barangay hierarchy so all barangay choices have an unambiguous parent locality.
- Accepted: include 18 regions, 1,655 cities/municipalities, and 42,010 barangay entries in this stage snapshot.
- Deferred: a scheduled refresh mechanism and later PSA naming corrections require a separately approved dataset-update task; no silent data refresh will occur.

## TASK-008 — Offline location directory

- Accepted: use a static offline directory with all 18 Philippine regions and representative locality choices so the demo remains lightweight and usable without internet.
- Accepted: region selection is required before locality selection; choosing another region clears the old locality.
- Deferred: a complete official barangay registry, current PSGC synchronization, municipality/province hierarchy, and location validation require a separately approved data-sourcing task.

## Accepted - Offline PSA-aligned regional geometry with synthetic signals

- TASK-006 may use a locally bundled, open-license 2023 province-boundary snapshot to render selectable Philippine administrative-region geometry.
- The dashboard's labels must align to the PSA's current 18-region roster. The Negros Island Region is assembled from Negros Occidental, Negros Oriental, and Siquijor source polygons.
- The geometry is for demo orientation only; it must not be described as an authoritative operational GIS layer, used for patient location, or combined with a clinical-risk claim.
- Every colour, follow-up signal, record count, and coverage value remains static synthetic UI data. External sharing remains disabled.

## Accepted - Stylized map interaction without GIS attribution

- TASK-006 may use a native SVG, 3D-styled Philippines-shaped selection surface for the 18 numbered synthetic fixtures.
- The surface must remain keyboard-operable and route selection through the existing local synthetic-fixture contract.
- It is not a geospatial model, an administrative-boundary map, or a representation of real regional health data.

## Accepted - Synthetic 18-region dashboard boundary

- TASK-006 may display 18 numbered, synthetic regional fixtures with synthetic follow-up signals for interaction design only.
- The fixtures may not use live patient data, claim regional clinical risk, attribute a signal to a real Philippine region, or map a TASK-005 local fixture to a region.
- Local population-fixture count may be displayed as an unmapped total only. External sharing remains disabled.

## Accepted - Clinician-approved local de-identification gate

- Only the accepted clinician-review branch can open TASK-005 aggregation. Forced continuation remains a local workflow exception and cannot be aggregated.
- Before aggregation, the UI must name the removed classes of data: field reference, barangay, clinician notes, facility, study reference and dates, and local image-file metadata.
- The local population fixture may retain only province-level geography, age band, exposure categories, symptom signal count, and clinician-reviewed workflow status.
- TASK-005 must not create a risk result, external transfer, regional dashboard update, or live health-network sharing.

## Accepted - Multiple local image references with per-file dates

- Imaging Metadata may collect multiple CT, CXR, or DICOM file references for one encounter.
- Every file may have an optional acquisition date; only file name, MIME type, size, and that date are retained in the demo's local temporary-record metadata.
- The browser must not retain file bytes in local storage, parse images, render image previews, or present an inference result.

## Accepted - Clear-to-subtle clinical backdrop hierarchy

- A single locally cached landscape may continue from screening through AI consent, imaging metadata, temporary-record, screening-complete, and clinician-review pages.
- The backdrop is progressively washed out: consent keeps the strongest visual context, metadata is quieter, and temporary/review states are closest to a clear clinical canvas.
- No clinical view may cycle images, ripple, or imply an AI or clinical processing state through motion.

## Accepted - Metadata-only clinician review gate

- TASK-004 may demonstrate the clinician decision workflow only after a local CT metadata record is marked ready.
- The packet must state that it is a static workflow fixture and must never be presented as an image interpretation, nodule finding, malignancy estimate, or diagnosis.
- Clinicians may accept the workflow record, request more information, or force continuation with a caveat. Every outcome is local-only and remains outside aggregation until TASK-005.

## Accepted - Separate AI consent and metadata-only temporary record

- AI risk support has a separate patient-consent choice after screening; declining it must keep the encounter on the screening-only local path.
- TASK-003 records only local imaging metadata. It must not upload, parse, or interpret CT/CXR files and must not present any AI result.
- If a CT study, local availability, and non-identifying study reference are not all present, the consented encounter is retained as an explicitly incomplete local temporary record for a later clinician return.

## Accepted - Review showcase for every task

- Starting with the next newly added task, every stage task must have a concise showcase before review: the feature outcome, demo steps, screenshots or a short recording, automated/manual test evidence, limitations, and its exact stage commit.
- A showcase is review evidence only. It does not authorize promotion to `main`; explicit owner approval remains required.

## Accepted - Profiling-specific entrance motion

- The profiling workspace uses a dedicated fade-and-rise transition with a short form-card stagger so the data-entry view does not appear abruptly.
- The effect remains decorative and does not delay access to the fields.

## Accepted - Continuous stage-demo landscape motion

- The owner requested removal of the motion control. The public-flow rotation and ripple remain continuously enabled in the stage demo.

## Accepted - Two-part page handoff

- A page change uses a short exit transition followed by the existing keyed entry transition; it is not presented as loading, synchronizing, or clinical processing.
- Inputs are temporarily non-interactive only during the 220 ms exit to prevent duplicate actions.

## Accepted - Owner-demo motion defaults on

- The owner explicitly requested visible background cycling, and the local preview reports reduced motion regardless of that request.
- Therefore, stage starts landscape motion enabled and presents a Pause motion control in reduced-motion environments. This is a demo-specific choice to make the reviewable behavior visible.

## Accepted - Intentional ripple motion preview

- Background changes use a double-ripple over the existing crossfade rather than a hard-looking image swap.
- System reduced-motion preference remains respected by default. An explicit Play motion control is available only in that state for a deliberate demo preview.

## Accepted - Diverse, visible public-flow landscape rotation

- The public flow uses five different, locally cached Philippine landscape scenes rather than a terrace-only sequence.
- The transition is a 1.5-second crossfade with a slow image movement every 7.2 seconds; reduced-motion users receive the original static scene.
- The clinician profiling workspace remains image-free, as previously approved.

## Accepted - Page-transition motion

- Moving between application views uses a brief fade-and-rise entry transition while the top bar remains stable for orientation.
- The transition is decorative only: it neither blocks inputs nor represents clinical progress, and reduced-motion settings disable it.

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
# Stage decisions

## TASK-007 — Local clinician record selection

- Accepted: the post-login screen is a clinician dashboard, not an automatic new-screening redirect.
- Accepted: saved screening snapshots use only the existing non-identifying field reference and browser-local storage, capped at 12 entries for the demo.
- Accepted: a `.json` local update may populate the screening form for review, but its file bytes are never uploaded or stored.
- Deferred: patient identity resolution, cross-device synchronization, external uploads, longitudinal records, and conflict handling require a separate approved task.
