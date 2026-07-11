import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js'
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import contractRoutes from './routes/contractRoutes.js';

const app = express();
const port = process.env.PORT || 5000;
// connectDB(); // Removed duplicate call

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179'
].filter(Boolean);

console.log('=== CORS DEBUG LOGS ===');
console.log('process.env.CLIENT_URL:', process.env.CLIENT_URL);
console.log('allowedOrigins loaded:', allowedOrigins);
console.log('=======================');

app.use(cookieParser());

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Request logger
app.use((req, req_res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

//API ENDPOINTS
app.get('/', (req, res) => res.send('API WORKING'));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contracts', contractRoutes);

const startServer = async () => {
  await connectDB();

  if (!process.env.VERCEL) {
    app.listen(port, () => {
      console.log(`Server is running on Port: ${port}`);
    });
  }
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

export default app;

