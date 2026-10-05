(() => {
  const root = document.documentElement;
  const EMAIL = 'harriet.xu01@gmail.com';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

  (() => { if (!matchMedia('(hover:hover) and (pointer:fine) and (forced-colors:none)').matches || !document.body) return;
    const page = document.scrollingElement || root, bar = document.createElement('div'), thumb = document.createElement('div');
    bar.className = 'sb'; bar.setAttribute('aria-hidden', 'true'); thumb.className = 'sb-thumb'; bar.appendChild(thumb); document.body.appendChild(bar);
    let raf = 0, span = 0;
    const draw = () => { raf = 0; const vh = innerHeight, max = page.scrollHeight - vh; if (max < 4) { bar.classList.remove('is-on'); span = 0; return; }
      const th = Math.max(48, Math.round(vh * vh / page.scrollHeight)); span = vh - th; thumb.style.height = th + 'px';
      thumb.style.transform = 'translateY(' + (span * Math.min(1, Math.max(0, page.scrollTop / max))).toFixed(1) + 'px)'; bar.classList.add('is-on'); };
    const ask = () => { if (!raf) raf = requestAnimationFrame(draw); };
    addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); addEventListener('load', () => { ask(); setTimeout(ask, 900); });
    if (window.ResizeObserver) new ResizeObserver(ask).observe(document.body); ask();
    let y0 = 0, s0 = 0;
    thumb.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); thumb.setPointerCapture(e.pointerId); y0 = e.clientY; s0 = page.scrollTop; bar.classList.add('is-drag'); root.style.scrollBehavior = 'auto'; });
    thumb.addEventListener('pointermove', (e) => { if (!span || !bar.classList.contains('is-drag')) return; page.scrollTop = s0 + (e.clientY - y0) * (page.scrollHeight - innerHeight) / span; });
    const drop = () => { if (!bar.classList.contains('is-drag')) return; bar.classList.remove('is-drag'); root.style.scrollBehavior = ''; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => thumb.addEventListener(ev, drop));
  })();

  const themeBtn = document.getElementById('theme');
  const paintBtn = () => { if (!themeBtn) return; themeBtn.setAttribute('aria-label', 'Switch to ' + (root.dataset.theme === 'dark' ? 'light' : 'dark') + ' mode'); };
  const flip = () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; store.set('theme', root.dataset.theme); paintBtn();
    if (window.HXMark) HXMark.repaint();
    dispatchEvent(new CustomEvent('themechange')); };
  if (themeBtn) themeBtn.addEventListener('click', () => {
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return flip();
    const r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, R = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)));
    root.classList.add('theme-wipe');
    const vt = document.startViewTransition(flip);
    vt.ready.then(() => root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 700, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    vt.finished.then(() => root.classList.remove('theme-wipe'), () => root.classList.remove('theme-wipe'));
  });
  paintBtn();

  const glasses = [...document.querySelectorAll('.glass')]; let gxRaf = 0;
  if (glasses.length) addEventListener('pointermove', (e) => { if (gxRaf) return; gxRaf = requestAnimationFrame(() => { gxRaf = 0; for (const g of glasses) { const r = g.getBoundingClientRect(); g.style.setProperty('--gx', Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)) + '%'); } }); }, { passive: true });

  if (window.__pt) document.querySelectorAll('.tabbar .hx-mark, .who .hx-mark').forEach((m) => { m.dataset.draw = 'off'; });
  if (window.HXMark) HXMark.init('.hx-mark');
  document.querySelectorAll('[data-replay]').forEach((b) => b.addEventListener('click', () => { const m = b.querySelector('.hx-mark'); if (m && window.HXMark) HXMark.replay(m); }));

  let toast = null, toastTimer = 0;
  const say = (html) => {
    if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); }
    toast.innerHTML = html; requestAnimationFrame(() => toast.setAttribute('data-show', ''));
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.removeAttribute('data-show'), 4200);
  };

  document.querySelectorAll('[data-contact]').forEach((a) => a.addEventListener('click', () => {
    const done = (copied) => say('Opening your mail app. ' + (copied ? 'Address copied too: ' : 'Or write to ') + '<b>' + EMAIL + '</b>');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(EMAIL).then(() => done(true), () => done(false)); else done(false);
  }));

  const DIR = 'assets/img/about/', EXT = ['webp', 'jpg', 'jpeg', 'png', 'svg'];
  const shape = {};
  const probe = (name, dir, exts) => new Promise((resolve) => { const E = exts || EXT; let i = 0; const next = () => { if (i >= E.length) return resolve(null); const src = (dir || DIR) + name + '.' + E[i++], im = new Image(); im.onload = () => { if (im.naturalHeight) shape[src] = im.naturalWidth / im.naturalHeight; resolve(src); }; im.onerror = next; im.src = src; }; next(); });
  const captions = window.ABOUT_CAPTIONS || {};

  document.querySelectorAll('.slot[data-photo]').forEach((slot) => {
    const name = slot.dataset.photo; slot.dataset.file = name + '.jpg';
    probe(name).then((src) => { if (!src) { slot.classList.add('is-empty'); return; }
      const im = new Image(); im.src = src; im.alt = slot.dataset.alt || captions[name] || ''; im.loading = 'lazy'; im.decoding = 'async'; slot.appendChild(im); slot.classList.add('has-photo'); });
  });
  const twoTone = (first, name, dir, exts) => probe(name + '-dark', dir, exts).then((src) => { if (!src) return; const im = first.cloneNode(); im.src = src; first.classList.add('light-only'); im.classList.add('dark-only'); first.after(im); });
  document.querySelectorAll('.org-logo[data-photo]').forEach((box) => probe(box.dataset.photo).then((src) => { if (!src) return; const im = new Image(); im.src = src; im.alt = ''; box.replaceChildren(im); box.classList.add('has-photo'); twoTone(im, box.dataset.photo); }));

  const reel = document.querySelector('.reel[data-photos]');
  if (reel) (async () => {
    const prefix = reel.dataset.photos, max = parseInt(reel.dataset.max || '12', 10), track = reel.querySelector('.reel-track'), dots = reel.querySelector('.reel-dots'), cap = reel.querySelector('.reel-cap');
    const found = [];
    for (let n = 1; n <= max; n++) { const name = prefix + '-' + String(n).padStart(2, '0'), src = await probe(name); if (!src) break; found.push({ name, src }); }
    if (!found.length) { reel.classList.add('is-empty'); return; }
    track.replaceChildren(); reel.classList.add('has-photo');
    found.forEach((p, i) => { const fig = document.createElement('figure'), im = new Image(); im.src = p.src; im.alt = captions[p.name] || ''; im.decoding = 'async'; if (i) im.loading = 'lazy'; fig.appendChild(im); track.appendChild(fig);
      const d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', 'Photo ' + (i + 1) + ' of ' + found.length); d.addEventListener('click', () => go(i)); dots.appendChild(d); });
    let at = 0;
    const show = (i) => { at = i; [...dots.children].forEach((d, k) => d.toggleAttribute('aria-current', k === i)); cap.textContent = captions[found[i].name] || ''; reel.querySelector('[data-dir="-1"]').disabled = i === 0; reel.querySelector('[data-dir="1"]').disabled = i === found.length - 1; };
    const go = (i) => { i = Math.max(0, Math.min(found.length - 1, i)); track.scrollTo({ left: track.children[i].offsetLeft - track.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); show(i); };
    reel.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => go(at + parseInt(b.dataset.dir, 10))));
    track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); go(at + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(at - 1); } });
    let settle = 0; track.addEventListener('scroll', () => { clearTimeout(settle); settle = setTimeout(() => show(Math.round(track.scrollLeft / track.clientWidth)), 90); }, { passive: true });
    if (found.length < 2) reel.classList.add('is-single');
    show(0);
  })();

  const TOOL_EXT = ['png', 'svg', 'webp'];
  document.querySelectorAll('.tool[data-tool]').forEach((li) => {
    probe(li.dataset.tool, DIR, TOOL_EXT).then((src) => { if (!src) return;
      const im = new Image(); im.src = src; im.alt = ''; im.decoding = 'async'; li.prepend(im); li.classList.add('has-photo'); twoTone(im, li.dataset.tool, DIR, TOOL_EXT); });
  });

  const strip = document.querySelector('.strip');
  if (strip) (async () => {
    const nav = document.querySelector('.strip-nav'), calm = matchMedia('(prefers-reduced-motion: reduce)');
    const put = (fig, src) => { const im = new Image(); im.decoding = 'async'; im.draggable = false; im.alt = fig.dataset.alt || captions[fig.dataset.photo] || fig.querySelector('figcaption').textContent; im.src = src;
      if (shape[src]) { fig.dataset.ar = Math.max(0.55, Math.min(1.5, shape[src])).toFixed(4); fig.style.setProperty('--ar', fig.dataset.ar); } fig.querySelector('.ph').appendChild(im); fig.classList.remove('is-empty'); fig.classList.add('has-photo'); };
    await Promise.all([...strip.querySelectorAll('figure[data-photo]')].map(async (fig) => {
      const name = fig.dataset.photo; fig.querySelector('.ph').dataset.file = name + '.jpg';
      const src = await probe(name); if (!src) { fig.classList.add('is-empty'); return; }
      put(fig, src);
      for (let n = 2, last = fig; n <= 4; n++) { const more = await probe(name + '-' + n); if (!more) break; const twin = fig.cloneNode(true); twin.querySelector('.ph').replaceChildren(); twin.dataset.photo = name + '-' + n; last.after(twin); put(twin, more); last = twin; }
    }));

    const originals = [...strip.children]; let loopW = 0;
    const shownSet = () => originals.filter((f) => f.offsetParent !== null);
    const measure = () => { const copy = [...strip.querySelectorAll('[data-clone]')].find((f) => f.offsetParent !== null), first = shownSet()[0]; loopW = copy && first ? copy.offsetLeft - first.offsetLeft : 0; };
    const buildLoop = () => { if (!strip.querySelector('[data-clone]')) { if (strip.scrollWidth - strip.clientWidth < 8) return;
        originals.forEach((f) => { const c = f.cloneNode(true); c.dataset.clone = ''; c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('img').forEach((im) => { im.alt = ''; }); strip.appendChild(c); }); }
      measure(); };
    const sync = () => { strip.dataset.more = loopW ? ((strip.scrollLeft > 8 || strip.dataset.moved ? 'l ' : '') + 'r') : ''; if (nav) nav.hidden = !loopW; strip.classList.toggle('can-grab', loopW > 0); };
    const smooth = () => (calm.matches ? 'auto' : 'smooth');
    if (nav) nav.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => { const d = parseInt(b.dataset.dir, 10) * Math.max(200, strip.clientWidth * 0.6); let x = strip.scrollLeft;
      if (loopW) { if (d < 0 && x + d < 0) strip.scrollLeft = x + loopW; else if (d > 0 && x + d > strip.scrollWidth - strip.clientWidth) strip.scrollLeft = x - loopW; }
      strip.scrollBy({ left: d, behavior: smooth() }); }));
    let settle = 0, grab = null;
    strip.addEventListener('scroll', () => { sync(); clearTimeout(settle); settle = setTimeout(() => { if (!loopW || grab) return; const x = strip.scrollLeft; if (x > loopW) strip.scrollLeft = x - loopW; else if (x <= 0 && strip.dataset.touched) strip.scrollLeft = loopW; }, 140); }, { passive: true });
    const refresh = () => { buildLoop(); sync(); }; addEventListener('resize', refresh); if (window.ResizeObserver) new ResizeObserver(refresh).observe(strip); refresh();

    const SPEED = 28, REST = 4000;
    const pauseBtn = nav && nav.querySelector('[data-strip-pause]');
    const ICON = { pause: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8M9 2v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>', play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 2.2v7.6L10 6z" fill="currentColor"/></svg>' };
    let pos = strip.scrollLeft, lastT = 0, rafD = 0, held = false, seen = false, stopped = false, quietUntil = performance.now() + 1500;
    const canDrift = () => loopW > 0 && !stopped && !held && seen && !document.hidden && !calm.matches;
    const drift = (now) => { rafD = 0; if (!canDrift()) { lastT = 0; return; }
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0; lastT = now;
      if (now >= quietUntil) { if (Math.abs(strip.scrollLeft - pos) > 2) pos = strip.scrollLeft;
        strip.style.scrollSnapType = 'none'; strip.dataset.moved = '1'; pos += SPEED * dt; if (pos >= loopW) pos -= loopW; strip.scrollLeft = pos; } else pos = strip.scrollLeft;
      rafD = requestAnimationFrame(drift); };
    const wake = () => { if (!rafD && canDrift()) rafD = requestAnimationFrame(drift); };
    const theirs = () => { strip.dataset.touched = '1'; strip.dataset.moved = '1'; strip.style.scrollSnapType = ''; quietUntil = performance.now() + REST; };
    ['touchstart', 'pointerdown', 'keydown'].forEach((ev) => strip.addEventListener(ev, theirs, { passive: true }));
    strip.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) theirs(); }, { passive: true });
    if (nav) nav.addEventListener('click', (e) => { if (e.target.closest('[data-dir]')) theirs(); });
    let rafG = 0;
    const wrap = (x) => { while (x < 0) { x += loopW; if (grab) grab.s0 += loopW; } while (x >= loopW) { x -= loopW; if (grab) grab.s0 -= loopW; } return x; };
    strip.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button || !loopW) return; cancelAnimationFrame(rafG); rafG = 0; strip.style.scrollSnapType = 'none';     grab = { id: e.pointerId, x0: e.clientX, s0: strip.scrollLeft, moved: false, lx: e.clientX, lt: performance.now(), v: 0 }; });
    strip.addEventListener('pointermove', (e) => { if (!grab || e.pointerId !== grab.id) return; const dx = e.clientX - grab.x0;
      if (!grab.moved) { if (Math.abs(dx) < 4) return; grab.moved = true; try { strip.setPointerCapture(grab.id); } catch (err) {} strip.classList.add('is-grab'); strip.style.scrollSnapType = 'none'; }
      strip.scrollLeft = wrap(grab.s0 - dx);
      const now = performance.now(); if (now > grab.lt) grab.v = 0.75 * (grab.lx - e.clientX) / (now - grab.lt) + 0.25 * grab.v; grab.lx = e.clientX; grab.lt = now; });
    const letGo = (e) => { if (!grab || (e && e.pointerId !== grab.id)) return; const g = grab; grab = null; strip.classList.remove('is-grab'); if (!g.moved) return;
      let v = performance.now() - g.lt < 90 && !calm.matches ? Math.max(-3, Math.min(3, g.v)) : 0, x = strip.scrollLeft, t0 = performance.now();
      const glide = (now) => { const dt = Math.min(now - t0, 40); t0 = now; x = wrap(x + v * dt); strip.scrollLeft = x; v *= Math.pow(0.95, dt / 16.7); quietUntil = performance.now() + REST; rafG = Math.abs(v) > 0.02 ? requestAnimationFrame(glide) : 0; };
      if (v) rafG = requestAnimationFrame(glide); };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => strip.addEventListener(ev, letGo));
    const stopGlide = () => { if (rafG) { cancelAnimationFrame(rafG); rafG = 0; } };
    ['touchstart', 'keydown', 'wheel'].forEach((ev) => strip.addEventListener(ev, stopGlide, { passive: true })); if (nav) nav.addEventListener('click', stopGlide);
    [strip, nav].forEach((el) => { if (!el) return; el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') held = true; }); el.addEventListener('pointerleave', () => { held = false; wake(); }); });
    strip.addEventListener('focusin', () => { held = strip.matches(':focus-visible'); }); strip.addEventListener('focusout', () => { held = false; wake(); });
    if (pauseBtn) { pauseBtn.innerHTML = ICON.pause; pauseBtn.hidden = calm.matches;
      pauseBtn.addEventListener('click', () => { stopped = !stopped; pauseBtn.innerHTML = stopped ? ICON.play : ICON.pause; pauseBtn.setAttribute('aria-label', stopped ? 'Let the photos move again' : 'Stop the photos moving'); wake(); }); }
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; wake(); }, { threshold: 0.2 }).observe(strip);
    document.addEventListener('visibilitychange', wake); calm.addEventListener('change', () => { if (pauseBtn) pauseBtn.hidden = calm.matches; wake(); });
  })();
})();
