(() => {
  const card = document.querySelector('.lab-card[data-exp="motion"]'), lab = document.getElementById('lab'); if (!card || !lab) return;
  const sheet = lab.querySelector('.lab-sheet'), stage = card.querySelector('.stage.motion'), calm = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = card) => r.querySelector(s), $$ = (s, r = card) => [...r.querySelectorAll(s)];

  const SPECS = {
    toggle:  { code: 'S02', name: 'Toggle thumb slide',        hint: 'Tap a segment, try 1 to 3',
               note: 'A one-step and a two-step move both take 100ms: duration never scales with distance. The thumb travels through the middle segment rather than cross-fading, and the labels change colour in the same 100ms so nothing is left half-tinted.',
               prop: 'transform: translateX()', dur: '100ms · instant', ease: 'ease-in-out · cubic-bezier(0.77, 0, 0.175, 1)' },
    stagger: { code: 'S04', name: 'List entrance, staggered',  hint: 'Watch the cards arrive · play it again',
               note: 'When a list first loads, each card rises 8px and fades in 50ms after the one before, so the group reads as arriving rather than popping. First entrance only, never on a tab return or a refresh. It is capped at eight items and must not block interaction.',
               prop: 'translateY(8px) → 0 + opacity', dur: '300ms · slower, 50ms apart', ease: 'ease-out · cubic-bezier(0.23, 1, 0.32, 1)' },
    swipe:   { code: 'S06', name: 'Swipe row actions',         hint: 'Drag a row to the left',
               note: 'While dragging, the row follows the pointer with no transition. A short drag snaps to an 80px reveal; past half the width, or a fast flick that also travelled 60px, deletes, and the row collapses at the same 200ms.',
               prop: 'transform, then height + margin', dur: '200ms · normal', ease: 'ease-out · cubic-bezier(0.23, 1, 0.32, 1)' },
    pull:    { code: 'S07', name: 'Pull to refresh',           hint: 'Pull the list down',
               note: 'The list moves half as far as the finger, so it gets heavier the further you pull. Release before 56px and it springs back; past it, the spinner runs while the fetch happens. It is the one motion that keeps going under reduced motion.',
               prop: 'translateY = drag × 0.5 · spinner rotate', dur: '250ms settle · 300ms per turn', ease: 'ease-out · linear' },
    toast:   { code: 'S13', name: 'Toast',                     hint: 'Press Save twice, quickly',
               note: 'It rises by its own height and fades, the only 400ms in the system. One persistent node, class-toggled: fire it again mid-flight and it retargets instead of restarting from zero.',
               prop: 'translateY(100%) → 0 + opacity', dur: '400ms · toast', ease: 'ease' },
    modal:   { code: 'S14', name: 'Modal',                     hint: 'Open it, then close it mid-way',
               note: 'The panel scales from .96 and fades while the scrim fades, both in 250ms, so they read as one surface. Visibility waits for the exit, which keeps the closed dialog click-proof without display:none killing the transition.',
               prop: 'scale(.96) → 1 + opacity · scrim opacity', dur: '250ms · slow', ease: 'ease-out · cubic-bezier(0.23, 1, 0.32, 1)' },
    sheet:   { code: 'S15', name: 'Slide-out · bottom sheet',  hint: 'Create → Next → Save · or drag the handle down',
               note: 'On a phone the slide-out is a bottom sheet on the drawer curve, symmetric in and out. The handle is the way out: drag it down or tap the scrim, and that keeps the draft; Cancel discards, Save commits, so those two only appear on the last step. Both steps ride one track twice the width: Next slides it, ‹ slides it back with what was typed. Save leaves by the same exit, and the step resets only once the sheet is off-screen.',
               prop: 'translateY(100%) → 0 · track translateX 0 → −50%', dur: '250ms open · 300ms step · 150ms ‹', ease: 'drawer cubic-bezier(0.32, 0.72, 0, 1) · ease-in-out' },
    reorder: { code: 'S16', name: 'Drag to reorder',           hint: 'Grab a ⠿ handle',
               note: 'Lifting adds a shadow and nothing else. There is no scale, so the row stays 1:1 under the pointer and keeps being hit in the same spot. Siblings reflow as you pass them; the drop settles on the spring curve, one of its two sanctioned uses. Home is locked.',
               prop: 'box-shadow · siblings translateY · drop translateY', dur: '150ms lift · 200ms reflow & settle', ease: 'ease-out · spring cubic-bezier(0.34, 1.56, 0.64, 1)' },
    credit:  { code: 'A1 · A2', name: 'Credit card: balance roll + glare',  hint: 'Add or redeem credits and watch the digits',
               note: 'Every digit takes the short way to its new value, all in the direction of the change, so 3,200 → 3,450 turns two digits a few steps instead of spinning the units through every count; a digit that appears or goes grows or shrinks in width on the same clock, and the window’s edges fade rather than clip. One shared 700ms clock, ease-out, no overshoot. Each commit also sends one reflection across the card: a blurred band, left to right, linear, because a reflection is progress and must never ease. Never on hover, never idling.',
               prop: 'digits translateY · beam translateX + opacity', dur: '700ms roll · 900ms glare', ease: 'ease-out (each digit) · linear (the glare)' },
  };

  let open = lab.classList.contains('is-open'), seen = false;
  const sync = () => stage.classList.toggle('is-live', open && seen);
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }, { root: sheet, threshold: 0.3 }).observe(stage);
  new MutationObserver(() => { const o = lab.classList.contains('is-open'); if (o !== open) { open = o; sync(); if (!open) leaveAll(); } }).observe(lab, { attributes: true, attributeFilter: ['class'] });

  const glasses = $$('.lg', stage); let lightRaf = 0, lightAt = null;
  const light = () => { lightRaf = 0; if (!lightAt) return;
    for (const g of glasses) { const r = g.getBoundingClientRect(); if (!r.width) continue;
      const gx = (lightAt.x - r.left) / r.width * 100, gy = (lightAt.y - r.top) / r.height * 100;
      g.style.setProperty('--gx', Math.max(-20, Math.min(120, gx)).toFixed(1) + '%'); g.style.setProperty('--gy', Math.max(-20, Math.min(120, gy)).toFixed(1) + '%');
      const ang = Math.atan2(lightAt.x - (r.left + r.width / 2), -(lightAt.y - (r.top + r.height / 2))) * 180 / Math.PI;
      g.style.setProperty('--ang', ang.toFixed(1) + 'deg'); } };
  stage.addEventListener('pointermove', (e) => { lightAt = { x: e.clientX, y: e.clientY }; if (!lightRaf) lightRaf = requestAnimationFrame(light); }, { passive: true });
  stage.addEventListener('pointerleave', () => { lightAt = null; for (const g of glasses) { g.style.removeProperty('--gx'); g.style.removeProperty('--gy'); g.style.removeProperty('--ang'); } });

  const tabs = $$('.mo-tabs button'), screens = $$('.mo-scr'), hint = $('.media > .hint'), nameEl = $('.mo-name'), noteEl = $('.mo-note'), metaEl = $('.mo-meta');
  const scen = {}; let current = null;
  const select = (key) => { if (key === current) return; if (current && scen[current] && scen[current].leave) scen[current].leave(); current = key;
    tabs.forEach((t) => { const on = t.dataset.s === key; t.setAttribute('aria-pressed', on);
      if (on) { const rail = t.parentElement; if (rail.scrollWidth > rail.clientWidth + 1) rail.scrollTo({ left: t.offsetLeft - (rail.clientWidth - t.offsetWidth) / 2, behavior: calm.matches ? 'auto' : 'smooth' }); } });
    screens.forEach((s) => s.classList.toggle('is-on', s.dataset.s === key));
    const sp = SPECS[key]; if (sp) { hint.textContent = sp.hint; nameEl.innerHTML = '<span class="no">' + sp.code + '</span>' + sp.name; noteEl.textContent = sp.note;
      metaEl.innerHTML = '<span>Property</span><span>' + sp.prop + '</span><span>Duration</span><span>' + sp.dur + '</span><span>Easing</span><span>' + sp.ease + '</span>'; }
    if (scen[key] && scen[key].enter) scen[key].enter(); };
  const leaveAll = () => { if (current && scen[current] && scen[current].leave) scen[current].leave(); };
  tabs.forEach((t) => t.addEventListener('click', () => { const k = t.dataset.s;
    if (k === current) { const sc = scen[k]; if (sc && sc.enter) sc.enter(true); return; } select(k); }));
  $('.mo-tabs').addEventListener('keydown', (e) => { const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (!d) return; e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); select(n.dataset.s); });

  (() => { const seg = $('.mo-seg'), btns = $$('button', seg), out = $('[data-s="toggle"] .mo-field .v'); if (!seg) return;
    const texts = ['A day that has passed: pick it', 'Today · 24 Sep', 'Ahead: schedule it'];
    btns.forEach((b, i) => b.addEventListener('click', () => { seg.style.setProperty('--i', i); btns.forEach((x, j) => x.setAttribute('aria-pressed', i === j)); if (out) out.textContent = texts[i]; }));
  })();

  (() => { const acc = $('.mo-acc'); if (!acc) return;
    const play = () => { acc.classList.remove('play'); void acc.offsetWidth; acc.classList.add('play'); };
    $('[data-s="stagger"] [data-replay]').addEventListener('click', play);
    let t = 0; scen.stagger = { enter(again) { clearTimeout(t); if (again) { play(); return; } acc.classList.remove('play'); t = setTimeout(play, 220); }, leave() { clearTimeout(t); acc.classList.remove('play'); } };
  })();

  (() => { const rows = $$('.mo-srow'); if (!rows.length) return; const W = 80;
    rows.forEach((row) => { const fx = $('.fx', row); let st = null, back = 0;
      const put = (x) => { fx.style.transform = 'translateX(' + x + 'px)'; row.style.setProperty('--rv', Math.max(0, -x) + 'px'); };
      fx.addEventListener('pointerdown', (e) => { if (st || row.classList.contains('gone')) return; st = { x: e.clientX, dx: 0, t: performance.now(), open: fx._open || 0 }; row.classList.remove('anim'); fx.setPointerCapture(e.pointerId); });
      fx.addEventListener('pointermove', (e) => { if (!st) return; st.dx = Math.min(0, e.clientX - st.x + st.open); put(st.dx); });
      const up = () => { if (!st) return; const v = Math.abs(st.dx) / Math.max(1, performance.now() - st.t), w = fx.getBoundingClientRect().width; row.classList.add('anim');
        if (Math.abs(st.dx) > w * 0.5 || (v > 0.6 && Math.abs(st.dx) > 60)) {
          put(-w * 1.1); fx._open = 0; setTimeout(() => row.classList.add('gone'), 120);
          clearTimeout(back); back = setTimeout(() => { row.classList.remove('anim'); put(0); void fx.offsetWidth; row.classList.remove('gone'); }, 1700); }
        else if (Math.abs(st.dx) > W * 0.6) { put(-W); fx._open = -W; }
        else { put(0); fx._open = 0; }
        st = null; };
      fx.addEventListener('pointerup', up); fx.addEventListener('pointercancel', up);
      row._reset = () => { clearTimeout(back); st = null; row.classList.remove('anim', 'gone'); fx.style.transform = ''; row.style.removeProperty('--rv'); fx._open = 0; }; });
    scen.swipe = { leave() { rows.forEach((r) => r._reset()); } };
  })();

  (() => { const ptr = $('.mo-ptr'); if (!ptr) return; const body = $('.body', ptr), spin = $('.spin', ptr), TH = 56; let st = null, busy = false, timer = 0;
    body.addEventListener('pointerdown', (e) => { if (st || busy) return; st = { y: e.clientY, d: 0 }; body.classList.remove('anim'); spin.classList.remove('anim'); body.setPointerCapture(e.pointerId); });
    const ring = (y, deg, o) => { spin.style.translate = '0 ' + y + 'px'; spin.style.rotate = deg + 'deg'; spin.style.setProperty('--o', o); };
    body.addEventListener('pointermove', (e) => { if (!st) return; const d = Math.max(0, e.clientY - st.y) * 0.5; st.d = d; body.style.transform = 'translateY(' + d + 'px)'; ring(d, d * 4, Math.min(1, d / TH)); });
    const up = () => { if (!st) return; const d = st.d; st = null; body.classList.add('anim'); spin.classList.add('anim');
      if (d >= TH) { busy = true; body.style.transform = 'translateY(' + TH + 'px)'; ring(TH + 4, 0, 1); spin.classList.add('go');
        timer = setTimeout(() => { spin.classList.remove('go'); body.style.transform = 'translateY(0)'; ring(0, 0, 0); busy = false; }, 1200); }
      else { body.style.transform = 'translateY(0)'; ring(0, 0, 0); } };
    body.addEventListener('pointerup', up); body.addEventListener('pointercancel', up);
    scen.pull = { leave() { clearTimeout(timer); st = null; busy = false; body.classList.remove('anim'); spin.classList.remove('anim', 'go'); body.style.transform = ''; spin.style.translate = ''; spin.style.rotate = ''; spin.style.removeProperty('--o'); } };
  })();

  (() => { const t = $('.mo-toast'), btn = $('[data-s="toast"] [data-fire]'); if (!t || !btn) return; let timer = 0;
    btn.addEventListener('click', () => { t.classList.add('in'); clearTimeout(timer); timer = setTimeout(() => t.classList.remove('in'), 2000); });
    scen.toast = { leave() { clearTimeout(timer); t.classList.remove('in'); } };
  })();

  (() => { const scrim = $('.mo-scrim'); if (!scrim) return;
    const set = (on) => { scrim.classList.toggle('on', on); scrim.setAttribute('aria-hidden', String(!on)); };
    $('[data-s="modal"] [data-open]').addEventListener('click', () => set(true));
    $$('[data-close]', scrim).forEach((b) => b.addEventListener('click', () => set(false)));
    scrim.addEventListener('click', (e) => { if (e.target === scrim) set(false); });
    scen.modal = { leave() { set(false); } };
  })();

  (() => { const sw = $('.mo-sw'); if (!sw) return; const ttl = $('.ttl', sw); let reset = 0;
    const close = () => { sw.classList.remove('open'); sw.setAttribute('aria-hidden', 'true'); clearTimeout(reset); reset = setTimeout(() => { sw.classList.remove('s2'); ttl.textContent = 'Create a new account'; }, calm.matches ? 0 : 300); };
    $('[data-s="sheet"] [data-open]').addEventListener('click', () => { clearTimeout(reset); sw.classList.add('open'); sw.setAttribute('aria-hidden', 'false'); });
    $('[data-next]', sw).addEventListener('click', () => { sw.classList.add('s2'); ttl.textContent = 'Set balance'; });
    $('.back', sw).addEventListener('click', () => { sw.classList.remove('s2'); ttl.textContent = 'Create a new account'; });
    $$('[data-close]', sw).forEach((b) => b.addEventListener('click', close)); $('.sc', sw).addEventListener('click', close);
    const sheetEl = $('.mo-sheet', sw), hd = $('.hd', sw); let drag = null;
    hd.addEventListener('pointerdown', (e) => { if (drag || e.target.closest('button')) return; drag = { y: e.clientY, dy: 0, t: performance.now() }; sheetEl.classList.add('dragging'); hd.setPointerCapture(e.pointerId); e.preventDefault(); });
    hd.addEventListener('pointermove', (e) => { if (!drag) return; drag.dy = Math.max(0, e.clientY - drag.y); sheetEl.style.transform = 'translateY(' + drag.dy + 'px)'; });
    const drop = () => { if (!drag) return; const { dy, t } = drag; drag = null; sheetEl.classList.remove('dragging'); const v = dy / Math.max(1, performance.now() - t);
      if (dy > sheetEl.offsetHeight / 3 || (v > 0.5 && dy > 40)) { sheetEl.style.transform = ''; close(); } else { sheetEl.style.transform = ''; } };
    hd.addEventListener('pointerup', drop); hd.addEventListener('pointercancel', drop);
    scen.sheet = { leave() { clearTimeout(reset); drag = null; sheetEl.classList.remove('dragging'); sheetEl.style.transform = ''; sw.classList.remove('open', 's2'); sw.setAttribute('aria-hidden', 'true'); ttl.textContent = 'Create a new account'; } };
  })();

  (() => { const list = $('.mo-rl'); if (!list) return; let st = null;
    const rows = () => $$('.mo-row', list);
    list.addEventListener('pointerdown', (e) => { const g = e.target.closest('.grip'); if (!g || st) return; const li = g.closest('.mo-row'); if (li.classList.contains('lock')) return;
      const all = rows(), i = all.indexOf(li), step = li.offsetHeight + 8, min = all.findIndex((r) => !r.classList.contains('lock'));
      st = { li, i, to: i, y: e.clientY, step, min, max: all.length - 1, all }; li.classList.add('drag'); g.setPointerCapture(e.pointerId); e.preventDefault(); });
    list.addEventListener('pointermove', (e) => { if (!st) return; const dy = e.clientY - st.y; st.li.style.transform = 'translateY(' + dy + 'px)';
      const to = Math.max(st.min, Math.min(st.max, st.i + Math.round(dy / st.step))); if (to === st.to) return; st.to = to;
      st.all.forEach((r, j) => { if (r === st.li) return; let s = 0; if (j > st.i && j <= to) s = -st.step; else if (j < st.i && j >= to) s = st.step; r.style.transform = s ? 'translateY(' + s + 'px)' : ''; }); });
    const end = () => { if (!st) return; const { li, i, to, step, all } = st; st = null;
      const settle = () => { li.classList.remove('drag', 'settle'); all.forEach((r) => { r.classList.add('still'); r.style.transform = ''; });
        if (to > i) all[to].after(li); else if (to < i) all[to].before(li); void list.offsetWidth; all.forEach((r) => r.classList.remove('still')); };
      const target = (to - i) * step, cur = new DOMMatrix(getComputedStyle(li).transform).m42;
      li.classList.add('settle'); li.style.transform = 'translateY(' + target + 'px)';
      if (calm.matches || Math.abs(cur - target) < 0.5) { li.classList.remove('drag'); settle(); return; }
      const done = (ev) => { if (ev && ev.propertyName !== 'transform') return; li.removeEventListener('transitionend', done); clearTimeout(t); settle(); };
      li.addEventListener('transitionend', done); const t = setTimeout(done, 400); };
    list.addEventListener('pointerup', end); list.addEventListener('pointercancel', end);
    scen.reorder = { leave() { if (st) end(); } };
  })();

  (() => { const scr = $('.mo-scr[data-s="credit"]'); if (!scr || !window.LabCredit) return; const demo = LabCredit.mount(scr); if (!demo) return; let t = 0;
    scen.credit = { enter(again) { clearTimeout(t); if (again) { demo.loadIn(); return; } demo.reset(); t = setTimeout(demo.loadIn, 260); }, leave() { clearTimeout(t); demo.reset(); } };
  })();

  select(tabs[0] ? tabs[0].dataset.s : 'toggle');
})();
