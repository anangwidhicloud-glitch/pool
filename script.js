/* ANTI-GRAVITY POOLS — INTERACTIVE ENGINE v2.0 */

document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  initParallax();
  initNavbar();
  initMobileNav();
  initBeforeAfter();
  initCounters();
  init3DTilt();
  initPortfolio();
  initFAQ();
  initEstimator();
  initScrollSpy();
  initSmoothScroll();
});

/* ────────────────────────────────────────────────
   1. POOL WATER CANVAS — Aquatic Theme Animation
   Caustic light rays + rising bubbles + water ripples
──────────────────────────────────────────────── */
function initCanvas() {
  const canvas = document.getElementById('agCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;
  const mouse = { x: W / 2, y: H / 2, active: false };
  let tick = 0;

  window.addEventListener('resize', () => {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    initScene();
  });
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
  window.addEventListener('mouseleave', () => { mouse.active = false; });

  /* (caustic rays removed — bubbles & ripples only) */

  /* ── BUBBLES ── */
  class Bubble {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x   = Math.random() * W;
      this.y   = initial ? Math.random() * H : H + Math.random() * 80;
      this.r   = Math.random() * 7 + 2.5;    /* slightly bigger */
      this.vy  = Math.random() * 0.9 + 0.4;
      this.wobble = (Math.random() - 0.5) * 0.65;
      this.wobbleFreq = Math.random() * 0.04 + 0.02;
      this.alpha = Math.random() * 0.55 + 0.2;  /* more opaque */
      this.phase = Math.random() * Math.PI * 2;
      this.highlight = Math.random() > 0.3;
    }
    update(t) {
      this.y -= this.vy;
      // horizontal drift — realistic bubble sway
      this.x += Math.sin(t * this.wobbleFreq + this.phase) * this.wobble;
      if (mouse.active) {
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          const f = (100 - d) / 100;
          this.x -= (dx / d) * f * 1.5;
          this.y -= (dy / d) * f * 1.5;
        }
      }
      if (this.y < -this.r * 2) this.reset();
    }
    draw() {
      const x = this.x, y = this.y, r = this.r;
      // outer glow ring
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
      glow.addColorStop(0,   `rgba(0,220,255,${this.alpha * 0.35})`);
      glow.addColorStop(0.5, `rgba(0,180,230,${this.alpha * 0.12})`);
      glow.addColorStop(1,   `rgba(0,150,200,0)`);
      ctx.beginPath();
      ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
      // bubble circle outline
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(140,245,255,${this.alpha * 1.8})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      // inner fill
      const inner = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r*0.95);
      inner.addColorStop(0, `rgba(220,255,255,${this.alpha * 0.7})`);
      inner.addColorStop(1, `rgba(0,180,220,${this.alpha * 0.05})`);
      ctx.fillStyle = inner;
      ctx.fill();
      // specular dot
      if (this.highlight) {
        ctx.beginPath();
        ctx.arc(x - r * 0.35, y - r * 0.38, r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${this.alpha * 1.4})`;
        ctx.fill();
      }
    }
  }

  /* ── WATER SURFACE SHIMMER (top strip) ── */
  class WaveShimmer {
    constructor(i) {
      this.i = i;
      this.phase = Math.random() * Math.PI * 2;
      this.speed = Math.random() * 0.015 + 0.008;
      this.amp   = Math.random() * 6 + 2;
      this.alpha = Math.random() * 0.06 + 0.02;
      this.y     = Math.random() * H * 0.25;
    }
    draw(t) {
      ctx.beginPath();
      ctx.moveTo(0, this.y + Math.sin(this.phase + t * this.speed) * this.amp);
      for (let x = 0; x <= W; x += 10) {
        const y = this.y + Math.sin((x / W) * Math.PI * 4 + this.phase + t * this.speed) * this.amp;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(0,229,255,${this.alpha * 1.6})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  /* ── MOUSE RIPPLE ── */
  const ripples = [];
  let lastRipple = 0;
  window.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - lastRipple > 80) {   /* more frequent */
      lastRipple = now;
      ripples.push({ x: e.clientX, y: e.clientY, r: 2, maxR: Math.random() * 70 + 40, a: 0.7, rings: Math.floor(Math.random()*2)+1 });
    }
  });

  /* ── Click creates big splash ripple ── */
  window.addEventListener('click', e => {
    for (let i = 0; i < 5; i++) {
      ripples.push({ x: e.clientX, y: e.clientY, r: i * 10, maxR: 100 + i * 30, a: 0.8 - i*0.14, rings: 1 });
    }
  });

  /* ── Init ── */
  let bubbles, shimmers;
  function initScene() {
    bubbles  = Array.from({ length: Math.min(Math.floor(W / 20), 60) }, () => new Bubble());
    shimmers = Array.from({ length: 12 }, (_, i) => new WaveShimmer(i));
  }
  initScene();

  /* ── MAIN LOOP ── */
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    tick++;
    const t = tick;

    /* 1. Wave shimmer lines */
    shimmers.forEach(s => s.draw(t));

    /* 3. Mouse water ripple rings */
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 1.8;
      rp.a -= 0.012;
      if (rp.a <= 0 || rp.r >= rp.maxR) { ripples.splice(i, 1); continue; }
      // draw concentric ellipses (perspective foreshortening)
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.38, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,229,255,${rp.a})`;
      ctx.lineWidth = 1.3;
      ctx.stroke();
      // second ring slightly smaller
      if (rp.r > 12) {
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r * 0.65, rp.r * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100,240,255,${rp.a * 0.55})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    /* 4. Bubbles rising from bottom */
    bubbles.forEach(b => { b.update(t); b.draw(); });

    requestAnimationFrame(loop);
  })();
}


/* ────────────────────────────────────────────────
   2. PARALLAX HERO BG
──────────────────────────────────────────────── */
function initParallax() {
  const bg = document.querySelector('.hero-bg');
  if (!bg) return;
  window.addEventListener('scroll', () => {
    const y = window.pageYOffset;
    bg.style.transform = `translateY(${y * 0.28}px)`;
  }, { passive: true });
}

/* ────────────────────────────────────────────────
   3. NAVBAR SCROLL BEHAVIOUR
──────────────────────────────────────────────── */
function initNavbar() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.pageYOffset > 60);
  }, { passive: true });
}

/* ────────────────────────────────────────────────
   4. MOBILE NAV DRAWER
──────────────────────────────────────────────── */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const drawer = document.getElementById('mobileDrawer');
  const closeBtn = document.getElementById('drawerClose');
  if (!toggle || !drawer) return;

  const open = () => { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { drawer.classList.remove('open'); document.body.style.overflow = ''; };

  toggle.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
  closeBtn?.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

/* ────────────────────────────────────────────────
   5. BEFORE / AFTER SLIDER
──────────────────────────────────────────────── */
function initBeforeAfter() {
  const wrap = document.querySelector('.ba-wrap');
  if (!wrap) return;
  const before = wrap.querySelector('.ba-img-before');
  const handle = wrap.querySelector('.ba-handle');
  let drag = false;

  const setPos = (clientX) => {
    const { left, width } = wrap.getBoundingClientRect();
    let pct = Math.max(5, Math.min(95, ((clientX - left) / width) * 100));
    before.style.width = pct + '%';
    handle.style.left = pct + '%';
  };

  wrap.addEventListener('mousedown', e => { drag = true; setPos(e.clientX); });
  window.addEventListener('mouseup', () => drag = false);
  window.addEventListener('mousemove', e => { if (drag) setPos(e.clientX); });

  wrap.addEventListener('touchstart', e => { drag = true; setPos(e.touches[0].clientX); }, { passive: true });
  window.addEventListener('touchend', () => drag = false);
  window.addEventListener('touchmove', e => { if (drag) setPos(e.touches[0].clientX); }, { passive: true });
}

/* ────────────────────────────────────────────────
   6. ANIMATED COUNTERS
──────────────────────────────────────────────── */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      const end = parseInt(target.dataset.count);
      const suffix = target.dataset.suffix || '';
      const dur = 2000;
      const step = dur / 45;
      let cur = 0;
      const t = setInterval(() => {
        cur = Math.min(cur + Math.ceil(end / 45), end);
        target.textContent = cur + suffix;
        if (cur >= end) clearInterval(t);
      }, step);
      obs.unobserve(target);
    });
  }, { threshold: 0.6 });
  els.forEach(el => obs.observe(el));
}

/* ────────────────────────────────────────────────
   7. 3D TILT EFFECT ON SERVICE CARDS
──────────────────────────────────────────────── */
function init3DTilt() {
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
      const y = ((e.clientY - r.top) / r.height - 0.5) * -14;
      card.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ────────────────────────────────────────────────
   8. PORTFOLIO FILTER + LIGHTBOX
──────────────────────────────────────────────── */
function initPortfolio() {
  const filterBtns = document.querySelectorAll('.pf-btn');
  const items = document.querySelectorAll('.portfolio-item');
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbTitle = document.getElementById('lbTitle');
  const lbDesc = document.getElementById('lbDesc');
  const lbClose = document.getElementById('lbClose');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      items.forEach(item => {
        const show = f === 'all' || item.dataset.cat === f;
        item.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
        if (show) { item.style.opacity = '1'; item.style.transform = ''; item.style.display = ''; }
        else { item.style.opacity = '0'; item.style.transform = 'scale(0.95)'; setTimeout(() => { if (item.style.opacity === '0') item.style.display = 'none'; }, 350); }
      });
    });
  });

  items.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('.portfolio-img')?.src;
      const title = item.querySelector('.p-title')?.textContent;
      const desc = item.querySelector('.p-desc')?.textContent;
      if (lbImg) lbImg.src = img;
      if (lbTitle) lbTitle.textContent = title;
      if (lbDesc) lbDesc.textContent = desc;
      lightbox?.classList.add('open');
    });
  });

  lbClose?.addEventListener('click', () => lightbox?.classList.remove('open'));
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox?.classList.remove('open'); });
}

/* ────────────────────────────────────────────────
   9. FAQ ACCORDION
──────────────────────────────────────────────── */
function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ────────────────────────────────────────────────
   10. COST ESTIMATOR
──────────────────────────────────────────────── */
function initEstimator() {
  const typeSelect  = document.getElementById('eType');
  const lengthInput = document.getElementById('eLen');
  const widthInput  = document.getElementById('eWid');
  const depthInput  = document.getElementById('eDep');
  const lenVal      = document.getElementById('lenVal');
  const widVal      = document.getElementById('widVal');
  const depVal      = document.getElementById('depVal');
  const features    = document.querySelectorAll('.est-cb');
  const display     = document.getElementById('eResult');
  if (!typeSelect) return;

  const recalc = () => {
    const len = +lengthInput.value, wid = +widthInput.value, dep = +depthInput.value;
    if (lenVal) lenVal.textContent = len + 'm';
    if (widVal) widVal.textContent = wid + 'm';
    if (depVal) depVal.textContent = dep + 'm';
    const vol = len * wid * dep;
    let cost = vol * 12_000_000 * +typeSelect.value;
    features.forEach(cb => { if (cb.checked) cost += +cb.value; });
    display.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(cost);
  };

  [typeSelect, lengthInput, widthInput, depthInput].forEach(el => el.addEventListener('input', recalc));
  features.forEach(cb => cb.addEventListener('change', recalc));
  recalc();
}

/* ────────────────────────────────────────────────
   11. SCROLL SPY (active nav)
──────────────────────────────────────────────── */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const pills = document.querySelectorAll('.nav-pill');
  window.addEventListener('scroll', () => {
    let cur = '';
    sections.forEach(s => {
      if (window.pageYOffset >= s.offsetTop - 180) cur = s.id;
    });
    pills.forEach(p => p.classList.toggle('active', p.getAttribute('href') === '#' + cur));
  }, { passive: true });
}

/* ────────────────────────────────────────────────
   12. SMOOTH SCROLL FOR ANCHOR LINKS
──────────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}
