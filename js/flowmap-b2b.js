(function(){
  var fig = document.getElementById('pmap'); if (!fig) return;
  var plate = fig.querySelector('.plate'), list = fig.querySelector('.flow-list > ul'), readout = fig.querySelector('.readout .path'), seg = fig.querySelector('.seg');
  if (!plate || !list) return;
  var NS = 'http://www.w3.org/2000/svg', refBase = fig.dataset.refBase || '', MODES = seg ? ['launch', 'next'] : ['launch'];
  var H = 28, PX = 13, ROW = 6, GROUP = 10, R = 10, LINE = 19, MAXW = 170;
  var MAIN = { col:32, pad:22, head:44 }, INSET = { col:26, pad:16, head:38, foot:14, gap:18 };
  var FONT = '500 13px Geist, system-ui, sans-serif', MONO = '400 11px "Geist Mono", ui-monospace, monospace';
  var cv = document.createElement('canvas').getContext('2d');
  function tw(s, f){ cv.font = f || FONT; return Math.ceil(cv.measureText(s).width + (f ? s.length * .66 : 0)); }
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cssD = !!(window.CSS && CSS.supports && CSS.supports('d', 'path("M0 0")'));

  var seq = 0;
  function read(li, band){
    var d = li.dataset, span = li.querySelector(':scope > span'), label = span ? span.textContent.trim() : '';
    var n = { id:'n' + (seq++), band:band, label:label, kind:d.kind || 'screen', phase:d.phase || '', from:d.from ? d.from.split(/\s*,\s*/) : [], handoff:d.handoff || '', say:d.say || '', gap:li.hasAttribute('data-gap') ? GROUP : 0, per:{}, children:[] };
    MODES.forEach(function(m){ var M = m === 'launch' ? 'Launch' : 'Next'; n.per[m] = { ref:d['ref' + M] || d.ref || '', refTitle:d['refTitle' + M] || d.refTitle || '', note:d['note' + M] || d.note || '' }; });
    if (n.kind === 'group') { n.segs = label.split(' · '); n.breaks = d.break ? d.break.split(',').map(Number) : null; }
    if (span) {
      var tag = [];
      if (n.phase) tag.push(n.phase === 'next' ? 'next sprint' : 'launch only');
      if (n.kind === 'sheet') tag.push('sheet');
      if (n.handoff) tag.push('→ ' + n.handoff + ' (back office)');
      if (n.from.length) tag.push('also from ' + n.from.join(', '));
      if (tag.length) span.dataset.tag = tag.join(' · ');
      if (d.bandLabel) span.dataset.bandLabel = d.bandLabel;
    }
    var ul = li.querySelector(':scope > ul');
    if (ul) Array.prototype.forEach.call(ul.children, function(c){ if (c.tagName === 'LI') n.children.push(read(c, band)); });
    return n;
  }
  var bands = Array.prototype.map.call(list.children, function(li, i){
    var b = { i:i, key:li.dataset.band || 'b' + i, name:li.dataset.bandLabel || '', unit:li.dataset.unit || 'click', inset:i > 0 };
    b.g = b.inset ? INSET : MAIN; b.root = read(li, b); return b;
  });
  function hubAt(n, d){ if (n.kind === 'hub') return d; for (var i = 0; i < n.children.length; i++) { var r = hubAt(n.children[i], d + 1); if (r >= 0) return r; } return -1; }
  bands.forEach(function(b){ b.hub = Math.max(0, hubAt(b.root, 0)); });

  function tree(b, mode){
    function copy(n, parent){
      if (n.phase && n.phase !== mode) return null;
      var c = { parent:parent, children:[], base:n }, k;
      for (k in n) if (k !== 'children' && k !== 'per') c[k] = n[k];
      c.ref = n.per[mode].ref; c.refTitle = n.per[mode].refTitle; c.note = n.per[mode].note;
      n.children.forEach(function(ch){ var x = copy(ch, c); if (x) c.children.push(x); });
      return c;
    }
    var t = copy(b.root, null);
    (function dep(n, d){ n.depth = d; n.children.forEach(function(c){ dep(c, d + 1); }); })(t, 0);
    return t;
  }

  function measure(n){
    if (n.kind === 'group') {
      var lines = [[]], lw = [0];
      n.segs.forEach(function(s, j){
        var w = tw(s), i = lines.length - 1, add = lw[i] ? lw[i] + 20 + w : w;
        var brk = n.breaks ? n.breaks.indexOf(j) >= 0 : (lw[i] && add > MAXW);
        if (brk) { lines.push([s]); lw.push(w); } else { lines[i].push(s); lw[i] = add; }
      });
      n.lines = lines; n.w = Math.max.apply(null, lw) + PX * 2; n.h = lines.length * LINE + (H - LINE);
    } else if (n.kind === 'hub') { n.w = tw(n.label.toUpperCase(), MONO) + PX * 2; n.h = H; }
    else { n.w = tw(n.label) + PX * 2; n.h = H; }
    n.children.forEach(measure);
  }
  var T = {}, W, HT, app, off;
  function size(n){ if (!n.children.length) { n.sh = n.h; n.ch = 0; return; } var tot = 0; n.children.forEach(function(c, i){ size(c); if (i) tot += ROW + c.gap; tot += c.sh; }); n.ch = tot; n.sh = Math.max(n.h, tot); }
  function place(n, top, b){
    n.x = b.ox + b.colX[n.depth];
    if (!n.children.length) { n.cy = top + n.h / 2; return; }
    var y = top + (n.sh - n.ch) / 2;
    n.children.forEach(function(c, i){ if (i) y += ROW + c.gap; place(c, y, b); y += c.sh; });
    n.cy = (n.children[0].cy + n.children[n.children.length - 1].cy) / 2;
  }
  function each(t, f){ (function w(n){ f(n); n.children.forEach(w); })(t); }
  function layout(){
    MODES.forEach(function(m){ T[m] = bands.map(function(b){ return tree(b, m); }); });
    var target = Math.min(1200, plate.clientWidth || 1200);
    bands.forEach(function(b, i){
      var cols = []; MODES.forEach(function(m){ each(T[m][i], function(n){ cols[n.depth] = Math.max(cols[n.depth] || 0, n.w); }); });
      var natural = cols.reduce(function(a, w){ return a + w; }, 0) + (cols.length - 1) * b.g.col + 2 * b.g.pad;
      b.gapW = b.g.col + (b.inset || natural >= target ? 0 : Math.min(40, (target - natural) / (cols.length - 1)));
      b.colX = []; cols.forEach(function(w, d){ b.colX[d] = d ? b.colX[d - 1] + cols[d - 1] + b.gapW : b.g.pad; });
      b.w = b.colX[cols.length - 1] + cols[cols.length - 1] + b.g.pad;
      b.sh = Math.max.apply(null, MODES.map(function(m){ size(T[m][i]); return T[m][i].sh; }));
    });
    app = bands[0]; off = bands[1];
    W = Math.max(app.w, off ? off.w + 2 * MAIN.pad : 0);
    app.ox = 0; app.top = 0; app.h = app.sh + MAIN.head + MAIN.pad;
    MODES.forEach(function(m){ size(T[m][0]); place(T[m][0], MAIN.head + (app.sh - T[m][0].sh) / 2, app); });
    HT = app.h;
    if (off) {
      off.ox = W - MAIN.pad - off.w; off.h = off.sh + off.g.head + off.g.foot;
      var y = MAIN.head;
      MODES.forEach(function(m){ each(T[m][0], function(n){ if (n.x + n.w > off.ox - off.g.gap) y = Math.max(y, n.cy + n.h / 2 + off.g.gap); }); });
      off.top = y; HT = Math.max(HT, y + off.h + MAIN.pad);
      MODES.forEach(function(m){ size(T[m][1]); place(T[m][1], off.top + off.g.head + (off.sh - T[m][1].sh) / 2, off); });
    }
  }

  var svg, gE = [], gX = [], gH, gN = [], routes = [], nodes = {}, edges = {}, links = {}, live = {}, mode = MODES[0], pinned = null, hovered = null, seen = false, retrace;
  function el(tag, attrs, parent){ var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function text(x, y, s, cls, parent){ var t = el('text', { x:x, y:y }, parent); if (cls) t.setAttribute('class', cls); t.textContent = s; return t; }
  function setD(e, d){ e.setAttribute('d', d); if (cssD) e.style.d = 'path("' + d + '")'; }
  function tr(n){ return 'translate(' + n.x + 'px, ' + (n.cy - n.h / 2) + 'px)'; }
  function card(n){
    var g = el('g', { 'class':'node' + (n.kind === 'home' ? ' home' : n.kind === 'hub' ? ' hub' : n.kind === 'group' ? ' group' : ''), tabindex:'0', 'data-id':n.id });
    el('title', {}, g);
    var c = el('g', { 'class':'card' }, g), cy = n.h / 2, w = n.w, h = n.h;
    c.addEventListener('animationend', function(){ c.classList.add('done'); });
    el('rect', { 'class':'bg', x:0, y:0, width:w, height:h, rx:R }, c);
    var ring = el('path', { 'class':'ring', d:'M0 ' + cy + 'V' + R + 'A' + R + ' ' + R + ' 0 0 1 ' + R + ' 0H' + (w - R) + 'A' + R + ' ' + R + ' 0 0 1 ' + w + ' ' + R + 'V' + (h - R) + 'A' + R + ' ' + R + ' 0 0 1 ' + (w - R) + ' ' + h + 'H' + R + 'A' + R + ' ' + R + ' 0 0 1 0 ' + (h - R) + 'Z' }, c);
    ring.style.setProperty('--len', Math.ceil(2 * (w + h) - 8 * R + 2 * Math.PI * R) + 2);
    if (n.kind === 'group') {
      n.lines.forEach(function(line, li){
        var gx = PX, ly = (H - LINE) / 2 + LINE / 2 + li * LINE;
        line.forEach(function(s, i){ text(gx, ly, s, '', c); gx += tw(s); if (i < line.length - 1) { var dot = text(gx + 10, ly, '·', 'dim', c); dot.setAttribute('text-anchor', 'middle'); gx += 20; } });
      });
    } else if (n.kind === 'hub') text(PX, cy + .5, n.label.toUpperCase(), 'hublabel', c);
    else text(PX, cy, n.label, '', c);
    return g;
  }
  function edgePath(n){
    var p = n.parent, b = n.band, x1 = p.x + p.w, y1 = p.cy, bx = b.ox + b.colX[n.depth] - b.gapW / 2, x2 = n.x, y2 = n.cy;
    if (Math.abs(y2 - y1) < 1) return 'M' + x1 + ' ' + y1 + 'H' + x2;
    var s = y2 > y1 ? 1 : -1, r = Math.min(R, Math.abs(y2 - y1) / 2);
    return 'M' + x1 + ' ' + y1 + 'H' + (bx - r) + 'Q' + bx + ' ' + y1 + ' ' + bx + ' ' + (y1 + s * r) + 'V' + (y2 - s * r) + 'Q' + bx + ' ' + y2 + ' ' + (bx + r) + ' ' + y2 + 'H' + x2;
  }
  function xPath(src, n){
    var x1 = src.x + src.w, y1 = src.cy, x2 = n.x, y2 = n.cy, k = Math.max(28, (x2 - x1) * .5);
    return 'M' + x1 + ' ' + y1 + 'C' + (x1 + k) + ' ' + y1 + ' ' + (x2 - k) + ' ' + y2 + ' ' + x2 + ' ' + y2;
  }
  function hPath(src, n){
    var x1 = src.x + src.w / 2, y1 = src.cy + src.h / 2, x2 = n.x + n.w / 2, y2 = n.cy - n.h / 2, k = Math.max(30, (y2 - y1) * .5);
    return 'M' + x1 + ' ' + y1 + 'C' + x1 + ' ' + (y1 + k) + ' ' + x2 + ' ' + (y2 - k) + ' ' + x2 + ' ' + y2;
  }
  function find(label, ts){ var r = null; ts.forEach(function(t){ each(t, function(x){ if (!r && x.label === label) r = x; }); }); return r; }

  function build(){
    plate.textContent = ''; nodes = {}; edges = {}; links = {};
    bands.forEach(function(b){ measure(b.root); });
    layout();
    svg = el('svg', { viewBox:'0 0 ' + W + ' ' + HT, width:W, height:HT, role:'group', 'aria-label':fig.getAttribute('aria-label') || 'Map of the product' });
    var defs = el('defs', {}, svg), rg = el('radialGradient', { id:'pm-glow', cx:0, cy:0, r:1, gradientUnits:'userSpaceOnUse', gradientTransform:'translate(' + W * .08 + ' 0) scale(' + W * .62 + ' ' + HT * .8 + ')' }, defs);
    el('stop', { offset:0, 'stop-color':'#0B4450', 'stop-opacity':.62 }, rg); el('stop', { offset:1, 'stop-color':'#0B4450', 'stop-opacity':0 }, rg);
    var gBg = el('g', {}, svg);
    var ga = el('g', { 'class':app.key }, gBg);
    el('rect', { 'class':'bandbg ' + app.key, x:0, y:0, width:W, height:HT }, ga);
    el('rect', { x:0, y:0, width:W, height:HT, fill:'url(#pm-glow)' }, ga);
    var head = el('g', { 'class':'head' }, ga), used = [];
    MODES.forEach(function(m){ each(T[m][0], function(n){ used[n.depth] = used[n.depth] || n; }); });
    text(MAIN.pad, 26, app.name, 'bandname', head);
    used.forEach(function(n, d){ if (!n || d < app.hub) return; var k = d - app.hub; text(app.colX[d], 26, k ? k + ' ' + app.unit + (k > 1 ? 's' : '') : n.label, 'col', head); });
    app.hubName = 'the ' + used[app.hub].label.toLowerCase();
    gE[0] = el('g', { 'class':'edges ' + app.key }, svg);
    if (off) {
      var go = el('g', { 'class':'inset ' + off.key }, svg);
      el('rect', { 'class':'bandbg ' + off.key, x:off.ox, y:off.top, width:off.w, height:off.h, rx:14 }, go);
      var oh = el('g', { 'class':'head' }, go);
      text(off.ox + off.g.pad, off.top + 23, off.name, 'bandname', oh);
      text(off.ox + off.g.pad + tw(off.name.toUpperCase(), MONO) + 12, off.top + 23, '· web', 'col', oh);
      off.hubName = 'the ' + T[MODES[0]][1].label.toLowerCase();
      gE[1] = el('g', { 'class':'edges ' + off.key }, svg);
    }
    bands.forEach(function(b, i){ gX[i] = el('g', { 'class':'xlinks ' + b.key }, svg); });
    gH = el('g', { 'class':'handoffs' }, svg);
    bands.forEach(function(b, i){ gN[i] = el('g', { 'class':'nodes ' + b.key }, svg); });
    routes = bands.map(function(b){ return el('path', { 'class':'route ' + b.key }, svg); });
    plate.appendChild(svg);
    MODES.forEach(function(m){ T[m].forEach(function(t, i){ (function mk(n, row){ if (!nodes[n.id]) { var g = nodes[n.id] = card(n); g.classList.add('hidden'); g.style.transform = tr(n); gN[i].appendChild(g); g.querySelector('.card').style.setProperty('--d', ((i ? 1.2 : 0) + n.depth * .22 + row * .015 + .1).toFixed(3) + 's'); } n.children.forEach(function(c, j){ mk(c, row + j); }); })(t, 0); }); });
    show(mode, true);
    if (seen || reduced) svg.classList.add('in');
    else if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function(es){ if (es.some(function(e){ return e.isIntersecting; })) { seen = true; svg.classList.add('in'); io.disconnect(); } }, { threshold:.2 }); io.observe(plate); }
    else svg.classList.add('in');
    say(null);
  }

  function show(m, first){
    mode = m; live = {};
    var last = 0; each(T[m][0], function(n){ last = Math.max(last, n.depth); });
    T[m].forEach(function(t, bi){
      (function walk(n, row){
        live[n.id] = n;
        var g = nodes[n.id]; g.__n = n; g.classList.remove('hidden'); g.style.transform = tr(n);
        g.classList.toggle('tint', !!n.ref);
        g.querySelector('title').textContent = n.label + (n.kind === 'sheet' ? ' (opens as a sheet)' : n.kind === 'hub' ? ' (every destination hangs off it)' : n.kind === 'home' ? ' (where you land)' : '') + (n.refTitle ? ' · see ' + n.refTitle : '');
        if (n.parent) {
          var d = edgePath(n), e = edges[n.id];
          if (!e) {
            e = edges[n.id] = el('path', { 'class':'edge' + (n.kind === 'sheet' ? ' sheet' : ''), 'data-id':n.id }, gE[bi]);
            setD(e, d); e.style.setProperty('--len', Math.ceil(e.getTotalLength()) + 1);
            e.style.setProperty('--d', first ? ((bi ? 1.2 : 0) + (n.depth - 1) * .22 + row * .015 + .1).toFixed(3) + 's' : '.34s');
            e.addEventListener('animationend', function(ev){ if (ev.target === this) this.classList.add('done'); });
          } else { e.classList.remove('gone'); setD(e, d); }
          n.edge = e;
        }
        n.children.forEach(function(c, i){ walk(c, row + i); });
      })(t, 0);
    });
    for (var id in nodes) if (!live[id]) { nodes[id].classList.add('hidden'); nodes[id].classList.remove('on', 'pinned', 'via'); }
    for (var eid in edges) if (!live[eid]) { (function(e, k){ e.classList.add('gone'); delete edges[k]; setTimeout(function(){ e.remove(); }, 240); })(edges[eid], eid); }
    var keep = {}, late = (Math.max(last * .22, 1.2 + 2 * .22) + .6).toFixed(2) + 's';
    T[m].forEach(function(t, bi){
      each(t, function(n){
        n.from.forEach(function(label){
          var src = find(label, [t]); if (!src) return;
          var key = 'x' + src.id + '>' + n.id; keep[key] = 1;
          var L = links[key] || (links[key] = { el:el('path', { 'class':'xlink' }, gX[bi]), type:'x' });
          L.a = src; L.b = n; setD(L.el, xPath(src, n)); L.el.style.setProperty('--d', late);
        });
        if (n.handoff) {
          var dst = find(n.handoff, T[m].filter(function(x, j){ return j !== bi; }));
          if (!dst) return;
          var key2 = 'h' + n.id + '>' + dst.id; keep[key2] = 1;
          var L2 = links[key2];
          if (!L2) L2 = links[key2] = { el:el('path', { 'class':'hand' }, gH), e1:el('circle', { 'class':'hand-end', r:2.6 }, gH), e2:el('circle', { 'class':'hand-end', r:2.6 }, gH), type:'h' };
          L2.a = n; L2.b = dst; setD(L2.el, hPath(n, dst));
          L2.e1.setAttribute('cx', n.x + n.w / 2); L2.e1.setAttribute('cy', n.cy + n.h / 2); L2.e2.setAttribute('cx', dst.x + dst.w / 2); L2.e2.setAttribute('cy', dst.cy - dst.h / 2);
          [L2.el, L2.e1, L2.e2].forEach(function(x){ x.style.setProperty('--d', late); });
        }
      });
    });
    for (var key in links) if (!keep[key]) { [links[key].el, links[key].e1, links[key].e2].forEach(function(x){ if (x) x.remove(); }); delete links[key]; }
    pinned = pinned && live[pinned.id] || null; hovered = null;
    clearTimeout(retrace);
    if (pinned) { clear(); retrace = setTimeout(function(){ trace(pinned); }, first || reduced ? 0 : 560); }
    else clear();
  }

  function chain(n){ var a = []; for (var c = n; c; c = c.parent) a.unshift(c); return a; }
  function touching(n){ var r = []; for (var k in links) { var L = links[k]; if (L.a === n || L.b === n) r.push(L); } return r; }
  var DRAW = .55;
  function draw(r, parts, delay){
    var d = '', cum = [0], total = 0;
    parts.forEach(function(c){ if (c.edge) { d += c.edge.getAttribute('d'); total += c.edge.getTotalLength(); } cum.push(total); });
    parts.forEach(function(c, i){ nodes[c.id].querySelector('.ring').style.setProperty('--i', (delay + (total ? DRAW * cum[i] / total : 0)).toFixed(3) + 's'); });
    r.classList.remove('go'); r.setAttribute('d', d || 'M0 0'); r.style.setProperty('--len', Math.ceil(r.getTotalLength()) + 2); r.style.setProperty('--rd', delay.toFixed(2) + 's');
    void r.getBoundingClientRect(); r.classList.add('go');
  }
  function trace(n){
    var on = {}, parts = chain(n), rel = [], via = [], hand = null, other = null;
    parts.forEach(function(c){ on[c.id] = 1; touching(c).forEach(function(L){ if ((L.type === 'h' || c === n) && rel.indexOf(L) < 0) rel.push(L); }); });
    rel.forEach(function(L){ var o = on[L.a.id] ? L.b : L.a; if (L.type === 'h' && !hand) { hand = L; other = chain(o); } else via.push(o); });
    if (other) other.forEach(function(c){ on[c.id] = 1; });
    for (var id in nodes) { nodes[id].classList.toggle('on', !!on[id]); nodes[id].classList.remove('via'); }
    via.forEach(function(o){ nodes[o.id].classList.add('via'); });
    for (var k in links) { var L = links[k]; [L.el, L.e1, L.e2].forEach(function(x){ if (x) x.classList.remove('on'); }); }
    rel.forEach(function(L){ [L.el, L.e1, L.e2].forEach(function(x){ if (x) x.classList.add('on'); }); });
    for (var e in edges) edges[e].classList.toggle('on', !!on[e]);
    svg.classList.add('tracing');
    routes.forEach(function(r){ r.classList.remove('go'); });
    draw(routes[n.band.i], parts, 0);
    if (hand) { hand.el.style.setProperty('--hd', (DRAW * .7).toFixed(2) + 's'); draw(routes[other[0].band.i], other, DRAW + .25); }
    say(n);
  }
  function clear(){ if (!svg) return; svg.classList.remove('tracing'); routes.forEach(function(r){ r.classList.remove('go'); }); say(null); }
  function say(n){
    if (!readout) return;
    readout.textContent = '';
    if (!n) { readout.textContent = fig.dataset[mode === 'next' ? 'sayNext' : 'sayLaunch'] || ''; return; }
    var parts = chain(n), b = n.band, hubName = b.hubName || 'the hub';
    parts.forEach(function(c, i){ if (i) { var s = document.createElement('i'); s.textContent = '→'; readout.appendChild(s); } readout.appendChild(document.createTextNode(c.say || c.label)); });
    var bits = [], k = n.depth - b.hub;
    if (n.note) bits.push(n.note);
    else if (n.depth < b.hub) bits.push('before ' + hubName);
    else bits.push(k + ' ' + b.unit + (k === 1 ? '' : 's') + ' from ' + hubName + (n.kind === 'sheet' ? ', opens over ' + n.parent.label : ''));
    if (n.phase) bits.push(n.phase === 'next' ? 'next sprint' : 'launch only');
    if (n.from.length) bits.push('also from ' + n.from.join(' and '));
    touching(n).forEach(function(L){ if (L.type === 'h') bits.push(L.a === n ? 'lands in ' + L.b.label + ', in the back office' : 'arrives from ' + L.a.label + ', in the app'); else if (L.a === n) bits.push('a button here also opens ' + L.b.label); });
    var em = document.createElement('em'); em.textContent = ' · ' + bits.join(' · '); readout.appendChild(em);
    if (n.ref) { var a = document.createElement('a'); a.href = refBase + n.ref; a.textContent = 'Read in ' + n.refTitle + ' →'; a.style.marginLeft = '10px'; readout.appendChild(a); }
  }

  var hold;
  function over(g){ clearTimeout(hold); hovered = g.__n; trace(hovered); }
  function out(){ hold = setTimeout(function(){ hovered = null; if (pinned) trace(pinned); else clear(); }, 120); }
  plate.addEventListener('mouseover', function(ev){ var g = ev.target.closest && ev.target.closest('.node'); if (g && !g.classList.contains('hidden')) over(g); });
  plate.addEventListener('mouseout', function(ev){ var g = ev.target.closest && ev.target.closest('.node'); if (g && !(ev.relatedTarget && g.contains(ev.relatedTarget))) out(); });
  plate.addEventListener('focusin', function(ev){ var g = ev.target.closest('.node'); if (g) over(g); });
  plate.addEventListener('focusout', function(ev){ if (!(ev.relatedTarget && plate.contains(ev.relatedTarget))) out(); });
  function pin(g){
    var n = g.__n;
    if (pinned === n) { pinned = null; g.classList.remove('pinned'); trace(n); return; }
    for (var id in nodes) nodes[id].classList.remove('pinned');
    pinned = n; g.classList.add('pinned'); trace(n);
  }
  plate.addEventListener('click', function(ev){
    var g = ev.target.closest && ev.target.closest('.node');
    if (g) pin(g);
    else if (pinned) { nodes[pinned.id].classList.remove('pinned'); pinned = null; clear(); }
  });
  plate.addEventListener('keydown', function(ev){
    var g = ev.target.closest && ev.target.closest('.node'); if (!g) return;
    var n = g.__n, to = null, k = ev.key;
    if (k === 'Enter' || k === ' ') { ev.preventDefault(); pin(g); return; }
    if (k === 'Escape' && pinned) { nodes[pinned.id].classList.remove('pinned'); pinned = null; trace(n); return; }
    if (k === 'ArrowLeft') to = n.parent;
    else if (k === 'ArrowRight') to = n.children[0];
    else if (k === 'ArrowUp' || k === 'ArrowDown') { var sib = n.parent ? n.parent.children : T[mode], i = sib.indexOf(n) + (k === 'ArrowDown' ? 1 : -1); to = sib[i]; }
    if (to) { ev.preventDefault(); nodes[to.id].focus(); }
  });
  if (seg) {
    var btns = seg.querySelectorAll('button');
    function pill(){ var b = seg.querySelector('[aria-pressed="true"]'); seg.style.setProperty('--w', b.offsetWidth + 'px'); seg.style.setProperty('--i', (b.offsetLeft - 4) + 'px'); }
    Array.prototype.forEach.call(btns, function(b){ b.addEventListener('click', function(){
      if (b.dataset.mode === mode) return;
      Array.prototype.forEach.call(btns, function(x){ x.setAttribute('aria-pressed', String(x === b)); }); pill();
      if (!seen) { seen = true; svg.classList.add('in'); }
      show(b.dataset.mode, false);
    }); });
    pill(); addEventListener('resize', pill);
    if (document.fonts) document.fonts.ready.then(pill);
  }
  var wide = matchMedia('(min-width: 721px)');
  function a11y(){ list.parentNode.setAttribute('aria-hidden', String(wide.matches)); }
  (wide.addEventListener ? wide.addEventListener('change', a11y) : wide.addListener(a11y)); a11y();
  build();
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(build);
  var lastW = plate.clientWidth, rs;
  addEventListener('resize', function(){ clearTimeout(rs); rs = setTimeout(function(){ if (Math.abs(plate.clientWidth - lastW) > 30) { lastW = plate.clientWidth; build(); svg.classList.add('instant'); } }, 200); });
})();
