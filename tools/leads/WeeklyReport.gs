/**
 * Raport săptămânal Vercel Web Analytics → e-mail către client (gratuit, din contul tău Google)
 * ----------------------------------------------------------------------------
 * Instalare (o singură dată, ~5 minute):
 *  1. Vercel → Account Settings → Tokens → Create Token
 *     (scope: echipa ta, expirare 1 an). Copiază tokenul.
 *  2. script.google.com → Proiect nou → lipește acest fișier → Salvează.
 *  3. Setările proiectului (rotița) → Proprietăți script → Adaugă:
 *        VERCEL_TOKEN = tokenul de la pasul 1   (NU îl pune în cod, NU îl trimite nimănui)
 *  4. Modifică mai jos CLIENTS dacă e nevoie (e-mailuri, proiecte).
 *  5. Alege funcția „testReport” → Rulează → acceptă permisiunile. Primești raportul doar TU, ca test.
 *  6. Alege funcția „install” → Rulează. De acum pleacă singur, în fiecare luni la ~9:00.
 */

var TEAM_ID = 'team_pGYPWrKQmTpaplSOvNTl5o5T';
var CLIENTS = [
  { name: 'Big Big Boon', site: 'www.bigbigboon.ro', projectId: 'prj_ASRqvzbUNupLCdg5rsLyFbURmrLE',
    to: 'barabasiattila@bigbigboon.ro', cc: 'akosska55@gmail.com', lang: 'ro' }
];
var FROM_NAME = 'OHI Solutions';

function install() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'weekly') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('weekly').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();
}
function weekly() { CLIENTS.forEach(function (c) { send_(c, false); }); }
function testReport() { CLIENTS.forEach(function (c) { send_(c, true); }); }

function send_(c, test) {
  var now = new Date(), end = startOfDay_(now), start = new Date(end.getTime() - 7 * 864e5), prevStart = new Date(start.getTime() - 7 * 864e5);
  var cur = total_(c, start, end), prev = total_(c, prevStart, start);
  var src = top_(c, 'referrerHostname', start, end, 6).map(function (r) { return [label_(r.referrerHostname), r.visitors]; });
  var pages = top_(c, 'requestPath', start, end, 6).map(function (r) { return [pageName_(r.requestPath), r.visitors]; });
  var dev = top_(c, 'deviceType', start, end, 3), mob = 0, all = 0;
  dev.forEach(function (r) { all += r.visitors; if (r.deviceType === 'mobile') mob += r.visitors; });
  var days = series_(c, start, end);
  var html = mail_(c, start, end, cur, prev, src, pages, all ? Math.round(mob * 100 / all) : 0, days);
  var to = test ? Session.getActiveUser().getEmail() : c.to;
  MailApp.sendEmail({ to: to, cc: test ? '' : (c.cc || ''), name: FROM_NAME, replyTo: c.cc || '',
    subject: (test ? '[TEST] ' : '') + 'Raport săptămânal ' + c.site + ': ' + cur.visitors + ' vizitatori', htmlBody: html });
}

/* ---------------- Vercel API ---------------- */
function api_(c, by, start, end, limit) {
  var token = PropertiesService.getScriptProperties().getProperty('VERCEL_TOKEN');
  if (!token) throw new Error('Lipsește VERCEL_TOKEN în Proprietăți script.');
  var q = { projectId: c.projectId, teamId: TEAM_ID, since: start.toISOString(), until: new Date(end.getTime() - 1000).toISOString(), limit: limit || 10 };
  var qs = Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&') +
    by.map(function (b) { return '&by=' + encodeURIComponent(b); }).join('');
  var res = UrlFetchApp.fetch('https://api.vercel.com/v1/query/web-analytics/visits/aggregate?' + qs,
    { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Vercel ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
  var j = JSON.parse(res.getContentText());
  return (j.result && j.result.data) || j.data || [];
}
function series_(c, s, e) { return api_(c, ['day'], s, e, 40); }
function total_(c, s, e) { var t = { visitors: 0, pageviews: 0 }; api_(c, ['deviceType'], s, e, 10).forEach(function (r) { t.visitors += r.visitors; t.pageviews += r.pageviews; }); return t; }
function top_(c, dim, s, e, n) { return api_(c, [dim], s, e, n).filter(function (r) { return r.visitors > 0; }); }

/* ---------------- e-mail ---------------- */
function mail_(c, s, e, cur, prev, src, pages, mobPct, days) {
  var diff = prev.visitors ? Math.round((cur.visitors - prev.visitors) * 100 / prev.visitors) : null;
  var trend = diff === null ? 'prima săptămână cu date' : (diff >= 0 ? '+' : '') + diff + '% față de săptămâna trecută';
  var max = Math.max.apply(null, days.map(function (d) { return d.visitors; }).concat([1]));
  var bars = days.map(function (d) {
    var h = Math.round(d.visitors / max * 60), dn = ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'][new Date(d.timestamp).getUTCDay()];
    return '<td style="vertical-align:bottom;text-align:center;padding:0 3px;font-size:11px;color:#777"><div style="height:' + Math.max(h, 2) + 'px;width:22px;background:#B8763D;border-radius:4px 4px 0 0;margin:0 auto"></div>' + dn + '<br><b style="color:#222">' + d.visitors + '</b></td>';
  }).join('');
  var list = function (rows) { return rows.length ? rows.map(function (r) { return '<tr><td style="padding:5px 16px 5px 0">' + esc_(r[0]) + '</td><td style="padding:5px 0;text-align:right;font-weight:600">' + r[1] + '</td></tr>'; }).join('') : '<tr><td style="color:#777">Fără date</td></tr>'; };
  return '<div style="font-family:Arial,sans-serif;max-width:560px;color:#1d1d1f;font-size:15px;line-height:1.5">' +
    '<p style="color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0">Raport săptămânal · ' + date_(s) + ' – ' + date_(new Date(e.getTime() - 864e5)) + '</p>' +
    '<h2 style="margin:6px 0 2px;font-size:22px">' + esc_(c.name) + ': ' + cur.visitors + ' vizitatori</h2>' +
    '<p style="margin:0 0 16px;color:#555">' + cur.pageviews + ' pagini văzute · ' + trend + ' · ' + mobPct + '% de pe telefon</p>' +
    '<table style="border-collapse:collapse;margin:8px 0 18px"><tr>' + bars + '</tr></table>' +
    '<h3 style="font-size:15px;margin:18px 0 6px">De unde au venit</h3><table style="border-collapse:collapse">' + list(src) + '</table>' +
    '<h3 style="font-size:15px;margin:18px 0 6px">Ce pagini au deschis</h3><table style="border-collapse:collapse">' + list(pages) + '</table>' +
    '<p style="margin-top:22px;color:#777;font-size:12.5px">Un vizitator = un dispozitiv pe zi. Datele vin din Vercel Web Analytics, fără cookie-uri și fără date personale. ' +
    'Vizitele noastre de verificare sunt excluse pe dispozitivele marcate.</p>' +
    '<p style="color:#777;font-size:12.5px">Întrebări? Răspunde la acest e-mail. · ' + FROM_NAME + '</p></div>';
}
function label_(h) {
  if (!h) return 'Direct (link scris, salvat sau din aplicații)';
  if (/google/.test(h)) return 'Google'; if (/facebook|fb\./.test(h)) return 'Facebook / Messenger'; if (/instagram/.test(h)) return 'Instagram';
  if (/bing/.test(h)) return 'Bing'; if (/ohis-gamma/.test(h)) return 'Portofoliul OHI'; if (/vercel\.com/.test(h)) return 'Verificări tehnice (noi)';
  return h;
}
function pageName_(p) { var m = { '/': 'Prima pagină', '/preturi': 'Prețuri', '/contact': 'Contact', '/despre': 'Despre noi', '/echipa': 'Echipa', '/blog': 'Blog' }; return m[p] || p; }
function startOfDay_(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function date_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd.MM'); }
function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
