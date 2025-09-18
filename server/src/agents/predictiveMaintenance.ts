import { BaseAgent } from './base.js';
import { BitPerformance, Equipment, FailurePrediction, MaintenanceRecord, MaintenanceSchedule, BitRecommendation } from '../types/domain.js';

export class PredictiveMaintenanceAgent extends BaseAgent<{ equipment: MaintenanceRecord; recentSensors: any[] }, any> {
  name = 'PredictiveMaintenanceAgent';
  describe() { return 'Monitors equipment health, predicts failures, and optimizes maintenance scheduling.'; }

  async predictFailure(equipmentData: MaintenanceRecord, _sensorData: any[]): Promise<FailurePrediction> {
    const risk = Math.min(1, equipmentData.hoursOfOperation / 1000 + equipmentData.predictedFailureRisk);
    return { equipmentId: equipmentData.equipmentId, risk, etaHours: Math.max(1, 200 - equipmentData.hoursOfOperation / 5), reasoning: 'Heuristic based on hours and baseline risk' };
  }

  async optimizeMaintenanceSchedule(equipment: Equipment[]): Promise<MaintenanceSchedule[]> {
    return equipment.map((e) => ({ equipmentId: e.id, nextServiceInHours: 100 }));
  }

  async recommendBitChange(bitData: BitPerformance): Promise<BitRecommendation> {
    const changeNow = bitData.hours > 60 || bitData.rop < 20;
    return { changeNow, reason: changeNow ? 'High hours or low ROP indicates bit wear' : 'Bit performance acceptable' };
  }

  async run(context: { equipment: MaintenanceRecord; recentSensors: any[] }) {
    const failure = await this.predictFailure(context.equipment, context.recentSensors);
    const bitRec = await this.recommendBitChange({ type: 'PDC', hours: context.equipment.hoursOfOperation / 10, rop: 30 });
    return { failure, bitRec };
  }
}
