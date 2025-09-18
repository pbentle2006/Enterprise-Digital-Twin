import { BaseAgent } from '../agents/base.js';
import { ConflictResolver } from './conflict.js';
import { PriorityManager } from './priority.js';
import { AgentRecommendation, CoordinatedResponse, DrillingContext, OrchestrationResult, ResolvedRecommendation } from '../types/domain.js';

export class AgentOrchestrator {
  private agents = new Map<string, BaseAgent>();
  private conflictResolver = new ConflictResolver();
  private priorityManager = new PriorityManager();

  register(agent: BaseAgent) {
    this.agents.set((agent as any).name, agent);
  }

  async orchestrateDecision(context: DrillingContext): Promise<OrchestrationResult> {
    const recs = await this.coordinateAgents({ context });
    const resolved = await this.resolveConflicts(recs.recommendations);
    return { decision: resolved, metadata: { agentCount: this.agents.size } };
  }

  async resolveConflicts(recommendations: AgentRecommendation[]): Promise<ResolvedRecommendation> {
    const rescored = recommendations.map((r) => ({ ...r, priority: this.priorityManager.score(r) }));
    return this.conflictResolver.resolve(rescored);
  }

  async coordinateAgents(_scenario: any): Promise<{ recommendations: AgentRecommendation[] }> {
    // Placeholder: In real flow, we would gather outputs from agents
    const recommendations: AgentRecommendation[] = [
      { agent: 'PerformanceMonitorAgent', priority: 0.7, message: 'Safety: reduce WOB due to high vibration', params: { weightOnBit: 20, rotarySpeed: 100, mudFlowRate: 420 } },
      { agent: 'DrillingStrategyAgent', priority: 0.6, message: 'Maintain current parameters while monitoring', params: { weightOnBit: 25, rotarySpeed: 110, mudFlowRate: 420 } },
    ];
    return { recommendations };
  }
}
