import { AgentRecommendation, ResolvedRecommendation } from '../types/domain.js';

export class ConflictResolver {
  resolve(recommendations: AgentRecommendation[]): ResolvedRecommendation {
    const sorted = [...recommendations].sort((a, b) => b.priority - a.priority);
    const top = sorted[0];
    return { ...top, resolved: true } as ResolvedRecommendation;
  }
}
