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

  async balanceObjectives(constraints: DrillingConstraints): Promise<OptimizedParameters> {
    const base: DrillingParameters = { weightOnBit: 25, rotarySpeed: 110, mudFlowRate: 420 };
    let rationale = 'Balanced speed, cost, safety.';
    if (constraints.safetyFirst) {
      base.weightOnBit = Math.max(constraints.wobRange[0], base.weightOnBit - 5);
      rationale = 'Safety prioritized, reduced WOB.';
    }
    return { ...base, rationale };
  }

  async generateRecommendations(context: DrillingContext): Promise<AgentRecommendation[]> {
    return [
      { agent: this.name, priority: 0.8, params: { weightOnBit: 25, rotarySpeed: 110, mudFlowRate: 420 }, message: 'Maintain parameters with close vibration monitoring.' },
    ];
  }

  async run({ inputs, context }: { inputs: AgentInsights[]; context: DrillingContext }) {
    const strategy = await this.optimizeStrategy(inputs);
    const optimized = await this.balanceObjectives({ safetyFirst: true, maxTorque: 30000, wobRange: [15, 35] });
    const recs = await this.generateRecommendations(context);
    return { strategy, optimized, recs };
  }
}
