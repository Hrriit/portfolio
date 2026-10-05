(() => {
  const vids = [...document.querySelectorAll('.tile video.cover')]; if (!vids.length) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const tick = (v) => {
    if (v.dataset.seen && !document.hidden && !calm.matches) { v.play().catch(() => {}); return; }
    if (!v.paused) v.pause();
    if (calm.matches && v.currentTime) v.currentTime = 0;
  };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { e.target.dataset.seen = e.isIntersecting ? '1' : ''; tick(e.target); });
  }, { threshold: .25 }) : null;
  vids.forEach((v) => {
    v.muted = true; v.loop = true; v.playsInline = true; v.removeAttribute('controls');
    if (io) io.observe(v); else { v.dataset.seen = '1'; tick(v); }
  });
  calm.addEventListener('change', () => vids.forEach(tick));
  document.addEventListener('visibilitychange', () => vids.forEach(tick));
})();
