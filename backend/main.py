from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.endpoints import (
    auction_price,
    esp32,
    foreign_particle,
    logs,
    plucking,
    vision_taster,
    withering,
)
from .services import log_store
from .core.database import engine
from .core import models_db

models_db.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TEAI Platform Backend", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vision_taster.router)
app.include_router(plucking.router)
app.include_router(withering.router)
app.include_router(foreign_particle.router)
app.include_router(auction_price.router)
app.include_router(esp32.router)
app.include_router(logs.router)


@app.on_event("startup")
def _seed():
    log_store.push("info", "Backend", "FastAPI online · 5 inference services registered")


@app.get("/health")
def health():
    return {"ok": True}
