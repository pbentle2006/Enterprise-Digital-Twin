#!/usr/bin/env bash
set -euo pipefail

# Start databases
if command -v docker >/dev/null 2>&1; then
  echo "[demo] Starting MongoDB and Neo4j via docker compose..."
  docker compose up -d
else
  echo "[demo] Docker not found. Please start MongoDB and Neo4j manually or install Docker."
fi

# Start server
if [ -d "server" ]; then
  echo "[demo] Starting server (http://localhost:4000)..."
  (cd server && npm install && npm run dev) &
else
  echo "[demo] server/ directory not found"
fi

# Start client
if [ -d "client" ]; then
  echo "[demo] Starting client (http://localhost:5173)..."
  (cd client && npm install && npm run dev) &
else
  echo "[demo] client/ directory not found"
fi

wait
