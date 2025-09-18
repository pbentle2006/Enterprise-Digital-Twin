import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { SensorModel } from '../schemas/sensor.js';
import { queryGraph } from '../services/graphService.js';
import { llmQuery } from '../services/llm.js';
import { AgentOrchestrator } from '../orchestrator/index.js';

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

export default router;
