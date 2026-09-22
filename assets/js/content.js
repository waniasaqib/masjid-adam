/* Shared content engine: loads site data, builds prayer schedules, Hijri dates and helpers. */
(function () {
  'use strict';
  const M = (window.MASJID = window.MASJID || {});
  const P = window.PrayerCalc;

  M.BASE = document.documentElement.dataset.base || '';
  M.KEYS = { draft: 'masjidAdam.draft.v1' };
  M.clone = (o) => JSON.parse(JSON.stringify(o));
  M.uid = () => Math.random().toString(36).slice(2, 10);
  M.escape = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Normalise: merge saved data over defaults so missing fields never break pages ---------- */
  function merge(def, val) {
    if (Array.isArray(def)) return Array.isArray(val) ? val : def;
    if (def && typeof def === 'object') {
      const out = {};
      Object.keys(def).forEach((k) => { out[k] = merge(def[k], val && typeof val === 'object' ? val[k] : undefined); });
      if (val && typeof val === 'object') Object.keys(val).forEach((k) => { if (!(k in out)) out[k] = val[k]; });
      return out;
    }
    return val === undefined || val === null || typeof val !== typeof def ? def : val;
  }
  M.normalize = (raw) => merge(M.clone(window.SITE_DEFAULTS), raw);

  /* Draft (admin preview) → published data/site.json → built-in defaults */
  M.load = async function () {
    const params = new URLSearchParams(location.search);
    if (params.has('preview')) {
      try { const d = localStorage.getItem(M.KEYS.draft); if (d) return M.normalize(JSON.parse(d)); } catch (e) { /* ignore */ }
    }
    try {
      const r = await fetch(M.BASE + 'data/site.json', { cache: 'no-store' });
      if (r.ok) return M.normalize(await r.json());
    } catch (e) { /* offline or missing */ }
    return M.normalize(null);
  };

  /* ---------- Dates & time zone ---------- */
  const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const NAMES = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
  const ARABIC = { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
  M.PRAYERS = PRAYERS; M.NAMES = NAMES; M.ARABIC = ARABIC;

  // Offset (hours) of a time zone on a given date, without relying on the visitor's zone.
  function tzOffset(date, tz) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(date);
      const g = (t) => +parts.find((p) => p.type === t).value;
      const asUTC = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second'));
      return (asUTC - date.getTime()) / 36e5;
    } catch (e) { return -date.getTimezoneOffset() / 60; }
  }
  // "Now" as a civil date/time in the masjid's zone: {y,m,d,mins}
  M.nowIn = function (tz) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' }).formatToParts(new Date());
    const g = (t) => parts.find((p) => p.type === t).value;
    return { y: +g('year'), m: +g('month'), d: +g('day'), mins: (+g('hour') % 24) * 60 + +g('minute'), secs: +g('second'), weekday: g('weekday') };
  };
  M.ymd = (y, m, d) => y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  M.parseYmd = (s) => { const [y, m, d] = String(s).split('-').map(Number); return { y, m, d }; };
  M.daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  M.weekday = (y, m, d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  M.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  M.longDate = (y, m, d) => M.weekday(y, m, d).replace(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/, (w) => ({ Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' }[w])) + ', ' + M.MONTHS[m - 1] + ' ' + d + ', ' + y;

  /* ---------- Hijri ---------- */
  const HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabi‘ al-Awwal', 'Rabi‘ al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Sha‘ban', 'Ramadan', 'Shawwal', 'Dhul Qa‘dah', 'Dhul Hijjah'];
  M.HIJRI_MONTHS = HIJRI_MONTHS;
  let hijriFmt = null;
  function hijriFormatter() {
    if (hijriFmt) return hijriFmt;
    for (const cal of ['islamic-umalqura', 'islamic-civil', 'islamic']) {
      try { hijriFmt = new Intl.DateTimeFormat('en-u-ca-' + cal + '-nu-latn', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' }); hijriFmt.resolvedOptions(); return hijriFmt; } catch (e) { /* try next */ }
    }
    return null;
  }
  // Hijri date for a civil date (y,m,d) with a ± day adjustment. Returns {d, m, y, month}
  M.hijri = function (y, m, d, adjust) {
    const f = hijriFormatter();
    if (!f) return null;
    const dt = new Date(Date.UTC(y, m - 1, d) + (adjust || 0) * 864e5);
    const parts = f.formatToParts(dt);
    const g = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
    const hm = g('month');
    return { d: g('day'), m: hm, y: g('year'), month: HIJRI_MONTHS[hm - 1] || '' };
  };
  M.hijriString = (h) => h ? h.d + ' ' + h.month + ' ' + h.y + ' AH' : '';

  // Upcoming key Islamic dates (approximate; subject to moon sighting), scanning ahead ~400 days.
  M.upcomingIslamicDates = function (fromY, fromM, fromD, adjust, limit) {
    const targets = [
      { m: 1, d: 1, title: 'Islamic New Year', note: '1 Muharram' },
      { m: 1, d: 10, title: 'Day of Ashura', note: '10 Muharram — a recommended day of fasting' },
      { m: 9, d: 1, title: 'Ramadan begins', note: '1 Ramadan — fasting from dawn to sunset' },
      { m: 9, d: 27, title: 'Laylat al-Qadr (likely night)', note: '27 Ramadan — sought in the last ten odd nights' },
      { m: 10, d: 1, title: 'Eid al-Fitr', note: '1 Shawwal — Eid prayer at the masjid' },
      { m: 12, d: 9, title: 'Day of Arafah', note: '9 Dhul Hijjah — recommended fast for those not on Hajj' },
      { m: 12, d: 10, title: 'Eid al-Adha', note: '10 Dhul Hijjah — Eid prayer at the masjid' }
    ];
    const out = [];
    const start = Date.UTC(fromY, fromM - 1, fromD);
    for (let i = 0; i < 400 && out.length < (limit || 8); i++) {
      const t = new Date(start + i * 864e5);
      const y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, d = t.getUTCDate();
      const h = M.hijri(y, m, d, adjust);
      if (!h) break;
      targets.forEach((k) => { if (h.m === k.m && h.d === k.d) out.push({ date: M.ymd(y, m, d), title: k.title, note: k.note, auto: true, hijri: h }); });
    }
    return out;
  };

  /* ---------- Prayer schedule ---------- */
  function parseIqamah(rule, key, adhanMins) {
    const v = rule && rule[key];
    if (v == null || v === '') return null;
    const s = String(v).trim();
    if (s[0] === '+') {
      const n = parseInt(s.slice(1), 10) || 0;
      return { mins: adhanMins + n, offset: n };
    }
    const mm = s.match(/^(\d{1,2}):(\d{2})/);
    if (!mm) return null;
    return { mins: (+mm[1]) * 60 + (+mm[2]), fixed: true };
  }
  function ruleFor(cfg, ymd) {
    const rules = (cfg.iqamahRules || []).filter((r) => r && r.from).slice().sort((a, b) => (a.from < b.from ? -1 : 1));
    let chosen = null;
    rules.forEach((r) => { if (r.from <= ymd) chosen = r; });
    return chosen || cfg.iqamahFallback || {};
  }

  // Full day: adhan and iqamah minutes for each prayer.
  M.dayTimes = function (cfg, y, m, d) {
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    const tz = tzOffset(date, cfg.timezone || 'America/Toronto');
    const t = P.compute(new Date(y, m - 1, d), { lat: +cfg.lat, lng: +cfg.lng, method: cfg.method, asr: cfg.asr, tz });
    const ymd = M.ymd(y, m, d);
    const rule = ruleFor(cfg, ymd);
    const out = { ymd, y, m, d, weekday: M.weekday(y, m, d), adhan: {}, iqamah: {}, rule };
    PRAYERS.forEach((k) => {
      const adj = (cfg.adjust && +cfg.adjust[k]) || 0;
      out.adhan[k] = P.toHM(t[k], adj).mins;
    });
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((k) => { out.iqamah[k] = parseIqamah(rule, k, out.adhan[k]); });
    return out;
  };

  M.monthTimes = function (cfg, y, m) {
    const n = M.daysInMonth(y, m);
    const rows = [];
    for (let d = 1; d <= n; d++) rows.push(M.dayTimes(cfg, y, m, d));
    return rows;
  };

  M.fmt = (mins, opt) => (mins == null ? '—' : P.fmt(mins, opt));

  // Which prayer is next, given today's times and the current minute of the day.
  M.nextPrayer = function (today, tomorrow, nowMins) {
    const order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    for (const k of order) {
      if (k === 'sunrise') continue;
      if (today.adhan[k] > nowMins) return { key: k, mins: today.adhan[k], day: today, minsUntil: today.adhan[k] - nowMins };
    }
    return { key: 'fajr', mins: tomorrow.adhan.fajr, day: tomorrow, minsUntil: 1440 - nowMins + tomorrow.adhan.fajr, tomorrow: true };
  };
  M.currentPrayer = function (today, nowMins) {
    let cur = null;
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((k) => { if (today.adhan[k] <= nowMins) cur = k; });
    return cur === 'sunrise' ? null : cur; // between sunrise and dhuhr there is no current prayer
  };
  M.durationText = function (mins) {
    if (mins < 1) return 'now';
    const h = Math.floor(mins / 60), mm = mins % 60;
    if (h === 0) return mm + ' min';
    return h + ' hr' + (h > 1 ? 's' : '') + (mm ? ' ' + mm + ' min' : '');
  };
  M.time24to12 = (s) => { const mm = String(s || '').match(/^(\d{1,2}):(\d{2})/); return mm ? P.fmt((+mm[1]) * 60 + (+mm[2])) : s; };

  /* ---------- Tiny markdown (paragraphs, **bold**, *italic*, lists, links) ---------- */
  M.md = function (text) {
    const esc = M.escape;
    const inline = (s) => esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|tel:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const blocks = String(text || '').replace(/\r/g, '').split(/\n{2,}/);
    return blocks.map((b) => {
      const lines = b.split('\n').filter((l) => l.trim());
      if (!lines.length) return '';
      if (lines.every((l) => /^\s*(\d+[.)]|[-*•])\s+/.test(l))) {
        const ol = /^\s*\d/.test(lines[0]);
        return '<' + (ol ? 'ol' : 'ul') + '>' + lines.map((l) => '<li>' + inline(l.replace(/^\s*(\d+[.)]|[-*•])\s+/, '')) + '</li>').join('') + '</' + (ol ? 'ol' : 'ul') + '>';
      }
      if (/^#{1,3}\s/.test(lines[0])) { const lvl = lines[0].match(/^(#+)/)[1].length + 2; return '<h' + lvl + '>' + inline(lines[0].replace(/^#+\s*/, '')) + '</h' + lvl + '>' + (lines.length > 1 ? '<p>' + lines.slice(1).map(inline).join('<br>') + '</p>' : ''); }
      return '<p>' + lines.map(inline).join('<br>') + '</p>';
    }).join('');
  };
})();
