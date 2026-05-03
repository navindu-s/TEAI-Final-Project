import json
from sqlalchemy.orm import Session
from ..core import models_db

def create_log(db: Session, filename: str, conf: float, imgsz: int, device: str, result: dict):
    db_log = models_db.ForeignParticleLog(
        input_data=json.dumps({"file": filename, "conf": conf, "imgsz": imgsz, "device": device}),
        predicted_output=json.dumps(result)
    )
    db.add(db_log)
    db.commit()
    return db_log
