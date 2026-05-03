import json
from fastapi import APIRouter, File, UploadFile, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ...crud import plucking as crud_plucking
from ...services import last_results, log_store, plucking

router = APIRouter(prefix="/api/v1/plucking", tags=["plucking"])


@router.post("/classify")
async def classify(image: UploadFile = File(...), db: Session = Depends(get_db)):
    image_bytes = await image.read()
    result = plucking.predict(image_bytes)
    
    crud_plucking.create_log(db, image.filename, result)
    
    last_results.store("plucking", {"file": image.filename, **result})
    log_store.push("info", "Plucking", f"{result['predicted_class']} ({result['confidence']:.0%})")
    return result


@router.get("/classes")
def classes():
    return {"classes": plucking.class_names()}


@router.get("/last")
def last():
    return last_results.get("plucking") or {"empty": True}
