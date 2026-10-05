(() => {
  const vids = [...document.querySelectorAll('.fig.vid video')]; if (!vids.length) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const tick = (v) => { if (v.dataset.seen && !v.dataset.held && (!calm.matches || v.dataset.user)) v.play().catch(() => {}); else if (!v.paused) v.pause(); };
  const toggle = (v) => { if (v.paused) { v.dataset.held = ''; v.dataset.user = '1'; v.play().catch(() => {}); } else { v.dataset.held = '1'; v.pause(); } };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => { entries.forEach((e) => { e.target.dataset.seen = e.isIntersecting ? '1' : ''; tick(e.target); }); }, { threshold: .3 }) : null;
  vids.forEach((v) => {
    v.muted = true; v.loop = true; v.playsInline = true; v.removeAttribute('controls');
    v.addEventListener('click', () => toggle(v));
    v.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(v); } });
    if (io) io.observe(v); else { v.dataset.seen = '1'; tick(v); }
  });
  calm.addEventListener('change', () => vids.forEach(tick));
  document.addEventListener('visibilitychange', () => vids.forEach((v) => { if (document.hidden) { if (!v.paused) v.pause(); } else tick(v); }));
})();
