import { BaseAgent } from './base.js';
import { AgentInsights, AgentRecommendation, DrillingConstraints, DrillingContext, DrillingParameters, DrillingStrategy, OptimizedParameters, ResolvedRecommendation } from '../types/domain.js';

export class DrillingStrategyAgent extends BaseAgent<{ inputs: AgentInsights[]; context: DrillingContext }, any> {
  name = 'DrillingStrategyAgent';
  describe() { return 'Synthesizes insights from other agents to balance objectives and recommend strategy.'; }

  async optimizeStrategy(allAgentInputs: AgentInsights[]): Promise<DrillingStrategy> {
    const recommendedParams: DrillingParameters = { weightOnBit: 25, rotarySpeed: 110, mudFlowRate: 420 };
    const narrative = `Combined insights from ${allAgentInputs.map(i=>i.name).join(', ')}`;
    return { narrative, recommendedParams };
  }

  async balanceObjectives(constraints: DrillingConstraints, context?: DrillingContext): Promise<OptimizedParameters> {
    const base: DrillingParameters = { weightOnBit: 25, rotarySpeed: 110, mudFlowRate: 420 };
    const notes: string[] = [];
    if (constraints.safetyFirst) {
      base.weightOnBit = Math.max(constraints.wobRange[0], base.weightOnBit - 5);
      notes.push('Safety prioritized, reduced WOB');
    }
    // If lookahead shows a hard formation ahead, bias parameters conservatively
    const nextFormation = (context as any)?.lookahead?.next?.[0];
    if (nextFormation?.properties?.hardness === 'hard') {
      base.weightOnBit = Math.max(constraints.wobRange[0], base.weightOnBit - 3);
      base.rotarySpeed = Math.max(80, base.rotarySpeed - 10);
      notes.push(`Upcoming ${nextFormation.name} (${nextFormation.properties.hardness}) at ${nextFormation.depth} ft`);
    }
    // If equipment recent avg ROP is poor, reduce aggressiveness slightly
    const avgROP = (context as any)?.equipmentPerformance?.stats?.avgROP;
    if (typeof avgROP === 'number' && avgROP < 25) {
      base.weightOnBit = Math.max(constraints.wobRange[0], base.weightOnBit - 2);
      notes.push(`Recent equipment avg ROP ${avgROP.toFixed(1)} is low`);
    }
    const rationale = (notes.length ? notes.join('; ') + '. ' : '') + 'Balanced speed, cost, safety.';
    return { ...base, rationale };
  }

  async generateRecommendations(context: DrillingContext): Promise<AgentRecommendation[]> {
    const base: DrillingParameters = { weightOnBit: 25, rotarySpeed: 110, mudFlowRate: 420 };
    let wob = base.weightOnBit, rpm = base.rotarySpeed, mfr = base.mudFlowRate;
    const msgs: string[] = [];
    const nextFormation = (context as any)?.lookahead?.next?.[0];
    if (nextFormation?.properties?.hardness === 'hard') {
      wob -= 3; rpm -= 10; msgs.push(`Lookahead: ${nextFormation.name} hard; reduce WOB/RPM`);
    }
    const avgROP = (context as any)?.equipmentPerformance?.stats?.avgROP;
    if (typeof avgROP === 'number' && avgROP < 25) {
      wob -= 2; msgs.push(`Equipment avg ROP ${avgROP.toFixed(1)} low; slightly conservative WOB`);
    }
    wob = Math.max(15, wob); rpm = Math.max(80, rpm);
    const message = msgs.length ? msgs.join('. ') : 'Maintain parameters with close vibration monitoring.';
    return [ { agent: this.name, priority: 0.85, params: { weightOnBit: wob, rotarySpeed: rpm, mudFlowRate: mfr }, message } ];
  }

  async run({ inputs, context }: { inputs: AgentInsights[]; context: DrillingContext }) {
    const strategy = await this.optimizeStrategy(inputs);
    const optimized = await this.balanceObjectives({ safetyFirst: true, maxTorque: 30000, wobRange: [15, 35] }, context);
    const recs = await this.generateRecommendations(context);
    return { strategy, optimized, recs };
  }
}
