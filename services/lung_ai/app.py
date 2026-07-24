"""Research-only local CXR adapter for the Aeris AI prototype.

This service is deliberately separate from the browser app. It must only be
started in a controlled research environment with de-identified images.
"""

from __future__ import annotations

from functools import lru_cache
import base64
from io import BytesIO

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
RESEARCH_NOTICE = (
    "Research prototype only. This output is not a diagnosis, does not rule in or "
    "rule out disease, and requires qualified clinical review."
)

app = FastAPI(title="Aeris Lung AI Research Adapter", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    cxr_adapter: str
    ct_adapter: str
    notice: str


class CxrSignalResponse(BaseModel):
    modality: str
    nodule_related_signal: float
    related_signals: dict[str, float]
    model: str
    attention_map: str
    notice: str


@lru_cache(maxsize=1)
def load_cxr_model():
    """Load the research model only on the first CXR request.

    TorchXRayVision fetches the selected public weights if they are not already
    cached by the runtime. Never expose the raw model output as cancer risk.
    """
    try:
        import torch
        import torchxrayvision as xrv
    except ImportError as error:  # pragma: no cover - depends on local setup
        raise RuntimeError("CXR dependencies are not installed. See requirements.txt.") from error

    model = xrv.models.DenseNet(weights="densenet121-res224-all")
    model.eval()
    return torch, xrv, model


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="research-only",
        cxr_adapter="TorchXRayVision DenseNet adapter available on POST /infer/cxr",
        ct_adapter="Not implemented: MONAI requires a full, anonymized 3D CT volume and validated deployment pipeline.",
        notice=RESEARCH_NOTICE,
    )


def grad_cam(model, tensor, target_index: int, torch) -> tuple[np.ndarray, np.ndarray]:
    """Generate a Grad-CAM map for the requested CXR model output.

    The heatmap expresses model attention for the selected *nodule* signal. It
    is not a lesion boundary, cancer-origin forecast, or radiologist report.
    """
    activations = None

    def capture_activations(_module, _inputs, output):
        nonlocal activations
        activations = output
        activations.retain_grad()

    hook = model.features.register_forward_hook(capture_activations)
    try:
        model.zero_grad(set_to_none=True)
        outputs = model(tensor)
        outputs[0, target_index].backward()
        gradients = activations.grad
        weights = gradients.mean(dim=(2, 3), keepdim=True)
        cam = torch.relu((weights * activations).sum(dim=1, keepdim=True))
        cam = torch.nn.functional.interpolate(cam, size=tensor.shape[-2:], mode="bilinear", align_corners=False)
        heatmap = cam[0, 0].detach().cpu().numpy()
        heatmap = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-8)
        return outputs[0].detach().cpu().numpy(), heatmap
    finally:
        hook.remove()


def heatmap_data_url(heatmap: np.ndarray) -> str:
    rgba = np.zeros((*heatmap.shape, 4), dtype=np.uint8)
    rgba[..., 0] = 255
    rgba[..., 1] = np.clip(255 * np.sqrt(heatmap), 0, 255).astype(np.uint8)
    rgba[..., 2] = 20
    rgba[..., 3] = np.clip(220 * heatmap, 0, 220).astype(np.uint8)
    output = BytesIO()
    Image.fromarray(rgba, "RGBA").save(output, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(output.getvalue()).decode('ascii')}"


@app.post("/infer/cxr", response_model=CxrSignalResponse)
async def infer_cxr(file: UploadFile = File(...)) -> CxrSignalResponse:
    """Return research CXR model signals for a PNG/JPEG preview image.

    This endpoint intentionally excludes DICOM and CT. DICOM ingestion needs
    de-identification, series assembly, voxel-spacing checks, and a separate
    3D detector adapter; accepting it here would be clinically misleading.
    """
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Use a de-identified PNG, JPEG, or WebP chest X-ray preview.")

    payload = await file.read()
    if not payload or len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is empty or exceeds the 20 MB research-upload limit.")

    try:
        image = Image.open(BytesIO(payload)).convert("L")
    except UnidentifiedImageError as error:
        raise HTTPException(status_code=422, detail="The uploaded file is not a readable image.") from error

    try:
        torch, xrv, model = load_cxr_model()
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    pixels = np.asarray(image)
    image_array = xrv.datasets.normalize(pixels, 255)[None, ...]
    transform = xrv.datasets.XRayCenterCrop()
    image_array = transform(image_array)
    image_array = xrv.datasets.XRayResizer(224)(image_array)
    tensor = torch.from_numpy(image_array).float()[None, ...]

    nodule_index = model.pathologies.index("Nodule")
    predictions, heatmap = grad_cam(model, tensor, nodule_index, torch)

    signals = dict(zip(model.pathologies, (float(value) for value in predictions)))
    related = {
        label: round(max(0.0, min(1.0, signals[label])), 4)
        for label in ("Nodule", "Mass", "Lung Lesion", "Lung Opacity")
        if label in signals
    }
    return CxrSignalResponse(
        modality="Chest X-ray",
        nodule_related_signal=related.get("Nodule", 0.0),
        related_signals=related,
        model="TorchXRayVision DenseNet121 (densenet121-res224-all)",
        attention_map=heatmap_data_url(heatmap),
        notice=RESEARCH_NOTICE,
    )


@app.post("/infer/ct")
async def infer_ct() -> None:
    raise HTTPException(
        status_code=501,
        detail=(
            "CT inference is intentionally not enabled in this lightweight adapter. "
            "Integrate the MONAI lung-nodule CT bundle only with a complete anonymized "
            "3D volume, the documented preprocessing, and clinical validation."
        ),
    )
