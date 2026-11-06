/**
 * OHI Leads & Oferte — Google Sheet + Apps Script (free, no Make needed)
 * ----------------------------------------------------------------------------
 * Ce face:
 *  1. Primește cererile din formularul site-ului (web app → doPost) și le pune în tabul „Leads”.
 *  2. Trimite clientului un e-mail de confirmare și ție o alertă.
 *  3. Din meniul „OHI” trimiți oferta (PDF) pentru rândul selectat, după apel.
 *  4. Zilnic: reamintiri automate la ofertele fără răspuns (după 3 și 7 zile) + totaluri pe surse.
 *
 * Instalare (o singură dată, ~5 minute):
 *  1. Google Sheets → foaie nouă → Extensii → Apps Script → șterge tot și lipește acest fișier → Salvează.
 *  2. Alege funcția „setup” sus → Rulează → acceptă permisiunile (e contul tău).
 *  3. Implementare → Implementare nouă → tip „Aplicație web” → Execută ca: Eu → Acces: Oricine → Implementează.
 *  4. Copiază linkul „/exec” și trimite-l lui Claude (sau pune-l în setarea site-ului).
 *  5. În tabul „Setări” completează e-mailul tău, telefonul și textele. În „Pachete” pui prețurile.
 *
 * Pentru un client: Fișier → Creează o copie (din contul clientului) și repeți pașii 2–5.
 */

var SH = { leads: 'Leads', set: 'Setări', pk: 'Pachete', tot: 'Totaluri' };
var COLS = ['Data', 'Cod', 'Status', 'Nume', 'Afacere', 'Email', 'Telefon', 'Serviciu', 'Buget', 'Termen', 'Ora pentru apel',
  'Despre afacere', 'Site / Facebook', 'Sursă', 'Campanie', 'Pagina de intrare', 'Pagina formularului', 'Pachet', 'Preț ofertă (lei)',
  'Ofertă trimisă la', 'Reamintiri', 'Valoare câștigată (lei)', 'Note'];
var STATUS = ['Nou', 'Apel programat', 'Ofertă trimisă', 'Câștigat', 'Pierdut'];

/* ---------------------------------------------------------------- setup */
function setup() {
  var ss = SpreadsheetApp.getActive();
  var L = ss.getSheetByName(SH.leads) || ss.insertSheet(SH.leads, 0);
  L.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold').setBackground('#1f1b2e').setFontColor('#ffffff');
  L.setFrozenRows(1);
  var st = SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build();
  L.getRange(2, col_('Status'), 999, 1).setDataValidation(st);

  var S = ss.getSheetByName(SH.set) || ss.insertSheet(SH.set);
  if (S.getLastRow() < 2) {
    S.getRange(1, 1, 12, 2).setValues([
      ['Setare', 'Valoare'],
      ['Nume afacere', 'OHI Solutions'],
      ['E-mail notificări', Session.getActiveUser().getEmail() || ''],
      ['Telefon', '0740 267 706'],
      ['Site', 'https://ohis-gamma.vercel.app'],
      ['Semnătură', 'Ákos · OHI Solutions'],
      ['Link programare apel (opțional)', ''],
      ['Text confirmare', 'Mulțumim! Am primit cererea ta. Te contactăm în cel mult o zi lucrătoare ca să stabilim un apel scurt, de 20 de minute, în care aflăm despre afacerea ta, produsele și clienții tăi.'],
      ['Reamintire 1 după (zile)', 3],
      ['Reamintire 2 după (zile)', 7],
      ['Valabilitate ofertă (zile)', 14],
      ['Text ofertă (intro)', 'Îți mulțumim pentru discuție. Mai jos găsești oferta pentru site-ul afacerii tale, pe baza a ce am vorbit la telefon.']
    ]);
    S.getRange(1, 1, 1, 2).setFontWeight('bold'); S.setColumnWidth(1, 240); S.setColumnWidth(2, 520);
  }
  var P = ss.getSheetByName(SH.pk) || ss.insertSheet(SH.pk);
  if (P.getLastRow() < 2) {
    P.getRange(1, 1, 4, 4).setValues([
      ['Pachet', 'Preț (lei)', 'Ce include (separat cu ;)', 'Termen'],
      ['Start', 990, 'O pagină cu design de la zero; Gândit pentru telefon; Formular de contact și buton de apel; Texte scrise pentru Google; Demo gratuit înainte de plată', '7–10 zile'],
      ['Business', 2490, 'Până la 5 pagini; Design animat / 3D; Programări sau comenzi online; Răspuns automat la cereri; Texte pentru Google pe fiecare pagină; Exclusivitate pe zonă 12 luni', '2–3 săptămâni'],
      ['Personalizat', 0, 'Stabilit după apel', 'După discuție']
    ]);
    P.getRange(1, 1, 1, 4).setFontWeight('bold'); P.setColumnWidth(3, 620);
  }
  var pv = SpreadsheetApp.newDataValidation().requireValueInRange(P.getRange('A2:A50'), true).setAllowInvalid(true).build();
  L.getRange(2, col_('Pachet'), 999, 1).setDataValidation(pv);
  ss.getSheetByName(SH.tot) || ss.insertSheet(SH.tot);

  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'daily') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('daily').timeBased().everyDays(1).atHour(9).create();
  totals();
  SpreadsheetApp.getActive().toast('Gata. Acum: Implementare → Aplicație web (vezi instrucțiunile din cod).', 'OHI', 10);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('OHI')
    .addItem('Trimite oferta pentru rândul selectat', 'sendOfferSelected')
    .addItem('Previzualizează oferta (PDF în Drive)', 'previewOfferSelected')
    .addSeparator()
    .addItem('Actualizează totalurile', 'totals')
    .addToUi();
}

/* ---------------------------------------------------------------- web app */
function doGet() { return json_({ ok: true, service: 'leads' }); }

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.company_site) return json_({ ok: true }); // honeypot: bots fill it, people don't see it
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var L = sheet_(SH.leads), S = settings_();
    var phone = clip_(p.phone, 30), email = clip_(p.email, 120).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) email = '';
    var dup = recentDuplicate_(L, phone, email);
    var id = clip_(p.request_id, 40) || ('OHI-' + Date.now().toString(36).toUpperCase());
    var row = {};
    row['Data'] = new Date(); row['Cod'] = id; row['Status'] = 'Nou';
    row['Nume'] = clip_(p.name, 80); row['Afacere'] = clip_(p.business, 120); row['Email'] = email; row['Telefon'] = phone;
    row['Serviciu'] = clip_(p.service, 80); row['Buget'] = clip_(p.budget, 60); row['Termen'] = clip_(p.deadline, 60);
    row['Ora pentru apel'] = clip_(p.call_time, 80); row['Despre afacere'] = clip_(p.message || p.about, 1500);
    row['Site / Facebook'] = clip_(p.website, 200); row['Sursă'] = clip_(p.src, 60) || 'direct';
    row['Campanie'] = clip_(p.campaign, 80); row['Pagina de intrare'] = clip_(p.landing, 200); row['Pagina formularului'] = clip_(p.page, 200);
    row['Reamintiri'] = 0;
    L.appendRow(COLS.map(function (c) { return row[c] === undefined ? '' : row[c]; }));
    if (!dup) {
      var who = row['Nume'] || row['Afacere'] || 'cineva';
      MailApp.sendEmail({ to: S['E-mail notificări'], subject: 'Cerere nouă: ' + (row['Afacere'] || who) + ' (' + row['Sursă'] + ')',
        htmlBody: '<p><b>' + esc_(who) + '</b> a trimis o cerere.</p>' + table_(row, ['Afacere', 'Email', 'Telefon', 'Serviciu', 'Buget', 'Termen', 'Ora pentru apel', 'Despre afacere', 'Site / Facebook', 'Sursă', 'Campanie', 'Pagina de intrare']) +
          '<p>Cod: ' + esc_(id) + '</p>', name: S['Nume afacere'] });
      if (email) {
        var link = S['Link programare apel (opțional)'];
        MailApp.sendEmail({ to: email, replyTo: S['E-mail notificări'], name: S['Nume afacere'],
          subject: 'Am primit cererea ta · ' + S['Nume afacere'],
          htmlBody: wrap_(S, '<p>Bună' + (row['Nume'] ? ', ' + esc_(first_(row['Nume'])) : '') + '!</p><p>' + esc_(S['Text confirmare']) + '</p>' +
            (link ? '<p><a href="' + esc_(link) + '" style="display:inline-block;background:#6D4DF2;color:#fff;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:600">Alege ora apelului</a></p>' : '') +
            '<p style="color:#666;font-size:13px">Codul cererii tale: ' + esc_(id) + '</p>') });
      }
    }
    return json_({ ok: true, id: id });
  } catch (err) {
    console.error(err); return json_({ ok: false });
  } finally { lock.releaseLock(); }
}

/* ---------------------------------------------------------------- offers */
function sendOfferSelected() { offerFor_(SpreadsheetApp.getActiveRange().getRow(), true); }
function previewOfferSelected() { offerFor_(SpreadsheetApp.getActiveRange().getRow(), false); }

function offerFor_(r, send) {
  var ui = SpreadsheetApp.getUi(), L = sheet_(SH.leads);
  if (SpreadsheetApp.getActiveSheet().getName() !== SH.leads || r < 2) { ui.alert('Selectează un rând din tabul „Leads”.'); return; }
  var row = rowObj_(L, r), S = settings_(), pk = packages_()[row['Pachet']];
  if (!pk) { ui.alert('Alege întâi un pachet în coloana „Pachet” (din tabul „Pachete”).'); return; }
  var price = Number(row['Preț ofertă (lei)']) || pk.price;
  if (!price) { ui.alert('Completează „Preț ofertă (lei)” pentru acest rând.'); return; }
  if (send && !row['Email']) { ui.alert('Rândul nu are e-mail. Adaugă-l în coloana „Email”.'); return; }
  var pdf = offerPdf_(row, pk, price, S);
  if (!send) { var f = DriveApp.createFile(pdf); ui.alert('Previzualizare salvată în Drive:\n' + f.getUrl()); return; }
  if (ui.alert('Trimit oferta de ' + fmt_(price) + ' lei către ' + row['Email'] + '?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  MailApp.sendEmail({ to: row['Email'], replyTo: S['E-mail notificări'], name: S['Nume afacere'], attachments: [pdf],
    subject: 'Oferta pentru ' + (row['Afacere'] || 'site-ul tău') + ' · ' + S['Nume afacere'],
    htmlBody: wrap_(S, '<p>Bună' + (row['Nume'] ? ', ' + esc_(first_(row['Nume'])) : '') + '!</p><p>' + esc_(S['Text ofertă (intro)']) + '</p>' +
      '<p><b>Pachet ' + esc_(row['Pachet']) + ': ' + fmt_(price) + ' lei</b>, termen ' + esc_(pk.term) + '. Detaliile sunt în PDF-ul atașat.</p>' +
      '<p>Dacă ai întrebări, răspunde direct la acest e-mail sau sună-ne la ' + esc_(S['Telefon']) + '.</p>') });
  set_(L, r, 'Preț ofertă (lei)', price); set_(L, r, 'Status', 'Ofertă trimisă'); set_(L, r, 'Ofertă trimisă la', new Date()); set_(L, r, 'Reamintiri', 0);
  SpreadsheetApp.getActive().toast('Oferta a fost trimisă.', 'OHI', 5);
}

function offerPdf_(row, pk, price, S) {
  var valid = new Date(Date.now() + (Number(S['Valabilitate ofertă (zile)']) || 14) * 864e5);
  var items = pk.items.split(';').map(function (x) { return x.trim(); }).filter(String).map(function (x) { return '<li>' + esc_(x) + '</li>'; }).join('');
  var html = '<html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#1d1d1f;font-size:12pt;line-height:1.5;margin:36px}' +
    'h1{font-size:24pt;margin:0 0 4px}h2{font-size:13pt;margin:26px 0 8px;color:#6D4DF2}.k{color:#777;font-size:10pt;text-transform:uppercase;letter-spacing:1px}' +
    '.price{font-size:22pt;font-weight:bold;margin:6px 0}table{border-collapse:collapse;width:100%}td{padding:6px 0;vertical-align:top}.mut{color:#666;font-size:10pt}</style></head><body>' +
    '<p class="k">' + esc_(S['Nume afacere']) + ' · Ofertă ' + esc_(row['Cod']) + '</p><h1>Site pentru ' + esc_(row['Afacere'] || row['Nume']) + '</h1>' +
    '<p class="mut">Emisă la ' + date_(new Date()) + ' · valabilă până la ' + date_(valid) + '</p>' +
    '<h2>Pachet ' + esc_(row['Pachet']) + '</h2><ul>' + items + '</ul>' +
    '<h2>Preț</h2><p class="price">' + fmt_(price) + ' lei</p><p>Plată unică, după ce aprobi demo-ul. Termen de realizare: ' + esc_(pk.term) + '.</p>' +
    (row['Note'] ? '<h2>Din discuția noastră</h2><p>' + esc_(row['Note']) + '</p>' : '') +
    '<h2>Pașii următori</h2><ol><li>Confirmi oferta prin e-mail.</li><li>Îți trimitem demo-ul cu numele și serviciile tale.</li><li>Facem ajustările împreună.</li><li>Semnăm contractul, plătești, iar site-ul pornește.</li></ol>' +
    '<p class="mut">' + esc_(S['Semnătură']) + ' · ' + esc_(S['Telefon']) + ' · ' + esc_(S['Site']) + '</p></body></html>';
  return Utilities.newBlob(html, 'text/html', 'oferta.html').getAs('application/pdf').setName('Oferta ' + (row['Afacere'] || row['Cod']) + '.pdf');
}

/* ---------------------------------------------------------------- daily */
function daily() { followUps(); totals(); }

function followUps() {
  var L = sheet_(SH.leads), S = settings_(), n = L.getLastRow(); if (n < 2) return;
  var d1 = Number(S['Reamintire 1 după (zile)']) || 3, d2 = Number(S['Reamintire 2 după (zile)']) || 7;
  for (var r = 2; r <= n; r++) {
    var row = rowObj_(L, r); if (row['Status'] !== 'Ofertă trimisă' || !row['Email'] || !(row['Ofertă trimisă la'] instanceof Date)) continue;
    var days = (Date.now() - row['Ofertă trimisă la'].getTime()) / 864e5, k = Number(row['Reamintiri']) || 0, txt = '';
    if (k === 0 && days >= d1) txt = 'Voiam doar să mă asigur că ai primit oferta pentru ' + esc_(row['Afacere'] || 'site-ul tău') + '. Dacă vrei să schimbăm ceva sau ai întrebări, răspunde la acest e-mail.';
    else if (k === 1 && days >= d2) txt = 'Îți scriu ultima dată despre oferta noastră, ca să nu te încarc cu mesaje. Dacă acum nu e momentul, e în regulă: o păstrăm pentru tine și poți reveni oricând.';
    if (!txt) continue;
    MailApp.sendEmail({ to: row['Email'], replyTo: S['E-mail notificări'], name: S['Nume afacere'],
      subject: 'Re: Oferta pentru ' + (row['Afacere'] || 'site-ul tău'), htmlBody: wrap_(S, '<p>Bună' + (row['Nume'] ? ', ' + esc_(first_(row['Nume'])) : '') + '!</p><p>' + txt + '</p>') });
    set_(L, r, 'Reamintiri', k + 1);
  }
}

function totals() {
  var L = sheet_(SH.leads), T = sheet_(SH.tot), n = L.getLastRow(), by = {}, months = {};
  if (n >= 2) L.getRange(2, 1, n - 1, COLS.length).getValues().forEach(function (v) {
    var o = {}; COLS.forEach(function (c, i) { o[c] = v[i]; });
    var s = o['Sursă'] || 'direct', won = o['Status'] === 'Câștigat', val = Number(o['Valoare câștigată (lei)']) || 0;
    by[s] = by[s] || [0, 0, 0, 0]; by[s][0]++; if (o['Status'] === 'Ofertă trimisă' || won) by[s][1]++; if (won) { by[s][2]++; by[s][3] += val; }
    var m = o['Data'] instanceof Date ? Utilities.formatDate(o['Data'], Session.getScriptTimeZone(), 'yyyy-MM') : '?';
    months[m] = months[m] || [0, 0, 0]; months[m][0]++; if (won) { months[m][1]++; months[m][2] += val; }
  });
  T.clear();
  var a = [['Sursă', 'Cereri', 'Oferte', 'Câștigate', 'Valoare (lei)']].concat(Object.keys(by).sort().map(function (k) { return [k].concat(by[k]); }));
  T.getRange(1, 1, a.length, 5).setValues(a); T.getRange(1, 1, 1, 5).setFontWeight('bold');
  var b = [['Lună', 'Cereri', 'Câștigate', 'Valoare (lei)']].concat(Object.keys(months).sort().reverse().map(function (k) { return [k].concat(months[k]); }));
  T.getRange(1, 7, b.length, 4).setValues(b); T.getRange(1, 7, 1, 4).setFontWeight('bold');
  T.getRange(a.length + 2, 1).setValue('Actualizat: ' + new Date().toLocaleString());
}

/* ---------------------------------------------------------------- helpers */
function sheet_(n) { return SpreadsheetApp.getActive().getSheetByName(n); }
function col_(c) { return COLS.indexOf(c) + 1; }
function set_(L, r, c, v) { L.getRange(r, col_(c)).setValue(v); }
function rowObj_(L, r) { var v = L.getRange(r, 1, 1, COLS.length).getValues()[0], o = {}; COLS.forEach(function (c, i) { o[c] = v[i]; }); return o; }
function settings_() { var o = {}; sheet_(SH.set).getDataRange().getValues().forEach(function (r) { if (r[0]) o[r[0]] = r[1]; }); return o; }
function packages_() { var o = {}; sheet_(SH.pk).getDataRange().getValues().slice(1).forEach(function (r) { if (r[0]) o[r[0]] = { price: Number(r[1]) || 0, items: String(r[2] || ''), term: String(r[3] || '') }; }); return o; }
function recentDuplicate_(L, phone, email) {
  var n = L.getLastRow(); if (n < 2) return false; var from = Math.max(2, n - 30);
  return L.getRange(from, 1, n - from + 1, COLS.length).getValues().some(function (v) {
    var t = v[0] instanceof Date ? v[0].getTime() : 0; if (Date.now() - t > 10 * 60 * 1000) return false;
    var bare = function (x) { return String(x || '').replace(/^'/, ''); };
    return (phone && bare(v[col_('Telefon') - 1]) === bare(phone)) || (email && String(v[col_('Email') - 1]) === email);
  });
}
function clip_(s, n) { return String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n).replace(/^[=+\-@]/, "'$&"); } // stops formula injection
function esc_(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function first_(s) { return String(s).split(' ')[0]; }
function fmt_(n) { return Number(n).toLocaleString('ro-RO'); }
function date_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd.MM.yyyy'); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function table_(o, keys) { return '<table style="border-collapse:collapse">' + keys.filter(function (k) { return o[k]; }).map(function (k) { return '<tr><td style="padding:4px 12px 4px 0;color:#666">' + k + '</td><td style="padding:4px 0">' + esc_(o[k]).replace(/\n/g, '<br>') + '</td></tr>'; }).join('') + '</table>'; }
function wrap_(S, inner) { return '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1d1d1f;max-width:560px">' + inner + '<p style="margin-top:24px">' + esc_(S['Semnătură']) + '<br><span style="color:#666">' + esc_(S['Telefon']) + ' · ' + esc_(S['Site']) + '</span></p></div>'; }
