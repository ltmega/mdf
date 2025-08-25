const jwt = require('jsonwebtoken');
const db = require('../config/db.js');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details from database to ensure role is current
    db.query('SELECT user_id, user_role FROM users WHERE user_id = ?', [decoded.user_id], (err, results) => {
      if (err) {
        console.error('❌ Database error:', err.message);
        return res.status(500).json({ error: 'Database error.' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ error: 'User not found.' });
      }
      
      const user = results[0];
      req.user = {
        id: user.user_id,
        role: user.user_role
      };
      
      next();
    });
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = verifyToken;