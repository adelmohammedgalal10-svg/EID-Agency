/* ============================================================
   EID AGENCY — PROJECTS ROUTES
   routes/projects.js
   ============================================================ */

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const { Project }    = require('../models');
const authMiddleware = require('../middleware/auth');
const upload         = require('../middleware/upload');

/* ─── GET /api/projects  (Public) ───────────────────────── */
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.service_id) filter.service_id = req.query.service_id;

    const projects = await Project
      .find(filter)
      .populate('service_id', 'title')
      .sort({ order: 1, createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب المشاريع', error: err.message });
  }
});

/* ─── GET /api/projects/:id  (Public) ───────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('service_id', 'title');
    if (!project) return res.status(404).json({ message: 'المشروع غير موجود' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'خطأ في جلب المشروع', error: err.message });
  }
});

/* ─── POST /api/projects  (Admin) ───────────────────────── */
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, service_id, description, order } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'اسم المشروع مطلوب' });
    }
    if (!service_id) {
      return res.status(400).json({ message: 'الخدمة المرتبطة مطلوبة' });
    }

    const projectData = {
      title:       title.trim(),
      service_id,
      description: description ? description.trim() : '',
      order:       order ? parseInt(order) : 0,
      image_url:   req.file ? `/uploads/${req.file.filename}` : null,
    };

    const project = await Project.create(projectData);
    const populated = await project.populate('service_id', 'title');

    res.status(201).json({ message: 'تمت إضافة المشروع بنجاح', project: populated });

  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'خطأ في إضافة المشروع', error: err.message });
  }
});

/* ─── PUT /api/projects/:id  (Admin) ────────────────────── */
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'المشروع غير موجود' });

    const { title, service_id, description, order } = req.body;

    if (title)       project.title       = title.trim();
    if (service_id)  project.service_id  = service_id;
    if (description !== undefined) project.description = description.trim();
    if (order !== undefined) project.order = parseInt(order) || 0;

    // Handle new image
    if (req.file) {
      if (project.image_url) {
        const oldPath = path.join(__dirname, '../..', project.image_url);
        if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
      }
      project.image_url = `/uploads/${req.file.filename}`;
    }

    await project.save();
    const populated = await project.populate('service_id', 'title');
    res.json({ message: 'تم تحديث المشروع بنجاح', project: populated });

  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: 'خطأ في تحديث المشروع', error: err.message });
  }
});

/* ─── DELETE /api/projects/:id  (Admin) ─────────────────── */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'المشروع غير موجود' });

    if (project.image_url) {
      const imgPath = path.join(__dirname, '../..', project.image_url);
      if (fs.existsSync(imgPath)) fs.unlink(imgPath, () => {});
    }

    await project.deleteOne();
    res.json({ message: 'تم حذف المشروع بنجاح' });

  } catch (err) {
    res.status(500).json({ message: 'خطأ في حذف المشروع', error: err.message });
  }
});

module.exports = router;
