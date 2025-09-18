import { AgentRecommendation } from '../types/domain.js';

export class PriorityManager {
  score(rec: AgentRecommendation): number {
    let score = rec.priority;
    if (rec.message.toLowerCase().includes('safety')) score += 0.2;
    return Math.min(1, score);
  }
}
