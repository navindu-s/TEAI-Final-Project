import json
from sqlalchemy.orm import Session
from ..core import models_db

def create_log(db: Session, filename: str, result: dict):
    db_log = models_db.VisionTasterLog(
        input_data=json.dumps({"file": filename}),
        predicted_output=json.dumps(result)
    )
    db.add(db_log)
    db.commit()
    return db_log
