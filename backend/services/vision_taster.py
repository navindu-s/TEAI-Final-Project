"""
Vision Taster — multi-head CNN (5 attribute heads, 3 ordinal classes each).

Model file:
    backend/models/component1_vision_taster.keras
Optional companion (else IMG_SIZE=224 is used):
    backend/models/component1_vision_taster_config.json   ({"IMG_SIZE": 224})

Inference path matches the original notebook:
    tf.io.read_file → decode_jpeg → resize → /255.0
"""

from __future__ import annotations

import io
import json
import tempfile
from pathlib import Path
from typing import Optional

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODELS_DIR / "component1_vision_taster.keras"
CONFIG_PATH = MODELS_DIR / "component1_vision_taster_config.json"

HEADS = ["blackness", "twist", "evenness", "bloom", "cleanliness"]

ATTRIBUTE_NAMES = {
    "blackness": "Blackness",
    "twist": "Twist / Wiry",
    "evenness": "Evenness",
    "bloom": "Bloom",
    "cleanliness": "Cleanliness",
}

ADJECTIVES = {
    "blackness": ["Light/Greenish", "Blackish-brown", "Very Black"],
    "twist": ["Loose/Open", "Moderately Twisted", "Highly Twisted/Wiry"],
    "evenness": ["Uneven", "Fairly Even", "Very Even"],
    "bloom": ["Low", "Slight", "Strong"],
    "cleanliness": ["Dirty", "Moderate", "Clean"],
}

NOTES = {
    "blackness": [
        "Lighter tone; may show greenish or brownish cast.",
        "Balanced darkness with moderate black appearance.",
        "Deep dark black appearance with stronger oxidation look.",
    ],
    "twist": [
        "Leaf particles look more open and less wiry.",
        "Moderately twisted with some defined strands.",
        "Tightly twisted and clearly wiry appearance.",
    ],
    "evenness": [
        "Particle size and shape vary noticeably.",
        "Reasonably consistent with some variation.",
        "Very uniform particle size and shape.",
    ],
    "bloom": [
        "Low bloom and duller surface finish.",
        "Slight visible bloom under lighting.",
        "Strong bloom or sheen on the surface.",
    ],
    "cleanliness": [
        "More visible impurities or stalk-like content.",
        "Moderately clean with minor impurities.",
        "Clean appearance with very few impurities.",
    ],
}

_model = None
_img_size: int = 224
_loaded = False


def _confidence_tag(value: float) -> str:
    if value >= 0.85:
        return "high confidence"
    if value >= 0.65:
        return "moderate confidence"
    return "low confidence"


def _build_summary(preds: dict, confs: dict) -> str:
    return (
        f"Leaf appearance is {ADJECTIVES['blackness'][preds['blackness']]} "
        f"({_confidence_tag(confs['blackness'])}). "
        f"Twist is {ADJECTIVES['twist'][preds['twist']]} "
        f"({_confidence_tag(confs['twist'])}). "
        f"Evenness is {ADJECTIVES['evenness'][preds['evenness']]} "
        f"({_confidence_tag(confs['evenness'])}). "
        f"Bloom is {ADJECTIVES['bloom'][preds['bloom']]} "
        f"({_confidence_tag(confs['bloom'])}). "
        f"Cleanliness is {ADJECTIVES['cleanliness'][preds['cleanliness']]} "
        f"({_confidence_tag(confs['cleanliness'])})."
    )


def _load_model():
    global _model, _img_size, _loaded
    if _loaded:
        return
    _loaded = True
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Vision Taster model not found: {MODEL_PATH}")
    import tensorflow as tf
    _model = tf.keras.models.load_model(str(MODEL_PATH), compile=False)
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            _img_size = int(json.load(f).get("IMG_SIZE", 224))


def _preprocess_exact_notebook(image_bytes: bytes):
    """tf.io.read_file → decode_jpeg → resize → /255.0 — same as the original notebook."""
    import tensorflow as tf
    from PIL import Image

    pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        pil.save(tmp.name, format="JPEG", quality=95)
        path = tmp.name

    img = tf.io.read_file(path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, (_img_size, _img_size))
    img = tf.cast(img, tf.float32) / 255.0
    return img[None, ...].numpy()


def _predict_heads(x):
    import numpy as np

    raw = _model.predict(x, verbose=0)
    if isinstance(raw, dict):
        probs_by_head = {h: np.asarray(raw[h]) for h in HEADS}
    else:
        out_names = list(getattr(_model, "output_names", []))
        probs_by_head = {}
        if out_names and set(HEADS).issubset(set(out_names)):
            for idx, name in enumerate(out_names):
                if name in HEADS:
                    probs_by_head[name] = np.asarray(raw[idx])
        else:
            for idx, head in enumerate(HEADS):
                probs_by_head[head] = np.asarray(raw[idx])

    preds, confs, probs = {}, {}, {}
    for head in HEADS:
        p = probs_by_head[head]
        if p.ndim == 1:
            p = p[None, :]
        p = p.astype(float)
        preds[head] = int(np.argmax(p, axis=1)[0])
        confs[head] = float(np.max(p, axis=1)[0])
        probs[head] = p[0].tolist()
    return preds, confs, probs


def predict(image_bytes: bytes) -> dict:
    _load_model()
    x = _preprocess_exact_notebook(image_bytes)
    preds, confs, probs = _predict_heads(x)

    rows = [
        {
            "head": h,
            "name": ATTRIBUTE_NAMES[h],
            "class": preds[h],
            "label": ["Low", "Medium", "High"][preds[h]],
            "adjective": ADJECTIVES[h][preds[h]],
            "confidence": round(confs[h], 4),
            "probs": [round(p, 4) for p in probs[h]],
            "note": NOTES[h][preds[h]],
        }
        for h in HEADS
    ]

    score = sum(preds[h] for h in HEADS)
    if score >= 8:
        grade = "Premium · Grade A"
    elif score >= 6:
        grade = "Standard · Grade B"
    elif score >= 4:
        grade = "Below Standard · Grade C"
    else:
        grade = "Reject"

    mean_conf = sum(confs[h] for h in HEADS) / len(HEADS)
    return {
        "grade": grade,
        "score": score,
        "mean_confidence": round(mean_conf, 4),
        "summary": _build_summary(preds, confs),
        "heads": rows,
        "img_size": _img_size,
    }
