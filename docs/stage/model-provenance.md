# Model provenance

## TASK-001

No model or model fixture is used in this feature.

## Future adapter boundary

- CT candidate detection: optional local MONAI adapter; candidate boxes and nodule-detection signals only.
- Chest X-ray: optional TorchXRayVision adapter; triage signal only, without claimed localization.
- Clinical profile: clinician checklist only; no automated malignancy score.

Every future AI result must declare its modality, source/version, simulated/live status, limitations, and clinician-review requirement.
