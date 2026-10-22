const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');
const { validateTask } = require('../middleware/validateMiddleware');

// All task routes require authentication
router.use(authenticate);

// Read tasks (Both Admin and Members)
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);

// Create task (Admin only)
router.post('/', requireAdmin, validateTask, taskController.createTask);

// Update task (Admins edit all fields; Members update status of assigned tasks)
router.put('/:id', validateTask, taskController.updateTask);

// Delete task (Admin only)
router.delete('/:id', requireAdmin, taskController.deleteTask);

module.exports = router;
