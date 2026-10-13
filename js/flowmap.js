(function(){
  var fig = document.getElementById('flowmap'); if (!fig) return;
  var plate = fig.querySelector('.plate'), list = fig.querySelector('.flow-list > ul'), readoutP = fig.querySelector('.readout'), readout = fig.querySelector('.readout .path'), seg = fig.querySelector('.seg'), bar = fig.querySelector('.bar'), enlarge = fig.querySelector('.fm-enlarge');
  if (!plate || !list) return;
  var NS = 'http://www.w3.org/2000/svg';
  var H, PX = 14, COL = 36, ROW, GROUP, PAD, TOP, R = 10, LINE, MAXW, FONT, VG = 16, TAG = '400 10px "Geist Mono", ui-monospace, monospace', HUB = '400 11px "Geist Mono", ui-monospace, monospace', compact = false, split = false;
  function density(){
    compact = fig.dataset.density === 'compact'; split = fig.dataset.layout === 'split';
    var tight = compact && split;
    H = tight ? 26 : compact ? 28 : 32; ROW = compact ? 6 : 10; GROUP = compact ? 10 : 14; PAD = tight ? 18 : compact ? 20 : 28; TOP = PAD;
    LINE = tight ? 17 : compact ? 19 : 21; MAXW = tight ? 150 : compact ? 230 : 170; COL = tight ? 24 : compact ? 32 : 36; PX = tight ? 11 : 14;
    FONT = '500 ' + (tight ? 12.5 : compact ? 13 : 14) + 'px Geist, system-ui, sans-serif';
  }
  density();
  var cv = document.createElement('canvas').getContext('2d');
  function tw(s, f){ cv.font = f || FONT; return Math.ceil(cv.measureText(s).width) + (f ? s.length * .6 : 0); }
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function read(li, parent){
    var span = li.querySelector(':scope > span'), label = span ? span.textContent.trim() : '';
    if (span) { if (li.dataset.kind) span.dataset.kind = li.dataset.kind; if (li.dataset.from) span.dataset.from = li.dataset.from; }
    var n = { id:'', label:label, kind:li.dataset.kind || 'screen', ref:li.dataset.ref || '', refTitle:li.dataset.refTitle || '', gap:li.hasAttribute('data-gap') ? 1 : 0, phone:li.dataset.phone || '', from:li.dataset.from ? li.dataset.from.split(/\s*,\s*/) : [], phoneLabel:li.dataset.phoneLabel || '', overlay:li.hasAttribute('data-overlay'), note:li.dataset.note || '', children:[] };
    if (n.kind === 'group') n.segs = label.split(' · ');
    if (n.kind === 'steps') {
      var fm = label.match(/^(.*?)\s*›\s*\[(.*)\]\s*$/);
      n.segs = (fm ? fm[1] : label).split(' › '); n.lanes = fm ? fm[2].split(' | ').map(function(l){ return l.split(' › '); }) : [];
      n.label = n.segs.join(' › ') + (n.lanes.length ? ' › ' + n.lanes.map(function(l){ return l.join(' › '); }).join(', or ') : '');
      if (span) span.textContent = n.label;
    }
    var ul = li.querySelector(':scope > ul');
    if (ul) Array.prototype.forEach.call(ul.children, function(c){ if (c.tagName === 'LI') n.children.push(read(c, n)); });
    return n;
  }
  var base = read(list.querySelector(':scope > li'), null), seq = 0;
  (function ids(n){ n.id = 'n' + (seq++); n.children.forEach(ids); })(base);
  var MORE = { id:'more', label:'More', kind:'sheet', ref:'', refTitle:'', gap:1, phone:'', from:[], children:[] };

  function tree(mode){
    function copy(n, parent){ var c = { parent:parent, children:[] }; for (var k in n) if (k !== 'children' && k !== 'parent') c[k] = n[k]; n.children.forEach(function(ch){ c.children.push(copy(ch, c)); }); return c; }
    var t = copy(base, null);
    if (mode === 'phone') {
      (function fold(n){
        if (n.kind === 'hub') {
          if (n.phoneLabel) { n.label = n.phoneLabel; n.id += '-phone'; }
          var keep = [], more = copy(MORE, n);
          n.children.forEach(function(c){ if (c.phone === 'more') { c.parent = more; c.gap = more.children.length ? c.gap : 0; more.children.push(c); } else keep.push(c); });
          if (more.children.length) keep.push(more);
          n.children = keep;
        } else n.children.forEach(fold);
      })(t);
    }
    if (compact) (function squeeze(n){
      var out = [], run = [];
      function flush(){
        if (run.length > 1) {
          var tabs = { id:'tabs-' + run[0].id, label:run.map(function(r){ return r.label; }).join(' · '), kind:'tabs', segs:run.map(function(r){ return r.label; }), ref:'', refTitle:'', gap:run[0].gap, phone:'', from:[], parent:n, children:[] };
          run.forEach(function(r){ r.children.forEach(function(c){ c.via = r.label; c.parent = tabs; tabs.children.push(c); }); });
          measure(tabs); out.push(tabs);
        } else out.push.apply(out, run);
        run = [];
      }
      n.children.forEach(function(c){ if (c.kind === 'tab') run.push(c); else { flush(); out.push(c); } });
      flush(); n.children = out; n.children.forEach(squeeze);
    })(t);
    (function depth(n, d){ n.depth = d; n.children.forEach(function(c){ depth(c, d + 1); }); })(t, 0);
    return t;
  }

  function measure(n){
    if (n.kind === 'steps') {
      var sw = function(segs){ return segs.map(function(s){ return 26 + tw(s); }); }, sum = function(a){ return a.reduce(function(x, y){ return x + y; }, 0); };
      n.segW = sw(n.segs); n.laneW = n.lanes.map(sw); var laneMax = n.laneW.length ? Math.max.apply(null, n.laneW.map(function(a, i){ return sum(a) + (n.lanes[i].length - 1) * 22; })) : 0;
      n.w = PX + sum(n.segW) + (n.segs.length - 1) * 22 + (n.lanes.length ? 26 + laneMax : 0) + PX;
      n.h = n.lanes.length > 1 ? n.lanes.length * LINE + (H - LINE) : H; n.children.forEach(measure); return;
    }
    else if (n.kind === 'tabs') { n.segW = n.segs.map(function(s){ return tw(s) + 18; }); n.w = n.segW.reduce(function(a, b){ return a + b; }, 0) + 8; }
    else if (n.kind === 'group') {
      var lines = [[]], lw = [0];
      n.segs.forEach(function(seg){ var w = tw(seg), i = lines.length - 1, add = lw[i] ? lw[i] + 20 + w : w; if (lw[i] && add > MAXW) { lines.push([seg]); lw.push(w); } else { lines[i].push(seg); lw[i] = add; } });
      n.lines = lines; n.w = Math.max.apply(null, lw) + PX * 2; n.h = lines.length * LINE + (H - LINE); n.children.forEach(measure); return;
    }
    else if (n.kind === 'hub') n.w = tw(n.label.toUpperCase(), HUB) + PX * 2;
    else n.w = tw(n.label) + PX * 2 + (n.via && !split ? tw(n.via, TAG) + 10 : 0);
    n.h = H;
    n.children.forEach(measure);
  }
  function size(n){
    if (!n.children.length) { n.sh = n.h; n.ch = 0; return; }
    var tot = 0; n.children.forEach(function(c, i){ size(c); if (i) tot += ROW + (c.gap ? GROUP : 0); tot += c.sh; });
    n.ch = tot; n.sh = Math.max(n.h, tot);
  }
  function place(n, top, X){
    n.x = X(n);
    if (!n.children.length) { n.cy = top + n.h / 2; return; }
    var y = top + (n.sh - n.ch) / 2;
    n.children.forEach(function(c, i){ if (i) y += ROW + (c.gap ? GROUP : 0); place(c, y, X); y += c.sh; });
    n.cy = (n.children[0].cy + n.children[n.children.length - 1].cy) / 2;
  }
  function findHub(t){ var hub = null; (function h(n){ if (n.kind === 'hub') hub = n; n.children.forEach(h); })(t); return hub; }
  function clicks(k){ return k + (k === 1 ? ' click' : ' clicks'); }
  function layout(t){ var hub = findHub(t); return split && hub ? layoutSplit(t, hub) : layoutTree(t, hub); }

  function layoutTree(t, hub){
    var cols = [];
    (function w(n){ cols[n.depth] = Math.max(cols[n.depth] || 0, n.w); n.children.forEach(w); })(t);
    var colX = []; cols.forEach(function(w, i){ colX[i] = i ? colX[i - 1] + cols[i - 1] + COL : PAD; });
    size(t); place(t, TOP, function(n){ return colX[n.depth]; });
    (function s(n){ n.side = 1; n.bus = colX[n.depth] - COL / 2; n.children.forEach(s); })(t);
    var hd = hub ? hub.depth : 0, first = []; (function f(n){ if (!first[n.depth]) first[n.depth] = n.label; n.children.forEach(f); })(t);
    t.labels = cols.map(function(w, i){ var k = i - hd; return { x:colX[i], anchor:'start', s:k <= 0 ? first[i] : clicks(k) }; });
    t.W = colX[cols.length - 1] + cols[cols.length - 1] + PAD; t.H = t.sh + TOP + PAD; t.hub = hub; t.hubDepth = hd; t.maxDepth = cols.length - 1;
    return t;
  }

  function layoutSplit(t, hub){
    var pre = []; for (var p = hub.parent; p; p = p.parent) pre.unshift(p);
    size(hub);
    var kids = hub.children;
    function stack(a){ var h = 0; a.forEach(function(c, i){ if (i) h += ROW + (c.gap ? GROUP : 0); h += c.sh; }); return h; }
    var k = 1, best = Infinity;
    for (var i = 1; i < kids.length; i++) { var m = Math.max(stack(kids.slice(0, i)), stack(kids.slice(i))); if (m < best - .5) { best = m; k = i; } }
    var L = kids.slice(0, k), Rr = kids.slice(k);
    function mark(n, s){ n.side = s; n.children.forEach(function(c){ mark(c, s); }); }
    L.forEach(function(c){ mark(c, -1); }); Rr.forEach(function(c){ mark(c, 1); }); pre.forEach(function(n){ n.side = 0; }); hub.side = 0;
    var cw = { '-1':[0], '1':[0] };
    (function w(n){ if (n.side) { var d = n.depth - hub.depth; cw[n.side][d] = Math.max(cw[n.side][d] || 0, n.w); } n.children.forEach(w); })(hub);
    function span(a){ var s = 0; for (var d = 1; d < a.length; d++) s += a[d] + (d > 1 ? COL : 0); return s; }
    var C = Math.max.apply(null, pre.concat([hub]).map(function(n){ return n.w; })), cL = PAD + span(cw['-1']) + COL;
    var xR = [], xL = [];
    for (var d = 1; d < cw['1'].length; d++) xR[d] = d === 1 ? cL + C + COL : xR[d - 1] + cw['1'][d - 1] + COL;
    for (d = 1; d < cw['-1'].length; d++) xL[d] = d === 1 ? cL - COL : xL[d - 1] - cw['-1'][d - 1] - COL;
    var hL = stack(L), hR = stack(Rr), preH = pre.reduce(function(a, n){ return a + n.h + VG; }, 0);
    var cy = Math.max(TOP + Math.max(hL, hR) / 2, TOP + preH + hub.h / 2);
    function X(n){ var d = n.depth - hub.depth; return n.side > 0 ? xR[d] : xL[d] - n.w; }
    [[L, hL], [Rr, hR]].forEach(function(side){ var y = cy - side[1] / 2; side[0].forEach(function(c, i){ if (i) y += ROW + (c.gap ? GROUP : 0); place(c, y, X); y += c.sh; }); });
    hub.x = cL + (C - hub.w) / 2; hub.cy = cy;
    var y = cy - hub.h / 2; for (i = pre.length - 1; i >= 0; i--) { var n = pre[i]; y -= VG; n.cy = y - n.h / 2; y -= n.h; n.x = cL + (C - n.w) / 2; }
    (function b(n){ if (n.side) { var dd = n.depth - hub.depth; n.bus = n.side > 0 ? xR[dd] - COL / 2 : xL[dd] + COL / 2; } n.children.forEach(b); })(hub);
    var bottom = 0; (function m(n){ bottom = Math.max(bottom, n.cy + n.h / 2); n.children.forEach(m); })(t);
    t.labels = [];
    xL.forEach(function(x, d){ if (d) t.labels.push({ x:x, anchor:'end', s:clicks(d) }); });
    xR.forEach(function(x, d){ if (d) t.labels.push({ x:x, anchor:'start', s:clicks(d) }); });
    t.W = Math.max(cL + C, xR.length > 1 ? xR[xR.length - 1] + cw['1'][xR.length - 1] : 0) + PAD; t.H = bottom + PAD; t.hub = hub; t.hubDepth = hub.depth;
    t.maxDepth = hub.depth + Math.max(cw['-1'].length, cw['1'].length) - 1;
    return t;
  }

  var svg, gC, gE, gX, gN, route, nodes = {}, trees = {}, mode = 'desktop', pinned = null, hovered = null, seen = false, VW = 0, VH = 0, vb = [0, 0, 0, 0], vbRaf = 0;
  function frame(t, now){
    var to = [0, 0, t.W, t.H], from = vb.slice(); cancelAnimationFrame(vbRaf);
    if (now || reduced) { vb = to; svg.setAttribute('viewBox', to.join(' ')); return; }
    var t0 = performance.now();
    (function step(ts){ var k = Math.min(1, (ts - t0) / 550), e = 1 - Math.pow(1 - k, 4); vb = from.map(function(v, i){ return v + (to[i] - v) * e; }); svg.setAttribute('viewBox', vb.join(' ')); if (k < 1) vbRaf = requestAnimationFrame(step); })(t0);
  }
  function el(tag, attrs, parent){ var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function text(x, y, s, cls, parent){ var t = el('text', { x:x, y:y }, parent); if (cls) t.setAttribute('class', cls); t.textContent = s; return t; }
  function ringPath(w, h, side){
    var r = R, a = 'A' + r + ' ' + r + ' 0 0 ';
    if (side === 0) return 'M' + (w / 2) + ' 0H' + (w - r) + a + '1 ' + w + ' ' + r + 'V' + (h - r) + a + '1 ' + (w - r) + ' ' + h + 'H' + r + a + '1 0 ' + (h - r) + 'V' + r + a + '1 ' + r + ' 0Z';
    if (side < 0) return 'M' + w + ' ' + (h / 2) + 'V' + r + a + '0 ' + (w - r) + ' 0H' + r + a + '0 0 ' + r + 'V' + (h - r) + a + '0 ' + r + ' ' + h + 'H' + (w - r) + a + '0 ' + w + ' ' + (h - r) + 'Z';
    return 'M0 ' + (h / 2) + 'V' + r + a + '1 ' + r + ' 0H' + (w - r) + a + '1 ' + w + ' ' + r + 'V' + (h - r) + a + '1 ' + (w - r) + ' ' + h + 'H' + r + a + '1 0 ' + (h - r) + 'Z';
  }
  function card(n){
    var g = el('g', { 'class':'node' + (n.kind === 'home' ? ' home' : n.kind === 'hub' ? ' hub' : '') + (n.ref ? ' tint' : ''), tabindex:'0', 'data-id':n.id });
    if (n.ref) { g.setAttribute('data-ref', n.ref); }
    var title = el('title', {}, g); title.textContent = n.label + (n.kind === 'sheet' ? ' (opens as a sheet)' : n.kind === 'panel' ? ' (opens as a panel)' : n.kind === 'hub' ? ' (every destination is one click from here)' : n.kind === 'home' ? ' (where you land)' : '') + (n.refTitle ? ' · see ' + n.refTitle : '');
    var c = el('g', { 'class':'card' }, g), cy = n.h / 2;
    c.addEventListener('animationend', function(){ c.classList.add('done'); });
    el('rect', { 'class':'bg', x:0, y:0, width:n.w, height:n.h, rx:R }, c);
    var ring = el('path', { 'class':'ring' }, c);
    ring.style.setProperty('--len', Math.ceil(2 * (n.w + n.h) - 8 * R + 2 * Math.PI * R) + 2);
    if (n.kind === 'tab') {
      text(PX, cy - 1.5, n.label, '', c);
      el('rect', { 'class':'tab-' + n.label.toLowerCase(), x:PX - 2, y:n.h - 5.5, width:n.w - PX * 2 + 4, height:2.5, rx:1.25 }, c);
    } else if (n.kind === 'tabs') {
      var x = 4;
      n.segs.forEach(function(s, i){
        var t = text(x + n.segW[i] / 2, cy - 1.5, s, '', c); t.setAttribute('text-anchor', 'middle');
        el('rect', { 'class':'tab-' + s.toLowerCase(), x:x + 9, y:n.h - 5.5, width:n.segW[i] - 18, height:2.5, rx:1.25 }, c);
        x += n.segW[i];
      });
    } else if (n.kind === 'steps') {
      var sx = PX, no = 0;
      var step = function(x, y, label){ no++; el('circle', { 'class':'step-no', cx:x + 10, cy:y, r:9 }, c); var t = text(x + 10, y + .5, String(no), '', c); t.setAttribute('text-anchor', 'middle'); text(x + 26, y, label, '', c); };
      var chev = function(x, y){ var ch = text(x + 11, y, '›', 'dim', c); ch.setAttribute('text-anchor', 'middle'); };
      n.segs.forEach(function(s2, i){ step(sx, cy, s2); sx += n.segW[i]; if (i < n.segs.length - 1) { chev(sx, cy); sx += 22; } });
      if (n.lanes.length) {
        var bx = sx + 12, lx = sx + 26, shared = no, ys = n.lanes.map(function(_, i){ return (H - LINE) / 2 + LINE / 2 + i * LINE; });
        el('path', { 'class':'fork', d:'M' + sx + ' ' + cy + 'H' + bx + 'M' + bx + ' ' + ys[0] + 'V' + ys[ys.length - 1] + ys.map(function(y){ return 'M' + bx + ' ' + y + 'H' + (lx - 4); }).join('') }, c);
        n.lanes.forEach(function(lane, li){ var x = lx; no = shared; lane.forEach(function(s2, i){ step(x, ys[li], s2); x += n.laneW[li][i]; if (i < lane.length - 1) { chev(x, ys[li]); x += 22; } }); });
      }
    } else if (n.kind === 'group') {
      n.lines.forEach(function(line, li){
        var gx = PX, ly = (H - LINE) / 2 + LINE / 2 + li * LINE;
        line.forEach(function(s, i){ text(gx, ly, s, '', c); gx += tw(s); if (i < line.length - 1) { var dot = text(gx + 10, ly, '·', 'dim', c); dot.setAttribute('text-anchor', 'middle'); gx += 20; } });
      });
    } else if (n.kind === 'hub') {
      text(PX, cy + .5, n.label.toUpperCase(), 'hublabel', c);
    } else {
      text(PX, cy, n.label, '', c);
      if (n.via && !split) { var tag = text(n.w - PX + 2, cy + .5, n.via.toUpperCase(), 'tag', c); tag.setAttribute('text-anchor', 'end'); }
    }
    return g;
  }
  function edgePath(n){
    var p = n.parent;
    if (n.side === 0) { var cx = n.x + n.w / 2; return 'M' + cx + ' ' + (p.cy + p.h / 2) + 'V' + (n.cy - n.h / 2); }
    var s = n.side, x1 = s > 0 ? p.x + p.w : p.x, y1 = p.cy, bx = n.bus, x2 = s > 0 ? n.x : n.x + n.w, y2 = n.cy;
    if (Math.abs(y2 - y1) < 1) return 'M' + x1 + ' ' + y1 + 'H' + x2;
    var sy = y2 > y1 ? 1 : -1, r = Math.min(R, Math.abs(y2 - y1) / 2);
    return 'M' + x1 + ' ' + y1 + 'H' + (bx - s * r) + 'Q' + bx + ' ' + y1 + ' ' + bx + ' ' + (y1 + sy * r) + 'V' + (y2 - sy * r) + 'Q' + bx + ' ' + y2 + ' ' + (bx + s * r) + ' ' + y2 + 'H' + x2;
  }
  function build(){
    density(); plate.textContent = ''; nodes = {};
    measure(base); measure(MORE);
    trees = { desktop:layout(tree('desktop')), phone:layout(tree('phone')) };
    VW = trees.desktop.W; VH = trees.desktop.H;
    svg = el('svg', { viewBox:'0 0 ' + VW + ' ' + VH, width:VW, height:VH, preserveAspectRatio:'xMidYMid meet', role:'group', 'aria-label':'Map of GLOSS Vault' });
    svg.style.aspectRatio = VW + ' / ' + VH; vb = [0, 0, VW, VH];
    gC = el('g', { 'class':'cols' }, svg); gE = el('g', { 'class':'edges' }, svg); gX = el('g', { 'class':'xlinks' }, svg); gN = el('g', { 'class':'nodes' }, svg); route = el('path', { 'class':'route' }, svg);
    plate.appendChild(svg);
    show(mode, true);
    if (seen || reduced) svg.classList.add('in');
    else if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function(es){ if (es.some(function(e){ return e.isIntersecting; })) { seen = true; svg.classList.add('in'); io.disconnect(); } }, { threshold:.25 }); io.observe(plate); }
    else svg.classList.add('in');
    say(null);
    if (dlg && dlg.open) zoomTo(fitZoom(), true);
  }
  function done(){ this.classList.add('done'); }
  function findByLabel(t, label){
    var src = null, seg = -1;
    (function f(x){ if (src) return; if (x.label === label) src = x; else if (x.kind === 'tabs' && x.segs.indexOf(label) >= 0) { src = x; seg = x.segs.indexOf(label); } else if (x.kind === 'group' && x.segs.indexOf(label) >= 0) src = x; x.children.forEach(f); })(t);
    return src ? { n:src, seg:seg } : null;
  }
  function xlinkPath(src, seg, n){
    var s = n.side, x2 = s > 0 ? n.x : n.x + n.w, y2 = n.cy, x1, y1;
    if (seg >= 0) { x1 = src.x + 4; for (var i = 0; i < seg; i++) x1 += src.segW[i]; x1 += src.segW[seg] / 2; } else x1 = src.x + src.w / 2;
    if (src.depth === n.depth) {
      var s2 = y2 > src.cy ? 1 : -1, ya, gx = s > 0 ? n.x - 10 : n.x + n.w + 10, dx;
      y1 = src.cy - s2 * src.h / 2; ya = y1 - s2 * 12; dx = gx > x1 ? 1 : -1;
      return 'M' + x1 + ' ' + y1 + 'V' + (ya + s2 * 8) + 'Q' + x1 + ' ' + ya + ' ' + (x1 + dx * 8) + ' ' + ya + 'H' + (gx - dx * 8) + 'Q' + gx + ' ' + ya + ' ' + gx + ' ' + (ya + s2 * 8) + 'V' + (y2 - s2 * 10) + 'Q' + gx + ' ' + y2 + ' ' + x2 + ' ' + y2;
    }
    if (seg >= 0) { y1 = src.cy + src.h / 2; return 'M' + x1 + ' ' + y1 + 'C' + (x1 + s * 70) + ' ' + (y1 + 24) + ' ' + (x2 - s * 50) + ' ' + y2 + ' ' + x2 + ' ' + y2; }
    x1 = s > 0 ? src.x + src.w : src.x; y1 = src.cy; var k = Math.max(40, Math.abs(x2 - x1) * .45);
    return 'M' + x1 + ' ' + y1 + 'C' + (x1 + s * k) + ' ' + y1 + ' ' + (x2 - s * k) + ' ' + y2 + ' ' + x2 + ' ' + y2;
  }
  function show(m, first){
    mode = m; var t = trees[m], live = {};
    frame(t, first);
    Array.prototype.forEach.call(gE.children, function(e){ e.classList.add('gone'); });
    (function walk(n, row){
      live[n.id] = n; n.xlinks = [];
      var g = nodes[n.id]; if (!g) { g = nodes[n.id] = card(n); g.style.transform = 'translate(' + n.x + 'px, ' + (n.cy - n.h / 2) + 'px)'; gN.appendChild(g); if (!first) g.classList.add('hidden'); }
      g.__n = n; g.classList.remove('hidden');
      g.style.transform = 'translate(' + n.x + 'px, ' + (n.cy - n.h / 2) + 'px)';
      g.querySelector('.ring').setAttribute('d', ringPath(n.w, n.h, n.side));
      var c = g.querySelector('.card'), lvl = n.depth;
      c.style.setProperty('--d', (lvl * .25 + row * .015 + .1).toFixed(3) + 's');
      c.style.setProperty('--rx', n.side < 0 ? '8px' : n.side > 0 ? '-8px' : '0px'); c.style.setProperty('--ry', n.side === 0 ? '-6px' : '0px');
      if (n.parent) {
        var e = el('path', { d:edgePath(n), 'class':'edge' + ((n.kind === 'sheet' || n.kind === 'panel' || n.overlay) ? ' sheet' : ''), 'data-id':n.id }, gE);
        e.addEventListener('animationend', done);
        e.style.setProperty('--len', Math.ceil(e.getTotalLength()) + 1); e.style.setProperty('--d', ((lvl - 1) * .25 + row * .015 + .1).toFixed(3) + 's');
        n.edge = e;
      }
      n.children.forEach(function(c2, i){ walk(c2, row + i); });
    })(t, 0);
    for (var id in nodes) if (!live[id]) { nodes[id].classList.add('hidden'); nodes[id].classList.remove('on', 'pinned'); }
    gX.textContent = '';
    (function links(n){
      (n.from || []).forEach(function(label){
        var f = findByLabel(t, label); if (!f) return;
        var e = null;
        if (f.n.side === n.side && n.side !== 0) { e = el('path', { d:xlinkPath(f.n, f.seg, n), 'class':'xlink' }, gX); e.style.setProperty('--d', (t.maxDepth * .25 + .5).toFixed(3) + 's'); e.addEventListener('animationend', done); }
        n.xlinks.push({ src:f.n, el:e }); f.n.xlinks.push({ src:n, el:e, back:true, seg:label });
      });
      n.children.forEach(links);
    })(t);
    Array.prototype.slice.call(gE.querySelectorAll('.gone')).forEach(function(e){ setTimeout(function(){ e.remove(); }, 260); });
    gC.textContent = '';
    if (pinned && live[pinned.id]) { pinned = live[pinned.id]; trace(pinned); } else { pinned = null; clear(); }
  }

  function chain(n){ var a = []; for (var c = n; c; c = c.parent) a.unshift(c); return a; }
  var DRAW = .55;
  function trace(n){
    var on = {}, d = '', parts = chain(n), cum = [0], total = 0;
    parts.forEach(function(c){ on[c.id] = 1; if (c.edge) { d += c.edge.getAttribute('d'); total += c.edge.getTotalLength(); } cum.push(total); });
    for (var id in nodes) { nodes[id].classList.toggle('on', !!on[id]); nodes[id].classList.remove('via'); }
    (n.xlinks || []).forEach(function(l){ nodes[l.src.id].classList.add('via'); });
    parts.forEach(function(c, i){ nodes[c.id].querySelector('.ring').style.setProperty('--i', (total ? DRAW * cum[i] / total : 0).toFixed(3) + 's'); });
    Array.prototype.forEach.call(gE.children, function(e){ e.classList.toggle('on', !!on[e.dataset.id]); });
    Array.prototype.forEach.call(gX.children, function(e){ e.classList.remove('on'); });
    (n.xlinks || []).forEach(function(l){ if (l.el) l.el.classList.add('on'); });
    svg.classList.add('tracing');
    route.classList.remove('go'); route.setAttribute('d', d || 'M0 0'); route.style.setProperty('--len', Math.ceil(route.getTotalLength()) + 2); void route.getBoundingClientRect(); route.classList.add('go');
    say(n);
  }
  function clear(){ svg.classList.remove('tracing'); route.classList.remove('go'); say(null); }
  function say(n){
    if (!readout) return;
    readout.textContent = '';
    if (!n) {
      var count = 0; (function c(x){ if (x.kind === 'tabs') count += x.segs.length; else if (x.kind !== 'steps' && x.kind !== 'group' && x.kind !== 'hub' && x.id !== 'more') count++; x.children.forEach(c); })(trees[mode]);
      readout.textContent = count + ' screens. Point at one to see its route from sign-in' + (mode === 'phone' ? '; on the phone the tab bar holds Home, Rewards, Accounts and Goals; the rest sit under More.' : '.');
      return;
    }
    var t = trees[mode], parts = chain(n), hubD = t.hubDepth, hubName = 'the ' + (t.hub ? t.hub.label.toLowerCase() : 'sidebar');
    parts.forEach(function(c, i){ if (i) { var s = document.createElement('i'); s.textContent = '→'; readout.appendChild(s); } var nx = parts[i + 1]; readout.appendChild(document.createTextNode(c.kind === 'tabs' && nx && nx.via ? nx.via : c.label)); });
    var em = document.createElement('em'), k = n.depth - hubD;
    em.textContent = ' · ' + (n.note ? n.note : n.depth < hubD ? 'before ' + hubName : n.kind === 'hub' ? 'every destination is one click from here' : n.kind === 'home' ? 'where you land' : n.kind === 'tab' ? 'a view of ' + n.parent.label : n.kind === 'tabs' ? 'the views of ' + n.parent.label : n.kind === 'steps' ? 'inside the sheet' : n.kind === 'group' ? 'parts of ' + n.parent.label : clicks(k) + ' from ' + hubName + ((n.kind === 'sheet' || n.kind === 'panel') ? ', opens over ' + (n.via || n.parent.label) : ''));
    if (n.from.length) em.textContent += ' · also from ' + n.from.join(' and ');
    (n.xlinks || []).filter(function(l){ return l.back; }).forEach(function(l){ em.textContent += ' · ' + (n.kind === 'group' ? l.seg + ' opens ' : 'a row on ' + (l.seg || n.label) + ' opens ') + l.src.label; });
    readout.appendChild(em);
    if (n.ref) { var a = document.createElement('a'); a.href = n.ref; a.textContent = 'Read in ' + n.refTitle + ' →'; a.style.marginLeft = '10px'; a.addEventListener('click', function(){ if (dlg && dlg.open) dlg.close(); }); readout.appendChild(a); }
  }
  var hold, dragged = false;
  function over(g){ clearTimeout(hold); hovered = g.__n; trace(hovered); }
  function out(){ hold = setTimeout(function(){ hovered = null; if (pinned) trace(pinned); else clear(); }, 120); }
  plate.addEventListener('mouseover', function(ev){ var g = ev.target.closest && ev.target.closest('.node'); if (g) over(g); });
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
    if (dragged) { dragged = false; return; }
    var g = ev.target.closest && ev.target.closest('.node');
    if (g) pin(g);
    else if (pinned) { nodes[pinned.id].classList.remove('pinned'); pinned = null; clear(); }
  });
  plate.addEventListener('keydown', function(ev){
    var g = ev.target.closest && ev.target.closest('.node'); if (!g) return;
    var n = g.__n, to = null, k = ev.key, s = n.side, kids = n.children;
    if (k === 'Enter' || k === ' ') { ev.preventDefault(); pin(g); return; }
    if (k === 'Escape' && pinned) { ev.preventDefault(); nodes[pinned.id].classList.remove('pinned'); pinned = null; trace(n); return; }
    if (s === 0) {
      if (k === 'ArrowUp') to = n.parent;
      else if (k === 'ArrowDown') to = kids[0] && kids[0].side === 0 ? kids[0] : null;
      else if (k === 'ArrowLeft' || k === 'ArrowRight') { var want = k === 'ArrowLeft' ? -1 : 1; to = kids.filter(function(c){ return c.side === want; })[0] || null; }
    } else {
      var inward = s > 0 ? 'ArrowLeft' : 'ArrowRight';
      if (k === inward) to = n.parent;
      else if (k === 'ArrowLeft' || k === 'ArrowRight') to = kids[0];
      else if (k === 'ArrowUp' || k === 'ArrowDown') { var sib = (n.parent ? n.parent.children : [n]).filter(function(c){ return c.side === s; }), i = sib.indexOf(n) + (k === 'ArrowDown' ? 1 : -1); to = sib[i]; }
    }
    if (to) { ev.preventDefault(); nodes[to.id].focus(); }
  });
  function pill(){ if (!seg) return; var b = seg.querySelector('[aria-pressed="true"]'); seg.style.setProperty('--w', b.offsetWidth + 'px'); seg.style.setProperty('--i', b.offsetLeft + 'px'); }
  if (seg) {
    var btns = seg.querySelectorAll('button');
    Array.prototype.forEach.call(btns, function(b){ b.addEventListener('click', function(){ if (b.dataset.mode === mode) return; Array.prototype.forEach.call(btns, function(x){ x.setAttribute('aria-pressed', String(x === b)); }); pill(); show(b.dataset.mode, false); }); });
    pill(); addEventListener('resize', pill);
    if (document.fonts) document.fonts.ready.then(pill);
  }

  var dlg = null, hold2 = null, z = 1, zOut = null;
  function fitZoom(){ var aw = plate.clientWidth - 24, ah = plate.clientHeight - 24; return Math.max(.4, Math.min(aw / VW, ah / VH, 1.6)); }
  function zoomTo(nz, reset){
    nz = Math.max(.4, Math.min(2.5, nz));
    var cx = reset ? .5 : (plate.scrollLeft + plate.clientWidth / 2) / (VW * z), cyy = reset ? .5 : (plate.scrollTop + plate.clientHeight / 2) / (VH * z);
    z = nz; svg.style.width = (VW * z) + 'px'; svg.style.height = (VH * z) + 'px';
    plate.scrollLeft = cx * VW * z - plate.clientWidth / 2; plate.scrollTop = cyy * VH * z - plate.clientHeight / 2;
    if (zOut) zOut.textContent = Math.round(z * 100) + '%';
  }
  function openFull(){
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'flowmap flowmap-full'; dlg.setAttribute('aria-label', 'The whole product, enlarged');
      dlg.innerHTML = '<div class="fm-full-head"><p class="mono">The whole product</p><div class="fm-zoom" role="group" aria-label="Zoom"><button type="button" data-z="out" aria-label="Zoom out">−</button><output aria-live="polite">100%</output><button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="fit">Fit</button></div><button type="button" class="fm-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="fm-full-body"></div>';
      document.body.appendChild(dlg);
      zOut = dlg.querySelector('.fm-zoom output');
      dlg.querySelector('.fm-zoom').addEventListener('click', function(ev){ var b = ev.target.closest('button'); if (!b) return; var k = b.dataset.z; zoomTo(k === 'fit' ? fitZoom() : k === 'in' ? z * 1.2 : z / 1.2, k === 'fit'); });
      dlg.querySelector('.fm-close').addEventListener('click', function(){ dlg.close(); });
      dlg.addEventListener('click', function(ev){ if (ev.target === dlg) dlg.close(); });
      dlg.addEventListener('close', closeFull);
      addEventListener('resize', function(){ if (dlg.open) zoomTo(z); });
    }
    if (fig.dataset.density) dlg.dataset.density = fig.dataset.density; else delete dlg.dataset.density;
    var top = bar.getBoundingClientRect().top, bot = readoutP.getBoundingClientRect().bottom;
    hold2 = document.createElement('div'); hold2.className = 'fm-hold'; hold2.style.height = (bot - top) + 'px'; bar.before(hold2);
    var head = dlg.querySelector('.fm-full-head'), body = dlg.querySelector('.fm-full-body');
    head.insertBefore(bar, dlg.querySelector('.fm-zoom')); body.appendChild(plate); body.appendChild(readoutP);
    document.documentElement.classList.add('fm-locked');
    dlg.showModal(); pill();
    zoomTo(fitZoom(), true);
    dlg.querySelector('.fm-close').focus();
  }
  function closeFull(){
    if (!hold2) return;
    fig.insertBefore(bar, hold2); fig.insertBefore(plate, hold2); hold2.remove(); hold2 = null;
    var fl = fig.querySelector('.flow-list'); fl.after(readoutP);
    svg.style.width = ''; svg.style.height = ''; z = 1;
    document.documentElement.classList.remove('fm-locked'); pill();
    if (enlarge) enlarge.focus();
  }
  if (enlarge && window.HTMLDialogElement) enlarge.addEventListener('click', openFull);
  else if (enlarge) enlarge.hidden = true;
  plate.addEventListener('wheel', function(ev){ if (!(dlg && dlg.open) || !(ev.ctrlKey || ev.metaKey)) return; ev.preventDefault(); zoomTo(z * (ev.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive:false });
  var pan = null;
  plate.addEventListener('pointerdown', function(ev){ if (!(dlg && dlg.open) || ev.button !== 0 || ev.target.closest('.node')) return; pan = { x:ev.clientX, y:ev.clientY, l:plate.scrollLeft, t:plate.scrollTop, moved:false, id:ev.pointerId }; });
  plate.addEventListener('pointermove', function(ev){ if (!pan) return; var dx = ev.clientX - pan.x, dy = ev.clientY - pan.y; if (!pan.moved && Math.abs(dx) + Math.abs(dy) > 4) { pan.moved = true; plate.setPointerCapture(pan.id); plate.classList.add('panning'); } if (pan.moved) { plate.scrollLeft = pan.l - dx; plate.scrollTop = pan.t - dy; } });
  function endPan(){ if (!pan) return; if (pan.moved) { dragged = true; setTimeout(function(){ dragged = false; }, 0); } plate.classList.remove('panning'); pan = null; }
  plate.addEventListener('pointerup', endPan); plate.addEventListener('pointercancel', endPan);

  var wide = matchMedia('(min-width: 721px)');
  function a11y(){ list.parentNode.setAttribute('aria-hidden', String(wide.matches)); }
  (wide.addEventListener ? wide.addEventListener('change', a11y) : wide.addListener(a11y)); a11y();
  build();
  fig.addEventListener('flowmap:rebuild', build);
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(build);
})();
