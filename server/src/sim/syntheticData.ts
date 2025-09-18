import { Server as SocketIOServer } from 'socket.io';
import { SensorModel, SensorData } from '../schemas/sensor.js';

function randn(mean: number, std: number) {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  return mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std;
}

export function generateSensorSample(depth: number, wellId: string): SensorData {
  const hardnessFactor = depth > 3500 ? 0.7 : 1.0;
  const rop = Math.max(5, randn(35 * hardnessFactor, 5));
  return {
    timestamp: new Date(),
    wellId,
    bitDepth: depth,
    rateOfPenetration: rop,
    weightOnBit: Math.max(10, randn(25, 3)),
    rotarySpeed: Math.max(80, randn(120, 10)),
    torque: Math.max(10000, randn(20000 * (1/hardnessFactor), 2000)),
    mudFlowRate: Math.max(300, randn(420, 15)),
    hookLoad: Math.max(50, randn(80, 5)),
    vibration: Math.max(0.5, randn(2.0 / hardnessFactor, 0.4)),
    temperature: Math.max(80, randn(120, 5)),
    pressure: Math.max(2000, randn(3500, 150)),
  };
}

export function startSyntheticStreaming(io: SocketIOServer) {
  let depth = 3000;
  const wellId = 'well-001';
  setInterval(async () => {
    depth += Math.random() * 5;
    const sample = generateSensorSample(depth, wellId);
    await SensorModel.create(sample);
    io.emit('sensor:update', sample);
  }, 1000);
}
