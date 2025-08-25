const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get user profile
router.get('/', verifyToken, async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT user_id, username, email, user_role, profile_picture_url FROM users WHERE user_id = ?', [req.user.id]);
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

// Update profile (name, email, profile picture)
router.put('/', verifyToken, upload.single('profile_pic'), async (req, res) => {
  const { name, email } = req.body;
  const profilePic = req.file ? req.file.filename : undefined;

  try {
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (profilePic) {
      updates.push('profile_pic = ?');
      values.push(profilePic);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.user.id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.promise().query(sql, values);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;
