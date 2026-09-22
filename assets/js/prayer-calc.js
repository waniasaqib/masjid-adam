/* Astronomical prayer time calculation (no external services).
   Based on the standard solar-position equations used by most prayer apps. */
(function (root) {
  'use strict';
  const METHODS = {
    ISNA: { name: 'ISNA (North America)', fajr: 15, isha: 15 },
    MWL: { name: 'Muslim World League', fajr: 18, isha: 17 },
    Egypt: { name: 'Egyptian General Authority', fajr: 19.5, isha: 17.5 },
    Karachi: { name: 'University of Islamic Sciences, Karachi', fajr: 18, isha: 18 },
    Makkah: { name: 'Umm al-Qura, Makkah', fajr: 18.5, ishaMinutes: 90 },
    Tehran: { name: 'Tehran', fajr: 17.7, isha: 14, maghrib: 4.5 }
  };
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const fix = (a, m) => { a = a - m * Math.floor(a / m); return a < 0 ? a + m : a; };
  const dsin = (d) => Math.sin(rad(d)), dcos = (d) => Math.cos(rad(d)), dtan = (d) => Math.tan(rad(d));
  const darcsin = (x) => deg(Math.asin(x)), darccos = (x) => deg(Math.acos(x)), darccot = (x) => deg(Math.atan(1 / x));

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = fix(357.529 + 0.98560028 * D, 360);
    const q = fix(280.459 + 0.98564736 * D, 360);
    const L = fix(q + 1.915 * dsin(g) + 0.02 * dsin(2 * g), 360);
    const e = 23.439 - 0.00000036 * D;
    const RA = fix(darctan2(dcos(e) * dsin(L), dcos(L)) / 15, 24);
    const decl = darcsin(dsin(e) * dsin(L));
    const eqt = q / 15 - RA;
    return { declination: decl, equation: eqt };
  }
  function darctan2(y, x) { return deg(Math.atan2(y, x)); }

  /* Returns times as decimal hours (local) for the given civil date. */
  function compute(date, opts) {
    const o = Object.assign({ lat: 43.6, lng: -79.6, method: 'ISNA', asr: 'Standard', highLat: 'NightMiddle', tz: null }, opts);
    const method = METHODS[o.method] || METHODS.ISNA;
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const tz = o.tz != null ? o.tz : -new Date(y, m - 1, d, 12).getTimezoneOffset() / 60;
    const jd = julian(y, m, d) - o.lng / (15 * 24);
    const sun = sunPosition(jd);
    const noon = fix(12 - sun.equation, 24);
    const T = (angle, ccw) => {
      const v = (1 / 15) * darccos((-dsin(angle) - dsin(sun.declination) * dsin(o.lat)) / (dcos(sun.declination) * dcos(o.lat)));
      return noon + (ccw ? -v : v);
    };
    const asrT = (factor) => {
      const a = -darccot(factor + dtan(Math.abs(o.lat - sun.declination)));
      return T(a, false);
    };
    const sunrise = T(0.833, true), sunset = T(0.833, false);
    let fajr = T(method.fajr, true);
    let isha = method.ishaMinutes ? sunset + method.ishaMinutes / 60 : T(method.isha, false);
    const maghrib = method.maghrib ? T(method.maghrib, false) : sunset;
    const asr = asrT(o.asr === 'Hanafi' ? 2 : 1);
    // High-latitude fallback (night middle) when angles never reach
    const night = 24 - (sunset - sunrise);
    if (isNaN(fajr)) fajr = sunrise - night / 2;
    if (isNaN(isha)) isha = sunset + night / 2;
    const adj = (t) => fix(t + tz - o.lng / 15, 24);
    return {
      fajr: adj(fajr), sunrise: adj(sunrise), dhuhr: adj(noon) + 1 / 60, asr: adj(asr),
      maghrib: adj(maghrib), isha: adj(isha), sunset: adj(sunset)
    };
  }

  function toHM(h, offsetMin) {
    let mins = Math.round(h * 60) + (offsetMin || 0);
    mins = ((mins % 1440) + 1440) % 1440;
    return { h: Math.floor(mins / 60), m: mins % 60, mins };
  }
  function fmt(mins, opt) {
    const h24 = Math.floor(mins / 60) % 24, m = mins % 60;
    if (opt && opt.h24) return String(h24).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    const h = h24 % 12 || 12;
    return h + ':' + String(m).padStart(2, '0') + (opt && opt.noSuffix ? '' : (h24 < 12 ? ' AM' : ' PM'));
  }

  root.PrayerCalc = { METHODS, compute, toHM, fmt };
})(typeof window !== 'undefined' ? window : globalThis);
