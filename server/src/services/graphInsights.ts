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
