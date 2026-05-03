from fastapi import APIRouter, HTTPException
from ...schemas import ESP32Command, ESP32Config
from ...services import esp32, log_store

router = APIRouter(prefix="/api/v1/esp32", tags=["esp32"])

@router.post("/config")
def update_config(cfg: ESP32Config):
    esp32.set_config(cfg.mode, cfg.ip, cfg.port)
    log_store.push("info", "ESP32", f"Config updated: {cfg.mode} ({cfg.ip}:{cfg.port})")
    return {"ok": True}

@router.get("/state")
def state():
    return esp32.get_state()


@router.get("/sensors")
def sensors():
    return esp32.read_sensors()


@router.post("/conveyor")
def conveyor(cmd: ESP32Command):
    if cmd.state not in {"RUNNING_CONT", "RUNNING_STEP", "STOPPED"}:
        raise HTTPException(400, "state must be RUNNING_CONT, RUNNING_STEP, or STOPPED")
    ack = esp32.send_command("conveyor", cmd.state)
    log_store.push("info", "ESP32", f"Conveyor → {cmd.state}")
    return ack


@router.post("/lights")
def lights(cmd: ESP32Command):
    if cmd.state not in {"ON", "OFF"}:
        raise HTTPException(400, "state must be ON or OFF")
    ack = esp32.send_command("lights", cmd.state)
    log_store.push("info", "ESP32", f"Lights → {cmd.state}")
    return ack
