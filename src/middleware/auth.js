/* ============================================================
   EID AGENCY — JWT AUTH MIDDLEWARE
   middleware/auth.js
   ============================================================ */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'eid_agency_super_secret_jwt_key_2026';

module.exports = function authMiddleware(req, res, next) {
  // Support both "Bearer <token>" and raw token
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({ message: 'غير مصرح. الرجاء تسجيل الدخول أولاً.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.' });
    }
    return res.status(403).json({ message: 'رمز المصادقة غير صالح.' });
  }
};
