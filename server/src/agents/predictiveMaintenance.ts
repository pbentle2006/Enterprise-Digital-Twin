import { BaseAgent } from './base.js';
import { BitPerformance, Equipment, FailurePrediction, MaintenanceRecord, MaintenanceSchedule, BitRecommendation } from '../types/domain.js';

export class PredictiveMaintenanceAgent extends BaseAgent<{ equipment: MaintenanceRecord; recentSensors: any[]; equipmentPerformance?: any }, any> {
  name = 'PredictiveMaintenanceAgent';
  describe() { return 'Monitors equipment health, predicts failures, and optimizes maintenance scheduling.'; }

  async predictFailure(equipmentData: MaintenanceRecord, _sensorData: any[], perf?: any): Promise<FailurePrediction> {
    let risk = Math.min(1, equipmentData.hoursOfOperation / 1000 + equipmentData.predictedFailureRisk);
    if (perf?.stats?.runs && perf.stats.avgROP < 25) {
      risk = Math.min(1, risk + 0.05); // slightly increase risk if recent performance degraded
    }
    const etaBase = Math.max(1, 200 - equipmentData.hoursOfOperation / 5);
    return { equipmentId: equipmentData.equipmentId, risk, etaHours: etaBase, reasoning: 'Hours, baseline risk, and recent performance' };
  }

  async optimizeMaintenanceSchedule(equipment: Equipment[]): Promise<MaintenanceSchedule[]> {
    return equipment.map((e) => ({ equipmentId: e.id, nextServiceInHours: 100 }));
  }

  async recommendBitChange(bitData: BitPerformance): Promise<BitRecommendation> {
    const changeNow = bitData.hours > 60 || bitData.rop < 20;
    return { changeNow, reason: changeNow ? 'High hours or low ROP indicates bit wear' : 'Bit performance acceptable' };
  }

  async run(context: { equipment: MaintenanceRecord; recentSensors: any[]; equipmentPerformance?: any }) {
    const failure = await this.predictFailure(context.equipment, context.recentSensors, context.equipmentPerformance);
    const recentAvgRop = context.equipmentPerformance?.stats?.avgROP ?? 30;
    const bitRec = await this.recommendBitChange({ type: 'PDC', hours: context.equipment.hoursOfOperation / 10, rop: recentAvgRop });
    return { failure, bitRec, evidence: { equipmentPerformance: context.equipmentPerformance } };
  }
}
