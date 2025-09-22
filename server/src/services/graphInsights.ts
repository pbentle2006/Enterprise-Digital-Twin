import { runCypher } from '../db/neo4j.js';

// Finds "offset" wells that drill through similar formations and orders by similarity score
export async function findOffsetWells(wellId: string, limit = 5) {
  const cypher = `
  MATCH (w:Well {id: $wellId})-[:DRILLS_THROUGH]->(f:Formation)
  WITH w, collect(f.name) AS targetFormations
  MATCH (ow:Well)-[:DRILLS_THROUGH]->(of:Formation)
  WHERE ow.id <> $wellId
  WITH ow, targetFormations, collect(DISTINCT of.name) AS otherFormations
  WITH ow, apoc.coll.intersection(targetFormations, otherFormations) AS inter,
           apoc.coll.union(targetFormations, otherFormations) AS uni
  WITH ow, (CASE WHEN size(uni)=0 THEN 0.0 ELSE toFloat(size(inter)) / size(uni) END) AS jaccard
  RETURN ow { .id, .name, .location, .type, .status, similarity: jaccard } AS well
  ORDER BY well.similarity DESC
  LIMIT $limit
  `;
  const results = await runCypher(cypher, { wellId, limit });
  return results.map((r: any) => r.well);
}

// Returns ordered formation sequence for a well
export async function getFormationSequence(wellId: string) {
  const cypher = `
  MATCH (w:Well {id: $wellId})-[:DRILLS_THROUGH]->(f:Formation)
  RETURN f { .name, .depth, properties: f.properties } AS formation
  ORDER BY formation.depth ASC
  `;
  const results = await runCypher(cypher, { wellId });
  return results.map((r: any) => r.formation);
}

// Given currentDepth, return the next formation(s) ahead
export async function getFormationLookahead(wellId: string, currentDepth: number, count = 1) {
  const seq = await getFormationSequence(wellId);
  const ahead = seq.filter((f: any) => (f.depth ?? 0) > currentDepth).slice(0, count);
  return { currentDepth, next: ahead, sequence: seq };
}

// Aggregates equipment performance metrics from BitRun and related DrillingEvent
export async function getEquipmentPerformance(equipmentId: string) {
  const cypher = `
  MATCH (e:Equipment {id: $equipmentId})
  OPTIONAL MATCH (br:BitRun)-[:PERFORMED_BY]->(e)
  WITH e, collect(br) AS bitRuns
  OPTIONAL MATCH (e)-[:GENERATES]->(ev:DrillingEvent)
  WITH e, bitRuns, collect(ev) AS events
  RETURN {
    equipment: e { .id, .type, .model },
    bitRuns: [ br IN bitRuns | br { .id, .bitType, .depthIn, .depthOut, performance: br.performance } ],
    events: [ ev IN events | ev { .timestamp, .type, parameters: ev.parameters, .outcome } ],
    stats: {
      runs: size(bitRuns),
      avgROP: CASE WHEN size(bitRuns)=0 THEN 0 ELSE toFloat(reduce(s=0, b IN bitRuns | s + coalesce(b.performance.avgROP, 0))) / size(bitRuns) END
    }
  } AS perf
  `;
  const rows = await runCypher(cypher, { equipmentId });
  return rows.length ? rows[0].perf : { equipment: { id: equipmentId }, bitRuns: [], events: [], stats: { runs: 0, avgROP: 0 } };
}
