(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const TUNE = { size: 1, speed: 1, blur: 1, dim: 1 };
  const PEEK = 0.05;
  const LEVELS = [0.02, 0.15, 0.4, 0.7, 1];
  const all = [];

  function mount(el) {
    if (el.__fold) return el.__fold;
    const q = (s) => el.querySelector(s);
    const base = q('.fold-base'), front = q('.fold-front'), back = q('.fold-back'), slab = q('.fold-slab'), ground = q('.fold-ground'), hit = q('.fold-hit'), dimmer = q('.fold-base .fold-shade'), label = q('.fold-sr');
    const fx = (page) => { const blur = page.querySelector('.fold-blur'), src = page.querySelector('.fold-paper'), layers = [];
      for (let i = 0; i < 4; i++) { const ly = document.createElement('span'), soft = document.createElement('span'), keep = document.createElement('span');
        soft.className = 'soft'; keep.className = 'keep'; keep.innerHTML = src.innerHTML; keep.querySelectorAll('img').forEach((im) => { im.alt = ''; });
        soft.appendChild(keep); ly.appendChild(soft); blur.appendChild(ly); layers.push({ ly, soft }); }
      blur.setAttribute('aria-hidden', 'true'); return { page, blur, layers, shade: page.querySelector('.fold-shade') }; };
    const F = fx(front), B = fx(back);
    if (window.HXMark) HXMark.init('.fold .hx-mark');
    const slot = el.closest('.fold-slot') || el.parentElement;
    const edgeAnchor = el.dataset.anchor === 'edge';
    let axis = 'x', w = 256, h = 358, u = 1, r = 12, m = 72, sil = [];
    let p = 0, v = 0, target = 0, raf = 0, last = 0, drag = null, swallow = false, touched = false, shown = null;
    let roomL = 1e4, roomR = 1e4, slabBox = '';
    const look = () => { const b = el.getBoundingClientRect(); roomL = Math.max(0, b.left); roomR = Math.max(0, document.documentElement.clientWidth - b.right); };

    const measure = () => {
      const room = slot.clientWidth || 512, k = TUNE.size;
      const nx = room >= 464 * k || edgeAnchor ? 'x' : 'y';
      const nw = nx === 'x' ? Math.min(256 * k, room / 2) : Math.min(358 * k, room) * 256 / 358;
      if (nx === axis && Math.abs(nw - w) < 0.25 && sil.length) return false;
      axis = nx; w = nw; u = w / 256; h = 358 * u; r = 12 * u; m = 72 * u;
      el.dataset.axis = axis; el.style.setProperty('--w', w.toFixed(2) + 'px');
      sil = [[0, -h / 2], [w - r, -h / 2]];
      for (let i = 1; i <= 6; i++) { const t = -Math.PI / 2 + i / 6 * Math.PI / 2; sil.push([w - r + r * Math.cos(t), -h / 2 + r + r * Math.sin(t)]); }
      for (let i = 0; i <= 6; i++) { const t = i / 6 * Math.PI / 2; sil.push([w - r + r * Math.cos(t), h / 2 - r + r * Math.sin(t)]); }
      sil.push([0, h / 2]);
      [front, back, base].forEach((n) => { n.style.transform = ''; }); shown = null; look();
      return true;
    };

    const xy = (a, c) => (axis === 'x' ? a.toFixed(2) + 'px ' + c.toFixed(2) + 'px' : c.toFixed(2) + 'px ' + a.toFixed(2) + 'px');
    const move = (a, s) => (axis === 'x' ? 'translateX(' + a.toFixed(2) + 'px)' + (s !== 1 ? ' scaleX(' + s.toFixed(4) + ')' : '') : 'translateY(' + a.toFixed(2) + 'px)' + (s !== 1 ? ' scaleY(' + s.toFixed(4) + ')' : ''));
    const toward = (out) => (axis === 'x' ? (out > 0 ? 'to right' : 'to left') : (out > 0 ? 'to bottom' : 'to top'));
    const setMask = (n, g) => { n.style.webkitMaskImage = g; n.style.maskImage = g; };
    const show = (n, on) => { const val = on ? 'visible' : 'hidden'; if (n.style.visibility !== val) n.style.visibility = val; };

    const draw = () => {
      const th = p * Math.PI, cs = Math.cos(th), sn = Math.sin(th), P = 1250 * u;
      const hinge = edgeAnchor ? 0 : -w / 2 * (1 - p);
      const pr = (a, c) => { const f = P / (P - a * sn); return [(hinge + a * cs) * f, c * f]; };
      const out = pr(w, 0)[0] - hinge;
      const st = Math.max(1, Math.abs(out) / w);
      const rest = p < 0.0005 ? 0 : p > 0.9995 ? 1 : -1;
      const pts = rest < 0 ? sil.map(([a, c]) => pr(a, c)) : null;

      base.style.transform = move(hinge, 1);
      const dim = 0.78 * Math.pow(1 - smooth(0.28, 1, p), 0.75) * TUNE.dim;
      dimmer.style.opacity = dim.toFixed(3);

      const which = rest === 0 ? F : rest === 1 ? B : out > 0 ? F : B;
      show(front, which === F); show(back, which === B);
      if (shown !== which) { (which === F ? B : F).blur.style.display = 'none'; shown = which; }
      const page = which.page, isF = which === F;
      page.style.transform = move(hinge, st);
      if (rest >= 0) {
        slab.style.display = 'none'; page.style.clipPath = 'none'; which.blur.style.display = 'none'; which.shade.style.opacity = 0; setMask(which.shade, 'none');
      } else {
        const x0 = -Math.min(m, roomL), x1 = (axis === 'x' ? 2 * w : h) + Math.min(m, roomR), key = x0.toFixed(1) + ' ' + x1.toFixed(1);
        if (key !== slabBox) { slabBox = key; slab.style.left = x0.toFixed(1) + 'px'; slab.style.right = 'auto'; slab.style.width = (x1 - x0).toFixed(1) + 'px'; }
        slab.style.display = 'block';
        slab.style.clipPath = 'polygon(' + pts.map(([a, c]) => (axis === 'x' ? (a + w - x0).toFixed(2) + 'px ' + (c + h / 2 + m).toFixed(2) : (c + h / 2 - x0).toFixed(2) + 'px ' + (a + w + m).toFixed(2)) + 'px').join(',') + ')';
        const off = isF ? 0 : w;
        page.style.clipPath = 'polygon(' + pts.map(([a, c]) => xy(off + (a - hinge) / st, c + h / 2)).join(',') + ')';
        const deg = isF ? p * 180 : 180 - p * 180, dir = toward(isF ? 1 : -1);
        const at = (t) => Math.abs(pr(t * w, 0)[0] - hinge) / st;
        const tilt = (isF ? 0.36 * Math.pow(Math.sin(2 * th), 0.85) : 0.5 * Math.pow(Math.max(0, Math.sin(2 * th) * -1), 0.9)) * TUNE.dim, lit = isF ? 1 : 1 - dim, far = Math.abs(out) / st;
        const stops = [0, 0.25, 0.5, 0.75, 1].map((s) => 'rgba(0,0,0,' + (1 - lit * (1 - tilt * Math.pow(s, 1.3))).toFixed(3) + ') ' + (s * far).toFixed(1) + 'px');
        which.shade.style.opacity = 1; setMask(which.shade, 'linear-gradient(' + dir + ',' + stops.join(',') + ')');
        const peak = (isF ? 12 * Math.exp(-Math.pow((deg - 52) / 14, 2)) * (1 - Math.pow(deg / 90, 8)) : 20 * Math.pow(smooth(3, 48, deg), 1.5)) * u * TUNE.blur, n = isF ? 6 : 1.4;
        if (peak < 0.3) which.blur.style.display = 'none';
        else {
          which.blur.style.display = 'block';
          which.layers.forEach((layer, i) => {
            const lo = LEVELS[i], hi = LEVELS[i + 1];
            layer.soft.style.filter = 'blur(' + (peak * hi).toFixed(2) + 'px)';
            setMask(layer.ly, 'linear-gradient(' + dir + ',transparent ' + at(Math.pow(lo, 1 / n)).toFixed(1) + 'px,#000 ' + at(Math.pow(hi, 1 / n)).toFixed(1) + 'px)');
          });
        }
      }
      const lo = pts ? Math.min(hinge, ...pts.map((q2) => q2[0])) : rest ? hinge - w : hinge, len = hinge + w - lo;
      ground.style.transform = move(lo + w, len / (2 * w));
      if (axis === 'x') { hit.style.left = (lo + w).toFixed(1) + 'px'; hit.style.width = len.toFixed(1) + 'px'; hit.style.top = ''; hit.style.height = ''; }
      else { hit.style.top = (lo + w).toFixed(1) + 'px'; hit.style.height = len.toFixed(1) + 'px'; hit.style.left = ''; hit.style.width = ''; }
    };

    const settle = () => {
      const open = target === 1 && p > 0.97;
      if (el.classList.contains('is-open') === open && el.__said) return; el.__said = true;
      el.classList.toggle('is-open', open); base.inert = !open; back.inert = !open;
      hit.setAttribute('aria-expanded', String(open)); if (label) label.textContent = open ? 'Close the card' : 'Open the card';
      dispatchEvent(new Event('scroll'));
    };

    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60; last = now;
      const om = (target === 1 ? 8.5 : target === 0 ? 10 : 14) * TUNE.speed, n = Math.max(1, Math.ceil(dt / 0.008));
      for (let i = 0; i < n; i++) { const s = dt / n; v += (-om * om * (p - target) - 2 * om * v) * s; p += v * s; }
      if (p <= 0 || p >= 1) { p = clamp(p, 0, 1); v = 0; }
      const done = Math.abs(p - target) < 0.0008 && Math.abs(v) < 0.02;
      if (done) { p = target; v = 0; }
      draw(); settle();
      raf = done ? 0 : requestAnimationFrame(tick); if (!raf) last = 0;
    };
    const go = (to, v0) => { target = to; if (v0 !== undefined) v = v0;
      if (calm.matches) { p = to === PEEK ? p : to; v = 0; draw(); settle(); return; }
      if (!raf) { look(); raf = requestAnimationFrame(tick); } };
    const toggle = () => { touched = true; go(target === 1 ? 0 : 1); };

    const along = (e) => (axis === 'x' ? e.clientX : e.clientY);
    hit.addEventListener('pointerdown', (e) => { if (e.button || calm.matches) return; drag = { id: e.pointerId, a0: along(e), p0: p, moved: false, s: [] }; });
    hit.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = along(e) - drag.a0;
      if (!drag.moved) {
        if (Math.abs(d) < 4) return;
        if (axis === 'y' && e.pointerType === 'touch') { drag = null; return; }
        drag.moved = true; touched = true; drag.a0 = along(e); drag.p0 = p; look(); try { hit.setPointerCapture(e.pointerId); } catch (err) {}
        if (raf) { cancelAnimationFrame(raf); raf = 0; last = 0; } v = 0; target = p > 0.5 ? 1 : 0; el.classList.add('is-drag'); return;
      }
      p = clamp(drag.p0 - d / (1.5 * w), 0, 1);
      const now = performance.now(); drag.s.push([now, p]); while (drag.s.length > 2 && now - drag.s[0][0] > 90) drag.s.shift();
      target = p > 0.5 ? 1 : 0; draw(); settle();
    });
    const drop = (e) => {
      if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; el.classList.remove('is-drag');
      if (!d.moved) return;
      swallow = e.type === 'pointerup';
      let v0 = 0; if (d.s.length > 1) { const a = d.s[0], b = d.s[d.s.length - 1]; if (b[0] > a[0]) v0 = (b[1] - a[1]) / (b[0] - a[0]) * 1000; }
      go(Math.abs(v0) > 1.2 ? (v0 > 0 ? 1 : 0) : p >= 0.5 ? 1 : 0, clamp(v0, -12, 12));
    };
    hit.addEventListener('pointerup', drop); hit.addEventListener('pointercancel', drop);
    hit.addEventListener('click', () => { if (swallow) { swallow = false; return; } toggle(); });
    hit.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && fine.matches && !drag && target === 0 && !calm.matches) go(PEEK); });
    hit.addEventListener('pointerleave', () => { if (target === PEEK) go(0); });

    el.classList.add('is-live');
    measure();
    if (calm.matches && el.dataset.auto !== 'off') { p = target = 1; }
    draw(); settle();
    if (window.ResizeObserver) new ResizeObserver(() => { if (measure()) draw(); }).observe(slot);
    const mode = el.dataset.auto || 'view';
    if (mode !== 'off' && !calm.matches && window.IntersectionObserver) {
      const foot = mode === 'end' ? el.closest('footer') : null, mark = (foot && foot.lastElementChild) || el, need = mark === el ? 0.6 : 0.9;
      const io = new IntersectionObserver(([en]) => { if (!en.isIntersecting || en.intersectionRatio < need) return; io.disconnect();
        setTimeout(() => { if (!touched && target !== 1 && el.offsetParent && el.dataset.auto !== 'off') go(1); }, mark === el ? 420 : 300); }, { threshold: need });
      io.observe(mark);
    }
    const api = { el, toggle, open: () => go(1), close: () => go(0), refresh: () => { measure(); draw(); },
      set(val) { if (raf) { cancelAnimationFrame(raf); raf = 0; last = 0; } p = clamp(val, 0, 1); v = 0; target = p > 0.5 ? 1 : 0; draw(); settle(); },
      replay() { touched = true; this.set(0); setTimeout(() => go(1), 260); } };
    el.__fold = api; all.push(api); return api;
  }

  window.FoldCard = { all, mount, TUNE, init(sel) { document.querySelectorAll(sel || '[data-fold]').forEach(mount); return all; }, tune(o) { Object.assign(TUNE, o); all.forEach((c) => c.refresh()); } };
  window.FoldCard.init();
})();
