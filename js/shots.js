/* ============================================================
   SHOTS — still images played like motion graphics.
   Each scene is a stack of poses (you, cut out) or plates (full-frame
   backgrounds). Scroll progress picks the pose and plays a different
   transition between them (iris, bar wipe, stamp, slide, drop, rise),
   with a slow camera push, a gentle idle float and a sound effect per cut.
   Same interface as the old frame sequences, so main.js treats both alike:
   setProgress(p) · tick(dt) · load() · progress · visible
   ============================================================ */
(function () {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const eo = (t) => 1 - Math.pow(1 - t, 3);
  const back = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const bounce = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };

  /* a transition turns progress u (0→1) into a look: opacity, clip, offset %, scale, rotation, blur, brightness */
  const TR = {
    rise: (u) => ({ o: clamp(u * 1.6, 0, 1), y: (1 - eo(u)) * 10, s: .96 + .04 * eo(u) }),
    iris: (u) => ({ clip: 'circle(' + (eo(u) * 142).toFixed(1) + '% at 50% 42%)', s: 1.07 - .07 * eo(u) }),
    slice: (u) => {
      const N = 8, pts = ['0% 100%'];
      for (let i = 0; i < N; i++) { const h = clamp(u * 1.8 - (i % 2 ? i * .075 : (N - i) * .075) , 0, 1), y = ((1 - eo(h)) * 100).toFixed(1); pts.push((i / N * 100).toFixed(1) + '% ' + y + '%', ((i + 1) / N * 100).toFixed(1) + '% ' + y + '%'); }
      pts.push('100% 100%'); return { clip: 'polygon(' + pts.join(',') + ')' };
    },
    stamp: (u) => ({ o: clamp(u * 5, 0, 1), s: 1.5 - .5 * back(u), r: (1 - u) * -8, br: 1 + (1 - u) * .85 }),
    slide: (u) => ({ o: clamp(u * 3, 0, 1), x: (1 - eo(u)) * 62, r: (1 - eo(u)) * 7, b: (1 - u) * 7 }),
    drop: (u) => ({ o: clamp(u * 6, 0, 1), y: -(1 - bounce(u)) * 118 }),
    dissolve: (u) => ({ o: eo(u) }),
  };
  const SFX = { rise: 'blip', iris: 'whoosh', slice: 'whoosh', stamp: 'blip', slide: 'whoosh', drop: 'blip', dissolve: null };
  const ORDER = {
    hello: ['rise', 'iris', 'slice', 'stamp', 'slide', 'drop'],
    anchor: ['rise', 'slide', 'stamp', 'iris'],
    office: ['rise', 'slide', 'drop', 'stamp', 'iris'],
    desk: ['rise', 'slice', 'slide', 'iris', 'stamp'],
    home: ['rise', 'iris', 'stamp'],
    storm: ['dissolve'], cockpit: ['dissolve'],
  };
  /* a flat colour shape punches out behind each incoming pose, in the chapter's own accent colours */
  const STAR = 'polygon(50% 0,60% 28%,88% 12%,74% 40%,100% 50%,74% 60%,88% 88%,60% 72%,50% 100%,40% 72%,12% 88%,26% 60%,0 50%,26% 40%,12% 12%,40% 28%)';
  const SHAPES = [{ r: '50%' }, { c: STAR }, { r: '8%', rot: 45 }, { c: 'polygon(0 20%,100% 0,85% 100%,10% 85%)' }];
  const VARS = ['--a1', '--a2', '--a3', '--a4'];
  const TW = .075;                         /* how much of the scene's scroll one transition takes */

  class Shots {
    constructor(key, el, cfg) {
      this.key = key; this.el = el; this.cfg = cfg; this.n = cfg.n; this.kind = cfg.kind;
      this.order = ORDER[key] || ['rise', 'iris', 'slice', 'stamp', 'slide'];
      this.poses = []; this.imgs = []; this.loaded = 0; this.started = false; this.ready = false;
      this.visible = false; this.target = 0; this.cur = 0; this.t = 0; this.idx = 0; this.lastSfx = 0;
      this.progress = null;
      const stack = document.createElement('div'); stack.className = 'stack'; el.appendChild(stack);
      if (this.kind !== 'plate') { this.burst = document.createElement('i'); this.burst.className = 'burst'; stack.appendChild(this.burst); }
      for (let i = 0; i < this.n; i++) {
        const p = document.createElement('div'); p.className = 'pose'; p.style.zIndex = i + 1;
        const im = new Image(); im.alt = ''; im.decoding = 'async'; im.draggable = false; p.appendChild(im);
        if (i) p.style.display = 'none';
        stack.appendChild(p); this.poses.push(p); this.imgs.push(im);
      }
      PKT.seqs[key] = this;
    }
    res() {
      const big = !(innerWidth < 820) && (window.devicePixelRatio || 1) * innerHeight >= 1000;
      return this.cfg.hi && big ? 'hi' : 'lo';
    }
    url(i) { return this.cfg.base + '/' + this.res() + '/' + String(i + 1).padStart(2, '0') + '.' + this.cfg.ext; }
    load() {
      if (this.started) return this.promise; this.started = true; const self = this;
      const one = (i) => new Promise((res) => {
        const im = self.imgs[i]; im.onload = () => { self.loaded++; self.progress && self.progress(self.loaded / self.n); res(); };
        im.onerror = () => { self.poses[i].dataset.missing = 1; self.loaded++; self.progress && self.progress(self.loaded / self.n); res(); };
        im.src = self.url(i);
      });
      this.promise = (async () => { await one(0); self.ready = true; self.apply(true); await Promise.all(self.imgs.map((_, i) => i ? one(i) : null)); })();
      return this.promise;
    }
    setProgress(p) { this.target = clamp(p, 0, 1); }
    start(i) { return i === 0 ? 0 : i / this.n; }            /* where pose i begins to enter */
    tick(dt) {
      if (!this.ready) return; this.t += dt;
      const d = this.target - this.cur;
      if (Math.abs(d) > 0.0003) this.cur += d * Math.min(1, dt * 8); else this.cur = this.target;
      this.apply();
    }
    apply(force) {
      const p = this.cur, n = this.n, plate = this.kind === 'plate', idle = reduce ? 0 : 1;
      let top = 0;
      for (let i = 0; i < n; i++) {
        const el = this.poses[i], s0 = this.start(i), s1 = i + 1 < n ? this.start(i + 1) : 2;
        const u = i === 0 ? 1 : clamp((p - s0) / TW, 0, 1);
        const covered = i + 1 < n && p >= s1 + TW;
        const hidden = (i && p < s0) || covered || el.dataset.missing;
        if (hidden) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
        if (el.style.display === 'none') el.style.display = '';
        top = i;
        const kind = this.order[i % this.order.length], L = TR[kind](i === 0 ? 1 : u);
        const span = Math.max(.001, (i + 1 < n ? s1 : 1) - s0), lp = clamp((p - s0) / span, 0, 1);   /* local progress through this pose */
        const camS = plate ? 1.0 + .07 * lp : 1 + .045 * lp, dir = i % 2 ? -1 : 1;
        const ix = Math.sin(this.t * .8 + i) * .22 * idle, iy = Math.sin(this.t * 1.1 + i * 2) * .3 * idle, ir = Math.sin(this.t * .6 + i) * .3 * idle;
        const x = (L.x || 0) + ix + dir * (lp - .5) * 1.4, y = (L.y || 0) + iy, r = (L.r || 0) + ir, sc = (L.s || 1) * camS;
        el.style.opacity = L.o == null ? 1 : L.o.toFixed(3);
        el.style.clipPath = L.clip || 'none';
        el.style.transform = 'translate3d(' + x.toFixed(2) + '%,' + y.toFixed(2) + '%,0) rotate(' + r.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
        el.style.filter = (L.b || (L.br && L.br !== 1)) ? 'blur(' + (L.b || 0).toFixed(1) + 'px) brightness(' + (L.br || 1).toFixed(2) + ')' : 'none';
      }
      if (this.burst) {
        let bu = 0, bi = 0;
        for (let i = 1; i < n; i++) { const q = (p - this.start(i)) / TW; if (q > 0 && q < 1) { bu = q; bi = i; break; } }
        const b = this.burst.style;
        if (bu <= 0) { if (b.opacity !== '0') b.opacity = 0; }
        else {
          const sh = SHAPES[bi % SHAPES.length];
          if (this.burst.dataset.i !== String(bi)) { this.burst.dataset.i = bi; b.background = 'var(' + VARS[bi % 4] + ',#fff)'; b.borderRadius = sh.r || '0'; b.clipPath = sh.c || 'none'; }
          b.opacity = (Math.sin(Math.PI * bu) * .92).toFixed(3);
          b.transform = 'translate(-50%,-50%) rotate(' + ((sh.rot || 0) + (bu - .5) * 40).toFixed(1) + 'deg) scale(' + (.35 + 1.25 * eo(bu)).toFixed(3) + ')';
        }
      }
      if (top !== this.idx) {      /* a new pose took the stage: play its sound once, only when moving forward on screen */
        const fwd = top > this.idx; this.idx = top;
        const now = performance.now();
        if (fwd && this.visible && !force && now - this.lastSfx > 450) {
          this.lastSfx = now; const sfx = SFX[this.order[top % this.order.length]];
          if (sfx && window.PKT.audio && PKT.audio[sfx]) PKT.audio[sfx]();
        }
      }
    }
  }
  PKT.Shots = Shots;

  /* one door for main.js: shots when the manifest has them, the old frame sequence when it doesn't */
  PKT.makeScene = function (key, canvas) {
    const cfg = PKT.shots && PKT.shots[key];
    if (!cfg || !cfg.n) return new PKT.Seq(key, canvas);
    const div = document.createElement('div');
    div.className = canvas.className + ' shots shots-' + cfg.kind; div.id = canvas.id; div.style.setProperty('--ar', cfg.ar);
    canvas.replaceWith(div);
    return new Shots(key, div, cfg);
  };
})();
