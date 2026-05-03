from fastapi import APIRouter
from ...services import log_store

router = APIRouter(prefix="/api/v1", tags=["logs"])

@router.get("/logs")
def get_logs(limit: int = 100):
    return {"events": log_store.latest(limit)}
