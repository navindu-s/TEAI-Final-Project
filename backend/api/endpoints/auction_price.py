import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...schemas import AuctionRequest
from ..dependencies import get_db
from ...crud import auction_price as crud_ap
from ...services import auction_price, last_results, log_store

router = APIRouter(prefix="/api/v1/auction-price", tags=["auction-price"])


@router.get("/options")
def get_options():
    """Valid Region / Estate / Grade values from the optional companion CSV."""
    return auction_price.options()


@router.post("/predict")
def predict(req: AuctionRequest, db: Session = Depends(get_db)):
    result = auction_price.predict(req)
    
    crud_ap.create_log(db, req.model_dump_json(), result)
    
    last_results.store("auction-price", result)
    log_store.push("info", "Auction ML", f"Rs {result['price_per_kg']:.2f}/kg")
    return result


@router.get("/last")
def last():
    return last_results.get("auction-price") or {"empty": True}
