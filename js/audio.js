/* ============================================================
   AUDIO — a tiny synth that scores every chapter live.
   No files needed. (If you later drop generated tracks into
   assets/audio/bed-<chapter>.mp3 the engine will prefer them.)
   ============================================================ */
(function () {
  let ctx = null, master, bus, comp, rev, revSend, noiseBuf, rainGain, rainSrc, voiceGain;
  let enabled = false, chapter = null, bed = null, ready = false;
  const mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  const rnd = function (n) { return Math.floor(Math.random() * n); };
  const pick = function (a) { return a[rnd(a.length)]; };

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.attack.value = .01; comp.release.value = .25;
    bus = ctx.createGain(); bus.gain.value = 1;
    bus.connect(master); master.connect(comp); comp.connect(ctx.destination);
    rev = ctx.createConvolver(); rev.buffer = impulse(2.8, 2.6);
    revSend = ctx.createGain(); revSend.gain.value = .4; revSend.connect(rev); rev.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // persistent rain layer
    rainSrc = noise(); const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
    rainGain = ctx.createGain(); rainGain.gain.value = 0;
    rainSrc.connect(hp); hp.connect(lp); lp.connect(rainGain); rainGain.connect(master); rainSrc.start();
    ready = true; return true;
  }
  function impulse(sec, decay) { const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; }
  function noise() { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.loopStart = Math.random() * 1.5; s.loopEnd = 3.5; return s; }

  /* a plucked / bell-ish note */
  function note(f, t, o) {
    o = o || {}; const out = o.out || bus;
    const osc = ctx.createOscillator(); osc.type = o.type || 'triangle'; osc.frequency.value = f;
    const g = ctx.createGain(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.cut || 2400;
    const a = o.attack || .008, dur = o.dur || 1.6, vol = o.gain || .1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp); lp.connect(g); g.connect(out);
    if (o.verb !== 0) { const s = ctx.createGain(); s.gain.value = o.verb || .5; g.connect(s); s.connect(revSend); }
    osc.start(t); osc.stop(t + dur + .05);
  }
  function hat(t, v) { const s = noise(), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000; const g = ctx.createGain(); g.gain.setValueAtTime(v || .05, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); s.connect(hp); hp.connect(g); g.connect(bus); s.start(t); s.stop(t + .08); }
  function kick(t, v) { const o = ctx.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); const g = ctx.createGain(); g.gain.setValueAtTime(v || .35, t); g.gain.exponentialRampToValueAtTime(.0001, t + .28); o.connect(g); g.connect(bus); o.start(t); o.stop(t + .3); }
  function click(t, v) { const s = noise(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400 + Math.random() * 2400; bp.Q.value = 3; const g = ctx.createGain(); g.gain.setValueAtTime(v || .09, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03); s.connect(bp); bp.connect(g); g.connect(bus); s.start(t); s.stop(t + .05); }
  function padTone(m, vol, type, out, lfoHz) {
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = mtof(m) * (1 + (Math.random() - .5) * .004);
    const g = ctx.createGain(); g.gain.value = vol; const l = ctx.createOscillator(); l.frequency.value = lfoHz || .1 + Math.random() * .15; const lg = ctx.createGain(); lg.gain.value = vol * .5; l.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(out); o.start(); l.start(); return [o, l];
  }
  function sequencer(bpm, fn, out) {
    let step = 0, next = ctx.currentTime + .1; const spb = 60 / bpm / 4; let on = true;
    const iv = setInterval(function () { if (!on) return; while (next < ctx.currentTime + .18) { fn(step++, next); next += spb; } }, 40);
    return function () { on = false; clearInterval(iv); };
  }

  /* ---------- the beds ---------- */
  const BEDS = {
    hello: function (out) {
      const nodes = []; [48, 55, 59, 64, 67].forEach(function (m, i) { nodes.push.apply(nodes, padTone(m, .045 / (1 + i * .12), 'sine', out)); });
      let alive = true; const sc = [72, 74, 76, 79, 81, 84, 79, 76];
      (function loop() { if (!alive) return; note(mtof(pick(sc)), ctx.currentTime, { gain: .07, dur: 3, out: out, verb: .8 }); setTimeout(loop, 1500 + Math.random() * 3000); })();
      return function () { alive = false; nodes.forEach(function (n) { try { n.stop(); } catch (e) { } }); };
    },
    storm: function (out) {
      const nodes = []; padTone(26, .09, 'sawtooth', lpOut(out, 240)).forEach(function (n) { nodes.push(n); }); padTone(33, .06, 'sawtooth', lpOut(out, 220)).forEach(function (n) { nodes.push(n); });
      const w = noise(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .8; const wl = ctx.createOscillator(); wl.frequency.value = .09; const wg = ctx.createGain(); wg.gain.value = 260; wl.connect(wg); wg.connect(bp.frequency);
      const g = ctx.createGain(); g.gain.value = .12; w.connect(bp); bp.connect(g); g.connect(out); w.start(); wl.start(); nodes.push(w, wl);
      let alive = true; (function loop() { if (!alive) return; note(mtof(pick([50, 53, 57, 62])), ctx.currentTime, { gain: .05, dur: 4, type: 'sine', out: out, verb: 1 }); setTimeout(loop, 3500 + Math.random() * 4000); })();
      return function () { alive = false; nodes.forEach(function (n) { try { n.stop(); } catch (e) { } }); };
    },
    journey: function (out) {
      const nodes = []; [53, 60, 64, 67, 71].forEach(function (m, i) { nodes.push.apply(nodes, padTone(m, .04, i > 2 ? 'triangle' : 'sine', out, .07)); });
      let alive = true;
      (function loop() { if (!alive) return; const t = ctx.currentTime; const a = pick([76, 79, 84]); note(mtof(a), t, { gain: .09, dur: 2.4, type: 'sine', verb: 1, out: out }); note(mtof(a - 4), t + .5, { gain: .09, dur: 2.8, type: 'sine', verb: 1, out: out }); setTimeout(loop, 5000 + Math.random() * 5000); })();
      return function () { alive = false; nodes.forEach(function (n) { try { n.stop(); } catch (e) { } }); };
    },
    builder: function (out) {
      const pent = [57, 60, 62, 64, 67, 69, 72]; let bass = [45, 45, 43, 48];
      const stop = sequencer(98, function (s, t) {
        const bar = Math.floor(s / 16) % 4;
        if (s % 4 === 0) kick(t, .22);
        if (s % 2 === 1) hat(t, .025);
        if (s % 16 === 0 || s % 16 === 10) note(mtof(bass[bar]), t, { type: 'sawtooth', cut: 380, gain: .12, dur: .5, verb: .1, out: out });
        if (Math.random() < .55) note(mtof(pent[rnd(pent.length)]), t, { type: 'triangle', cut: 2600, gain: .055, dur: .55, verb: .6, out: out });
        if (Math.random() < .22) click(t, .07);
      });
      return stop;
    },
    gaming: function (out) {
      const bass = [33, 33, 29, 31]; const arp = [57, 60, 64, 69, 64, 60, 62, 65];
      const eng = noise(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170; const eg = ctx.createGain(); eg.gain.value = .22; eng.connect(lp); lp.connect(eg); eg.connect(out); eng.start();
      const ho = padTone(34, .05, 'sawtooth', lpOut(out, 200), 6);
      const stop = sequencer(126, function (s, t) {
        const bar = Math.floor(s / 16) % 4;
        if (s % 4 === 0) kick(t, .3);
        if (s % 4 === 2) hat(t, .04);
        if (s % 2 === 0) note(mtof(bass[bar]), t, { type: 'sawtooth', cut: 520, gain: .13, dur: .22, verb: 0, out: out });
        note(mtof(arp[s % 8] + 12), t, { type: 'square', cut: 1800, gain: .022, dur: .16, verb: .4, out: out });
      });
      return function () { stop(); try { eng.stop(); ho.forEach(function (n) { n.stop(); }); } catch (e) { } };
    },
    people: function (out) {
      const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; let ci = 0, alive = true;
      const nodes = padTone(36, .06, 'sine', out, .05);
      (function loop() { if (!alive) return; const t = ctx.currentTime, c = chords[ci++ % 4];
        c.forEach(function (m, i) { note(mtof(m + 12), t + i * .12, { type: 'sine', gain: .07, dur: 5.5, attack: .03, verb: .9, out: out, cut: 1800 }); note(mtof(m + 24), t + i * .12, { type: 'sine', gain: .018, dur: 3.5, out: out, verb: .8 }); });
        setTimeout(loop, 6000); })();
      let pa = true; (function purr() { if (!pa) return; const s = noise(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 190; const g = ctx.createGain(); g.gain.value = 0; const l = ctx.createOscillator(); l.frequency.value = 24; const lg = ctx.createGain(); lg.gain.value = .05; l.connect(lg); lg.connect(g.gain); const t = ctx.currentTime; g.gain.setTargetAtTime(.07, t, .8); g.gain.setTargetAtTime(0, t + 4, 1); s.connect(lp); lp.connect(g); g.connect(out); s.start(); l.start(); s.stop(t + 8); l.stop(t + 8); setTimeout(purr, 11000 + Math.random() * 7000); })();
      return function () { alive = false; pa = false; nodes.forEach(function (n) { try { n.stop(); } catch (e) { } }); };
    },
  };
  BEDS.finale = BEDS.people;
  function lpOut(out, f) { const l = ctx.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = f; l.connect(out); return l; }

  /* ---------- public ---------- */
  const A = window.PKT.audio = {
    get on() { return enabled; },
    enable: function (on) {
      if (on && !init()) return false;
      enabled = on;
      if (!ctx) return enabled;
      if (on) { ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.9, ctx.currentTime, .4); if (chapter) { const c = chapter; chapter = null; A.setChapter(c); } }
      else { master.gain.setTargetAtTime(0, ctx.currentTime, .25); setTimeout(function () { if (!enabled && ctx) ctx.suspend(); }, 900); }
      return enabled;
    },
    setChapter: function (name) {
      if (name === chapter) return; chapter = name;
      if (!enabled || !ctx) return;
      const old = bed; const g = ctx.createGain(); g.gain.value = 0; g.connect(bus);
      const stop = (BEDS[name] || BEDS.hello)(g);
      g.gain.setTargetAtTime(1, ctx.currentTime, .9);
      bed = { g: g, stop: stop };
      if (old) { old.g.gain.setTargetAtTime(0, ctx.currentTime, .6); setTimeout(function () { try { old.stop(); } catch (e) { } try { old.g.disconnect(); } catch (e) { } }, 3500); }
    },
    setRain: function (v) { if (!enabled || !ctx) return; rainGain.gain.setTargetAtTime(v * .16, ctx.currentTime, .5); },
    duck: function (on) { if (!ctx) return; bus.gain.setTargetAtTime(on ? .28 : 1, ctx.currentTime, .4); },
    thunder: function (level) {
      if (!enabled || !ctx) return; level = level || 1; const t = ctx.currentTime;
      [0, .35 + Math.random() * .3].forEach(function (off, k) {
        const s = noise(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1100, t + off); lp.frequency.exponentialRampToValueAtTime(55, t + off + 3.6);
        const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t + off); g.gain.exponentialRampToValueAtTime((k ? .35 : .9) * level, t + off + .06); g.gain.exponentialRampToValueAtTime(.0001, t + off + 4.2);
        s.connect(lp); lp.connect(g); g.connect(master); const v = ctx.createGain(); v.gain.value = .6; g.connect(v); v.connect(revSend); s.start(t + off); s.stop(t + off + 4.5);
      });
    },
    blip: function () { if (!enabled || !ctx) return; const t = ctx.currentTime, o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(1320, t + .09); const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.14, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .16); o.connect(g); g.connect(master); o.start(t); o.stop(t + .2); },
    whoosh: function () { if (!enabled || !ctx) return; const t = ctx.currentTime, s = noise(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(3200, t + .35); const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + .15); g.gain.exponentialRampToValueAtTime(.0001, t + .6); s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + .7); },
    tick: function () { if (!enabled || !ctx) return; click(ctx.currentTime, .12); },
  };
})();
