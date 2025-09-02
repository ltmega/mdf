const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get user profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT user_id, username, email, user_role, profile_picture_url FROM users WHERE user_id = ?', [req.user.user_id]);
    const user = users[0];
    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      user_role: user.user_role,
      profile_picture_url: user.profile_picture_url
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update profile (username, email, profile picture)
router.put('/', verifyToken, upload.single('profile_pic'), async (req, res) => {
  const { username, email } = req.body;
  const profilePic = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (profilePic) {
      updates.push('profile_picture_url = ?');
      values.push(profilePic);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.user.user_id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
    await db.query(sql, values);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;
