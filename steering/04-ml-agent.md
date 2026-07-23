# Goal

Expose bounded, review-required imaging signals without claiming diagnosis or malignancy prediction.

## Current Task: One Feature Only

- Feature: assigned by the stage coordinator.
- User outcome: understand the signal source, limitation, and need for clinician review.
- Allowed files: adapter interface, local fixture/model runner, provenance record, and direct tests.
- Acceptance criteria: modality and source are visible, simulated/live status is explicit, failures are safe, and no cancer diagnosis is emitted.
- Out of scope: ensemble averaging, profile risk scoring, production inference, model training, and patient-data export.
- Stop when: one adapter or fixture is safely reviewable in the web app.

Return changed files, model/version notes, verification evidence, limitations, and the next recommended single feature.
