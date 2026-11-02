import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import knowledgeRoutes from './routes/knowledge.js';
import issueRoutes from './routes/issues.js';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/chat', chatRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// One place that turns errors into JSON responses.
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join(' ');
    return res.status(400).json({ error: msg });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: 'Invalid id.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Server error.' });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set. Copy .env.example to .env first.');

  let memoryServer;
  let uri = process.env.MONGODB_URI;
  try {
    await mongoose.connect(uri);
  } catch (localError) {
    if (uri !== 'mongodb://127.0.0.1:27017/campus_desk') throw localError;
    console.warn('Local MongoDB is unavailable; starting an in-memory database for development.');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    await mongoose.connect(uri);
  }

  console.log('MongoDB connected');
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
