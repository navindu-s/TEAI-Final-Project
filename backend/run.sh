#!/usr/bin/env bash
# Run from the project root: ./backend/run.sh
set -e
cd "$(dirname "$0")/.."
source venv/bin/activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
