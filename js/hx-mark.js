(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const D = 'M16.09 59.11C24.93 51.75 34.15 44.85 43.72 38.47C46.91 36.35 50.15 34.3 53.4 32.26C56.35 30.4 59.37 28.56 62 26.25C64.46 24.09 66.72 21.3 67.18 17.95C67.65 14.56 65.9 10.93 62.18 10.6C61.01 10.5 59.83 10.76 58.78 11.27C55.06 13.06 53.44 17.32 52.82 21.15C52.66 22.14 52.55 23.13 52.48 24.13C52.39 25.3 52.35 26.46 52.33 27.63C52.19 33.79 52.29 39.96 52.29 46.13C52.29 55.63 52.29 65.13 52.29 74.63C52.29 79.79 52.32 84.96 52.28 90.13C52.25 94.36 52.25 99.64 49.3 103.01C46.99 105.65 42.8 106.36 40.91 102.82C39.61 100.39 40.37 97.45 41.71 95.21C43.9 91.57 48.74 87.89 52.05 85.14C62.05 76.83 72.46 69.01 83.21 61.7C86.65 59.36 90.14 57.07 93.65 54.84C96.33 53.14 99.03 51.5 101.68 49.75C105.66 47.12 110.27 43.77 111.59 38.92C112.45 35.72 111.48 31.73 107.97 30.65C105.15 29.77 102.25 31.3 100.47 33.47C97.59 36.99 97.15 41.89 97 46.27C96.82 51.26 96.93 56.27 96.93 61.27C96.93 69.6 96.93 77.93 96.93 86.27C96.93 89.93 96.94 93.6 96.93 97.27C96.92 100.41 96.96 103.63 96.3 106.73C95.81 109.03 94.83 111.18 93.28 112.96C89.07 117.79 81.88 118.82 76.48 115.37C74.91 114.37 73.64 113.06 72.59 111.53';
  const CROSS = [[0.1098, 0.2552], [0.3829, 0.5095], [0.6448, 0.7902]];
  const LENGTH = 406.88;
  const DRAW_MS = 1100;
  const HOME = Math.atan2(-0.55, -0.45);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3.2);
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = (name, attrs, parent) => { const n = document.createElementNS(NS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const f = (n) => Math.round(n * 100) / 100;
  const hex = (h, d) => { h = (h || '').trim().replace('#', '') || d.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const rgb = (c) => 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')';
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  let fine = null;
  function samples() {
    if (fine) return fine;
    const host = el('svg', { width: 0, height: 0, style: 'position:absolute;visibility:hidden' }, document.body);
    const p = el('path', { d: D }, host), L = p.getTotalLength(), M = 1600, P = [];
    for (let i = 0; i <= M; i++) { const q = p.getPointAtLength(L * i / M); P.push([q.x, q.y]); }
    host.remove();
    const T = P.map((_, i) => { const a = P[Math.max(0, i - 2)], b = P[Math.min(M, i + 2)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; });
    return (fine = { M, P, T });
  }
  const poly = (P, a, b, step) => { let s = ''; for (let i = a; i < b; i += step) s += (i === a ? 'M' : 'L') + f(P[i][0]) + ' ' + f(P[i][1]); return s + 'L' + f(P[b][0]) + ' ' + f(P[b][1]); };

  function mount(target) { return (target instanceof Element ? [target] : Array.from(target || [])).map((node) => { node.__hx = true; return node.dataset.variant === 'silk' ? silk(node) : ink(node); }); }

  let uid = 0;
  function ink(node) {
    const w = parseFloat(node.dataset.weight || 9), draw = (node.dataset.draw || 'load') !== 'off';
    const { M, P } = samples(), N = 160, step = M / N, id = 'hx' + (++uid);
    const svg = el('svg', { viewBox: '0 0 128 128', fill: 'none', 'aria-hidden': 'true' });
    const defs = el('defs', {}, svg), gap = Math.max(1.6, w * 0.26), reach = Math.round(((w + 2 * gap) * 0.95) / (LENGTH / M));
    const zones = CROSS.map(([under, over], k) => {
      const u = Math.round(under * M), o = Math.round(over * M);
      const m = el('mask', { id: id + 'm' + k, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 128, height: 128 }, defs);
      el('rect', { width: 128, height: 128, fill: '#fff' }, m);
      el('path', { d: poly(P, o - reach, o + reach, 4), stroke: '#000', 'stroke-width': w + 2 * gap, 'stroke-linecap': 'butt', 'stroke-linejoin': 'round' }, m);
      return { u0: u - reach - step, u1: u + reach + step, k };
    });
    const body = el('g', { stroke: 'var(--mark-ink, currentColor)', 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    let host = body, zone = null;
    for (let i = 0; i < N; i++) {
      const a = Math.round(i * step), b = Math.round((i + 1) * step), z = zones.find((q) => a >= q.u0 && a < q.u1) || null;
      if (z !== zone) { zone = z; host = z ? el('g', { mask: 'url(#' + id + 'm' + z.k + ')' }, body) : body; }
      const s = el('path', { d: poly(P, a, b, 2), class: 'hx-seg' }, host);
      if (draw && !still()) { let lo = 0, hi = 1; for (let k = 0; k < 16; k++) { const m = (lo + hi) / 2; if (easeOut(m) < i / N) lo = m; else hi = m; } s.style.animationDelay = Math.round(lo * DRAW_MS) + 'ms'; }
    }
    if (draw && !still()) { svg.classList.add('hx-drawing'); setTimeout(() => svg.classList.remove('hx-drawing'), DRAW_MS + 80); }
    node.replaceChildren(svg);
    return { node, variant: 'ink', setLight() {}, repaint() {}, replay() { return ink(node); } };
  }

  function silk(node) {
    const w = parseFloat(node.dataset.weight || 9), draw = (node.dataset.draw || 'load') !== 'off';
    const { M, P, T } = samples();
    const pieces = [];
    for (let a = 0; a < M;) {
      let b = a + 1, turn = 0;
      while (b < M && b - a < 10) { const t0 = T[b - 1], t1 = T[b]; turn += Math.abs(Math.atan2(t0[0] * t1[1] - t0[1] * t1[0], t0[0] * t1[0] + t0[1] * t1[1])); if (turn > 0.023) break; b++; }
      pieces.push({ a, b, m: (a + b) >> 1 }); a = b;
    }
    const zones = CROSS.map(([under, over]) => { const reach = Math.round((w * 1.5) / (LENGTH / M)), u = Math.round(under * M), o = Math.round(over * M); return { u0: u - reach, u1: u + reach, o0: o - reach, o1: o + reach }; });
    const STRIPS = 6, OV = 0.55;
    const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    let size = 0, scale = 1, pal = null, angle = HOME, shown = NaN, progress = draw && !still() ? 0 : 1, small = false;

    const readPalette = () => { const cs = getComputedStyle(node); pal = { lit: hex(cs.getPropertyValue('--mark-lit'), '#7FB2F5'), shade: hex(cs.getPropertyValue('--mark-shade'), '#2F6FD0'), deep: hex(cs.getPropertyValue('--mark-deep'), '#143A5E'), spec: hex(cs.getPropertyValue('--mark-spec'), '#FFFFFF') }; };
    const fit = () => { const css = node.getBoundingClientRect().width || 128; small = css < 56; const dpr = Math.min(devicePixelRatio || 1, 3), px = Math.max(16, Math.round(css * dpr)); if (px === size) return false; size = px; canvas.width = canvas.height = px; scale = px / 128; return true; };

    const runs = []; { let cur = []; pieces.forEach((pc) => { if (zones.some((q) => pc.a <= q.o0 && pc.b > q.o0) && cur.length) { runs.push(cur); cur = []; } cur.push(pc); }); runs.push(cur); }

    function paint() {
      if (!pal) readPalette();
      const lx = Math.cos(angle), ly = Math.sin(angle), upto = progress * M;
      ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.clearRect(0, 0, 128, 128); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      const shade = (pc) => {
        const t = T[pc.m], k = lx * t[0] + ly * t[1], along = Math.abs(k), across = 1 - along * along;
        let c = mix(pal.shade, pal.lit, sstep(0.1, 0.95, across) * (small ? 0.5 : 1)); c = mix(c, pal.deep, sstep(0.7, 1, along) * 0.6);
        return { c, hi: (0.06 + 0.62 * Math.pow(across, 3)) * (small ? 0.55 : 1), nx: lx - k * t[0], ny: ly - k * t[1] };
      };
      const level = (j) => { const u = j / (STRIPS - 1); return { mixw: Math.pow(u, 1.5), width: w * (1 - 0.86 * Math.pow(u, 0.85)), off: u * w * 0.2 }; };
      const cap = (p, sh, lv) => { ctx.fillStyle = rgb(mix(sh.c, pal.spec, sh.hi * lv.mixw)); ctx.beginPath(); ctx.arc(p[0] + lx * lv.off, p[1] + ly * lv.off, lv.width / 2, 0, 6.2832); ctx.fill(); };
      for (let r = 0; r < runs.length; r++) {
        const run = runs[r].filter((pc) => pc.a < upto); if (!run.length) break;
        const z = r > 0 && zones.find((q) => run[0].a <= q.o0 && run[0].b > q.o0);
        if (z) {
          ctx.save(); ctx.beginPath();
          for (let i = z.u0; i <= z.u1; i += 3) { const p = P[i], t = T[i]; ctx[i === z.u0 ? 'moveTo' : 'lineTo'](p[0] - t[1] * w / 2, p[1] + t[0] * w / 2); }
          for (let i = z.u1; i >= z.u0; i -= 3) { const p = P[i], t = T[i]; ctx.lineTo(p[0] + t[1] * w / 2, p[1] - t[0] * w / 2); }
          ctx.closePath(); ctx.clip(); ctx.globalCompositeOperation = 'source-atop';
          const far = 4000; ctx.shadowColor = 'rgba(' + pal.deep.map((v) => v * 0.55 | 0).join(',') + ',0.55)'; ctx.shadowBlur = w * 0.36 * scale; ctx.shadowOffsetX = (far + w * 0.12) * scale; ctx.shadowOffsetY = w * 0.2 * scale;
          ctx.lineWidth = w * 0.9; ctx.strokeStyle = '#000'; ctx.beginPath();
          for (let i = z.o0; i <= Math.min(z.o1, M); i += 3) { const p = P[i]; ctx[i === z.o0 ? 'moveTo' : 'lineTo'](p[0] - far, p[1]); }
          ctx.stroke(); ctx.restore();
        }
        const shades = run.map(shade), last = run[run.length - 1], tip = r === runs.length - 1 || last.b >= upto || !runs[r + 1].some((pc) => pc.a < upto);
        for (let j = 0; j < STRIPS; j++) {
          const lv = level(j); ctx.lineWidth = lv.width;
          if (r === 0) cap(P[0], shades[0], lv);
          for (let n = 0; n < run.length; n++) {
            const pc = run[n], sh = shades[n], A = P[pc.a], B = P[Math.min(pc.b, M)], ta = T[pc.a], tb = T[Math.min(pc.b, M)], ox = sh.nx * lv.off, oy = sh.ny * lv.off;
            ctx.strokeStyle = rgb(mix(sh.c, pal.spec, sh.hi * lv.mixw)); ctx.beginPath();
            ctx.moveTo(A[0] - ta[0] * OV + ox, A[1] - ta[1] * OV + oy); ctx.lineTo(B[0] + tb[0] * OV + ox, B[1] + tb[1] * OV + oy); ctx.stroke();
          }
          if (tip) cap(P[Math.min(last.b, M)], shades[shades.length - 1], lv);
        }
      }
      shown = angle;
    }

    node.replaceChildren(canvas); fit(); paint();
    if (progress < 1) { const t0 = performance.now(); const step = (now) => { progress = easeOut(Math.min(1, (now - t0) / DRAW_MS)); paint(); if (progress < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { if (fit()) paint(); }) : null; if (ro) ro.observe(node);
    return { node, variant: 'silk', setLight(a) { angle = a; if (progress >= 1 && !(Math.abs(a - shown) < 0.004)) paint(); }, repaint() { pal = null; paint(); }, replay() { if (ro) ro.disconnect(); return silk(node); } };
  }

  let followed = [], raf = 0, listening = false;
  const tick = () => { raf = 0; let moving = false;
    followed.forEach((s) => { let d = s.to - s.cur; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) > 0.003) { s.cur += d * 0.14; moving = true; s.m.setLight(s.cur); } });
    if (moving) raf = requestAnimationFrame(tick); };
  function follow(marks) {
    const prev = followed;
    followed = marks.filter((m) => m.variant === 'silk').map((m) => { const old = prev.find((s) => s.m.node === m.node); return { m, cur: old && old.m === m ? old.cur : HOME, to: old ? old.to : HOME }; });
    if (!followed.length || matchMedia('(hover: none)').matches) return;
    if (!raf) raf = requestAnimationFrame(tick);
    if (listening) return;
    listening = true;
    addEventListener('pointermove', (e) => {
      followed.forEach((s) => { const r = s.m.node.getBoundingClientRect(); if (!r.width) return; const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); if (Math.hypot(dx, dy) > r.width * 0.15) s.to = Math.atan2(dy, dx); });
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  let all = [];
  window.HXMark = { D, CROSS, mount, follow,
    init(sel) { all = all.concat(mount([...document.querySelectorAll(sel || '.hx-mark')].filter((n) => !n.__hx))); follow(all); return all; },
    repaint() { all.forEach((m) => m.repaint()); },
    replay(node) { all = all.map((m) => ((node ? m.node !== node : m.node.dataset.draw === 'off') ? m : m.replay())); follow(all); } };
})();
