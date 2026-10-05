(() => {
  const root = document.documentElement, lab = document.getElementById('lab'), tile = document.querySelector('.lab-block, .tile.lab');
  if (!lab || !tile) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  if (/[?&]lab=strip\b/.test(location.search) && tile.querySelector('.row')) {
    root.dataset.lab = 'strip';
    const row = tile.querySelector('.row'); [...row.children].forEach((c) => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); row.appendChild(k); });
    tile.removeAttribute('href'); tile.removeAttribute('aria-haspopup'); tile.removeAttribute('aria-controls'); tile.dataset.cursor = 'The lab, in one row';
    return;
  }

  (() => { const row = tile.querySelector('.row'); if (!row) return;
    const fit = () => tile.classList.toggle('is-fit', row.scrollWidth <= row.clientWidth + 1);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(row); addEventListener('resize', fit); addEventListener('load', fit); fit(); })();

  (() => { const more = tile.querySelector('[data-more]'); if (!more) return;
    const own = new Set([...tile.querySelectorAll('[data-go]:not([data-more])')].map((a) => a.dataset.go));
    const rest = [...lab.querySelectorAll('.lab-card[data-exp]:not(.video-slot)')].filter((c) => !own.has(c.dataset.exp)); if (!rest.length) { delete more.dataset.go; return; }
    more.dataset.go = rest[0].dataset.exp; const n = more.querySelector('.n'); if (n) n.textContent = '+' + rest.length;
    more.setAttribute('aria-label', rest.length + ' more experiment' + (rest.length > 1 ? 's' : '') + ', open in the AI Lab'); })();

  const sheet = lab.querySelector('.lab-sheet'), closeBtn = lab.querySelector('.lab-close'), back = lab.querySelector('.lab-back');
  let open = false, pushed = false, opener = null, booted = false; const live = [];

  const sb = (() => {
    if (!matchMedia('(hover:hover) and (pointer:fine) and (forced-colors:none)').matches) return { ask() {} };
    const bar = document.createElement('div'), track = document.createElement('div'), thumb = document.createElement('div');
    bar.className = 'lab-sb'; bar.setAttribute('aria-hidden', 'true'); track.className = 'lab-sb-track'; thumb.className = 'lab-sb-thumb'; track.appendChild(thumb); bar.appendChild(track); sheet.prepend(bar);
    let raf = 0, span = 0;
    const draw = () => { raf = 0; const vh = sheet.clientHeight, max = sheet.scrollHeight - vh; if (!open || max < 4) { bar.classList.remove('is-on'); span = 0; return; }
      const off = bar.getBoundingClientRect().top - sheet.getBoundingClientRect().top - sheet.clientTop;
      const h = vh - 12, th = Math.max(48, Math.round(h * vh / sheet.scrollHeight)); span = h - th; track.style.top = (12 - off).toFixed(1) + 'px'; track.style.height = h + 'px'; thumb.style.height = th + 'px';
      thumb.style.transform = 'translateY(' + (span * Math.min(1, Math.max(0, sheet.scrollTop / max))).toFixed(1) + 'px)'; bar.classList.add('is-on'); };
    const ask = () => { if (!raf) raf = requestAnimationFrame(draw); };
    sheet.addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask);
    if (window.ResizeObserver) { const ro = new ResizeObserver(ask); ro.observe(sheet); [...sheet.children].forEach((c) => { if (c !== bar) ro.observe(c); }); }
    let y0 = 0, s0 = 0;
    thumb.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); thumb.setPointerCapture(e.pointerId); y0 = e.clientY; s0 = sheet.scrollTop; bar.classList.add('is-drag'); });
    thumb.addEventListener('pointermove', (e) => { if (!span || !bar.classList.contains('is-drag')) return; sheet.scrollTop = s0 + (e.clientY - y0) * (sheet.scrollHeight - sheet.clientHeight) / span; });
    const drop = () => bar.classList.remove('is-drag');
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => thumb.addEventListener(ev, drop));
    return { ask };
  })();

  const focusable = () => [...sheet.querySelectorAll('a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null);
  const aim = (card) => { let y = 0; for (let el = card; el && el !== sheet; el = el.offsetParent) y += el.offsetTop;
    const vh = sheet.clientHeight, h = card.offsetHeight;
    sheet.scrollTop = Math.max(0, Math.min(h + 48 > vh ? y - 24 : y - (vh - h) / 2, sheet.scrollHeight - vh));
    card.tabIndex = -1; card.focus({ preventScroll: true });
    card.classList.remove('is-target'); void card.offsetWidth; card.classList.add('is-target');
    clearTimeout(aim.t); aim.t = setTimeout(() => card.classList.remove('is-target'), 3600); };
  const show = (go) => { if (open) return; open = true; opener = document.activeElement;
    lab.hidden = false; lab.classList.remove('is-closing'); void lab.offsetWidth; lab.classList.add('is-open'); root.classList.add('lab-open');
    sheet.scrollTop = 0; const card = go && sheet.querySelector('.lab-card[data-exp="' + go + '"]');
    if (card) aim(card); else (closeBtn || sheet).focus({ preventScroll: true }); sb.ask();
    if (!booted) { booted = true; boot(); }
    live.forEach((s) => s.start()); };
  const hide = () => { if (!open) return; open = false;
    lab.classList.remove('is-open'); lab.classList.add('is-closing'); root.classList.remove('lab-open'); live.forEach((s) => s.stop());
    const done = () => { lab.classList.remove('is-closing'); lab.hidden = true; if (opener && opener.focus && opener !== document.body) opener.focus({ preventScroll: true }); };
    if (calm.matches) done(); else setTimeout(done, 260); };
  const leave = () => { if (pushed) history.back(); else { if (location.hash === '#lab') history.replaceState(null, '', location.pathname + location.search); hide(); } };

  tile.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href="#lab"]'); if (!a || !tile.contains(a)) return;
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); if (open) return;
    const go = a.dataset.go || ''; history.pushState({ lab: 1, go }, '', '#lab'); pushed = true; show(go); });
  addEventListener('popstate', () => { if (location.hash === '#lab') show(history.state && history.state.go); else if (open) { pushed = false; hide(); } });
  closeBtn.addEventListener('click', leave); back.addEventListener('click', leave);
  document.addEventListener('keydown', (e) => { if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); leave(); return; }
    if (e.key !== 'Tab') return; const f = focusable(); if (!f.length) return; const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } });

  const watch = (el, onChange) => { const io = new IntersectionObserver(([e]) => onChange(e.isIntersecting), { root: sheet, threshold: 0.35 }); io.observe(el); };

  const boot = () => {
    const mark = lab.querySelector('.stage.mark .hx-mark');
    if (mark && window.HXMark) setTimeout(() => HXMark.replay(mark), 380);

    (() => {
      const stage = lab.querySelector('.stage.silk'), frag = document.getElementById('frag'); if (!stage || !frag || calm.matches) return;
      const canvas = document.createElement('canvas'); stage.prepend(canvas);
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); if (!gl) { canvas.remove(); return; }
      const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
      const vs = sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'), fs = sh(gl.FRAGMENT_SHADER, frag.textContent); if (!vs || !fs) { canvas.remove(); return; }
      const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); gl.useProgram(pr);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = (n) => gl.getUniformLocation(pr, n), hex = (h) => { h = h.trim(); return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
      let foldBase = 0.7;
      const readColours = () => { const cs = getComputedStyle(root); for (let k = 0; k <= 5; k++) gl.uniform3fv(U('uC' + k), hex(cs.getPropertyValue('--shader-' + k))); foldBase = parseFloat(cs.getPropertyValue('--shader-fold')) || 0.7; };
      gl.uniform1f(U('uIdleR'), 0.20); gl.uniform1f(U('uIdleDepth'), 0.40); gl.uniform1f(U('uIdleDrag'), 0.30); gl.uniform1f(U('uScale'), 1.6); gl.uniform1f(U('uFade'), 0.0); gl.uniform2f(U('uOffset'), -0.6, 0.0); readColours();
      const P = window.__silkParams || { speed: 0.06, folds: 1.0, sheen: 0.70, idle: 0.50, idleSpeed: 1.0, radius: 0.09, depth: 0.12, drag: 0.08, lag: 0.85, recover: 1600 };
      const N = 8, M = 10, ATTACK = 160, trail = Array.from({ length: N }, () => ({ x: .5, y: .5, vx: 0, vy: 0, born: -1e9 })), T = new Float32Array(M * 4), A = new Float32Array(M);
      const GHOSTS = [{ cx: .60, cy: .52, ax: .26, ay: .20, period: 26, ph: 0.0 }, { cx: .44, cy: .46, ax: .30, ay: .22, period: 34, ph: 2.1 }];
      let head = 0, target = null, sx = .5, sy = .5, svx = 0, svy = 0, lastPush = 0, lastFrame = 0, clockT = 11.0, ghostClock = 0, running = false, seen = false, raf = 0, t0 = 0;
      stage.addEventListener('pointermove', (e) => { const r = stage.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height; if (!target) { sx = x; sy = y; } target = { x, y }; kick(); }, { passive: true });
      stage.addEventListener('pointerleave', () => { target = null; });
      const size = () => { const dpr = Math.min(devicePixelRatio || 1, 1.25); const w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr); if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(U('uRes'), w, h); } };
      const draw = (now) => {
        size(); const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 1 / 60; lastFrame = now; if (!t0) t0 = now;
        clockT += dt * P.speed; ghostClock += dt * P.idleSpeed; gl.uniform1f(U('uTime'), clockT);
        if (target) { const k = 1 - Math.pow(P.lag, dt * 60); const nx = sx + (target.x - sx) * k, ny = sy + (target.y - sy) * k; svx += 0.3 * ((nx - sx) / dt - svx); svy += 0.3 * ((ny - sy) / dt - svy); sx = nx; sy = ny;
          if (now - lastPush > 45 && Math.hypot(svx, svy) > 0.004) { trail[head] = { x: sx, y: sy, vx: svx, vy: svy, born: now }; head = (head + 1) % N; lastPush = now; } }
        trail.forEach((s, i) => { T[i*4] = s.x; T[i*4+1] = s.y; T[i*4+2] = s.vx; T[i*4+3] = s.vy; const age = now - s.born; const a = (1 - Math.exp(-age / ATTACK)) * Math.exp(-age / P.recover); A[i] = a < 0.003 ? 0 : a; });
        const easeIn = Math.min(1, (now - t0) / 2500), idleAmp = P.idle * easeIn * easeIn * (3 - 2 * easeIn);
        GHOSTS.forEach((g, j) => { const w = 2 * Math.PI / g.period, ph = ghostClock * w + g.ph, i = N + j; T[i*4] = g.cx + g.ax * Math.sin(ph); T[i*4+1] = g.cy + g.ay * Math.sin(2 * ph + 0.7);
          const vx = g.ax * Math.cos(ph), vy = g.ay * 2 * Math.cos(2 * ph + 0.7), vmax = Math.hypot(g.ax, g.ay * 2); T[i*4+2] = vx / vmax * 0.5; T[i*4+3] = vy / vmax * 0.5; A[i] = idleAmp; });
        gl.uniform4fv(U('uTrail[0]'), T); gl.uniform1fv(U('uAmp[0]'), A);
        gl.uniform1f(U('uDentR'), P.radius); gl.uniform1f(U('uDentDepth'), P.depth); gl.uniform1f(U('uDragR'), P.radius * 1.8); gl.uniform1f(U('uDrag'), P.drag); gl.uniform1f(U('uFreq'), P.folds); gl.uniform1f(U('uFold'), foldBase * (P.sheen / 0.7));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        raf = (running && seen && !document.hidden) ? requestAnimationFrame(draw) : 0; if (!raf) lastFrame = 0; };
      const kick = () => { if (!raf && running && seen && !document.hidden) raf = requestAnimationFrame(draw); };
      addEventListener('themechange', () => { readColours(); kick(); }); document.addEventListener('visibilitychange', kick);
      watch(stage, (v) => { seen = v; kick(); });
      live.push({ start() { running = true; kick(); }, stop() { running = false; } });
    })();

    (() => {
      const stage = lab.querySelector('.stage.moon'), mm = stage && stage.querySelector('.mm'); if (!stage || !mm) return;
      const label = mm.querySelector('.mm-label'), hover = matchMedia('(hover:hover) and (pointer:fine)');
      const put = (x, y) => { mm.style.setProperty('--x', x + 'px'); mm.style.setProperty('--y', y + 'px'); };
      const putAt = (fx, fy) => put(fx * stage.clientWidth, fy * stage.clientHeight);
      const state = (kind, words) => { if (words) label.textContent = words; mm.classList.toggle('is-full', !!kind); mm.classList.toggle('is-link', kind === 'link'); mm.classList.toggle('is-label', kind === 'tile'); };
      const STEPS = [[0, .26, .74, null], [1300, .30, .40, 'link'], [2900, .66, .66, 'tile'], [4700, .26, .74, null]];
      let timer = 0, running = false, seen = false, hand = false, t = 0;
      const step = () => { const s = STEPS[t]; putAt(s[1], s[2]); state(s[3], 'Read case study'); const next = STEPS[(t + 1) % STEPS.length]; const wait = next[0] > s[0] ? next[0] - s[0] : 1300; t = (t + 1) % STEPS.length; timer = setTimeout(step, wait); };
      const walk = () => { clearTimeout(timer); if (running && seen && !hand) { t = 0; step(); } };
      if (hover.matches) {
        stage.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; hand = true; clearTimeout(timer); stage.classList.add('is-hand'); });
        stage.addEventListener('pointermove', (e) => { if (!hand) return; const r = stage.getBoundingClientRect(); put(e.clientX - r.left, e.clientY - r.top);
          const f = e.target.closest && e.target.closest('.fake'); state(f ? f.dataset.t : null, f && f.dataset.cursor); }, { passive: true });
        stage.addEventListener('pointerleave', () => { hand = false; stage.classList.remove('is-hand'); walk(); });
      }
      watch(stage, (v) => { seen = v; walk(); });
      live.push({ start() { running = true; walk(); }, stop() { running = false; clearTimeout(timer); } });
    })();

    (() => {
      const stage = lab.querySelector('.stage.wipe'); if (!stage) return;
      const base = stage.querySelector('.wp.base'), top = stage.querySelector('.wp.top'), btn = stage.querySelector('.wp-btn');
      let timer = 0, running = false, seen = false, busy = false;
      const wipe = () => { if (busy) return; busy = true; top.classList.add('is-in');
        const settle = () => { top.removeEventListener('transitionend', settle); const was = base.dataset.mode; base.dataset.mode = top.dataset.mode; top.classList.remove('is-in'); top.dataset.mode = was; busy = false; };
        if (calm.matches) settle(); else { top.addEventListener('transitionend', settle); setTimeout(() => { if (busy) settle(); }, 900); } };
      const plan = () => { clearTimeout(timer); if (running && seen) timer = setTimeout(() => { wipe(); plan(); }, 3600); };
      btn.addEventListener('click', () => { wipe(); plan(); });
      watch(stage, (v) => { seen = v; plan(); });
      live.push({ start() { running = true; plan(); }, stop() { running = false; clearTimeout(timer); } });
    })();

    (() => {
      const cards = [...lab.querySelectorAll('.video-slot[data-video]')]; if (!cards.length) return;
      const vids = [];
      cards.forEach((card) => { const media = card.querySelector('.media'), name = card.dataset.video; media.dataset.file = name + '.mp4';
        const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'metadata'; v.setAttribute('aria-label', card.querySelector('h3') ? card.querySelector('h3').textContent : name);
        v.addEventListener('loadedmetadata', () => { card.classList.add('has-video'); vids.push({ v, seen: false }); watch(v, (s) => { const it = vids.find((x) => x.v === v); it.seen = s; tick(it); }); });
        v.addEventListener('error', () => { card.classList.add('is-empty'); v.remove(); });
        v.addEventListener('click', () => { if (v.paused) v.play().catch(() => {}); else v.pause(); v.dataset.held = v.paused ? '1' : ''; });
        v.src = 'assets/video/lab/' + name + '.mp4'; media.appendChild(v); });
      let running = false;
      const tick = (it) => { if (!it) return; if (running && it.seen && !calm.matches && !it.v.dataset.held) it.v.play().catch(() => {}); else it.v.pause(); };
      live.push({ start() { running = true; vids.forEach(tick); }, stop() { running = false; vids.forEach((it) => it.v.pause()); } });
    })();

    (() => {
      const stage = lab.querySelector('.stage.card'), disc = stage && stage.querySelector('.card-disc'), canvas = disc && disc.querySelector('canvas'), art = disc && disc.querySelector('.card-art'), box = stage && stage.querySelector('.card-3d');
      if (!stage || !disc || !canvas || !art) return;
      const P = { light: [1.0, 0.92, 0.78], ambient: [0.82, 0.83, 0.88], ambientK: 0.56, lightZ: 0.5, parallax: 0.0034, normalXY: 1.45, wrap: 0.8, diffuse: 0.62, specK: 0.46, tiltMax: 10, sway: 2.0, ease: 0.055, dprMax: 1.5, radius: 0.06, uvMin: -0.4, uvMax: 1.4 };
      const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' }) || canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
      const note = (t) => { let n = stage.querySelector('.note'); if (!n) { n = document.createElement('span'); n.className = 'mono note'; stage.appendChild(n); } n.textContent = t; };
      const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
      const FS = `precision highp float;
uniform vec2 uRes,uLight,uPar,uSize;uniform float uRotX,uRotY,uAmbK,uRadius,uNxy,uWrap,uDiff,uSpecK;uniform vec3 uLightCol,uAmbCol;
uniform sampler2D uCol,uNrm,uHgt,uRgh;
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;                                              // y up: UNPACK_FLIP_Y_WEBGL, so the normal map's green-up convention holds
  vec2 p=(uv-.5)*uSize;vec2 q=abs(p)-(uSize*.5-uRadius);float d=length(max(q,0.))-uRadius;float a=1.-smoothstep(-.75,.75,d);   // rounded corners
  if(a<=0.)discard;
  float h0=texture2D(uHgt,uv).r;vec2 s=uv+(h0-.5)*uPar;                       // height parallax: raised pixels slide away from the lamp
  vec4 c=texture2D(uCol,s);vec3 n=texture2D(uNrm,s).xyz*2.-1.;n.xy*=uNxy;n.z=max(n.z,.08);n=normalize(n);
  float cy=cos(uRotY),sy=sin(uRotY),cx=cos(uRotX),sx=sin(uRotX);n.y=-n.y;     // the card is leaned by CSS (rotateX then rotateY, y down): lean the normal too
  n=vec3(n.x*cy+n.z*sy,n.y,-n.x*sy+n.z*cy);n=vec3(n.x,n.y*cx-n.z*sx,n.y*sx+n.z*cx);n.y=-n.y;
  float rough=texture2D(uRgh,s).r;
  vec3 L=normalize(vec3(uLight-uv,.5));vec3 H=normalize(L+vec3(0.,0.,1.));
  float diff=clamp(dot(n,L)*uWrap+(1.-uWrap),0.,1.)*uDiff;
  float spec=pow(max(dot(n,H),0.),mix(52.,6.,rough))*(1.-rough*.85)*uSpecK;   // the darker the roughness map, the sharper the highlight
  float rim=pow(1.-max(n.z,0.),3.)*clamp(1.-L.z*1.6,0.,1.)*.10;               // side light only, faint and warm
  vec3 col=c.rgb*(uAmbCol*uAmbK+uLightCol*diff)+uLightCol*spec+vec3(1.,.85,.6)*rim;
  gl_FragColor=vec4(col*a,a);}`;
      let pr = null, U = {}, TEX = null, ready = false, loading = false;
      const setup = () => {
        const sh = (t, src) => { const o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
        const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return false;
        pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return false; gl.useProgram(pr);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['uRes','uLight','uPar','uSize','uRotX','uRotY','uAmbK','uRadius','uNxy','uWrap','uDiff','uSpecK','uLightCol','uAmbCol','uCol','uNrm','uHgt','uRgh'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
        gl.uniform1i(U.uCol, 0); gl.uniform1i(U.uNrm, 1); gl.uniform1i(U.uHgt, 2); gl.uniform1i(U.uRgh, 3);
        gl.uniform3fv(U.uLightCol, P.light); gl.uniform3fv(U.uAmbCol, P.ambient); gl.uniform1f(U.uAmbK, P.ambientK); gl.uniform1f(U.uNxy, P.normalXY); gl.uniform1f(U.uWrap, P.wrap); gl.uniform1f(U.uDiff, P.diffuse); gl.uniform1f(U.uSpecK, P.specK);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); return true; };
      const texture = (img, unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
      const maps = () => new Promise((ok) => { if (window.__cardMaps) return ok(window.__cardMaps); const sc = document.createElement('script'); sc.src = 'assets/img/lab/card-maps.js';
        sc.onload = () => ok(window.__cardMaps || {}); sc.onerror = () => ok({}); document.head.appendChild(sc); });
      const picture = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
      let W = 543, Hh = 724;
      const load = () => { if (loading) return; loading = true;
        if (!gl || !setup()) { note('WebGL is not available here. This is the still picture.'); return; }
        maps().then((urls) => Promise.all(['col', 'nrm', 'hgt', 'rgh'].map((k) => picture(urls['card-' + k] || ('assets/img/lab/card-' + k + '.webp')))))
          .then((imgs) => { W = imgs[0].naturalWidth; Hh = imgs[0].naturalHeight; box.style.setProperty('--ar', W + '/' + Hh); TEX = imgs.map(texture); ready = true; disc.classList.add('is-live'); kick(); })
          .catch(() => { note('The maps did not load. This is the still picture.'); }); };

      let light = { x: .36, y: .72 }, rest = { x: .36, y: .72 }, target = null, pointer = false, tx = 0, ty = 0, sway = 0, lastFrame = 0, raf = 0, running = false, seen = false;
      const cssv = (k, v) => stage.style.setProperty(k, v);
      const clampUV = (v) => Math.min(P.uvMax, Math.max(P.uvMin, v));
      const at = (e) => { const r = disc.getBoundingClientRect(); return { x: clampUV((e.clientX - r.left) / r.width), y: clampUV(1 - (e.clientY - r.top) / r.height) }; };
      const fine = matchMedia('(hover:hover) and (pointer:fine)');
      const paw = document.createElement('span'); paw.className = 'lab-paw'; paw.setAttribute('aria-hidden', 'true');
      paw.innerHTML = '<svg viewBox="0 0 1304 1024" fill="var(--moon, #FFF15C)"><path d="M36.66666666 448.53771062a165.74755953 140.89399541 90 1 0 281.78799178 0 165.74755953 140.89399541 90 1 0-281.78799178 0Z"/><path d="M1087.04090506 747.12063322a135.92328297 165.74755953 12.07 1 0 69.31780671-324.16670937 135.92328297 165.74755953 12.07 1 0-69.31780671 324.16670937Z"/><path d="M337.36979121 201.03049631a185.03049631 144.83628477 90 1 0 289.67257053 0 185.03049631 144.83628477 90 1 0-289.67257053 0Z"/><path d="M855.44600527 433.63750153a144.83628477 185.03049631 6.71 1 0 43.2394355-367.52617687 144.83628477 185.03049631 6.71 1 0-43.2394355 367.52617687Z"/><path d="M948.00863919 777.46177106c-10.36993497 157.00596156-161.976674 241.2509716-341.3508425 229.33840204s-318.63982691-115.18341206-308.52699722-272.27507604 167.89010806-256.67732141 343.57909247-262.93356315c181.68812087 36.50902841 316.66868223 148.77857416 306.29874725 305.87023715z"/></svg>';
      stage.appendChild(paw);
      const pawTo = (e) => { const r = stage.getBoundingClientRect(); cssv('--px', (e.clientX - r.left).toFixed(1) + 'px'); cssv('--py', (e.clientY - r.top).toFixed(1) + 'px'); };
      stage.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && fine.matches) { stage.classList.add('has-paw'); root.classList.add('paw-cursor'); pawTo(e); } });
      stage.addEventListener('pointermove', (e) => { target = at(e); pointer = true; if (stage.classList.contains('has-paw')) pawTo(e); kick(); }, { passive: true });
      stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { target = at(e); pointer = true; kick(); } else paw.classList.add('is-down'); }, { passive: true });
      ['pointerup', 'pointercancel'].forEach((ev) => stage.addEventListener(ev, () => paw.classList.remove('is-down'), { passive: true }));
      stage.addEventListener('pointerleave', () => { pointer = false; stage.classList.remove('has-paw'); root.classList.remove('paw-cursor'); paw.classList.remove('is-down'); kick(); });
      const size = () => { const dpr = Math.min(devicePixelRatio || 1, P.dprMax); const w = Math.round(disc.clientWidth * dpr), h = Math.round(disc.clientHeight * dpr);
        if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); gl.uniform2f(U.uRes, w, h); gl.uniform2f(U.uSize, w, h); gl.uniform1f(U.uRadius, P.radius * w); }
        cssv('--r', (P.radius * disc.clientWidth).toFixed(1) + 'px'); };
      const frame = (now) => {
        const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 1 / 60; lastFrame = now; const k = 1 - Math.pow(1 - P.ease, dt * 60);
        const goal = (pointer && target) ? target : rest;
        light.x += (goal.x - light.x) * k; light.y += (goal.y - light.y) * k;
        let gx = Math.max(-P.tiltMax, Math.min(P.tiltMax, -(light.x - .5) * 2 * P.tiltMax)), gy = Math.max(-P.tiltMax, Math.min(P.tiltMax, -(light.y - .5) * 2 * P.tiltMax));
        if (!pointer && !calm.matches) { sway += dt; gy += P.sway * Math.sin(sway * 0.7); gx += P.sway * Math.sin(sway * 0.9 + 1.0); }
        tx += (gy - tx) * k; ty += (gx - ty) * k;
        const r = disc.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        cssv('--lx', (((r.left - sr.left) + light.x * r.width) / sr.width * 100).toFixed(2) + '%'); cssv('--ly', (((r.top - sr.top) + (1 - light.y) * r.height) / sr.height * 100).toFixed(2) + '%');
        const ox = -(light.x - .5), oy = (light.y - .5), m = Math.min(1, Math.hypot(ox, oy) / .7);
        cssv('--sx', (ox * 46).toFixed(1) + 'px'); cssv('--sy', (10 + oy * 46).toFixed(1) + 'px'); cssv('--sb', (16 + 18 * m).toFixed(1) + 'px'); cssv('--so', (.52 - .28 * m).toFixed(3));
        cssv('--tx', tx.toFixed(3) + 'deg'); cssv('--ty', ty.toFixed(3) + 'deg');
        if (ready) { size(); TEX.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
          const par = calm.matches ? 0 : P.parallax; gl.uniform2f(U.uPar, (light.x - .5) * par * 4, (light.y - .5) * par * 4);
          gl.uniform2f(U.uLight, light.x, light.y); gl.uniform1f(U.uRotX, tx * Math.PI / 180); gl.uniform1f(U.uRotY, ty * Math.PI / 180);
          gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 6); }
        const still = Math.abs(goal.x - light.x) + Math.abs(goal.y - light.y) < .0015 && Math.abs(gy - tx) + Math.abs(gx - ty) < .01;
        const more = running && seen && !document.hidden && (!still || (!pointer && !calm.matches));
        raf = more ? requestAnimationFrame(frame) : 0; if (!raf) lastFrame = 0; };
      const kick = () => { if (!raf && running && seen && !document.hidden) raf = requestAnimationFrame(frame); };
      document.addEventListener('visibilitychange', kick); addEventListener('resize', kick);
      watch(stage, (v) => { seen = v; if (v) load(); kick(); });
      live.push({ start() { running = true; kick(); }, stop() { running = false; stage.classList.remove('has-paw'); root.classList.remove('paw-cursor'); } });
    })();

    (() => {
      const stage = lab.querySelector('.stage.holo'); if (!stage) return;
      const note = (t) => { let n = stage.querySelector('.note'); if (!n) { n = document.createElement('span'); n.className = 'mono note'; stage.appendChild(n); } n.textContent = t; };
      const script = (src, key) => new Promise((ok) => { if (window[key]) return ok(window[key]); const sc = document.createElement('script'); sc.src = src;
        sc.onload = () => ok(window[key] || null); sc.onerror = () => ok(null); document.head.appendChild(sc); });
      const P = {"finish":0,"foil":1,"subjectScale":1.18,"subjectDepth":0.02,"effectsDepth":0.9,"backgroundDepth":0.15};
      const files = { subject: 'holo-subject.webp', background: 'holo-background.webp', text: 'holo-text.webp', lineart: 'holo-lineart.webp', effects: 'holo-effects.webp', back: 'holo-back.webp', model: 'holo-card.glb' };
      let card = null, loading = false, running = false, seen = false;
      const load = () => { if (loading) return; loading = true;
        Promise.all([script('assets/lab/holo-card.js', 'HoloCard'), script('assets/img/lab/holo-maps.js', '__holoMaps')]).then(([lib, maps]) => {
          if (!lib) throw new Error('holo-card.js did not load');
          const urls = {}; Object.keys(files).forEach((k) => { urls[k] = (maps && maps['holo-' + k]) || ('assets/img/lab/' + files[k]); });
          return lib.mount(stage, { urls, calm, params: P });
        }).then((c) => { card = c; stage.classList.add('is-live'); card.seen(seen); if (running) card.start(); window.__labHolo = c; })
          .catch(() => note('WebGL is not available here. This is the still picture.'));
      };
      watch(stage, (v) => { seen = v; if (v) load(); if (card) card.seen(v); });
      live.push({ start() { running = true; if (card) card.start(); }, stop() { running = false; if (card) card.stop(); } });
    })();

  };

  if (location.hash === '#lab') show();
})();
