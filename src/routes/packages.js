/* ============================================================
   EID AGENCY — PACKAGES ROUTES
   routes/packages.js
   ============================================================ */

const express = require('express');
const router  = express.Router();

const { Package }    = require('../models');
const authMiddleware = require('../middleware/auth');

/* ─── GET /api/packages  (Public) ───────────────────────── */
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find().sort({ order: 1, createdAt: 1 });
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب الباقات', error: err.message });
  }
});

/* ─── GET /api/packages/:id  (Public) ───────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'الباقة غير موجودة' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب الباقة', error: err.message });
  }
});

/* ─── POST /api/packages  (Admin) ───────────────────────── */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, price, features, is_recommended, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'اسم الباقة مطلوب' });
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({ message: 'السعر مطلوب ويجب أن يكون رقماً' });
    }
    if (!Array.isArray(features) || features.filter(Boolean).length === 0) {
      return res.status(400).json({ message: 'يجب إضافة ميزة واحدة على الأقل' });
    }

    // If recommended, unset others
    if (is_recommended) {
      await Package.updateMany({}, { $set: { is_recommended: false } });
    }

    const pkg = await Package.create({
      title:          title.trim(),
      price:          Number(price),
      features:       features.filter(f => f && f.trim()).map(f => f.trim()),
      is_recommended: Boolean(is_recommended),
      order:          order ? parseInt(order) : 0,
    });

    res.status(201).json({ message: 'تمت إضافة الباقة بنجاح', package: pkg });

  } catch (err) {
    res.status(500).json({ message: 'خطأ في إضافة الباقة', error: err.message });
  }
});

/* ─── PUT /api/packages/:id  (Admin) ────────────────────── */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'الباقة غير موجودة' });

    const { title, price, features, is_recommended, order } = req.body;

    if (title !== undefined)   pkg.title = title.trim();
    if (price !== undefined)   pkg.price = Number(price);
    if (order !== undefined)   pkg.order = parseInt(order) || 0;

    if (Array.isArray(features)) {
      pkg.features = features.filter(f => f && f.trim()).map(f => f.trim());
    }

    if (is_recommended !== undefined) {
      if (is_recommended) {
        await Package.updateMany({ _id: { $ne: pkg._id } }, { $set: { is_recommended: false } });
      }
      pkg.is_recommended = Boolean(is_recommended);
    }

    await pkg.save();
    res.json({ message: 'تم تحديث الباقة بنجاح', package: pkg });

  } catch (err) {
    res.status(500).json({ message: 'خطأ في تحديث الباقة', error: err.message });
  }
});

/* ─── DELETE /api/packages/:id  (Admin) ─────────────────── */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'الباقة غير موجودة' });

    await pkg.deleteOne();
    res.json({ message: 'تم حذف الباقة بنجاح' });

  } catch (err) {
    res.status(500).json({ message: 'خطأ في حذف الباقة', error: err.message });
  }
});

module.exports = router;
