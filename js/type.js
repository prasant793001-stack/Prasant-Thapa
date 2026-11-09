/* ============================================================
   MIXED TYPE — every word (or letter) gets its own font, size,
   colour, tilt. Seeded, so a sentence always looks the same.
   ============================================================ */
(function () {
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  PKT.rng = rng; PKT.hash = hash;

  PKT.mixType = function (el) {
    if (el.dataset.done) return el;
    const text = (el.dataset.text || el.textContent).trim().replace(/\s+/g, ' ');
    const mode = el.dataset.mix || 'word';
    const r = rng(hash(text));
    const sz = (el.dataset.sizes || '0.75,1.8').split(',').map(Number);
    const nf = +(el.dataset.fonts || 4);
    const cols = (el.dataset.colors || 'a1,a2,a3,ink').split(',');
    const rot = +(el.dataset.rot || 5);
    el.setAttribute('aria-label', text);
    el.dataset.done = '1';
    el.textContent = '';
    const words = text.split(' ');
    let idx = 0, lastF = 0, lastC = '';
    words.forEach(function (word, wi) {
      const w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      const parts = mode === 'char' ? Array.from(word) : [word];
      parts.forEach(function (p) {
        const s = document.createElement('span'); s.className = 'c'; s.textContent = p;
        const size = sz[0] + r() * (sz[1] - sz[0]);
        let f = 1 + Math.floor(r() * nf); if (f === lastF && nf > 1) f = (f % nf) + 1; lastF = f;
        let col = cols[Math.floor(r() * cols.length)]; if (col === lastC && cols.length > 1) col = cols[(cols.indexOf(col) + 1) % cols.length]; lastC = col;
        s.style.fontFamily = 'var(--f' + f + ')';
        s.style.fontSize = size.toFixed(2) + 'em';
        s.style.color = col === 'ink' ? 'var(--ink)' : 'var(--' + col + ')';
        s.style.setProperty('--r', ((r() - .5) * 2 * rot).toFixed(1) + 'deg');
        s.style.setProperty('--y', ((r() - .5) * .22).toFixed(2) + 'em');
        s.style.setProperty('--i', idx++);
        w.appendChild(s);
      });
      el.appendChild(w);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    if (el.classList.contains('breathe') === false && mode === 'char') el.classList.add('breathe');
    return el;
  };

  /* pop-in animation for a mixed element */
  PKT.popIn = function (el, vars) {
    const cs = el.querySelectorAll('.c'); if (!cs.length) return gsap.from(el, { opacity: 0, y: 40, duration: .8 });
    return gsap.from(cs, Object.assign({ opacity: 0, scale: .2, yPercent: 90, rotation: function () { return gsap.utils.random(-30, 30); }, duration: .8, ease: 'back.out(2)', stagger: { each: .03, from: 'random' } }, vars || {}));
  };

  /* handwritten "draw the words on" feel: scrub-friendly progress reveal */
  PKT.setReveal = function (el, p) {
    const cs = el._cs || (el._cs = el.querySelectorAll('.c')); const n = cs.length;
    for (let i = 0; i < n; i++) {
      const t = Math.min(1, Math.max(0, p * (n + 6) - i) / 6);
      const e = 1 - Math.pow(1 - t, 3);
      const c = cs[i]; c.style.opacity = e.toFixed(3); c.style.scale = (0.3 + 0.7 * e).toFixed(3); c.style.translate = '0 ' + ((1 - e) * 0.5 + parseFloat(c.style.getPropertyValue('--y') || 0)).toFixed(3) + 'em';
    }
  };
})();
