# Local research inference adapter

This is an optional local service for the Aeris browser prototype. It is not a medical device and must not be used to diagnose cancer or manage a patient without qualified clinical review.

## Start the CXR adapter

Use a dedicated Python environment, then:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

`POST /infer/cxr` accepts only de-identified PNG/JPEG/WebP chest-radiograph previews and returns research signals from TorchXRayVision. The model's `Nodule` output is an image-model signal, **not** a calibrated malignancy probability or cancer diagnosis.

## CT is intentionally separate

The NVIDIA MONAI lung-nodule bundle is a 3D CT candidate detector. A real integration needs DICOM de-identification, full-series assembly, voxel-spacing validation, MONAI preprocessing, a secure model runtime, and independent clinical validation. The service returns `501` for CT until that work is complete.
