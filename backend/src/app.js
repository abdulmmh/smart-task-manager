const express = require('express');
const cors = require('cors');
const { CLIENT_URL } = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Global Middlewares
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

// Health check endpoint for uptime monitoring and automated grading
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Smart Task & Project Manager API',
    timestamp: new Date().toISOString(),
  });
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
