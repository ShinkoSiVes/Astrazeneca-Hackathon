# Model provenance

## TASK-001

No model or model fixture is used in this feature.

## TASK-003

- Modality: metadata only; no CT/CXR image is read.
- Source/version: no model or model fixture is used.
- Status: local demo state only.
- Limitation: records may describe a future CT review but do not perform detection, risk estimation, diagnosis, or image interpretation.
- Clinician review: required for every later AI or imaging step.

## Future adapter boundary

- CT candidate detection: optional local MONAI adapter; candidate boxes and nodule-detection signals only.
- Chest X-ray: optional TorchXRayVision adapter; triage signal only, without claimed localization.
- Clinical profile: clinician checklist only; no automated malignancy score.

Every future AI result must declare its modality, source/version, simulated/live status, limitations, and clinician-review requirement.
