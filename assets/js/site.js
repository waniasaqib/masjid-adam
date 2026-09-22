/* Public site: shared header/footer and page renderers. */
(async function () {
  'use strict';
  const M = window.MASJID;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = M.escape;
  const B = M.BASE;
  const page = document.body.dataset.page || 'home';
  const site = await M.load();
  const cfg = site.prayer;
  const org = site.org;
  const ARCH = '<svg width="0" height="0" style="position:absolute"><defs><clipPath id="archClip" clipPathUnits="objectBoundingBox"><path d="M0 1V0.28C0 0.11 0.22 0.02 0.5 0C0.78 0.02 1 0.11 1 0.28V1Z"/></clipPath></defs></svg>';
  const MARK = '<svg viewBox="0 0 100 120" fill="none" aria-hidden="true"><path d="M12 114V58C12 32 30 16 50 8C70 16 88 32 88 58V114" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M24 114V60C24 42 36 30 50 24C64 30 76 42 76 60V114" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 114H96" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M50 8V2" stroke="#C9A96A" stroke-width="2.2" stroke-linecap="round"/><path d="M56 46A18 18 0 1 0 56 82A14 14 0 1 1 56 46Z" fill="#C9A96A"/><path d="M62 58l1.9 4 4.3.5-3.2 3 .9 4.3-3.9-2.2-3.9 2.2.9-4.3-3.2-3 4.3-.5z" fill="currentColor"/></svg>';
  const STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.6 6.4L21 11l-6.4 2.6L12 20l-2.6-6.4L3 11l6.4-2.6z"/></svg>';
  const ICON = {
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    jumuah: '<svg viewBox="0 0 24 24"><path d="M4 21V11c0-4 3.6-7 8-9 4.4 2 8 5 8 9v10"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h5v18H6a2 2 0 0 1-2-2z"/><path d="M11 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></svg>',
    circle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
    lamp: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    lantern: '<svg viewBox="0 0 24 24"><path d="M12 2v3M8 5h8"/><path d="M7 9c0-2 2.5-4 5-4s5 2 5 4v6c0 2-2.5 4-5 4s-5-2-5-4z"/><path d="M8 21h8"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M15 14.5c2.6-.3 4.8 1 5.6 4.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
    door: '<svg viewBox="0 0 24 24"><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M3 21h18M14 12h1"/></svg>',
    car: '<svg viewBox="0 0 24 24"><path d="M5 17h14M6 17l1.5-6h9L18 17"/><path d="M4 17v3M20 17v3M7 11l1-4h8l1 4"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8c-2-3-5-3-5-1s3 1 5 1zm0 0c2-3 5-3 5-1s-3 1-5 1z"/></svg>',
    cash: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    print: '<svg viewBox="0 0 24 24"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>'
  };
  M.ICON = ICON;

  /* ---------- Chrome ---------- */
  const NAV = [
    ['home', 'Home', ''],
    ['prayer', 'Prayer Times', 'prayer-times.html'],
    ['programs', 'Programs', 'programs.html'],
    ['news', 'Announcements', 'announcements.html'],
    ['learn', 'Learn', 'learn.html'],
    ['contact', 'Contact', 'contact.html']
  ];
  function brand(cls) {
    return '<a class="brand ' + (cls || '') + '" href="' + B + '">' + MARK + '<span class="brand-text"><span class="brand-name">' + esc(org.name) + '</span><span class="brand-sub">Islamic Centre · Mississauga</span></span></a>';
  }
  function renderHeader() {
    const h = $('#siteHeader');
    if (!h) return;
    h.innerHTML = '<div class="wrap">' + brand() +
      '<button class="nav-toggle" id="navToggle" type="button" aria-label="Menu" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      '<nav class="nav" id="nav" aria-label="Main">' +
        NAV.map(([k, l, href]) => '<a href="' + B + (href || '') + '"' + (k === page ? ' class="active" aria-current="page"' : '') + '>' + l + '</a>').join('') +
        '<a class="btn btn-green btn-sm" href="' + B + 'donate.html">' + ICON.gift + ' Donate</a>' +
      '</nav></div>';
    $('#navToggle').addEventListener('click', () => {
      const open = $('#nav').classList.toggle('open');
      $('#navToggle').setAttribute('aria-expanded', open);
    });
    document.body.insertAdjacentHTML('afterbegin', ARCH);
  }
  function renderFooter(today) {
    const f = $('#siteFooter');
    if (!f) return;
    const times = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k) => '<span>' + M.NAMES[k] + '</span><b>' + M.fmt(today.iqamah[k] ? today.iqamah[k].mins : today.adhan[k]) + '</b>').join('');
    f.innerHTML = '<div class="wrap"><div class="cols">' +
      '<div>' + brand() + '<p>' + esc(org.address1) + '<br>' + esc(org.address2) + '</p><p><a href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a></p></div>' +
      '<div><h4>Today’s jama‘ah</h4><div class="footer-times">' + times + '</div></div>' +
      '<div><h4>Pages</h4><ul>' + NAV.map(([k, l, href]) => '<li><a href="' + B + (href || '') + '">' + l + '</a></li>').join('') + '<li><a href="' + B + 'donate.html">Donate</a></li></ul></div>' +
      '<div><h4>Connect</h4><ul>' +
        (org.twitter ? '<li><a href="' + esc(org.twitter) + '" target="_blank" rel="noopener">Twitter / X</a></li>' : '') +
        '<li><a href="' + esc(org.mapLink || ('https://maps.google.com/?q=' + encodeURIComponent(org.mapQuery))) + '" target="_blank" rel="noopener">Directions</a></li>' +
        '<li><a href="' + B + 'prayer-times.html#print">Printable timetable</a></li>' +
      '</ul></div></div>' +
      '<div class="bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(org.fullName) + '</span><span><a href="' + B + 'admin/">Admin</a></span></div></div>';
  }

  let toastTimer;
  M.toast = function (msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.append(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  };
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); M.toast('Copied: ' + text); }
    catch (e) { M.toast('Could not copy — please select the text'); }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (b) { e.preventDefault(); copy(b.dataset.copy); }
  });

  /* ---------- Today's times (shared) ---------- */
  const now = M.nowIn(cfg.timezone);
  const today = M.dayTimes(cfg, now.y, now.m, now.d);
  const tmr = new Date(Date.UTC(now.y, now.m - 1, now.d) + 864e5);
  const tomorrow = M.dayTimes(cfg, tmr.getUTCFullYear(), tmr.getUTCMonth() + 1, tmr.getUTCDate());
  const hijri = M.hijri(now.y, now.m, now.d, cfg.hijriAdjust);

  function todayCard() {
    const n = M.nowIn(cfg.timezone);
    const next = M.nextPrayer(today, tomorrow, n.mins);
    const rows = M.PRAYERS.map((k) => {
      const iq = today.iqamah[k];
      const cls = (k === next.key && !next.tomorrow ? ' is-next' : today.adhan[k] < n.mins ? ' is-past' : '') + (k === 'sunrise' ? ' sunrise' : '');
      return '<tr class="' + cls.trim() + '"><td>' + M.NAMES[k] + '<span class="arabic">' + M.ARABIC[k] + '</span></td><td class="adhan">' + M.fmt(today.adhan[k]) + '</td><td>' + (k === 'sunrise' ? '' : M.fmt(iq ? iq.mins : null)) + '</td></tr>';
    }).join('');
    const jum = (cfg.jumuah || []).map((j) => M.time24to12(j.time)).join(' & ');
    return '<div class="today-head"><div><div class="today-date">' + M.longDate(n.y, n.m, n.d) + '</div><div class="today-hijri">' + esc(M.hijriString(hijri)) + '</div></div><span class="today-live"><i></i>Live</span></div>' +
      '<div class="next"><div><div class="next-label">' + (next.tomorrow ? 'Next prayer · tomorrow' : 'Next prayer') + '</div><div class="next-name">' + M.NAMES[next.key] + '<span class="arabic">' + M.ARABIC[next.key] + '</span></div></div><div class="next-in"><b>' + M.fmt(next.mins) + '</b>in ' + M.durationText(next.minsUntil) + '</div></div>' +
      '<table class="times"><thead><tr><th>Prayer</th><th>Adhan</th><th>Iqamah</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="today-foot"><span>Jumu‘ah <b>' + esc(jum) + '</b></span><a href="' + B + 'prayer-times.html">Full timetable ' + '→</a></div>';
  }

  /* ---------- Day arc ---------- */
  function dayArc(el) {
    if (!el) return;
    const n = M.nowIn(cfg.timezone);
    const keys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const start = today.adhan.fajr - 30, end = today.adhan.isha + 40;
    const span = end - start;
    const X = (mins) => Math.min(1, Math.max(0, (mins - start) / span));
    const track = el.querySelector('.dayarc-track');
    const W = track.clientWidth, H = track.clientHeight;
    const Y = (x) => H * (0.98 - 0.5 * Math.sin(Math.PI * x));
    let d = '';
    for (let i = 0; i <= 60; i++) { const x = i / 60; d += (i ? 'L' : 'M') + (x * W).toFixed(1) + ' ' + Y(x).toFixed(1); }
    const cur = M.currentPrayer(today, n.mins);
    const marks = keys.map((k) => {
      const x = X(today.adhan[k]);
      const cls = today.adhan[k] < n.mins ? (k === cur ? 'now' : 'past') : '';
      return '<div class="dayarc-mark ' + cls + '" style="left:' + (x * 100).toFixed(2) + '%;top:' + (Y(x) - 46).toFixed(1) + 'px">' + M.NAMES[k] + '<small>' + M.fmt(today.adhan[k], { noSuffix: true }) + '</small></div>';
    }).join('');
    const isDay = n.mins >= today.adhan.sunrise && n.mins <= today.adhan.maghrib;
    const sx = X(n.mins);
    const sun = isDay ? '<div class="dayarc-sun" style="left:' + (sx * 100).toFixed(2) + '%;top:' + Y(sx).toFixed(1) + 'px"></div>' : '';
    track.innerHTML = '<svg><path d="' + d + '" fill="none" stroke="rgba(201,169,106,0.55)" stroke-width="1.5" stroke-dasharray="3 5"/></svg>' + marks + sun;
    const dayLen = today.adhan.maghrib - today.adhan.sunrise;
    const foot = el.querySelector('.dayarc-foot');
    if (foot) foot.innerHTML = '<span>' + (isDay ? 'The sun is up — <b>' + M.durationText(today.adhan.maghrib - n.mins) + '</b> until Maghrib' : n.mins < today.adhan.fajr ? 'Before dawn — Fajr at <b>' + M.fmt(today.adhan.fajr) + '</b>' : 'Night — Fajr tomorrow at <b>' + M.fmt(tomorrow.adhan.fajr) + '</b>') + '</span><span>Daylight today <b>' + Math.floor(dayLen / 60) + ' h ' + (dayLen % 60) + ' min</b> · Sunrise ' + M.fmt(today.adhan.sunrise) + ' · Sunset ' + M.fmt(today.adhan.maghrib) + '</span>';
  }

  /* ---------- Pages ---------- */
  const pages = {};

  pages.home = function () {
    const h = site.home;
    $('#heroText').innerHTML = '<img class="bismillah" src="' + B + 'assets/img/bismillah-gold.png" alt="Bismillah ir-Rahman ir-Rahim">' +
      '<p class="kicker gold">' + esc(h.kicker) + '</p><h1>' + esc(h.heading).replace(/Masjid Adam/, '<em>Masjid Adam</em>') + '</h1><p class="lead">' + esc(h.intro) + '</p>' +
      '<div class="hero-actions"><a class="btn btn-gold" href="' + B + 'prayer-times.html">' + ICON.clock + ' Prayer timetable</a><a class="btn btn-outline" href="' + B + 'learn.html">New here? Start with our guide</a></div>' +
      '<div class="hero-meta"><span><b>' + esc(org.address1) + '</b>, Mississauga</span><span>Jumu‘ah <b>' + (cfg.jumuah || []).map((j) => M.time24to12(j.time)).join(' & ') + '</b></span></div>';
    $('#todayCard').innerHTML = todayCard();
    dayArc($('#dayArc'));

    $('#aboutText').innerHTML = '<p class="kicker">About the masjid</p><h2>' + esc(h.aboutHeading) + '</h2><div class="prose">' + M.md(h.about) + '</div>' +
      '<div class="facts"><div class="fact"><b>5</b><span>daily congregations</span></div><div class="fact"><b>' + (cfg.jumuah || []).length + '</b><span>Friday prayers</span></div><div class="fact"><b>' + site.programs.length + '</b><span>programs & classes</span></div></div>';

    $('#programsGrid').innerHTML = site.programs.slice(0, 6).map(programCard).join('');
    const r = h.reminder;
    $('#reminder').innerHTML = '<div class="wrap"><div class="arabic">' + esc(r.arabic) + '</div><p class="text">“' + esc(r.text) + '”</p><div class="src">' + esc(r.source) + '</div></div>';
    const news = sortedNews().slice(0, 3);
    $('#newsGrid').innerHTML = news.length ? news.map(newsCard).join('') : '<p class="lead">No announcements right now — check back soon.</p>';
    $('#learnGrid').innerHTML = [
      ['Visiting for the first time', 'What to expect, what to wear, and where to go — for anyone curious about the masjid.', 'door', 'learn.html#visit'],
      ['Why prayer times change daily', 'The adhan follows the sun; the iqamah is set by the masjid. Here is how both work.', 'sun', 'learn.html#adhan'],
      ['How to perform wudu', 'The washing before prayer, step by step.', 'circle', 'learn.html#wudu']
    ].map(([t, d, ic, href]) => '<a class="card" href="' + B + href + '"><div class="card-icon">' + ICON[ic] + '</div><h3>' + t + '</h3><p>' + d + '</p></a>').join('');
    $('#donateBand').innerHTML = donateBand();
    $('#visit').innerHTML = visitBlock();
    setInterval(() => { $('#todayCard').innerHTML = todayCard(); dayArc($('#dayArc')); }, 30000);
    if ('ResizeObserver' in window) new ResizeObserver(() => dayArc($('#dayArc'))).observe($('#dayArc'));
  };

  function programCard(p) {
    return '<article class="card"><div class="card-icon">' + (ICON[p.icon] || ICON.star) + '</div>' + (p.arabic ? '<div class="arabic">' + esc(p.arabic) + '</div>' : '') + '<h3>' + esc(p.title) + '</h3><p>' + esc(p.desc) + '</p>' +
      '<div class="meta">' + (p.when ? '<span>' + ICON.clock + esc(p.when) + '</span>' : '') + (p.who ? '<span>' + ICON.users + esc(p.who) + '</span>' : '') + '</div>' +
      (p.contact ? '<div class="card-contact">Register: ' + esc(p.contact) + '</div>' : '') + '</article>';
  }
  function sortedNews() {
    return site.announcements.slice().sort((a, b) => (b.pinned - a.pinned) || (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }
  function niceDate(s) { const d = M.parseYmd(s); return d.y ? M.MONTHS[d.m - 1].slice(0, 3) + ' ' + d.d + ', ' + d.y : ''; }
  function newsCard(a) {
    return '<article class="news-item">' + (a.image ? '<div class="thumb"><img src="' + esc(B + a.image) + '" alt="" loading="lazy"></div>' : '') +
      '<div class="body"><time>' + niceDate(a.date) + (a.pinned ? ' <span class="pin">· Pinned</span>' : '') + '</time><h3>' + esc(a.title) + '</h3><p>' + esc(a.body.split(/\n+/)[0]) + '</p><a class="more" href="' + B + 'announcements.html#' + esc(a.id) + '">Read more →</a></div></article>';
  }
  function donateBand() {
    const d = site.donate;
    return '<div class="wrap"><div><p class="kicker gold">Support the masjid</p><h2>' + esc(d.heading) + '</h2><p>' + esc(d.intro) + '</p><a class="btn btn-gold" href="' + B + 'donate.html">' + ICON.gift + ' Ways to give</a></div>' +
      '<div class="etransfer"><div class="label">Interac e-Transfer</div><div class="email">' + esc(d.etransferEmail) + '</div><button class="copy-btn" type="button" data-copy="' + esc(d.etransferEmail) + '">' + ICON.copy + ' Copy email</button></div></div>';
  }
  function mapEmbed() {
    return '<iframe title="Map to ' + esc(org.fullName) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' + encodeURIComponent(org.mapQuery) + '&output=embed"></iframe>';
  }
  function visitBlock() {
    return '<div class="wrap"><div><p class="kicker">Visit us</p><h2>Find the masjid</h2><div class="addr">' + esc(org.address1) + '<br>' + esc(org.address2) + '</div>' +
      '<ul class="info-list"><li>' + ICON.door + '<span><b>Entrance.</b> ' + esc(org.entranceNote) + '</span></li><li>' + ICON.car + '<span><b>Parking.</b> ' + esc(org.parkingNote) + '</span></li><li>' + ICON.mail + '<span><a href="mailto:' + esc(org.email) + '">' + esc(org.email) + '</a></span></li></ul>' +
      '<div class="contacts">' + org.contacts.map((c) => '<div class="contact-row"><div><b>' + esc(c.name) + '</b><small>' + esc(c.role || '') + '</small></div><a href="tel:' + esc(c.phone.replace(/[^\d+]/g, '')) + '">' + esc(c.phone) + '</a></div>').join('') + '</div>' +
      '<div class="hero-actions" style="margin-top:20px"><a class="btn btn-navy" target="_blank" rel="noopener" href="' + esc(org.mapLink || ('https://maps.google.com/?q=' + encodeURIComponent(org.mapQuery))) + '">' + ICON.pin + ' Get directions</a></div></div>' +
      '<div class="map">' + mapEmbed() + '</div></div>';
  }

  /* ---------- Prayer times page ---------- */
  pages.prayer = function () {
    let y = now.y, m = now.m;
    $('#todayCard').innerHTML = todayCard();
    $('#jumuah').innerHTML = '<div class="label">Jumu‘ah · Friday prayer</div>' + (cfg.jumuah || []).map((j) => '<div class="row"><span>' + esc(j.label) + '</span><span>' + M.time24to12(j.time) + '</span></div>').join('');
    const notes = (cfg.notes || []).filter(Boolean);
    $('#notes').innerHTML = notes.map((n) => '<div class="note">' + ICON.info + '<span>' + esc(n) + '</span></div>').join('');
    if (cfg.timetableImage) $('#timetableImg').innerHTML = '<figure class="timetable-img"><img src="' + esc(B + cfg.timetableImage) + '" alt="Monthly prayer timetable"><figcaption>' + esc(cfg.timetableCaption || 'Monthly timetable') + '</figcaption></figure>';
    $('#howGrid').innerHTML = [
      ['Adhan times follow the sun', 'Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha are calculated for the masjid’s exact location (' + (+cfg.lat).toFixed(3) + ', ' + (+cfg.lng).toFixed(3) + ') using the ' + esc((window.PrayerCalc.METHODS[cfg.method] || {}).name || cfg.method) + ' method' + (cfg.asr === 'Hanafi' ? ', with Asr at the later (Hanafi) time' : '') + '. They shift by a minute or two each day.', 'sun'],
      ['Iqamah is set by the masjid', 'The jama‘ah (congregation) times are fixed by the committee so you can plan your day, and are updated as the seasons change. Maghrib is prayed a few minutes after sunset.', 'users'],
      ['Print or save it', 'Use the print button to get a clean one-page timetable for the fridge, or come back — this page is always up to date.', 'print']
    ].map(([t, d, ic]) => '<div class="card"><div class="card-icon">' + ICON[ic] + '</div><h3>' + t + '</h3><p>' + d + '</p></div>').join('');

    function render() {
      const rows = M.monthTimes(cfg, y, m);
      const first = M.hijri(y, m, 1, cfg.hijriAdjust), last = M.hijri(y, m, rows.length, cfg.hijriAdjust);
      $('#monthTitle').textContent = M.MONTHS[m - 1] + ' ' + y;
      $('#monthHijri').textContent = first && last ? (first.m === last.m ? first.month + ' ' + first.y : first.month + ' – ' + last.month + ' ' + last.y) + ' AH' : '';
      $('#printHead').innerHTML = '<h1>' + esc(org.fullName) + '</h1><p>' + M.MONTHS[m - 1] + ' ' + y + ' prayer timetable · ' + $('#monthHijri').textContent + '</p><p>' + esc(org.address1) + ', ' + esc(org.address2) + ' · Jumu‘ah ' + (cfg.jumuah || []).map((j) => M.time24to12(j.time)).join(' & ') + '</p>';
      const f = (x) => M.fmt(x, { noSuffix: true });
      $('#monthBody').innerHTML = rows.map((r) => {
        const cls = (r.weekday === 'Fri' ? 'fri ' : '') + (r.ymd === today.ymd ? 'today' : '');
        const iq = (k) => '<td class="iq">' + (r.iqamah[k] ? f(r.iqamah[k].mins) : '—') + '</td>';
        return '<tr class="' + cls.trim() + '"><td class="day">' + r.d + '<small>' + r.weekday + '</small></td>' +
          '<td class="ad">' + f(r.adhan.fajr) + '</td>' + iq('fajr') + '<td class="ad">' + f(r.adhan.sunrise) + '</td>' +
          '<td class="ad">' + f(r.adhan.dhuhr) + '</td>' + iq('dhuhr') + '<td class="ad">' + f(r.adhan.asr) + '</td>' + iq('asr') +
          '<td class="ad">' + f(r.adhan.maghrib) + '</td>' + iq('maghrib') + '<td class="ad">' + f(r.adhan.isha) + '</td>' + iq('isha') + '</tr>';
      }).join('');
    }
    $('#prevMonth').addEventListener('click', () => { m--; if (m < 1) { m = 12; y--; } render(); });
    $('#nextMonth').addEventListener('click', () => { m++; if (m > 12) { m = 1; y++; } render(); });
    $('#thisMonth').addEventListener('click', () => { y = now.y; m = now.m; render(); });
    $('#printBtn').addEventListener('click', () => window.print());
    render();
    if (location.hash === '#print') setTimeout(() => window.print(), 600);
    setInterval(() => { $('#todayCard').innerHTML = todayCard(); }, 30000);
  };

  pages.programs = function () {
    $('#programsGrid').innerHTML = site.programs.map(programCard).join('');
    $('#regBox').innerHTML = '<div class="etransfer" style="background:#fff;border-color:var(--line);color:var(--ink)"><div class="label" style="color:var(--green)">Registration & questions</div>' +
      org.contacts.slice(0, 2).map((c) => '<div class="contact-row"><div><b>' + esc(c.name) + '</b><small>' + esc(c.role || '') + '</small></div><a href="tel:' + esc(c.phone.replace(/[^\d+]/g, '')) + '">' + esc(c.phone) + '</a></div>').join('') + '</div>';
  };

  pages.news = function () {
    const list = sortedNews();
    $('#newsList').innerHTML = list.length ? list.map((a) => '<article class="news-item" id="' + esc(a.id) + '">' + (a.image ? '<div class="thumb"><img src="' + esc(B + a.image) + '" alt="" loading="lazy"></div>' : '') +
      '<div class="body"><time>' + niceDate(a.date) + (a.pinned ? ' <span class="pin">· Pinned</span>' : '') + '</time><h3>' + esc(a.title) + '</h3><div class="md">' + M.md(a.body) + '</div></div></article>').join('') : '<p class="lead">No announcements right now — check back soon.</p>';
    if (org.twitter) $('#twitterLink').innerHTML = '<a class="btn btn-outline" href="' + esc(org.twitter) + '" target="_blank" rel="noopener">' + ICON.globe + ' Follow us on X / Twitter</a>';
    if (location.hash) { const el = $(location.hash); if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); }
  };

  pages.learn = function () {
    const L = site.learn;
    $('#learnIntro').textContent = L.intro;
    $('#visitGuide').innerHTML = '<ol class="steps">' + L.visitorGuide.map((g) => '<li><div><b>' + esc(g.title) + '</b><span>' + esc(g.text) + '</span></div></li>').join('') + '</ol>';
    const PR = [
      ['Fajr', 'الفجر', 'Dawn', 'From the first light of dawn until sunrise', '2'],
      ['Dhuhr', 'الظهر', 'Midday', 'After the sun passes its highest point', '4'],
      ['Asr', 'العصر', 'Afternoon', 'Mid-afternoon until just before sunset', '4'],
      ['Maghrib', 'المغرب', 'Sunset', 'Right after the sun sets', '3'],
      ['Isha', 'العشاء', 'Night', 'After the last light fades from the sky', '4']
    ];
    $('#prayerTable').innerHTML = '<thead><tr><th>Prayer</th><th>Meaning</th><th>When</th><th>Obligatory rak‘ahs</th><th>Today at Masjid Adam</th></tr></thead><tbody>' +
      PR.map(([n, ar, mean, when, rk]) => { const k = n.toLowerCase(); return '<tr><td>' + n + '<span class="arabic">' + ar + '</span></td><td>' + mean + '</td><td>' + when + '</td><td><b>' + rk + '</b></td><td><b>' + M.fmt(today.adhan[k]) + '</b> adhan · ' + M.fmt(today.iqamah[k] ? today.iqamah[k].mins : null) + ' iqamah</td></tr>'; }).join('') + '</tbody>';
    $('#articles').innerHTML = L.sections.map((s) => '<article class="article" id="' + esc(s.id) + '"><h2>' + esc(s.title) + '<span class="arabic">' + esc(s.arabic || '') + '</span></h2><div class="md">' + M.md(s.body) + '</div></article>').join('');
    $('#learnNav').innerHTML = '<a href="#visit">Visiting</a><a href="#prayers">The five prayers</a>' + L.sections.map((s) => '<a href="#' + esc(s.id) + '">' + esc(s.title) + '</a>').join('') + '<a href="#dates">Islamic dates</a><a href="#glossary">Glossary</a>';
    $('#glossary').innerHTML = L.glossary.map((g) => '<div><dt>' + esc(g.term) + '</dt><dd>' + esc(g.def) + '</dd></div>').join('');
    renderDates($('#dates'));
  };

  function renderDates(el) {
    if (!el) return;
    const auto = site.dates.showAuto ? M.upcomingIslamicDates(now.y, now.m, now.d, cfg.hijriAdjust, 7) : [];
    const custom = (site.dates.custom || []).filter((c) => c.date && c.date >= today.ymd).map((c) => ({ ...c, auto: false }));
    const all = auto.concat(custom).sort((a, b) => (a.date > b.date ? 1 : -1)).slice(0, 10);
    el.innerHTML = all.length ? all.map((e) => { const d = M.parseYmd(e.date); return '<div class="date-row"><div class="d"><b>' + d.d + '</b><span>' + M.MONTHS[d.m - 1].slice(0, 3) + '</span></div><div><h3>' + esc(e.title) + (e.auto ? '<span class="tag">approx.</span>' : '') + '</h3><p>' + esc(e.note || '') + (e.auto ? ' · ' + M.weekday(d.y, d.m, d.d) + ' ' + d.y : '') + '</p></div></div>'; }).join('') : '<p class="lead">No upcoming dates listed.</p>';
  }

  pages.donate = function () {
    const d = site.donate;
    $('#donateIntro').innerHTML = '<p class="lead">' + esc(d.intro) + '</p>';
    let methods = '<div class="method"><div class="card-icon">' + ICON.mail + '</div><div><h3>Interac e-Transfer</h3><p>' + esc(d.etransferNote) + '</p><div class="email">' + esc(d.etransferEmail) + '</div><button class="copy-btn" type="button" data-copy="' + esc(d.etransferEmail) + '">' + ICON.copy + ' Copy email address</button></div></div>';
    if (d.onlineUrl) methods += '<div class="method"><div class="card-icon">' + ICON.globe + '</div><div><h3>' + esc(d.onlineLabel || 'Donate online') + '</h3><p>Give securely by card online.</p><a class="btn btn-green" href="' + esc(d.onlineUrl) + '" target="_blank" rel="noopener">' + ICON.gift + ' ' + esc(d.onlineLabel || 'Donate online') + '</a></div></div>';
    methods += '<div class="method"><div class="card-icon">' + ICON.cash + '</div><div><h3>Cash or cheque</h3><p>' + esc(d.otherMethods) + '</p></div></div>';
    $('#methods').innerHTML = methods;
    $('#uses').innerHTML = d.uses.map((u) => '<div class="use"><b>' + esc(u.title) + '</b><span>' + esc(u.text) + '</span></div>').join('');
    $('#quote').innerHTML = '<div class="arabic">' + esc(d.quote.arabic) + '</div><div class="text">“' + esc(d.quote.text) + '”</div><div class="src">' + esc(d.quote.source) + '</div>';
    const g = site.learn.sections.find((s) => s.id === 'giving');
    if (g) $('#giving').innerHTML = '<article class="article"><h2>' + esc(g.title) + '<span class="arabic">' + esc(g.arabic || '') + '</span></h2><div class="md">' + M.md(g.body) + '</div></article>';
  };

  pages.contact = function () {
    $('#visit').innerHTML = visitBlock();
    $('#todayMini').innerHTML = todayCard();
  };

  /* ---------- Boot ---------- */
  renderHeader();
  (pages[page] || function () {})();
  renderFooter(today);
  document.title = document.title.replace('{{name}}', org.fullName);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else $$('.reveal').forEach((el) => el.classList.add('in'));
})();
