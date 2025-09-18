import { runCypher } from '../db/neo4j.js';

export async function queryGraph(cypher: string, params: Record<string, any> = {}) {
  return runCypher(cypher, params);
}

export async function upsertWell(well: { id: string; name: string; location: string; type: string; status: string }) {
  const cypher = `MERGE (w:Well {id: $id}) SET w += $props RETURN w`;
  return runCypher(cypher, { id: well.id, props: well });
}

export async function createDrillingEvent(wellId: string, event: { timestamp: string; type: string; parameters: any; outcome?: string }) {
  const cypher = `
  MATCH (w:Well {id: $wellId})
  CREATE (e:DrillingEvent {timestamp: $timestamp, type: $type, parameters: $parameters, outcome: $outcome})
  MERGE (w)-[:USES]->(eq:Equipment {id: $equipmentId})
  MERGE (eq)-[:GENERATES]->(e)
  RETURN e
  `;
  return runCypher(cypher, { wellId, equipmentId: 'rig-1', ...event });
}
