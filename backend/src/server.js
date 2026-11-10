import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';

// .env faylini yuklash
dotenv.config();

// MongoDB ga ulanish
connectDB();

const app = express();

// Middleware-lar
app.use(express.json({ limit: '10kb' })); // Body hajmini cheklash (DoS himoyasi)
app.use(cookieParser());

// Helmet — HTTP xavfsizlik sarlavhalarini avtomatik o'rnatadi
// (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, X-XSS-Protection va boshqalar)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // CORS bilan ishlashi uchun
  })
);

// CORS sozlamasi (Frontend cookie yubora olishi uchun credentials: true bo'lishi shart)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Localhost, 127.0.0.1 yoki ruxsat etilgan domenlar uchun
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Asosiy tekshiruv endpointi
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Auth server ishlamoqda' });
});

// Auth yo'nalishlari
app.use('/api/auth', authRoutes);

// Xatoliklarni ushlovchi global middleware
app.use((err, req, res, next) => {
  console.error('Server xatosi:', err.stack);
  res.status(500).json({
    message: err.message || 'Serverda ichki xatolik ro\'y berdi'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT} manzilida ishga tushdi`);
});

