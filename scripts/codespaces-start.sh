#!/usr/bin/env bash
set -euo pipefail

# Start server (skip DBs for Codespaces demo)
cd /workspaces/Enterprise-Digital-Twin/server
SKIP_DB=true SKIP_NEO4J=true npm run dev &

# Start client
cd /workspaces/Enterprise-Digital-Twin/client
npm run dev &

wait
