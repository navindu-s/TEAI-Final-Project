"""Tiny in-memory cache of the most recent prediction per component.
Lets the dashboard home show a snapshot without re-running inference."""

from threading import Lock
import time
from typing import Any, Optional

_LOCK = Lock()
_BUF: dict[str, dict[str, Any]] = {}


def store(component: str, payload: dict[str, Any]) -> None:
    with _LOCK:
        _BUF[component] = {"ts": time.time(), "payload": payload}


def get(component: str) -> Optional[dict[str, Any]]:
    with _LOCK:
        return _BUF.get(component)


def all() -> dict[str, dict[str, Any]]:
    with _LOCK:
        return dict(_BUF)
