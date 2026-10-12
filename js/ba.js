(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const stages = document.querySelectorAll('.stage.ba');
  if (!stages.length) return;

  const fmt = (v, d, p) => {
    const s = Math.abs(v).toFixed(d), [i, f] = s.split('.');
    return (p || '') + (v < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + f : '');
  };
  const ease = (t) => 1 - Math.pow(1 - t, 4);

  const paint = (n, v) => {
    const d = +n.dataset.d || 0, p = n.dataset.p || '';
    if (n.classList.contains('ba-amt')) {
      const s = fmt(v, d, p), k = s.indexOf('.');
      n.querySelector('.i').textContent = k < 0 ? s : s.slice(0, k);
      n.querySelector('.d').textContent = k < 0 ? '' : s.slice(k);
    } else n.textContent = fmt(v, d, p);
  };
  const roll = (group, quick) => {
    const ns = [...group.querySelectorAll('.n')];
    ns.forEach((n) => { if (n._raf) cancelAnimationFrame(n._raf); });
    if (calm.matches) { ns.forEach((n) => paint(n, +n.dataset.v)); return; }
    const dur = quick ? 760 : 1050, t0 = performance.now();
    ns.forEach((n, k) => {
      const v = +n.dataset.v, delay = k * 70, from = 0;
      const step = (now) => {
        const t = Math.min(1, Math.max(0, (now - t0 - delay) / dur));
        paint(n, from + (v - from) * ease(t));
        if (t < 1) n._raf = requestAnimationFrame(step); else n._raf = 0;
      };
      n._raf = requestAnimationFrame(step);
    });
  };

  stages.forEach((ba) => {
    const range = ba.querySelector('.ba-range');
    let glide = 0;
    let hold = null;
    const x0 = parseFloat(ba.style.getPropertyValue('--x'));
    let cur = (Number.isFinite(x0) ? x0 : 50) / 100;
    const rope = calm.matches ? null : (() => {
      const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'), path = document.createElementNS(ns, 'path');
      svg.setAttribute('class', 'ba-rope'); svg.setAttribute('aria-hidden', 'true'); svg.appendChild(path);
      ba.insertBefore(svg, ba.querySelector('.ba-line'));
      const befores = ba.querySelectorAll('img.before'), nums = ba.querySelectorAll('.ba-nums');
      const ends = { x: NaN, v: 0 };
      let W = 0, H = 0, max = 9, tagT = .06, raf = 0, prev = 0;
      const bow = () => Math.max(-max, Math.min(max, (cur - ends.x) * W * .5));
      const draw = (b) => {
        const x = cur * W, t = (x - b).toFixed(2), c = (x + b).toFixed(2), m = (H / 2).toFixed(2), h = H.toFixed(2), w = W.toFixed(2);
        const curve = `M${t} 0Q${c} ${m} ${t} ${h}`;
        path.setAttribute('d', curve);
        const left = `path("M0 0L${t} 0Q${c} ${m} ${t} ${h}L0 ${h}Z")`, right = `path("M${t} 0Q${c} ${m} ${t} ${h}L${w} ${h}L${w} 0Z")`;
        befores.forEach((el) => { el.style.clipPath = left; });
        nums.forEach((el) => { el.style.clipPath = right; });
        ba.style.setProperty('--xt', (x - b + 4 * b * tagT * (1 - tagT)).toFixed(2) + 'px');
        ba.classList.add('is-rope');
      };
      const step = (now) => {
        const dt = Math.min(.033, (now - prev) / 1000); prev = now;
        if (!W) { raf = 0; return; }
        ends.v += ((cur - ends.x) * 620 - ends.v * 44) * dt;
        ends.x += ends.v * dt;
        if (Math.abs(cur - ends.x) < .0006 && Math.abs(ends.v) < .002) { ends.x = cur; ends.v = 0; draw(0); raf = 0; return; }
        draw(bow());
        raf = requestAnimationFrame(step);
      };
      const wake = () => { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(step); } };
      const measure = () => {
        W = ba.offsetWidth; H = ba.offsetHeight; max = Math.max(8, Math.min(40, W * .035));
        const tag = ba.querySelector('.ba-tag'); if (tag && H) tagT = (tag.offsetTop + tag.offsetHeight / 2) / H;
        if (!W) return;
        if (!Number.isFinite(ends.x)) { ends.x = cur; ends.v = 0; }
        wake();
      };
      return { wake, measure };
    })();
    const set = (v) => { v = Math.max(0, Math.min(100, v)); cur = v / 100; ba.style.setProperty('--x', v.toFixed(2) + '%'); if (rope) rope.wake(); if (range && Math.round(v) !== +range.value) range.value = Math.round(v); };
    const still = () => { if (glide) { cancelAnimationFrame(glide); glide = 0; } };
    const rest = () => {
      still();
      const cur = parseFloat(ba.style.getPropertyValue('--x')), from = Number.isFinite(cur) ? cur : 50, to = 100 / 3;
      if (calm.matches || Math.abs(to - from) < .5) { set(to); return; }
      const t0 = performance.now(), dur = 640;
      const step = (now) => { const t = Math.min(1, (now - t0) / dur); set(from + (to - from) * ease(t)); glide = t < 1 ? requestAnimationFrame(step) : 0; };
      glide = requestAnimationFrame(step);
    };
    if (range) range.addEventListener('input', () => { still(); hold = null; set(+range.value); });
    ba.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || e.target.closest('.ba-ctl')) return;
      if (hold) { if (Math.hypot(e.clientX - hold.x, e.clientY - hold.y) < 48) return; hold = null; }
      still();
      const r = ba.getBoundingClientRect(); if (r.width) set((e.clientX - r.left) / r.width * 100);
    });
    ba.addEventListener('pointerleave', () => { hold = null; });

    const active = () => ba.querySelector(`.ba-nums[data-view="${ba.dataset.view || 'today'}"][data-skin="${ba.dataset.skin || 'glass'}"]`);
    const scope = ba.closest('[data-ba]') || ba;
    const segs = scope.querySelectorAll('.ba-seg');
    const mark = (seg) => {
      const on = seg.querySelector('button[aria-pressed="true"]'); if (!on) return;
      seg.style.setProperty('--i', on.offsetLeft + 'px'); seg.style.setProperty('--w', on.offsetWidth + 'px'); seg.style.setProperty('--on', 1); seg.classList.add('is-live');
    };
    segs.forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || b.getAttribute('aria-pressed') === 'true') return;
        const key = b.dataset.view ? 'view' : 'skin';
        seg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        ba.dataset[key] = b.dataset[key];
        mark(seg);
        rest();
        hold = ba.contains(seg) && e.detail ? { x: e.clientX, y: e.clientY } : null;
        const g = active(); if (g) roll(g, true);
      });
      mark(seg);
    });
    const remark = () => { segs.forEach(mark); if (rope) rope.measure(); };
    addEventListener('load', remark);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remark);
    if ('ResizeObserver' in window) new ResizeObserver(remark).observe(ba); else addEventListener('resize', remark);

    let last = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      const now = performance.now(); if (now - last < 4000) return; last = now;
      const g = active(); if (g) roll(g, false);
    }, { threshold: 0.35 });
    io.observe(ba);
  });
})();
