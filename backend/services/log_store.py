"""In-memory ring buffer for log events. Replace with a DB if you need persistence."""
from collections import deque
from threading import Lock
import time
import uuid
from typing import Iterable

_BUF: deque = deque(maxlen=500)
_LOCK = Lock()


def push(severity: str, source: str, message: str) -> dict:
    evt = {
        "id": uuid.uuid4().hex[:10],
        "ts": time.time(),
        "severity": severity,
        "source": source,
        "message": message,
    }
    with _LOCK:
        _BUF.appendleft(evt)
    return evt


def latest(limit: int = 100) -> list[dict]:
    with _LOCK:
        return list(_BUF)[:limit]


def seed(events: Iterable[tuple[str, str, str]]) -> None:
    for sev, src, msg in events:
        push(sev, src, msg)
