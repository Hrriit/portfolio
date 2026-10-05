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
    const set = (v) => { v = Math.max(0, Math.min(100, v)); ba.style.setProperty('--x', v.toFixed(2) + '%'); if (range && Math.round(v) !== +range.value) range.value = Math.round(v); };
    if (range) range.addEventListener('input', () => set(+range.value));
    ba.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || e.target.closest('.ba-ctl')) return; const r = ba.getBoundingClientRect(); if (r.width) set((e.clientX - r.left) / r.width * 100); });

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
        const g = active(); if (g) roll(g, true);
      });
      mark(seg);
    });
    const remark = () => segs.forEach(mark);
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
