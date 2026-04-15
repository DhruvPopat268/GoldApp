require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const xss = require('xss');

const app = express();

// Trust proxy — required when behind reverse proxy (nginx, load balancer)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — restrict to known frontend origin in production
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow server-to-server (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));

// NoSQL injection sanitization
app.use(mongoSanitize());

// XSS sanitization — strip HTML tags from all string body fields
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') req.body[key] = xss(req.body[key]);
    }
  }
  next();
});

// Global rate limit: 100 requests per 15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Static files with error handling
if (process.env.NODE_ENV === 'production') {
  app.use('/cloud/images', express.static('/app/cloud/images'));
  app.use('/cloud/documents', express.static('/app/cloud/documents'));
} else {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Handle missing static files
app.use('/uploads', (req, res) => {
  res.status(404).json({ error: 'File not found' });
});
 
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/banks', require('./routes/bankRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Global error handler — never leak stack traces in production
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
