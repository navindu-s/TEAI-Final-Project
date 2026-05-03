# TEAI Platform

Industrial control-room dashboard + FastAPI backend for an IoT + AI tea-processing.

```
New TEAI/
├── backend/      FastAPI + 5 AI services + ESP32 bridge
├── frontend/     React + TypeScript + Vite + Tailwind dashboard
└── .venv/        Python virtual environment (created on first run)
```

## Run

**Terminal 1 — backend**

```bash
cd "/Users/sachi/Desktop/New TEAI"
source .venv/bin/activate
./backend/run.sh
```

Listening on http://localhost:8000 — open `/docs` for the interactive API.

**Terminal 2 — frontend**

```bash
cd "/Users/sachi/Desktop/New TEAI/frontend"
npm run dev
```

Open http://localhost:5173.

## First-time setup

```bash
# Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install
cp .env.example .env
```

## Where things live

- `backend/models/` — drop your trained `.keras` / `.pt` / `.pkl` files here
- `backend/services/` — one file per AI component, with the model loader
- `backend/routers/` — FastAPI route handlers
- `frontend/src/hooks/useTelemetry.tsx` — single seam between dashboard and backend (auto-detects `VITE_BACKEND_URL` from `frontend/.env`)
- `frontend/src/pages/` — the 7 routed pages
- `frontend/src/components/panels/` — the 6 dashboard panels

See `backend/README.md` for backend-specific details.
