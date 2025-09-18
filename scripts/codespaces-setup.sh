#!/usr/bin/env bash
set -euo pipefail

# Install dependencies for server and client
cd /workspaces/Enterprise-Digital-Twin/server
npm install

cd /workspaces/Enterprise-Digital-Twin/client
npm install
