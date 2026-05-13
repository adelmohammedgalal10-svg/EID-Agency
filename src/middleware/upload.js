/* ============================================================
   EID AGENCY — MULTER UPLOAD MIDDLEWARE
   middleware/upload.js
   ============================================================ */

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Storage Configuration ────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 40);
    const unique   = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${basename}-${unique}${ext}`);
  },
});

// ─── File Filter ──────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype= allowed.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بصيغ: JPG, PNG, GIF, WEBP, SVG'), false);
  }
};

// ─── Multer Instance ──────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
