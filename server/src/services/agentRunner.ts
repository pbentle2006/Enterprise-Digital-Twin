import { recentSensors } from '../state/index.js';
import { PerformanceMonitorAgent } from '../agents/performanceMonitor.js';
import { FormationIntelligenceAgent } from '../agents/formationIntelligence.js';
import { PredictiveMaintenanceAgent } from '../agents/predictiveMaintenance.js';
import { DrillingStrategyAgent } from '../agents/drillingStrategy.js';
import { AgentInsights, DrillingContext, GeologicalData, MaintenanceRecord } from '../types/domain.js';
import { getFormationLookahead } from './graphInsights.js';

export async function runAgentsForWell(wellId: string) {
  const sensors = recentSensors.get(wellId);
  const perf = new PerformanceMonitorAgent();
  const form = new FormationIntelligenceAgent();
  const maint = new PredictiveMaintenanceAgent();
  const strat = new DrillingStrategyAgent();

  const currentDepth = sensors.length ? sensors[sensors.length - 1].bitDepth : 3000;

  // Simple synthetic geological sequence for now
  const geo: GeologicalData[] = [
    { depth: 3200, formation: 'Sandstone', rockStrength: 9000, porosity: 18, permeability: 120, lithology: 'sandstone', expectedROP: 40, hardness: 'medium' },
    { depth: 3500, formation: 'Shale', rockStrength: 15000, porosity: 8, permeability: 5, lithology: 'shale', expectedROP: 25, hardness: 'hard' },
    { depth: 3800, formation: 'Limestone', rockStrength: 13000, porosity: 12, permeability: 30, lithology: 'limestone', expectedROP: 30, hardness: 'hard' },
  ];

  const maintRec: MaintenanceRecord = {
    equipmentId: 'rig-1',
    lastService: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    serviceType: 'routine',
    hoursOfOperation: Math.min(500, sensors.length),
    predictedFailureRisk: 0.1,
    componentCondition: { pump: 0.8, motor: 0.9, bit: 0.6 },
  };

  const perfOut = await perf.run(sensors);
  const formOut = await form.run({ currentDepth, geoData: geo });
  const maintOut = await maint.run({ equipment: maintRec, recentSensors: sensors });

  // Attempt to fetch formation lookahead from Neo4j when enabled; otherwise leave empty
  let lookahead: any = { next: [] };
  try {
    if (process.env.SKIP_NEO4J !== 'true') {
      lookahead = await getFormationLookahead('well-001', currentDepth, 2);
    }
  } catch {
    lookahead = { next: [] };
  }

  const context: DrillingContext = { currentDepth, recentSensors: sensors as any[], geology: geo, lookahead } as any;
  const inputs: AgentInsights[] = [
    { name: perf.name, insights: perfOut },
    { name: form.name, insights: formOut },
    { name: maint.name, insights: maintOut },
  ];

  const stratOut = await strat.run({ inputs, context });

  return { perfOut, formOut, maintOut, stratOut, context, inputs };
}
