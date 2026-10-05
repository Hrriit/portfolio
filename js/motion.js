(() => {
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const mem = { set(k, v) { try { sessionStorage.setItem(k, v); return true; } catch (e) { return false; } } };
  let px = -1, py = -1;

  document.addEventListener('touchstart', () => {}, { passive: true });
  const OUT_MS = 160;
  const pageLink = (a) => {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return null;
    const raw = a.getAttribute('href') || ''; if (!raw || raw.charAt(0) === '#') return null;
    let url; try { url = new URL(a.href, location.href); } catch (e) { return null; }
    if (url.protocol !== location.protocol || url.host !== location.host) return null;
    if (url.pathname === location.pathname) return null;
    return /(\.html?|\/)$/i.test(url.pathname) ? url : null;
  };
  let leaving = false, wasCurrent = null;
  document.addEventListener('click', (e) => {
    if (leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || calm.matches) return;
    const a = e.target.closest ? e.target.closest('a[href]') : null, url = pageLink(a); if (!url) return;
    e.preventDefault(); leaving = true;
    const tab = [...document.querySelectorAll('.tabbar .links a')].find((l) => { const u = pageLink(l); return u && u.pathname === url.pathname; });
    if (tab) { wasCurrent = document.querySelector('.tabbar .links a[aria-current]'); if (wasCurrent) wasCurrent.removeAttribute('aria-current'); tab.setAttribute('aria-current', 'page'); }
    const noted = mem.set('pt', JSON.stringify({ t: Date.now(), x: px, y: py, h: url.hash || '' }));
    const href = noted && url.hash ? url.href.slice(0, url.href.length - url.hash.length) : url.href;
    root.classList.add('pt-out');
    setTimeout(() => { location.href = href; }, OUT_MS);
  });
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest ? e.target.closest('a[href]') : null, url = pageLink(a); if (!url || a.dataset.warm || location.protocol === 'file:') return;
    a.dataset.warm = '1'; const l = document.createElement('link'); l.rel = 'prefetch'; l.href = url.href; document.head.appendChild(l);
  }, { passive: true });
  addEventListener('pageshow', (e) => { if (!e.persisted) return;
    leaving = false; root.classList.remove('pt-out'); const now = document.querySelector('.tabbar .links a[aria-current]');
    if (wasCurrent && now !== wasCurrent) { if (now) now.removeAttribute('aria-current'); wasCurrent.setAttribute('aria-current', 'page'); } });
  const spot = (h) => { try { return h && h.length > 1 ? document.getElementById(decodeURIComponent(h.slice(1))) : null; } catch (e) { return null; } };
  let theirs = false; ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, () => { theirs = true; }, { once: true, passive: true }));
  const layoutTop = (n) => { let y = 0; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };
  const align = (el) => { if (theirs) return; const was = root.style.scrollBehavior; root.style.scrollBehavior = 'auto'; scrollTo(0, Math.max(0, layoutTop(el) - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0))); root.style.scrollBehavior = was; };
  const keepAligned = (el) => { align(el); requestAnimationFrame(() => align(el)); addEventListener('load', () => { align(el); requestAnimationFrame(() => align(el)); }, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => align(el)); setTimeout(() => align(el), 950); };
  const pt = window.__pt;
  if (pt && pt.h) {
    const el = spot(pt.h); if (el) { keepAligned(el); try { history.replaceState(null, '', pt.h); } catch (e) {} }
    root.classList.remove('pt-hold'); root.classList.add('pt-in');
  } else if (location.hash.length > 1) { const el = spot(location.hash); if (el) keepAligned(el); }
  if (root.classList.contains('pt-in')) setTimeout(() => root.classList.remove('pt-in'), 900);

  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || calm.matches) return;
  const moon = document.createElement('div'); moon.className = 'cursor-moon'; moon.setAttribute('aria-hidden', 'true');
  moon.innerHTML = '<div class="cursor-moon-disc"><svg viewBox="0 0 12 12"><defs><mask id="cursor-moon-mask" maskUnits="userSpaceOnUse" x="-1" y="-1" width="14" height="14"><rect x="-1" y="-1" width="14" height="14" fill="#fff"/><circle class="cursor-moon-cut" cx="3.96" cy="6" r="5" fill="#000"/></mask></defs><circle cx="6" cy="6" r="6" fill="var(--moon, #FFF15C)" mask="url(#cursor-moon-mask)"/></svg><span class="cursor-moon-label"></span></div>';
  document.body.appendChild(moon);
  const label = moon.querySelector('.cursor-moon-label');
  const CLICKABLE = '[data-cursor], a[href], button, summary, label, select, input, [role="button"], [tabindex]:not([tabindex="-1"]):not([data-grab])';
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, last = 0, on = false, over = null;

  const frame = (now) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60; last = now;
    const k = 1 - Math.pow(1 - 0.24, dt * 60); x += (tx - x) * k; y += (ty - y) * k;
    moon.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    if (Math.abs(tx - x) + Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; }
  };
  const read = (el) => {
    const hit = el && el.closest ? el.closest(CLICKABLE) : null; if (hit === over) return; over = hit;
    const zone = hit && hit.closest('[data-cursor]'), words = zone ? (zone.dataset.cursor || '').trim() : '';
    if (words) label.textContent = words;
    moon.classList.toggle('is-full', !!hit); moon.classList.toggle('is-link', !!hit && !words); moon.classList.toggle('is-label', !!words);
  };
  const place = (cx, cy, target) => {
    tx = px = cx; ty = py = cy;
    if (!on) { on = true; x = tx; y = ty; moon.classList.add('is-on'); root.classList.add('has-moon'); }
    read(target); if (!raf) raf = requestAnimationFrame(frame);
  };
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') place(e.clientX, e.clientY, e.target); }, { passive: true });
  addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { on = false; moon.classList.remove('is-on'); root.classList.remove('has-moon'); } else { moon.classList.add('is-down'); if (!e.button && e.target instanceof Element && e.target.closest('[data-grab]')) moon.classList.add('is-grab'); } }, { passive: true });
  ['pointerup', 'pointercancel'].forEach((ev) => addEventListener(ev, () => moon.classList.remove('is-down', 'is-grab'), { passive: true }));
  addEventListener('scroll', () => { if (on) read(document.elementFromPoint(tx, ty)); }, { passive: true });
  document.addEventListener('mouseleave', () => { on = false; over = null; moon.classList.remove('is-on'); });
  const from = window.__pt; if (from && from.x >= 0 && from.y >= 0) place(from.x, from.y, document.elementFromPoint(from.x, from.y));
})();
