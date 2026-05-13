/* ============================================================
   EID AGENCY — INQUIRIES ROUTES
   routes/inquiries.js
   ============================================================ */

const express = require('express');
const router  = express.Router();

const { Inquiry }    = require('../models');
const authMiddleware = require('../middleware/auth');

/* ─── POST /api/inquiries  (Public — Contact Form) ──────── */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'الاسم مطلوب' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'البريد الإلكتروني مطلوب' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ message: 'البريد الإلكتروني غير صحيح' });
    }
    if (!message || !message.trim() || message.trim().length < 5) {
      return res.status(400).json({ message: 'الرسالة مطلوبة ويجب أن تكون 5 أحرف على الأقل' });
    }

    // Basic spam check: rate limit by email (1 per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentInquiry = await Inquiry.findOne({
      email:     email.trim().toLowerCase(),
      createdAt: { $gte: oneHourAgo },
    });

    if (recentInquiry) {
      return res.status(429).json({
        message: 'لقد أرسلت رسالة مؤخراً. يرجى الانتظار ساعة قبل الإرسال مرة أخرى.',
      });
    }

    const inquiry = await Inquiry.create({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      phone:   phone ? phone.trim() : '',
      message: message.trim(),
    });

    res.status(201).json({
      message: 'تم إرسال رسالتك بنجاح! سنتواصل معك في أقرب وقت.',
      id: inquiry._id,
    });

  } catch (err) {
    console.error('Inquiry error:', err);
    res.status(500).json({ message: 'خطأ في إرسال الاستفسار. يرجى المحاولة لاحقاً.' });
  }
});

/* ─── GET /api/inquiries  (Admin) ───────────────────────── */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.isRead === 'true')  filter.isRead = true;
    if (req.query.isRead === 'false') filter.isRead = false;

    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Inquiry.countDocuments(filter),
    ]);

    res.json(inquiries);

  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب الاستفسارات', error: err.message });
  }
});

/* ─── GET /api/inquiries/:id  (Admin) ───────────────────── */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'الاستفسار غير موجود' });

    // Mark as read
    if (!inquiry.isRead) {
      inquiry.isRead = true;
      await inquiry.save();
    }

    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب الاستفسار', error: err.message });
  }
});

/* ─── PATCH /api/inquiries/:id/read  (Admin) ────────────── */
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    if (!inquiry) return res.status(404).json({ message: 'الاستفسار غير موجود' });
    res.json({ message: 'تم تحديد الاستفسار كمقروء', inquiry });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في التحديث', error: err.message });
  }
});

/* ─── DELETE /api/inquiries/:id  (Admin) ────────────────── */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'الاستفسار غير موجود' });

    await inquiry.deleteOne();
    res.json({ message: 'تم حذف الاستفسار بنجاح' });

  } catch (err) {
    res.status(500).json({ message: 'خطأ في حذف الاستفسار', error: err.message });
  }
});

/* ─── DELETE /api/inquiries  (Admin — bulk delete all) ──── */
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const result = await Inquiry.deleteMany({});
    res.json({ message: `تم حذف ${result.deletedCount} استفسار بنجاح` });
  } catch (err) {
    res.status(500).json({ message: 'خطأ في الحذف الجماعي', error: err.message });
  }
});

module.exports = router;
