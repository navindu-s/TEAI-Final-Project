import json
from sqlalchemy.orm import Session
from ..core import models_db

def create_log(db: Session, req_json: str, result: dict):
    db_log = models_db.AuctionPriceLog(
        input_data=req_json,
        predicted_output=json.dumps(result)
    )
    db.add(db_log)
    db.commit()
    return db_log
