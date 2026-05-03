import json
from fastapi import APIRouter, File, Form, UploadFile, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ...crud import foreign_particle as crud_fp
from ...services import foreign_particle, last_results, log_store

router = APIRouter(prefix="/api/v1/foreign-particle", tags=["foreign-particle"])


@router.post("/scan")
async def scan(
    image: UploadFile = File(...),
    conf: float = Form(0.15),
    imgsz: int = Form(768),
    device: str = Form("cpu"),
    db: Session = Depends(get_db)
):
    image_bytes = await image.read()
    result = foreign_particle.predict(
        image_bytes,
        conf=float(conf),
        imgsz=int(imgsz),
        device=str(device),
    )
    
    crud_fp.create_log(db, image.filename, float(conf), int(imgsz), str(device), result)
    
    last_results.store("foreign-particle", {"file": image.filename, **result})
    if result["auto_stop"]:
        log_store.push(
            "danger",
            "FP Detector",
            f"{len(result['detections'])} foreign particle(s) detected — auto-stop",
        )
    else:
        log_store.push("info", "FP Detector", "Frame clear")
    return result


@router.get("/last")
def last():
    return last_results.get("foreign-particle") or {"empty": True}
