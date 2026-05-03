import json
from fastapi import APIRouter, File, Form, UploadFile, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ...crud import withering as crud_withering
from ...services import esp32, last_results, log_store, withering

router = APIRouter(prefix="/api/v1/withering", tags=["withering"])


@router.post("/predict")
async def predict(
    image: UploadFile = File(...),
    temperature: float | None = Form(None),
    humidity: float | None = Form(None),
    weight: float | None = Form(None),
    db: Session = Depends(get_db)
):
    """Run a full withering prediction. If sensor values are not provided,
    they are read from the ESP32 bridge (or its mock fallback)."""
    image_bytes = await image.read()

    if temperature is None or humidity is None or weight is None:
        sensors = esp32.read_sensors()
        if temperature is None:
            temperature = sensors["temperature"]
        if humidity is None:
            humidity = sensors["humidity"]
        if weight is None:
            weight = sensors["weight"]

    result = withering.predict(
        image_bytes,
        temperature=float(temperature),
        humidity=float(humidity),
        weight=float(weight),
    )
    
    crud_withering.create_log(db, image.filename, float(temperature), float(humidity), float(weight), result)
    
    last_results.store("withering", {"file": image.filename, **result})
    log_store.push(
        "info",
        "Withering",
        f"{result['stage_name']} · {result['remaining_time_min']:.0f} min remaining",
    )
    return result


@router.get("/last")
def last():
    return last_results.get("withering") or {"empty": True}
