/* ============================================================
   EID AGENCY — BACKEND SERVER (server.js)
   Node.js + Express + MongoDB + JWT + Multer
   ============================================================ */

require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');

// ─── Import Routes ────────────────────────────────────────
const authRoutes     = require('./src/routes/auth');
const serviceRoutes  = require('./src/routes/services');
const projectRoutes  = require('./src/routes/projects');
const packageRoutes  = require('./src/routes/packages');
const inquiryRoutes  = require('./src/routes/inquiries');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Ensure /uploads directory exists ─────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created /uploads directory');
}

// ─── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Body Parsers ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Serve Uploaded Images Statically ─────────────────────
app.use('/uploads', express.static(uploadsDir));

// ─── Health Check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EID Agency API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/services',  serviceRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/packages',  packageRoutes);
app.use('/api/inquiries', inquiryRoutes);

// ─── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack || err.message);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'حجم الملف كبير جداً. الحد الأقصى 5MB' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: 'نوع الملف غير مسموح به' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'حدث خطأ داخلي في الخادم',
  });
});

// ─── Connect to MongoDB & Start Server ────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eid_agency';

mongoose.connect(MONGO_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB:', MONGO_URI.replace(/\/\/.*@/, '//***@'));
  app.listen(PORT, () => {
    console.log(`🚀 EID Agency API running at http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

module.exports = app;
