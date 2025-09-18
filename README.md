# Enterprise Digital Twin

An agentic digital twin platform for drilling optimization. This monorepo demonstrates federated data integration, multi-agent coordination, a graph database (Neo4j), time-series storage (MongoDB), real-time streaming, and intelligent interfaces for proactive alerts and natural language queries.

## 🚀 Features

- Real-time data synchronization
- Process simulation and optimization
- Predictive analytics
- 3D visualization of enterprise assets
- API-first architecture

## 🧱 Monorepo Structure

- `server/` — Node.js + Express + TypeScript + Socket.io, MongoDB (time-series), Neo4j (graph)
- `client/` — React + TypeScript + Vite + Tailwind + Recharts
- `docker-compose.yml` — Local services for MongoDB and Neo4j
- `docs/` — Workflow, roadmap, and planning documentation

## 🚀 Quick Start (Local)

1) Start databases (MongoDB + Neo4j):
```bash
docker compose up -d
```

2) Install and run the server:
```bash
cd server
npm install
npm run dev
# Server on http://localhost:4000
```

3) Install and run the client:
```bash
cd client
npm install
npm run dev
# App on http://localhost:5173
```

## 📚 Documentation

- Workflow: `docs/WORKFLOW.md`
- Versioned Roadmap + Gantt: `docs/ROADMAP.md`
- Domain and Types: `server/src/types/domain.ts`

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

