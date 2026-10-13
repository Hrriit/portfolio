(() => {
  if (!window.GV || !('attachShadow' in Element.prototype) || !('ResizeObserver' in window)) return;
  window.GV_ROOT = 'assets/gloss-ui/';
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = (cls, label) => { const f = document.createElement('div'); f.className = cls; f.setAttribute('role', 'img'); if (label) f.setAttribute('aria-label', label); return f; };
  const mount = (f) => new Promise((done) => {
    const root = f.attachShadow({ mode: 'open' });
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'css/gloss-ui.css';
    const own = document.createElement('style'); own.textContent = '.gv{position:absolute;left:0;top:0}';
    link.onload = link.onerror = () => done(root);
    root.append(link, own);
  });
  const load = (faces) => (document.fonts && document.fonts.load ? Promise.all(faces.map((f) => document.fonts.load(f))).catch(() => {}) : Promise.resolve());
  const montserrat = load(['400', '500', '600'].map((w) => w + ' 20px "GV Montserrat"'));
  const cover = (f, r, w, h, top) => { const W = f.clientWidth, H = f.clientHeight, s = Math.max(W / w, H / h);
    r.style.transform = `translate(${((W - w * s) / 2).toFixed(2)}px, ${top ? 0 : ((H - h * s) / 2).toFixed(2)}px) scale(${s})`; };

  const stage = document.querySelector('.hero .stage[data-live="gloss"]');
  if (stage) {
    const shots = [...stage.querySelectorAll('img.desk, img.phone')];
    const fd = frame('gv-frm desk', shots[0] && shots[0].alt), fm = frame('gv-frm phone', shots[1] && shots[1].alt);
    shots.forEach((i) => i.remove());
    stage.append(fd, fm);
    Promise.all([mount(fd), mount(fm), montserrat]).then(([rd, rm]) => {
      const desk = GV.buildDesk({ orbs: 'new' }), mob = GV.buildMob({ orbs: 'new' });
      desk.setAttribute('aria-hidden', 'true'); mob.setAttribute('aria-hidden', 'true');
      rd.append(desk); rm.append(mob);
      const fit = () => { cover(fd, desk, 1440, 1024, false); cover(fm, mob, 390, 844, true); };
      fit(); new ResizeObserver(fit).observe(stage);
      GV.wireHover(desk); GV.wireHover(mob);
      requestAnimationFrame(() => new GV.Player(stage, [new GV.Loader(desk, 'once'), new GV.Loader(mob, 'once')], 'once'));
    });
  }

  const ba = document.querySelector('.stage.ba[data-live="gloss-ba"]');
  if (ba) {
    const old = ba.querySelector('img.after');
    const fa = frame('gv-ba after', old && old.alt);
    if (old) old.replaceWith(fa); else ba.prepend(fa);
    Promise.all([mount(fa), montserrat]).then(([ra]) => {
      const desk = GV.buildDesk({ orbs: 'new' });
      desk.setAttribute('aria-hidden', 'true');
      ra.append(desk);
      const fit = () => cover(fa, desk, 1440, 1024, false);
      fit(); new ResizeObserver(fit).observe(ba);
      requestAnimationFrame(() => new GV.Player(ba, [new GV.Loader(desk, 'once')], 'once'));
    });
  }

  const gs = document.querySelector('.stage.ba[data-live="gloss-goals"]');
  if (gs && GV.buildGoals && GV.buildGoalsBefore) {
    const swap = (cls) => { const old = gs.querySelector('img.' + cls), f = frame('gv-ba ' + cls, old && old.alt); if (old) old.replaceWith(f); else gs.prepend(f); return f; };
    const fa = swap('after'), fb = swap('before');
    Promise.all([mount(fa), mount(fb), montserrat, load(['600 18px "GV Num"'])]).then(([ra, rb]) => {
      const after = GV.buildGoals(), before = GV.buildGoalsBefore();
      after.setAttribute('aria-hidden', 'true'); before.setAttribute('aria-hidden', 'true');
      if (!calm && 'IntersectionObserver' in window) after.classList.add('pre');
      ra.append(after); rb.append(before);
      const fit = () => { cover(fa, after, 1440, 1024, false); cover(fb, before, 1440, 1024, false); };
      fit(); new ResizeObserver(fit).observe(gs);
      if (after.classList.contains('pre')) {
        const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; io.disconnect(); requestAnimationFrame(() => after.classList.remove('pre')); }, { threshold: 0.35 });
        io.observe(gs);
      }
    });
  }
})();
