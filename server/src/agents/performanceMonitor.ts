import { BaseAgent } from './base.js';
import { DrillingKPIs, PerformanceAlert } from '../types/domain.js';
import { SensorData } from '../schemas/sensor.js';

export class PerformanceMonitorAgent extends BaseAgent<SensorData[], { alerts: PerformanceAlert[]; kpis: DrillingKPIs }> {
  name = 'PerformanceMonitorAgent';
  describe() { return 'Monitors drilling KPIs, detects anomalies, calculates efficiency metrics.'; }

  async analyzePerformance(sensorData: SensorData[]): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    if (sensorData.length < 2) return alerts;
    const last = sensorData[sensorData.length - 1];
    const prev = sensorData[sensorData.length - 2];
    const ropDrop = (prev.rateOfPenetration - last.rateOfPenetration) / Math.max(prev.rateOfPenetration, 1e-6);
    if (ropDrop > 0.2) {
      alerts.push({ timestamp: new Date(), severity: 'warning', type: 'ROP_Drop', description: `ROP dropped ${(ropDrop*100).toFixed(1)}%` });
    }
    if (last.vibration > 3) alerts.push({ timestamp: new Date(), severity: 'critical', type: 'HighVibration', description: 'Vibration exceeding threshold' });
    if (last.torque > 30000) alerts.push({ timestamp: new Date(), severity: 'warning', type: 'HighTorque', description: 'Torque spike detected' });
    return alerts;
  }

  async detectAnomalies(currentData: SensorData): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    if (currentData.vibration > 3.5) alerts.push({ timestamp: new Date(), severity: 'critical', type: 'Vibration', description: 'Severe vibration' });
    return alerts;
  }

  async calculateKPIs(data: SensorData[]): Promise<DrillingKPIs> {
    const n = data.length || 1;
    const avgROP = data.reduce((s, d) => s + d.rateOfPenetration, 0) / n;
    const torque = data.reduce((s, d) => s + d.torque, 0) / n;
    const wob = data.reduce((s, d) => s + d.weightOnBit, 0) / n;
    const msi = (torque * 0.73756) / Math.max(avgROP, 1e-6) + wob * 10; // toy metric
    return { avgROP, costPerFoot: 1000 / Math.max(avgROP, 1e-3), mechanicalSpecificEnergy: msi, vibrationIndex: data.reduce((s,d)=>s+d.vibration,0)/n };
  }

  async run(sensorData: SensorData[]) {
    const [alerts, kpis] = await Promise.all([
      this.analyzePerformance(sensorData),
      this.calculateKPIs(sensorData),
    ]);
    return { alerts, kpis };
  }
}
