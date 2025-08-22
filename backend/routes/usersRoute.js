const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db.js');

// POST /api/users/register
router.post('/register', async (req, res) => {
  console.log("📥 Register request:", req.body);

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    console.log("⚠️ Missing registration fields");
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      console.log("❌ Username already exists:", username);
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'customer';

    await db.query(
      'INSERT INTO users (username, email, password, user_role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    console.log("✅ User registered:", username);
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  console.log("📥 Login request:", req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    console.log("⚠️ Missing login fields");
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      console.log("❌ No user found with username:", username);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Password match:", isMatch);

    if (!isMatch) {
      console.log("❌ Incorrect password for user:", username);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, user_role: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log("✅ Login successful:", {
      user_id: user.user_id,
      username: user.username,
      role: user.user_role,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        user_role: user.user_role,
        profile_picture_url: user.profile_picture_url || 'icon.png',
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

module.exports = router;