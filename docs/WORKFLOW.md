# Enterprise Digital Twin — Delivery Workflow

This document outlines the end-to-end workflow for building the Agentic Digital Twin for Drilling Optimization.

## 1. Monorepo Architecture
- `server/`: Node.js + Express + TypeScript + Socket.io
- `client/`: React + TypeScript + Vite + Tailwind + Recharts
- `docker-compose.yml`: MongoDB + Neo4j for local dev
- `docs/`: Planning and architecture documentation

## 2. Branching Strategy
- `main`: stable release branch
- `release/x.y`: release stabilization branches
- `feature/<scope>-<short-desc>`: short-lived feature branches, squash-merged via PR

## 3. Environments
- Local: Docker Compose spins MongoDB and Neo4j
- Dev: Optional shared dev environment
- Prod (Demo): GitHub Actions build and deploy (optional in future step)

## 4. Development Workflow
1. Create issue and feature branch
2. Implement changes with tests (unit on server, component tests on client where possible)
3. Local testing: `npm run dev` in `server/` and `client/`
4. Commit using conventional messages (feat, fix, chore)
5. Open PR, request review, ensure CI passes
6. Squash merge to `main`

## 5. Data Flow
- Synthetic generators push `SensorData` to Mongo and emit via Socket.io
- Server exposes REST for queries and Cypher passthrough for Neo4j
- Agents produce insights; Orchestrator coordinates and resolves conflicts
- Client subscribes to Socket.io for real-time updates and renders dashboards
- LLM endpoint answers domain questions with provided context

## 6. Observability & Quality (to be added in roadmap)
- Server logging via `logger`
- HTTP request logging and basic metrics
- CI: lint + typecheck + tests
- Optional: uptime checks, error reporting, and performance metrics

## 7. Security & Secrets
- Environment variables in `.env` files
- Never commit secrets; use GitHub Actions Secrets for CI

## 8. Release & Demo Procedure
- Tag version on `main`
- Generate release notes from merged PRs
- Prepare demo datasets and scripts
- Record demo scenarios walkthrough
