const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validateMiddleware');

// Public authentication routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected user routes
router.get('/me', authenticate, authController.getMe);
router.get('/users', authenticate, authController.getAllUsers);

module.exports = router;
