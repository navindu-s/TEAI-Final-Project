"""
ESP32 bridge — conveyor / lights / sensors.

Supports two modes:
  A) TCP: Raw socket connection to ESP32 (like in Streamlit version)
  B) Mock: For testing the dashboard without hardware connected.
"""

import socket
import time
import random
import threading

_config = {
    "mode": "mock",
    "ip": "172.20.10.5",
    "port": 8080
}

_state = {"conveyor": "STOPPED", "lights": "OFF"}
_initial_weight = 100.0
_started_ts = time.time()

def _conveyor_pulse_loop():
    while True:
        if _state["conveyor"] == "RUNNING_CONT":
            if _config["mode"] == "tcp":
                _send_tcp("run", connect_timeout=2.0, read_timeout=0.5)
            time.sleep(1.0)
        else:
            time.sleep(0.1)

threading.Thread(target=_conveyor_pulse_loop, daemon=True).start()



def set_config(mode: str, ip: str, port: int):
    global _config
    _config["mode"] = mode
    _config["ip"] = ip
    _config["port"] = port
    return _config


def _send_tcp(cmd: str, connect_timeout: float = 5.0, read_timeout: float = 2.0) -> str:
    ip = _config["ip"]
    port = _config["port"]
    try:
        with socket.create_connection((ip, port), timeout=connect_timeout) as sock:
            sock.settimeout(read_timeout)
            try:
                sock.sendall((cmd.strip() + "\n").encode("utf-8"))
            except (ConnectionResetError, BrokenPipeError):
                return ""
            try:
                data = sock.recv(512)
                return data.decode("utf-8", errors="ignore").strip()
            except (socket.timeout, ConnectionResetError, BrokenPipeError):
                return ""
    except Exception:
        return ""


def send_command(target: str, state: str) -> dict:
    """target: 'conveyor' | 'lights'   state: 'RUNNING_CONT'|'RUNNING_STEP'|'STOPPED'|'ON'|'OFF'"""
    cmd_map = {
        ("conveyor", "RUNNING_CONT"): "run",
        ("conveyor", "RUNNING_STEP"): "run",
        ("conveyor", "STOPPED"): "stop",
        ("lights", "ON"): "light_n",
        ("lights", "OFF"): "light_f",
    }
    cmd = cmd_map.get((target, state), "NOOP")

    resp = ""
    if _config["mode"] == "tcp" and cmd != "NOOP":
        resp = _send_tcp(cmd)

    _state[target] = state
    
    if target == "conveyor" and state == "RUNNING_STEP":
        _state[target] = "STOPPED"

    return {"ok": True, "command": cmd, "response": resp, "ack_ts": time.time()}


def read_sensors() -> dict:
    elapsed = time.time() - _started_ts
    weight = max(70.0, _initial_weight - elapsed * 0.0035)
    temp = 24.5 + random.uniform(-0.3, 0.3) + 0.5 * (elapsed / 3600.0)
    hum = 62.0 + random.uniform(-0.6, 0.6)
    
    if _config["mode"] == "tcp":
        raw = _send_tcp("states")
        if raw:
            parts = [p.strip() for p in raw.split(",") if p.strip()]
            for part in parts:
                if ":" not in part: continue
                key, value = part.split(":", 1)
                key = key.strip().lower()
                try:
                    if key == "temp":
                        temp = float(value)
                    elif key == "hum":
                        hum = float(value)
                    elif key == "load":
                        weight = float(value) / 1000.0  # Scale raw load to roughly grams (mock conversion)
                except ValueError:
                    pass

    return {
        "temperature": round(temp, 1),
        "humidity": round(hum, 1),
        "weight": round(weight, 1),
        "weight_loss_pct": round((100.0 - weight) / 100.0 * 100.0, 1) if _config["mode"] == "mock" else 0.0,
    }


def get_state() -> dict:
    return {
        "connected": _config["mode"] == "tcp",
        "conveyor": _state["conveyor"],
        "lights": _state["lights"],
        "mode": _config["mode"],
        "ip": _config["ip"],
        "port": _config["port"],
    }
