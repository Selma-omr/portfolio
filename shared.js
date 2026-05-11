/* ══════════════════════════════════════════
   SELMA OMRI — PORTFOLIO
   Shared JavaScript
   ══════════════════════════════════════════ */

// ══ PAGE TRANSITION ══
const curtain = document.createElement('div');
curtain.className = 'page-transition';
document.body.appendChild(curtain);

function navigateTo(url) {
  curtain.classList.remove('exiting');
  curtain.classList.add('entering');
  setTimeout(() => {
    window.location.href = url;
  }, 420);
}

// Exit animation on load
window.addEventListener('DOMContentLoaded', () => {
  curtain.classList.add('exiting');
  setTimeout(() => curtain.classList.remove('exiting'), 500);
});

// ══ CURSOR ══
const cdot = document.getElementById('cdot');
const cring = document.getElementById('cring');
if (cdot && cring) {
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cdot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  });
  (function tick() {
    rx += (mx - rx) * .1;
    ry += (my - ry) * .1;
    cring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  })();
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a,[onclick],button,.pc,.pct,.proj-next')) {
      document.body.classList.add('hov');
    } else {
      document.body.classList.remove('hov');
    }
  });
}

// ══ SCROLL REVEAL ══
const obsReveal = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      obsReveal.unobserve(e.target);
    }
  });
}, { threshold: .08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.r,.r-left,.r-scale').forEach(el => obsReveal.observe(el));

// ══ NAV SCROLL ══
const navEl = document.querySelector('nav');
if (navEl) {
  let navRaf = false;
  window.addEventListener('scroll', () => {
    if (!navRaf) {
      navRaf = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        navEl.style.background = `rgba(6,4,10,${Math.min(.85, sy / 300 * .7 + .5)})`;
        navRaf = false;
      });
    }
  }, { passive: true });
}

// ══ HAMBURGER MENU ══
(function(){
  const nav = document.querySelector('nav');
  if (!nav) return;

  // Inject burger button (si pas déjà dans le HTML)
  let burger = nav.querySelector('.nav-burger');
  if (!burger) {
    burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label', 'Menu');
    burger.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(burger);
  }

  // Detect current page for link hrefs
  const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
  const root = isHome ? '' : '';

  // Build overlay
  const overlay = document.createElement('div');
  overlay.className = 'nav-mobile';
  overlay.innerHTML = `
    <a href="projets.html">Projets</a>
    <a href="${isHome ? '#about' : 'index.html#about'}">À propos</a>
    <a href="${isHome ? '#contact' : 'index.html#contact'}">Contact</a>
    <a class="nm-cta" href="${isHome ? '#contact' : 'index.html#contact'}">Me contacter ▶▶</a>
    <div class="nav-mobile-social">
      <a href="https://www.linkedin.com/in/selma-omri-51a4a2339/" target="_blank">LinkedIn</a>
      <a href="mailto:Selmaomri05@gmail.com">Email</a>
    </div>
  `;
  document.body.appendChild(overlay);

  function openMenu() {
    burger.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    burger.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    burger.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close on link click
  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
})();

// ══ CARD TILT ══
document.querySelectorAll('.pc,.pct,.stat').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `translateY(-4px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    card.style.transition = 'transform .1s';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform .4s cubic-bezier(.2,1,.3,1)';
  });
});

// ══ PROJECT HERO BG PARALLAX ══
const projBg = document.querySelector('.proj-hero-bg');
if (projBg) {
  projBg.style.willChange = 'transform';
  setTimeout(() => projBg.classList.add('loaded'), 100);

  let lastSy = 0;
  let rafPending = false;
  function updateParallax() {
    projBg.style.transform = `scale(1.08) translate3d(0,${lastSy * 0.2}px,0)`;
    rafPending = false;
  }
  window.addEventListener('scroll', () => {
    lastSy = window.scrollY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateParallax);
    }
  }, { passive: true });
}

// ══ STARFIELD ══
(function(){
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');

  let W, H, stars = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    stars = [];
    const count = Math.floor((W * H) / 3800); // densité adaptée à la taille d'écran
    for (let i = 0; i < count; i++) {
      stars.push({
        x:      Math.random() * W,
        y:      Math.random() * H,
        r:      Math.random() * 1.4 + 0.3,           // rayon 0.3 à 1.7px
        base:   Math.random() * 0.65 + 0.15,          // opacité de base
        speed:  Math.random() * 0.6 + 0.2,            // vitesse de scintillement
        offset: Math.random() * Math.PI * 2,           // phase aléatoire
        pink:   Math.random() < 0.08                   // 8% d'étoiles légèrement rosées
      });
    }
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.012;
    for (const s of stars) {
      const flicker = s.base + Math.sin(t * s.speed + s.offset) * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.pink
        ? `rgba(255,111,168,${Math.max(0, Math.min(1, flicker))})`
        : `rgba(255,255,255,${Math.max(0, Math.min(1, flicker))})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); init(); });
  init();
  draw();
})();

// ══ PROGRESS BAR ══
const bar = document.createElement('div');
bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,#e8006a,#ff6fa8);z-index:9998;transition:width .1s;width:0';
document.body.appendChild(bar);
let barRaf = false;
window.addEventListener('scroll', () => {
  if (!barRaf) {
    barRaf = true;
    requestAnimationFrame(() => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      bar.style.width = pct + '%';
      barRaf = false;
    });
  }
}, { passive: true });
