/* ============================================================
   EID AGENCY — MAIN SCRIPT (script.js)
   Handles: Gate, Navbar, Fetch, Render, Form, Animations
   ============================================================ */

'use strict';

const API = 'http://localhost:5000/api';

/* ─── DOM READY ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initGate();
  initTheme();
  initNavbar();
  initScrollReveal();
  initBackToTop();
  initLightbox();
});

/* ═══════════════════════════════════════════════════════════
   1. WELCOME GATE
═══════════════════════════════════════════════════════════ */
function initGate() {
  const gate      = document.getElementById('welcomeGate');
  const mainSite  = document.getElementById('mainSite');
  const input     = document.getElementById('guestName');
  const startBtn  = document.getElementById('gateStartBtn');
  const heroName  = document.getElementById('heroName');

  if (!gate) return;

  // Focus input on load
  setTimeout(() => input && input.focus(), 400);

  function launchSite() {
    const name = (input.value.trim()) || 'صديقنا العزيز';

    // Update hero greeting
    if (heroName) {
      heroName.textContent = name;
      heroName.style.animation = 'none';
      void heroName.offsetWidth;
      heroName.style.animation = '';
    }

    // Slide gate up
    gate.classList.add('slide-up');

    // Show main site
    setTimeout(() => {
      gate.style.display = 'none';
      mainSite.style.opacity = '1';
      mainSite.style.pointerEvents = 'auto';

      // Start fetching data after site is visible
      fetchServices();
      fetchProjects();
      fetchPackages();
      initStatsCounter();
      initContactForm();
    }, 800);
  }

  startBtn.addEventListener('click', launchSite);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') launchSite();
  });
}

/* ═══════════════════════════════════════════════════════════
   2. THEME TOGGLE
═══════════════════════════════════════════════════════════ */
function initTheme() {
  const toggleBtn  = document.getElementById('themeToggle');
  const themeIcon  = document.getElementById('themeIcon');
  const html       = document.documentElement;

  const saved = localStorage.getItem('eid-theme') || 'dark';
  applyTheme(saved);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('eid-theme', theme);
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   3. NAVBAR: Scroll + Active Link + Mobile Menu
═══════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const navLinks   = document.querySelectorAll('.nav-link');
  const mobLinks   = document.querySelectorAll('.mob-link');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    updateActiveLink();
  }, { passive: true });

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
    });
  }

  // Close mobile menu on link click
  mobLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    });
  });

  // Active link on scroll
  function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 100;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   4. SCROLL REVEAL ANIMATION
═══════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ═══════════════════════════════════════════════════════════
   5. STATS COUNTER ANIMATION
═══════════════════════════════════════════════════════════ */
function initStatsCounter() {
  const counters = document.querySelectorAll('.stat-num[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start    = performance.now();

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutExpo
    const eased    = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ═══════════════════════════════════════════════════════════
   6. FETCH & RENDER: SERVICES
═══════════════════════════════════════════════════════════ */
async function fetchServices() {
  const grid  = document.getElementById('servicesGrid');
  const error = document.getElementById('servicesError');
  if (!grid) return;

  try {
    const res  = await fetch(`${API}/services`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderServices(data);
    error.style.display = 'none';
  } catch (err) {
    console.error('Services fetch error:', err);
    grid.innerHTML = '';
    error.style.display = 'block';
  }
}

function renderServices(services) {
  const grid = document.getElementById('servicesGrid');
  if (!services || services.length === 0) {
    grid.innerHTML = `<div class="fetch-error"><i class="fa-solid fa-box-open"></i><p>لا توجد خدمات متاحة حالياً</p></div>`;
    return;
  }

  const icons = ['fa-bolt','fa-palette','fa-code','fa-chart-line','fa-bullhorn','fa-globe','fa-mobile-screen','fa-camera'];

  grid.innerHTML = services.map((svc, i) => `
    <article class="service-card reveal" role="listitem" tabindex="0"
             aria-label="خدمة: ${escHtml(svc.title)}"
             style="transition-delay:${i * 0.08}s">
      ${svc.image_url ? `
        <div class="sc-img-wrap">
          <img src="${API.replace('/api','')}${svc.image_url}" alt="${escHtml(svc.title)}" loading="lazy" />
        </div>` : ''}
      <div class="sc-icon" aria-hidden="true">
        <i class="fa-solid ${icons[i % icons.length]}"></i>
      </div>
      <h3 class="sc-title">${escHtml(svc.title)}</h3>
      <p class="sc-desc">${escHtml(svc.description)}</p>
      <span class="sc-arrow">
        اكتشف المزيد <i class="fa-solid fa-arrow-left"></i>
      </span>
    </article>
  `).join('');

  // Re-observe new elements
  observeNewReveal(grid);
}

/* ═══════════════════════════════════════════════════════════
   7. FETCH & RENDER: PROJECTS
═══════════════════════════════════════════════════════════ */
async function fetchProjects() {
  const grid  = document.getElementById('projectsGrid');
  const error = document.getElementById('projectsError');
  const filter = document.querySelector('.projects-filter');
  if (!grid) return;

  try {
    const res  = await fetch(`${API}/projects`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderProjects(data, filter);
    error.style.display = 'none';
  } catch (err) {
    console.error('Projects fetch error:', err);
    grid.innerHTML = '';
    error.style.display = 'block';
  }
}

function renderProjects(projects, filterBar) {
  const grid = document.getElementById('projectsGrid');
  if (!projects || projects.length === 0) {
    grid.innerHTML = `<div class="fetch-error"><i class="fa-solid fa-box-open"></i><p>لا توجد مشاريع متاحة حالياً</p></div>`;
    return;
  }

  // Build filter tabs from unique service names
  const serviceNames = [...new Set(projects.map(p => p.service_id?.title || 'عام'))];
  if (filterBar && serviceNames.length > 1) {
    const existingTabs = filterBar.innerHTML;
    serviceNames.forEach(name => {
      if (!filterBar.querySelector(`[data-filter="${name}"]`)) {
        const btn = document.createElement('button');
        btn.className = 'filter-tab';
        btn.dataset.filter = name;
        btn.textContent = name;
        btn.setAttribute('role','tab');
        btn.setAttribute('aria-selected','false');
        filterBar.appendChild(btn);
      }
    });

    // Filter logic
    filterBar.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected','false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected','true');

        const filter = tab.dataset.filter;
        grid.querySelectorAll('.project-card').forEach(card => {
          const show = filter === 'all' || card.dataset.service === filter;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // Gradient placeholders for missing images
  const gradients = [
    'linear-gradient(135deg,#2dd4bf,#8b5cf6)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    'linear-gradient(135deg,#3b82f6,#2dd4bf)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#10b981,#3b82f6)',
  ];

  grid.innerHTML = projects.map((proj, i) => {
    const serviceName = proj.service_id?.title || 'عام';
    const imgSrc = proj.image_url ? `${API.replace('/api','')}${proj.image_url}` : null;
    const grad = gradients[i % gradients.length];

    return `
      <article class="project-card reveal"
               role="listitem"
               data-service="${escHtml(serviceName)}"
               data-id="${proj._id}"
               tabindex="0"
               aria-label="مشروع: ${escHtml(proj.title)}"
               style="transition-delay:${i * 0.07}s">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="${escHtml(proj.title)}" class="project-img" loading="lazy" />`
          : `<div class="project-img" style="background:${grad};width:100%;height:100%;"></div>`
        }
        <div class="project-overlay">
          <span class="project-badge">
            <i class="fa-solid fa-layer-group"></i>
            ${escHtml(serviceName)}
          </span>
          <h3 class="project-title">${escHtml(proj.title)}</h3>
          <span class="project-view">
            <i class="fa-solid fa-eye"></i> عرض التفاصيل
          </span>
        </div>
      </article>
    `;
  }).join('');

  // Click to open lightbox
  grid.querySelectorAll('.project-card').forEach((card, i) => {
    card.addEventListener('click', () => openLightbox(projects[i]));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(projects[i]);
    });
  });

  observeNewReveal(grid);
}

/* ═══════════════════════════════════════════════════════════
   8. FETCH & RENDER: PACKAGES
═══════════════════════════════════════════════════════════ */
async function fetchPackages() {
  const grid  = document.getElementById('pricingGrid');
  const error = document.getElementById('pricingError');
  if (!grid) return;

  try {
    const res  = await fetch(`${API}/packages`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderPackages(data);
    error.style.display = 'none';
  } catch (err) {
    console.error('Packages fetch error:', err);
    grid.innerHTML = '';
    error.style.display = 'block';
  }
}

function renderPackages(packages) {
  const grid = document.getElementById('pricingGrid');
  if (!packages || packages.length === 0) {
    grid.innerHTML = `<div class="fetch-error"><i class="fa-solid fa-box-open"></i><p>لا توجد باقات متاحة حالياً</p></div>`;
    return;
  }

  grid.innerHTML = packages.map((pkg, i) => {
    const isRec = pkg.is_recommended;
    const features = Array.isArray(pkg.features) ? pkg.features : [];

    return `
      <article class="price-card${isRec ? ' recommended' : ''} reveal"
               role="listitem"
               aria-label="باقة: ${escHtml(pkg.title)}"
               style="transition-delay:${i * 0.1}s">
        ${isRec ? `<span class="recommended-badge">⭐ الأكثر طلباً</span>` : ''}

        <div class="pc-header">
          <span class="pc-name">${escHtml(pkg.title)}</span>
          <div class="pc-price-row">
            <span class="pc-price">${Number(pkg.price).toLocaleString('ar-EG')}</span>
            <span class="pc-currency">جنيه</span>
          </div>
          <span class="pc-period">/ شهرياً</span>
        </div>

        <div class="pc-divider" aria-hidden="true"></div>

        <ul class="pc-features" role="list">
          ${features.map(f => `
            <li class="price-feature" role="listitem">
              <span class="price-feature-icon" aria-hidden="true">
                <i class="fa-solid fa-check"></i>
              </span>
              ${escHtml(f)}
            </li>
          `).join('')}
        </ul>

        <a href="https://wa.me/201014084157?text=مرحباً، أريد الاشتراك في باقة ${encodeURIComponent(pkg.title)}"
           target="_blank" rel="noopener noreferrer"
           class="pc-cta-btn ${isRec ? 'pc-cta-recommended' : 'pc-cta-normal'}"
           aria-label="اشترك في باقة ${escHtml(pkg.title)}">
          <i class="fa-brands fa-whatsapp"></i>
          ابدأ الآن
        </a>
      </article>
    `;
  }).join('');

  observeNewReveal(grid);
}

/* ═══════════════════════════════════════════════════════════
   9. LIGHTBOX
═══════════════════════════════════════════════════════════ */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightboxClose');
  const overlay  = document.getElementById('lightboxOverlay');
  if (!lightbox) return;

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

function openLightbox(project) {
  const lightbox = document.getElementById('lightbox');
  const inner    = document.getElementById('lightboxInner');
  if (!lightbox || !inner) return;

  const imgSrc = project.image_url ? `${API.replace('/api','')}${project.image_url}` : null;
  const serviceName = project.service_id?.title || 'مشروع';

  inner.innerHTML = `
    ${imgSrc ? `<img src="${imgSrc}" alt="${escHtml(project.title)}" />` : ''}
    <span class="project-badge" style="margin-bottom:12px;display:inline-flex;">
      <i class="fa-solid fa-layer-group"></i>
      ${escHtml(serviceName)}
    </span>
    <h3>${escHtml(project.title)}</h3>
    ${project.description ? `<p>${escHtml(project.description)}</p>` : ''}
    <a href="https://wa.me/201014084157?text=أريد الاستفسار عن مشروع مشابه لـ ${encodeURIComponent(project.title)}"
       target="_blank" rel="noopener"
       class="btn-primary" style="margin-top:20px;display:inline-flex;">
      <i class="fa-brands fa-whatsapp"></i>
      استفسر عن مشروع مشابه
    </a>
  `;

  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Trap focus
  setTimeout(() => document.getElementById('lightboxClose')?.focus(), 50);
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.style.display = 'none';
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════════════════════
   10. CONTACT FORM
═══════════════════════════════════════════════════════════ */
function initContactForm() {
  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('contactSubmitBtn');
  const success   = document.getElementById('formSuccess');
  const failure   = document.getElementById('formFailure');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset state
    success.style.display = 'none';
    failure.style.display = 'none';
    clearFormErrors(form);

    const name    = form.querySelector('#contactName');
    const email   = form.querySelector('#contactEmail');
    const phone   = form.querySelector('#contactPhone');
    const message = form.querySelector('#contactMessage');

    // Validate
    let valid = true;

    if (!name.value.trim()) {
      showFieldError(name, 'الاسم الكامل مطلوب');
      valid = false;
    }

    if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showFieldError(email, 'يرجى إدخال بريد إلكتروني صحيح');
      valid = false;
    }

    if (!phone.value.trim() || !/^[0-9+\s\-()]{7,15}$/.test(phone.value.trim())) {
      showFieldError(phone, 'يرجى إدخال رقم هاتف صحيح');
      valid = false;
    }

    if (!message.value.trim() || message.value.trim().length < 10) {
      showFieldError(message, 'يرجى كتابة رسالة لا تقل عن 10 أحرف');
      valid = false;
    }

    if (!valid) return;

    // UI: Loading state
    setSubmitLoading(submitBtn, true);

    try {
      const res = await fetch(`${API}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name.value.trim(),
          email:   email.value.trim(),
          phone:   phone.value.trim(),
          message: message.value.trim(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Success
      form.reset();
      success.style.display = 'flex';
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { success.style.display = 'none'; }, 7000);

    } catch (err) {
      console.error('Contact form error:', err);
      failure.style.display = 'flex';
      setTimeout(() => { failure.style.display = 'none'; }, 6000);
    } finally {
      setSubmitLoading(submitBtn, false);
    }
  });

  // Live validation on blur
  [form.querySelector('#contactName'),
   form.querySelector('#contactEmail'),
   form.querySelector('#contactPhone'),
   form.querySelector('#contactMessage')].forEach(input => {
    if (input) {
      input.addEventListener('blur', () => {
        if (input.value.trim()) clearFieldError(input);
      });
    }
  });
}

function showFieldError(input, msg) {
  input.classList.add('error');
  const errEl = input.parentElement.querySelector('.form-error');
  if (errEl) errEl.textContent = msg;
}

function clearFieldError(input) {
  input.classList.remove('error');
  const errEl = input.parentElement.querySelector('.form-error');
  if (errEl) errEl.textContent = '';
}

function clearFormErrors(form) {
  form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  form.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
}

function setSubmitLoading(btn, loading) {
  const text   = btn.querySelector('.submit-text');
  const icon   = btn.querySelector('.submit-icon');
  const loader = btn.querySelector('.submit-loader');

  btn.disabled = loading;
  if (text)   text.style.display   = loading ? 'none' : '';
  if (icon)   icon.style.display   = loading ? 'none' : '';
  if (loader) loader.style.display = loading ? 'flex' : 'none';
}

/* ═══════════════════════════════════════════════════════════
   11. BACK TO TOP
═══════════════════════════════════════════════════════════ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    const show = window.scrollY > 500;
    btn.style.opacity = show ? '1' : '0';
    btn.style.pointerEvents = show ? 'auto' : 'none';
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ═══════════════════════════════════════════════════════════
   12. HELPERS
═══════════════════════════════════════════════════════════ */
function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function observeNewReveal(container) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  container.querySelectorAll('.reveal:not(.revealed)').forEach(el => observer.observe(el));
}
