from typing import Literal
from pydantic import BaseModel

Severity = Literal["ok", "warn", "danger", "info"]


class ESP32Command(BaseModel):
    state: str  # "RUNNING_CONT" | "RUNNING_STEP" | "STOPPED" | "ON" | "OFF"


class AuctionRequest(BaseModel):
    """Matches the trained CatBoost feature schema:
    ['year', 'month', 'day_of_month', 'Region', 'Estate', 'Grade'].
    """
    year: int
    month: int
    day_of_month: int
    region: str
    estate: str
    grade: str

class ESP32Config(BaseModel):
    mode: str  # "tcp" or "mock"
    ip: str = "172.20.10.5"
    port: int = 8080
