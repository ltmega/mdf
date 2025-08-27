const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  // Load fresh role (and confirm user exists)
  db.query(
    'SELECT user_id, user_role FROM users WHERE user_id = ? LIMIT 1',
    [decoded.user_id],
    (err, rows) => {
      if (err) {
        console.error('❌ DB error in auth lookup:', err.message);
        return res.status(500).json({ error: 'Database error.' });
      }
      if (!rows || rows.length === 0) {
        return res.status(401).json({ error: 'User not found.' });
      }

      const u = rows[0];
      // IMPORTANT: provide user_id field exactly as controllers expect
      req.user = {
        user_id: u.user_id,
        user_role: u.user_role
      };

      // helpful debug (comment out in production)
      // console.log('🔐 Auth OK for user:', req.user);

      next();
    }
  );
};
