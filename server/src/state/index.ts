import { RecentStore } from './recent.js';
import { SensorData } from '../schemas/sensor.js';

export const recentSensors = new RecentStore<SensorData>(300);
