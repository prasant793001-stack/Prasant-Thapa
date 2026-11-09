/* ============================================================
   FRAME SEQUENCES — the video, cut into pieces, drawn to a canvas
   and scrubbed by scroll. Cut-outs carry alpha (background removed).
   ============================================================ */
(function () {
  PKT.seqs = {};
  const DPR_CAP = 1;

  class Seq {
    constructor(key, canvas) {
      this.key = key; this.cv = canvas; this.ctx = canvas.getContext('2d');
      const m = PKT.seqMeta[key]; this.m = m; this.n = m.count;
      this.dir = PKT.seq[key].dir; this.ext = m.ext;
      canvas.width = m.w; canvas.height = m.h;
      canvas.style.aspectRatio = m.w + ' / ' + m.h;
      this.imgs = new Array(this.n); this.loaded = 0; this.started = false;
      this.cur = 0; this.target = 0; this.lastDrawn = -1;
      this.active = true; this.onready = null; this.ready = false;
      PKT.seqs[key] = this;
    }
    url(i) { return this.dir + '/f_' + String(i).padStart(3, '0') + '.' + this.ext; }
    load(priority) {
      if (this.started) return this.promise; this.started = true;
      const self = this; const first = Math.min(this.n, priority || 12);
      const loadOne = function (i) {
        return new Promise(function (res) {
          const im = new Image(); im.decoding = 'async';
          im.onload = function () { self.imgs[i] = im; self.loaded++; self.progress && self.progress(self.loaded / self.n); res(); };
          im.onerror = function () { res(); };
          im.src = self.url(i);
        });
      };
      this.promise = (async function () {
        const head = []; for (let i = 0; i < first; i++) head.push(loadOne(i));
        await Promise.all(head); self.ready = true; self.draw(true); self.onready && self.onready();
        // the rest, in small batches so we never starve the page
        const rest = []; for (let i = first; i < self.n; i++) rest.push(i);
        const worker = async function () { while (rest.length) { await loadOne(rest.shift()); } };
        await Promise.all([worker(), worker(), worker()]);
        self.all = true;
      })();
      return this.promise;
    }
    setProgress(p) { this.target = Math.max(0, Math.min(1, p)) * (this.n - 1); }
    nearest(i) {
      if (this.imgs[i]) return this.imgs[i];
      for (let d = 1; d < 12; d++) { if (this.imgs[i - d]) return this.imgs[i - d]; if (this.imgs[i + d]) return this.imgs[i + d]; }
      return null;
    }
    tick(dt) {
      if (!this.ready) return;
      const d = this.target - this.cur;
      if (Math.abs(d) > 0.002) this.cur += d * Math.min(1, dt * 9); else this.cur = this.target;
      this.draw();
    }
    draw(force) {
      const key = Math.round(this.cur * 20);
      if (!force && key === this.lastDrawn) return; this.lastDrawn = key;
      const i0 = Math.floor(this.cur), f = this.cur - i0, i1 = Math.min(this.n - 1, i0 + 1);
      const a = this.nearest(i0), b = this.nearest(i1), c = this.ctx;
      c.globalAlpha = 1; c.clearRect(0, 0, this.cv.width, this.cv.height);
      if (a) c.drawImage(a, 0, 0);
      if (b && f > 0.03 && b !== a) { c.globalAlpha = f; c.drawImage(b, 0, 0); c.globalAlpha = 1; }
    }
  }
  PKT.Seq = Seq;

  /* one shared loop that only touches sequences that are on screen */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const k in PKT.seqs) { const s = PKT.seqs[k]; if (s.visible !== false) s.tick(dt); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* visibility so off-screen canvases cost nothing */
  PKT.watchSeq = function (seq, trigger) {
    seq.visible = false;
    new IntersectionObserver(function (es) { es.forEach(function (e) { seq.visible = e.isIntersecting; if (e.isIntersecting) seq.load(); }); }, { rootMargin: '120% 0px 120% 0px' }).observe(trigger);
  };
})();
