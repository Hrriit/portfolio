(() => {
  const main = document.querySelector('main.case'); if (!main || !document.body) return;
  const back = main.querySelector('.case-back');
  if (back) back.addEventListener('click', (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || history.length < 2) return;
    let from = null; try { from = new URL(document.referrer); } catch (err) { return; }
    if (from.origin !== location.origin || !/(^|\/)(index\.html)?$/.test(from.pathname)) return;
    e.preventDefault();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { history.back(); return; }
    document.documentElement.classList.add('pt-out'); setTimeout(() => history.back(), 160);
  });
  const calm = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover:hover) and (pointer:fine)');
  const compact = matchMedia('(max-width:960px)');
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const slug = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const icon = (d) => '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';

  const items = []; let lastNum = '';
  main.querySelectorAll('.sec, .sub').forEach((block) => {
    if (getComputedStyle(block).display === 'none') return;
    const intro = block.querySelector(':scope > .sec-intro'); if (!intro) return;
    const label = intro.querySelector(':scope > .mono'), h = intro.querySelector('h2, h3'); if (!label || !h) return;
    const parts = label.textContent.split('·').map((s) => s.trim()).filter(Boolean), sub = block.classList.contains('sub');
    const num = !sub && /^\d+$/.test(parts[0] || '') ? parts[0] : '', title = (block.dataset.toc || parts[parts.length - 1] || h.textContent).trim();
    if (!h.id) { const up = sub ? block.closest('.sec') : null, uh = up && up.querySelector('.sec-intro h2'); h.id = (uh && uh.id ? uh.id + '-' : '') + slug(title); }
    if (num) lastNum = num;
    items.push({ block, id: h.id, num, title, sub, pnum: num || lastNum });
  });
  if (items.length < 2) return;

  const toc = document.createElement('nav'); toc.className = 'toc'; toc.setAttribute('aria-label', 'On this page');
  const now = document.createElement('button'); now.type = 'button'; now.className = 'toc-now glass'; now.setAttribute('aria-expanded', 'false');
  now.innerHTML = '<svg class="ring" viewBox="0 0 20 20" aria-hidden="true"><circle class="track" cx="10" cy="10" r="8.75"/><circle class="bar" cx="10" cy="10" r="3.25" pathLength="100" stroke-dashoffset="100"/></svg>'
                + '<span class="lbl"><span class="now-n"></span><span class="now-t">Contents</span></span>' + icon('M4 6.5 8 10.5l4-4').replace('<svg ', '<svg class="chev" ');
  toc.appendChild(now);
  const nowN = now.querySelector('.now-n'), nowT = now.querySelector('.now-t'), nowBar = now.querySelector('.bar');
  const pill = document.createElement('div'); pill.className = 'toc-pill glass'; toc.appendChild(pill);
  const ol = document.createElement('ol');
  items.forEach((it) => {
    const li = document.createElement('li'); if (it.sub) li.className = 'sub';
    const a = document.createElement('a'); a.href = '#' + it.id; a.innerHTML = '<i class="k" aria-hidden="true"></i><span class="n">' + it.num + '</span><span class="t"></span>'; a.querySelector('.t').textContent = it.title;
    a.addEventListener('click', (e) => { e.preventDefault(); go(it); });
    li.appendChild(a); ol.appendChild(li); it.a = a;
  });
  const mark = document.createElement('i'); mark.className = 'toc-mark'; mark.setAttribute('aria-hidden', 'true'); ol.appendChild(mark);
  pill.appendChild(ol);
  const foot = document.createElement('div'); foot.className = 'toc-foot';
  foot.innerHTML = '<button type="button" class="toc-top"><i class="k" aria-hidden="true"></i><span class="n">' + icon('M8 13V3M3.5 7.5 8 3l4.5 4.5') + '</span><span class="t">Back to top</span></button>'
                 + '<button type="button" class="toc-side">' + icon('M2.5 5.5h11m-3-3 3 3-3 3M13.5 10.5h-11m3-3-3 3 3 3') + '</button>';
  pill.appendChild(foot);
  const topBtn = foot.querySelector('.toc-top'), sideBtn = foot.querySelector('.toc-side');
  const upBtn = document.createElement('button'); upBtn.type = 'button'; upBtn.className = 'toc-up glass'; upBtn.setAttribute('aria-label', 'Back to top'); upBtn.innerHTML = icon('M8 13V3M3.5 7.5 8 3l4.5 4.5'); toc.appendChild(upBtn);
  document.body.appendChild(toc);
  const measure = () => { const was = toc.classList.contains('is-open'); toc.classList.add('is-measure', 'is-open'); toc.style.setProperty('--toc-open', Math.min(300, Math.ceil(toc.scrollWidth) + 2) + 'px'); if (!was) toc.classList.remove('is-open'); toc.classList.remove('is-measure'); };
  measure(); addEventListener('resize', measure); if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  const setSide = (s) => { toc.dataset.side = s; sideBtn.setAttribute('aria-label', 'Move this bar to the ' + (s === 'left' ? 'right' : 'left')); sideBtn.title = sideBtn.getAttribute('aria-label'); };
  setSide(store.get('toc-side') === 'left' ? 'left' : 'right');
  const flip = () => { const s = toc.dataset.side === 'left' ? 'right' : 'left'; setSide(s); store.set('toc-side', s); };
  sideBtn.addEventListener('click', flip);
  if (fine.matches) {
    let d = null;
    toc.addEventListener('pointerdown', (e) => { if (e.button !== 0 || compact.matches || e.target.closest('a, button')) return; d = { x: e.clientX, id: e.pointerId, on: false }; });
    toc.addEventListener('pointermove', (e) => {
      if (!d || e.pointerId !== d.id) return; const dx = e.clientX - d.x;
      if (!d.on) { if (Math.abs(dx) < 6) return; d.on = true; toc.setPointerCapture(e.pointerId); toc.classList.add('is-drag'); }
      toc.style.translate = dx + 'px -50%';
    });
    const drop = (e) => {
      if (!d || e.pointerId !== d.id) return; const was = d; d = null; if (!was.on) return;
      const r = toc.getBoundingClientRect(), mid = r.left + r.width / 2, cross = toc.dataset.side === 'right' ? mid < innerWidth / 2 : mid > innerWidth / 2;
      toc.classList.remove('is-drag');
      if (cross) { flip(); const n = toc.getBoundingClientRect(); toc.style.transition = 'none'; toc.style.translate = (r.left - n.left) + 'px -50%'; void toc.offsetWidth; }
      toc.style.transition = ''; toc.style.translate = '';
    };
    toc.addEventListener('pointerup', drop); toc.addEventListener('pointercancel', drop);
  }

  const pinned = document.documentElement.dataset.toc === 'open';
  const kb = () => !!toc.querySelector(':focus-visible');
  let byKb = false;
  const open = (on) => { if (pinned && !compact.matches) on = true; toc.classList.toggle('is-open', on); now.setAttribute('aria-expanded', String(on));
    if (!on) { byKb = false; if (toc.contains(document.activeElement) && document.activeElement !== now) document.activeElement.blur(); } };
  if (pinned && !compact.matches) open(true);
  compact.addEventListener('change', () => open(pinned && !compact.matches));
  now.addEventListener('click', () => open(!toc.classList.contains('is-open')));
  toc.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !compact.matches) open(true); });
  toc.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !compact.matches && !kb()) open(false); });
  toc.addEventListener('focusin', () => requestAnimationFrame(() => { if (kb() && !compact.matches) { byKb = true; open(true); } }));
  toc.addEventListener('focusout', () => requestAnimationFrame(() => { if (toc.contains(document.activeElement)) return; if (compact.matches || (byKb && !toc.matches(':hover'))) open(false); }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && toc.classList.contains('is-open')) open(false); });
  if (!fine.matches) {
    const hit = document.createElement('button'); hit.type = 'button'; hit.className = 'toc-hit'; hit.setAttribute('aria-label', 'Sections of this page'); toc.appendChild(hit);
    hit.addEventListener('click', () => open(true));
  }
  let swallow = 0;
  document.addEventListener('pointerdown', (e) => { if (!(compact.matches || !fine.matches) || toc.contains(e.target)) return;
    if (compact.matches && toc.classList.contains('is-open')) swallow = Date.now(); open(false); }, { passive: true });
  addEventListener('click', (e) => { if (swallow && Date.now() - swallow < 600) { e.preventDefault(); e.stopPropagation(); } swallow = 0; }, true);

  const layoutTop = (n) => { let y = 0; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };
  const page = document.scrollingElement || document.documentElement;
  let current = null, held = null, holdT = 0, raf = 0;
  const setCurrent = (it) => { if (it === current) return; if (current) current.a.removeAttribute('aria-current'); current = it; if (it) it.a.setAttribute('aria-current', 'location');
    nowN.textContent = it ? it.pnum : ''; nowT.textContent = it ? it.title : 'Contents'; now.setAttribute('aria-label', 'Sections of this page' + (it ? '. Now: ' + it.title : '')); };
  now.setAttribute('aria-label', 'Sections of this page');
  const centre = (it) => it.a.offsetTop + it.a.offsetHeight / 2 - 1;
  const slide = (y) => {
    let i = -1; for (let k = 0; k < items.length; k++) if (layoutTop(items[k].block) <= y) i = k;
    let pos;
    if (i < 0) pos = centre(items[0]);
    else { const a = layoutTop(items[i].block), b = i + 1 < items.length ? layoutTop(items[i + 1].block) : Math.max(a + 1, page.scrollHeight - innerHeight + Math.max(160, innerHeight * 0.38));
           const f = Math.min(1, Math.max(0, (y - a) / (b - a))); const c0 = centre(items[i]), c1 = i + 1 < items.length ? centre(items[i + 1]) : c0 + 10; pos = c0 + f * (c1 - c0); }
    mark.style.setProperty('--y', pos.toFixed(1) + 'px'); };
  const spy = () => { raf = 0; let cur = held; const y = scrollY + Math.max(160, innerHeight * 0.38);
    if (!cur) { for (const it of items) if (layoutTop(it.block) <= y) cur = it;
      if (scrollY + innerHeight >= page.scrollHeight - 2) cur = items[items.length - 1]; }
    setCurrent(cur); slide(y);
    const max = page.scrollHeight - innerHeight; nowBar.setAttribute('stroke-dashoffset', (100 - 100 * (max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0)).toFixed(1)); };
  const ask = () => { if (!raf) raf = requestAnimationFrame(spy); };
  addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); addEventListener('load', () => { ask(); setTimeout(ask, 900); }); ask();
  const go = (it) => { held = it; clearTimeout(holdT); holdT = setTimeout(() => { held = null; ask(); }, 1500);
    it.block.scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth', block: 'start' });
    try { history.replaceState(null, '', '#' + it.id); } catch (e) {}
    if (!fine.matches || compact.matches) open(false); ask(); };
  addEventListener('scrollend', () => { if (held) { held = null; ask(); } });
  if (fine.matches && !calm.matches && !pinned) {
    const peek = () => setTimeout(() => { if (compact.matches || toc.matches(':hover') || toc.classList.contains('is-open')) return; open(true);
      setTimeout(() => { if (!toc.matches(':hover') && !kb()) open(false); }, 1600); }, 700);
    if (document.readyState === 'complete') peek(); else addEventListener('load', peek, { once: true });
  }

  const toTop = () => { held = null; scrollTo({ top: 0, behavior: calm.matches ? 'auto' : 'smooth' }); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} if (!fine.matches || compact.matches) open(false); };
  topBtn.addEventListener('click', toTop); upBtn.addEventListener('click', toTop);
  const end = main.querySelector('.next') || document.querySelector('.site-foot');
  if (end && window.IntersectionObserver) new IntersectionObserver((es) => toc.classList.toggle('is-end', es[0].isIntersecting)).observe(end); else toc.classList.add('is-end');
})();
