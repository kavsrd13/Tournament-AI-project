/**
 * @module server
 * @description Express server entry point for TournamentPulse AI backend.
 * Configures security middleware (Helmet, CORS, rate limiting),
 * mounts API routes, and provides a health check endpoint.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Non-browser tools (health checks, tests, curl) have no Origin header.
    if (!origin || config.allowedOrigins.has(origin)) return callback(null, true);
    const error = new Error('CORS origin not allowed');
    error.statusCode = 403;
    return callback(error);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: config.jsonBodyLimit }));

/** Rate limiter: 100 requests per minute per IP */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: config.assistantRateLimitPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// ─── Health Check (before routes, not shadowed) ─────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────

const apiRoutes = require('./routes/apiRoutes');
app.use('/api', apiRoutes);
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Frontend Static Serving ────────────────────────────────────────

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route to serve index.html for client-side routing (React Router)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  } else {
    next();
  }
});

// ─── Global Error Handler ───────────────────────────────────────────

/**
 * Centralized error handler. Logs errors and returns a structured
 * JSON response. Never leaks stack traces in production.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const statusCode = err.statusCode || 500;
  const response = {
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
  };

  // Include details in development only
  if (config.nodeEnv !== 'production' && err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
});

// ─── Server Startup ─────────────────────────────────────────────────

// Only start listening when this module is run directly (not imported by tests)
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`[TournamentPulse AI] Server running on port ${config.port}`);
    console.log(`[TournamentPulse AI] Health check: http://localhost:${config.port}/api/health`);
  });
}

module.exports = app;
