(() => {
  const thumbs = [...document.querySelectorAll('.fig:not(.no-zoom) img, .hero img')];
  if (!thumbs.length || typeof HTMLDialogElement === 'undefined' || !('showModal' in HTMLDialogElement.prototype)) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ICON = { x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
                 zi: '<svg class="in" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8M10.5 7.5v6M7.5 10.5h6"/></svg>',
                 zo: '<svg class="out" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8M7.5 10.5h6"/></svg>',
                 l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
                 r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 5.5 6.5 6.5-6.5 6.5"/></svg>' };
  const dlg = document.createElement('dialog');
  dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Picture viewer');
  const many = thumbs.length > 1;
  dlg.innerHTML = `<div class="lb-step glass">${many ? `<button class="lb-nav lb-prev" type="button" aria-label="Previous picture">${ICON.l}</button>` : ''}<p class="lb-count mono" aria-live="polite"></p>${many ? `<button class="lb-nav lb-next" type="button" aria-label="Next picture">${ICON.r}</button>` : ''}</div>` +
    `<div class="lb-tools glass"><button class="lb-zoom" type="button" aria-label="Actual size" aria-pressed="false">${ICON.zi}${ICON.zo}</button><button class="lb-x" type="button" aria-label="Close">${ICON.x}</button></div>` +
    `<div class="lb-scroll"><figure class="lb-fig"><img class="lb-img" alt="" decoding="async"><figcaption class="lb-cap"></figcaption></figure></div>`;
  document.body.appendChild(dlg);
  const big = dlg.querySelector('.lb-img'), cap = dlg.querySelector('.lb-cap'), count = dlg.querySelector('.lb-count'), pane = dlg.querySelector('.lb-scroll'), xBtn = dlg.querySelector('.lb-x'), zBtn = dlg.querySelector('.lb-zoom');
  const html = document.documentElement;
  let i = -1, busy = false;

  const plateOf = (t) => { const f = t.closest('.fig, .hero'); const has = (c) => t.classList.contains(c) || (f && f.classList.contains(c)); return has('ink') ? 'ink' : has('paper') ? 'paper' : ''; };
  const captionOf = (t) => { const c = t.closest('figure') && t.closest('figure').querySelector('figcaption'); return (c ? c.textContent : t.alt || '').trim(); };
  const ready = (fn) => { if (big.complete && big.naturalWidth) fn(); else big.addEventListener('load', fn, { once: true }); };
  const fitCheck = () => {
    const w = Math.min(big.naturalWidth || 0, 3200), shown = big.offsetWidth;
    dlg.classList.toggle('can-1x', !!shown && w > shown + 48); big.style.setProperty('--w', w + 'px');
  };
  const show = (n) => {
    i = (n + thumbs.length) % thumbs.length; const t = thumbs[i];
    dlg.classList.remove('is-1x', 'can-1x'); zBtn.setAttribute('aria-pressed', 'false'); pane.scrollTo(0, 0);
    dlg.classList.remove('paper', 'ink'); const p = plateOf(t); if (p) dlg.classList.add(p);
    big.alt = t.alt || ''; cap.textContent = captionOf(t); cap.hidden = !cap.textContent;
    count.textContent = many ? `${i + 1} / ${thumbs.length}` : '';
    if (big.src !== (t.currentSrc || t.src)) big.src = t.currentSrc || t.src;
    if (dlg.open) ready(fitCheck);
  };
  const flip = (t, into) => {
    const a = t.getBoundingClientRect(), b = big.getBoundingClientRect(); if (!a.width || !b.width) return false;
    const tf = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
    if (into) { big.style.transition = 'none'; big.style.transform = tf; void big.offsetWidth; big.style.transition = 'transform .38s cubic-bezier(.2,.8,.2,1)'; big.style.transform = 'none'; }
    else { big.style.transition = 'transform .24s cubic-bezier(.4,0,.7,1)'; big.style.transform = tf; }
    return true;
  };
  const open = (n) => {
    if (dlg.open) return; show(n);
    html.classList.add('lb-open'); dlg.showModal(); xBtn.focus({ preventScroll: true }); ready(fitCheck);
    if (calm.matches) return;
    ready(() => requestAnimationFrame(() => { if (flip(thumbs[i], true)) big.addEventListener('transitionend', () => { big.style.transition = ''; big.style.transform = ''; }, { once: true }); }));
  };
  const close = () => {
    if (!dlg.open || busy) return; busy = true; const t = thumbs[i];
    const done = () => { dlg.classList.remove('is-closing'); dlg.close(); html.classList.remove('lb-open'); big.style.transition = ''; big.style.transform = ''; busy = false; t.focus({ preventScroll: true }); };
    if (calm.matches) return done();
    t.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    dlg.classList.add('is-closing'); const moved = !dlg.classList.contains('is-1x') && flip(t, false); setTimeout(done, moved ? 230 : 180);
  };

  thumbs.forEach((t, n) => {
    t.setAttribute('tabindex', '0'); t.setAttribute('role', 'button'); t.setAttribute('aria-haspopup', 'dialog'); t.dataset.zoom = '';
    t.addEventListener('click', (e) => { e.preventDefault(); open(n); });
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(n); } });
  });
  xBtn.addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target === pane || e.target.classList.contains('lb-fig')) close(); });
  const prev = dlg.querySelector('.lb-prev'), next = dlg.querySelector('.lb-next');
  if (prev) { prev.addEventListener('click', () => show(i - 1)); next.addEventListener('click', () => show(i + 1)); }
  dlg.addEventListener('keydown', (e) => {
    if (busy) return;
    if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); show(i - 1); }
    else if (e.key === 'ArrowRight' && prev) { e.preventDefault(); show(i + 1); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(true); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoom(false); }
  });
  const zoom = (on) => {
    if (!dlg.classList.contains('can-1x')) return;
    const was = dlg.classList.contains('is-1x'); if (on === undefined) on = !was; if (on === was) return;
    dlg.classList.toggle('is-1x', on); zBtn.setAttribute('aria-pressed', String(on));
    if (on) pane.scrollTo({ left: (pane.scrollWidth - pane.clientWidth) / 2, top: (pane.scrollHeight - pane.clientHeight) / 2, behavior: 'instant' }); else pane.scrollTo(0, 0);
  };
  zBtn.addEventListener('click', () => zoom());
  let drag = null;
  big.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; drag = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false, id: e.pointerId };
    if (dlg.classList.contains('is-1x') && e.pointerType !== 'touch') { big.setPointerCapture(e.pointerId); dlg.classList.add('is-drag'); e.preventDefault(); }
  });
  big.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.moved = true;
    if (dlg.classList.contains('is-drag')) { pane.scrollBy(-(e.clientX - (drag.lx ?? drag.x)), -(e.clientY - (drag.ly ?? drag.y))); drag.lx = e.clientX; drag.ly = e.clientY; }
  });
  const endDrag = (e) => { if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null; dlg.classList.remove('is-drag');
    if (e.type === 'pointerup' && !d.moved && Date.now() - d.t < 600) close(); };
  big.addEventListener('pointerup', endDrag); big.addEventListener('pointercancel', endDrag);
  big.addEventListener('dragstart', (e) => e.preventDefault());
  let sx = 0, sy = 0, swiping = false;
  pane.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch' || dlg.classList.contains('is-1x')) return; sx = e.clientX; sy = e.clientY; swiping = true; });
  pane.addEventListener('pointerup', (e) => {
    if (!swiping) return; swiping = false; const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (prev) show(i + (dx < 0 ? 1 : -1)); }
    else if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
  });
  pane.addEventListener('pointercancel', () => { swiping = false; });
  window.addEventListener('pageshow', (e) => { if (e.persisted && dlg.open) { dlg.close(); html.classList.remove('lb-open'); busy = false; } });
})();
