"""
Plucking Quality Grading — 3-class image classifier.

Model file:
    backend/models/component2_plucking_quality.keras

Optional companion (else CLASSES + IMG_SIZE=224 are used):
    backend/models/component2_plucking_quality_meta.json   ({"classes": [...], "img_size": 224})

Loads via the same trick the original Streamlit app uses:
    @keras.saving.register_keras_serializable(package="builtins")
    def preprocess_input(x): return x
"""

from __future__ import annotations

import io
import json
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODELS_DIR / "component2_plucking_quality.keras"
META_PATH = MODELS_DIR / "component2_plucking_quality_meta.json"

DEFAULT_CLASSES = ["Below Best", "Best", "Poor"]
DEFAULT_IMG_SIZE = 224

_model = None
_classes: list[str] = list(DEFAULT_CLASSES)
_img_size: int = DEFAULT_IMG_SIZE
_loaded = False
_register_done = False


def _register_serializable():
    global _register_done
    if _register_done:
        return
    import keras

    @keras.saving.register_keras_serializable(package="builtins")
    def preprocess_input(x):
        return x
    _register_done = True


def _load_model():
    global _model, _classes, _img_size, _loaded
    if _loaded:
        return
    _loaded = True
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Plucking model not found: {MODEL_PATH}")
    _register_serializable()
    import tensorflow as tf
    _model = tf.keras.models.load_model(str(MODEL_PATH))
    if META_PATH.exists():
        with open(META_PATH, "r", encoding="utf-8") as f:
            meta = json.load(f)
        _classes = list(meta.get("classes", DEFAULT_CLASSES))
        _img_size = int(meta.get("img_size", DEFAULT_IMG_SIZE))


def _category_status(label: str) -> str:
    lbl = label.lower()
    if "best" in lbl and "below" not in lbl:
        return "ok"
    if "below" in lbl:
        return "warn"
    if "poor" in lbl:
        return "danger"
    return "info"


def predict(image_bytes: bytes) -> dict:
    import numpy as np
    from PIL import Image

    _load_model()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize((_img_size, _img_size))
    x = np.array(img, dtype=np.float32) / 255.0
    x = np.expand_dims(x, axis=0)
    probs = _model.predict(x, verbose=0)[0]
    idx = int(np.argmax(probs))
    label = _classes[idx] if idx < len(_classes) else f"class-{idx}"
    return {
        "predicted_class": label,
        "confidence": round(float(probs[idx]), 4),
        "status": _category_status(label),
        "probs": {
            (_classes[i] if i < len(_classes) else f"class-{i}"): round(float(p), 4)
            for i, p in enumerate(probs)
        },
        "img_size": _img_size,
    }


def class_names() -> list[str]:
    _load_model()
    return list(_classes)
