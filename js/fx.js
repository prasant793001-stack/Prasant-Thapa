/* ============================================================
   FX — rain, lightning, cursor
   ============================================================ */
(function () {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- RAIN + LIGHTNING ---------- */
  const cv = document.getElementById('rain'), flashEl = document.getElementById('flash');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, drops = [], splashes = [], bolts = [];
  let intensity = 0, running = false, lastT = 0, nextStrike = 0;
  const LITE = document.documentElement.classList.contains('lite');
  const small = innerWidth < 760;
  const MAXDROPS = LITE ? 130 : small ? 260 : 620;

  function resize() { dpr = Math.min(devicePixelRatio || 1, LITE ? 1 : 1.5); W = cv.width = Math.floor(innerWidth * dpr); H = cv.height = Math.floor(innerHeight * dpr); }
  addEventListener('resize', resize); resize();

  function mkDrop(initial) {
    return { x: Math.random() * (W + 300) - 150, y: initial ? Math.random() * H : -40 - Math.random() * 200, l: (14 + Math.random() * 26) * dpr, v: (900 + Math.random() * 700) * dpr, a: .25 + Math.random() * .5, w: (0.8 + Math.random() * 1.2) * dpr };
  }
  for (let i = 0; i < MAXDROPS; i++) drops.push(mkDrop(true));

  function bolt(x0) {
    const pts = [[x0, 0]]; let x = x0, y = 0; const target = H * (.45 + Math.random() * .35);
    const branches = [];
    while (y < target) { y += (18 + Math.random() * 38) * dpr; x += (Math.random() - .5) * 70 * dpr; pts.push([x, y]); if (Math.random() < .16) { let bx = x, by = y; const b = [[bx, by]]; const len = 3 + Math.floor(Math.random() * 5); const dir = Math.random() < .5 ? -1 : 1; for (let k = 0; k < len; k++) { bx += dir * (14 + Math.random() * 40) * dpr; by += (14 + Math.random() * 30) * dpr; b.push([bx, by]); } branches.push(b); } }
    return { main: pts, branches: branches, life: 1, born: performance.now() };
  }

  const FX = window.PKT.fx = {
    setRain(v) { intensity = Math.max(0, Math.min(1, v)); cv.style.opacity = intensity > .01 ? Math.min(1, intensity * 1.4) : 0; if (intensity > .01 && !running) { running = true; lastT = performance.now(); requestAnimationFrame(frame); } },
    strike(opts) {
      if (reduce) return; opts = opts || {};
      const x = (opts.x != null ? opts.x : (.15 + Math.random() * .7)) * W;
      bolts.push(bolt(x));
      if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(frame); }
      const p = flashEl; gsap.killTweensOf(p);
      gsap.timeline().set(p, { opacity: .85 }).to(p, { opacity: .1, duration: .06 }).to(p, { opacity: .7, duration: .04 }).to(p, { opacity: 0, duration: .9, ease: 'power2.out' });
      const dist = opts.dist != null ? opts.dist : Math.random();
      setTimeout(function () { PKT.audio && PKT.audio.thunder(.4 + (1 - dist) * .6); const w = document.getElementById('meghalayaWord'); if (w && document.body.dataset.chapter === 'storm') { w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); } }, 140 + dist * 900);
    },
  };

  function frame(now) {
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
    ctx.clearRect(0, 0, W, H);
    if (intensity > .01) {
      const n = Math.floor(MAXDROPS * Math.min(1, intensity));
      const wind = 160 * dpr * (.6 + intensity * .7);
      ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const d = drops[i];
        d.y += d.v * dt; d.x += wind * dt;
        if (d.y > H) { if (Math.random() < .18 && splashes.length < 80) splashes.push({ x: d.x, y: H - Math.random() * 30 * dpr, r: 1, a: .5 }); drops[i] = mkDrop(false); continue; }
        ctx.strokeStyle = 'rgba(205,232,255,' + (d.a * (.4 + intensity * .6)).toFixed(2) + ')'; ctx.lineWidth = d.w;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - wind * dt * 1.6, d.y - d.l); ctx.stroke();
      }
      for (let i = splashes.length - 1; i >= 0; i--) { const s = splashes[i]; s.r += 40 * dt * dpr; s.a -= 1.6 * dt; if (s.a <= 0) { splashes.splice(i, 1); continue; } ctx.strokeStyle = 'rgba(205,232,255,' + s.a.toFixed(2) + ')'; ctx.lineWidth = dpr; ctx.beginPath(); ctx.ellipse(s.x, s.y, s.r, s.r * .35, 0, 0, 6.3); ctx.stroke(); }
    }
    // lightning bolts
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i]; const age = (now - b.born) / 1000; b.life = Math.max(0, 1 - age / .55);
      if (b.life <= 0) { bolts.splice(i, 1); continue; }
      const flick = age < .12 ? 1 : (Math.sin(age * 60) > 0 ? 1 : .4);
      ctx.save(); ctx.shadowColor = '#9fdcff'; ctx.shadowBlur = 28 * dpr; ctx.strokeStyle = 'rgba(255,255,255,' + (b.life * flick).toFixed(2) + ')'; ctx.lineJoin = 'round';
      ctx.lineWidth = 3.2 * dpr; ctx.beginPath(); b.main.forEach(function (p, k) { k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
      ctx.lineWidth = 1.4 * dpr; b.branches.forEach(function (br) { ctx.beginPath(); br.forEach(function (p, k) { k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); });
      ctx.restore();
    }
    // automatic storm
    if (intensity > .45 && !reduce && now > nextStrike) { FX.strike(); nextStrike = now + 2800 + Math.random() * 4600; }
    if (intensity > .01 || bolts.length) requestAnimationFrame(frame); else { running = false; ctx.clearRect(0, 0, W, H); }
  }

  /* ---------- CURSOR ---------- */
  const cur = document.getElementById('cursor');
  if (cur && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.body.classList.add('has-cursor');
    const qx = gsap.quickTo(cur, 'x', { duration: .18, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: .18, ease: 'power3' });
    addEventListener('pointermove', function (e) { qx(e.clientX); qy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', function (e) { const t = e.target.closest && e.target.closest('a,button,[data-hot]'); cur.classList.toggle('hot', !!t); });
    document.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.cat-rail,.photo-strip,.stage-canvas')) cur.classList.add('drag'); });
    addEventListener('pointerup', function () { cur.classList.remove('drag'); });
  }
})();
