/* ============================================================
   EID AGENCY — DATABASE SEED SCRIPT
   seed.js  —  Run: node seed.js
   Populates MongoDB with initial demo data
   ============================================================ */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Service, Project, Package, Inquiry } = require('./src/models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eid_agency';

/* ─── SEED DATA ──────────────────────────────────────────── */

const ADMIN_USER = {
  username: 'admin',
  password: 'eid@2026',
  role:     'admin',
};

const SERVICES = [
  {
    title:       'إدارة السوشيال ميديا',
    description: 'ندير حساباتك على جميع منصات التواصل الاجتماعي باحترافية تامة، من إنشاء المحتوى الإبداعي إلى جدولة النشر والتفاعل مع جمهورك لبناء حضور رقمي قوي ومؤثر.',
    image_url:   null,
    order:       1,
  },
  {
    title:       'تصميم الجرافيك والهوية البصرية',
    description: 'نصمم هوية بصرية متكاملة تعكس قيم علامتك التجارية وتميزك عن المنافسين، من الشعار والألوان إلى جميع المواد التسويقية والإعلانية.',
    image_url:   null,
    order:       2,
  },
  {
    title:       'برمجة المواقع والتطبيقات',
    description: 'نبني مواقع وتطبيقات احترافية بأحدث التقنيات، سريعة الأداء، متوافقة مع محركات البحث، وتقدم تجربة مستخدم استثنائية على جميع الأجهزة.',
    image_url:   null,
    order:       3,
  },
  {
    title:       'الإعلانات المدفوعة (Google & Meta Ads)',
    description: 'نطلق حملات إعلانية مدروسة على جوجل وميتا تستهدف جمهورك المثالي بدقة عالية، مع مراقبة مستمرة وتحسين مستمر لتحقيق أفضل عائد على الاستثمار.',
    image_url:   null,
    order:       4,
  },
  {
    title:       'تحسين محركات البحث (SEO)',
    description: 'نحسّن ظهور موقعك في نتائج محركات البحث من خلال استراتيجيات SEO متكاملة تشمل البحث عن الكلمات المفتاحية، تحسين المحتوى، وبناء الروابط الخارجية.',
    image_url:   null,
    order:       5,
  },
  {
    title:       'إنتاج المحتوى الإبداعي',
    description: 'نصنع محتوى مرئياً وكتابياً يجذب الانتباه ويحقق التفاعل، من مقاطع الفيديو القصيرة والريلز إلى المقالات والبودكاست والإنفوجرافيك.',
    image_url:   null,
    order:       6,
  },
];

const PROJECTS = (serviceIds) => [
  {
    title:       'إطلاق متجر إلكتروني لشركة الأناقة الحديثة',
    service_id:  serviceIds[2], // برمجة
    description: 'بنينا متجراً إلكترونياً متكاملاً بأحدث تقنيات الويب، مع نظام دفع آمن وتجربة مستخدم سلسة أدت إلى زيادة المبيعات بنسبة 200% في أول 3 أشهر.',
    image_url:   null,
    order:       1,
  },
  {
    title:       'حملة إعلانية لمطاعم ليالي الشرق',
    service_id:  serviceIds[3], // إعلانات
    description: 'أدرنا حملة إعلانية شاملة على جوجل وميتا حققت نتائج استثنائية: 500 حجز جديد في أسبوع واحد وعائد 8x على الاستثمار الإعلاني.',
    image_url:   null,
    order:       2,
  },
  {
    title:       'إعادة تصميم هوية شركة نور للعقارات',
    service_id:  serviceIds[1], // تصميم
    description: 'صممنا هوية بصرية جديدة كلياً تعكس الفخامة والثقة، شملت الشعار والألوان والخطوط وكافة المواد الترويجية الرقمية والمطبوعة.',
    image_url:   null,
    order:       3,
  },
  {
    title:       'إدارة منصات مركز النور التعليمي',
    service_id:  serviceIds[0], // سوشيال ميديا
    description: 'تولينا إدارة حسابات السوشيال ميديا الكاملة وحققنا نمواً في المتابعين بنسبة 300% خلال 6 أشهر مع رفع نسبة التفاعل 5 أضعاف.',
    image_url:   null,
    order:       4,
  },
  {
    title:       'موقع شركة المستقبل للاستشارات',
    service_id:  serviceIds[2], // برمجة
    description: 'طورنا موقعاً احترافياً متعدد اللغات مع لوحة تحكم متكاملة، محسّن للسيو وسريع التحميل، نتج عنه ضاعفة عدد الزيارات العضوية.',
    image_url:   null,
    order:       5,
  },
  {
    title:       'تهيئة SEO لمتجر الكمال للتجزئة',
    service_id:  serviceIds[4], // SEO
    description: 'طبقنا استراتيجية SEO شاملة أوصلت الموقع إلى الصفحة الأولى في جوجل لأكثر من 50 كلمة مفتاحية مستهدفة خلال 4 أشهر.',
    image_url:   null,
    order:       6,
  },
];

const PACKAGES = [
  {
    title: 'الباقة الأساسية',
    price: 1500,
    features: [
      'إدارة منصة تواصل اجتماعي واحدة',
      '12 منشوراً شهرياً',
      'تصميم 8 تصاميم جرافيك',
      'تقرير أداء شهري',
      'دعم عبر واتساب',
    ],
    is_recommended: false,
    order: 1,
  },
  {
    title: 'الباقة الاحترافية',
    price: 3500,
    features: [
      'إدارة 3 منصات تواصل اجتماعي',
      '30 منشوراً شهرياً',
      'تصميم 20 تصميم جرافيك',
      'إدارة إعلانات مدفوعة بميزانية 1000 جنيه',
      'تحسين SEO أساسي',
      'تقرير أداء أسبوعي',
      'دعم 24/7 عبر واتساب',
      'اجتماع شهري مع فريق العمل',
    ],
    is_recommended: true,
    order: 2,
  },
  {
    title: 'باقة المؤسسات',
    price: 7000,
    features: [
      'إدارة جميع المنصات (5 منصات)',
      'محتوى غير محدود',
      'تصميم غير محدود',
      'إدارة إعلانات مدفوعة بميزانية 3000 جنيه',
      'SEO متقدم + تقارير مفصلة',
      'إنتاج فيديو (4 مقاطع شهرياً)',
      'مدير حساب مخصص',
      'دعم فوري على مدار الساعة',
    ],
    is_recommended: false,
    order: 3,
  },
];

const INQUIRIES = [
  {
    name:    'محمد أحمد السيد',
    email:   'mohammed.ahmed@example.com',
    phone:   '01012345678',
    message: 'أريد الاستفسار عن باقة إدارة السوشيال ميديا وما هي الخدمات المشمولة فيها بالتفصيل، وهل يمكن تخصيص الباقة حسب احتياجاتي؟',
  },
  {
    name:    'سارة حسن المصري',
    email:   'sara.hassan@example.com',
    phone:   '01098765432',
    message: 'لدي متجر إلكتروني وأحتاج إلى تصميم هوية بصرية جديدة وإدارة حسابات السوشيال ميديا. هل يمكنكم تقديم عرض سعر شامل؟',
  },
  {
    name:    'خالد عبدالله النجار',
    email:   'khaled.najjar@example.com',
    phone:   '01155544433',
    message: 'أبحث عن وكالة موثوقة لإدارة حملاتي الإعلانية على جوجل وفيسبوك. ميزانيتي الشهرية 5000 جنيه. هل يمكنكم مساعدتي؟',
  },
];

/* ─── SEED FUNCTION ──────────────────────────────────────── */
async function seed() {
  try {
    console.log('\n🌱 EID Agency — Database Seeding Started...');
    console.log('═'.repeat(50));

    // Connect
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser:    true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // ── Clean existing data ──────────────────────────────
    console.log('\n🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Service.deleteMany({}),
      Project.deleteMany({}),
      Package.deleteMany({}),
      Inquiry.deleteMany({}),
    ]);
    console.log('   ✓ All collections cleared');

    // ── Create Admin User ────────────────────────────────
    console.log('\n👤 Creating admin user...');
    const admin = await User.create(ADMIN_USER);
    console.log(`   ✓ Admin created — username: "${ADMIN_USER.username}" | password: "${ADMIN_USER.password}"`);

    // ── Create Services ──────────────────────────────────
    console.log('\n⚡ Creating services...');
    const createdServices = await Service.insertMany(SERVICES);
    console.log(`   ✓ ${createdServices.length} services created`);
    createdServices.forEach(s => console.log(`     • ${s.title}`));

    const serviceIds = createdServices.map(s => s._id);

    // ── Create Projects ──────────────────────────────────
    console.log('\n📁 Creating projects...');
    const projectsData  = PROJECTS(serviceIds);
    const createdProjects = await Project.insertMany(projectsData);
    console.log(`   ✓ ${createdProjects.length} projects created`);
    createdProjects.forEach(p => console.log(`     • ${p.title}`));

    // ── Create Packages ──────────────────────────────────
    console.log('\n🏷️  Creating pricing packages...');
    const createdPackages = await Package.insertMany(PACKAGES);
    console.log(`   ✓ ${createdPackages.length} packages created`);
    createdPackages.forEach(p => console.log(`     • ${p.title} — ${p.price.toLocaleString('ar-EG')} جنيه${p.is_recommended ? ' ⭐' : ''}`));

    // ── Create Sample Inquiries ──────────────────────────
    console.log('\n📬 Creating sample inquiries...');
    const createdInquiries = await Inquiry.insertMany(INQUIRIES);
    console.log(`   ✓ ${createdInquiries.length} inquiries created`);
    createdInquiries.forEach(i => console.log(`     • من: ${i.name}`));

    // ── Summary ──────────────────────────────────────────
    console.log('\n' + '═'.repeat(50));
    console.log('✅ Database seeded successfully!\n');
    console.log('📋 Summary:');
    console.log(`   👤 Admin Users  : 1`);
    console.log(`   ⚡ Services     : ${createdServices.length}`);
    console.log(`   📁 Projects     : ${createdProjects.length}`);
    console.log(`   🏷️  Packages     : ${createdPackages.length}`);
    console.log(`   📬 Inquiries    : ${createdInquiries.length}`);
    console.log('\n🔐 Admin Credentials:');
    console.log(`   Username : ${ADMIN_USER.username}`);
    console.log(`   Password : ${ADMIN_USER.password}`);
    console.log('\n🌐 API Base URL  : http://localhost:5000/api');
    console.log('🖥️  Admin Panel   : admin.html');
    console.log('═'.repeat(50) + '\n');

  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    if (err.code === 11000) {
      console.error('   Duplicate key error — data may already exist');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
    process.exit(0);
  }
}

seed();
