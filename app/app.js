/* OHI client dashboard: clickable prototype.
   No real accounts or server yet: demo data from data.js, changes kept only in this browser. */
(function () {
  'use strict';
  var KEY = 'ohi-demo-v1';
  var demo = window.OHI_DEMO;
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  var load = function () { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  var S = load() || { logged: false, siteId: demo.sites[0].id, sites: copy(demo.sites), tickets: copy(demo.tickets), notes: {} };
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode: keep in memory */ } };
  var draft = null, filter = 'toate', tab = 'texte', device = 'desk', menuOpen = false;

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var site = function () { return S.sites.filter(function (x) { return x.id === S.siteId; })[0] || S.sites[0]; };
  var initials = function (n) { return n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); };
  var when = function (iso) {
    var d = new Date(iso), m = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return d.getDate() + ' ' + m[d.getMonth()] + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };
  var toast = function (t) { var old = $('.toast'); if (old) old.remove(); var d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); };

  var LOGO = '<svg viewBox="0 18 359 170" aria-hidden="true"><rect x="24" y="46" width="112" height="112" rx="30" fill="none" stroke="currentColor" stroke-width="26" transform="rotate(-10 80 102)"/><path d="M233.9 160V61h21.45v99ZM168.95 160V61h21.6v99ZM181.7 118.75v-17.7h60.75v17.7ZM277.4 160V61h22.05v99Z" fill="currentColor"/><circle cx="332.4" cy="150" r="13" fill="#FF6B1A"/></svg>';
  var I = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    inbox: '<path d="M4 4h16v16H4z"/><path d="M4 14h5l1 2h4l1-2h5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    plug: '<path d="M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5V14M12 17h.01"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    lang: '<path d="M4 5h9M8 3v2M6 5c0 4 3 7 6 8M11 5c-1 4-4 7-7 8"/><path d="M13 21l4-9 4 9M14.5 18h5"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'
  };
  var ic = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
  var STATUS = { nou: 'Nou', sunat: 'Sunat', oferta: 'Ofertă trimisă', client: 'Client', inchis: 'Închis' };
  var SITE_ST = { live: 'Online', preview: 'Gata de aprobat', progress: 'În lucru' };
  var ROUTES = [
    ['acasa', 'Acasă', 'home'], ['cereri', 'Cereri', 'inbox'], ['site', 'Site-ul meu', 'edit'], ['functii', 'Funcții', 'plug'],
    ['gazduire', 'Domeniu și găzduire', 'globe', 1], ['facturi', 'Plan și facturi', 'card', 1], ['ajutor', 'Ajutor', 'help']
  ];
  var route = function () { var r = (location.hash || '').replace(/^#\/?/, ''); return ROUTES.some(function (x) { return x[0] === r; }) ? r : 'acasa'; };

  /* ---------- login ---------- */
  function login() {
    document.title = 'Conectare | OHI';
    $('#app').innerHTML =
      '<div class="lg"><aside class="lg-side"><a class="logo" href="/">' + LOGO + '</a>' +
      '<div><h2>Site-ul tău, <em>într-un singur loc.</em></h2><p>Vezi cererile clienților, schimbă textele și prețurile, pornește funcții noi. Noi ne ocupăm de găzduire, siguranță și actualizări.</p></div>' +
      '<p style="font-size:13px">© 2026 OHI Solutions</p></aside>' +
      '<main class="lg-main"><form class="lg-box" id="lf" novalidate><h1>Intră în cont</h1><p>Îți trimitem un link de conectare pe e-mail. Fără parole de ținut minte.</p>' +
      '<label class="fl"><span>E-mail</span><input class="in" type="email" name="email" autocomplete="email" required placeholder="nume@firma.ro"></label>' +
      '<button class="bt bt-p bt-w" type="submit">Trimite linkul de conectare</button>' +
      '<span class="demo-tag">Demo: apasă butonul și intri direct, cu date inventate.</span></form></main></div>';
    $('#lf').addEventListener('submit', function (e) { e.preventDefault(); S.logged = true; save(); location.hash = '#/acasa'; render(); toast('Bine ai venit, ' + demo.user.name + '!'); });
  }

  /* ---------- shell ---------- */
  function switcher() {
    var s = site();
    return '<div class="sw"><button class="sw-b" type="button" aria-haspopup="true" aria-expanded="' + menuOpen + '" data-act="menu"><span class="av">' + initials(s.name) + '</span><span><b>' + esc(s.name) + '</b><small>' + esc(s.domain) + '</small></span><i>▾</i></button>' +
      (menuOpen ? '<div class="sw-m" role="menu">' + S.sites.map(function (x) {
        return '<button type="button" role="menuitem" data-site="' + x.id + '" aria-current="' + (x.id === s.id) + '"><span class="av">' + initials(x.name) + '</span><span>' + esc(x.name) + '<small>' + SITE_ST[x.status] + '</small></span></button>';
      }).join('') + '<button type="button" class="sw-add" data-act="newclient">+ Client nou</button></div>' : '') + '</div>';
  }
  function shell(r, html) {
    var newLeads = site().leads.filter(function (l) { return l.status === 'nou'; }).length;
    var nav = ROUTES.map(function (x) {
      return '<a href="#/' + x[0] + '"' + (x[3] ? ' class="more"' : '') + (x[0] === r ? ' aria-current="page"' : '') + '>' + ic(x[2]) + '<span class="lbl">' + (x[0] === 'site' ? 'Site' : x[1].split(' ')[0]) + '</span>' +
        (x[0] === 'cereri' && newLeads ? '<span class="cnt">' + newLeads + '</span>' : '') + '</a>';
    }).join('');
    $('#app').innerHTML =
      '<div class="sh"><aside class="sb"><a class="logo" href="#/acasa" aria-label="OHI, acasă">' + LOGO + '</a>' + switcher() +
      '<nav class="nv" aria-label="Meniu">' + nav + '</nav>' +
      '<div class="sb-ft"><span class="av">' + initials(demo.user.name) + '</span><span>' + esc(demo.user.name) + '<small>Cont Studio</small></span><button type="button" data-act="logout">Ieși</button></div></aside>' +
      '<div><header class="mh"><a class="logo" href="#/acasa" aria-label="OHI">' + LOGO + '</a>' + switcher() + '</header>' +
      '<main class="mn" id="main"><div class="banner"><b>Demo</b> Datele sunt inventate și nimic nu se trimite. Așa va arăta contul clienților tăi.</div>' + html + '</main></div></div>';
    // desktop labels: full names
    $$('.sb .nv a').forEach(function (a, i) { var l = a.querySelector('.lbl'); if (window.innerWidth > 760) l.textContent = ROUTES[i][1]; });
  }

  /* ---------- pages ---------- */
  function pageHome() {
    var s = site(), nl = s.leads.filter(function (l) { return l.status === 'nou'; }), on = Object.keys(s.addons).filter(function (k) { return s.addons[k]; }).length;
    var max = Math.max.apply(null, s.visits.concat([1]));
    var spark = s.visits.map(function (v) { return '<i style="height:' + Math.max(6, Math.round(v / max * 100)) + '%"></i>'; }).join('');
    var latest = s.leads.slice(0, 3).map(leadRow).join('') || '<p class="empty">Încă nu ai cereri. Când cineva completează un formular pe site, apare aici.</p>';
    return '<div class="tb"><div><h1>Bună, ' + esc(demo.user.name) + '</h1><p>' + (nl.length ? 'Ai ' + nl.length + ' ' + (nl.length === 1 ? 'cerere nouă' : 'cereri noi') + ' de la clienți.' : 'Totul e la zi.') + '</p></div>' +
      '<div class="tb-a"><a class="bt bt-s" href="#/site">' + ic('edit') + 'Editează site-ul</a></div></div>' +
      '<div class="g g-main"><div class="g">' +
        '<section class="cd site-cd"><div class="thumb"><iframe src="/app/site.html" title="Previzualizare ' + esc(s.name) + '" tabindex="-1" data-pv></iframe></div>' +
        '<div><span class="st ' + s.status + '">' + SITE_ST[s.status] + '</span><h2>' + esc(s.name) + '</h2><p class="dom">' + esc(s.domain) + ' · șablon ' + esc(s.template) + '</p>' +
        '<div class="tb-a">' + (s.status === 'preview' ? '<button class="bt bt-p" type="button" data-act="approve">Aprobă și publică</button>' : '') +
        '<a class="bt bt-s" href="/app/site.html" target="_blank" rel="noopener" data-act="open">' + ic('ext') + 'Vezi site-ul</a></div></div></section>' +
        '<section class="cd"><div class="tb" style="margin:0 0 6px;align-items:center"><h2>Ultimele cereri</h2><a class="bt bt-g" href="#/cereri">Toate →</a></div><div class="ll">' + latest + '</div></section>' +
      '</div><div class="g">' +
        '<section class="cd kpi"><b>' + s.visits.reduce(function (a, b) { return a + b; }, 0) + '</b><span>vizite în ultimele 7 zile</span><div class="spark" aria-hidden="true">' + spark + '</div></section>' +
        '<section class="cd"><h2>Schimbări rapide</h2><p class="sub">Cele mai folosite, la un click.</p><div class="qa">' +
          '<button type="button" data-go="site" data-tab="program">' + ic('clock') + '<span>Programul<span>Ore de lucru, zile libere</span></span><i>→</i></button>' +
          '<button type="button" data-go="site" data-tab="preturi">' + ic('tag') + '<span>Prețuri<span>Servicii și tarife</span></span><i>→</i></button>' +
          '<button type="button" data-go="site" data-tab="texte">' + ic('edit') + '<span>Texte<span>Titlu, descriere, despre</span></span><i>→</i></button>' +
        '</div></section>' +
        '<section class="cd"><h2>' + on + ' funcții active</h2><p class="sub">Formulare, programări, hartă și altele.</p><a class="bt bt-s" href="#/functii">' + ic('plug') + 'Vezi funcțiile</a></section>' +
      '</div></div>';
  }
  function leadRow(l) {
    return '<button type="button" class="lr" data-lead="' + l.id + '"><span class="lr-top"><span class="st ' + l.status + '">' + STATUS[l.status] + '</span><b>' + esc(l.name) + '</b></span><small>' + when(l.when) + '</small><p>' + esc(l.what) + '</p></button>';
  }
  function pageLeads() {
    var s = site(), list = s.leads.filter(function (l) { return filter === 'toate' || l.status === filter; });
    var counts = function (k) { return s.leads.filter(function (l) { return k === 'toate' || l.status === k; }).length; };
    return '<div class="tb"><div><h1>Cereri</h1><p>Tot ce trimit clienții prin formularele de pe site.</p></div></div>' +
      '<div class="flt" role="group" aria-label="Filtru">' + ['toate', 'nou', 'sunat', 'oferta', 'client', 'inchis'].map(function (k) {
        return '<button type="button" data-filter="' + k + '" aria-pressed="' + (filter === k) + '">' + (k === 'toate' ? 'Toate' : STATUS[k]) + ' · ' + counts(k) + '</button>';
      }).join('') + '</div>' +
      '<section class="cd"><div class="ll">' + (list.map(leadRow).join('') || '<p class="empty">Nicio cerere aici.</p>') + '</div></section>';
  }
  function openLead(id) {
    var s = site(), l = s.leads.filter(function (x) { return x.id === id; })[0]; if (!l) return;
    var wa = 'https://wa.me/4' + l.phone.replace(/\D/g, '');
    var bg = document.createElement('div'); bg.className = 'dw-bg';
    var d = document.createElement('aside'); d.className = 'dw'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Cererea ' + l.id);
    d.innerHTML = '<div class="dw-h"><div><small style="color:var(--mute)">' + esc(l.id) + ' · ' + esc(l.source) + '</small><h2>' + esc(l.name) + '</h2></div><button class="x" type="button" aria-label="Închide">×</button></div>' +
      '<p style="margin:0 0 18px;font-size:16px">' + esc(l.what) + '</p>' +
      '<dl class="dl"><dt>Telefon</dt><dd>' + esc(l.phone) + '</dd><dt>Primită</dt><dd>' + when(l.when) + '</dd></dl>' +
      '<div class="tb-a" style="margin:0 0 20px"><a class="bt bt-p" href="tel:' + esc(l.phone.replace(/\s/g, '')) + '">' + ic('phone') + 'Sună</a><a class="bt bt-s" href="' + esc(wa) + '" target="_blank" rel="noopener">WhatsApp</a></div>' +
      '<p style="font-size:13px;font-weight:600;margin:0 0 8px">Stare</p><div class="seg" role="group">' + Object.keys(STATUS).map(function (k) {
        return '<button type="button" data-st="' + k + '" aria-pressed="' + (l.status === k) + '">' + STATUS[k] + '</button>'; }).join('') + '</div>' +
      '<label class="fl"><span>Notițe <small>(le vezi doar tu)</small></span><textarea class="in" id="ln" placeholder="ex. A cerut programare vineri la 17:00">' + esc(S.notes[l.id] || '') + '</textarea></label>';
    var close = function () { bg.remove(); d.remove(); document.removeEventListener('keydown', key); render(); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    bg.addEventListener('click', close); d.querySelector('.x').addEventListener('click', close); document.addEventListener('keydown', key);
    d.addEventListener('click', function (e) { var b = e.target.closest('[data-st]'); if (!b) return; l.status = b.dataset.st; save(); $$('[data-st]', d).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); toast('Stare: ' + STATUS[l.status]); });
    d.querySelector('#ln').addEventListener('input', function (e) { S.notes[l.id] = e.target.value; save(); });
    document.body.appendChild(bg); document.body.appendChild(d); d.querySelector('.x').focus();
  }

  function pageSite() {
    var s = site(); if (!draft || draft.id !== s.id) draft = copy(s);
    var c = draft.content, T = [['texte', 'Texte'], ['preturi', 'Prețuri'], ['program', 'Program'], ['contact', 'Contact']];
    var listRows = function (key, a, b) {
      return '<div class="rows" data-list="' + key + '">' + c[key].map(function (r, i) {
        return '<div class="row2"><input class="in" data-row="' + key + '" data-i="' + i + '" data-j="0" value="' + esc(r[0]) + '" aria-label="' + a + '"><input class="in" data-row="' + key + '" data-i="' + i + '" data-j="1" value="' + esc(r[1]) + '" aria-label="' + b + '"><button type="button" class="rm" data-rm="' + key + '" data-i="' + i + '" aria-label="Șterge rândul">×</button></div>';
      }).join('') + '</div><button type="button" class="bt bt-s" data-add="' + key + '">+ Adaugă rând</button>';
    };
    var panel = {
      texte: '<label class="fl"><span>Titlul mare</span><input class="in" data-f="heroTitle" value="' + esc(c.heroTitle) + '" maxlength="80"></label>' +
        '<label class="fl"><span>Textul de sub titlu</span><textarea class="in" data-f="heroText" maxlength="200">' + esc(c.heroText) + '</textarea></label>' +
        '<label class="fl"><span>Despre noi</span><textarea class="in" data-f="about" maxlength="600">' + esc(c.about) + '</textarea></label>',
      preturi: listRows('prices', 'Serviciu', 'Preț'),
      program: listRows('hours', 'Zile', 'Ore'),
      contact: '<label class="fl"><span>Telefon</span><input class="in" data-f="phone" value="' + esc(c.phone) + '" inputmode="tel"></label>' +
        '<label class="fl"><span>Adresă</span><input class="in" data-f="address" value="' + esc(c.address) + '"></label>'
    }[tab];
    var dirty = JSON.stringify(draft.content) !== JSON.stringify(s.content);
    return '<div class="tb"><div><h1>Site-ul meu</h1><p>Schimbi conținutul, designul rămâne la fel. Vezi rezultatul în previzualizare, apoi publici.</p></div></div>' +
      '<div class="ed"><section class="cd"><div class="ed-tabs" role="tablist">' + T.map(function (t) {
        return '<button type="button" role="tab" data-tab2="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        '<div id="edp">' + panel + '</div>' +
        '<div class="save"' + (dirty ? '' : ' hidden') + ' id="sv"><span>Ai modificări nepublicate</span><button class="bt bt-g" type="button" data-act="discard">Renunță</button><button class="bt bt-p" type="button" data-act="publish">Publică</button></div></section>' +
      '<section class="pv" aria-label="Previzualizare"><div class="pv-bar"><b>Previzualizare</b>' + esc(s.domain) + '<div class="pv-dev" role="group"><button type="button" data-dev="desk" aria-pressed="' + (device === 'desk') + '">Calculator</button><button type="button" data-dev="mob" aria-pressed="' + (device === 'mob') + '">Telefon</button></div></div>' +
      '<div class="pv-fr' + (device === 'mob' ? ' mob' : '') + '"><iframe src="/app/site.html" title="Previzualizare site" data-pv="draft"></iframe></div></section></div>';
  }
  function updateDraftUI() {
    var s = site(), dirty = JSON.stringify(draft.content) !== JSON.stringify(s.content), sv = $('#sv'); if (sv) sv.hidden = !dirty;
    var f = $('[data-pv="draft"]'); if (f && f.contentWindow && f.contentWindow.renderSite) f.contentWindow.renderSite(draft);
  }

  var ADDONS = [
    ['form', 'form', 'Formular de cereri', 'Clienții îți scriu de pe site; cererile apar aici și pe e-mail.'],
    ['booking', 'cal', 'Programări online', 'Clienții aleg ziua și ora; tu confirmi din cont.'],
    ['prices', 'tag', 'Listă de prețuri sau meniu', 'Servicii, produse sau meniul, pe categorii.'],
    ['map', 'pin', 'Hartă și program', 'Adresa, harta și orele de lucru pe fiecare pagină.'],
    ['langs', 'lang', 'Trei limbi', 'Site-ul în română, maghiară și engleză.'],
    ['shop', 'bag', 'Magazin mic', 'Produse, coș și comenzi trimise către tine.'],
    ['ai', 'spark', 'Asistent pe site', 'Răspunde vizitatorilor din textele site-ului tău.', 1]
  ];
  function pageAddons() {
    var s = site();
    return '<div class="tb"><div><h1>Funcții</h1><p>Pornește sau oprește funcții pe site. Le facem noi, așa că nu strică nimic.</p></div></div>' +
      '<section class="cd"><div class="ao">' + ADDONS.map(function (a, i) {
        return (i ? '<hr style="border:0;border-top:1px solid var(--line);margin:0">' : '') + '<div class="ao-i"><span class="ao-ic">' + ic(a[1]) + '</span><div><h3>' + a[2] + '</h3><p>' + a[3] + '</p></div>' +
          (a[4] ? '<span class="soon">În curând</span>' : '<button type="button" class="tg" role="switch" aria-checked="' + !!s.addons[a[0]] + '" aria-label="' + a[2] + '" data-ao="' + a[0] + '"></button>') + '</div>';
      }).join('') + '</div></section>';
  }
  function pageHosting() {
    var s = site();
    return '<div class="tb"><div><h1>Domeniu și găzduire</h1><p>Site-ul tău e găzduit de OHI. Noi ne ocupăm de server, certificat și actualizări.</p></div></div>' +
      '<div class="g g2"><section class="cd"><h2>' + esc(s.domain) + '</h2><p class="sub">Adresa site-ului tău</p><ul class="chk"><li>Domeniu conectat</li><li>Conexiune sigură (HTTPS) activă</li><li>Ultima publicare: azi</li></ul></section>' +
      '<section class="cd"><h2>Ai nevoie de altceva?</h2><p class="sub">Schimbare de domeniu, adresă de e-mail pe domeniu sau mutarea unui site existent.</p><a class="bt bt-s" href="#/ajutor">Scrie-ne</a></section></div>';
  }
  function pageBilling() {
    var s = site();
    return '<div class="tb"><div><h1>Plan și facturi</h1><p>Ce plătești și ce e inclus.</p></div></div>' +
      '<div class="g g2" style="margin:0 0 16px"><section class="cd"><h2>Site ' + esc(s.plan) + '</h2><p class="sub">Plată unică, deja achitată</p><ul class="chk"><li>Site-ul și designul sunt ale tale</li><li>Contract de cesiune</li></ul></section>' +
      '<section class="cd"><h2>Plan lunar</h2><p class="sub">Contul, cererile, editarea și funcțiile. Prețul se stabilește la lansare.</p><span class="st preview">În pregătire</span></section></div>' +
      '<section class="cd"><h2>Facturi</h2><p class="sub">Descarci oricând factura în PDF.</p><table class="tbl"><thead><tr><th>Număr</th><th class="hide-m">Data</th><th>Ce</th><th>Sumă</th><th class="hide-m">Stare</th></tr></thead><tbody>' +
      demo.invoices.map(function (f) { return '<tr><td>' + esc(f.no) + '</td><td class="hide-m">' + esc(f.date) + '</td><td>' + esc(f.what) + '</td><td>' + esc(f.sum) + '</td><td class="hide-m ok">' + esc(f.status) + '</td></tr>'; }).join('') +
      '</tbody></table></section>';
  }
  function pageHelp() {
    return '<div class="tb"><div><h1>Ajutor</h1><p>Spune-ne ce vrei schimbat și ne ocupăm noi. Îți răspunde un om, de obicei în aceeași zi.</p></div></div>' +
      '<div class="g g2"><section class="cd"><h2>Cere o modificare</h2><p class="sub">ex. o pagină nouă, poze noi, un text de schimbat</p>' +
      '<form id="hf" novalidate><label class="fl"><span>Ce ai nevoie?</span><textarea class="in" name="t" maxlength="800" required></textarea></label><button class="bt bt-p" type="submit">Trimite</button></form></section>' +
      '<section class="cd"><h2>Cererile tale</h2><p class="sub">Starea modificărilor cerute</p><div class="ll">' + S.tickets.slice().reverse().map(function (t) {
        return '<div class="lr" style="cursor:default"><span class="lr-top"><b>' + esc(t.title) + '</b></span><small>' + esc(t.status) + '</small><p style="color:var(--mute)">' + esc(t.id) + ' · ' + esc(t.when) + '</p></div>';
      }).join('') + '</div></section></div>';
  }

  /* ---------- render + events ---------- */
  function render() {
    if (!S.logged) return login();
    var r = route(), titles = {}; ROUTES.forEach(function (x) { titles[x[0]] = x[1]; });
    document.title = titles[r] + ' · ' + site().name + ' | OHI';
    shell(r, { acasa: pageHome, cereri: pageLeads, site: pageSite, functii: pageAddons, gazduire: pageHosting, facturi: pageBilling, ajutor: pageHelp }[r]());
    $$('iframe[data-pv]').forEach(function (f) {
      var go = function () { try { if (f.contentWindow.renderSite) f.contentWindow.renderSite(f.dataset.pv === 'draft' ? draft : site()); } catch (e) { /* not ready */ } };
      f.addEventListener('load', go); go();
    });
    var m = $('#main'); if (m) m.focus && m.setAttribute('tabindex', '-1');
  }
  window.__ohiPreviewReady = function (w) { $$('iframe[data-pv]').forEach(function (f) { if (f.contentWindow === w) w.renderSite(f.dataset.pv === 'draft' ? draft : site()); }); };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act],[data-site],[data-lead],[data-filter],[data-go],[data-tab2],[data-dev],[data-ao],[data-add],[data-rm]');
    if (!t) { if (menuOpen && !e.target.closest('.sw')) { menuOpen = false; render(); } return; }
    var a = t.dataset.act;
    if (a === 'menu') { menuOpen = !menuOpen; render(); return; }
    if (a === 'logout') { S.logged = false; save(); menuOpen = false; location.hash = ''; render(); return; }
    if (a === 'newclient') { menuOpen = false; render(); toast('În platforma reală: inviți clientul pe e-mail și îi alegi șablonul.'); return; }
    if (a === 'approve') { site().status = 'live'; save(); render(); toast(site().domain + ' e acum online.'); return; }
    if (a === 'open') { e.preventDefault(); toast('În platforma reală se deschide ' + site().domain + '.'); return; }
    if (a === 'publish') { site().content = copy(draft.content); save(); render(); toast('Publicat pe ' + site().domain); return; }
    if (a === 'discard') { draft = null; render(); toast('Modificările au fost anulate.'); return; }
    if (t.dataset.site) { S.siteId = t.dataset.site; menuOpen = false; draft = null; filter = 'toate'; save(); render(); return; }
    if (t.dataset.lead) { openLead(t.dataset.lead); return; }
    if (t.dataset.filter) { filter = t.dataset.filter; render(); return; }
    if (t.dataset.go) { tab = t.dataset.tab || tab; location.hash = '#/' + t.dataset.go; return; }
    if (t.dataset.tab2) { tab = t.dataset.tab2; render(); return; }
    if (t.dataset.dev) { device = t.dataset.dev; render(); return; }
    if (t.dataset.ao) { var s = site(), k = t.dataset.ao; s.addons[k] = !s.addons[k]; if (draft && draft.id === s.id) draft.addons = copy(s.addons); save(); t.setAttribute('aria-checked', s.addons[k]); toast((s.addons[k] ? 'Pornit: ' : 'Oprit: ') + t.getAttribute('aria-label')); return; }
    if (t.dataset.add) { draft.content[t.dataset.add].push(['', '']); render(); var ins = $$('[data-row="' + t.dataset.add + '"]'); if (ins.length) ins[ins.length - 2].focus(); return; }
    if (t.dataset.rm) { draft.content[t.dataset.rm].splice(+t.dataset.i, 1); render(); return; }
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!draft) return;
    if (t.dataset.f) { draft.content[t.dataset.f] = t.value; updateDraftUI(); }
    if (t.dataset.row) { draft.content[t.dataset.row][+t.dataset.i][+t.dataset.j] = t.value; updateDraftUI(); }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'hf') return; e.preventDefault();
    var v = e.target.t.value.trim(); if (v.length < 3) { toast('Scrie pe scurt ce ai nevoie.'); return; }
    S.tickets.push({ id: 'T-' + (36 + S.tickets.length), title: v.slice(0, 80), when: new Date().toISOString().slice(0, 10), status: 'Primit' }); save(); render(); toast('Am primit cererea. Îți răspundem în curând.');
  });
  addEventListener('hashchange', function () { menuOpen = false; render(); window.scrollTo(0, 0); });
  addEventListener('resize', function () { $$('.sb .nv a').forEach(function (a, i) { var l = a.querySelector('.lbl'); l.textContent = window.innerWidth > 760 ? ROUTES[i][1] : (ROUTES[i][0] === 'site' ? 'Site' : ROUTES[i][1].split(' ')[0]); }); });
  render();
})();
