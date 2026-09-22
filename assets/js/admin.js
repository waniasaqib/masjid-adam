/* Admin studio: password-locked editor that publishes to GitHub Pages. */
(async function () {
  'use strict';
  const M = window.MASJID;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = M.escape;
  const MARK = '<svg viewBox="0 0 100 120" fill="none" aria-hidden="true"><path d="M12 114V58C12 32 30 16 50 8C70 16 88 32 88 58V114" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M24 114V60C24 42 36 30 50 24C64 30 76 42 76 60V114" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 114H96" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M50 8V2" stroke="#C9A96A" stroke-width="2.2" stroke-linecap="round"/><path d="M56 46A18 18 0 1 0 56 82A14 14 0 1 1 56 46Z" fill="#C9A96A"/><path d="M62 58l1.9 4 4.3.5-3.2 3 .9 4.3-3.9-2.2-3.9 2.2.9-4.3-3.2-3 4.3-.5z" fill="currentColor"/></svg>';
  const IC = {
    up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    del: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
  };
  $('#lockMark').innerHTML = MARK; $('#sideMark').innerHTML = MARK;

  /* ================= Auth (WebCrypto) ================= */
  const AUTH_KEY = 'masjidAdam.auth.v1', SESSION_KEY = 'masjidAdam.session.v1';
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function deriveKey(password, salt) {
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }
  async function encryptObj(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function decryptObj(key, rec) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(rec.iv) }, key, unb64(rec.ct));
    return JSON.parse(dec.decode(pt));
  }
  let authKey = null, secrets = { token: '' };
  const authRecord = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) { return null; } };
  async function saveSecrets() {
    const rec = authRecord();
    const salt = rec ? unb64(rec.salt) : crypto.getRandomValues(new Uint8Array(16));
    const e = await encryptObj(authKey, secrets);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ v: 1, salt: b64(salt), iv: e.iv, ct: e.ct }));
  }
  async function setPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    authKey = await deriveKey(password, salt);
    const e = await encryptObj(authKey, secrets);
    localStorage.setItem(AUTH_KEY, JSON.stringify({ v: 1, salt: b64(salt), iv: e.iv, ct: e.ct }));
    await rememberSession();
  }
  async function rememberSession() {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(await crypto.subtle.exportKey('jwk', authKey))); } catch (e) { /* ignore */ }
  }
  async function tryLogin(password) {
    const rec = authRecord();
    if (!rec) return false;
    try {
      const key = await deriveKey(password, unb64(rec.salt));
      secrets = await decryptObj(key, rec);
      authKey = key;
      await rememberSession();
      return true;
    } catch (e) { return false; }
  }
  async function resumeSession() {
    const rec = authRecord();
    const jwk = sessionStorage.getItem(SESSION_KEY);
    if (!rec || !jwk) return false;
    try {
      authKey = await crypto.subtle.importKey('jwk', JSON.parse(jwk), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
      secrets = await decryptObj(authKey, rec);
      return true;
    } catch (e) { return false; }
  }

  function lockScreen() {
    const rec = authRecord();
    const body = $('#lockBody');
    if (!rec) {
      body.innerHTML = '<form id="setupForm"><p class="hint">This is the first time the admin has been opened in this browser. Choose a password to protect it here — remember it, there is no reset by email.</p>' +
        '<label class="field"><span>Admin password</span><input type="password" id="pw1" autocomplete="new-password" required minlength="6"></label>' +
        '<p class="err" id="err"></p><button class="btn btn-navy" type="submit">Set up admin</button>' +
        '<p class="hint">You will add the GitHub connection (needed to publish) in Settings.</p></form>';
      $('#setupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const a = $('#pw1').value;
        if (a.length < 6) return ($('#err').textContent = 'Use at least 6 characters.');
        await setPassword(a);
        unlock();
      });
    } else {
      body.innerHTML = '<form id="loginForm"><label class="field"><span>Password</span><input type="password" id="pw" autocomplete="current-password" required autofocus></label>' +
        '<p class="err" id="err"></p><button class="btn btn-navy" type="submit">Unlock</button></form>' +
        '<p class="alt"><a href="#" id="resetDevice">Forgot the password? Reset this device</a></p>';
      $('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = e.target.querySelector('button'); b.disabled = true; b.textContent = 'Checking…';
        if (await tryLogin($('#pw').value)) unlock();
        else { $('#err').textContent = 'Wrong password.'; b.disabled = false; b.textContent = 'Unlock'; }
      });
      $('#resetDevice').addEventListener('click', (e) => {
        e.preventDefault();
        confirmBox('Reset this device?', 'This removes the saved password and GitHub token from this browser only. Your published website is not affected; drafts stay. You can set a new password right after.', 'Reset', () => { localStorage.removeItem(AUTH_KEY); sessionStorage.removeItem(SESSION_KEY); lockScreen(); });
      });
      setTimeout(() => $('#pw').focus(), 50);
    }
  }
  function lock() { sessionStorage.removeItem(SESSION_KEY); authKey = null; secrets = { token: '' }; $('#app').hidden = true; $('#lock').hidden = false; lockScreen(); }

  /* ================= Data ================= */
  let published = null, draft = null, previewTimer, saveTimer;
  async function fetchPublished() {
    try { const r = await fetch(M.BASE + 'data/site.json', { cache: 'no-store' }); if (r.ok) return M.normalize(await r.json()); } catch (e) { /* ignore */ }
    return M.normalize(null);
  }
  const isDirty = () => JSON.stringify(draft) !== JSON.stringify(published);
  function setStatus(text, cls, short) { const s = $('#status'); s.className = 'status ' + (cls || ''); s.querySelector('span').textContent = text; s.querySelector('small').textContent = short || text; }
  function refreshStatus() {
    if (isDirty()) setStatus('Unpublished changes — saved as a draft in this browser', 'dirty', 'Draft saved');
    else setStatus('Everything is published', '', 'Published');
    $('#discardBtn').disabled = !isDirty();
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(M.KEYS.draft, JSON.stringify(draft)); } catch (e) { toast('Could not save the draft — an image may be too large'); }
      refreshStatus();
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => { const f = $('#previewFrame'); if (f) f.contentWindow.location.reload(); }, 1200);
    }, 250);
  }

  /* ================= Helpers ================= */
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const set = (obj, path, v) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((o, k) => (o[k] == null ? (o[k] = {}) : o[k]), obj)[last] = v; };
  let toastTimer;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); }
  function modal(html) { $('#modalCard').innerHTML = html; $('#modal').hidden = false; }
  function closeModal() { $('#modal').hidden = true; }
  function confirmBox(title, text, yes, cb) {
    modal('<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div class="btn-row"><button class="btn btn-outline btn-sm" id="mNo" type="button">Cancel</button><button class="btn btn-outline btn-sm btn-danger" id="mYes" type="button">' + esc(yes) + '</button></div>');
    $('#mNo').onclick = closeModal; $('#mYes').onclick = () => { closeModal(); cb(); };
  }
  $('#modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  function field(label, path, opts) {
    const o = opts || {};
    const v = get(draft, path);
    const cls = (o.arabic ? ' arabic' : '');
    let input;
    if (o.type === 'textarea') input = '<textarea data-bind="' + path + '" class="' + cls + (o.tall ? ' tall' : '') + '" placeholder="' + esc(o.placeholder || '') + '">' + esc(v) + '</textarea>';
    else if (o.type === 'select') input = '<select data-bind="' + path + '">' + o.options.map(([val, l]) => '<option value="' + esc(val) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>';
    else if (o.type === 'checkbox') return '<label class="check"><input type="checkbox" data-bind="' + path + '" data-type="bool"' + (v ? ' checked' : '') + '> ' + esc(label) + '</label>';
    else input = '<input type="' + (o.type || 'text') + '" data-bind="' + path + '"' + (o.type === 'number' ? ' data-type="number" step="' + (o.step || 'any') + '"' : '') + ' class="' + cls + '" value="' + esc(v) + '" placeholder="' + esc(o.placeholder || '') + '">';
    return '<label class="field' + (o.wide ? ' wide' : '') + '"><span>' + esc(label) + '</span>' + input + (o.help ? '<small>' + o.help + '</small>' : '') + '</label>';
  }
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.bind) return;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.type === 'number') v = el.value === '' ? 0 : +el.value;
    set(draft, el.dataset.bind, v);
    save();
    if (el.dataset.bind.startsWith('prayer.')) renderTodayCheck();
  });

  /* Generic list editor. spec: { path, fields:[{k,label,type,arabic,wide,options}], title:(item)=>string, blank:()=>item, addLabel } */
  function listEditor(container, spec) {
    const arr = get(draft, spec.path);
    function render() {
      container.innerHTML = '<div class="list">' + arr.map((item, i) => {
        const draftPath = spec.path + '.' + i;
        return '<div class="item" data-i="' + i + '"><div class="item-head"><b>' + esc(spec.title(item, i) || 'Untitled') + '</b><div class="item-tools">' +
          '<button type="button" data-act="up" title="Move up"' + (i === 0 ? ' disabled' : '') + '>' + IC.up + '</button><button type="button" data-act="down" title="Move down"' + (i === arr.length - 1 ? ' disabled' : '') + '>' + IC.down + '</button><button type="button" class="del" data-act="del" title="Delete">' + IC.del + '</button></div></div>' +
          '<div class="fields' + (spec.cols === 3 ? ' three' : '') + '">' + spec.fields.map((f) => f.type === 'image' ? imageField(f.label, draftPath + '.' + f.k) : field(f.label, draftPath + '.' + f.k, f)).join('') + '</div></div>';
      }).join('') + '</div><button type="button" class="add-btn" data-act="add">+ ' + esc(spec.addLabel || 'Add') + '</button>';
    }
    container.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'add') { arr.push(spec.blank()); save(); render(); container.querySelector('.item:last-child input, .item:last-child textarea')?.focus(); return; }
      const item = b.closest('.item'); if (!item) return;
      const i = +item.dataset.i;
      if (act === 'del') { confirmBox('Delete this item?', '“' + (spec.title(arr[i], i) || 'Untitled') + '” will be removed.', 'Delete', () => { arr.splice(i, 1); save(); render(); }); return; }
      if (act === 'up' && i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; save(); render(); }
      if (act === 'down' && i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; save(); render(); }
    });
    container.addEventListener('input', (e) => {
      const item = e.target.closest('.item');
      if (item && spec.title) { const i = +item.dataset.i; item.querySelector('.item-head b').textContent = spec.title(arr[i], i) || 'Untitled'; }
    });
    render();
  }

  /* Image field: uploads are resized in the browser and kept as data URLs until published. */
  function imageField(label, path) {
    const v = get(draft, path) || '';
    const src = v ? (v.startsWith('data:') ? v : M.BASE + v) : '';
    return '<div class="field wide"><span>' + esc(label) + '</span><div class="thumb-field">' + (src ? '<img src="' + esc(src) + '" alt="">' : '<div class="ph">No image</div>') +
      '<div><input type="file" accept="image/*" data-image="' + path + '" hidden><button type="button" class="btn btn-outline btn-sm" data-pick="' + path + '">Choose image…</button> ' + (v ? '<button type="button" class="ghost-btn danger" data-clear="' + path + '">Remove</button>' : '') + '<br><small>JPG or PNG. Resized automatically to keep the site fast.</small></div></div></div>';
  }
  document.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { pick.parentElement.querySelector('input[type=file]').click(); return; }
    const clear = e.target.closest('[data-clear]');
    if (clear) { set(draft, clear.dataset.clear, ''); save(); rerenderView(); }
  });
  document.addEventListener('change', async (e) => {
    const inp = e.target;
    if (!inp.dataset || !inp.dataset.image || !inp.files[0]) return;
    try {
      const url = await resizeImage(inp.files[0], 1400, 0.84);
      set(draft, inp.dataset.image, url); save(); rerenderView(); toast('Image added — it uploads when you publish');
    } catch (err) { toast('Could not read that image'); }
  });
  function resizeImage(file, max, q) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /* ================= Views ================= */
  let currentView = 'dashboard';
  const views = {};
  function showView(name) {
    currentView = name;
    $$('#sideNav button').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
    $$('.view').forEach((v) => v.classList.toggle('on', v.dataset.view === name));
    $('.side').classList.remove('open');
    location.hash = name;
    if (!$('.view[data-view="' + name + '"]').dataset.rendered) rerenderView();
  }
  function rerenderView() {
    const el = $('.view[data-view="' + currentView + '"]');
    el.innerHTML = ''; views[currentView](el); el.dataset.rendered = '1';
  }
  $('#sideNav').addEventListener('click', (e) => { const b = e.target.closest('button[data-view]'); if (b) showView(b.dataset.view); });
  $('#sideToggle').addEventListener('click', () => $('.side').classList.toggle('open'));
  $('#lockBtn').addEventListener('click', lock);

  const head = (h1, p) => '<div class="view-head"><h1>' + h1 + '</h1><p>' + p + '</p></div>';
  const card = (h2, sub, body) => '<div class="acard">' + (h2 ? '<h2>' + h2 + '</h2>' : '') + (sub ? '<p class="sub">' + sub + '</p>' : '') + body + '</div>';

  views.dashboard = function (el) {
    const n = M.nowIn(draft.prayer.timezone);
    const rules = draft.prayer.iqamahRules.slice().sort((a, b) => (a.from < b.from ? -1 : 1));
    const lastRule = rules[rules.length - 1];
    const stale = lastRule && daysBetween(lastRule.from, M.ymd(n.y, n.m, n.d)) > 21;
    el.innerHTML = head('Dashboard', 'Welcome back. Changes save as a draft in this browser; press <b>Publish</b> to put them on the live website.') +
      '<div class="dash"><div class="stat' + (stale ? ' warn' : '') + '"><b>' + (lastRule ? niceDate(lastRule.from) : '—') + '</b><span>Latest iqamah rule' + (stale ? ' — over 3 weeks old, time to update?' : '') + '</span></div>' +
      '<div class="stat"><b>' + draft.announcements.length + '</b><span>announcements</span></div>' +
      '<div class="stat' + (secrets.token ? '' : ' warn') + '"><b>' + (secrets.token ? 'Connected' : 'Not connected') + '</b><span>GitHub publishing' + (secrets.token ? '' : ' — set up in Settings') + '</span></div></div>' +
      card('Today’s times as visitors see them', 'Compare these with your printed timetable. Adjust in Prayer times if needed.', '<div id="todayCheck"></div>') +
      card('Quick actions', '', '<div class="quick"><button type="button" data-go="prayer">Update iqamah times<small>Add a new rule for the coming weeks</small></button><button type="button" data-go="news">Post an announcement<small>Classes, events, Ramadan, Eid</small></button><button type="button" data-go="settings">Connect GitHub<small>Needed once, to publish</small></button></div>') +
      card('Live preview of your draft', 'Updates a moment after you stop typing.', '<div class="preview-wrap"><iframe id="previewFrame" src="../?preview=1" title="Preview"></iframe></div>');
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => showView(b.dataset.go)));
    renderTodayCheck();
    scalePreview();
  };
  function scalePreview() { const f = $('#previewFrame'); if (!f) return; const w = f.parentElement.clientWidth; f.style.transform = 'scale(' + (w / 1280) + ')'; f.parentElement.style.aspectRatio = '16 / 10'; }
  addEventListener('resize', scalePreview);
  function renderTodayCheck() {
    const box = $('#todayCheck'); if (!box) return;
    try {
      const n = M.nowIn(draft.prayer.timezone); const t = M.dayTimes(draft.prayer, n.y, n.m, n.d);
      box.innerHTML = '<div class="today-check">' + M.PRAYERS.map((k) => '<div><small>' + M.NAMES[k] + '</small><b>' + M.fmt(t.adhan[k], { noSuffix: true }) + '</b>' + (k !== 'sunrise' ? '<em>' + (t.iqamah[k] ? M.fmt(t.iqamah[k].mins, { noSuffix: true }) : '—') + ' iqamah</em>' : '<em>shurooq</em>') + '</div>').join('') + '</div>';
    } catch (e) { box.innerHTML = '<p class="sub">Check the location settings — the times could not be calculated.</p>'; }
  }
  function daysBetween(a, b) { const A = M.parseYmd(a), Bd = M.parseYmd(b); return Math.round((Date.UTC(Bd.y, Bd.m - 1, Bd.d) - Date.UTC(A.y, A.m - 1, A.d)) / 864e5); }
  function niceDate(s) { const d = M.parseYmd(s); return d.y ? M.MONTHS[d.m - 1].slice(0, 3) + ' ' + d.d + ', ' + d.y : s; }

  /* ----- Prayer times ----- */
  const PK = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  function show12(v) {
    if (!v) return '';
    if (String(v).trim().startsWith('+')) return String(v).trim();
    return M.time24to12(v);
  }
  // Accepts "6:15", "6:15 pm", "18:15" or "+5"; returns "HH:MM" (24h) or "+N", or null if invalid.
  function parseIq(raw, key) {
    let s = String(raw || '').trim().toLowerCase();
    if (!s) return '';
    if (/^\+\s*\d{1,3}$/.test(s)) return '+' + s.replace(/[^\d]/g, '');
    const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/);
    if (!m) return null;
    let h = +m[1]; const mm = +(m[2] || 0);
    if (h > 23 || mm > 59) return null;
    const ap = m[3];
    if (ap) { if (ap[0] === 'p' && h < 12) h += 12; if (ap[0] === 'a' && h === 12) h = 0; }
    else if (h <= 12) { if (key === 'fajr') { if (h === 12) h = 0; } else if (h < 12 && !(key === 'dhuhr' && h === 12)) h += 12; }
    return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  }
  views.prayer = function (el) {
    const p = draft.prayer;
    const methods = Object.entries(window.PrayerCalc.METHODS).map(([k, v]) => [k, v.name]);
    el.innerHTML = head('Prayer times', 'Adhan times are calculated automatically every day. You only maintain the <b>iqamah (jama‘ah) schedule</b> — usually one new row every week or two.') +
      card('Iqamah schedule', 'Each row applies from its date until the next row. Type times like <b>6:15</b>, <b>2:00 pm</b> or <b>+5</b> (minutes after the adhan, rounded for you).',
        '<div class="table-scroll"><table class="iq-table"><thead><tr><th>From date</th>' + PK.map((k) => '<th>' + M.NAMES[k] + '</th>').join('') + '<th></th></tr></thead><tbody id="iqBody"></tbody></table></div>' +
        '<div class="btn-row"><button type="button" class="btn btn-outline btn-sm" id="iqAdd">+ Add a row</button><button type="button" class="btn btn-outline btn-sm" id="iqCopy">Copy last row to next week</button><button type="button" class="btn btn-outline btn-sm" id="iqPaste">Paste from a timetable…</button><button type="button" class="ghost-btn danger" id="iqPrune">Remove rows older than 60 days</button></div>') +
      card('Today’s result', 'What the website shows right now with these settings.', '<div id="todayCheck"></div>') +
      card('Jumu‘ah and notes', '', '<div id="jumuahList"></div><div style="height:14px"></div><div id="notesList"></div>') +
      card('Monthly timetable image (optional)', 'If you also design a printed timetable, upload it here and it is shown under the table on the Prayer Times page.', '<div class="fields">' + imageField('Timetable image', 'prayer.timetableImage') + field('Caption', 'prayer.timetableCaption', { wide: true, placeholder: 'e.g. September 2026 timetable' }) + '</div>') +
      card('Calculation settings', 'These rarely change. The defaults match the masjid’s existing timetable.', '<div class="fields three">' +
        field('Method', 'prayer.method', { type: 'select', options: methods }) + field('Asr calculation', 'prayer.asr', { type: 'select', options: [['Hanafi', 'Hanafi (later Asr)'], ['Standard', 'Standard (Shafi‘i, Maliki, Hanbali)']] }) + field('Time zone', 'prayer.timezone', { placeholder: 'America/Toronto' }) +
        field('Latitude', 'prayer.lat', { type: 'number', step: '0.0001' }) + field('Longitude', 'prayer.lng', { type: 'number', step: '0.0001' }) + field('Hijri date adjustment (days)', 'prayer.hijriAdjust', { type: 'number', step: '1', help: 'Use +1 or −1 if the moon sighting differs from the calculated calendar.' }) +
        '</div><h2 style="margin-top:18px;font-size:1.05rem">Fine-tune (minutes)</h2><p class="sub">Small offsets so the calculated times match the timetable your community is used to.</p><div class="fields three">' +
        M.PRAYERS.map((k) => field(M.NAMES[k], 'prayer.adjust.' + k, { type: 'number', step: '1' })).join('') + '</div>');

    const body = $('#iqBody');
    function renderRules() {
      p.iqamahRules.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
      const n = M.nowIn(p.timezone); const todayYmd = M.ymd(n.y, n.m, n.d);
      let currentIdx = -1; p.iqamahRules.forEach((r, i) => { if (r.from <= todayYmd) currentIdx = i; });
      body.innerHTML = p.iqamahRules.map((r, i) => '<tr data-i="' + i + '"' + (i === currentIdx ? ' class="current"' : '') + '><td class="date"><input type="date" data-rule="from" value="' + esc(r.from) + '"></td>' +
        PK.map((k) => '<td><input type="text" data-rule="' + k + '" value="' + esc(show12(r[k])) + '" placeholder="—"></td>').join('') +
        '<td><button type="button" class="ghost-btn danger" data-rule-del>Remove</button></td></tr>').join('') || '<tr><td colspan="7" style="color:var(--muted);padding:14px">No rows yet — add one.</td></tr>';
      renderTodayCheck();
    }
    body.addEventListener('change', (e) => {
      const inp = e.target; const tr = inp.closest('tr'); if (!tr || !inp.dataset.rule) return;
      const r = p.iqamahRules[+tr.dataset.i]; const k = inp.dataset.rule;
      if (k === 'from') { r.from = inp.value; save(); renderRules(); return; }
      const v = parseIq(inp.value, k);
      if (v === null) { inp.classList.add('bad'); return; }
      inp.classList.remove('bad'); r[k] = v; inp.value = show12(v); save(); renderTodayCheck();
    });
    body.addEventListener('click', (e) => { const b = e.target.closest('[data-rule-del]'); if (!b) return; const i = +b.closest('tr').dataset.i; p.iqamahRules.splice(i, 1); save(); renderRules(); });
    function lastRule() { return p.iqamahRules.length ? p.iqamahRules[p.iqamahRules.length - 1] : null; }
    $('#iqAdd').addEventListener('click', () => { const l = lastRule(); const n = M.nowIn(p.timezone); p.iqamahRules.push(Object.assign({ from: M.ymd(n.y, n.m, n.d), fajr: '', dhuhr: '', asr: '', maghrib: '+5', isha: '' }, l ? { fajr: l.fajr, dhuhr: l.dhuhr, asr: l.asr, maghrib: l.maghrib, isha: l.isha } : {}, { from: M.ymd(n.y, n.m, n.d) })); save(); renderRules(); });
    $('#iqCopy').addEventListener('click', () => { const l = lastRule(); if (!l) return toast('Add a row first'); const d = M.parseYmd(l.from); const t = new Date(Date.UTC(d.y, d.m - 1, d.d) + 7 * 864e5); p.iqamahRules.push(Object.assign({}, l, { from: M.ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()) })); save(); renderRules(); });
    $('#iqPrune').addEventListener('click', () => { const n = M.nowIn(p.timezone); const cutoff = M.ymd(n.y, n.m, n.d); const keep = p.iqamahRules.filter((r) => daysBetween(r.from, cutoff) <= 60); let cur = null; p.iqamahRules.forEach((r) => { if (r.from <= cutoff) cur = r; }); if (cur && !keep.includes(cur)) keep.unshift(cur); p.iqamahRules = keep; save(); renderRules(); toast('Old rows removed'); });
    $('#iqPaste').addEventListener('click', () => {
      modal('<h2>Paste from a timetable</h2><p>One row per line: <code>date, fajr, dhuhr, asr, maghrib, isha</code>. Dates like 2026-10-01 or Oct 1 2026. Times like 6:15, 2:00 pm or +5.</p><textarea id="pasteBox" class="tall" placeholder="2026-10-02, 6:30, 1:30, 5:15, +5, 8:30&#10;2026-10-09, 6:45, 1:30, 5:00, +5, 8:15"></textarea><div class="btn-row"><button class="btn btn-outline btn-sm" id="mNo" type="button">Cancel</button><button class="btn btn-green btn-sm" id="mYes" type="button">Add rows</button></div>');
      $('#mNo').onclick = closeModal;
      $('#mYes').onclick = () => {
        const lines = $('#pasteBox').value.split('\n').map((l) => l.trim()).filter(Boolean);
        let added = 0;
        lines.forEach((line) => {
          const parts = line.split(/[,\t;]+/).map((s) => s.trim());
          if (parts.length < 6) return;
          const d = new Date(parts[0]); if (isNaN(d)) return;
          const from = M.ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
          const rule = { from };
          PK.forEach((k, i) => { const v = parseIq(parts[i + 1], k); if (v !== null) rule[k] = v; });
          const existing = p.iqamahRules.find((r) => r.from === from);
          if (existing) Object.assign(existing, rule); else p.iqamahRules.push(rule);
          added++;
        });
        closeModal(); save(); renderRules(); toast(added + ' row' + (added === 1 ? '' : 's') + ' added');
      };
    });
    renderRules();
    listEditor($('#jumuahList'), { path: 'prayer.jumuah', fields: [{ k: 'label', label: 'Label' }, { k: 'time', label: 'Time', type: 'time' }], title: (j) => j.label + ' · ' + M.time24to12(j.time), blank: () => ({ label: 'Jumu’ah', time: '13:30' }), addLabel: 'Add a Jumu‘ah time' });
    const nl = $('#notesList');
    function renderNotes() {
      nl.innerHTML = '<span class="field"><span>Notes shown under the timetable</span></span><div class="list">' + p.notes.map((t, i) => '<div class="item" style="padding:8px 10px;display:flex;gap:8px;align-items:center"><input type="text" data-note="' + i + '" value="' + esc(t) + '"><button type="button" class="ghost-btn danger" data-note-del="' + i + '">Remove</button></div>').join('') + '</div><button type="button" class="add-btn" id="noteAdd">+ Add a note</button>';
    }
    nl.addEventListener('input', (e) => { if (e.target.dataset.note != null) { p.notes[+e.target.dataset.note] = e.target.value; save(); } });
    nl.addEventListener('click', (e) => {
      if (e.target.id === 'noteAdd') { p.notes.push(''); save(); renderNotes(); nl.querySelector('.item:last-child input').focus(); return; }
      const d = e.target.closest('[data-note-del]'); if (d) { p.notes.splice(+d.dataset.noteDel, 1); save(); renderNotes(); }
    });
    renderNotes();
    renderTodayCheck();
  };

  /* ----- Announcements ----- */
  views.news = function (el) {
    el.innerHTML = head('Announcements', 'Pinned announcements stay at the top. The first paragraph is used as the summary on the home page. <b>**bold**</b>, lists (- item) and blank lines for paragraphs are supported.') + '<div id="newsList"></div>';
    listEditor($('#newsList'), { path: 'announcements', fields: [
      { k: 'title', label: 'Title', wide: true }, { k: 'date', label: 'Date', type: 'date' }, { k: 'pinned', label: 'Pin to the top', type: 'checkbox' },
      { k: 'body', label: 'Text', type: 'textarea', wide: true, tall: true }, { k: 'image', label: 'Poster or photo (optional)', type: 'image' }
    ], title: (a) => a.title, blank: () => { const n = M.nowIn(draft.prayer.timezone); return { id: 'a' + M.uid(), date: M.ymd(n.y, n.m, n.d), pinned: false, title: '', body: '', image: '' }; }, addLabel: 'New announcement' });
  };

  /* ----- Programs ----- */
  views.programs = function (el) {
    el.innerHTML = head('Programs', 'Classes and services shown on the Programs page (the first six also appear on the home page).') + '<div id="progList"></div>';
    const icons = [['moon', 'Crescent'], ['jumuah', 'Mosque'], ['book', 'Book'], ['circle', 'Circle'], ['lamp', 'Lamp'], ['sound', 'Recitation'], ['lantern', 'Lantern'], ['star', 'Star'], ['users', 'People']];
    listEditor($('#progList'), { path: 'programs', fields: [
      { k: 'title', label: 'Title' }, { k: 'arabic', label: 'Arabic (optional)', arabic: true }, { k: 'desc', label: 'Description', type: 'textarea', wide: true },
      { k: 'when', label: 'When' }, { k: 'who', label: 'Who is it for' }, { k: 'icon', label: 'Icon', type: 'select', options: icons }, { k: 'contact', label: 'Registration / contact (optional)' }
    ], title: (p) => p.title, blank: () => ({ title: '', arabic: '', desc: '', when: '', who: 'Everyone', icon: 'star', contact: '' }), addLabel: 'Add a program' });
  };

  /* ----- Home ----- */
  views.home = function (el) {
    el.innerHTML = head('Home page', 'The words on the front page.') +
      card('Welcome', '', '<div class="fields">' + field('Small line above the title', 'home.kicker', { wide: true }) + field('Title', 'home.heading', { wide: true, help: 'The words “Masjid Adam” are highlighted automatically.' }) + field('Introduction', 'home.intro', { type: 'textarea', wide: true }) + '</div>') +
      card('About section', '', '<div class="fields">' + field('Heading', 'home.aboutHeading', { wide: true }) + field('Text', 'home.about', { type: 'textarea', wide: true, tall: true, help: 'Leave a blank line between paragraphs.' }) + '</div>') +
      card('Reminder band', 'A verse or hadith shown across the middle of the home page.', '<div class="fields">' + field('Arabic', 'home.reminder.arabic', { wide: true, arabic: true }) + field('Translation', 'home.reminder.text', { type: 'textarea', wide: true }) + field('Source', 'home.reminder.source', { placeholder: 'e.g. Qur’an 4:103' }) + '</div>');
  };

  /* ----- Org / contact ----- */
  views.org = function (el) {
    el.innerHTML = head('Contact & address', 'Used in the header, footer, contact page and map.') +
      card('Masjid', '', '<div class="fields">' + field('Short name', 'org.name') + field('Full name', 'org.fullName') + field('Address line 1', 'org.address1') + field('Address line 2', 'org.address2') + field('Email', 'org.email', { type: 'email' }) + field('Twitter / X link', 'org.twitter', { type: 'url' }) + field('Map search text', 'org.mapQuery', { wide: true, help: 'What the embedded map searches for.' }) + field('Directions link', 'org.mapLink', { type: 'url', wide: true }) + field('Entrance note', 'org.entranceNote', { type: 'textarea', wide: true }) + field('Parking note', 'org.parkingNote', { type: 'textarea', wide: true }) + '</div>') +
      card('People to contact', '', '<div id="contactList"></div>');
    listEditor($('#contactList'), { path: 'org.contacts', fields: [{ k: 'name', label: 'Name' }, { k: 'phone', label: 'Phone' }, { k: 'role', label: 'What they help with', wide: true }], title: (c) => c.name + ' · ' + c.phone, blank: () => ({ name: '', phone: '', role: '' }), addLabel: 'Add a contact' });
  };

  /* ----- Donate ----- */
  views.donate = function (el) {
    el.innerHTML = head('Donations', 'The Donate page and the green band on the home page.') +
      card('Text', '', '<div class="fields">' + field('Heading', 'donate.heading', { wide: true }) + field('Introduction', 'donate.intro', { type: 'textarea', wide: true }) + '</div>') +
      card('Ways to give', '', '<div class="fields">' + field('Interac e-Transfer email', 'donate.etransferEmail', { type: 'email', wide: true }) + field('e-Transfer note', 'donate.etransferNote', { type: 'textarea', wide: true }) + field('Online donation link (optional)', 'donate.onlineUrl', { type: 'url', help: 'e.g. a PayPal, Stripe or Zeffy page. Leave empty to hide.' }) + field('Online button label', 'donate.onlineLabel') + field('Cash / cheque note', 'donate.otherMethods', { type: 'textarea', wide: true }) + '</div>') +
      card('Where the money goes', '', '<div id="usesList"></div>') +
      card('Quote', '', '<div class="fields">' + field('Arabic', 'donate.quote.arabic', { wide: true, arabic: true }) + field('Translation', 'donate.quote.text', { type: 'textarea', wide: true }) + field('Source', 'donate.quote.source') + '</div>');
    listEditor($('#usesList'), { path: 'donate.uses', fields: [{ k: 'title', label: 'Title' }, { k: 'text', label: 'Text', type: 'textarea', wide: true }], title: (u) => u.title, blank: () => ({ title: '', text: '' }), addLabel: 'Add an item' });
  };

  /* ----- Learn ----- */
  views.learn = function (el) {
    el.innerHTML = head('Learn page', 'Educational content for the community and for visitors.') +
      card('Introduction', '', '<div class="fields">' + field('Intro', 'learn.intro', { type: 'textarea', wide: true }) + '</div>') +
      card('Visitor guide', 'Short numbered tips for first-time visitors.', '<div id="visitList"></div>') +
      card('Articles', 'Longer sections. Use **bold**, blank lines for paragraphs, and 1. / - for lists.', '<div id="secList"></div>') +
      card('Glossary', '', '<div id="glossList"></div>');
    listEditor($('#visitList'), { path: 'learn.visitorGuide', fields: [{ k: 'title', label: 'Title' }, { k: 'text', label: 'Text', type: 'textarea', wide: true }], title: (g) => g.title, blank: () => ({ title: '', text: '' }), addLabel: 'Add a tip' });
    listEditor($('#secList'), { path: 'learn.sections', fields: [{ k: 'title', label: 'Title' }, { k: 'arabic', label: 'Arabic (optional)', arabic: true }, { k: 'body', label: 'Text', type: 'textarea', wide: true, tall: true }], title: (s) => s.title, blank: () => ({ id: 's' + M.uid(), title: '', arabic: '', body: '' }), addLabel: 'Add an article' });
    listEditor($('#glossList'), { path: 'learn.glossary', fields: [{ k: 'term', label: 'Term' }, { k: 'def', label: 'Meaning' }], title: (g) => g.term, blank: () => ({ term: '', def: '' }), addLabel: 'Add a term' });
  };

  /* ----- Dates ----- */
  views.dates = function (el) {
    el.innerHTML = head('Islamic dates', 'Shown on the Learn page. Key dates (Ramadan, Eid, Ashura…) are calculated automatically from the Hijri calendar; add your own for Eid prayer times, fundraisers or events.') +
      card('Automatic dates', '', field('Show automatically calculated Islamic dates (marked “approx.”)', 'dates.showAuto', { type: 'checkbox' }) + '<div class="fields" style="margin-top:14px">' + field('Hijri date adjustment (days)', 'prayer.hijriAdjust', { type: 'number', step: '1', help: 'Shifts every Hijri date on the site. Use +1 or −1 after a moon sighting announcement.' }) + '</div>') +
      card('Your dates and events', '', '<div id="dateList"></div>');
    listEditor($('#dateList'), { path: 'dates.custom', fields: [{ k: 'date', label: 'Date', type: 'date' }, { k: 'title', label: 'Title' }, { k: 'note', label: 'Details', wide: true }], title: (d) => (d.date ? niceDate(d.date) + ' · ' : '') + d.title, blank: () => ({ date: '', title: '', note: '' }), addLabel: 'Add a date' });
  };

  /* ----- Settings ----- */
  views.settings = function (el) {
    const host = location.hostname;
    el.innerHTML = head('Settings', 'Publishing connection and your password.') +
      card('GitHub connection', 'The website lives in a GitHub repository. To publish from here, the admin needs a <b>fine-grained personal access token</b> with permission to write to that one repository. It is stored encrypted with your password, on this device only.',
        '<div class="help"><b>How to get a token (once):</b><br>1. Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a> (sign in as the account that owns the site).<br>2. Name it “Masjid admin”, set an expiry (up to 1 year), choose <b>Only select repositories</b> → the website repo.<br>3. Under Repository permissions set <b>Contents → Read and write</b>. Generate and paste it below.</div>' +
        '<div class="fields">' + field('GitHub username / owner', 'settings.githubOwner', { placeholder: host.endsWith('github.io') ? host.split('.')[0] : 'e.g. waniasaqib' }) + field('Repository name', 'settings.githubRepo', { placeholder: 'e.g. masjid-adam' }) +
        '<label class="field wide"><span>Personal access token</span><input type="password" id="tokenInput" value="' + esc(secrets.token || '') + '" placeholder="github_pat_…" autocomplete="off"><small>' + (secrets.token ? 'A token is saved on this device.' : 'No token saved yet.') + '</small></label></div>' +
        '<div class="btn-row"><button type="button" class="btn btn-navy btn-sm" id="saveToken">Save token</button><button type="button" class="btn btn-outline btn-sm" id="testToken">Test connection</button></div><p class="sub" id="tokenMsg" style="margin-top:10px"></p>') +
      card('Change password', 'Only for this browser. Other devices set their own password when the admin is first opened there.', '<div class="fields">' + '<label class="field"><span>New password</span><input type="password" id="np1" autocomplete="new-password"></label></div><div class="btn-row"><button type="button" class="btn btn-navy btn-sm" id="changePw">Change password</button></div>') +
      card('Backup', 'Download everything (questions, texts, settings) as a file, or restore from one.', '<div class="btn-row"><button type="button" class="btn btn-outline btn-sm" id="exportBtn">Download site.json</button><button type="button" class="btn btn-outline btn-sm" id="importBtn">Restore from file…</button><input type="file" id="importFile" accept="application/json,.json" hidden></div>');
    $('#saveToken').addEventListener('click', async () => { secrets.token = $('#tokenInput').value.trim(); await saveSecrets(); toast(secrets.token ? 'Token saved on this device' : 'Token removed'); });
    $('#testToken').addEventListener('click', async () => {
      const msg = $('#tokenMsg'); msg.textContent = 'Testing…';
      try { const r = await gh('/repos/' + repoPath(), $('#tokenInput').value.trim()); const j = await r.json(); msg.textContent = r.ok ? '✓ Connected to ' + j.full_name + (j.permissions && j.permissions.push ? ' with write access.' : ' — but the token cannot write. Check Contents: Read and write.') : '✗ ' + (j.message || r.status); }
      catch (e) { msg.textContent = '✗ ' + e.message; }
    });
    $('#changePw').addEventListener('click', async () => { const a = $('#np1').value; if (a.length < 6) return toast('Use at least 6 characters'); await setPassword(a); $('#np1').value = ''; toast('Password changed'); });
    $('#exportBtn').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })); a.download = 'site.json'; a.click(); });
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; try { draft = M.normalize(JSON.parse(await f.text())); save(); $$('.view').forEach((v) => delete v.dataset.rendered); rerenderView(); toast('Restored — press Publish to make it live'); } catch (err) { toast('That file could not be read'); } });
  };

  /* ================= Publish (GitHub API) ================= */
  function repoPath() {
    const o = (draft.settings.githubOwner || (location.hostname.endsWith('github.io') ? location.hostname.split('.')[0] : '')).trim();
    const r = (draft.settings.githubRepo || (location.hostname.endsWith('github.io') ? location.pathname.split('/')[1] : '')).trim();
    return o + '/' + r;
  }
  function gh(path, token, opts) {
    return fetch('https://api.github.com' + path, Object.assign({ headers: { Authorization: 'Bearer ' + (token || secrets.token), Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' } }, opts || {}));
  }
  async function putFile(path, base64, message) {
    let sha;
    const r0 = await gh('/repos/' + repoPath() + '/contents/' + path);
    if (r0.ok) sha = (await r0.json()).sha;
    const r = await gh('/repos/' + repoPath() + '/contents/' + path, null, { method: 'PUT', body: JSON.stringify({ message, content: base64, sha }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(path + ': ' + (j.message || r.status)); }
  }
  const utf8b64 = (s) => btoa(unescape(encodeURIComponent(s)));
  const slug = (s) => String(s || 'image').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'image';

  $('#publishBtn').addEventListener('click', async () => {
    if (!secrets.token) { showView('settings'); return toast('Connect GitHub first (Settings)'); }
    if (!repoPath().includes('/') || repoPath().length < 3) { showView('settings'); return toast('Enter the GitHub owner and repository'); }
    modal('<h2>Publishing…</h2><p>Uploading your changes to the website. This takes a few seconds; the live site updates about a minute later.</p><div class="log" id="pubLog"></div><div class="btn-row"><button class="btn btn-outline btn-sm" id="mNo" type="button" disabled>Close</button></div>');
    const log = (t) => { const l = $('#pubLog'); l.textContent += t + '\n'; l.scrollTop = l.scrollHeight; };
    setStatus('Publishing…', 'busy');
    try {
      // 1. Upload any new images (data URLs) and swap them for paths
      const out = M.clone(draft);
      const uploads = [];
      out.announcements.forEach((a) => { if (a.image && a.image.startsWith('data:')) uploads.push({ obj: a, key: 'image', name: slug(a.title) }); });
      if (out.prayer.timetableImage && out.prayer.timetableImage.startsWith('data:')) uploads.push({ obj: out.prayer, key: 'timetableImage', name: 'timetable' });
      for (const u of uploads) {
        const dataUrl = u.obj[u.key];
        const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
        const path = 'data/uploads/' + u.name + '-' + Date.now().toString(36) + '.' + ext;
        log('Uploading ' + path);
        await putFile(path, dataUrl.split(',')[1], 'Add image: ' + u.name);
        u.obj[u.key] = path;
      }
      // 2. Write site.json
      log('Saving site content');
      await putFile('data/site.json', utf8b64(JSON.stringify(out, null, 2) + '\n'), 'Update website content');
      draft = out; published = M.clone(out);
      localStorage.setItem(M.KEYS.draft, JSON.stringify(draft));
      log('Done. The live site updates within about a minute.');
      refreshStatus(); toast('Published');
      $$('.view').forEach((v) => delete v.dataset.rendered); rerenderView();
    } catch (e) {
      log('Error: ' + e.message);
      setStatus('Publish failed — see details', 'dirty');
    }
    $('#mNo').disabled = false; $('#mNo').onclick = closeModal;
  });
  $('#discardBtn').addEventListener('click', () => confirmBox('Discard your unpublished changes?', 'The draft in this browser goes back to what is currently published.', 'Discard', () => { draft = M.clone(published); localStorage.removeItem(M.KEYS.draft); refreshStatus(); $$('.view').forEach((v) => delete v.dataset.rendered); rerenderView(); toast('Draft discarded'); }));

  /* ================= Boot ================= */
  async function unlock() {
    $('#lock').hidden = true; $('#app').hidden = false;
    published = await fetchPublished();
    try { const d = localStorage.getItem(M.KEYS.draft); draft = d ? M.normalize(JSON.parse(d)) : M.clone(published); } catch (e) { draft = M.clone(published); }
    $('#views').innerHTML = Object.keys(views).map((v) => '<div class="view" data-view="' + v + '"></div>').join('');
    refreshStatus();
    showView(location.hash.slice(1) && views[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard');
  }
  if (await resumeSession()) unlock(); else lockScreen();
})();
