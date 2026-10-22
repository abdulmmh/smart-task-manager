const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { validateProject } = require('../middleware/validateMiddleware');

// All project routes require authentication
router.use(authenticate);

// Read routes (both Admin and Members)
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);

// Admin-only mutation routes
router.post('/', requireAdmin, validateProject, projectController.createProject);
router.put('/:id', requireAdmin, validateProject, projectController.updateProject);
router.delete('/:id', requireAdmin, projectController.deleteProject);

module.exports = router;
