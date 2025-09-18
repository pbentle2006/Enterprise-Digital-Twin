import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { SensorModel } from '../schemas/sensor.js';
import { queryGraph } from '../services/graphService.js';
import { llmQuery } from '../services/llm.js';
import { AgentOrchestrator } from '../orchestrator/index.js';
import { runAgentsForWell } from '../services/agentRunner.js';
import { initSchema, seedDemo } from '../services/graphSchema.js';
import { findOffsetWells } from '../services/graphInsights.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'edt-server' });
});

router.post('/ingest/sensor', async (req: Request, res: Response) => {
  try {
    const doc = await SensorModel.create(req.body);
    res.status(201).json(doc);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/sensor/:wellId', async (req: Request, res: Response) => {
  const { wellId } = req.params;
  const limit = Number(req.query.limit ?? 200);
  const data = await SensorModel.find({ wellId }).sort({ timestamp: -1 }).limit(limit).lean();
  res.json(data.reverse());
});

router.post('/graph/query', async (req: Request, res: Response) => {
  const { cypher, params } = req.body ?? {};
  const result = await queryGraph(cypher, params);
  res.json(result);
});

router.post('/llm/query', async (req: Request, res: Response) => {
  const { question, context } = req.body ?? {};
  const answer = await llmQuery(question, context);
  res.json({ answer });
});

// Demo preview: mock orchestrator decision endpoint
router.get('/orchestrator/mock', async (_req: Request, res: Response) => {
  const orch = new AgentOrchestrator();
  const result = await orch.orchestrateDecision({
    currentDepth: 3450,
    recentSensors: [],
    geology: [],
  } as any);
  res.json(result);
});

// Agents status (mocked for now)
router.get('/agents/status', async (_req: Request, res: Response) => {
  res.json([
    { name: 'PerformanceMonitorAgent', status: 'active' },
    { name: 'FormationIntelligenceAgent', status: 'idle' },
    { name: 'PredictiveMaintenanceAgent', status: 'active' },
    { name: 'DrillingStrategyAgent', status: 'active' },
  ]);
});

// Recommendations list (from orchestrator)
router.get('/recommendations', async (_req: Request, res: Response) => {
  const wellId = 'well-001';
  const { perfOut, formOut, maintOut, stratOut, context, inputs } = await runAgentsForWell(wellId);
  // Prefer strategy agent recommendations if available; fallback to a combined message
  const recs = Array.isArray((stratOut as any).recs) && (stratOut as any).recs.length
    ? (stratOut as any).recs
    : [
        {
          agent: 'DrillingStrategyAgent',
          priority: 0.7,
          params: (stratOut as any).optimized ?? { weightOnBit: 25, rotarySpeed: 110, mudFlowRate: 420 },
          message: (stratOut as any).strategy?.narrative ?? 'Maintain parameters with safety margin',
        },
      ];
  res.json({ recommendations: recs, meta: { context, inputs } });
});

// Agent insights bundle
router.get('/agents/insights', async (_req: Request, res: Response) => {
  const wellId = 'well-001';
  const out = await runAgentsForWell(wellId);
  res.json(out);
});

// KPIs for a given wellId (basic aggregation)
router.get('/kpis/:wellId', async (req: Request, res: Response) => {
  const { wellId } = req.params;
  const last = await SensorModel.find({ wellId }).sort({ timestamp: -1 }).limit(200).lean();
  const n = last.length || 1;
  const avgROP = last.reduce((s, d: any) => s + (d.rateOfPenetration || 0), 0) / n;
  const torque = last.reduce((s, d: any) => s + (d.torque || 0), 0) / n;
  const wob = last.reduce((s, d: any) => s + (d.weightOnBit || 0), 0) / n;
  const mechanicalSpecificEnergy = (torque * 0.73756) / Math.max(avgROP, 1e-6) + wob * 10;
  const costPerFoot = 1000 / Math.max(avgROP, 1e-3);
  res.json({ avgROP, costPerFoot, mechanicalSpecificEnergy });
});

// Neo4j schema init
router.post('/graph/schema/init', async (_req: Request, res: Response) => {
  if (process.env.SKIP_NEO4J === 'true') {
    return res.status(400).json({ error: 'Neo4j disabled (SKIP_NEO4J=true)' });
  }
  try {
    const result = await initSchema();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Neo4j seed demo graph
router.post('/graph/seed', async (_req: Request, res: Response) => {
  if (process.env.SKIP_NEO4J === 'true') {
    return res.status(400).json({ error: 'Neo4j disabled (SKIP_NEO4J=true)' });
  }
  try {
    const result = await seedDemo();
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Graph insight: offset wells with similar formation sequences
router.get('/graph/offset-wells', async (req: Request, res: Response) => {
  if (process.env.SKIP_NEO4J === 'true') {
    return res.status(400).json({ error: 'Neo4j disabled (SKIP_NEO4J=true)' });
  }
  const wellId = (req.query.wellId as string) || 'well-001';
  const limit = Number(req.query.limit ?? 5);
  try {
    const wells = await findOffsetWells(wellId, limit);
    res.json({ wells });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
