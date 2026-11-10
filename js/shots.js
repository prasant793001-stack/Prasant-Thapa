/* ============================================================
   SHOTS - your stills, played like 3D motion graphics.

   POSES (the cut-outs of you) - ONE pose on stage at a time, never two.
     Scroll decides WHICH pose is current. The change itself is a timed animation
     (it does not depend on how fast you scroll, so it is always smooth):
        the old pose leaves  ->  a colour shape sweeps through  ->  the new pose arrives
     Leave/arrive pairs are real 3D: turntable flip, fly-through, tilting slide,
     card drop, stamp, iris, blinds. Between changes the pose floats and breathes in 3D,
     leans with the scroll speed and follows the mouse a little. Small shapes pop in
     around it on every arrival.
   PLATES (backgrounds with nobody in them) - cross-dissolve while you scroll.
   Same interface as the old frame sequences:  setProgress(p) - tick(dt) - load() - progress - visible
   ============================================================ */
(function () {
  const LITE = document.documentElement.classList.contains('lite');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const eo = (t) => 1 - Math.pow(1 - t, 3);                       /* ease out */
  const ei = (t) => t * t * t;                                    /* ease in  */
  const back = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  /* ---------- how a pose leaves (out) and arrives (in). u runs 0 -> 1, d = +1 going forward, -1 going back ---------- */
  function blinds(u) {                                           /* 8 vertical strips that rise / retract one after another */
    const N = 8, pts = ['0% 100%'];
    for (let i = 0; i < N; i++) { const h = clamp(u * 1.8 - (i % 2 ? i * .075 : (N - i) * .075), 0, 1), y = ((1 - eo(h)) * 100).toFixed(1); pts.push((i / N * 100).toFixed(1) + '% ' + y + '%', ((i + 1) / N * 100).toFixed(1) + '% ' + y + '%'); }
    pts.push('100% 100%'); return 'polygon(' + pts.join(',') + ')';
  }
  const FX = {
    pop:    { out: (u) => { const e = ei(u); return { y: -6 * e, s: 1 - .06 * e, o: 1 - clamp(u * 1.4, 0, 1) }; },
              in:  (u) => ({ y: (1 - eo(u)) * 9, s: .9 + .1 * back(u), o: clamp(u * 2.4, 0, 1) }) },
    flip:   { out: (u, d) => { const e = ei(u); return { ry: -90 * d * e, x: -7 * d * e, s: 1 - .07 * e, o: u > .9 ? 1 - (u - .9) * 10 : 1 }; },        /* turntable: swings edge-on and is gone */
              in:  (u, d) => ({ ry: (1 - back(u)) * 90 * d, x: (1 - eo(u)) * 7 * d, s: .93 + .07 * eo(u), o: clamp(u * 8, 0, 1) }) },
    fly:    { out: (u) => { const e = ei(u); return { s: 1 + 1.5 * e, y: -5 * e, b: 9 * e, o: 1 - clamp((u - .4) / .6, 0, 1) }; },                    /* rushes past the camera */
              in:  (u) => ({ s: .3 + .7 * back(u), y: (1 - eo(u)) * 10, b: 12 * (1 - u), o: clamp(u * 2.6, 0, 1) }) },
    tilt:   { out: (u, d) => { const e = ei(u); return { x: -66 * d * e, ry: 42 * d * e, rz: -6 * d * e, o: 1 - clamp((u - .55) / .45, 0, 1) }; },     /* slides off, turning as it goes */
              in:  (u, d) => { const e = 1 - eo(u); return { x: 66 * d * e, ry: -42 * d * e, rz: 6 * d * e, o: clamp(u * 3, 0, 1) }; } },
    drop:   { out: (u) => { const e = ei(u); return { rx: 80 * e, y: 4 * e, s: 1 - .1 * e, o: 1 - clamp((u - .6) / .4, 0, 1) }; },                    /* falls back like a card */
              in:  (u) => ({ rx: -(1 - back(u)) * 85, y: (1 - eo(u)) * -6, o: clamp(u * 5, 0, 1) }) },
    stamp:  { out: (u, d) => { const e = ei(u); return { s: 1 - .5 * e, rz: -14 * d * e, y: 7 * e, o: 1 - clamp((u - .4) / .6, 0, 1) }; },
              in:  (u, d) => ({ s: 1.75 - .75 * back(u), rz: 11 * d * (1 - eo(u)), br: 1 + .9 * (1 - u), o: clamp(u * 6, 0, 1) }) },
    iris:   { out: (u) => { const e = ei(u); return { clip: 'circle(' + ((1 - e) * 142).toFixed(1) + '% at 50% 42%)', s: 1 + .06 * e }; },
              in:  (u) => { const e = eo(u); return { clip: 'circle(' + (e * 142).toFixed(1) + '% at 50% 42%)', s: 1.07 - .07 * e }; } },
    blinds: { out: (u) => ({ clip: blinds(1 - u), s: 1 + .03 * u }),
              in:  (u) => ({ clip: blinds(u), s: 1.04 - .04 * u }) },
    fade:   { out: (u) => ({ o: 1 - u }), in: (u) => ({ o: u }) },                                  /* reduced motion */
  };
  const SFX = { pop: 'blip', flip: 'whoosh', fly: 'whoosh', tilt: 'whoosh', drop: 'blip', stamp: 'blip', iris: 'whoosh', blinds: 'whoosh', fade: null };
  /* leave/arrive style for pose i-1 -> i (and back again), per scene */
  const ORDER = {
    hello:  ['flip', 'tilt', 'fly', 'stamp', 'drop', 'flip', 'flip'],
    anchor: ['fly', 'tilt', 'iris'],
    office: ['tilt', 'flip', 'stamp'],
    desk:   ['flip', 'fly', 'tilt', 'drop', 'blinds', 'stamp', 'iris'],
    home:   ['flip', 'fly', 'tilt'],
  };
  const OUT = .38, IN = .62;            /* seconds: how long a pose takes to leave, and to arrive */

  /* flat colour shapes that sweep through the stage between poses, in each chapter's own colours */
  const STAR = 'polygon(50% 0,60% 28%,88% 12%,74% 40%,100% 50%,74% 60%,88% 88%,60% 72%,50% 100%,40% 72%,12% 88%,26% 60%,0 50%,26% 40%,12% 12%,40% 28%)';
  const SHAPES = [{ r: '50%' }, { c: STAR }, { r: '8%', rot: 45 }, { c: 'polygon(0 20%,100% 0,85% 100%,10% 85%)' }];
  const VARS = ['--a1', '--a2', '--a3', '--a4'];
  const DECO = ['ring', 'dot', 'plus', 'tri'];

  /* mouse -> a little parallax (fine pointers only) */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (window.matchMedia && matchMedia('(pointer:fine)').matches && !reduce) {
    addEventListener('pointermove', (e) => { ptr.tx = (e.clientX / innerWidth - .5) * 2; ptr.ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  }

  /* ---------- shared: the stack of images and how it loads ---------- */
  class Base {
    constructor(key, el, cfg) {
      this.key = key; this.el = el; this.cfg = cfg; this.n = cfg.n; this.kind = cfg.kind;
      this.poses = []; this.imgs = []; this.loaded = 0; this.started = false; this.ready = false;
      this.visible = false; this.time = 0; this.progress = null;
      const stack = document.createElement('div'); stack.className = 'stack'; el.appendChild(stack); this.stack = stack;
      PKT.seqs[key] = this;
    }
    addPoses() {
      for (let i = 0; i < this.n; i++) {
        const p = document.createElement('div'); p.className = 'pose'; p.style.zIndex = i + 1;
        const im = new Image(); im.alt = ''; im.decoding = 'async'; im.draggable = false; p.appendChild(im);
        p.style.display = 'none';
        this.stack.appendChild(p); this.poses.push(p); this.imgs.push(im);
      }
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
      this.promise = (async () => { await one(0); self.ready = true; self.first && self.first(); await Promise.all(self.imgs.map((_, i) => i ? one(i) : null)); })();
      return this.promise;
    }
  }

  /* ============================================================
     POSES - one at a time, 3D
     ============================================================ */
  class Poses extends Base {
    constructor(key, el, cfg) {
      super(key, el, cfg);
      this.order = ORDER[key] || ['flip', 'tilt', 'fly', 'stamp', 'drop'];
      this.burst = document.createElement('i'); this.burst.className = 'burst'; this.stack.appendChild(this.burst);
      this.decos = []; const nd = LITE ? 2 : 4;
      for (let k = 0; k < nd; k++) { const d = document.createElement('i'); d.className = 'deco'; this.stack.appendChild(d); this.decos.push(d); }
      this.addPoses();
      this.slot = 0; this.tgt = 0; this.cur = 0; this.st = 'idle'; this.t = 0; this.tt = 0; this.dir = 1; this.kindNow = 'pop';
      this.lp = 0; this.lps = 0; this.lean = 0; this.shown = -1; this.freeze = false; this.lastSfx = 0; this.seed = 1; this.decoOn = false;
    }
    first() { this.snap(); this.render(); }
    snap() { this.cur = this.tgt; this.st = 'idle'; this.t = 0; this.tt = 0; this.decoOn = true; this.scatter(); }

    /* scroll -> which pose should be on stage. A little hysteresis so hovering on a boundary never flickers. */
    setProgress(p) {
      const n = this.n, H = .12, raw = clamp(p, 0, 1) * n - 1e-4;
      let s = this.slot;
      if (raw >= s + 1 + H) s = Math.floor(raw - H); else if (raw < s - H) s = Math.ceil(raw + H) - 1;
      s = clamp(s, 0, n - 1);
      this.slot = s; this.tgt = s; this.lp = clamp(raw - s, 0, 1);
      if (!this.visible || !this.ready) { if (this.st === 'idle' || !this.visible) this.snap(); }
    }

    begin() {
      this.dir = this.tgt > this.cur ? 1 : -1;
      const k = Math.max(this.cur, this.tgt) - 1;
      this.kindNow = reduce ? 'fade' : this.order[k % this.order.length];
      this.st = 'out'; this.t = 0; this.tt = 0;
    }
    speed() { return this.st === 'in' && this.tgt !== this.cur ? 2.5 : (this.st === 'out' && Math.abs(this.tgt - this.cur) > 1 ? 1.5 : 1); }
    advance(dt) {
      if (this.st === 'idle' && this.tgt !== this.cur) this.begin();
      if (this.st === 'idle') return;
      const k = dt * this.speed(); this.t += k; this.tt += k;
      if (this.st === 'out' && this.t >= OUT) {                       /* the old pose is gone: bring in the newest target */
        this.cur = this.tgt; this.st = 'in'; this.t = 0; this.decoOn = true; this.scatter(); this.sfx();
      } else if (this.st === 'in' && this.t >= IN) { this.st = 'idle'; this.t = 0; }
    }
    sfx() {
      const now = performance.now();
      if (!this.visible || this.freeze || now - this.lastSfx < 350) return;
      this.lastSfx = now; const f = SFX[this.kindNow];
      if (f && window.PKT.audio && PKT.audio[f]) PKT.audio[f]();
    }

    /* small shapes that pop in around the pose on every arrival */
    scatter() {
      let s = (this.seed = (this.seed * 9301 + 49297 + this.cur * 7919) % 233280);
      const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      const w = this.stack.clientWidth || 600, sc = clamp(w / 640, .6, 1.4);
      const order = [0, 1, 2, 3].sort(() => rnd() - .5);
      this.decos.forEach((d, k) => {
        const left = k % 2 === 0, x = left ? 2 + rnd() * 16 : 82 + rnd() * 16, y = 10 + rnd() * 66;
        d.dataset.k = DECO[order[k]]; d.style.left = x.toFixed(1) + '%'; d.style.top = y.toFixed(1) + '%';
        d.style.setProperty('--s', ((16 + rnd() * 20) * sc).toFixed(0) + 'px'); d.style.setProperty('--c', 'var(' + VARS[(this.cur + k) % 4] + ',#fff)');
        d._r = rnd() * 80 - 40; d._ph = rnd() * 6; d._vr = (rnd() - .5) * 26;
      });
    }

    tick(dt) {
      if (!this.ready) return;
      this.time += dt;
      ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 4); ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 4);
      const v = (PKT.lenis && PKT.lenis.velocity) || 0;
      this.lean += (clamp(v * .1, -3.5, 3.5) - this.lean) * Math.min(1, dt * 6);
      this.lps += (this.lp - this.lps) * Math.min(1, dt * 5);
      if (!this.freeze) this.advance(dt);
      this.render();
    }

    render() {
      const n = this.n, st = this.st, kind = this.kindNow, d = this.dir;
      const uo = clamp(this.t / OUT, 0, 1), ui = clamp(this.t / IN, 0, 1);
      let L = {};
      if (st === 'out') L = FX[kind].out(uo, d); else if (st === 'in') L = FX[kind].in(ui, d);
      /* the idle life: breathe, float, drift in 3D, lean with the scroll, follow the mouse */
      const k = reduce ? 0 : (st === 'idle' ? 1 : st === 'in' ? .35 + .65 * ui : .35 * (1 - uo)), T = this.time;
      const idle = {
        x: (Math.sin(T * .7) * .25 + ptr.x * .9) * k, y: Math.sin(T * 1.1) * .3 * k,
        rx: (Math.sin(T * .7 + 1) * 1.1 - ptr.y * 2.4 - this.lean) * k, ry: (Math.sin(T * .55) * 2.4 + ptr.x * 5) * k, rz: Math.sin(T * .6) * .4 * k,
        s: (1 + Math.sin(T * 1.4) * .004) * (1 + .05 * this.lps),
      };
      const i = this.cur;
      if (this.shown !== i) { this.poses.forEach((p, j) => { const on = j === i && !p.dataset.missing; if ((p.style.display !== 'none') !== on) p.style.display = on ? '' : 'none'; }); this.shown = i; }
      const el = this.poses[i];
      const x = (L.x || 0) + idle.x, y = (L.y || 0) + idle.y, rx = (L.rx || 0) + idle.rx, ry = (L.ry || 0) + idle.ry, rz = (L.rz || 0) + idle.rz, sc = (L.s || 1) * idle.s;
      el.style.opacity = L.o == null ? 1 : clamp(L.o, 0, 1).toFixed(3);
      el.style.clipPath = L.clip || 'none';
      el.style.transform = 'translate3d(' + x.toFixed(2) + '%,' + y.toFixed(2) + '%,0) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
      el.style.filter = (!LITE && (L.b || (L.br && L.br !== 1))) ? 'blur(' + (L.b || 0).toFixed(1) + 'px) brightness(' + (L.br || 1).toFixed(2) + ')' : 'none';

      /* the colour shape that bridges the change: grows while the old pose leaves, peaks in the gap, fades as the new one lands */
      const b = this.burst.style;
      if (st === 'idle' || reduce) { if (b.opacity !== '0') b.opacity = 0; }
      else {
        const bu = clamp(this.tt / (OUT + IN * .85), 0, 1), idx = Math.max(this.cur, this.tgt), sh = SHAPES[idx % SHAPES.length];
        if (this.burst.dataset.i !== String(idx)) { this.burst.dataset.i = idx; b.background = 'var(' + VARS[idx % 4] + ',#fff)'; b.borderRadius = sh.r || '0'; b.clipPath = sh.c || 'none'; }
        b.opacity = (Math.sin(Math.PI * bu) * .86).toFixed(3);
        b.transform = 'translate(-50%,-50%) rotate(' + ((sh.rot || 0) + (bu - .5) * 50 * d).toFixed(1) + 'deg) scale(' + (.3 + 1.1 * eo(bu)).toFixed(3) + ')';
      }
      /* the small shapes: pop in with the new pose, shrink away as the next one leaves */
      this.decos.forEach((dc, j) => {
        let sc2 = 0;
        if (this.decoOn && !reduce) {
          if (st === 'out') sc2 = 1 - ei(clamp(uo * 1.5, 0, 1));
          else if (st === 'in') sc2 = back(clamp((ui - j * .1) / .7, 0, 1));
          else sc2 = 1;
        }
        const o = clamp(sc2 * 1.4, 0, 1);
        dc.style.opacity = o.toFixed(2);
        dc.style.transform = 'translate(-50%,calc(-50% + ' + (Math.sin(T * 1.2 + dc._ph) * 7).toFixed(1) + 'px)) rotate(' + ((dc._r || 0) + T * (dc._vr || 8)).toFixed(1) + 'deg) scale(' + Math.max(0, sc2).toFixed(3) + ')';
      });
    }

    /* for testing: freeze at an exact moment of a change */
    setFrame(kind, st, u, dir, idx) {
      this.freeze = true; this.kindNow = kind; this.st = st; this.dir = dir || 1; this.cur = idx || 0; this.tgt = this.cur;
      this.t = u * (st === 'out' ? OUT : IN); this.tt = st === 'out' ? this.t : OUT + this.t; this.decoOn = true; this.shown = -1; this.scatter(); this.render();
    }
  }

  /* ============================================================
     PLATES - backgrounds, cross-dissolve while you scroll
     ============================================================ */
  class Plates extends Base {
    constructor(key, el, cfg) {
      super(key, el, cfg);
      this.addPoses(); this.poses[0].style.display = '';
      this.target = 0; this.cur = 0; this.TW = Math.min(.075, .3 / Math.max(1, cfg.n));
    }
    first() { this.apply(true); }
    setProgress(p) { this.target = clamp(p, 0, 1); }
    start(i) { return i === 0 ? 0 : i / this.n; }
    tick(dt) {
      if (!this.ready) return; this.time += dt;
      const d = this.target - this.cur;
      if (Math.abs(d) > 0.0003) this.cur += d * Math.min(1, dt * 8); else this.cur = this.target;
      this.apply();
    }
    apply() {
      const p = this.cur, n = this.n, TW = this.TW;
      for (let i = 0; i < n; i++) {
        const el = this.poses[i], s0 = this.start(i), s1 = i + 1 < n ? this.start(i + 1) : 2;
        const u = i === 0 ? 1 : clamp((p - s0) / TW, 0, 1), covered = i + 1 < n && p >= s1 + TW;
        const hidden = (i && p < s0) || covered || el.dataset.missing;
        if (hidden) { if (el.style.display !== 'none') el.style.display = 'none'; continue; }
        if (el.style.display === 'none') el.style.display = '';
        const span = Math.max(.001, (i + 1 < n ? s1 : 1) - s0), lp = clamp((p - s0) / span, 0, 1), dir = i % 2 ? -1 : 1;
        const x = dir * (lp - .5) * 1.4, sc = 1 + .07 * lp;
        el.style.opacity = eo(u).toFixed(3);
        el.style.transform = 'translate3d(' + x.toFixed(2) + '%,0,0) scale(' + sc.toFixed(4) + ')';
      }
    }
  }

  PKT.Shots = Poses; PKT.Plates = Plates;

  /* one door for main.js: shots when the manifest has them, the old frame sequence when it doesn't */
  PKT.makeScene = function (key, canvas) {
    const cfg = PKT.shots && PKT.shots[key];
    if (!cfg || !cfg.n) return new PKT.Seq(key, canvas);
    const div = document.createElement('div');
    div.className = canvas.className + ' shots shots-' + cfg.kind; div.id = canvas.id; div.style.setProperty('--ar', cfg.ar);
    canvas.replaceWith(div);
    return cfg.kind === 'plate' ? new Plates(key, div, cfg) : new Poses(key, div, cfg);
  };
})();
