/* ============================================================
   EID AGENCY — SERVICES ROUTES
   routes/services.js
   ============================================================ */

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const { Service }    = require('../models');
const authMiddleware = require('../middleware/auth');
const upload         = require('../middleware/upload');

/* ─── GET /api/services  (Public) ───────────────────────── */
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ order: 1, createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب الخدمات', error: err.message });
  }
});

/* ─── GET /api/services/:id  (Public) ───────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'الخدمة غير موجودة' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب الخدمة', error: err.message });
  }
});

/* ─── POST /api/services  (Admin) ───────────────────────── */
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'اسم الخدمة مطلوب' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'وصف الخدمة مطلوب' });
    }

    const serviceData = {
      title:       title.trim(),
      description: description.trim(),
      order:       order ? parseInt(order) : 0,
      image_url:   req.file ? `/uploads/${req.file.filename}` : null,
    };

    const service = await Service.create(serviceData);
    res.status(201).json({ message: 'تمت إضافة الخدمة بنجاح', service });

  } catch (err) {
    // Remove uploaded file on error
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'خطأ في إضافة الخدمة', error: err.message });
  }
});

/* ─── PUT /api/services/:id  (Admin) ────────────────────── */
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'الخدمة غير موجودة' });

    const { title, description, order } = req.body;

    if (title)       service.title       = title.trim();
    if (description) service.description = description.trim();
    if (order !== undefined) service.order = parseInt(order) || 0;

    // Handle new image upload
    if (req.file) {
      // Delete old image if exists
      if (service.image_url) {
        const oldPath = path.join(__dirname, '../..', service.image_url);
        if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
      }
      service.image_url = `/uploads/${req.file.filename}`;
    }

    await service.save();
    res.json({ message: 'تم تحديث الخدمة بنجاح', service });

  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'خطأ في تحديث الخدمة', error: err.message });
  }
});

/* ─── DELETE /api/services/:id  (Admin) ─────────────────── */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'الخدمة غير موجودة' });

    // Delete associated image
    if (service.image_url) {
      const imgPath = path.join(__dirname, '../..', service.image_url);
      if (fs.existsSync(imgPath)) fs.unlink(imgPath, () => {});
    }

    await service.deleteOne();
    res.json({ message: 'تم حذف الخدمة بنجاح' });

  } catch (err) {
    res.status(500).json({ message: 'خطأ في حذف الخدمة', error: err.message });
  }
});

module.exports = router;
