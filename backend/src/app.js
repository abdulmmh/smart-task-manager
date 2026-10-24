const express = require('express');
const cors = require('cors');
const { CLIENT_URL } = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { query } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middlewares
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

// Reject non-JSON requests when a body payload is present on mutation routes
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentLength = req.headers['content-length'];
    if (contentLength && contentLength !== '0' && !req.is('application/json')) {
      return res.status(400).json({
        error: 'Content-Type must be application/json for requests with a payload.'
      });
    }
  }
  next();
});

app.use(express.json());

// Health check endpoint with real PostgreSQL connectivity verification
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1 AS alive');
    res.json({
      status: 'OK',
      database: 'connected',
      service: 'Smart Task & Project Manager API',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'Degraded',
      database: 'disconnected',
      error: 'PostgreSQL database connectivity check failed.',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Not Found Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
