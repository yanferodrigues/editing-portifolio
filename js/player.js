/* ==========================================================================
   PLAYER — turns any supported link into an embed and plays it in a
   lightbox, so visitors never leave the page.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Link parsing ---------- */
  const RX = {
    youtube: /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/i,
    vimeo: /vimeo\.com\/(?:.*\/)?(?:video\/)?(\d{6,})(?:\/([\da-f]{6,}))?/i,
    drive: /drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]{10,})/i,
    tiktok: /tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/(?:v2\/)?|player\/v1\/)(\d{8,})/i,
    instagram: /instagram\.com\/(?:[\w.]+\/)?(reels?|p|tv)\/([\w-]+)/i,
    file: /\.(mp4|webm|ogg|mov|m4v)(?:[?#]|$)/i
  };

  function parse(raw) {
    const url = String(raw || '').trim();
    if (!url) return null;
    let m;

    if ((m = url.match(RX.youtube))) {
      const id = m[1];
      return {
        kind: 'iframe',
        src: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1',
        thumbs: ['maxresdefault', 'sddefault', 'hqdefault'].map(function (q) {
          return 'https://i.ytimg.com/vi/' + id + '/' + q + '.jpg';
        })
      };
    }
    if ((m = url.match(RX.vimeo))) {
      const hash = m[2] || (url.match(/[?&]h=([\da-f]+)/i) || [])[1];
      return {
        kind: 'iframe',
        src: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1' + (hash ? '&h=' + hash : ''),
        thumbs: ['https://vumbnail.com/' + m[1] + '.jpg']
      };
    }
    if ((m = url.match(RX.drive))) {
      return {
        kind: 'iframe',
        src: 'https://drive.google.com/file/d/' + m[1] + '/preview',
        thumbs: ['https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1600']
      };
    }
    if ((m = url.match(RX.tiktok))) {
      return { kind: 'iframe', src: 'https://www.tiktok.com/player/v1/' + m[1] + '?autoplay=1&rel=0', thumbs: [] };
    }
    if ((m = url.match(RX.instagram))) {
      const type = m[1].toLowerCase() === 'p' ? 'p' : m[1].toLowerCase() === 'tv' ? 'tv' : 'reel';
      return { kind: 'iframe', src: 'https://www.instagram.com/' + type + '/' + m[2] + '/embed/', thumbs: [] };
    }
    if (RX.file.test(url)) {
      return { kind: 'video', src: url, thumbs: [] };
    }
    // Anything else (already an embed link, Wistia, Frame.io…) is used as-is.
    return { kind: 'iframe', src: url, thumbs: [] };
  }

  window.VideoUtils = { parse: parse };

  /* ---------- Lightbox ---------- */
  const modal = document.getElementById('player');
  if (!modal) return;

  const stage = modal.querySelector('.modal__stage');
  const frame = modal.querySelector('[data-frame]');
  const titleEl = modal.querySelector('[data-player-title]');
  const countEl = modal.querySelector('[data-player-count]');
  const prevBtn = modal.querySelector('[data-prev]');
  const nextBtn = modal.querySelector('[data-next]');
  const closeBtn = modal.querySelector('.modal__close');

  let list = [];
  let index = 0;
  let lastFocus = null;
  let closeTimer = 0;
  let swapTimer = 0;

  const pad = function (n) { return String(n).padStart(2, '0'); };

  function mount() {
    const item = list[index] || {};
    const info = parse(item.url);
    frame.innerHTML = '';
    frame.classList.remove('is-ready');

    if (!info) {
      frame.innerHTML = '<div class="modal__soon">Coming soon</div>';
      frame.classList.add('is-ready');
    } else if (info.kind === 'video') {
      const v = document.createElement('video');
      v.src = info.src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      if (item.thumbnail) v.poster = item.thumbnail;
      v.addEventListener('loadeddata', function () { frame.classList.add('is-ready'); }, { once: true });
      frame.appendChild(v);
    } else {
      const f = document.createElement('iframe');
      f.src = info.src;
      f.title = item.title || 'Video player';
      f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write; web-share';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.addEventListener('load', function () { frame.classList.add('is-ready'); }, { once: true });
      frame.appendChild(f);
    }

    titleEl.textContent = item.title || '';
    countEl.textContent = pad(index + 1) + ' / ' + pad(list.length);
    prevBtn.hidden = nextBtn.hidden = list.length < 2;
  }

  function open(items, i, isShort) {
    if (!items || !items.length) return;
    clearTimeout(closeTimer);
    list = items;
    index = Math.max(0, Math.min(i || 0, items.length - 1));
    lastFocus = document.activeElement;
    modal.classList.toggle('is-short', !!isShort);
    mount();
    modal.hidden = false;
    void modal.offsetWidth; // restart the entrance transition
    modal.classList.add('is-open');
    closeBtn.focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('player:open'));
  }

  function close() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    document.dispatchEvent(new CustomEvent('player:close'));
    closeTimer = setTimeout(function () {
      modal.hidden = true;
      frame.innerHTML = ''; // stops playback
    }, 650);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function go(step) {
    if (list.length < 2) return;
    index = (index + step + list.length) % list.length;
    clearTimeout(swapTimer);
    stage.classList.add('is-swapping');
    swapTimer = setTimeout(function () {
      mount();
      stage.classList.remove('is-swapping');
    }, 250);
  }

  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) close();
  });
  prevBtn.addEventListener('click', function () { go(-1); });
  nextBtn.addEventListener('click', function () { go(1); });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      // keep keyboard focus inside the player
      const focusables = Array.prototype.filter.call(
        modal.querySelectorAll('button, iframe, video'),
        function (el) { return !el.hidden && el.offsetParent !== null; }
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  window.Player = { open: open, close: close };
})();
