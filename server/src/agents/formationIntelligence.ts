import { BaseAgent } from './base.js';
import { DrillabilityScore, DrillingParameters, FormationPrediction, GeologicalData } from '../types/domain.js';

export class FormationIntelligenceAgent extends BaseAgent<{ currentDepth: number; geoData: GeologicalData[] }, any> {
  name = 'FormationIntelligenceAgent';
  describe() { return 'Interprets geological data and recommends parameter adjustments.'; }

  async predictFormationChange(currentDepth: number, geoData: GeologicalData[]): Promise<FormationPrediction> {
    const next = geoData.find((g) => g.depth > currentDepth) || geoData[geoData.length - 1];
    return { depthStart: next.depth, depthEnd: next.depth + 100, hardness: next.hardness, confidence: 0.75 };
  }

  async recommendParameters(formation: GeologicalData): Promise<DrillingParameters> {
    const base: DrillingParameters = { weightOnBit: 20, rotarySpeed: 120, mudFlowRate: 400 };
    if (formation.hardness === 'hard' || formation.hardness === 'very_hard') {
      base.weightOnBit += 10;
      base.rotarySpeed -= 20;
    }
    return base;
  }

  async assessDrillability(geoData: GeologicalData): Promise<DrillabilityScore> {
    const score = Math.max(10, 100 - geoData.rockStrength / 1000 - (geoData.hardness === 'very_hard' ? 20 : 0));
    return { score, factors: { rockStrength: geoData.rockStrength, hardness: geoData.hardness === 'very_hard' ? 20 : 0 } };
  }

  async run(context: { currentDepth: number; geoData: GeologicalData[] }) {
    const pred = await this.predictFormationChange(context.currentDepth, context.geoData);
    const nextFormation = context.geoData.find((g) => g.depth >= pred.depthStart) || context.geoData[0];
    const params = await this.recommendParameters(nextFormation);
    const drillability = await this.assessDrillability(nextFormation);
    return { prediction: pred, params, drillability };
  }
}
