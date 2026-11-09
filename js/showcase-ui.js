/* ============================================================
   SHOWCASE UI — dock, detail panel (poster + live view), portal,
   and the Workspace ledger. Talks to the 3D stage (showcase3d.js).
   ============================================================ */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const C = PKT.creations, n = C.length;

  /* ---------- colour helpers ---------- */
  function rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function lum(h) { const v = rgb(h).map(function (x) { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; }
  function contrast(a, b) { const A = lum(a), B = lum(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); }
  function readable(bg) { return lum(bg) > .38 ? '#111111' : '#ffffff'; }
  function accentOf(s) { const bg = s.pal[0], c = [s.pal[3], s.pal[2], s.pal[1]]; for (let i = 0; i < c.length; i++) if (contrast(c[i], bg) >= 3) return c[i]; return c.slice().sort(function (a, b) { return contrast(b, bg) - contrast(a, bg); })[0]; }

  /* ---------- dates ---------- */
  const D = function (s) { return new Date(s + 'T00:00:00Z'); };
  const fmt = function (s) { return D(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); };
  const fmtS = function (s) { return D(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); };
  const days = function (s) { return Math.round((D(s.completed) - D(s.started)) / 864e5) + 1; };

  C.forEach(function (s) { s._ac = accentOf(s); s._days = days(s); });

  const iconSVG = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (PKT.icons[k] || PKT.icons.index) + '</svg>'; };
  const esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- poster (CSS-built, drawn from the site's own palette) ---------- */
  function posterHTML(s) {
    const darkest = s.pal.slice(0, 3).sort(function (a, b) { return lum(a) - lum(b); })[0];
    const bar = lum(s.ink) > .5 ? darkest : s.ink;
    const v = '--p-sky:' + s.pal[0] + ';--p-g1:' + s.pal[1] + ';--p-g2:' + s.pal[2] + ';--p-ac:' + s._ac + ';--p-ink:' + bar + ';--p-bg2:' + readable(s._ac) + ';--p-nameink:' + readable(s.pal[1]);
    return '<div class="poster" style="' + v + '"><i class="p-sun"></i><i class="p-hill"></i><i class="p-hill b"></i>' +
      '<div class="p-win"><div class="bar"><i></i><i></i><i></i></div><div class="hero"></div><div class="cards"><i></i><i></i><i></i></div></div>' +
      '<div class="p-ico">' + iconSVG(s.logo) + '</div><div class="p-tag">' + esc(s.group) + ' · ' + esc(s.cat) + '</div><div class="p-name">' + esc(s.name) + '</div></div>';
  }

  /* ---------- dock ---------- */
  const stage = $('#stage'), dock = $('#dock'), panel = $('#panel');
  C.forEach(function (s, i) {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; b.dataset.name = s.name; b.setAttribute('aria-label', s.name);
    b.style.background = s._ac; b.style.color = readable(s._ac); b.innerHTML = iconSVG(s.logo);
    b.addEventListener('click', function () { choose(i); });
    dock.appendChild(b);
  });
  const dockBtns = $$('button', dock);
  function markDock(i) { dockBtns.forEach(function (b, k) { b.classList.toggle('on', k === i); }); const b = dockBtns[i]; if (b && dock.scrollWidth > dock.clientWidth) dock.scrollTo({ left: b.offsetLeft - dock.clientWidth / 2 + 23, behavior: 'smooth' }); }

  /* ---------- title under the stage ---------- */
  const wt = $('#worldTitle'), wtN = $('#wtN'), wtName = $('#wtName'), wtSub = $('#wtSub');
  let focusI = 0;
  function setTitle(i) {
    const s = C[i]; focusI = i; markDock(i);
    stage.style.setProperty('--st-ink', s.ink); document.documentElement.style.setProperty('--st-hud', s.ink);
    wtN.textContent = String(i + 1).padStart(2, '0') + ' / ' + n; wtName.textContent = s.name; wtSub.textContent = s.one;
    if (window.gsap) gsap.fromTo(wtName, { y: 26, opacity: 0, rotate: -7 }, { y: 0, opacity: 1, rotate: -2, duration: .6, ease: 'back.out(2)', overwrite: true });
    if (PKT.audio && PKT.audio.tick && stage._seen) PKT.audio.tick();
  }

  /* ---------- engine: 3D if we can, plain cards if we can't ---------- */
  let engine = null, queued = null, cur = -1, openT = 0;
  const handlers = {
    container: $('#stageCanvas'), worlds: C,
    onFocus: setTitle,
    onSelect: function (i, side) { showPanel(i, side); },
    onDeselect: function () { hidePanel(); },
    onHover: function () { },
  };
  function fallbackEngine(host) {
    host.innerHTML = '<div class="fb-grid"></div>'; const grid = $('.fb-grid', host); let idx = 0, sel = -1;
    C.forEach(function (s, i) { const d = document.createElement('button'); d.type = 'button'; d.className = 'fb-card'; d.innerHTML = posterHTML(s) + '<span>' + esc(s.name) + '</span>'; d.addEventListener('click', function () { api.select(i); }); grid.appendChild(d); });
    const api = {
      get index() { return idx; }, get selected() { return sel; }, count: n, ready: true,
      sideFor: function (i) { return host.clientWidth < 820 ? 'b' : (i % 2 === 0 ? 'r' : 'l'); },
      focus: function (i) { idx = Math.max(0, Math.min(n - 1, i)); handlers.onFocus(idx); const c = grid.children[idx]; c && c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); },
      next: function () { if (sel < 0) api.focus(idx + 1); }, prev: function () { if (sel < 0) api.focus(idx - 1); },
      select: function (i) { sel = i; idx = i; handlers.onFocus(i); handlers.onSelect(i, api.sideFor(i)); },
      deselect: function () { if (sel < 0) return; const w = sel; sel = -1; handlers.onDeselect(w); }, resize: function () { },
    };
    handlers.onFocus(0); return api;
  }
  function boot() {
    if (engine) return;
    try { if (window.Showcase3D && Showcase3D.supported) engine = Showcase3D.create(handlers); } catch (e) { console.warn('3D stage unavailable', e); engine = null; }
    if (!engine) { stage.classList.add('no-3d'); engine = fallbackEngine(handlers.container); }
    stage._seen = true; PKT.showcase.engine = engine;
    if (queued != null) { const q = queued; queued = null; setTimeout(function () { engine.select(q); }, 500); }
  }
  new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting) { boot(); ob.disconnect(); } }, { rootMargin: '120% 0px 120% 0px' }).observe(stage);

  function choose(i) { if (!engine) { queued = i; boot(); return; } if (cur === i && engine.selected === i) return; engine.select(i); }

  /* ---------- panel ---------- */
  const pInfo = $('#panelInfo'), tabPoster = $('#tabPoster'), liveFrame = $('#liveFrame'), exploreBtn = $('#exploreBtn'), newTab = $('#newTabBtn');
  let liveFor = -1, tabNow = 'poster';
  function fillPanel(i, side) {
    const s = C[i]; cur = i;
    panel.style.setProperty('--pk-bg', s.pal[0]); panel.style.setProperty('--pk-ink', s.ink); panel.style.setProperty('--pk-ac', s._ac);
    panel.classList.remove('side-l', 'side-r'); panel.classList.add(side === 'l' ? 'side-l' : 'side-r');
    tabPoster.innerHTML = posterHTML(s);
    pInfo.innerHTML = '<div class="chips"><span>' + esc(s.group) + '</span><span>' + esc(s.cat) + '</span><span>' + esc(s.font) + '</span></div>' +
      '<h3>' + esc(s.name) + '</h3><p class="one">' + esc(s.one) + '</p><p class="long">' + esc(s.long) + '</p>' +
      '<div class="dates"><div>Started<b>' + fmt(s.started) + '</b></div><div>Last shipped<b>' + fmt(s.completed) + '</b></div><div>Time on it<b>' + s._days + (s._days === 1 ? ' day' : ' days') + '</b></div></div>' +
      '<div class="pal-row">' + s.pal.map(function (c) { return '<i style="background:' + c + '" title="' + c + '"></i>'; }).join('') + '</div>';
    newTab.href = s.url; liveFor = -1; liveFrame.innerHTML = '';
    setTab(tabNow === 'live' ? 'live' : 'poster'); panel.setAttribute('aria-hidden', 'false'); panel.querySelector('.panel-body').scrollTop = 0;
  }
  function showPanel(i, side) {
    stage.classList.add('is-open'); markDock(i); wtName.textContent = C[i].name;
    const wasOpen = panel.classList.contains('show'); clearTimeout(openT);
    if (wasOpen) { panel.classList.remove('show'); openT = setTimeout(function () { fillPanel(i, side); void panel.offsetWidth; panel.classList.add('show'); }, 420); }
    else { fillPanel(i, side); void panel.offsetWidth; requestAnimationFrame(function () { panel.classList.add('show'); }); }
    if (PKT.audio && PKT.audio.blip) PKT.audio.blip();
  }
  function hidePanel() { clearTimeout(openT); panel.classList.remove('show'); panel.setAttribute('aria-hidden', 'true'); stage.classList.remove('is-open'); cur = -1; setTimeout(function () { if (!panel.classList.contains('show')) liveFrame.innerHTML = ''; liveFor = -1; }, 900); }
  function setTab(t) {
    tabNow = t; $$('.panel-tabs button', panel).forEach(function (b) { b.classList.toggle('on', b.dataset.tab === t); });
    tabPoster.classList.toggle('on', t === 'poster'); $('#tabLive').classList.toggle('on', t === 'live');
    if (t === 'live' && cur >= 0 && liveFor !== cur) {
      liveFor = cur; liveFrame.innerHTML = ''; const f = document.createElement('iframe'); f.src = C[cur].url; f.title = C[cur].name + ' (live)'; f.loading = 'lazy'; f.setAttribute('referrerpolicy', 'no-referrer');
      const w = liveFrame.clientWidth || 440; f.style.transform = 'scale(' + (w / 1280) + ')'; f.style.height = Math.ceil(liveFrame.clientHeight / (w / 1280)) + 'px'; liveFrame.appendChild(f);
    }
  }
  $$('.panel-tabs button', panel).forEach(function (b) { b.addEventListener('click', function () { setTab(b.dataset.tab); }); });
  $('#panelX').addEventListener('click', function () { engine && engine.deselect(); });
  $('#scPrev').addEventListener('click', function () { engine && engine.prev(); });
  $('#scNext').addEventListener('click', function () { engine && engine.next(); });

  /* ---------- portal: step inside the site ---------- */
  const portal = $('#portal'), pFrame = $('#portalFrame');
  function openPortal(i, x, y) {
    const s = C[i]; portal.style.setProperty('--px', x + 'px'); portal.style.setProperty('--py', y + 'px'); portal.style.setProperty('--pk-ac', s._ac);
    $('#portalName').textContent = s.name + ' — ' + s.one; $('#portalOpen').href = s.url;
    const f = document.createElement('iframe'); f.src = s.url; f.title = s.name; f.setAttribute('allow', 'fullscreen; autoplay; clipboard-write'); pFrame.innerHTML = ''; pFrame.appendChild(f);
    portal.classList.add('open'); portal.setAttribute('aria-hidden', 'false'); PKT.lenis && PKT.lenis.stop(); PKT.audio && PKT.audio.whoosh && PKT.audio.whoosh();
  }
  function closePortal() { portal.classList.remove('open'); portal.setAttribute('aria-hidden', 'true'); PKT.lenis && PKT.lenis.start(); setTimeout(function () { if (!portal.classList.contains('open')) pFrame.innerHTML = ''; }, 1100); }
  exploreBtn.addEventListener('click', function () { if (cur < 0) return; const r = exploreBtn.getBoundingClientRect(); openPortal(cur, r.left + r.width / 2, r.top + r.height / 2); });
  $('#portalBack').addEventListener('click', closePortal);

  /* ---------- keys ---------- */
  let stageIn = false; new IntersectionObserver(function (es) { stageIn = es[0].isIntersecting; document.body.classList.toggle('in-stage', es[0].intersectionRatio > .55); }, { threshold: [.35, .56] }).observe(stage);
  addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (portal.classList.contains('open')) closePortal(); else if (engine && engine.selected >= 0) engine.deselect(); return; }
    if (!stageIn || portal.classList.contains('open') || !engine) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); engine.next(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); engine.prev(); }
    else if (e.key === 'Enter' && engine.selected < 0 && document.activeElement === document.body) { engine.select(engine.index); }
  });

  /* ============================================================
     WORKSPACE LEDGER
     ============================================================ */
  const MIN = D('2026-07-01').getTime(), MAX = D('2026-11-01').getTime(), SPAN = MAX - MIN;
  const wsRows = $('#wsRows'), wsAxis = $('#wsAxis'), wsFilters = $('#wsFilters'), wsStats = $('#wsStats');

  wsAxis.innerHTML = '<div></div><div class="months" style="grid-template-columns:31fr 31fr 30fr 31fr"><span>July</span><span>August</span><span>September</span><span>October</span></div><div>What it does</div>';

  const first = C.map(function (s) { return s.started; }).sort()[0], lastShip = C.map(function (s) { return s.completed; }).sort().slice(-1)[0];
  const groups = ['Aakriti', 'U-Design', 'Prasant'];
  wsStats.innerHTML = '<div><b>' + n + '</b>creations</div><div><b>2</b>companies</div><div><b>' + groups.length + '</b>accounts</div><div><b>' + Math.round((D(lastShip) - D(first)) / 864e5) + '</b>days, first to latest</div><div><b>' + fmtS(first) + '</b>first commit, 2026</div>';

  C.forEach(function (s, i) {
    const a = (D(s.started).getTime() - MIN) / SPAN * 100, w = Math.max(1.2, (D(s.completed).getTime() - D(s.started).getTime() + 864e5) / SPAN * 100);
    const r = document.createElement('button'); r.type = 'button'; r.className = 'ws-row'; r.dataset.g = s.group; r.dataset.i = i;
    r.style.setProperty('--c', s._ac); r.style.setProperty('--bg1', s._ac); r.style.setProperty('--fg1', readable(s._ac));
    r.innerHTML = '<span class="id"><span class="logo-tile">' + iconSVG(s.logo) + '</span><span><span class="nm">' + esc(s.name) + '</span><span class="gp">' + esc(s.group) + ' · ' + esc(s.cat) + '</span></span></span>' +
      '<span class="bar"><i style="left:' + a.toFixed(2) + '%;width:' + w.toFixed(2) + '%"></i><span>' + s._days + (s._days === 1 ? ' day' : ' days') + '</span></span>' +
      '<span><span class="one">' + esc(s.one) + '</span><span class="dt">' + (s.started === s.completed ? 'Built ' + fmt(s.started) : fmtS(s.started) + ' → ' + fmt(s.completed)) + '</span></span>';
    r.addEventListener('click', function () {
      const target = $('#showcase');
      const go = function () { choose(i); };
      if (PKT.scrollTo) PKT.scrollTo(target, { offset: 0, duration: 1.6, onComplete: go }); else { target.scrollIntoView({ behavior: 'smooth' }); setTimeout(go, 900); }
    });
    wsRows.appendChild(r);
  });
  const rowEls = $$('.ws-row', wsRows);
  const ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { const el = e.target, k = rowEls.indexOf(el); setTimeout(function () { el.classList.add('in'); }, (k % 8) * 70); } else { e.target.classList.remove('in'); } }); }, { threshold: .3 });
  rowEls.forEach(function (r) { ro.observe(r); });

  ['All'].concat(groups).forEach(function (g, k) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = g + ' ' + (g === 'All' ? n : C.filter(function (s) { return s.group === g; }).length); if (!k) b.classList.add('on');
    b.addEventListener('click', function () {
      $$('button', wsFilters).forEach(function (x) { x.classList.toggle('on', x === b); });
      rowEls.forEach(function (r) { const show = g === 'All' || r.dataset.g === g; r.hidden = !show; r.classList.remove('in'); if (show) requestAnimationFrame(function () { requestAnimationFrame(function () { r.classList.add('in'); }); }); });
      window.ScrollTrigger && ScrollTrigger.refresh();
    });
    wsFilters.appendChild(b);
  });

  /* ---------- public bits ---------- */
  PKT.showcase = { select: choose, posterHTML: posterHTML, engine: null, openPortal: openPortal };
  setTitle(0);
})();
