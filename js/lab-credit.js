(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const CELL = 1.1, ROLL = 700, MAX = 99999;
  const bez = (x1, y1, x2, y2) => { const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = (a) => 3 * a;
    const cx = (t) => ((A(x1, x2) * t + B(x1, x2)) * t + C(x1)) * t, cy = (t) => ((A(y1, y2) * t + B(y1, y2)) * t + C(y1)) * t, dx = (t) => (3 * A(x1, x2) * t + 2 * B(x1, x2)) * t + C(x1);
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 6; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (cx(t) - x) / d; } return cy(Math.max(0, Math.min(1, t))); }; };
  const easeRoll = bez(0.23, 1, 0.32, 1);
  const num = (s) => parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0;
  const fmt = (n) => n.toLocaleString('en-AU');
  const digitsOf = (s) => String(s).replace(/[^0-9]/g, '');
  const put = (col, p) => { col.style.transform = 'translateY(' + (-((((p % 10) + 10) % 10) + 2) * CELL).toFixed(4) + 'em)'; };
  const build = (el, str) => { el.textContent = '';
    for (const ch of str) {
      if (ch === ',' || ch === '.') { const s = document.createElement('span'); s.className = 'digit sep'; s.textContent = ch; el.appendChild(s); continue; }
      const d = document.createElement('span'); d.className = 'digit'; const col = document.createElement('span'); col.className = 'col';
      for (let k = -2; k <= 11; k++) { const s = document.createElement('span'); s.textContent = ((k % 10) + 10) % 10; col.appendChild(s); }
      d.appendChild(col); put(col, +ch); el.appendChild(d); }
    el._val = num(str); el._str = str; el.setAttribute('aria-label', str); };
  const roll = (el, fromStr, toStr, ms) => {
    ms = ms || ROLL; const from = num(fromStr), to = num(toStr); if (from === to && el._str === toStr) return; const dir = to >= from ? 1 : -1;
    stop(el);
    if (calm.matches) { el.classList.add('fading'); el._fade = setTimeout(() => { build(el, toStr); el.classList.remove('fading'); }, 200); return; }
    const fd = digitsOf(fromStr), td = digitsOf(toStr), longer = td.length >= fd.length ? toStr : fromStr, n = digitsOf(longer).length;
    const a = fd.padStart(n, '0'), b = td.padStart(n, '0'), lead = n - Math.min(fd.length, td.length);
    build(el, longer); el.setAttribute('aria-label', toStr); el._val = to; el._str = toStr;
    const cells = [...el.children], cols = cells.filter((c) => !c.classList.contains('sep')).map((c) => c.firstChild);
    const plan = cols.map((col, i) => { const s = +a[i], t = b[i] === undefined ? s : +b[i]; const travel = dir > 0 ? (t - s + 10) % 10 : (s - t + 10) % 10; put(col, s); return { col, s, travel }; });
    let firstKept = 0; { let seen = 0; for (let i = 0; i < cells.length; i++) { if (!cells[i].classList.contains('sep')) { if (seen === lead) { firstKept = i; break; } seen++; } } }
    const edge = cells.slice(0, firstKept);
    const grow = td.length > fd.length, shrink = td.length < fd.length;
    if (grow) { edge.forEach((c) => c.classList.add('enter')); void el.offsetWidth; requestAnimationFrame(() => edge.forEach((c) => c.classList.remove('enter'))); }
    if (shrink) { void el.offsetWidth; requestAnimationFrame(() => edge.forEach((c) => c.classList.add('leave'))); }
    const t0 = performance.now();
    const step = (now) => { const t = Math.min((now - t0) / ms, 1), e = easeRoll(t); plan.forEach(({ col, s, travel }) => put(col, s + dir * travel * e));
      if (t < 1) el._anim = requestAnimationFrame(step); else { el._anim = 0; plan.forEach(({ col, s, travel }) => put(col, s + dir * travel)); if (shrink) build(el, toStr); } };
    el._anim = requestAnimationFrame(step); };
  const stop = (el) => { if (el._anim) cancelAnimationFrame(el._anim); el._anim = 0; clearTimeout(el._fade); el.classList.remove('fading'); };
  const replay = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); el.addEventListener('animationend', () => el.classList.remove(cls), { once: true }); };
  const glare = (el) => { if (!el) return; el.classList.remove('play'); void el.getBoundingClientRect(); el.classList.add('play'); el.addEventListener('animationend', () => el.classList.remove('play'), { once: true }); };

  const mount = (box) => { const cc = box.querySelector('.cc'), odo = box.querySelector('.odo'), gl = box.querySelector('.glare'), last = box.querySelector('.sub .v'); if (!cc || !odo) return null;
    const START = 3200; let bal = START; build(odo, fmt(bal));
    const fly = (from, text) => { if (calm.matches || !from) return; const b = box.getBoundingClientRect(), f = from.getBoundingClientRect(), o = odo.getBoundingClientRect();
      const el = document.createElement('span'); el.className = 'cc-delta'; el.textContent = text; el.setAttribute('aria-hidden', 'true');
      el.style.left = (f.left + f.width / 2 - b.left) + 'px'; el.style.top = (f.top + f.height / 2 - b.top) + 'px';
      el.style.setProperty('--dx', ((o.left + o.width / 2) - (f.left + f.width / 2)).toFixed(1) + 'px'); el.style.setProperty('--dy', ((o.top + o.height / 2) - (f.top + f.height / 2)).toFixed(1) + 'px');
      box.appendChild(el); el.addEventListener('animationend', () => el.remove(), { once: true }); setTimeout(() => el.remove(), 1200); };
    const change = (d, from) => { const was = fmt(bal); bal = Math.max(0, Math.min(MAX, bal + d)); if (bal === num(was)) return; const label = (d > 0 ? '+' : '−') + fmt(Math.abs(d));
      fly(from, label); roll(odo, was, fmt(bal)); glare(gl);
      if (last) { last.textContent = label + ' CrG · just now'; replay(last, 'swap'); } };
    box.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { replay(b, 'pop'); change(parseInt(b.dataset.d, 10) || 0, b); }));
    const loadIn = () => { const to = fmt(bal), zero = to.replace(/\d/g, '0'); stop(odo); build(odo, zero);
      requestAnimationFrame(() => requestAnimationFrame(() => { roll(odo, zero, to); glare(gl); })); };
    const reset = () => { stop(odo); bal = START; build(odo, fmt(bal)); if (gl) gl.classList.remove('play'); cc.classList.remove('is-tracking'); cc.style.removeProperty('--rx'); cc.style.removeProperty('--ry');
      box.querySelectorAll('.cc-delta').forEach((n) => n.remove()); if (last) { last.textContent = 'just now'; last.classList.remove('swap'); } };
    let raf = 0, at = null;
    const lean = () => { raf = 0; if (!at) return; const r = cc.getBoundingClientRect(); if (!r.width) return;
      const px = Math.max(-1, Math.min(1, ((at.x - r.left) / r.width - .5) * 2)), py = Math.max(-1, Math.min(1, ((at.y - r.top) / r.height - .5) * 2));
      cc.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg'); cc.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg'); };
    box.addEventListener('pointermove', (e) => { if (calm.matches || e.pointerType === 'touch') return; at = { x: e.clientX, y: e.clientY }; cc.classList.add('is-tracking'); if (!raf) raf = requestAnimationFrame(lean); }, { passive: true });
    box.addEventListener('pointerleave', () => { at = null; cc.classList.remove('is-tracking'); cc.style.removeProperty('--rx'); cc.style.removeProperty('--ry'); });
    return { loadIn, reset, change }; };

  window.LabCredit = { mount, build, roll, glare, fmt };

  const card = document.querySelector('.lab-card[data-exp="credit"]'), lab = document.getElementById('lab'); if (!card || !lab) return;
  const stage = card.querySelector('.stage.credit'), sheet = lab.querySelector('.lab-sheet'), demo = mount(stage); if (!stage || !demo) return;
  let open = lab.classList.contains('is-open'), seen = false, live = false, t = 0;
  const sync = () => { const now = open && seen; if (now === live) return; live = now; stage.classList.toggle('is-live', live); clearTimeout(t);
    if (live) t = setTimeout(demo.loadIn, 420); else demo.reset(); };
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { root: sheet, threshold: 0.45 }).observe(stage);
  new MutationObserver(() => { const o = lab.classList.contains('is-open'); if (o !== open) { open = o; sync(); } }).observe(lab, { attributes: true, attributeFilter: ['class'] });

  const glasses = [...stage.querySelectorAll('.lg')]; let raf = 0, at = null;
  const light = () => { raf = 0; if (!at) return;
    for (const g of glasses) { const r = g.getBoundingClientRect(); if (!r.width) continue;
      const gx = (at.x - r.left) / r.width * 100, gy = (at.y - r.top) / r.height * 100;
      g.style.setProperty('--gx', Math.max(-20, Math.min(120, gx)).toFixed(1) + '%'); g.style.setProperty('--gy', Math.max(-20, Math.min(120, gy)).toFixed(1) + '%');
      g.style.setProperty('--ang', (Math.atan2(at.x - (r.left + r.width / 2), -(at.y - (r.top + r.height / 2))) * 180 / Math.PI).toFixed(1) + 'deg'); } };
  stage.addEventListener('pointermove', (e) => { at = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(light); }, { passive: true });
  stage.addEventListener('pointerleave', () => { at = null; for (const g of glasses) { g.style.removeProperty('--gx'); g.style.removeProperty('--gy'); g.style.removeProperty('--ang'); } });
})();
