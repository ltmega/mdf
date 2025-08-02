const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Should contain jwtSecret

// Middleware to verify JWT from Authorization header
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check if header exists and starts with Bearer
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'No token provided. Authorization denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // Example: { id, role } if set during login
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.status(401).json({ error: 'Invalid or expired token. Unauthorized.' });
  }
};

module.exports = verifyToken;
