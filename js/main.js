/* ==========================================================================
   MAIN — renders the videos and runs the interactions / animations
   ========================================================================== */
(function () {
  'use strict';

  const root = document.documentElement;
  const data = window.PORTFOLIO || {};
  const longForm = Array.isArray(data.longForm) ? data.longForm : [];
  const shorts = Array.isArray(data.shorts) ? data.shorts : [];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const parse = window.VideoUtils ? window.VideoUtils.parse : function () { return null; };

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';

  if ('scrollRestoration' in history && !location.hash) {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------
     1. Render the video cards from js/videos.js
     ------------------------------------------------------------------ */
  function mediaHTML(item) {
    const info = parse(item.url);
    const thumbs = [item.thumbnail].concat(info ? info.thumbs : []).filter(Boolean);
    let html = '<span class="media__inner"><span class="media-ph"></span>';
    if (thumbs.length) {
      html += '<img alt="" loading="lazy" decoding="async" draggable="false" data-thumbs="' + esc(thumbs.join('|')) + '">';
    } else if (info && info.kind === 'video') {
      html += '<video muted playsinline loop preload="metadata" data-src="' + esc(info.src) + '"></video>';
    }
    return html + '</span>';
  }

  function card(item, i, group) {
    const isShort = group === 'shorts';
    const label = item.title ? 'Play: ' + item.title : (isShort ? 'Play short ' : 'Play video ') + (i + 1);
    return '<article class="' + (isShort ? 'short-card" style="--d:' + i * 110 + 'ms"' : 'lf-card" data-reveal="card"') + '>' +
      '<button type="button" class="' + (isShort ? 'short-card__media' : 'lf-card__media') + '" data-cursor="play" data-play="' + group + '" data-index="' + i + '" aria-label="' + esc(label) + '">' +
        mediaHTML(item) +
        '<span class="play-btn' + (isShort ? ' play-btn--sm' : '') + '" aria-hidden="true">' + PLAY + '</span>' +
      '</button>' +
      (item.title ? '<h3 class="card__title">' + esc(item.title) + '</h3>' : '') +
    '</article>';
  }

  const longList = $('[data-long-list]');
  if (longList) longList.innerHTML = longForm.map((item, i) => card(item, i, 'long')).join('');
  const shortsTrack = $('[data-shorts-track]');
  if (shortsTrack) shortsTrack.innerHTML = shorts.map((item, i) => card(item, i, 'shorts')).join('');

  // Thumbnails: try each source in order (custom → maxres → sd → hq)
  $$('img[data-thumbs]').forEach((img) => {
    const queue = img.dataset.thumbs.split('|');
    const next = () => {
      const src = queue.shift();
      if (src) img.src = src; else img.remove();
    };
    img.addEventListener('load', () => {
      // YouTube answers a missing size with a 120px grey image
      if (img.naturalWidth <= 120 && queue.length) next();
      else img.classList.add('is-loaded');
    });
    img.addEventListener('error', next);
    next();
  });

  // Direct video files: first frame as cover, muted preview on hover
  $$('video[data-src]').forEach((v) => {
    v.src = v.dataset.src + '#t=0.1';
    v.addEventListener('loadeddata', () => v.classList.add('is-loaded'), { once: true });
    const btn = v.closest('[data-play]');
    if (finePointer && btn) {
      btn.addEventListener('mouseenter', () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); });
      btn.addEventListener('mouseleave', () => v.pause());
    }
  });

  // Open the player
  const groups = { long: longForm, shorts: shorts };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-play]');
    if (!btn || !window.Player) return;
    const group = btn.dataset.play;
    window.Player.open(groups[group], Number(btn.dataset.index), group === 'shorts');
  });

  /* ------------------------------------------------------------------
     2. Text helpers: word split for titles + hover roll for links
     ------------------------------------------------------------------ */
  function splitWords(el) {
    let i = 0;
    (function walk(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const word = document.createElement('span');
            const inner = document.createElement('span');
            word.className = 'word';
            inner.textContent = part;
            inner.style.setProperty('--i', i++);
            word.appendChild(inner);
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
  }
  $$('[data-split]').forEach(splitWords);

  $$('[data-roll]').forEach((el) => {
    const t = el.textContent.trim();
    el.innerHTML = '<span class="roll"><span data-text="' + esc(t) + '">' + esc(t) + '</span></span>';
  });

  /* ------------------------------------------------------------------
     3. Smooth scroll (Lenis) + scroll lock
     ------------------------------------------------------------------ */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  let menuOpen = false;
  let playerOpen = false;
  function syncLock() {
    const locked = menuOpen || playerOpen;
    root.classList.toggle('is-locked', locked);
    if (lenis) { if (locked) lenis.stop(); else lenis.start(); }
  }

  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      const target = hash === '#' || hash === '#top' ? 0 : document.querySelector(hash);
      if (target === null) return;
      e.preventDefault();
      setMenu(false);
      scrollToTarget(target);
    });
  });

  /* ------------------------------------------------------------------
     4. Header, mobile menu, scroll progress, active link
     ------------------------------------------------------------------ */
  const header = $('.header');
  const menuBtn = $('.menu-toggle');
  const menu = $('#mobile-menu');

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', String(open));
      const label = $('.menu-toggle__label', menuBtn);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    }
    if (menu) menu.inert = !open;
    if (open && header) header.classList.remove('is-hidden');
    syncLock();
  }
  if (menuBtn) menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  const bar = $('.progress span');
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    if (header) {
      header.classList.toggle('is-scrolled', y > 30);
      const dy = y - lastY;
      if (Math.abs(dy) > 6) {
        if (!menuOpen) header.classList.toggle('is-hidden', dy > 0 && y > 500);
        lastY = y;
      }
    }

    const max = root.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  const navLinks = $$('.nav a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id ? '#' + en.target.id : '';
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach((s) => sectionIO.observe(s));

  /* ------------------------------------------------------------------
     5. Scroll reveals (start right after the intro)
     ------------------------------------------------------------------ */
  function startReveals() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    $$('[data-reveal], [data-split], [data-reveal-group]').forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     6. Entrance — wait for the fonts (max 1.5s), then animate the intro
     ------------------------------------------------------------------ */
  const fontsReady = document.fonts && document.fonts.ready
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))])
    : Promise.resolve();

  fontsReady.then(() => {
    requestAnimationFrame(() => root.classList.add('is-loaded'));
    setTimeout(startReveals, reduce ? 0 : 700);
  });

  /* ------------------------------------------------------------------
     7. "Play" cursor bubble + magnetic button
     ------------------------------------------------------------------ */
  const cursor = $('.cursor');
  if (finePointer && cursor) {
    root.classList.add('has-cursor');
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;

    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      cursor.classList.toggle('is-active', !!t && !playerOpen);
    });
    root.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));

    (function loop() {
      cx += (mx - cx) * 0.2;
      cy += (my - cy) * 0.2;
      cursor.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();

    if (!reduce) {
      $$('[data-magnetic]').forEach((el) => {
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2);
          const y = e.clientY - (r.top + r.height / 2);
          el.style.transform = 'translate(' + (x * 0.25).toFixed(1) + 'px,' + (y * 0.35).toFixed(1) + 'px)';
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      });
    }
  }

  document.addEventListener('player:open', () => {
    playerOpen = true;
    if (cursor) cursor.classList.remove('is-active');
    syncLock();
  });
  document.addEventListener('player:close', () => {
    playerOpen = false;
    syncLock();
  });

  /* ------------------------------------------------------------------
     8. Copy email + toast, footer year
     ------------------------------------------------------------------ */
  const toastEl = $('.toast');
  let toastTimer = 0;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
  }
  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      const done = () => toast('Email copied');
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, () => { if (legacyCopy(text)) done(); });
      } else if (legacyCopy(text)) {
        done();
      }
    });
  });

  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  window.__siteReady = true;
})();
