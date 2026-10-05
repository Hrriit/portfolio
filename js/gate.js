(() => {
  const figs = [...document.querySelectorAll('.fig.gate[data-gate]')];
  if (!figs.length) return;
  const can = window.isSecureContext && window.crypto && crypto.subtle && typeof HTMLDialogElement !== 'undefined' && 'showModal' in HTMLDialogElement.prototype;
  if (!can) { figs.forEach((f) => f.classList.add('gate-off')); return; }
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const enc = new TextEncoder();
  const norm = (s) => s.normalize('NFKC').trim().toLowerCase();
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const packs = {};
  const load = (fig) => {
    const name = fig.dataset.gate;
    if (!packs[name]) packs[name] = new Promise((res, rej) => {
      if (window.HXGATE && window.HXGATE[name]) return res(window.HXGATE[name]);
      const s = document.createElement('script'); s.src = fig.dataset.gateSrc; s.async = true;
      s.onload = () => (window.HXGATE && window.HXGATE[name]) ? res(window.HXGATE[name]) : rej(new Error('gate: no pack in ' + s.src));
      s.onerror = () => { delete packs[name]; rej(new Error('gate: could not load ' + s.src)); };
      document.head.appendChild(s);
    });
    return packs[name];
  };
  const open = async (pack, pw) => {
    const mat = await crypto.subtle.importKey('raw', enc.encode(norm(pw)), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(pack.salt), iterations: pack.iter, hash: 'SHA-256' }, mat, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(pack.iv) }, key, b64(pack.data));
    return URL.createObjectURL(new Blob([bytes], { type: pack.type }));
  };
  const reveal = (fig, url) => new Promise((res) => {
    if (fig.classList.contains('is-open')) return res();
    const plate = fig.querySelector('.gate-plate'), cap = fig.querySelector('figcaption');
    const img = new Image(); img.alt = fig.dataset.alt || ''; img.decoding = 'async';
    img.onload = () => { fig.classList.add('is-open', 'no-zoom'); plate.replaceWith(img); if (cap && cap.dataset.open) cap.textContent = cap.dataset.open; res(); };
    img.onerror = () => res();
    img.src = url;
  });

  const contact = document.querySelector('a[data-contact]'), mail = contact ? contact.getAttribute('href') : 'mailto:harriet.xu01@gmail.com';
  const dlg = document.createElement('dialog'); dlg.className = 'gate-dlg'; dlg.setAttribute('aria-labelledby', 'gate-h');
  dlg.innerHTML = '<form class="gate-form" novalidate><p class="mono">Private picture</p><h3 id="gate-h">Enter the password</h3>' +
    '<p class="gate-hint">Harriet shares it with the people she is talking to. Don’t have it? <a href="' + mail + '" data-contact>Email her ↗</a></p>' +
    '<div class="gate-field"><label class="sr-only" for="gate-pw">Password</label><input id="gate-pw" type="password" name="pw" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Password" required>' +
    '<button type="button" class="gate-eye" aria-label="Show password" aria-pressed="false" title="Show password">' +
      '<svg class="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>' +
      '<svg class="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.2 4.1M6.3 6.3C3.9 8.2 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.5 0 2.8-.4 4-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>' +
    '</button></div>' +
    '<p class="gate-err" role="alert" hidden>That’s not it. Try again.</p>' +
    '<div class="gate-actions"><button type="button" class="gate-cancel">Cancel</button><button type="submit" class="gate-go">Unlock</button></div></form>';
  document.body.appendChild(dlg);
  const form = dlg.querySelector('form'), input = dlg.querySelector('input'), err = dlg.querySelector('.gate-err'), go = dlg.querySelector('.gate-go');
  let current = null, busy = false;
  const ask = (fig) => {
    current = fig; load(fig).catch(() => {});
    input.value = ''; err.hidden = true; dlg.classList.remove('is-wrong'); go.disabled = false; go.textContent = 'Unlock';
    dlg.showModal(); input.focus();
  };
  const close = () => { if (dlg.open) dlg.close(); if (current) { const b = current.querySelector('.gate-btn'); if (b) b.focus({ preventScroll: true }); } };
  const wrong = () => {
    err.hidden = false; dlg.classList.remove('is-wrong'); void input.offsetWidth; if (!calm.matches) dlg.classList.add('is-wrong');
    input.select(); input.focus();
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); if (busy || !current) return;
    const pw = input.value; if (!norm(pw)) { input.focus(); return; }
    busy = true; go.disabled = true; go.textContent = 'Checking…'; err.hidden = true;
    try {
      const pack = await load(current);
      const url = await open(pack, pw);
      store.set('gate:' + current.dataset.gate, norm(pw));
      await reveal(current, url);
      dlg.close(); const img = current.querySelector('img'); if (img) img.scrollIntoView({ block: 'nearest', behavior: calm.matches ? 'instant' : 'smooth' });
    } catch (x) {
      if (/gate:/.test(String(x && x.message))) { err.textContent = 'The picture could not be loaded. Try again in a moment.'; err.hidden = false; }
      else { err.textContent = 'That’s not it. Try again.'; wrong(); }
    } finally { busy = false; go.disabled = false; go.textContent = 'Unlock'; }
  });
  dlg.querySelector('.gate-cancel').addEventListener('click', close);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); if (!busy) close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg && !busy) close(); });
  input.addEventListener('input', () => { err.hidden = true; dlg.classList.remove('is-wrong'); });
  const eye = dlg.querySelector('.gate-eye');
  const setEye = (show) => { input.type = show ? 'text' : 'password'; eye.setAttribute('aria-pressed', String(show)); eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); eye.title = eye.getAttribute('aria-label'); dlg.classList.toggle('is-shown', show); };
  eye.addEventListener('click', () => { const n = input.value.length; setEye(input.type === 'password'); input.focus(); try { input.setSelectionRange(n, n); } catch (e) {} });
  dlg.addEventListener('close', () => setEye(false));

  figs.forEach((fig) => {
    const btn = fig.querySelector('.gate-btn'); if (btn) btn.addEventListener('click', () => ask(fig));
    const kept = store.get('gate:' + fig.dataset.gate);
    if (kept) load(fig).then((pack) => open(pack, kept)).then((url) => reveal(fig, url)).catch(() => {});
  });
})();
