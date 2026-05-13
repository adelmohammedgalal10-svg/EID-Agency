/* ============================================================
   EID AGENCY — MONGOOSE MODELS
   models/index.js  (exports all models)
   ============================================================ */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

/* ─── 1. USER MODEL ──────────────────────────────────────── */
const userSchema = new mongoose.Schema(
  {
    username: {
      type:     String,
      required: [true, 'اسم المستخدم مطلوب'],
      unique:   true,
      trim:     true,
      minlength:[3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'],
    },
    password: {
      type:     String,
      required: [true, 'كلمة المرور مطلوبة'],
      minlength:[6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
    },
    role: {
      type:    String,
      enum:    ['admin', 'editor'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never return password in JSON
userSchema.set('toJSON', {
  transform: (doc, ret) => { delete ret.password; return ret; },
});

const User = mongoose.model('User', userSchema);

/* ─── 2. SERVICE MODEL ───────────────────────────────────── */
const serviceSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'اسم الخدمة مطلوب'],
      trim:     true,
      maxlength:[120, 'اسم الخدمة لا يتجاوز 120 حرفاً'],
    },
    description: {
      type:     String,
      required: [true, 'وصف الخدمة مطلوب'],
      trim:     true,
      maxlength:[1000, 'الوصف لا يتجاوز 1000 حرف'],
    },
    image_url: {
      type:    String,
      default: null,
    },
    order: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Service = mongoose.model('Service', serviceSchema);

/* ─── 3. PROJECT MODEL ───────────────────────────────────── */
const projectSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'اسم المشروع مطلوب'],
      trim:     true,
      maxlength:[150, 'اسم المشروع لا يتجاوز 150 حرفاً'],
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'الخدمة المرتبطة مطلوبة'],
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
    },
    image_url: {
      type:    String,
      default: null,
    },
    order: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);

/* ─── 4. PACKAGE MODEL ───────────────────────────────────── */
const packageSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'اسم الباقة مطلوب'],
      trim:     true,
      maxlength:[100, 'اسم الباقة لا يتجاوز 100 حرف'],
    },
    price: {
      type:    Number,
      required:[true, 'السعر مطلوب'],
      min:     [0, 'السعر لا يمكن أن يكون سالباً'],
    },
    features: {
      type:    [String],
      default: [],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'يجب إضافة ميزة واحدة على الأقل',
      },
    },
    is_recommended: {
      type:    Boolean,
      default: false,
    },
    order: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Only one package can be recommended at a time
packageSchema.pre('save', async function (next) {
  if (this.is_recommended && this.isModified('is_recommended')) {
    await mongoose.model('Package').updateMany(
      { _id: { $ne: this._id } },
      { $set: { is_recommended: false } }
    );
  }
  next();
});

const Package = mongoose.model('Package', packageSchema);

/* ─── 5. INQUIRY MODEL ───────────────────────────────────── */
const inquirySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'الاسم مطلوب'],
      trim:     true,
      maxlength:[100, 'الاسم لا يتجاوز 100 حرف'],
    },
    email: {
      type:     String,
      required: [true, 'البريد الإلكتروني مطلوب'],
      trim:     true,
      lowercase: true,
      match:    [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'البريد الإلكتروني غير صحيح'],
    },
    phone: {
      type:  String,
      trim:  true,
      default: '',
    },
    message: {
      type:     String,
      required: [true, 'الرسالة مطلوبة'],
      trim:     true,
      minlength:[5, 'الرسالة يجب أن تكون 5 أحرف على الأقل'],
    },
    date: {
      type:    Date,
      default: Date.now,
    },
    isRead: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Inquiry = mongoose.model('Inquiry', inquirySchema);

/* ─── EXPORTS ────────────────────────────────────────────── */
module.exports = { User, Service, Project, Package, Inquiry };
