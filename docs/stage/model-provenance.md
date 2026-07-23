# Model provenance

## TASK-001

No model or model fixture is used in this feature.

## TASK-003

- Modality: CT/CXR/DICOM selected-file metadata only; no CT/CXR image is read.
- Source/version: no model or model fixture is used.
- Status: local demo state only.
- Limitation: the browser may show a selected file name, type, and size, but no file bytes are persisted. The demo does not perform detection, risk estimation, diagnosis, or image interpretation.
- Clinician review: required for every later AI or imaging step.

## TASK-004

- Modality: CT metadata display only; no image data is read.
- Source/version: static workflow fixture, not a model or inference runner.
- Status: local demo state only.
- Limitation: the clinician review screen records a workflow decision, not a clinical interpretation or risk prediction.
- Clinician review: this task is the review gate; future model outputs must still carry their own source, version, and validation evidence.

## TASK-005

- Modality: no model, image, or inference input is used.
- Source/version: local de-identification and aggregation fixture only.
- Status: browser-local population-data fixture; not a regional dashboard or external data feed.
- Limitation: no risk score, prediction, or public-health estimate is produced.
- Clinician review: only accepted clinician-reviewed workflow records may enter the fixture.

## TASK-006

- Modality: no model or geographic inference is used.
- Source/version: 18 static, synthetic UI fixtures generated in the browser bundle.
- Status: local visual dashboard only; local population-fixture count is deliberately unmapped.
- Limitation: the signal colors and values are illustrative interface data, not clinical risk, incidence, prevalence, or regional attribution.
- Clinician review: not applicable to synthetic fixtures; real population data remains governed by the TASK-005 gate.

## Future adapter boundary

- CT candidate detection: optional local MONAI adapter; candidate boxes and nodule-detection signals only.
- Chest X-ray: optional TorchXRayVision adapter; triage signal only, without claimed localization.
- Clinical profile: clinician checklist only; no automated malignancy score.

Every future AI result must declare its modality, source/version, simulated/live status, limitations, and clinician-review requirement.
