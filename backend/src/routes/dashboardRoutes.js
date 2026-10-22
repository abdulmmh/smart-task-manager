const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/authMiddleware');

// Dashboard metrics route requires valid JWT authentication
router.get('/', authenticate, dashboardController.getDashboardMetrics);

module.exports = router;
