const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Register a new user (defaults to role: 'member')
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, name, email, role, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const newUser = insertResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticate user with email and password
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Query user record including password hash
    const userResult = await query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    // Compare bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return currently authenticated user profile
 */
async function getMe(req, res) {
  res.json({ user: req.user });
}

/**
 * Return list of all users (for task assignment dropdowns)
 */
async function getAllUsers(req, res, next) {
  try {
    const result = await query(
      'SELECT id, name, email, role FROM users ORDER BY name ASC'
    );
    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
}

/**
 * Change authenticated user's password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Fetch password hash from DB
    const userResult = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // Check if new password is identical to old password
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password cannot be the same as the current password.' });
    }

    // Hash new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in DB
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Update authenticated user's profile details (e.g. name)
 */
async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const result = await query(
      `UPDATE users
       SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, created_at, updated_at`,
      [name.trim(), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: 'Profile updated successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  changePassword,
  updateProfile,
};
