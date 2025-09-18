# Neo4j Aura Free Setup Guide

This guide shows how to connect the Enterprise Digital Twin server to a managed Neo4j instance using Neo4j Aura Free (no local install required).

## 1) Create an Aura Free database
- Go to: https://neo4j.com/cloud/platform/aura-graph-database/
- Sign in and create an Aura Free database.
- After it provisions, click "Connect" to view connection details.
- Note the Bolt URL, Username, and Password.

Example (your values will differ):
- Bolt URL: `neo4j+s://xxxxxxxx.databases.neo4j.io`
- Username: `neo4j`
- Password: `your-generated-password`

## 2) Configure the server environment
Set the following environment variables for the server:

```bash
# Required
export SKIP_NEO4J=false
export NEO4J_URI="neo4j+s://xxxxxxxx.databases.neo4j.io"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="<your-password>"

# Optional: leave DB off if you don't have Mongo locally
export SKIP_DB=true
```

If using Codespaces, set these in the terminal before starting the server.

## 3) Start the server
```bash
cd server
npm install
npm run dev
# Server should log: Connected to Neo4j
```

## 4) Initialize schema and seed demo graph
Use the API endpoints to create constraints/indexes and seed demo data.

```bash
# Initialize schema
curl -X POST http://localhost:4000/api/graph/schema/init

# Seed demo data
curl -X POST http://localhost:4000/api/graph/seed
```

You can verify in Neo4j Browser (use the Aura browser link) with queries like:
```cypher
MATCH (w:Well)-[:DRILLS_THROUGH]->(f:Formation)
RETURN w,f LIMIT 10;

MATCH (w:Well)-[:USES]->(e:Equipment)
RETURN w,e LIMIT 10;

MATCH (f1:Formation)-[:FOLLOWS]->(f2:Formation)
RETURN f1,f2 LIMIT 10;
```

## 5) Use graph insights from the app
The server can now run graph queries (via `/api/graph/query`) and upcoming insight endpoints. The client will surface graph-backed insights in the dashboard as they are implemented.

## Troubleshooting
- SSL/TLS: Use the `neo4j+s://` scheme for Aura (encrypted).
- Connectivity: Ensure your network allows outbound connections to Aura.
- Auth: If you reset the password in Aura, update `NEO4J_PASSWORD` accordingly.
- Disable Neo4j: Set `SKIP_NEO4J=true` to run without a Neo4j connection.
