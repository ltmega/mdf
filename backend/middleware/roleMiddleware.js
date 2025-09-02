function requireRole(allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !req.user.user_role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.user_role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = requireRole;


