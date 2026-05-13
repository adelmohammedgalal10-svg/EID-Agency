/* ============================================================
   EID AGENCY — AUTH ROUTES
   routes/auth.js
   ============================================================ */

const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();
const { User } = require('../models');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET  = process.env.JWT_SECRET  || 'eid_agency_super_secret_jwt_key_2026';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

/* ─── POST /api/auth/login ───────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'اسم المستخدم وكلمة المرور مطلوبان' });
    }

    // Find user
    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role },
      expiresIn: JWT_EXPIRES,
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'خطأ في الخادم. يرجى المحاولة لاحقاً.' });
  }
});

/* ─── GET /api/auth/me ───────────────────────────────────── */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
    res.json({ id: user._id, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

/* ─── PUT /api/auth/change-password ─────────────────────── */
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'كلمة المرور الحالية والجديدة مطلوبتان' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
    }

    const user = await User.findById(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });

  } catch (err) {
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

module.exports = router;
