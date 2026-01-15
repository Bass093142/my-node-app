const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (users.length > 0) {
      const user = users[0];
      res.json({ 
        status: 'ok', 
        user: { 
          id: user.id, 
          name: user.first_name, 
          role: user.role, 
          prefix: user.prefix 
        } 
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Login failed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { email, password, prefix, firstName, lastName, phone } = req.body;
  try {
    // Default role คือ 'user'
    await db.query(
      'INSERT INTO users (email, password, prefix, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?, "user")', 
      [email, password, prefix, firstName, lastName, phone]
    );
    res.json({ status: 'ok', message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Users (Admin only)
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, prefix, first_name, last_name, role, phone FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;