#!/usr/bin/env bash
# Run the API docs agent for production (builds frontend if needed, then uvicorn).
set -e
cd "$(dirname "$0")/.."
PORT="${PORT:-8000}"
if [ ! -d "frontend/out" ]; then
  echo "Building frontend..."
  (cd frontend && npm ci && npm run build)
fi
echo "Starting server on 0.0.0.0:${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
