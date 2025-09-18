import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/edt';

export async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB || 'edt' });
  logger.info('Connected to MongoDB');
}
