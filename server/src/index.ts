import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';
import ttsRouter from './routes/tts';

dotenv.config();

const app = express();
app.use(bodyParser.json());

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AI Companion API server running' });
});

app.use('/api/chat', chatRouter);
app.use('/api/tts', ttsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
