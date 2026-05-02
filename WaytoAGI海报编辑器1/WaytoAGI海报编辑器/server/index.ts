import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import projectsRouter from './routes/projects.js';
import guestsRouter from './routes/guests.js';

const app = express();
const PORT = Number(process.env.SERVER_PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/projects', projectsRouter);
app.use('/api/guests', guestsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();
