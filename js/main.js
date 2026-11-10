/* ============================================================
   MAIN — loader, smooth scroll, every chapter's scroll-driven scene,
   the lists, the story mode. Timelines are measured in *video seconds*
   so the pinned scenes line up with the narration.
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth < 820;
  const R = PKT.rng(20260515);
  const rr = (a, b) => a + R() * (b - a);
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  try { history.scrollRestoration = 'manual'; } catch (e) { }

  PKT.pins = {};

  /* ---------- small helpers ---------- */
  function img(name, alt, cls) {
    const im = new Image(); im.alt = alt || ''; im.decoding = 'async'; im.loading = 'lazy'; im.draggable = false; if (cls) im.className = cls;
    im.onerror = function () { if (!im.dataset.fb) { im.dataset.fb = 1; im.src = 'assets/photos/' + name; } else im.style.visibility = 'hidden'; };
    im.src = PKT.PHOTOS + name; return im;
  }
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function dragScroll(box) {
    let down = false, sx = 0, sl = 0, moved = 0;
    box.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; down = true; sx = e.clientX; sl = box.scrollLeft; moved = 0; box.classList.add('drag'); });
    addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); box.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; box.classList.remove('drag'); });
    box.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    box.addEventListener('dragstart', (e) => e.preventDefault());
    return () => down;
  }
  function tilt(node, max) {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches || reduce) return;
    const rx = gsap.quickTo(node, 'rotationX', { duration: .4, ease: 'power3' }), ry = gsap.quickTo(node, 'rotationY', { duration: .4, ease: 'power3' });
    gsap.set(node, { transformPerspective: 800 });
    node.addEventListener('pointermove', (e) => { const b = node.getBoundingClientRect(); ry(((e.clientX - b.left) / b.width - .5) * max); rx(-((e.clientY - b.top) / b.height - .5) * max); });
    node.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }

  /* ============================================================
     1 · BUILD THE DOM LISTS
     ============================================================ */
  function windows(wall, n) { const w = el('div', 'win'); for (let i = 0; i < 9; i++) w.appendChild(el('i')); wall.appendChild(w); }
  windows($('#helloWall')); windows($('#finaleWall'));

  $$('.mix').forEach(PKT.mixType);

  /* roots */
  $('#rootsGrid').innerHTML = PKT.roots.map((r) => '<div class="rnote"><b>' + r.y + '</b><strong>' + r.t + '</strong>' + r.d + '</div>').join('');

  /* boarding passes */
  $('#passStack').innerHTML = PKT.flights.map((f, i) =>
    '<div class="pass"><div class="main"><div class="top"><span>Boarding pass</span><span>' + f.y + '</span></div>' +
    '<div class="city">' + f.place + '<small>' + f.code + ' · gate ' + f.gate + '</small></div>' +
    '<div class="role">' + f.role + ' · <b>' + f.co + '</b></div><div class="line">' + f.line + '</div></div>' +
    '<div class="stub"><span>Seat</span><b>' + (i + 1) + 'A</b><div class="bars"></div><span>' + f.code + '</span></div></div>').join('');

  /* route dots + plane (html, so the stretched svg never squashes them) */
  const officePin = $('.office-pin'), routeSvg = $('#routeSvg'), routePath = $('#routePath');
  $('#plane') && $('#plane').remove();
  const rdots = PKT.flights.map((f, i) => { const d = el('div', 'rdot', '<b>' + f.code + '</b>'); officePin.appendChild(d); return d; });
  const planeEl = el('div', 'plane-el', '<svg viewBox="0 0 48 48"><path d="M44 24L6 8l5 12 17 4-17 4-5 12z" fill="currentColor" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>'); officePin.appendChild(planeEl);
  function placeOnRoute(u, node, withAngle) {
    const L = routePath.getTotalLength(), p = routePath.getPointAtLength(L * u), sr = routeSvg.getBoundingClientRect(), pr = officePin.getBoundingClientRect();
    const sx = sr.width / 1000, sy = sr.height / 220;
    node.style.left = (sr.left - pr.left + p.x * sx) + 'px'; node.style.top = (sr.top - pr.top + p.y * sy) + 'px';
    if (withAngle) { const q = routePath.getPointAtLength(Math.min(L, L * u + 2)), a = Math.atan2((q.y - p.y) * sy, (q.x - p.x) * sx) * 180 / Math.PI; node.style.rotate = a + 'deg'; }
  }
  function layoutRoute() { rdots.forEach((d, i) => placeOnRoute(.03 + i / (rdots.length - 1) * .94, d)); placeOnRoute(.03, planeEl, true); }

  /* tools cloud: two zones, so nothing hides the big words */
  const tc = $('#toolsCloud'), TOOLS = PKT.tools, toolCols = ['#C8FF3D', '#FF5A3C', '#5CE1E6', '#FFD02E', '#ffffff'];
  TOOLS.forEach((t, i) => {
    const c = el('span', 'tool', t); c.dataset.z = i % 4 === 0 ? 'a' : 'b'; c.style.setProperty('--c', toolCols[i % toolCols.length]); c.style.rotate = rr(-8, 8) + 'deg'; c.dataset.fs = rr(.85, 1.35).toFixed(2); tc.appendChild(c);
  });
  /* greedy non-overlapping packer: measures every bubble, keeps them off each other (and, on phones, off his face) */
  function packTools() {
    const W = tc.clientWidth || innerWidth, H = tc.clientHeight || innerHeight, small = W < 760;
    const zones = small ? { a: [22, 56, 1, 6.5], b: [3, 97, 38, 49] } : { a: [3, 43, 5, 27], b: [45, 97, 59, 73] };   /* desktop: above his head, and in the strip under the big words (never over him) */
    const placed = [], scale = small ? .78 : Math.min(1, Math.max(.78, W / 1440));
    $$('.tool', tc).forEach((c, idx) => {
      const z = zones[small ? c.dataset.z : (idx % 2 ? 'b' : 'a')], f = +c.dataset.fs * scale;
      c.style.fontSize = f + 'em'; c.style.display = '';
      const w = c.offsetWidth, h = c.offsetHeight;
      let best = null;
      /* three passes: roomy, tight, then let the zone grow a little */
      [[22, 0], [10, 0], [4, 7]].forEach((ps) => {
        if (best) return;
        const pad = ps[0], grow = ps[1] / 100;
        const x0 = z[0] / 100 * W, x1 = Math.max(x0, (z[1] / 100 + grow) * W - w), y0 = z[2] / 100 * H, y1 = Math.max(y0, (z[3] / 100 + grow) * H - h);
        for (let k = 0; k < 120 && !best; k++) {
          const x = x0 + Math.random() * (x1 - x0), y = y0 + Math.random() * (y1 - y0);
          if (!placed.some((p) => x < p.x + p.w + pad && x + w + pad > p.x && y < p.y + p.h + pad && y + h + pad > p.y)) best = { x: x, y: y, w: w, h: h };
        }
      });
      if (best) { placed.push(best); c.style.left = (best.x / W * 100).toFixed(2) + '%'; c.style.top = (best.y / H * 100).toFixed(2) + '%'; }
      else c.style.display = 'none'; /* no room: better absent than on top of something */
    });
  }
  packTools();
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(packTools);
  let packT; addEventListener('resize', () => { clearTimeout(packT); packT = setTimeout(packTools, 250); });

  /* companies */
  (function () {
    const U = PKT.companies.udesign, A = PKT.companies.aakriti, ud = $('#coUD'), ak = $('#coAK');
    $('.co-line', ud).textContent = U.line; $('.co-story', ud).textContent = U.story;
    $('#udItems').innerHTML = U.items.map((t) => '<li style="--r:' + rr(-4, 4).toFixed(1) + 'deg">' + t + '</li>').join('');
    const us = $('.co-sister', ud); $('span', us).textContent = U.sister.line; $('i', us).textContent = U.sister.sign;
    const ul = $('.co-link', ud); ul.href = U.url;
    $('.co-line', ak).textContent = A.line; $('.co-story', ak).textContent = A.story + ' ' + A.handle;
    $('.co-sister span', ak).textContent = PKT.companies.qr.line;
    const al = $('.co-link', ak); al.href = A.url;
  })();

  /* behind the lens */
  (function () {
    const strip = $('#photoStrip');
    for (let i = 1; i <= PKT.photoCount; i++) { const c = el('div', 'ph-card'); c.style.setProperty('--r', rr(-3, 3).toFixed(1) + 'deg'); c.appendChild(img('photo-' + String(i).padStart(2, '0') + '.jpg', 'Photo ' + i)); strip.appendChild(c); tilt(c, 8); }
    dragScroll(strip);
    const reels = $('#reels');
    PKT.videoFiles.forEach((f, i) => {
      const r = el('div', 'reel'); r.style.setProperty('--r', ((i - 1) * 2.2).toFixed(1) + 'deg');
      const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'none'; v.dataset.src = PKT.VIDEOS + f; r.appendChild(v);
      r.appendChild(el('span', null, 'Reel ' + f.replace(/\D/g, '').replace(/^0/, '').padStart(2, '0')));
      reels.appendChild(r);
    });
    const vo = new IntersectionObserver((es) => es.forEach((e) => { const v = $('video', e.target); if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => { }); } else v.pause(); }), { threshold: .35 });
    $$('.reel', reels).forEach((r) => vo.observe(r));
  })();

  /* sims + comic panels + channels */
  (function () {
    const yrs = ['2013', '', '', '', 'still flying'];
    $('#simTrack').innerHTML = PKT.sims.map((s, i) => '<div class="sim-node" style="--r:' + rr(-4, 4).toFixed(1) + 'deg"><b>' + s + '</b><small>' + (yrs[i] || '&nbsp;') + '</small></div>').join('') +
      '<div class="sim-plane"><svg viewBox="0 0 48 48"><path d="M44 24L6 8l5 12 17 4-17 4-5 12z" fill="currentColor"/></svg></div>';
    const pows = ['POW!', 'ZOOM!', 'WHOOSH!', 'BAM!', 'WOW!', 'GO!'], caps = ['Squad up.', 'Cleared for take-off.', 'Gear up. Gear down.', 'Wanted level: max.', 'Lights off. Popcorn on.', 'Next episode.'];
    $('#panelsGrid').innerHTML = PKT.playlist.map((p, i) => '<div class="cpanel" style="--r:' + rr(-2.5, 2.5).toFixed(1) + 'deg"><div class="pow">' + pows[i] + '</div><b>' + p + '</b><small>' + caps[i] + '</small></div>').join('');
    $('#channels').innerHTML = '';
    PKT.channels.forEach((c) => { const d = el('div', 'chan'); d.appendChild(img(c.img + '.jpg', c.name)); d.appendChild(el('div', null, c.name + '<small>' + c.line + '</small>')); $('#channels').appendChild(d); });
  })();

  /* people, cats, why I stay, names */
  (function () {
    $('#pplGrid').innerHTML = PKT.people.map((p, i) => '<div class="polaroid" style="--r:' + [-4, 3, -2][i] + 'deg"><div class="ph">' + p.name.charAt(0) + '</div><div class="who">' + p.who + '</div><div class="nm">' + p.name + '</div><p>' + p.note + '</p></div>').join('');
    const rail = $('#catRail');
    PKT.cats.forEach((c, i) => {
      const d = el('div', 'cat-card'); d.style.setProperty('--r', ((i % 2 ? 1 : -1) * rr(.5, 2.6)).toFixed(1) + 'deg');
      const ph = el('div', 'ph'); const a = img(c.img + '.jpg', c.name, 'a'), b = img(c.img + '-2.jpg', c.name + ', again', 'b'); ph.append(a, b, el('span', 'n', c.n)); d.appendChild(ph);
      d.insertAdjacentHTML('beforeend', '<h3>' + c.name + '</h3><div class="tag">' + c.tag + '</div><p>' + c.story + '</p>');
      d.addEventListener('click', () => d.classList.toggle('flip')); rail.appendChild(d);
    });
    dragScroll(rail);
    const stay = ['I cannot leave Al Ain. They need me here.', 'No holiday in about three years. They cannot be left alone.', '2–3 minutes to my kitchen. About 8 to the front door.', 'I feed the outdoor strays too.'];
    $('#stayChips').innerHTML = stay.map((t) => '<span style="--r:' + rr(-3, 3).toFixed(1) + 'deg">' + t + '</span>').join('');
    const names = PKT.crew.concat(PKT.mentors), fonts = ['Mansalva', 'Waiting for the Sunrise', 'Handlee', 'La Belle Aurore', 'Fredericka the Great'], cols = ['#FFB866', '#FF7A6B', '#9AD1A1', '#F4EEE2', '#FFE45E', '#8fd3ff'];
    $('#nameWall').innerHTML = names.map((n, i) => '<span style="--nf:\'' + fonts[i % fonts.length] + '\';--ns:' + rr(20, 52).toFixed(0) + 'px;--nc:' + cols[(i * 7) % cols.length] + ';--r:' + rr(-6, 6).toFixed(1) + 'deg;--d:' + (-rr(0, 6)).toFixed(1) + 's">' + n + '</span>').join('');
    const eyes = $('#eyes'), ec = ['#c8ff6b', '#ffe45e', '#ffb866', '#8fd3ff', '#9AFF7A'];
    for (let i = 0; i < 18; i++) { const e = el('div', 'eye-pair', '<i></i><i></i>'); e.style.left = rr(2, 96) + '%'; e.style.top = rr(2, 98) + '%'; e.style.setProperty('--s', rr(.7, 1.8).toFixed(2)); e.style.setProperty('--d', (-rr(0, 7)).toFixed(1) + 's'); e.style.setProperty('--ec', pick(ec)); eyes.appendChild(e); }
  })();

  /* contact */
  $('#waBtn').href = PKT.me.whatsapp; $('#mailBtn').href = 'mailto:' + PKT.me.email; $('#telBtn').href = 'tel:' + PKT.me.phone.replace(/[^+\d]/g, '');

  /* dots nav */
  const SECTIONS = $$('.ch'), dots = $('#dots');
  SECTIONS.forEach((s) => { const a = el('a', null, '<span>' + s.dataset.name + '</span>'); a.href = '#' + s.id; a.dataset.id = s.id; a.setAttribute('aria-label', s.dataset.name); dots.appendChild(a); });
  document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return; const t = $(a.getAttribute('href')); if (!t) return; e.preventDefault(); PKT.scrollTo(t, { duration: 2 }); });

  /* ============================================================
     2 · SEQUENCES (the video, in pieces)
     ============================================================ */
  const SEQ = {};
  [['hello', 'cv-hello'], ['storm', 'cv-storm'], ['anchor', 'cv-anchor'], ['office', 'cv-office'], ['desk', 'cv-desk'], ['cockpit', 'cv-cockpit'], ['home', 'cv-home']].forEach(([k, id]) => { SEQ[k] = PKT.makeScene(k, document.getElementById(id)); });
  SEQ.hello.visible = true;
  [['storm', '.storm-pin'], ['anchor', '.anchor-pin'], ['office', '.office-pin'], ['desk', '.desk-pin'], ['cockpit', '.cockpit-pin'], ['home', '.finale-pin']].forEach(([k, sel]) => PKT.watchSeq(SEQ[k], $(sel)));

  /* ============================================================
     3 · SMOOTH SCROLL
     ============================================================ */
  const lenis = new Lenis({ lerp: .09, wheelMultiplier: .92, smoothWheel: !reduce, touchMultiplier: 1.4 });
  PKT.lenis = lenis; lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  PKT.scrollTo = (t, o) => lenis.scrollTo(t, Object.assign({ duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) }, o || {}));

  /* ============================================================
     4 · LOADER
     ============================================================ */
  const loader = $('#loader'), bar = $('#loaderBar'), pct = $('#loaderPct'), hand = $('#loaderHand');
  let pFont = 0, pFrames = 0;
  const show = () => { const v = Math.round((pFont * .25 + pFrames * .75) * 100); bar.style.width = v + '%'; pct.textContent = v + '%'; };
  SEQ.hello.progress = (f) => { pFrames = f; show(); };
  const fontList = ['Caveat Brush', 'Covered By Your Grace', 'Gochi Hand', 'Amatic SC', 'Permanent Marker', 'Rock Salt', 'Sedgwick Ave Display', 'Bangers', 'Mansalva', 'Gaegu'];
  let fdone = 0;
  const LITE = document.documentElement.classList.contains('lite');
  const critFonts = LITE ? fontList.slice(0, 3) : fontList;
  if (LITE) setTimeout(() => fontList.slice(3).forEach((f) => document.fonts.load('40px "' + f + '"').catch(() => { })), 1500);
  const fontsP = Promise.all(critFonts.map((f) => document.fonts.load('40px "' + f + '"').catch(() => { }).then(() => { fdone++; pFont = fdone / critFonts.length; show(); })));
  const timeout = new Promise((res) => setTimeout(res, 12000));
  Promise.race([Promise.all([fontsP, SEQ.hello.load(80)]), timeout]).then(() => {
    pFont = 1; pFrames = 1; show(); hand.textContent = 'Ready.'; $('#loaderBtns').hidden = false;
    $$('#loaderBtns .enter').forEach((b) => b.addEventListener('click', () => enter(b.dataset.sound === '1'), { once: true }));
  });

  /* ============================================================
     5 · THE SCENES
     ============================================================ */
  const len = (v) => (small() ? v * .72 : v);
  function pinScene(name, pinSel, scroll, dur, build, seq) {
    const pin = $(pinSel); if (!pin) return null;
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: pin, start: 'top top', end: '+=' + len(scroll) + '%', pin: true, pinSpacing: true, scrub: true, anticipatePin: 1, onUpdate: seq ? (self) => seq.setProgress(self.progress) : undefined } });
    tl.to({}, { duration: dur }, 0);
    build(tl);
    PKT.pins[name] = tl.scrollTrigger; return tl;
  }
  /* a caption that types itself in as you scroll, then leaves */
  function cap(tl, wrap, t0, t1, opt) {
    wrap = typeof wrap === 'string' ? $(wrap) : wrap; if (!wrap) return; opt = opt || {};
    const m = wrap.classList.contains('mix') ? wrap : $('.mix', wrap), o = { p: 0 }; if (m) PKT.setReveal(m, 0);
    tl.set(wrap, { opacity: 1 }, t0);
    tl.fromTo(wrap, { y: opt.y != null ? opt.y : 40 }, { y: 0, duration: .8, ease: 'power2.out' }, t0);
    if (m) tl.to(o, { p: 1, duration: opt.dur || Math.min(1.2, (t1 || t0 + 2) - t0), onUpdate: () => PKT.setReveal(m, o.p) }, t0);
    if (t1) tl.to(wrap, { opacity: 0, y: -34, duration: .5, ease: 'power1.in' }, t1 - .5);
    return tl;
  }
  function revealOnScroll(node, vars, trig) { return gsap.from(node, Object.assign({ scrollTrigger: { trigger: trig || node, start: 'top 84%', toggleActions: 'play none none reverse' } }, vars)); }

  function buildScenes() {
    layoutRoute();

    /* ---------- 01 HELLO (0 – 10.03 s) ---------- */
    pinScene('hello', '.hello-pin', 560, 10.03, (tl) => {
      tl.to('.hello-type', { yPercent: -16, scale: 1.14, duration: 10 }, 0);
      tl.to('.hello-type', { opacity: 0, duration: 2.6, ease: 'power1.in' }, 5.6);
      tl.to('#cv-hello', { scale: 1.07, duration: 10, transformOrigin: '50% 100%' }, 0);
      tl.to('#helloWall .win', { x: '7vw', opacity: .45, duration: 10 }, 0);
      tl.to('.hello-meta', { opacity: 0, duration: 1 }, 1);
      tl.to('.deva', { opacity: 0, x: '-6vw', duration: 1.3, ease: 'power1.in' }, 4.0);
      cap(tl, '.cap-1', .8, 3.4); cap(tl, '.cap-2', 3.4, 5.6); cap(tl, '.cap-3', 5.6, 8.2); cap(tl, '.cap-4', 8.2, null, { dur: 1.4 });
    }, SEQ.hello);

    /* ---------- 02 MEGHALAYA (10.03 – 14.3 s) ---------- */
    const rainO = { v: 0 }, fired = {};
    const stormTl = pinScene('storm', '.storm-pin', 360, 4.27, (tl) => {
      tl.to(rainO, { v: 1, duration: 1.1, onUpdate: () => PKT.fx.setRain(rainO.v) }, 0);
      const w = $('#meghalayaWord'), o = { p: 0 }; PKT.setReveal(w, 0);
      tl.to(o, { p: 1, duration: 1.7, onUpdate: () => PKT.setReveal(w, o.p) }, .15);
      tl.fromTo(w, { scale: .9 }, { scale: 1.08, duration: 4.2 }, 0);
      cap(tl, '.scrawl.s1', .5, 1.9); cap(tl, '.scrawl.s2', 1.6, 3.0); cap(tl, '.scrawl.s3', 2.6, 4.0); cap(tl, '.scrawl.s4', 3.5, null, { dur: 1 });
    }, SEQ.storm);
    if (stormTl) {
      const st = stormTl.scrollTrigger, marks = [.18, .46, .78];
      ScrollTrigger.create({ trigger: '.storm-pin', start: st.start, end: st.end, onUpdate: (self) => { marks.forEach((m, i) => { if (self.progress >= m && !fired[i]) { fired[i] = 1; PKT.fx.strike({ x: [.22, .68, .45][i], dist: [.1, .5, .05][i] }); } else if (self.progress < m - .06) fired[i] = 0; }); } });
    }
    ScrollTrigger.create({ trigger: '.roots', start: 'top 85%', end: 'bottom 30%', onEnter: () => PKT.fx.setRain(.6), onLeave: () => PKT.fx.setRain(0), onEnterBack: () => PKT.fx.setRain(.6), onLeaveBack: () => PKT.fx.setRain(1) });
    $$('.rnote').forEach((n, i) => revealOnScroll(n, { y: 120, rotate: (i % 2 ? 1 : -1) * 10, opacity: 0, duration: 1, ease: 'back.out(1.5)' }));
    PKT.popIn($('.roots-h .mix'), { scrollTrigger: { trigger: '.roots-h', start: 'top 86%', toggleActions: 'play none none reverse' } });

    /* ---------- 03 JOURNEY ---------- */
    pinScene('anchor', '.anchor-pin', 280, 5.13, (tl) => {
      tl.fromTo('#cv-anchor', { scale: 1.06 }, { scale: 1, duration: 5 }, 0);
      cap(tl, '.a-l', .6, 2.8, { y: 60 }); cap(tl, '.a-r', 2.4, null, { y: 60, dur: 1.4 });
    }, SEQ.anchor);
    pinScene('office', '.office-pin', 470, 9.97, (tl) => {
      tl.fromTo('.office-h', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 0);
      const ps = $$('.pass'), step = 9.5 / ps.length; const pr = { u: 0 };
      ps.forEach((p, k) => {
        const t = .5 + k * step;
        tl.fromTo(p, { x: '70%', rotation: 9, opacity: 0 }, { x: 0, rotation: k % 2 ? -2 : 1.5, opacity: 1, duration: .6, ease: 'back.out(1.3)' }, t);
        if (k) tl.to(ps[k - 1], { x: '-75%', rotation: -12, opacity: 0, duration: .5, ease: 'power2.in' }, t);
        tl.call(() => rdots.forEach((d, q) => d.classList.toggle('on', q <= k)), null, t + .2);
      });
      tl.to(pr, { u: 1, duration: 9.4, onUpdate: () => placeOnRoute(.03 + pr.u * .94, planeEl, true) }, .3);
      tl.fromTo('#cv-office', { x: 40 }, { x: 0, duration: 2 }, 0);
    }, SEQ.office);
    $$('.stamp').forEach((s, i) => gsap.from(s, { scale: 2.6, rotation: (i ? 14 : -18), opacity: 0, duration: .55, ease: 'power4.in', scrollTrigger: { trigger: s, start: 'top 82%', toggleActions: 'play none none reverse', onEnter: () => PKT.audio && PKT.audio.blip && PKT.audio.blip() } }));

    /* ---------- 04 BUILDER (29.6 – 39.6 s) ---------- */
    pinScene('desk', '.desk-pin', 540, 10, (tl) => {
      cap(tl, '#buildWord', .4, null, { dur: 2.4, y: 30 });
      const dw2 = $('.dw2'); tl.fromTo(dw2, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, 2.6);
      ['.n1', '.n2', '.n3'].forEach((s, i) => tl.fromTo(s, { opacity: 0, y: 90, rotation: i % 2 ? 12 : -12, scale: .7 }, { opacity: 1, y: 0, rotation: [-3, 2, -2][i], scale: 1, duration: .8, ease: 'back.out(1.6)' }, 3.4 + i * 1.5));
      tl.to('.tool', { opacity: .9, scale: 1, duration: .6, stagger: { each: .3, from: 'random' }, ease: 'back.out(2)' }, 5);
      tl.to('.blueprint', { backgroundPosition: '0 -160px,-160px 0,0 -400px,-400px 0', duration: 10 }, 0);
      tl.fromTo('#cv-desk', { x: -50 }, { x: 0, duration: 2 }, 0);
    }, SEQ.desk);
    $$('.tool').forEach((t) => gsap.set(t, { scale: .2 }));
    $$('.tool').forEach((t) => gsap.to(t, { y: '+=' + rr(8, 16), x: '+=' + rr(-8, 8), duration: rr(2.2, 4), repeat: -1, yoyo: true, ease: 'sine.inOut' }));
    $$('.sc-head .mix, .ws-head .mix, .co-head .mix, .lens-head .mix').forEach((m) => PKT.popIn(m, { scrollTrigger: { trigger: m, start: 'top 86%', toggleActions: 'play none none reverse' } }));
    gsap.from('.sc-sub,.ws-sub,.lens-head p', { y: 30, opacity: 0, duration: .9, stagger: .1, scrollTrigger: { trigger: '.sc-sub', start: 'top 90%' } });
    $$('.co').forEach((c, i) => revealOnScroll(c, { y: 140, rotation: i ? 6 : -6, opacity: 0, duration: 1.1, ease: 'power3.out' }));
    gsap.from('.ws-stats div', { y: 40, opacity: 0, stagger: .08, duration: .7, scrollTrigger: { trigger: '.ws-stats', start: 'top 90%' } });
    ScrollTrigger.create({ trigger: '#photoStrip', start: 'top bottom', end: 'bottom top', onUpdate: (self) => { const s = $('#photoStrip'); if (!s.classList.contains('drag')) s.scrollLeft = self.progress * (s.scrollWidth - s.clientWidth); } });
    $$('.reel').forEach((r, i) => revealOnScroll(r, { y: 100, opacity: 0, rotation: (i - 1) * 6, duration: .9, ease: 'power3.out' }));

    /* ---------- 05 PLAYER TWO (39.6 – 49.6 s) ---------- */
    const hud = { alt: 0, spd: 0, hdg: 0 };
    pinScene('cockpit', '.cockpit-pin', 400, 10, (tl) => {
      tl.fromTo('.cockpit-frame', { rotateY: -9, rotateX: 4, scale: .94 }, { rotateY: 8, rotateX: 0, scale: 1.02, duration: 10 }, 0);
      cap(tl, $('#yearsWord'), .4, null, { dur: 2, y: 50 });
      cap(tl, '.gw2', 2.8, null, { dur: 1.6, y: 40 });
      tl.fromTo('.gw3', { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: .9, ease: 'power3.out' }, 5.2);
      tl.to(hud, { alt: 38000, spd: 480, hdg: 275, duration: 10, onUpdate: () => { $('#hudAlt').textContent = Math.round(hud.alt / 100) * 100; $('#hudSpd').textContent = Math.round(hud.spd); $('#hudHdg').textContent = String(Math.round(hud.hdg)).padStart(3, '0'); } }, 0);
    }, SEQ.cockpit);
    const yw = $('#yearsWord'); PKT.setReveal(yw, 0);
    PKT.popIn($('.sim-line .mix'), { scrollTrigger: { trigger: '.sim-line', start: 'top 80%', toggleActions: 'play none none reverse' } });
    gsap.from('.sim-node', { y: 60, opacity: 0, stagger: .15, duration: .8, ease: 'back.out(2)', scrollTrigger: { trigger: '#simTrack', start: 'top 82%' } });
    gsap.fromTo('.sim-plane', { left: '0%' }, { left: '100%', ease: 'none', scrollTrigger: { trigger: '#simLine', start: 'top 70%', end: 'bottom 40%', scrub: true } });
    PKT.popIn($('.ent-head .mix'), { scrollTrigger: { trigger: '.ent-head', start: 'top 84%', toggleActions: 'play none none reverse' } });
    gsap.from('.cpanel', { scale: .3, rotation: () => gsap.utils.random(-28, 28), opacity: 0, y: 80, stagger: .11, duration: .8, ease: 'back.out(2)', scrollTrigger: { trigger: '#panelsGrid', start: 'top 82%', toggleActions: 'play none none reverse' } });
    $$('.chan').forEach((c, i) => revealOnScroll(c, { x: i ? 160 : -160, opacity: 0, duration: 1, ease: 'power3.out' }));
    $$('.cpanel,.chan,.polaroid,.co').forEach((c) => tilt(c, 7));

    /* ---------- 06 MY PEOPLE ---------- */
    PKT.popIn($('.ppl-head .mix'), { scrollTrigger: { trigger: '.ppl-head', start: 'top 80%', toggleActions: 'play none none reverse' } });
    $$('.polaroid').forEach((p, i) => revealOnScroll(p, { y: 160, rotation: (i - 1) * 14, opacity: 0, duration: 1.1, ease: 'back.out(1.4)' }));
    const cn = { v: 0 };
    ScrollTrigger.create({ trigger: '.cat-intro', start: 'top 75%', once: true, onEnter: () => gsap.to(cn, { v: PKT.me.catCount, duration: 2.6, ease: 'power2.out', onUpdate: () => { $('#catNum').textContent = Math.round(cn.v); } }) });
    PKT.popIn($('.cat-says .mix'), { scrollTrigger: { trigger: '.cat-says', start: 'top 85%', toggleActions: 'play none none reverse' } });
    gsap.from('.cat-card', { y: 120, opacity: 0, stagger: .08, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: '#catRail', start: 'top 85%' } });
    PKT.popIn($('.stay > .mix'), { scrollTrigger: { trigger: '.stay', start: 'top 82%', toggleActions: 'play none none reverse' } });
    gsap.from('.stay-chips span', { y: 60, opacity: 0, scale: .8, stagger: .12, duration: .8, ease: 'back.out(2)', scrollTrigger: { trigger: '#stayChips', start: 'top 86%' } });
    PKT.popIn($('.thanks .mix'), { scrollTrigger: { trigger: '.thanks', start: 'top 80%', toggleActions: 'play none none reverse' } });
    gsap.from('.name-wall span', { opacity: 0, scale: .3, stagger: { each: .04, from: 'random' }, duration: .7, ease: 'back.out(2)', scrollTrigger: { trigger: '#nameWall', start: 'top 86%' } });

    /* ---------- 07 FINALE (53.4 – 59.6 s) ---------- */
    pinScene('home', '.finale-pin', 320, 6.2, (tl) => {
      cap(tl, $('#motto'), .4, null, { dur: 3.4, y: 30 });
      tl.fromTo('#cv-home', { scale: 1.05 }, { scale: 1, duration: 6 }, 0);
      tl.to('#finaleWall .win', { x: '-5vw', opacity: .95, duration: 6 }, 0);
    }, SEQ.home);
        PKT.popIn($('.contact .mix'), { scrollTrigger: { trigger: '.contact', start: 'top 78%', toggleActions: 'play none none reverse' } });
    gsap.from('.big-btn', { y: 80, opacity: 0, rotation: () => gsap.utils.random(-10, 10), stagger: .12, duration: .9, ease: 'back.out(1.8)', scrollTrigger: { trigger: '.contact-btns', start: 'top 90%' } });

    /* ---------- chapter detection ---------- */
    const label = $('#chapterLabel');
    SECTIONS.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => { if (self.isActive) setChapter(s); } }));
    ScrollTrigger.refresh();
    function setChapter(s) {
      if (document.body.dataset.chapter === s.id && s._on) return; SECTIONS.forEach((q) => { q._on = q === s; });
      document.body.dataset.chapter = s.id; label.textContent = s.dataset.n + ' · ' + s.dataset.name;
      $$('a', dots).forEach((a) => a.classList.toggle('on', a.dataset.id === s.id));
      const a1 = getComputedStyle(s).getPropertyValue('--a1').trim(); if (a1) document.documentElement.style.setProperty('--accent', a1);
      PKT.audio && PKT.audio.setChapter(s.id);
      if (s.id !== 'storm' && s.id !== 'hello') PKT.fx.setRain(0);
    }
    setChapter(SECTIONS[0]);
  }

  /* ============================================================
     6 · ENTER
     ============================================================ */
  let entered = false;
  function enter(sound) {
    if (entered) return; entered = true;
    scrollTo(0, 0); document.body.classList.remove('is-loading');
    loader.classList.add('out'); setTimeout(() => { loader.style.display = 'none'; }, 1500);
    if (sound) setSound(true);
    gsap.set('#hud,#dots', { autoAlpha: 0 });
    buildScenes();
    lenis.start(); lenis.scrollTo(0, { immediate: true });
    gsap.to('#hud,#dots', { autoAlpha: 1, duration: 1, delay: 1.1 });
    const nm = $('.hello-type .mix.huge'); PKT.popIn(nm, { delay: .7, duration: 1.1, stagger: { each: .07, from: 'start' } });
    gsap.from('.deva', { opacity: 0, y: 60, rotate: -14, duration: 1.1, delay: 1.4, ease: 'back.out(1.6)' });
    gsap.from('.hello-meta span', { opacity: 0, y: 20, duration: .8, delay: 1.8, stagger: .15 });
    setTimeout(() => { layoutRoute(); ScrollTrigger.refresh(); }, 600);
    window.addEventListener('load', () => ScrollTrigger.refresh());
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  let rzT; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (entered) { layoutRoute(); ScrollTrigger.refresh(); } }, 200); });

  /* ============================================================
     7 · SOUND + STORY MODE
     ============================================================ */
  const soundBtn = $('#soundBtn'), storyBtn = $('#storyBtn');
  function setSound(on) { soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); $('.txt', soundBtn).textContent = on ? 'Sound on' : 'Sound off'; PKT.audio && PKT.audio.enable(on); }
  soundBtn.addEventListener('click', () => setSound(soundBtn.getAttribute('aria-pressed') !== 'true'));

  const story = { on: false, i: 0, t: 0, seg: null };
  const ease = (u) => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  /* No narration any more: the tour is a timed glide, with the sound effects and chapter ambience doing the talking.
     Pinned scenes (lin) move at an even pace so every pose lands; the long pages between them ease in and out. */
  function segments() {
    const P = PKT.pins, E = document.documentElement.scrollHeight - innerHeight;
    return [
      { lin: 1, y0: P.hello.start, y1: P.hello.end, dur: 14 },
      { lin: 1, y0: P.storm.start, y1: P.storm.end, dur: 10 },
      { y0: P.storm.end, y1: P.anchor.start, dur: 9 },
      { lin: 1, y0: P.anchor.start, y1: P.anchor.end, dur: 7 },
      { lin: 1, y0: P.office.start, y1: P.office.end, dur: 14 },
      { y0: P.office.end, y1: P.desk.start, dur: 5 },
      { lin: 1, y0: P.desk.start, y1: P.desk.end, dur: 14 },
      { y0: P.desk.end, y1: P.cockpit.start, dur: 24 },
      { lin: 1, y0: P.cockpit.start, y1: P.cockpit.end, dur: 12 },
      { y0: P.cockpit.end, y1: P.home.start, dur: 22 },
      { lin: 1, y0: P.home.start, y1: P.home.end, dur: 9 },
      { y0: P.home.end, y1: E, dur: 7 },
    ];
  }
  function scrollNow(y) { lenis.scrollTo(y, { immediate: true, force: true }); }
  function startSeg(k) {
    story.i = k; const s = story.segs[k]; if (!s) return stopStory(true); story.seg = s; story.t = performance.now();
    if (k) PKT.audio && PKT.audio.whoosh && PKT.audio.whoosh();
  }
  function storyTick() {
    if (!story.on) return; const s = story.seg;
    const u = clamp((performance.now() - story.t) / (s.dur * 1000), 0, 1);
    scrollNow(s.y0 + (s.y1 - s.y0) * (s.lin ? u : ease(u)));
    if (u >= 1) return startSeg(story.i + 1), requestAnimationFrame(storyTick);
    requestAnimationFrame(storyTick);
  }
  function startStory() {
    if (!entered) return; if (story.on) return stopStory();
    story.on = true; story.segs = segments(); storyBtn.classList.add('playing'); $('.txt', storyBtn).textContent = 'Stop the tour'; $('.ico', storyBtn).textContent = '■';
    scrollNow(0); startSeg(0); requestAnimationFrame(storyTick);
  }
  function stopStory(done) {
    if (!story.on) return; story.on = false;
    storyBtn.classList.remove('playing'); $('.txt', storyBtn).textContent = done === true ? 'Play it again' : 'Play my story'; $('.ico', storyBtn).textContent = '▶';
  }
  storyBtn.addEventListener('click', startStory);
  ['wheel', 'touchstart'].forEach((ev) => addEventListener(ev, () => { if (story.on) stopStory(); }, { passive: true }));
  addEventListener('keydown', (e) => { if (story.on && ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].indexOf(e.key) >= 0) stopStory(); });

  /* pause the page's heavy work when the tab is hidden */
  document.addEventListener('visibilitychange', () => { if (document.hidden && story.on) stopStory(); });

  PKT.ready = { enter: enter, scenes: buildScenes, seq: SEQ };
})();
