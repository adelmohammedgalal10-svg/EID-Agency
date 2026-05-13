/* ============================================================
   EID AGENCY — ADMIN DASHBOARD SCRIPT (admin.js)
   Handles: Auth, CRUD, Uploads, Modals, Toasts, Navigation
   ============================================================ */

'use strict';

const API = 'http://localhost:5000/api';

/* ─── STATE ─────────────────────────────────────────────── */
let currentSection   = 'overview';
let deleteCallback   = null;
let allServices      = [];
let allProjects      = [];
let allPackages      = [];
let allInquiries     = [];

/* ═══════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initClock();

  const token = localStorage.getItem('eid-admin-token');
  if (token) {
    showDashboard();
  } else {
    showLoginOverlay();
  }

  initLoginForm();
  initSidebarNav();
  initSidebarCollapse();
  initMobileSidebar();
  initModalClosers();
  initDeleteModal();
  initFileUploads();
  initPackageFeatures();
  initSearchListeners();
  initQuickActions();
});

/* ═══════════════════════════════════════════════════════════
   1. THEME
═══════════════════════════════════════════════════════════ */
function initTheme() {
  const btn  = document.getElementById('adminThemeToggle');
  const icon = document.getElementById('adminThemeIcon');
  const html = document.documentElement;

  const saved = localStorage.getItem('eid-theme') || 'dark';
  applyTheme(saved);

  if (btn) btn.addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('eid-theme', t);
    if (icon) icon.className = t === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  }
}

/* ═══════════════════════════════════════════════════════════
   2. CLOCK
═══════════════════════════════════════════════════════════ */
function initClock() {
  const el = document.getElementById('topbarTime');
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  tick();
  setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════════
   3. AUTH
═══════════════════════════════════════════════════════════ */
function initLoginForm() {
  const form      = document.getElementById('loginForm');
  const errorBox  = document.getElementById('loginError');
  const errorText = document.getElementById('loginErrorText');
  const loginBtn  = document.getElementById('loginBtn');
  const togglePass= document.getElementById('togglePass');
  const passInput = document.getElementById('loginPassword');
  const passIcon  = document.getElementById('passEyeIcon');

  // Toggle password visibility
  if (togglePass) {
    togglePass.addEventListener('click', () => {
      const isText = passInput.type === 'text';
      passInput.type = isText ? 'password' : 'text';
      passIcon.className = isText ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });
  }

  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';

    const username = form.querySelector('#loginUsername').value.trim();
    const password = form.querySelector('#loginPassword').value;

    if (!username || !password) {
      showLoginError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoginLoading(true);

    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showLoginError(data.message || 'بيانات الدخول غير صحيحة');
        return;
      }

      localStorage.setItem('eid-admin-token', data.token);
      showDashboard();
      showToast('مرحباً بعودتك! تم تسجيل الدخول بنجاح', 'success');

    } catch (err) {
      showLoginError('تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت.');
    } finally {
      setLoginLoading(false);
    }
  });

  // Logout buttons
  ['adminLogout','adminLogoutMob'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', logout);
  });
}

function showLoginError(msg) {
  const box  = document.getElementById('loginError');
  const text = document.getElementById('loginErrorText');
  if (box && text) {
    text.textContent = msg;
    box.style.display = 'flex';
    // Trigger re-animation
    box.style.animation = 'none';
    void box.offsetWidth;
    box.style.animation = '';
  }
}

function setLoginLoading(loading) {
  const btn    = document.getElementById('loginBtn');
  const text   = btn.querySelector('.login-btn-text');
  const icon   = btn.querySelector('.login-btn-icon');
  const loader = btn.querySelector('.login-btn-loader');
  btn.disabled = loading;
  if (text)   text.style.display   = loading ? 'none' : '';
  if (icon)   icon.style.display   = loading ? 'none' : '';
  if (loader) loader.style.display = loading ? 'flex' : 'none';
}

function showDashboard() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('adminApp').style.display     = 'flex';
  loadSection('overview');
}

function showLoginOverlay() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('adminApp').style.display     = 'none';
}

function logout() {
  localStorage.removeItem('eid-admin-token');
  showLoginOverlay();
  showToast('تم تسجيل الخروج بنجاح', 'info');
}

function authHeaders() {
  const token = localStorage.getItem('eid-admin-token');
  return { 'Authorization': `Bearer ${token}` };
}

function handleUnauthorized(res) {
  if (res.status === 401 || res.status === 403) {
    logout();
    showToast('انتهت جلستك. يرجى تسجيل الدخول مرة أخرى', 'warning');
    return true;
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════
   4. SIDEBAR NAVIGATION
═══════════════════════════════════════════════════════════ */
function initSidebarNav() {
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      if (section) loadSection(section);
    });
  });

  document.querySelectorAll('.ov-card-action[data-section]').forEach(btn => {
    btn.addEventListener('click', () => loadSection(btn.dataset.section));
  });
}

function loadSection(name) {
  currentSection = name;

  // Update nav items
  document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === name);
    btn.setAttribute('aria-current', btn.dataset.section === name ? 'page' : 'false');
  });

  // Show/hide sections
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.style.display = sec.id === `section${capitalize(name)}` ? 'block' : 'none';
  });

  // Update topbar title
  const titles = {
    overview:'نظرة عامة', services:'الخدمات',
    projects:'المشاريع', packages:'الباقات والأسعار', inquiries:'الاستفسارات'
  };
  const titleEl = document.getElementById('contentTitle');
  const breadEl = document.getElementById('breadcrumbCurrent');
  const mobTitle = document.getElementById('mobPageTitle');
  if (titleEl) titleEl.textContent = titles[name] || name;
  if (breadEl) breadEl.textContent = titles[name] || name;
  if (mobTitle) mobTitle.textContent = titles[name] || name;

  // Load data
  const loaders = {
    overview:  loadOverview,
    services:  loadServices,
    projects:  loadProjects,
    packages:  loadPackages,
    inquiries: loadInquiries,
  };
  if (loaders[name]) loaders[name]();

  // Close mobile sidebar
  closeMobileSidebar();
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ═══════════════════════════════════════════════════════════
   5. SIDEBAR COLLAPSE / MOBILE
═══════════════════════════════════════════════════════════ */
function initSidebarCollapse() {
  const btn = document.getElementById('sidebarCollapseBtn');
  const sb  = document.getElementById('adminSidebar');
  if (!btn || !sb) return;
  btn.addEventListener('click', () => sb.classList.toggle('collapsed'));
}

function initMobileSidebar() {
  const toggle  = document.getElementById('mobMenuToggle');
  const overlay = document.getElementById('sidebarMobOverlay');
  const sb      = document.getElementById('adminSidebar');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    sb.classList.toggle('mob-open');
    overlay.classList.toggle('visible');
  });
  overlay.addEventListener('click', closeMobileSidebar);
}

function closeMobileSidebar() {
  document.getElementById('adminSidebar')?.classList.remove('mob-open');
  document.getElementById('sidebarMobOverlay')?.classList.remove('visible');
}

/* ═══════════════════════════════════════════════════════════
   6. OVERVIEW
═══════════════════════════════════════════════════════════ */
async function loadOverview() {
  try {
    const [svcRes, prjRes, pkgRes, inqRes] = await Promise.all([
      fetch(`${API}/services`,  { headers: authHeaders() }),
      fetch(`${API}/projects`,  { headers: authHeaders() }),
      fetch(`${API}/packages`,  { headers: authHeaders() }),
      fetch(`${API}/inquiries`, { headers: authHeaders() }),
    ]);

    if (handleUnauthorized(svcRes)) return;

    const [svcs, prjs, pkgs, inqs] = await Promise.all([
      svcRes.json(), prjRes.json(), pkgRes.json(), inqRes.json()
    ]);

    allServices  = svcs;
    allProjects  = prjs;
    allPackages  = pkgs;
    allInquiries = inqs;

    // Stat cards
    setText('ovServiceCount', svcs.length);
    setText('ovProjectCount', prjs.length);
    setText('ovPackageCount', pkgs.length);
    setText('ovInquiryCount', inqs.length);

    // Sidebar badges
    setText('servicesBadge',  svcs.length);
    setText('projectsBadge',  prjs.length);
    setText('packagesBadge',  pkgs.length);
    setText('inquiriesBadge', inqs.length);

    // API health
    setText('apiHealthStatus', 'متصل ✓');

    // Recent inquiries
    renderRecentInquiries(inqs.slice(0, 4));

  } catch (err) {
    console.error('Overview load error:', err);
    showToast('تعذر تحميل بيانات النظرة العامة', 'error');
  }
}

function renderRecentInquiries(list) {
  const el = document.getElementById('ovRecentInquiries');
  if (!el) return;

  if (!list || list.length === 0) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:16px">لا توجد استفسارات حتى الآن</p>`;
    return;
  }

  el.innerHTML = list.map(inq => `
    <div class="ov-inquiry-item">
      <div class="ovi-avatar">${getInitial(inq.name)}</div>
      <div style="flex:1;overflow:hidden;">
        <div class="ovi-name">${escHtml(inq.name)}</div>
        <div class="ovi-msg">${escHtml(inq.message)}</div>
      </div>
      <span class="ovi-date">${formatDate(inq.date || inq.createdAt)}</span>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════════
   7. SERVICES CRUD
═══════════════════════════════════════════════════════════ */
async function loadServices() {
  try {
    const res = await fetch(`${API}/services`, { headers: authHeaders() });
    if (handleUnauthorized(res)) return;
    allServices = await res.json();
    renderServicesTable(allServices);
    setText('servicesCount', `${allServices.length} خدمة`);
    setText('servicesBadge', allServices.length);
  } catch (err) {
    showToast('تعذر تحميل الخدمات', 'error');
  }
}

function renderServicesTable(list) {
  const tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fa-solid fa-box-open"></i><p>لا توجد خدمات مضافة بعد</p></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((svc, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        ${svc.image_url
          ? `<img src="${API.replace('/api','')}${svc.image_url}" alt="${escHtml(svc.title)}" class="table-thumb" />`
          : `<div class="table-thumb-placeholder"><i class="fa-solid fa-image"></i></div>`}
      </td>
      <td><strong class="text-truncate-sm">${escHtml(svc.title)}</strong></td>
      <td><span class="text-truncate">${escHtml(svc.description)}</span></td>
      <td>
        <div class="table-actions">
          <button class="table-btn table-btn-edit" onclick="openServiceModal('${svc._id}')" title="تعديل">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="table-btn table-btn-delete" onclick="confirmDelete('service','${svc._id}','${escHtml(svc.title)}')" title="حذف">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Open add/edit modal
function openServiceModal(id = null) {
  const modal    = document.getElementById('serviceModal');
  const title    = document.getElementById('serviceModalTitle');
  const idInput  = document.getElementById('serviceId');
  const titleIn  = document.getElementById('serviceTitle');
  const descIn   = document.getElementById('serviceDescription');
  const imgInput = document.getElementById('serviceImage');

  resetFileUpload('service');

  if (id) {
    const svc = allServices.find(s => s._id === id);
    if (!svc) return;
    title.textContent   = 'تعديل الخدمة';
    idInput.value       = svc._id;
    titleIn.value       = svc.title;
    descIn.value        = svc.description;

    if (svc.image_url) {
      showFilePreview('service', `${API.replace('/api','')}${svc.image_url}`);
    }
  } else {
    title.textContent = 'إضافة خدمة جديدة';
    idInput.value     = '';
    titleIn.value     = '';
    descIn.value      = '';
  }

  showModal('serviceModal');
}

// Service form submit
document.addEventListener('DOMContentLoaded', () => {
  const serviceForm = document.getElementById('serviceForm');
  if (serviceForm) {
    serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id      = document.getElementById('serviceId').value;
      const titleV  = document.getElementById('serviceTitle').value.trim();
      const descV   = document.getElementById('serviceDescription').value.trim();
      const imgFile = document.getElementById('serviceImage').files[0];

      if (!titleV) { showToast('اسم الخدمة مطلوب', 'warning'); return; }
      if (!descV)  { showToast('وصف الخدمة مطلوب', 'warning'); return; }

      const fd = new FormData();
      fd.append('title', titleV);
      fd.append('description', descV);
      if (imgFile) fd.append('image', imgFile);

      setModalLoading('serviceSubmitBtn', true);

      try {
        const url    = id ? `${API}/services/${id}` : `${API}/services`;
        const method = id ? 'PUT' : 'POST';
        const res    = await fetch(url, { method, headers: authHeaders(), body: fd });

        if (handleUnauthorized(res)) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast(id ? 'تم تحديث الخدمة بنجاح' : 'تمت إضافة الخدمة بنجاح', 'success');
        closeModal('serviceModal');
        loadServices();
      } catch (err) {
        showToast('حدث خطأ أثناء حفظ الخدمة', 'error');
      } finally {
        setModalLoading('serviceSubmitBtn', false);
      }
    });
  }

  document.getElementById('addServiceBtn')?.addEventListener('click', () => openServiceModal());
});

/* ═══════════════════════════════════════════════════════════
   8. PROJECTS CRUD
═══════════════════════════════════════════════════════════ */
async function loadProjects() {
  try {
    const [prjRes, svcRes] = await Promise.all([
      fetch(`${API}/projects`, { headers: authHeaders() }),
      fetch(`${API}/services`, { headers: authHeaders() }),
    ]);
    if (handleUnauthorized(prjRes)) return;
    allProjects = await prjRes.json();
    allServices = await svcRes.json();
    renderProjectsTable(allProjects);
    setText('projectsCount', `${allProjects.length} مشروع`);
    setText('projectsBadge', allProjects.length);
  } catch (err) {
    showToast('تعذر تحميل المشاريع', 'error');
  }
}

function renderProjectsTable(list) {
  const tbody = document.getElementById('projectsTableBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fa-solid fa-box-open"></i><p>لا توجد مشاريع مضافة بعد</p></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((prj, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        ${prj.image_url
          ? `<img src="${API.replace('/api','')}${prj.image_url}" alt="${escHtml(prj.title)}" class="table-thumb" />`
          : `<div class="table-thumb-placeholder"><i class="fa-solid fa-image"></i></div>`}
      </td>
      <td><strong class="text-truncate-sm">${escHtml(prj.title)}</strong></td>
      <td><span class="text-truncate">${escHtml(prj.service_id?.title || '—')}</span></td>
      <td>
        <div class="table-actions">
          <button class="table-btn table-btn-edit" onclick="openProjectModal('${prj._id}')" title="تعديل">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="table-btn table-btn-delete" onclick="confirmDelete('project','${prj._id}','${escHtml(prj.title)}')" title="حذف">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openProjectModal(id = null) {
  const modal   = document.getElementById('projectModal');
  const title   = document.getElementById('projectModalTitle');
  const idInput = document.getElementById('projectId');
  const titleIn = document.getElementById('projectTitle');
  const svcSel  = document.getElementById('projectService');

  resetFileUpload('project');

  // Populate service dropdown
  svcSel.innerHTML = `<option value="">-- اختر الخدمة --</option>` +
    allServices.map(s => `<option value="${s._id}">${escHtml(s.title)}</option>`).join('');

  if (id) {
    const prj = allProjects.find(p => p._id === id);
    if (!prj) return;
    title.textContent  = 'تعديل المشروع';
    idInput.value      = prj._id;
    titleIn.value      = prj.title;
    svcSel.value       = prj.service_id?._id || prj.service_id || '';

    if (prj.image_url) {
      showFilePreview('project', `${API.replace('/api','')}${prj.image_url}`);
    }
  } else {
    title.textContent = 'إضافة مشروع جديد';
    idInput.value     = '';
    titleIn.value     = '';
    svcSel.value      = '';
  }

  showModal('projectModal');
}

document.addEventListener('DOMContentLoaded', () => {
  const projectForm = document.getElementById('projectForm');
  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id      = document.getElementById('projectId').value;
      const titleV  = document.getElementById('projectTitle').value.trim();
      const svcId   = document.getElementById('projectService').value;
      const imgFile = document.getElementById('projectImage').files[0];

      if (!titleV) { showToast('اسم المشروع مطلوب', 'warning'); return; }
      if (!svcId)  { showToast('يرجى اختيار الخدمة المرتبطة', 'warning'); return; }

      const fd = new FormData();
      fd.append('title', titleV);
      fd.append('service_id', svcId);
      if (imgFile) fd.append('image', imgFile);

      setModalLoading('projectSubmitBtn', true);

      try {
        const url    = id ? `${API}/projects/${id}` : `${API}/projects`;
        const method = id ? 'PUT' : 'POST';
        const res    = await fetch(url, { method, headers: authHeaders(), body: fd });

        if (handleUnauthorized(res)) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast(id ? 'تم تحديث المشروع بنجاح' : 'تمت إضافة المشروع بنجاح', 'success');
        closeModal('projectModal');
        loadProjects();
      } catch (err) {
        showToast('حدث خطأ أثناء حفظ المشروع', 'error');
      } finally {
        setModalLoading('projectSubmitBtn', false);
      }
    });
  }

  document.getElementById('addProjectBtn')?.addEventListener('click', () => openProjectModal());
});

/* ═══════════════════════════════════════════════════════════
   9. PACKAGES CRUD
═══════════════════════════════════════════════════════════ */
async function loadPackages() {
  try {
    const res = await fetch(`${API}/packages`, { headers: authHeaders() });
    if (handleUnauthorized(res)) return;
    allPackages = await res.json();
    renderPackagesTable(allPackages);
    setText('packagesCount', `${allPackages.length} باقة`);
    setText('packagesBadge', allPackages.length);
  } catch (err) {
    showToast('تعذر تحميل الباقات', 'error');
  }
}

function renderPackagesTable(list) {
  const tbody = document.getElementById('packagesTableBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-box-open"></i><p>لا توجد باقات مضافة بعد</p></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((pkg, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escHtml(pkg.title)}</strong></td>
      <td><strong style="color:var(--teal)">${Number(pkg.price).toLocaleString('ar-EG')} جنيه</strong></td>
      <td>
        <span style="font-size:.8rem;color:var(--text-muted)">
          ${Array.isArray(pkg.features) ? pkg.features.slice(0,2).map(f => `• ${escHtml(f)}`).join(' ') : '—'}
          ${Array.isArray(pkg.features) && pkg.features.length > 2 ? `<em>+${pkg.features.length - 2} أخرى</em>` : ''}
        </span>
      </td>
      <td>
        <span class="recommended-pill ${pkg.is_recommended ? 'yes' : 'no'}">
          ${pkg.is_recommended
            ? '<i class="fa-solid fa-star"></i> نعم'
            : '<i class="fa-solid fa-minus"></i> لا'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="table-btn table-btn-edit" onclick="openPackageModal('${pkg._id}')" title="تعديل">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="table-btn table-btn-delete" onclick="confirmDelete('package','${pkg._id}','${escHtml(pkg.title)}')" title="حذف">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openPackageModal(id = null) {
  const titleEl = document.getElementById('packageModalTitle');
  const idInput = document.getElementById('packageId');
  const titleIn = document.getElementById('packageTitle');
  const priceIn = document.getElementById('packagePrice');
  const recBox  = document.getElementById('packageRecommended');
  const featCont= document.getElementById('featuresContainer');

  // Reset features
  featCont.innerHTML = buildFeatureRow('');

  if (id) {
    const pkg = allPackages.find(p => p._id === id);
    if (!pkg) return;
    titleEl.textContent    = 'تعديل الباقة';
    idInput.value          = pkg._id;
    titleIn.value          = pkg.title;
    priceIn.value          = pkg.price;
    recBox.checked         = pkg.is_recommended;

    const features = Array.isArray(pkg.features) ? pkg.features : [];
    featCont.innerHTML = features.length
      ? features.map(f => buildFeatureRow(f)).join('')
      : buildFeatureRow('');
  } else {
    titleEl.textContent = 'إضافة باقة جديدة';
    idInput.value       = '';
    titleIn.value       = '';
    priceIn.value       = '';
    recBox.checked      = false;
  }

  bindFeatureRemovers();
  showModal('packageModal');
}

document.addEventListener('DOMContentLoaded', () => {
  const packageForm = document.getElementById('packageForm');
  if (packageForm) {
    packageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id     = document.getElementById('packageId').value;
      const titleV = document.getElementById('packageTitle').value.trim();
      const priceV = parseFloat(document.getElementById('packagePrice').value);
      const isRec  = document.getElementById('packageRecommended').checked;

      const features = [...document.querySelectorAll('.feature-input')]
        .map(inp => inp.value.trim())
        .filter(Boolean);

      if (!titleV)        { showToast('اسم الباقة مطلوب', 'warning'); return; }
      if (isNaN(priceV))  { showToast('السعر مطلوب ويجب أن يكون رقماً', 'warning'); return; }
      if (!features.length){ showToast('أضف ميزة واحدة على الأقل', 'warning'); return; }

      const body = { title: titleV, price: priceV, features, is_recommended: isRec };

      setModalLoading('packageSubmitBtn', true);

      try {
        const url    = id ? `${API}/packages/${id}` : `${API}/packages`;
        const method = id ? 'PUT' : 'POST';
        const res    = await fetch(url, {
          method,
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (handleUnauthorized(res)) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast(id ? 'تم تحديث الباقة بنجاح' : 'تمت إضافة الباقة بنجاح', 'success');
        closeModal('packageModal');
        loadPackages();
      } catch (err) {
        showToast('حدث خطأ أثناء حفظ الباقة', 'error');
      } finally {
        setModalLoading('packageSubmitBtn', false);
      }
    });
  }

  document.getElementById('addPackageBtn')?.addEventListener('click', () => openPackageModal());
});

/* ═══════════════════════════════════════════════════════════
   10. PACKAGE FEATURES BUILDER
═══════════════════════════════════════════════════════════ */
function initPackageFeatures() {
  document.getElementById('addFeatureBtn')?.addEventListener('click', () => {
    const cont = document.getElementById('featuresContainer');
    cont.insertAdjacentHTML('beforeend', buildFeatureRow(''));
    bindFeatureRemovers();
    const inputs = cont.querySelectorAll('.feature-input');
    inputs[inputs.length - 1].focus();
  });
}

function buildFeatureRow(value = '') {
  return `
    <div class="feature-row">
      <input type="text" name="features[]" class="modal-input feature-input"
             placeholder="أدخل ميزة من مميزات الباقة..."
             value="${escHtml(value)}" />
      <button type="button" class="feature-remove-btn" aria-label="حذف الميزة">
        <i class="fa-solid fa-minus"></i>
      </button>
    </div>`;
}

function bindFeatureRemovers() {
  document.querySelectorAll('.feature-remove-btn').forEach(btn => {
    btn.onclick = () => {
      const rows = document.querySelectorAll('.feature-row');
      if (rows.length > 1) btn.closest('.feature-row').remove();
      else showToast('يجب أن يكون هناك ميزة واحدة على الأقل', 'warning');
    };
  });
}

/* ═══════════════════════════════════════════════════════════
   11. INQUIRIES
═══════════════════════════════════════════════════════════ */
async function loadInquiries() {
  try {
    const res = await fetch(`${API}/inquiries`, { headers: authHeaders() });
    if (handleUnauthorized(res)) return;
    allInquiries = await res.json();
    renderInquiriesTable(allInquiries);
    setText('inquiriesCount', `${allInquiries.length} رسالة`);
    setText('inquiriesBadge', allInquiries.length);
  } catch (err) {
    showToast('تعذر تحميل الاستفسارات', 'error');
  }
}

function renderInquiriesTable(list) {
  const tbody = document.getElementById('inquiriesTableBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fa-solid fa-inbox"></i><p>لا توجد استفسارات واردة حتى الآن</p></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((inq, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escHtml(inq.name)}</strong></td>
      <td dir="ltr" style="text-align:right">${escHtml(inq.email)}</td>
      <td dir="ltr" style="text-align:right">${escHtml(inq.phone || '—')}</td>
      <td><span class="inquiry-msg">${escHtml(inq.message)}</span></td>
      <td><span class="inquiry-date">${formatDate(inq.date || inq.createdAt)}</span></td>
      <td>
        <div class="table-actions">
          <button class="table-btn table-btn-view" onclick="openInquiryModal('${inq._id}')" title="عرض">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="table-btn table-btn-delete" onclick="confirmDelete('inquiry','${inq._id}','استفسار من ${escHtml(inq.name)}')" title="حذف">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openInquiryModal(id) {
  const inq = allInquiries.find(i => i._id === id);
  if (!inq) return;

  const content   = document.getElementById('inquiryDetailContent');
  const waBtn     = document.getElementById('inquiryWhatsAppReply');

  content.innerHTML = `
    <div class="id-row">
      <i class="fa-solid fa-user id-icon"></i>
      <div class="id-info">
        <span class="id-label">الاسم</span>
        <span class="id-value">${escHtml(inq.name)}</span>
      </div>
    </div>
    <div class="id-row">
      <i class="fa-solid fa-envelope id-icon"></i>
      <div class="id-info">
        <span class="id-label">البريد الإلكتروني</span>
        <span class="id-value" dir="ltr">${escHtml(inq.email)}</span>
      </div>
    </div>
    ${inq.phone ? `
    <div class="id-row">
      <i class="fa-solid fa-phone id-icon"></i>
      <div class="id-info">
        <span class="id-label">رقم الهاتف</span>
        <span class="id-value" dir="ltr">${escHtml(inq.phone)}</span>
      </div>
    </div>` : ''}
    <div class="id-row">
      <i class="fa-solid fa-message id-icon"></i>
      <div class="id-info">
        <span class="id-label">الرسالة</span>
        <span class="id-value" style="white-space:pre-wrap;line-height:1.7">${escHtml(inq.message)}</span>
      </div>
    </div>
    <div class="id-row">
      <i class="fa-solid fa-clock id-icon"></i>
      <div class="id-info">
        <span class="id-label">تاريخ الإرسال</span>
        <span class="id-value">${formatDate(inq.date || inq.createdAt, true)}</span>
      </div>
    </div>
  `;

  // WhatsApp reply button
  if (waBtn && inq.phone) {
    const phoneClean = inq.phone.replace(/\D/g, '');
    waBtn.href = `https://wa.me/${phoneClean}?text=مرحباً ${encodeURIComponent(inq.name)}، شكراً لتواصلك مع EID Agency. `;
    waBtn.style.display = 'flex';
  } else if (waBtn) {
    waBtn.style.display = 'none';
  }

  showModal('inquiryModal');
}

/* ═══════════════════════════════════════════════════════════
   12. DELETE
═══════════════════════════════════════════════════════════ */
function initDeleteModal() {
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (typeof deleteCallback === 'function') {
      await deleteCallback();
      deleteCallback = null;
    }
    closeModal('deleteModal');
  });
}

function confirmDelete(type, id, label) {
  const msg = document.getElementById('deleteModalMessage');
  if (msg) msg.textContent = `هل أنت متأكد من حذف "${label}"؟ لا يمكن التراجع عن هذه العملية.`;

  deleteCallback = async () => {
    try {
      const endpoints = { service: 'services', project: 'projects', package: 'packages', inquiry: 'inquiries' };
      const res = await fetch(`${API}/${endpoints[type]}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (handleUnauthorized(res)) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      showToast('تم الحذف بنجاح', 'success');
      const reloaders = { service: loadServices, project: loadProjects, package: loadPackages, inquiry: loadInquiries };
      if (reloaders[type]) reloaders[type]();
    } catch (err) {
      showToast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  showModal('deleteModal');
}

/* ═══════════════════════════════════════════════════════════
   13. MODAL HELPERS
═══════════════════════════════════════════════════════════ */
function initModalClosers() {
  // Close via [data-close-modal] attribute
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-close-modal]');
    if (target) closeModal(target.dataset.closeModal);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.admin-modal[style*="flex"]').forEach(m => {
        closeModal(m.id);
      });
    }
  });
}

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => {
      const first = modal.querySelector('input:not([type="hidden"]):not([type="file"]), textarea, select');
      first?.focus();
    }, 100);
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function setModalLoading(btnId, loading) {
  const btn    = document.getElementById(btnId);
  if (!btn) return;
  const text   = btn.querySelector('.msb-text');
  const loader = btn.querySelector('.msb-loader');
  btn.disabled = loading;
  if (text)   text.style.display   = loading ? 'none' : '';
  if (loader) loader.style.display = loading ? 'flex' : 'none';
}

/* ═══════════════════════════════════════════════════════════
   14. FILE UPLOADS
═══════════════════════════════════════════════════════════ */
function initFileUploads() {
  ['service', 'project'].forEach(type => {
    const input    = document.getElementById(`${type}Image`);
    const area     = document.getElementById(`${type}ImageUploadArea`);
    const removeBtn= document.getElementById(`${type}RemoveImg`);

    if (!input || !area) return;

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (file) previewFile(file, type);
    });

    // Drag & drop
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', (e) => {
      e.preventDefault();
      area.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        // Transfer to input
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        previewFile(file, type);
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetFileUpload(type);
      });
    }
  });
}

function previewFile(file, type) {
  const reader = new FileReader();
  reader.onload = (e) => showFilePreview(type, e.target.result);
  reader.readAsDataURL(file);
}

function showFilePreview(type, src) {
  const placeholder = document.getElementById(`${type}UploadPlaceholder`);
  const preview     = document.getElementById(`${type}UploadPreview`);
  const img         = document.getElementById(`${type}PreviewImg`);

  if (placeholder) placeholder.style.display = 'none';
  if (preview)     preview.style.display     = 'flex';
  if (img)         img.src                   = src;
}

function resetFileUpload(type) {
  const input       = document.getElementById(`${type}Image`);
  const placeholder = document.getElementById(`${type}UploadPlaceholder`);
  const preview     = document.getElementById(`${type}UploadPreview`);
  const img         = document.getElementById(`${type}PreviewImg`);

  if (input)       input.value              = '';
  if (placeholder) placeholder.style.display = 'flex';
  if (preview)     preview.style.display     = 'none';
  if (img)         img.src                   = '';
}

/* ═══════════════════════════════════════════════════════════
   15. SEARCH
═══════════════════════════════════════════════════════════ */
function initSearchListeners() {
  const searchMap = {
    servicesSearch:  () => renderServicesTable(filterList(allServices, document.getElementById('servicesSearch')?.value, ['title','description'])),
    projectsSearch:  () => renderProjectsTable(filterList(allProjects, document.getElementById('projectsSearch')?.value, ['title'])),
    inquiriesSearch: () => renderInquiriesTable(filterList(allInquiries, document.getElementById('inquiriesSearch')?.value, ['name','email','message'])),
  };

  Object.entries(searchMap).forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener('input', fn);
  });
}

function filterList(list, query, fields) {
  if (!query || !query.trim()) return list;
  const q = query.trim().toLowerCase();
  return list.filter(item => fields.some(f => String(item[f] || '').toLowerCase().includes(q)));
}

/* ═══════════════════════════════════════════════════════════
   16. QUICK ACTIONS (Overview)
═══════════════════════════════════════════════════════════ */
function initQuickActions() {
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      const action  = btn.dataset.action;
      if (section) {
        loadSection(section);
        if (action === 'add') {
          setTimeout(() => {
            const addBtns = { services:'addServiceBtn', projects:'addProjectBtn', packages:'addPackageBtn' };
            document.getElementById(addBtns[section])?.click();
          }, 300);
        }
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   17. TOAST NOTIFICATIONS
═══════════════════════════════════════════════════════════ */
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info', warning:'fa-triangle-exclamation' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
    <span class="toast-text">${escHtml(message)}</span>
    <span class="toast-close" role="button" tabindex="0" aria-label="إغلاق الإشعار">
      <i class="fa-solid fa-xmark"></i>
    </span>
  `;

  const dismiss = () => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 350);
  };

  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  toast.querySelector('.toast-close').addEventListener('keydown', e => e.key === 'Enter' && dismiss());

  container.appendChild(toast);
  setTimeout(dismiss, duration);
}

/* ═══════════════════════════════════════════════════════════
   18. UTILITIES
═══════════════════════════════════════════════════════════ */
function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getInitial(name = '') {
  return (name.trim().charAt(0) || '؟').toUpperCase();
}

function formatDate(dateStr, full = false) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (full) {
      return d.toLocaleString('ar-EG', {
        year:'numeric', month:'long', day:'numeric',
        hour:'2-digit', minute:'2-digit',
      });
    }
    return d.toLocaleDateString('ar-EG', { year:'numeric', month:'short', day:'numeric' });
  } catch {
    return dateStr;
  }
}
