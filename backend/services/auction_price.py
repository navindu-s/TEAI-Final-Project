"""
Auction Price Predictor — CatBoost regressor (dict bundle).

Model file:
    backend/models/component5_Best_Tea_Price_Model_Model_4_Categorical.pkl

The .pkl is a dict with keys: model, features, cat_cols, target, model_name.

Optional companion (used to surface valid Region/Estate/Grade values):
    backend/models/component5_Tea_Prices_Combined.csv
"""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
PKL_PATH = MODELS_DIR / "component5_Best_Tea_Price_Model_Model_4_Categorical.pkl"
DATASET_PATH = MODELS_DIR / "Tea_Prices_Combined.csv"

_model = None
_features: list[str] = []
_cat_cols: list[str] = []
_target: str = "Price"
_model_name: str = "Tea Price Model"
_options: dict[str, Any] = {}
_loaded = False


def _load_model():
    global _model, _features, _cat_cols, _target, _model_name, _loaded
    if _loaded:
        return
    _loaded = True
    if not PKL_PATH.exists():
        raise FileNotFoundError(f"Auction price model not found: {PKL_PATH}")
    with open(PKL_PATH, "rb") as f:
        bundle = pickle.load(f)
    if not isinstance(bundle, dict) or "model" not in bundle:
        raise ValueError("pkl is not a dict bundle with a 'model' key")
    _model = bundle["model"]
    _features = list(bundle.get("features", []))
    _cat_cols = list(bundle.get("cat_cols", []))
    _target = str(bundle.get("target", "Price"))
    _model_name = str(bundle.get("model_name", "Tea Price Model"))


def options() -> dict[str, Any]:
    """Valid Region / Estate / Grade values from the optional companion CSV."""
    global _options
    _load_model()
    if _options:
        return _options
    if not DATASET_PATH.exists():
        return {"regions": [], "grades": [], "estates_by_region": {}, "dataset_loaded": False}
    import pandas as pd
    df = pd.read_csv(DATASET_PATH)
    regions = sorted(df["Region"].astype(str).dropna().unique().tolist())
    grades = sorted(df["Grade"].astype(str).dropna().unique().tolist())
    estates_by_region = {
        r: sorted(df.loc[df["Region"].astype(str) == r, "Estate"].astype(str).dropna().unique().tolist())
        for r in regions
    }
    _options = {
        "regions": regions,
        "grades": grades,
        "estates_by_region": estates_by_region,
        "dataset_loaded": True,
    }
    return _options


def predict(req) -> dict:
    """`req` is a `schemas.AuctionRequest` (Pydantic)."""
    import pandas as pd

    _load_model()
    row = {
        "year": int(req.year),
        "month": int(req.month),
        "day_of_month": int(req.day_of_month),
        "Region": str(req.region),
        "Estate": str(req.estate),
        "Grade": str(req.grade),
    }
    cols = _features or list(row.keys())
    df = pd.DataFrame([[row[c] for c in cols]], columns=cols)
    yhat = float(_model.predict(df)[0])
    return {
        "price_per_kg": round(yhat, 2),
        "model_name": _model_name,
        "target": _target,
        "features": cols,
        "input": row,
    }
