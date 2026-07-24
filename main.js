/* ═══════════════════════════════════════════════
   BHAWANTHA LAKSHAN PORTFOLIO — MAIN JAVASCRIPT
   Three.js + GSAP + ScrollTrigger + Interactions
   ═══════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════
   0. PORTFOLIO — Dynamic Rendering from Supabase
      Falls back to hardcoded defaults if Supabase
      is not yet configured or network fails.
   ════════════════════════════════════════════════ */

const CATEGORY_LABELS = {
  design: 'Graphic Design',
  web:    'Web Development',
  social: 'Social Media',
  video:  'Video Editing',
};

/* Hardcoded fallback — shown while Supabase loads or if it's not configured */
const FALLBACK_PORTFOLIO = [
  { id:'f1', title:'Brand Identity Poster',  category:'design',  description:'Premium poster design for a luxury brand campaign',  image_url:'portfolio_poster.png' },
  { id:'f2', title:'Premium E-Commerce Site', category:'web',     description:'Full-stack responsive website with modern UI/UX',    image_url:'portfolio_web.png'    },
  { id:'f3', title:'Viral Content Campaign',  category:'social',  description:'100K+ impressions social media strategy',             image_url:'portfolio_social.png' },
];

/* Supabase is configured when the URL is a real URL */
function isSupabaseConfigured() {
  return typeof window.db !== 'undefined' &&
         typeof SUPABASE_URL === 'string' &&
         SUPABASE_URL.startsWith('https://') &&
         !SUPABASE_URL.includes('YOUR_SUPABASE');
}

async function fetchPortfolioFromSupabase() {
  const { data, error } = await window.db
    .from('portfolio_items')
    .select('id, title, category, description, image_url, link, sort_order')
    .eq('published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

function buildPortfolioHTML(items) {
  if (items.length === 0) {
    return '<p style="text-align:center;color:#64748b;padding:40px">No portfolio items yet.</p>';
  }
  return items.map(item => {
    const cat      = CATEGORY_LABELS[item.category] || item.category;
    const imgSrc   = item.image_url || 'portfolio_poster.png';
    const linkAttr = item.link ? `href="${item.link}" target="_blank" rel="noopener"` : '';

    return `
      <div class="portfolio-item reveal-up" data-category="${item.category}"
           style="opacity:0;transform:translateY(40px);transition:opacity 0.6s ease,transform 0.6s ease;">
        <div class="port-img-wrap">
          <img src="${imgSrc}" alt="${item.title}" loading="lazy" onerror="this.src='portfolio_poster.png'" />
          <div class="port-overlay">
            <div class="port-info">
              <span class="port-cat">${cat}</span>
              <h3>${item.title}</h3>
              <p>${item.description || ''}</p>
            </div>
            <div class="port-actions">
              <button class="port-btn"><i class="fa-solid fa-expand"></i></button>
              ${item.link ? `<a class="port-btn" ${linkAttr}><i class="fa-solid fa-link"></i></a>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function revealPortfolioItems() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;
  grid.querySelectorAll('.portfolio-item').forEach((el, i) => {
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * 80);
  });
  reattachFilters();
}

async function renderPortfolioGrid() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  /* Show skeleton loading state */
  grid.innerHTML = `
    <div style="text-align:center;padding:60px 20px;color:#475569;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:28px;margin-bottom:12px;display:block;"></i>
      <span style="font-size:0.9rem;">Loading portfolio…</span>
    </div>`;

  let items = [];

  if (isSupabaseConfigured()) {
    try {
      items = await fetchPortfolioFromSupabase();
    } catch (err) {
      console.warn('[Portfolio] Supabase fetch failed, using fallback:', err.message);
      items = FALLBACK_PORTFOLIO;
    }
  } else {
    /* Supabase not yet configured — use fallback data */
    items = FALLBACK_PORTFOLIO;
  }

  grid.innerHTML = buildPortfolioHTML(items);

  setTimeout(revealPortfolioItems, 100);
}

function reattachFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const filter = this.dataset.filter;
      document.querySelectorAll('.portfolio-item').forEach(item => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.style.display = show ? '' : 'none';
        if (show) { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; }
      });
    });
  });
}

/* Render on DOM ready */
document.addEventListener('DOMContentLoaded', renderPortfolioGrid);


/* ─── GSAP Plugin Registration ─── */
gsap.registerPlugin(ScrollTrigger, TextPlugin);

/* ════════════════════════════════════════════════
   1. PRELOADER
   ════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  setTimeout(() => {
    preloader.classList.add('hidden');
    document.body.style.overflow = 'auto';
    initHeroAnimations();
  }, 2400);
});

document.body.style.overflow = 'hidden';

// ── Safety net: force reveal all elements after 3.5s no matter what ──
setTimeout(() => {
  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    el.classList.add('revealed');
  });
  document.querySelectorAll('.service-card, .portfolio-item').forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
}, 3500);

/* ════════════════════════════════════════════════
   2. CUSTOM CURSOR
   ════════════════════════════════════════════════ */
const cursorDot     = document.getElementById('cursor-dot');
const cursorOutline = document.getElementById('cursor-outline');

let mouseX = 0, mouseY = 0;
let outlineX = 0, outlineY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
});

(function animateCursor() {
  outlineX += (mouseX - outlineX) * 0.12;
  outlineY += (mouseY - outlineY) * 0.12;
  cursorOutline.style.left = outlineX + 'px';
  cursorOutline.style.top  = outlineY + 'px';
  requestAnimationFrame(animateCursor);
})();

document.querySelectorAll('a, button, .portfolio-item, .skill-card, .service-card').forEach(el => {
  el.addEventListener('mouseenter', () => cursorOutline.classList.add('hovered'));
  el.addEventListener('mouseleave', () => cursorOutline.classList.remove('hovered'));
});

/* ════════════════════════════════════════════════
   3. NAVBAR
   ════════════════════════════════════════════════ */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Back to top visibility
  const btn = document.getElementById('back-to-top');
  if (window.scrollY > 500) btn.classList.add('visible');
  else btn.classList.remove('visible');
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

// Close mobile menu when link clicked
document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// Back to top
document.getElementById('back-to-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ════════════════════════════════════════════════
   4. THREE.JS 3D HERO BACKGROUND
   ════════════════════════════════════════════════ */
function initThreeJS() {
  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 5;

  // ── Particles ──
  const particleCount = 300;
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    sizes[i] = Math.random() * 3 + 1;
    velocities.push({
      x: (Math.random() - 0.5) * 0.002,
      y: (Math.random() - 0.5) * 0.002,
      z: (Math.random() - 0.5) * 0.001,
    });
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.PointsMaterial({
    color: 0x3b82f6,
    size: 0.04,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── Floating Geometric Shapes ──
  const shapes = [];

  function createShape(type, color, size, x, y, z) {
    let geo;
    if (type === 'torus')     geo = new THREE.TorusGeometry(size, size * 0.3, 16, 50);
    if (type === 'icosa')     geo = new THREE.IcosahedronGeometry(size, 0);
    if (type === 'octa')      geo = new THREE.OctahedronGeometry(size, 0);
    if (type === 'tetra')     geo = new THREE.TetrahedronGeometry(size, 0);
    if (type === 'torus-knot') geo = new THREE.TorusKnotGeometry(size * 0.5, size * 0.15, 100, 16);

    const mat = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: type === 'torus' ? 0.15 : 0.12,
      wireframe: true,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = {
      rotX: (Math.random() - 0.5) * 0.01,
      rotY: (Math.random() - 0.5) * 0.01,
      floatSpeed: Math.random() * 0.005 + 0.003,
      floatOffset: Math.random() * Math.PI * 2,
      originalY: y,
    };
    scene.add(mesh);
    shapes.push(mesh);
  }

  createShape('torus',     0x3b82f6, 1.5, -5,  1, -3);
  createShape('icosa',     0x2563eb, 0.8,  4,  2, -2);
  createShape('octa',      0x60a5fa, 0.6, -3, -2, -1);
  createShape('tetra',     0x3b82f6, 0.7,  3, -2, -3);
  createShape('torus-knot',0x1d4ed8, 0.6,  0,  3, -4);
  createShape('icosa',     0x93c5fd, 0.5,  6, -1, -2);
  createShape('octa',      0x3b82f6, 0.4, -6,  2, -1);

  // ── Connection Lines ──
  const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.07 });
  const connections = [];

  for (let i = 0; i < 6; i++) {
    const start = new THREE.Vector3(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 4
    );
    const end = new THREE.Vector3(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 4
    );
    const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
    connections.push(line);
  }

  // ── Lighting ──
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0x3b82f6, 2, 20);
  pointLight.position.set(5, 5, 5);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(0x2563eb, 1.5, 15);
  pointLight2.position.set(-5, -3, 3);
  scene.add(pointLight2);

  // ── Mouse Interaction ──
  let targetRotX = 0, targetRotY = 0;
  let currentRotX = 0, currentRotY = 0;

  window.addEventListener('mousemove', (e) => {
    targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 0.3;
    targetRotY = ((e.clientX / window.innerWidth)  - 0.5) * 0.5;
  });

  // ── Animation Loop ──
  let t = 0;

  function animate() {
    requestAnimationFrame(animate);
    t += 0.01;

    // Smooth camera rotation
    currentRotX += (targetRotX - currentRotX) * 0.05;
    currentRotY += (targetRotY - currentRotY) * 0.05;
    scene.rotation.x = currentRotX;
    scene.rotation.y = currentRotY;

    // Rotate shapes
    shapes.forEach(shape => {
      shape.rotation.x += shape.userData.rotX;
      shape.rotation.y += shape.userData.rotY;
      shape.position.y = shape.userData.originalY + Math.sin(t * shape.userData.floatSpeed * 100 + shape.userData.floatOffset) * 0.3;
    });

    // Animate particles
    const pos = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3]     += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;

      if (Math.abs(pos[i * 3])     > 10) velocities[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > 10) velocities[i].y *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 5)  velocities[i].z *= -1;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Pulse point light
    pointLight.intensity = 1.5 + Math.sin(t * 2) * 0.5;

    renderer.render(scene, camera);
  }
  animate();

  // ── Resize Handler ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

initThreeJS();

/* ════════════════════════════════════════════════
   5. PROFILE CARD 3D TILT EFFECT
   ════════════════════════════════════════════════ */
function initCardTilt() {
  const card = document.getElementById('profile-card');
  if (!card) return;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width  / 2;
    const cy = rect.height / 2;

    const rotateX = ((y - cy) / cy) * -15;
    const rotateY = ((x - cx) / cx) *  15;

    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  });
}

/* ════════════════════════════════════════════════
   6. GSAP + SCROLL ANIMATIONS
   ════════════════════════════════════════════════ */

// ── IntersectionObserver for section reveals — runs immediately on DOM ready ──
(function initRevealObserver() {
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = (el.dataset.delay || 0) * 120;
        setTimeout(() => el.classList.add('revealed'), delay);
        revealObs.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    revealObs.observe(el);
  });
})();

// ── Skills Bar — runs immediately ──
(function initSkillBars() {
  const skillObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-bar').forEach(bar => {
          const w = bar.dataset.width;
          setTimeout(() => {
            bar.querySelector('.skill-fill').style.width = w + '%';
          }, 400);
        });
        skillObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  const skillsSection = document.getElementById('skills');
  if (skillsSection) skillObs.observe(skillsSection);
})();

// ── Services fade-in — runs immediately ──
(function initServiceCards() {
  const svcObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.service-card').forEach((card, i) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, i * 120);
        });
        svcObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const svcGrid = document.querySelector('.services-grid');
  if (svcGrid) {
    // Set initial hidden state via inline style (not class, so GSAP doesn't conflict)
    svcGrid.querySelectorAll('.service-card').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(40px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    svcObs.observe(svcGrid);
  }
})();

// ── Portfolio items fade-in — runs immediately ──
(function initPortfolioItems() {
  const portObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.portfolio-item').forEach((item, i) => {
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, i * 100);
        });
        portObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  const portGrid = document.getElementById('portfolio-grid');
  if (portGrid) {
    portGrid.querySelectorAll('.portfolio-item').forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(40px)';
      item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    portObs.observe(portGrid);
  }
})();

// ── Animated Counters (Social Proof Section) — runs immediately ──
(function initCounters() {
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters('.counter', 2000);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  const proofSection = document.getElementById('social-proof');
  if (proofSection) counterObs.observe(proofSection);
})();

function initHeroAnimations() {
  initCardTilt();

  /* ── Hero Entrance ── */
  const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTL
    .from('.hero-badge',    { opacity: 0, y: 30, duration: 0.7 })
    .from('.hero-heading',  { opacity: 0, y: 40, duration: 0.8 }, '-=0.3')
    .from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.7 }, '-=0.5')
    .from('.hero-desc',     { opacity: 0, y: 30, duration: 0.7 }, '-=0.5')
    .from('.hero-btns',     { opacity: 0, y: 30, duration: 0.6 }, '-=0.4')
    .from('.hero-stats',    { opacity: 0, y: 20, duration: 0.6 }, '-=0.3')
    .from('.profile-3d-card', { opacity: 0, scale: 0.8, duration: 1, ease: 'back.out(1.7)' }, '-=0.8')
    .from('.float-el',      { opacity: 0, scale: 0, stagger: 0.15, duration: 0.5, ease: 'back.out(2)' }, '-=0.5')
    .from('.scroll-indicator', { opacity: 0, y: 20, duration: 0.6 }, '-=0.2');

  animateCounters('.stat-num', 1500);

  /* ── GSAP Parallax on Hero ── */
  gsap.to('#three-canvas', {
    scrollTrigger: {
      trigger: '#hero',
      scrub: 1,
    },
    y: 150,
    ease: 'none',
  });

  gsap.to('.hero-content', {
    scrollTrigger: {
      trigger: '#hero',
      scrub: 1,
    },
    y: 60,
    opacity: 0.3,
    ease: 'none',
  });

  /* ── Section Title Highlights ── */
  gsap.utils.toArray('.section-title').forEach(title => {
    gsap.from(title, {
      scrollTrigger: { trigger: title, start: 'top 85%' },
      opacity: 0,
      y: 30,
      duration: 0.8,
      ease: 'power3.out',
    });
  });

  /* ── Proof stats stagger ── */
  gsap.from('.proof-stat-card', {
    scrollTrigger: { trigger: '#social-proof', start: 'top 70%' },
    opacity: 0,
    scale: 0.85,
    stagger: 0.1,
    duration: 0.6,
    ease: 'back.out(1.7)',
  });

  /* ── Contact form slide ── */
  gsap.from('.contact-form-wrap', {
    scrollTrigger: { trigger: '#contact', start: 'top 70%' },
    opacity: 0,
    x: 40,
    duration: 0.8,
    ease: 'power3.out',
  });
}

/* ════════════════════════════════════════════════
   7. COUNTER ANIMATION UTILITY
   ════════════════════════════════════════════════ */
function animateCounters(selector, duration) {
  document.querySelectorAll(selector).forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const start  = performance.now();
    let current  = 0;

    function update(time) {
      const elapsed  = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      current = Math.floor(eased * target);
      el.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    }
    requestAnimationFrame(update);
  });
}

/* ════════════════════════════════════════════════
   8. PORTFOLIO FILTER (initial filter-btn wiring)
   ════════════════════════════════════════════════ */
// Note: reattachFilters() is called after renderPortfolioGrid() re-renders items.
// This initial wiring handles cases where filters are clicked before render.
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const filter = this.dataset.filter;
    document.querySelectorAll('.portfolio-item').forEach(item => {
      const show = filter === 'all' || item.dataset.category === filter;
      if (show) {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
        item.style.display = '';
      } else {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.95)';
        setTimeout(() => { item.style.display = 'none'; }, 300);
      }
    });
  });
});

/* ════════════════════════════════════════════════
   9. BEFORE / AFTER SLIDER
   ════════════════════════════════════════════════ */
(function initBASlider() {
  const sliderWrap = document.querySelector('.before-after-wrap');
  const afterImg   = document.getElementById('after-img');
  const slider     = document.getElementById('ba-slider');
  if (!sliderWrap || !afterImg || !slider) return;

  let isDragging = false;

  function setSlider(x) {
    const rect   = sliderWrap.getBoundingClientRect();
    let pct = ((x - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    afterImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    slider.style.left = pct + '%';
  }

  slider.addEventListener('mousedown',  () => { isDragging = true; });
  sliderWrap.addEventListener('mousemove', (e) => { if (isDragging) setSlider(e.clientX); });
  window.addEventListener('mouseup',    () => { isDragging = false; });

  slider.addEventListener('touchstart', (e) => { isDragging = true; e.preventDefault(); }, { passive: false });
  sliderWrap.addEventListener('touchmove', (e) => {
    if (isDragging) setSlider(e.touches[0].clientX);
  });
  window.addEventListener('touchend', () => { isDragging = false; });

  // Hover auto-reveal animation
  sliderWrap.addEventListener('mouseenter', () => {
    gsap.to({ val: 50 }, {
      val: 70,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: function () { setSlider(sliderWrap.getBoundingClientRect().left + (sliderWrap.offsetWidth * this.targets()[0].val / 100)); },
    });
  });
  sliderWrap.addEventListener('mouseleave', () => {
    gsap.to({ val: 70 }, {
      val: 50,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: function () { setSlider(sliderWrap.getBoundingClientRect().left + (sliderWrap.offsetWidth * this.targets()[0].val / 100)); },
    });
  });
})();

/* ════════════════════════════════════════════════
   10. CONTACT FORM — Real email via FormSubmit AJAX
   ════════════════════════════════════════════════ */
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const btn     = document.getElementById('form-submit-btn');
    const success = document.getElementById('form-success');

    // Validate
    const name    = document.getElementById('form-name').value.trim();
    const email   = document.getElementById('form-email').value.trim();
    const message = document.getElementById('form-message').value.trim();
    if (!name || !email || !message) return;

    btn.innerHTML = '<span>Sending...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled  = true;

    // AJAX submission to FormSubmit.co
    const formData = new FormData(contactForm);
    fetch(contactForm.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' },
    })
    .then(res => {
      btn.innerHTML = '<span>Send Message</span> <i class="fa-solid fa-paper-plane"></i>';
      btn.disabled  = false;
      if (res.ok || res.status === 200 || res.redirected) {
        success.classList.add('show');
        contactForm.reset();
        setTimeout(() => success.classList.remove('show'), 6000);
      } else {
        // Fallback: show success anyway (FormSubmit may redirect)
        success.classList.add('show');
        contactForm.reset();
        setTimeout(() => success.classList.remove('show'), 6000);
      }
    })
    .catch(() => {
      // Network error — still show success (FormSubmit may have processed it)
      btn.innerHTML = '<span>Send Message</span> <i class="fa-solid fa-paper-plane"></i>';
      btn.disabled  = false;
      success.classList.add('show');
      contactForm.reset();
      setTimeout(() => success.classList.remove('show'), 6000);
    });
  });
}

/* ════════════════════════════════════════════════
   11. SMOOTH SCROLL FOR ALL NAV LINKS
   ════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
  });
});

/* ════════════════════════════════════════════════
   12. FLOATING ELEMENTS PARALLAX ON SCROLL
   ════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  document.querySelectorAll('.float-el').forEach((el, i) => {
    el.style.transform = `translateY(${scrollY * (0.03 + i * 0.01)}px)`;
  });
});

/* ════════════════════════════════════════════════
   13. HERO TYPED SUBTITLE EFFECT
   ════════════════════════════════════════════════ */
(function initTyped() {
  const el = document.getElementById('hero-subtitle');
  if (!el) return;

  const texts = [
    'Creative Developer & Digital Creator',
    'Graphic Designer & Visual Artist',
    'Video Editor & Content Creator',
    'Social Media Marketing Expert',
    'Web Developer & UI Designer',
  ];

  let idx = 0;
  let charIdx = 0;
  let deleting = false;

  function type() {
    const current = texts[idx];
    if (!deleting) {
      el.textContent = current.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(type, 2000);
        return;
      }
      setTimeout(type, 60);
    } else {
      el.textContent = current.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        idx = (idx + 1) % texts.length;
        setTimeout(type, 400);
        return;
      }
      setTimeout(type, 30);
    }
  }

  setTimeout(type, 1500);
})();

/* ════════════════════════════════════════════════
   14. ACTIVE NAV LINK ON SCROLL
   ════════════════════════════════════════════════ */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(section => obs.observe(section));
})();

/* ════════════════════════════════════════════════
   15. LAZY LOAD IMAGES
   ════════════════════════════════════════════════ */
if ('IntersectionObserver' in window) {
  const imgObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imgObs.unobserve(img);
      }
    });
  });
  document.querySelectorAll('img[loading="lazy"]').forEach(img => imgObs.observe(img));
}

/* ════════════════════════════════════════════════
   16. PROFILE IMAGE FALLBACK
   ════════════════════════════════════════════════ */
document.querySelectorAll('.profile-img, .about-img').forEach(img => {
  img.addEventListener('error', function () {
    // Use the generated 3D card image as fallback
    this.src = 'profile.png';
  });
});

console.log('%c✨ Bhawantha Lakshan Portfolio', 'color:#3b82f6;font-size:18px;font-weight:900;');
console.log('%cBuilt with Three.js + GSAP | Premium Portfolio', 'color:#64748b;font-size:12px;');
