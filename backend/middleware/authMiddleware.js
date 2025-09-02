const jwt = require("jsonwebtoken");
const db = require("../config/db.js");

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("⚠️ No token provided in request headers.");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [results] = await db.query(
      "SELECT user_id, user_role FROM users WHERE user_id = ?",
      [decoded.user_id]
    );

    if (!results || results.length === 0) {
      return res.status(401).json({ error: "User not found." });
    }

    const user = results[0];
    req.user = {
      user_id: user.user_id,
      user_role: user.user_role,
    };

    return next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
}

module.exports = verifyToken;
