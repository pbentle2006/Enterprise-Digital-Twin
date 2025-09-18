import neo4j, { Driver } from 'neo4j-driver';
import { logger } from '../utils/logger.js';

let driver: Driver | null = null;

export async function getNeo4jDriver() {
  if (driver) return driver;
  const url = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'neo4j';
  driver = neo4j.driver(url, neo4j.auth.basic(user, password));
  await driver.getServerInfo();
  logger.info('Connected to Neo4j');
  return driver;
}

export async function runCypher<T = any>(cypher: string, params: Record<string, any> = {}) {
  const d = await getNeo4jDriver();
  const session = d.session();
  try {
    const res = await session.run(cypher, params);
    return res.records.map((r) => r.toObject()) as T[];
  } finally {
    await session.close();
  }
}
