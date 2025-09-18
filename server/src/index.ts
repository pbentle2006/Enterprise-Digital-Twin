import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import apiRouter from './routes/api.js';
import { connectMongo } from './db/mongo.js';
import { getNeo4jDriver } from './db/neo4j.js';
import { startSyntheticStreaming } from './sim/syntheticData.js';
import { logger } from './utils/logger.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Sockets
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

async function start() {
  if (process.env.SKIP_DB !== 'true') {
    await connectMongo();
  } else {
    logger.warn('SKIP_DB=true — skipping MongoDB connection');
  }

  if (process.env.SKIP_NEO4J !== 'true') {
    await getNeo4jDriver();
  } else {
    logger.warn('SKIP_NEO4J=true — skipping Neo4j connection');
  }

  server.listen(PORT, () => {
    logger.info(`EDT server running on http://localhost:${PORT}`);
  });

  // Start synthetic data stream
  startSyntheticStreaming(io);
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
