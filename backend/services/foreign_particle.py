"""
Foreign Particle Detection — YOLOv8 (Ultralytics).

Model file:
    backend/models/component4_foreign_particle_detector_best.pt

Inference signature mirrors the Streamlit script:
    model.predict(source=frame_bgr, conf=conf, imgsz=imgsz, device=device, verbose=False)
"""

from __future__ import annotations

import io
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
WEIGHTS_PATH = MODELS_DIR / "component4_foreign_particle_detector_best.pt"

_model = None
_loaded = False


def _load_model():
    global _model, _loaded
    if _loaded:
        return
    _loaded = True
    if not WEIGHTS_PATH.exists():
        raise FileNotFoundError(f"YOLOv8 weights not found: {WEIGHTS_PATH}")
    from ultralytics import YOLO
    _model = YOLO(str(WEIGHTS_PATH))


def predict(image_bytes: bytes, *, conf: float = 0.15, imgsz: int = 768, device: str = "cpu") -> dict:
    import cv2
    import numpy as np
    from PIL import Image

    _load_model()
    pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    frame_bgr = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    results = _model.predict(
        source=frame_bgr,
        conf=conf,
        imgsz=imgsz,
        device=device,
        verbose=False,
    )
    result = results[0]
    detections = []
    if result.boxes is not None:
        names = getattr(_model, "names", {}) or {}
        h, w = frame_bgr.shape[:2]
        for box in result.boxes:
            cls_id = int(box.cls.item()) if box.cls is not None else 0
            label = (
                names.get(cls_id, f"class-{cls_id}")
                if isinstance(names, dict)
                else (names[cls_id] if cls_id < len(names) else f"class-{cls_id}")
            )
            c = float(box.conf.item()) if box.conf is not None else 0.0
            x1, y1, x2, y2 = map(float, box.xyxy[0].tolist())
            detections.append({
                "class_id": cls_id,
                "label": label,
                "confidence": round(c, 4),
                "bbox_pixels": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                "bbox_norm": [round(x1 / w, 4), round(y1 / h, 4), round((x2 - x1) / w, 4), round((y2 - y1) / h, 4)],
            })

    return {
        "detections": detections,
        "auto_stop": len(detections) > 0,
        "image_size": {"width": frame_bgr.shape[1], "height": frame_bgr.shape[0]},
        "conf_threshold": conf,
        "imgsz": imgsz,
    }
