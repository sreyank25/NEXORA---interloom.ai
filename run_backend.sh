#!/usr/bin/env bash
# Script to set up and run the Python FastAPI AI Backend
set -e

echo "=================================================="
echo " Starting Smart Shortlisting AI Backend (Port 8000)"
echo "=================================================="

cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    echo "[1/3] Creating Python virtual environment (venv)..."
    python3 -m venv venv
fi

echo "[2/3] Activating virtual environment & checking dependencies..."
source venv/bin/activate
pip install -r requirements.txt

echo "[3/3] Launching FastAPI server with Uvicorn..."
echo "Swagger docs available at: http://127.0.0.1:8000/docs"
echo "Health check available at: http://127.0.0.1:8000/health"
uvicorn main:app --reload --port 8000
