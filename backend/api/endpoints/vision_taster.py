import json
from fastapi import APIRouter, File, UploadFile, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ...crud import vision_taster as crud_vt
from ...services import last_results, log_store, vision_taster

router = APIRouter(prefix="/api/v1/vision-taster", tags=["vision-taster"])


@router.post("/predict")
async def predict(image: UploadFile = File(...), db: Session = Depends(get_db)):
    image_bytes = await image.read()
    result = vision_taster.predict(image_bytes)
    
    crud_vt.create_log(db, image.filename, result)
    
    last_results.store("vision-taster", {"file": image.filename, **result})
    log_store.push("info", "Vision Taster", f"{result['grade']} (score {result['score']}/10)")
    return result


@router.get("/last")
def last():
    return last_results.get("vision-taster") or {"empty": True}
