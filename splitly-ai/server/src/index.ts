import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import billRoutes from './routes/billRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'splitly-ai-server' });
});

// Routes
app.use('/api', billRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`\n🍽️  SplitLy AI server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
