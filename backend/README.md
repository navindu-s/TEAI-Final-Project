# TEAI Backend

FastAPI service that hosts the 5 AI components and the ESP32 bridge.
Runs even with **no models uploaded yet** — each service falls back to a
realistic mock so you can verify the full pipeline before training is
done.

## 1. Install

```bash
cd "New TEAI"
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

If you don't need every framework, comment out lines in
`backend/requirements.txt` you won't use (e.g. drop `tensorflow` if all
your models are PyTorch).

## 2. Upload your 5 trained models

Drop files into `backend/models/` with these exact filenames:

| Component         | Filename                                                 |
| ----------------- | -------------------------------------------------------- |
| Vision Taster     | `vision_taster.pt` **or** `vision_taster.keras`          |
| Plucking          | `plucking.pt` **or** `plucking.keras`                    |
| Withering         | `withering_torch.pt` **and** `withering_keras.keras`     |
| Foreign Particle  | `foreign_particle.pt`  (YOLOv8 weights)                  |
| Auction Price     | `auction_price.pkl` **or** `auction_price.joblib`        |

After uploading, open the matching `backend/services/<name>.py` and
implement the `_predict_with_model()` body — preprocessing has to match
how each model was trained. Each file has a worked example in comments.

## 3. Run

```bash
./backend/run.sh
# OR
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open http://localhost:8000/docs for an interactive API explorer.

## 4. Connect the dashboard

```bash
cp .env.example .env       # at the project root
npm run dev
```

The frontend reads `VITE_BACKEND_URL` and switches from mock mode to
real WebSocket streaming + real ESP32 commands automatically.

## 5. ESP32 hardware

Two integration modes — pick one:

- **Serial (USB)** — `export ESP32_SERIAL=/dev/ttyUSB0` (or `COM3`).
  Firmware should accept ASCII commands `BELT_RUN`, `BELT_STOP`,
  `LIGHT_ON`, `LIGHT_OFF` (newline-terminated) and emit JSON sensor
  lines `{"temperature":..., "humidity":..., "weight":...}`.
- **HTTP** — `export ESP32_URL=http://192.168.1.42`. ESP32 hosts a
  small webserver with `POST /conveyor`, `POST /lights`, `GET /sensors`.

Without either env var set, `services/esp32.py` produces sane mock
sensor values that drift over time.

## API surface

```
GET  /health
GET  /api/v1/vision-taster/predict
POST /api/v1/vision-taster/predict       (multipart "image")
GET  /api/v1/plucking/classify
POST /api/v1/plucking/classify           (multipart "image")
GET  /api/v1/withering/state
GET  /api/v1/foreign-particle/scan
POST /api/v1/foreign-particle/scan       (multipart "image")
GET  /api/v1/auction-price/predict
POST /api/v1/auction-price/predict       (JSON body)
GET  /api/v1/esp32/state
GET  /api/v1/esp32/sensors
POST /api/v1/esp32/conveyor              {"state":"RUNNING"|"STOPPED"}
POST /api/v1/esp32/lights                {"state":"ON"|"OFF"}
GET  /api/v1/logs?limit=100
WS   /api/v1/stream                      unified 2-Hz telemetry
```

## Project layout

```
backend/
  main.py                  # FastAPI app + CORS
  schemas.py               # Pydantic request/response models
  run.sh
  requirements.txt
  models/                  # ← drop your trained weights here
  services/                # model loaders + ESP32 bridge + log buffer
    vision_taster.py
    plucking.py
    withering.py
    foreign_particle.py
    auction_price.py
    esp32.py
    log_store.py
  routers/                 # FastAPI route handlers (one per service)
```
