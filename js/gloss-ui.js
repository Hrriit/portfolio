(function () {
'use strict';
const SRC = p => (window.GV_INLINE && window.GV_INLINE[p]) || ((window.GV_BASE || '') + p);

const ACC = [
  { k:'anz',  name:'ANZ saving account', prod:'Online Saver',      rate:'3.65% p.a.', amt:'4,950.00', orb:'ANZ saving account', orbM:'ANZ saving', val:'4.95k', pct:'36' },
  { k:'nab',  name:'NAB saving account', prod:'iSaver',            rate:'4.25% p.a.', amt:'3,204.10', orb:'NAB saving account', orbM:'NAB saving', val:'3.20k', pct:'23' },
  { k:'cba',  name:'CBA Access Account', prod:'NetBank Saver',     rate:'4.25% p.a.', amt:'1,911.70', orb:'CBA Access',         orbM:'CBA Access', val:'1.91k', pct:'14' },
  { k:'hsbc', name:'HSBC AU',            prod:'Everyday Savings',  rate:'4.55% p.a.', amt:'2,900.00', orb:'HSBC AU',            orbM:'HSBC AU',    val:'2.90k', pct:'21' },
  { k:'ing',  name:'ING Account',        prod:'Savings Maximiser', rate:'3.65% p.a.', amt:'847.51',   orb:'ING',                orbM:'ING',        val:'0.85k', pct:'6'  },
];
const BY = Object.fromEntries(ACC.map(a => [a.k, a]));
const ORBS = {
  figma: { desk: { anz:[155,130,236], hsbc:[9,84,168], cba:[54,329,138], ing:[398,78,80], nab:[368,263,150] } },
  new: {
    desk: { anz:[151.7,177,224], hsbc:[11.1,72.9,171.5], cba:[44.2,345.1,139.2], ing:[323.4,106.8,92.7], nab:[360.7,306.9,180.2] },
    mob:  { anz:[91.9,72.1,128], hsbc:[11.6,12.6,98], cba:[30.5,168.2,79.5], ing:[190.1,32,53], nab:[211.4,146.4,103] },
  },
};
const ORB_FS = {
  figma: { desk: { anz:52, nab:32, hsbc:32, cba:32, ing:22 }, mob: { anz:28, nab:21, hsbc:20, cba:18, ing:13 } },
  new:   { desk: { anz:50, nab:34, hsbc:33, cba:30, ing:22 }, mob: { anz:28, nab:21, hsbc:20, cba:18, ing:13 } },
};

function h(tag, cls, kids, attrs) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  for (const k of kids || []) if (k != null) e.append(typeof k === 'string' ? document.createTextNode(k) : k);
  return e;
}
const T = (txt, cls) => h('span', 't' + (cls ? ' ' + cls : ''), [txt]);
const I = (name, cls, ext) => h('img', cls || '', [], { src:SRC(`${window.GV_ROOT || 'assets/'}${ext || 'icons'}/${name}.${ext === 'logos' ? 'png' : 'svg'}`), alt:'', draggable:'false' });
const NUM = (v, cls) => { const s = h('span', 'num t' + (cls ? ' ' + cls : ''), [v]); s.dataset.v = v; return s; };

const DOTS = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', '22'); s.setAttribute('height', '22'); s.setAttribute('viewBox', '0 0 22 22');
  s.innerHTML = '<g fill="#80838D"><circle cx="5" cy="11" r="1.7"/><circle cx="11" cy="11" r="1.7"/><circle cx="17" cy="11" r="1.7"/></g>'; return s; };
const STATUS = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', '70'); s.setAttribute('height', '13'); s.setAttribute('viewBox', '0 0 70 13');
  s.innerHTML = '<g fill="#1c2024"><rect x="0" y="8.5" width="3.2" height="4" rx=".9"/><rect x="4.6" y="6.3" width="3.2" height="6.2" rx=".9"/><rect x="9.2" y="3.9" width="3.2" height="8.6" rx=".9"/><rect x="13.8" y="1.2" width="3.2" height="11.3" rx=".9"/>'
    + '<path d="M29.6 3.7c2.2 0 4.2.85 5.7 2.25l1.05-1.08A9.7 9.7 0 0 0 29.6 2.2a9.7 9.7 0 0 0-6.75 2.67l1.05 1.08a8.2 8.2 0 0 1 5.7-2.25Zm0 3.15c1.35 0 2.6.52 3.5 1.38l1.06-1.08a6.6 6.6 0 0 0-4.56-1.8 6.6 6.6 0 0 0-4.56 1.8l1.06 1.08c.9-.86 2.15-1.38 3.5-1.38Zm0 3.1c.5 0 .95.2 1.3.52L29.6 11.8l-1.3-1.33c.35-.32.8-.52 1.3-.52Z"/>'
    + '<rect x="44.5" y=".9" width="22" height="11.2" rx="3.4" fill="none" stroke="#1c2024" stroke-opacity=".4"/><rect x="46.2" y="2.6" width="18.6" height="7.8" rx="2"/><path d="M68 4.6v3.8c.75-.25 1.3-1 1.3-1.9s-.55-1.65-1.3-1.9Z" fill-opacity=".45"/></g>';
  return s; };

function orbsPanel(platform, variant) {
  const box = h('div', 'orbs');
  const L = (ORBS[variant] && ORBS[variant][platform]) || ORBS.new[platform];
  const FS = ORB_FS[variant][platform];
  for (const k of ['anz', 'hsbc', 'nab', 'cba', 'ing']) {
    const a = BY[k], [x, y, d] = L[k];
    const o = h('div', 'orb ld bone' + (k === 'anz' ? ' hero' : ''));
    o.dataset.k = k; o.dataset.d = d;
    Object.assign(o.style, { left:x + 'px', top:y + 'px', width:d + 'px', height:d + 'px' });
    const pc = h('div', 'pc', [h('span', 'n t', [a.pct]), T('%', 'u')]);
    pc.firstChild.style.fontSize = FS[k] + 'px';
    o.append(pc, T(platform === 'mob' ? a.orbM : a.orb, 'nm'));
    if (k !== 'ing') o.append(T(a.val, 'val'));
    box.append(o);
  }
  return box;
}
function balCard(platform, variant) {
  const mob = platform === 'mob';
  return h('div', 'card bal', [
    h('div', 'ch', [
      h('div', 'tt', [T('Account balances', 'h6'), T('Share of total balance by account', 'sub')]),
      h('div', 'pill vseg', [h('span', 'on', [I('orbs')]), h('span', '', [I('pie')]), h('span', '', [I('bars')])]),
    ]),
    orbsPanel(platform, variant),
    h('div', 'note ld', [h('i', 'dot'), T(mob ? 'Orb size = share of total · tap one to open it' : 'Orb size = share of total · tap an orb to open the account')]),
  ]);
}
function accRow(a, mob) {
  const am = h('div', 'am', [T(a.amt, 'n'), T('AUD', 'u')]);
  const r = h('div', 'row ld', [
    h('span', 'well bone', [I(a.k, '', 'logos')]),
    h('div', 'tx', [T(a.name, 'nm'), h('div', 'pr', mob ? [T(a.prod)] : [T(a.prod), T(a.rate, 'rate')])]),
    mob ? h('div', 'amc', [am, T(a.rate, 'rate')]) : am,
    h('span', 'rb op bone', [I('chev-sm')]),
  ]);
  r.dataset.k = a.k;
  return r;
}
function acctsCard(mob) {
  return h('div', 'card accts', [
    h('div', 'list', [
      h('div', 'hd', [T('Accounts', 'h6'), h('span', 'ld', [T('5', 'cnt')]), h('span', 'sp'), T('View all', 'va')]),
      ...['anz', 'nab', 'cba', 'hsbc', 'ing'].map(k => accRow(BY[k], mob)),
    ]),
    h('div', 'sync ld', [h('i', 'dot'), T('All 5 synced 6 min ago')]),
  ]);
}
function credCard() {
  return h('div', 'card cred', [
    h('div', 'l', [
      h('div', 'lr', [T('GLOSS Credits', 'tag navy'), T('Reward program', 'meta')]),
      h('div', 'amt ld', [NUM('≈4'), NUM('.50', 'dim'), T('AUD', 'unit')]),
    ]),
    h('span', 'go', [I('chev-white')]),
  ]);
}
function msumCard() {
  return h('div', 'msum', [
    h('span', 'w', [I('bars-white')]),
    h('div', 'tx', [T('Monthly summary', 'a'), T('May 2025 · spending, income and savings recap · new', 'b ld')]),
    h('span', 'rb', [I('chev-sm')]),
  ]);
}
function stat(tag, tagCls, v, u, cap) {
  return h('div', 'stat', [T(tag, 'tag' + (tagCls ? ' ' + tagCls : '')), h('div', 'v ld', [NUM(v), T(u, 'u')]), T(cap, 'cap ld')]);
}
function statsRow() {
  return h('div', 'stats', [
    stat('Accounts', '', '5', 'linked', 'Banks connected'),
    stat('Best rate', 'teal', '4.55', '% p.a.', 'HSBC Everyday'),
    stat('Largest', '', '36', '%', 'ANZ saving account'),
    stat('Rewards', 'navy', '≈4.50', 'AUD', 'GLOSS Credits'),
  ]);
}

const NAV = [
  [['home', 'home-off', 'home', 'Home'], ['rewards', 'rewards', 'rewards', 'Rewards'], ['accounts', 'accounts', 'accounts', 'Accounts']],
  [['goals', 'budget', 'budget-on', 'Goals'], ['assets', 'assets', 'assets', 'Assets'], ['categories', 'categories', 'categories', 'Categories'], ['plugins', 'plugins', 'plugins', 'Tools & Plugins']],
  [['settings', 'settings', 'settings', 'Settings'], ['help', 'help', 'help', 'Help Center']],
];
function sideBar(active, icons) {
  const grp = (items) => h('div', 'grp', items.map(([k, ic, icOn, label]) => h('div', 'it' + (k === active ? ' on' : ''), [I((icons && icons[k]) || (k === active ? icOn : ic)), T(label)])));
  return h('aside', 'side', [
    h('div', 'brand', [h('div', 'logo', [h('span', 'mk', [I('logo-a', 'a'), I('logo-b', 'b')]), T('GLOSS Vault', 'wd')])]),
    h('nav', 'nav', [grp(NAV[0]), h('i', 'div'), grp(NAV[1]), h('i', 'div'), grp(NAV[2])]),
    h('div', 'mode', [h('div', 'seg2', [h('span', 'on', [I('sun', 'sun'), T('Light')]), h('span', '', [I('moon', 'moon'), T('Dark')])])]),
  ]);
}

function buildDesk(opt) {
  opt = opt || {};
  const variant = opt.orbs || 'new';
  const root = h('div', 'gv desk', [
    I('glow', 'glow'),
    sideBar('home'),
    h('div', 'head', [
      h('div', 'pill seg', [h('span', '', [T('Past')]), h('span', 'on', [h('i', 'dot'), T('Today')]), h('span', '', [T('Future')])]),
      h('div', 'pill step', [h('span', 'rb', [I('chev-l')]), T('Sun, 1 Jun 2025', 'date'), h('span', 'rb', [I('chev-r')])]),
      h('span', 'pill ib', [I('calendar')]),
      h('span', 'sp'),
      h('div', 'pill filter', [T('Filter', 'lab'), T('All accounts', 'val'), h('span', 'fb', [I('sliders')])]),
      h('div', 'acts', [h('span', 'pill ib', [I('ai', 'ai')]), h('span', 'pill ib', [I('search')]), h('span', 'pill ib', [I('bell')])]),
    ]),
    h('div', 'cols', [
      h('div', 'lcol', [
        h('div', 'hero', [
          h('div', 'lr', [h('i', 'dot'), T('Total balance', 'ttl'), h('span', 'ld', [T('· across 5 accounts, today', 'meta')]), h('span', 'eye', [I('eye')])]),
          h('div', 'amt ld', [NUM('13,813'), NUM('.31', 'dim'), T('AUD', 'unit')]),
          statsRow(),
        ]),
        balCard('desk', variant),
      ]),
      h('div', 'rcol', [acctsCard(), credCard(), msumCard()]),
    ]),
  ]);
  root.dataset.orbs = variant;
  return root;
}

function buildPanel(opt) {
  const variant = (opt || {}).orbs || 'new';
  const root = h('div', 'gv panel', [balCard('desk', variant)]);
  root.dataset.orbs = variant;
  return root;
}

const SPEND = [
  { name:'Groceries',  cyc:'Weekly',  amt:'43.00', unit:'AUD left', fill:280, tone:'teal',  of:'77.00 of 120.00 AUD · 64%', st:'On track' },
  { name:'Transport',  cyc:'Weekly',  amt:'28.00', unit:'AUD left', fill:192, tone:'teal',  of:'22.00 of 50.00 AUD · 44%',  st:'On track' },
  { name:'Fuel',       cyc:'Weekly',  amt:'10.00', unit:'AUD over', fill:436, tone:'red',   of:'50.00 of 40.00 AUD · 125%', st:'Over budget' },
  { name:'Dining out', cyc:'Monthly', amt:'16.00', unit:'AUD left', fill:366, tone:'amber', of:'84.00 of 100.00 AUD · 84%', st:'Pacing to overspend', on:true },
];
const CATS = [['Dining out', '74%', '62.00', 443], ['Coffee', '18%', '15.00', 107], ['Takeaway', '8%', '7.00', 50]];
const HIST = [['June 2026', '100.00', '92.00', '+8.00', 'in'], ['May 2026', '100.00', '110.00', '−10.00', 'out'], ['April 2026', '100.00', '89.00', '+11.00', 'in']];
const goalsHead = () => h('div', 'ghd', [
  T('Spending Budgets · July 2026', 'ttl'), h('span', 'sp'),
  h('div', 'acts', [h('span', 'pill ib', [I('ai', 'ai')]), h('span', 'pill ib', [I('search')]), h('span', 'pill ib', [I('bell')])]),
]);
function buildGoals() {
  let n = 0;
  const fill = (w, of) => { const f = h('i', 'fill'); f.style.width = (w / of * 100).toFixed(3) + '%'; f.style.setProperty('--i', n++); return f; };
  const card = (b) => h('div', 'bc ' + b.tone + (b.on ? ' on' : ''), [
    h('div', 'top', [T(b.name, 'nm'), T(b.cyc, 'tag'), h('span', 'sp'), h('div', 'am', [T(b.amt, 'n'), T(b.unit, 'u')])]),
    h('div', 'meter', [fill(b.fill, 444)]),
    h('div', 'bot', [T(b.of, 'of'), h('span', 'sp'), h('i', 'dot'), T(b.st, 'st')]),
  ]);
  const cat = ([name, pc, v, w]) => h('div', 'blk', [fill(w, 608), T(name, 'nm'), T(pc, 'pc'), h('div', 'am', [T(v, 'n'), T('AUD', 'u')])]);
  const hist = ([p, b, a, v, k]) => h('div', 'hr', [T(p, 'p'), T(b, 'v'), T(a, 'v'), T(v, 'v ' + k)]);
  return h('div', 'gv desk goals', [
    sideBar('goals'),
    goalsHead(),
    h('div', 'gcols', [
      h('div', 'gl', [
        h('div', 'tabs', [h('span', 'on', [T('Spending Budgets')]), h('span', '', [T('Saving Goals')])]),
        h('div', 'card blist', [
          h('div', 'tb', [
            h('div', 'srch', [I('search-16', 'ic'), T('Search budgets', 'ph'), h('span', 'fb', [I('sliders')])]),
            h('span', 'add', [I('plus-white'), T('Add Budget')]),
          ]),
          h('div', 'cards', SPEND.map(card)),
          h('div', 'ft', [h('i', 'dot amber'), T('1 over · 1 pacing to overspend · 2 on track', 'st'), h('span', 'hist', [I('refresh'), T('History')])]),
        ]),
      ]),
      h('div', 'gr', [
        h('div', 'det', [
          h('div', 'hero2', [
            h('div', 'hd', [
              h('div', 'tt', [h('div', 'tl', [T('Dining out', 'a'), T('Monthly', 'tag')]), T('Resets 1 Aug 2026 · 3 categories', 'b')]),
              h('span', 'sp'), h('span', 'btn del', [T('Delete')]), h('span', 'btn', [T('Edit')]),
            ]),
            h('div', 'fig', [h('div', 'val', [T('84.00', 'big'), T('AUD spent of 100.00 this month', 'u')]), h('span', 'sp'), T('Pacing to overspend', 'chip warn')]),
            h('div', 'used', [h('div', 'blk amber', [fill(504, 568), T('84% used', 'nm'), h('div', 'am', [T('16.00', 'n'), T('AUD left', 'u')])]), h('i', 'tick')]),
            h('div', 'pace', [T('Pacing to overspend by 9.00 AUD', 'w'), h('span', 'sp'), T('Today is day 9 of 31 · 22 days remaining', 'd')]),
          ]),
          h('div', 'sec cats', [h('div', 'sh', [T('Categories', 'k'), T('· 3 · share of 84.00 AUD', 'm'), h('span', 'sp'), T('+ Add category', 'lk')]), ...CATS.map(cat)]),
          h('div', 'sec hst', [
            h('div', 'sh', [T('Historical spending', 'k'), T('· last 3 months', 'm')]),
            h('div', 'hr lab', [T('Period', 'p'), T('Budget (AUD)', 'v'), T('Actual (AUD)', 'v'), T('Variance (AUD)', 'v')]),
            ...HIST.map(hist),
          ]),
        ]),
        h('div', 'strip', [h('i', 'dot teal'), T('Summary', 'a'), h('div', 'stt', [T('·', 's'), T('2 of 4', 'n'), T('on track · 1 over · 1 pacing to overspend', 's')]), h('span', 'sp'), h('span', 'btn', [T('Show overview')])]),
      ]),
    ]),
  ]);
}

const BAG = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', '20'); s.setAttribute('height', '20'); s.setAttribute('viewBox', '0 0 24 24');
  s.innerHTML = '<g fill="none" stroke="#1c2024" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M7.6 3.2h8.8c.8 0 1.3.8 1 1.5l-.7 1.8 2.5 8.9c.8 2.9-1.4 5.6-4.4 5.6H9.2c-3 0-5.2-2.7-4.4-5.6l2.5-8.9-.7-1.8c-.3-.7.2-1.5 1-1.5z"/><path d="M7.4 6.6h9.2"/>'
    + '<path d="M14.1 10.3c-.3-.7-1.1-1.2-2.1-1.2-1.2 0-2.1.6-2.1 1.6 0 2.2 4.4 1.1 4.4 3.4 0 1-1 1.7-2.3 1.7-1.1 0-2-.5-2.3-1.3M12 8.2v.9m0 6.6v.9"/></g>'; return s; };
const CHAT = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('width', '20'); s.setAttribute('height', '20'); s.setAttribute('viewBox', '0 0 24 24');
  s.innerHTML = '<g fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-7.5L7 20v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z"/><path d="M8 9.5h8M8 12.5h5"/></g>'; return s; };
function buildGoalsBefore() {
  const UNAV = [
    [['home-off', 'Home'], ['rewards', 'Rewards'], ['accounts', 'Accounts']],
    [['budget-on', 'Budget', 1], ['assets', 'Assets'], ['categories', 'Categories'], ['plugins', 'Plugins']],
    [['settings', 'Settings'], ['help', 'Help & Guide']],
  ];
  const grp = (items) => h('div', 'grp', items.map(([ic, label, on]) => h('div', 'it' + (on ? ' on' : ''), [I(ic), T(label)])));
  const stat = (v, cls, label) => h('div', 'st', [h('div', 'v', [T(v, 'n' + (cls ? ' ' + cls : '')), T('AUD', 'u')]), T(label, 'k')]);
  const item = (name, cyc, cls, v, left) => h('div', 'itm', [
    h('div', 'top', [h('span', 'iw', [BAG()]), T(name, 'nm'), h('span', 'sp'), T(cyc, 'tag ' + cls), h('span', 'am', [T(v, 'n'), T('AUD', 'u')])]),
    h('div', 'bar', [h('i', 'track'), T(left, 'left')]),
  ]);
  return h('div', 'gv desk uat', [
    h('aside', 'us', [I('gv-uat', 'mk', 'logos'), h('nav', 'nav', [grp(UNAV[0]), h('i', 'div'), grp(UNAV[1]), h('i', 'div'), grp(UNAV[2])])]),
    h('div', 'uh', [
      T('Budget · October 2026', 'ttl'),
      h('div', 'stats', [stat('880', '', 'Total'), stat('0', 'amb', 'Spent'), stat('880', 'grn', 'Remaining'), h('div', 'st', [T('17', 'n'), T('Days left', 'k')])]),
      h('span', 'sp'), h('span', 'add', [I('plus-white'), T('Add New')]),
    ]),
    h('div', 'prog', [T('0% Used', 'k'), h('i', 'track'), T('17 days remaining', 'k')]),
    h('div', 'lgd', [h('span', '', [h('i', 'g'), T('Under budget')]), h('span', '', [h('i', 'a'), T('Approaching')]), h('span', '', [h('i', 'r'), T('Over budget')])]),
    h('div', 'panel', [
      h('div', 'tb', [h('span', 'per', [T('Period · All'), h('i', 'chev')]), h('span', 'sr', [T('Search Budget...', 'ph'), I('search')])]),
      item('rent', 'Weekly', 'wk', '800', 'A$800 left'),
      item('water usage', 'Monthly', 'mo', '80', 'A$80 left'),
    ]),
    h('div', 'empty', [h('span', 'iw', [BAG()]), T('Select a budget item', 'a'), h('p', 'b', ['Choose an item from the list to see its breakdown, categories, and spending history.'])]),
    h('span', 'fab', [CHAT()]),
  ]);
}

function buildMob(opt) {
  opt = opt || {};
  const variant = opt.orbs || 'new';
  const tab = (ic, label, on) => h('span', on ? 'on' : '', [ic === 'more' ? DOTS() : I(ic), T(label)]);
  const root = h('div', 'gv mob' + (opt.full ? ' full' : '') + (opt.clay ? ' clay' : ''), [
    I('glow', 'glow'),
    h('div', 'sb', [T('9:41', 'clk'), STATUS()]),
    h('div', 'pg', [
      h('div', 'top', [
        h('div', 'pill seg', [h('span', '', [T('Past')]), h('span', 'on', [h('i', 'dot'), T('Today')]), h('span', '', [T('Future')])]),
        h('span', 'sp'),
        h('span', 'pill ib', [I('ai', 'ai')]), h('span', 'pill ib', [I('search')]),
      ]),
      h('div', 'r2', [
        h('div', 'pill step', [h('span', 'rb', [I('chev-l')]), T('Sun, 1 Jun 2025', 'date'), h('span', 'rb', [I('chev-r')])]),
        h('span', 'pill ib', [I('calendar')]), h('span', 'pill ib', [I('sliders')]),
      ]),
      h('div', 'hero', [
        h('div', 'lr', [h('i', 'dot'), T('Total balance', 'ttl'), h('span', 'ld', [T('· 5 accounts, today', 'meta')]), h('span', 'eye', [I('eye')])]),
        h('div', 'amt ld', [NUM('13,813'), NUM('.31', 'dim'), T('AUD', 'unit')]),
        statsRow(),
      ]),
      balCard('mob', variant),
      acctsCard(true), credCard(), msumCard(),
    ]),
    h('div', 'tab', [tab('home', 'Home', 1), tab('rewards', 'Rewards'), tab('accounts', 'Accounts'), tab('budget', 'Goals'), tab('more', 'More')]),
    h('i', 'hi'),
  ]);
  root.dataset.orbs = variant;
  return root;
}

const FXD = new WeakSet();
const BLUR = [.5, .9, 1.4, 2, 2.8, 3.8, 5, 6.5, 8.5, 11, 14, 18, 23];
function ensureFx(scope) {
  const host = scope && scope.nodeType === 11 ? scope : document.body;
  if (FXD.has(host)) return; FXD.add(host);
  const FX = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  FX.setAttribute('width', '0'); FX.setAttribute('height', '0'); FX.setAttribute('aria-hidden', 'true');
  FX.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  FX.innerHTML = '<defs>' + BLUR.map((s, i) => `<filter id="gvb${i}" x="-10%" y="-30%" width="120%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 ${s}"/></filter>`).join('') + '</defs>';
  host.appendChild(FX);
}
const CV = document.createElement('canvas').getContext('2d');
function buildOdo(span, group) {
  const v = span.dataset.v, fs = parseFloat(getComputedStyle(span).fontSize);
  CV.font = `500 ${fs}px "GV Montserrat"`;
  span.textContent = '';
  const cols = [];
  for (const ch of v) {
    if (!/[0-9]/.test(ch)) { span.append(h('span', 'st', [ch])); continue; }
    const w = CV.measureText(ch).width;
    const col = h('span', 'col', [h('span', 'gh', [ch])]); col.style.width = w + 'px';
    const strip = h('span', 'strip');
    col.append(strip); span.append(col);
    cols.push({ col, strip, d:+ch, fs });
  }
  group.cols.push(...cols);
}
function finishGroup(g) {
  const n = g.cols.length;
  g.cols.forEach((c, i) => {
    const loops = g.loops ? g.loops[i] : (i === 0 ? (n <= 2 ? 1 : 0) : (i >= n - 2 && n >= 4 ? 2 : 1));
    c.target = 10 * loops + c.d; c.i = i;
    for (let k = 0; k <= c.target; k++) c.strip.append(h('i', '', [String(k % 10)]));
  });
}

const clamp = x => Math.max(0, Math.min(1, x));
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x;
    for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
    return Y(clamp(t)); };
}
const moOut = bezier(.23, 1, .32, 1);
const outC = x => 1 - Math.pow(1 - clamp(x), 3);
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const inOutS = x => -(Math.cos(Math.PI * clamp(x)) - 1) / 2;
function spring(t, w, z) { if (t <= 0) return 0; const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)); }

const SIM = { DT:1 / 240, HZ:120, DUR:3.4, BORN:.13, K:[46, 125], Z:.7, KC:1150, CAP:14, GROW_W:14, GROW_Z:.5, FADE:[.32, .16], RISE:.34, INSET:.34, SQ_MAX:.06, SQ_TAU:.07, BLEND:.6 };
function simulateOrbs(list, panelH, gap) {
  const big = list[0];
  const st = list.map(o => {
    let x = o.cx, y = o.cy;
    if (o.rank === 0) y += panelH * SIM.RISE;
    else { x += (big.cx - o.cx) * SIM.INSET; y += (big.cy - o.cy) * SIM.INSET; }
    const K = SIM.K[o.rank === 0 ? 0 : 1];
    return { o, born:SIM.BORN * o.rank, x, y, vx:0, vy:0, m:o.r * o.r, K, C:2 * SIM.Z * Math.sqrt(K), qx:0, qy:0 };
  });
  const out = list.map(() => []);
  const steps = Math.round(SIM.DUR / SIM.DT), every = Math.round(1 / SIM.DT / SIM.HZ), fq = 1 - Math.exp(-SIM.DT / SIM.SQ_TAU);
  for (let n = 0; n <= steps; n++) {
    const t = n * SIM.DT;
    for (const s of st) {
      const u = t - s.born;
      s.on = u >= 0; s.k = s.on ? .2 + .8 * spring(u, SIM.GROW_W, SIM.GROW_Z) : .2; s.r = s.o.r * s.k;
      s.op = smooth(u / SIM.FADE[s.o.rank === 0 ? 0 : 1]);
      s.ax = s.on ? s.K * (s.o.cx - s.x) - s.C * s.vx : 0; s.ay = s.on ? s.K * (s.o.cy - s.y) - s.C * s.vy : 0; s.tx = 0; s.ty = 0;
    }
    for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
      const a = st[i], b = st[j]; if (!a.on || !b.on) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, ov = a.r + b.r + gap * .5 - d;
      if (ov <= 0) continue;
      const nx = dx / d, ny = dy / d, f = SIM.KC * Math.min(ov, SIM.CAP), wa = b.m / (a.m + b.m), wb = a.m / (a.m + b.m);
      a.ax -= nx * f * wa; a.ay -= ny * f * wa; b.ax += nx * f * wb; b.ay += ny * f * wb;
      const c2 = nx * nx - ny * ny, s2 = 2 * nx * ny, pa = Math.min(ov, SIM.CAP) / a.o.r, pb = Math.min(ov, SIM.CAP) / b.o.r;
      a.tx += c2 * pa; a.ty += s2 * pa; b.tx += c2 * pb; b.ty += s2 * pb;
    }
    for (const s of st) {
      if (!s.on) continue;
      s.vx += s.ax * SIM.DT; s.vy += s.ay * SIM.DT; s.x += s.vx * SIM.DT; s.y += s.vy * SIM.DT;
      const sp = Math.hypot(s.vx, s.vy), st_ = Math.min(.5, sp / (s.o.r * 30));
      if (sp > 1e-3) { const mx = s.vx / sp, my = s.vy / sp; s.tx -= (mx * mx - my * my) * st_ * .5; s.ty -= 2 * mx * my * st_ * .5; }
      s.qx += (s.tx * .8 - s.qx) * fq; s.qy += (s.ty * .8 - s.qy) * fq;
    }
    if (n % every) continue;
    st.forEach((s, i) => {
      const amp = Math.min(SIM.SQ_MAX, Math.hypot(s.qx, s.qy)), ang = Math.atan2(s.qy, s.qx) / 2;
      out[i].push([s.x - s.o.cx, s.y - s.o.cy, s.k, amp, ang, s.on ? s.op : 0]);
    });
  }
  return out;
}
function sampleOrb(track, u) {
  if (u <= 0) return [0, 0, .2, 0, 0, 0];
  const f = u * SIM.HZ, i = Math.min(track.length - 2, Math.floor(f)), a = track[i], b = track[i + 1], w = Math.min(1, f - i);
  const v = a.map((x, k) => k === 4 ? (Math.abs(b[4] - a[4]) > Math.PI ? b[4] : x + (b[4] - x) * w) : x + (b[k] - x) * w);
  const e = smooth((u - (SIM.DUR - SIM.BLEND)) / SIM.BLEND);
  return [v[0] * (1 - e), v[1] * (1 - e), v[2] + (1 - v[2]) * e, v[3] * (1 - e), v[4], v[5] + (1 - v[5]) * e];
}

const TL = {
  loop: { dur:10, desk:{ U0:1.60, R0:5.60, N0:5.70, L0:6.00, B0:6.00 }, mob:{ U0:1.85, R0:6.05, N0:6.15, L0:6.45, B0:6.45 } },
  once: { dur:6,  desk:{ U0:-9, SH0:0, R0:1.50, N0:1.60, L0:1.90, B0:1.90 }, mob:{ U0:-9, SH0:.2, R0:1.75, N0:1.85, L0:2.15, B0:2.15 } },
};
const CYC = 2.0, GLIDE = 1.4, UD = .35, RD = .5, LIST_D = .30, LIST_GAP = .05, ORB_GAP = .09;
const ROLL = { hero:[1.05, .09, 0], stat:[.8, .07, .15], cred:[.95, .08, .22] };

class Loader {
  constructor(root, mode) {
    this.root = root; this.mode = mode; this.key = root.classList.contains('mob') ? 'mob' : 'desk';
    Object.assign(this, TL[mode][this.key]);
    if (this.SH0 == null) this.SH0 = this.U0 + UD * .5;
    this.W = root.offsetWidth;
    ensureFx(root.getRootNode());
    this.groups = [];
    const mk = (sel, kind) => {
      for (const holder of root.querySelectorAll(sel)) {
        const g = { kind, cols:[], N:0 };
        for (const s of holder.querySelectorAll('.num[data-v]')) buildOdo(s, g);
        finishGroup(g);
        const [D, S, delay] = ROLL[kind]; g.D = D; g.S = S; g.delay = delay;
        this.groups.push(g);
      }
    };
    mk('.hero .amt', 'hero'); mk('.stat .v', 'stat'); mk('.cred .amt', 'cred');
    const hg = this.groups.find(g => g.kind === 'hero');
    if (hg && hg.cols.length === 7) { [0, 1, 1, 1, 1, 2, 2].forEach((l, i) => { const c = hg.cols[i]; c.target = 10 * l + c.d; c.strip.textContent = ''; for (let k = 0; k <= c.target; k++) c.strip.append(h('i', '', [String(k % 10)])); }); }
    this.rows = [...root.querySelectorAll('.row')];
    this.orbs = [...root.querySelectorAll('.orb')].sort((a, b) => b.dataset.d - a.dataset.d).map((el, rank) => {
      const r = +el.dataset.d / 2;
      el.style.zIndex = 10 - rank;
      return { el, rank, r, cx:parseFloat(el.style.left) + r, cy:parseFloat(el.style.top) + r, ph:rank * 1.37, amp:this.key === 'desk' ? 1.6 : 1.1 };
    });
    if (this.orbs.length) {
      const panel = this.orbs[0].el.parentElement;
      const tracks = simulateOrbs(this.orbs, panel.offsetHeight, this.key === 'desk' ? 14 : 9);
      this.orbs.forEach((o, i) => { o.track = tracks[i]; });
    }
    const sk = root.cloneNode(true);
    sk.classList.add('sk'); sk.classList.remove('live'); sk.setAttribute('aria-hidden', 'true');
    sk.style.zIndex = 4; sk.style.transform = 'none';
    root.appendChild(sk);
    this.sk = sk;
    sk.style.setProperty('--bw', Math.round(this.W * .55) + 'px');
    const rr = sk.getBoundingClientRect(), sc = rr.width / sk.offsetWidth || 1;
    for (const b of sk.querySelectorAll('.ld .t, .ld.t, .ld .bone, .ld.bone')) {
      b.style.setProperty('--bx', ((b.getBoundingClientRect().left - rr.left) / sc).toFixed(1) + 'px');
    }
  }
  setT(t) {
    const S = this;
    if (S.mode === 'loop') t = ((t % TL.loop.dur) + TL.loop.dur) % TL.loop.dur;
    const unload = inOutS((t - S.U0) / UD);
    const pg = t < S.R0 ? 1 - unload : outC((t - S.R0) / RD);
    S.root.style.setProperty('--pg', pg.toFixed(4));
    S.sk.style.opacity = (1 - pg).toFixed(4);
    let sx = -1e5;
    const ts = t - S.SH0;
    if (ts >= 0 && t < S.R0 + RD) { const ph = (ts % CYC) / GLIDE; if (ph <= 1) sx = -S.W * .55 + S.W * 1.6 * inOutS(ph); }
    S.sk.style.setProperty('--sx', sx.toFixed(1) + 'px');
    S.rows.forEach((d, i) => {
      if (t < S.R0) { d.style.opacity = pg; d.style.transform = ''; return; }
      const e = moOut((t - (S.L0 + LIST_GAP * i)) / LIST_D);
      d.style.opacity = e.toFixed(4); d.style.transform = e >= 1 ? '' : `translateY(${((1 - e) * 8).toFixed(2)}px)`;
    });
    for (const o of S.orbs) {
      let x = 0, y = 0, k = 1, sq = 0, ang = 0, op = pg, drift = 1;
      if (t >= S.R0) {
        const u = t - S.B0;
        [x, y, k, sq, ang, op] = sampleOrb(o.track, u);
        drift = smooth((u - 1.6) / 1.0);
      }
      const P = [5, 10 / 3, 2.5, 5, 10 / 3][o.rank];
      y += drift * o.amp * Math.sin(2 * Math.PI * t / P + o.ph);
      o.el.style.opacity = op.toFixed(4);
      const sx = k * (1 + sq * .6), sy = k * (1 - sq), a = (ang * 180 / Math.PI).toFixed(1);
      o.el.style.transform = Math.abs(sq) < .002
        ? `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${k.toFixed(4)})`
        : `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${a}deg) scale(${sy.toFixed(4)}, ${sx.toFixed(4)}) rotate(${-a}deg)`;
    }
    for (const g of S.groups) {
      const N = S.N0 + g.delay;
      for (const c of g.cols) {
        const pos = tt => (tt < S.U0 + UD && S.U0 >= 0 ? c.target : c.target * moOut((tt - N) / (g.D + g.S * c.i)));
        const p = t < S.R0 && S.U0 >= 0 && t < S.U0 + UD ? c.target : pos(t);
        const v = Math.abs(p - pos(t - 1 / 60));
        c.strip.style.transform = `translateY(${(-p).toFixed(4)}em)`;
        const b = Math.min(c.fs * .28, v * c.fs * .35);
        let lv = -1; for (let k = 0; k < BLUR.length; k++) if (BLUR[k] <= b) lv = k;
        const f = lv >= 0 ? `url(#gvb${lv})` : '';
        if (c.f !== f) { c.strip.style.filter = f; c.f = f; }
        const rolling = v > .002 || (p > 0 && p < c.target - .001);
        if (c.r !== rolling) { c.col.classList.toggle('roll', rolling); c.r = rolling; }
      }
    }
  }
}

function wireHover(root) {
  root.classList.add('live');
  const set = (k, on) => root.querySelectorAll(`.orb[data-k="${k}"], .row[data-k="${k}"]`).forEach(e => { if (!e.closest('.sk')) e.classList.toggle('hl', on); });
  root.addEventListener('pointerover', e => { const el = e.target.closest('.orb[data-k], .row[data-k]'); if (el && !el.closest('.sk')) set(el.dataset.k, true); });
  root.addEventListener('pointerout', e => { const el = e.target.closest('.orb[data-k], .row[data-k]'); if (el && !el.closest('.sk')) set(el.dataset.k, false); });
}

const PLAYERS = new Set();
const RM = matchMedia('(prefers-reduced-motion: reduce)');
class Player {
  constructor(el, loaders, mode) {
    this.el = el; this.loaders = loaders; this.mode = mode; this.t0 = null; this.vis = false; this.done = false;
    this.end = TL[mode].dur;
    const io = new IntersectionObserver(es => { for (const e of es) { this.vis = e.isIntersecting; if (this.vis && this.t0 == null) this.t0 = performance.now(); } }, { threshold:.25 });
    io.observe(el); this.io = io;
    if (RM.matches) { this.paint(mode === 'loop' ? 0 : this.end); return; }
    this.paint(0);
    PLAYERS.add(this); tick.start();
  }
  paint(t) { for (const L of this.loaders) L.setT(t); }
  replay() { if (RM.matches) return; this.t0 = performance.now(); PLAYERS.add(this); tick.start(); }
  frame(now) {
    if (!this.vis || this.t0 == null) return;
    const t = (now - this.t0) / 1000;
    this.paint(this.mode === 'loop' ? t : t);
  }
  destroy() { this.io.disconnect(); PLAYERS.delete(this); }
}
const tick = {
  on:false,
  start() { if (this.on) return; this.on = true; const f = now => { for (const p of PLAYERS) p.frame(now); if (PLAYERS.size) requestAnimationFrame(f); else this.on = false; }; requestAnimationFrame(f); },
};

function fitInto(box, inner, w, h2, mode) {
  const ro = new ResizeObserver(() => {
    const W = box.clientWidth, H = box.clientHeight;
    const s = mode === 'cover' ? Math.max(W / w, H / h2) : W / w;
    inner.style.transform = `translate(${((W - w * s) / 2).toFixed(2)}px, ${mode === 'cover' ? ((H - h2 * s) / 2).toFixed(2) : 0}px) scale(${s})`;
  });
  ro.observe(box); return ro;
}

window.GV = { simulateOrbs, sampleOrb, SIM, buildDesk, buildMob, buildPanel, buildGoals, buildGoalsBefore, Loader, Player, wireHover, fitInto, SRC, ACC, ORBS };
})();
