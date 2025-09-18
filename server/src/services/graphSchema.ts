import { runCypher } from '../db/neo4j.js';

export async function initSchema() {
  const statements = [
    'CREATE CONSTRAINT well_id IF NOT EXISTS FOR (w:Well) REQUIRE w.id IS UNIQUE',
    'CREATE CONSTRAINT equipment_id IF NOT EXISTS FOR (e:Equipment) REQUIRE e.id IS UNIQUE',
    'CREATE INDEX formation_name IF NOT EXISTS FOR (f:Formation) ON (f.name)',
    'CREATE INDEX drillingevent_ts IF NOT EXISTS FOR (d:DrillingEvent) ON (d.timestamp)',
    'CREATE INDEX alert_ts IF NOT EXISTS FOR (a:Alert) ON (a.timestamp)'
  ];
  for (const cypher of statements) {
    await runCypher(cypher);
  }
  return { created: statements.length };
}

export async function seedDemo() {
  // Basic demo graph: one well with formations sequence, equipment, and sample events
  const cypher = `
  MERGE (w:Well {id: 'well-001'})
    SET w.name = 'Well 001', w.location = 'Permian', w.type = 'Horizontal', w.status = 'Drilling'
  MERGE (rig:Equipment {id: 'rig-1'})
    SET rig.type = 'Rig', rig.model = 'XR-9000'
  MERGE (pump:Equipment {id: 'pump-1'})
    SET pump.type = 'MudPump', pump.model = 'MP-300'
  MERGE (bit:Equipment {id: 'bit-1'})
    SET bit.type = 'Bit', bit.model = 'PDC-8'
  MERGE (w)-[:USES]->(rig)
  MERGE (w)-[:USES]->(pump)
  MERGE (w)-[:USES]->(bit)
  
  MERGE (f1:Formation {name: 'Sandstone', depth: 3200})
    SET f1.properties = { hardness: 'medium', rockStrength: 9000 }
  MERGE (f2:Formation {name: 'Shale', depth: 3500})
    SET f2.properties = { hardness: 'hard', rockStrength: 15000 }
  MERGE (f3:Formation {name: 'Limestone', depth: 3800})
    SET f3.properties = { hardness: 'hard', rockStrength: 13000 }
  MERGE (w)-[:DRILLS_THROUGH]->(f1)
  MERGE (w)-[:DRILLS_THROUGH]->(f2)
  MERGE (w)-[:DRILLS_THROUGH]->(f3)
  MERGE (f1)-[:FOLLOWS]->(f2)
  MERGE (f2)-[:FOLLOWS]->(f3)

  WITH w, rig
  CREATE (br:BitRun {id: 'br-001', bitType: 'PDC', depthIn: 3000, depthOut: 3600, performance: {avgROP: 32}})
  MERGE (br)-[:PERFORMED_BY]->(rig)

  WITH w
  CREATE (ev1:DrillingEvent {timestamp: datetime(), type: 'ROP_Drop', parameters: {delta: 0.25}, outcome: 'Alerted'})
  MERGE (w)-[:USES]->(:Equipment {id:'sensor-agg'})-[:GENERATES]->(ev1)
  `;
  await runCypher(cypher);
  return { seeded: true };
}
