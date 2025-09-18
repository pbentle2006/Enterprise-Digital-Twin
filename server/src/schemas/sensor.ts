import mongoose, { Schema } from 'mongoose';

export interface SensorData {
  timestamp: Date;
  wellId: string;
  bitDepth: number;
  rateOfPenetration: number; // ft/hr
  weightOnBit: number; // klbs
  rotarySpeed: number; // RPM
  torque: number; // ft-lbs
  mudFlowRate: number; // gpm
  hookLoad: number; // klbs
  vibration: number; // g's
  temperature: number; // °F
  pressure: number; // psi
}

const SensorSchema = new Schema<SensorData>({
  timestamp: { type: Date, required: true, index: true },
  wellId: { type: String, required: true, index: true },
  bitDepth: Number,
  rateOfPenetration: Number,
  weightOnBit: Number,
  rotarySpeed: Number,
  torque: Number,
  mudFlowRate: Number,
  hookLoad: Number,
  vibration: Number,
  temperature: Number,
  pressure: Number,
}, { timestamps: true });

export const SensorModel = mongoose.model<SensorData>('SensorData', SensorSchema);
