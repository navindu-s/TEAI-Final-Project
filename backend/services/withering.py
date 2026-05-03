"""
Withering Stage Monitoring — TeaWitherNet (PyTorch) + RemainingTime (Keras → NumPy).

Model files:
    backend/models/component3_TeaWitherNet_FineTuned_v3.pth      (state_dict)
    backend/models/component3_remaining_time_model.keras

Optional companion files (recommended for accurate remaining-time):
    backend/models/component3_remaining_time_scaler.joblib       (StandardScaler from training)
    backend/models/component3_remaining_time_meta.json           (numeric_features, max_minutes, …)
"""

from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path
from typing import Any, Optional

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
TORCH_PATH = MODELS_DIR / "component3_TeaWitherNet_FineTuned_v3.pth"
KERAS_PATH = MODELS_DIR / "component3_remaining_time_model.keras"
SCALER_PATH = MODELS_DIR / "component3_remaining_time_scaler.joblib"
META_PATH = MODELS_DIR / "component3_remaining_time_meta.json"

INITIAL_WEIGHT_G = 100.0

DEFAULT_STAGE_MAP = {
    0: "Surface Moisture",
    1: "Raw",
    2: "Roll",
    3: "Toss",
    4: "Well Withered",
    5: "Over Withered",
}

DEFAULT_NUMERIC_FEATURES = [
    "humidity_pct",
    "temperature_c",
    "initial_weight_g",
    "current_weight_g",
    "weight_loss_g",
    "weight_loss_pct",
]

_torch_model = None
_device = "cpu"
_remaining_model = None
_scaler = None
_meta: dict[str, Any] = {}
_stage_map: dict[int, str] = dict(DEFAULT_STAGE_MAP)
_loaded = False


def _build_torch_model():
    import torch
    import torch.nn as nn

    class SpatialVariancePooling(nn.Module):
        def forward(self, x):
            return torch.var(x, dim=(2, 3), keepdim=True)

    class TeaWitherNet(nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.morph_stream = nn.Sequential(
                nn.Conv2d(3, 32, kernel_size=3, padding=1),
                nn.ReLU(inplace=True),
                SpatialVariancePooling(),
                nn.Flatten(),
                nn.Linear(32, 128),
                nn.ReLU(inplace=True),
            )
            self.color_stream = nn.Sequential(
                nn.Conv2d(3, 32, kernel_size=3, padding=1),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool2d((1, 1)),
                nn.Flatten(),
                nn.Linear(32, 128),
                nn.ReLU(inplace=True),
            )
            self.fc = nn.Sequential(
                nn.Linear(256, 256),
                nn.ReLU(inplace=True),
                nn.Dropout(p=0.3),
                nn.Linear(256, 128),
                nn.ReLU(inplace=True),
                nn.Linear(128, 5),
            )

        def forward(self, x):
            morph = self.morph_stream(x)
            color = self.color_stream(x)
            return self.fc(torch.cat([morph, color], dim=1))

    return TeaWitherNet()


class RemainingTimeModelNumpy:
    def __init__(self, weights):
        import numpy as np
        self.np = np
        for k, v in weights.items():
            setattr(self, k, v)
        self.bn_eps = 1e-3

    def _relu(self, x):
        return self.np.maximum(x, 0.0)

    def _bn(self, x, gamma, beta, mean, var):
        return (x - mean) / self.np.sqrt(var + self.bn_eps) * gamma + beta

    def predict(self, inputs):
        np = self.np
        if isinstance(inputs, dict):
            stage_in, num_in = inputs["stage_input"], inputs["num_input"]
        else:
            stage_in, num_in = inputs

        stage = np.asarray(stage_in, dtype=np.int64).reshape(-1, 1)
        num = np.asarray(num_in, dtype=np.float32).reshape(-1, 6)
        stage = np.clip(stage, 0, self.embedding.shape[0] - 1).astype(np.int64)
        stage_embed = self.embedding[stage[:, 0]]

        env_h = self._relu(num[:, :2] @ self.env_w + self.env_b)
        env_h = self._bn(env_h, self.bn_env_gamma, self.bn_env_beta, self.bn_env_mean, self.bn_env_var)
        mass_h = self._relu(num[:, 2:] @ self.mass_w + self.mass_b)
        mass_h = self._bn(mass_h, self.bn_mass_gamma, self.bn_mass_beta, self.bn_mass_mean, self.bn_mass_var)

        fused = np.concatenate([stage_embed, env_h, mass_h], axis=1)
        h = self._relu(fused @ self.fc_w + self.fc_b)
        h = self._relu(h @ self.fc2_w + self.fc2_b)
        return (h @ self.out_w + self.out_b).astype(np.float32)


def _load_remaining_time_weights():
    import h5py
    import numpy as np

    with zipfile.ZipFile(KERAS_PATH, "r") as z:
        weight_blob = z.read("model.weights.h5")
    with h5py.File(io.BytesIO(weight_blob), "r") as f:
        return {
            "embedding": np.array(f["layers/embedding/vars/0"], dtype=np.float32),
            "env_w": np.array(f["layers/dense/vars/0"], dtype=np.float32),
            "env_b": np.array(f["layers/dense/vars/1"], dtype=np.float32),
            "mass_w": np.array(f["layers/dense_1/vars/0"], dtype=np.float32),
            "mass_b": np.array(f["layers/dense_1/vars/1"], dtype=np.float32),
            "bn_env_gamma": np.array(f["layers/batch_normalization/vars/0"], dtype=np.float32),
            "bn_env_beta": np.array(f["layers/batch_normalization/vars/1"], dtype=np.float32),
            "bn_env_mean": np.array(f["layers/batch_normalization/vars/2"], dtype=np.float32),
            "bn_env_var": np.array(f["layers/batch_normalization/vars/3"], dtype=np.float32),
            "bn_mass_gamma": np.array(f["layers/batch_normalization_1/vars/0"], dtype=np.float32),
            "bn_mass_beta": np.array(f["layers/batch_normalization_1/vars/1"], dtype=np.float32),
            "bn_mass_mean": np.array(f["layers/batch_normalization_1/vars/2"], dtype=np.float32),
            "bn_mass_var": np.array(f["layers/batch_normalization_1/vars/3"], dtype=np.float32),
            "fc_w": np.array(f["layers/dense_2/vars/0"], dtype=np.float32),
            "fc_b": np.array(f["layers/dense_2/vars/1"], dtype=np.float32),
            "fc2_w": np.array(f["layers/dense_3/vars/0"], dtype=np.float32),
            "fc2_b": np.array(f["layers/dense_3/vars/1"], dtype=np.float32),
            "out_w": np.array(f["layers/dense_4/vars/0"], dtype=np.float32),
            "out_b": np.array(f["layers/dense_4/vars/1"], dtype=np.float32),
        }


def _image_transform():
    from torchvision import transforms
    return transforms.Compose(
        [
            transforms.CenterCrop(600),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )


def _load_all():
    global _torch_model, _device, _remaining_model, _scaler, _meta, _stage_map, _loaded
    if _loaded:
        return
    _loaded = True

    if not TORCH_PATH.exists():
        raise FileNotFoundError(f"Withering torch model not found: {TORCH_PATH}")
    if not KERAS_PATH.exists():
        raise FileNotFoundError(f"Withering remaining-time model not found: {KERAS_PATH}")

    import torch
    _device = "cuda" if torch.cuda.is_available() else "cpu"
    model = _build_torch_model().to(_device)
    try:
        state = torch.load(str(TORCH_PATH), map_location=_device, weights_only=True)
    except TypeError:
        state = torch.load(str(TORCH_PATH), map_location=_device)
    model.load_state_dict(state, strict=True)
    model.eval()
    _torch_model = model

    _remaining_model = RemainingTimeModelNumpy(_load_remaining_time_weights())

    if SCALER_PATH.exists():
        import joblib
        _scaler = joblib.load(SCALER_PATH)
    if META_PATH.exists():
        with open(META_PATH, "r", encoding="utf-8") as f:
            _meta = json.load(f)
        sm = _meta.get("stage_map")
        if sm:
            _stage_map = {int(k): v for k, v in sm.items()}


def _cumulative_to_class_probs(cumulative):
    import numpy as np
    cumulative = np.clip(np.asarray(cumulative, dtype=np.float32), 0.0, 1.0)
    n = cumulative.shape[0] + 1
    p = np.zeros(n, dtype=np.float32)
    p[0] = 1.0 - cumulative[0]
    for i in range(1, n - 1):
        p[i] = cumulative[i - 1] - cumulative[i]
    p[-1] = cumulative[-1]
    p = np.clip(p, 0.0, None)
    s = p.sum()
    return p / s if s > 0 else np.full(n, 1.0 / n, dtype=np.float32)


def _surface_moisture_override(image, stage_id, class_probs):
    import cv2
    import numpy as np

    if stage_id != 1:
        return stage_id, class_probs
    cv_img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
    _, leaf_mask = cv2.threshold(hsv[:, :, 1], 30, 255, cv2.THRESH_BINARY)
    _, glare_mask = cv2.threshold(hsv[:, :, 2], 160, 255, cv2.THRESH_BINARY)
    leaf_mask_d = cv2.dilate(leaf_mask, np.ones((15, 15), np.uint8), iterations=1)
    moisture_spots = cv2.bitwise_and(glare_mask, leaf_mask_d)
    leaf_pixels = int(cv2.countNonZero(leaf_mask))
    if leaf_pixels > 1000 and (cv2.countNonZero(moisture_spots) / leaf_pixels) > 0.02:
        class_probs = class_probs.copy()
        class_probs[0] = 0.8
        class_probs[1] = 0.2
        class_probs[2:] = 0.0
        return 0, class_probs
    return stage_id, class_probs


def _predict_stage(image):
    import torch
    from PIL import ImageOps

    image = ImageOps.exif_transpose(image).convert("RGB")
    x = _image_transform()(image).unsqueeze(0).to(_device)
    with torch.no_grad():
        cumulative = torch.sigmoid(_torch_model(x)).cpu().numpy()[0]
    stage_id = int((cumulative > 0.5).sum())
    class_probs = _cumulative_to_class_probs(cumulative)
    return _surface_moisture_override(image, stage_id, class_probs) + (cumulative,)


def _predict_remaining_minutes(stage_id: int, hum: float, temp: float, weight: float) -> float:
    import numpy as np

    weight_loss_g = INITIAL_WEIGHT_G - weight
    weight_loss_pct = weight_loss_g / INITIAL_WEIGHT_G * 100.0
    payload = {
        "humidity_pct": hum,
        "temperature_c": temp,
        "initial_weight_g": INITIAL_WEIGHT_G,
        "current_weight_g": weight,
        "weight_loss_g": weight_loss_g,
        "weight_loss_pct": weight_loss_pct,
    }
    feature_order = _meta.get("numeric_features", DEFAULT_NUMERIC_FEATURES)
    vec = np.array([[payload[k] for k in feature_order]], dtype=np.float32)

    if _scaler is not None:
        import pandas as pd
        df = pd.DataFrame(vec, columns=feature_order)
        vec = _scaler.transform(df)

    pred = float(
        _remaining_model.predict({
            "stage_input": np.array([[stage_id]], dtype=np.float32),
            "num_input": vec,
        }).reshape(-1)[0]
    )
    if stage_id in set(_meta.get("rule_based_zero_stages", [])):
        pred = 0.0
    max_minutes = float(_meta.get("max_minutes", 720))
    pred = max(0.0, min(pred, max_minutes))
    round_to = int(_meta.get("round_to_minutes", 10))
    if round_to > 0:
        pred = float(round(pred / round_to) * round_to)
    return pred


def predict(image_bytes: bytes, *, temperature: float, humidity: float, weight: float) -> dict:
    from PIL import Image

    _load_all()
    image = Image.open(io.BytesIO(image_bytes))
    stage_id, class_probs, cumulative = _predict_stage(image)
    stage_name = _stage_map.get(stage_id, f"Stage {stage_id}")
    weight_loss_g = INITIAL_WEIGHT_G - weight
    weight_loss_pct = weight_loss_g / INITIAL_WEIGHT_G * 100.0
    remaining = _predict_remaining_minutes(stage_id, humidity, temperature, weight)
    return {
        "stage_id": stage_id,
        "stage_name": stage_name,
        "stage_confidence": round(float(class_probs[stage_id]), 4),
        "class_probs": {
            _stage_map.get(i, f"Stage {i}"): round(float(p), 4)
            for i, p in enumerate(class_probs)
        },
        "cumulative_probs": [round(float(c), 4) for c in cumulative],
        "remaining_time_min": remaining,
        "remaining_time_hr": round(remaining / 60.0, 2),
        "sensors": {
            "temperature_c": temperature,
            "humidity_pct": humidity,
            "current_weight_g": weight,
            "initial_weight_g": INITIAL_WEIGHT_G,
            "weight_loss_g": round(weight_loss_g, 2),
            "weight_loss_pct": round(weight_loss_pct, 2),
        },
        "scaler_loaded": _scaler is not None,
    }
