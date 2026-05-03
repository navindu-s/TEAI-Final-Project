import json
from sqlalchemy.orm import Session
from ..core import models_db

def create_log(db: Session, filename: str, temperature: float, humidity: float, weight: float, result: dict):
    db_log = models_db.WitheringLog(
        input_data=json.dumps({"file": filename, "temperature": temperature, "humidity": humidity, "weight": weight}),
        predicted_output=json.dumps(result)
    )
    db.add(db_log)
    db.commit()
    return db_log
