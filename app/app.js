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
  /* every site has a block model (made by the visual editor); quick edits are copied into it */
  var modelOf = function (x) {
    var src = x.model ? copy(x.model) : window.OHIModel.fromSite(x), c = x.content || {};
    var first = function (t) { return src.blocks.filter(function (b) { return b.type === t; })[0]; };
    var h = first('hero'), pr = first('prices'), ho = first('hours');
    if (h) { h.d.title = c.heroTitle; h.d.text = c.heroText; }
    if (pr) pr.d.items = copy(c.prices || []);
    if (ho) { ho.d.hours = copy(c.hours || []); ho.d.address = c.address; ho.d.phone = c.phone; }
    return src;
  };
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
    ['acasa', 'Acasă', 'home'], ['cereri', 'Cereri', 'inbox'], ['site', 'Site-ul meu', 'edit'], ['functii', 'Pluginuri', 'plug'],
    ['gazduire', 'Domeniu și găzduire', 'globe', 1], ['integrari', 'Integrări', 'link', 1], ['echipa', 'Echipă', 'users', 1], ['facturi', 'Plan și facturi', 'card', 1], ['ajutor', 'Ajutor', 'help']
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
        '<section class="cd site-cd"><div class="thumb"><iframe src="/app/render.html" title="Previzualizare ' + esc(s.name) + '" tabindex="-1" data-pv></iframe></div>' +
        '<div><span class="st ' + s.status + '">' + SITE_ST[s.status] + '</span><h2>' + esc(s.name) + '</h2><p class="dom">' + esc(s.domain) + ' · șablon ' + esc(s.template) + '</p>' +
        '<div class="tb-a">' + (s.status === 'preview' ? '<button class="bt bt-p" type="button" data-act="approve">Aprobă și publică</button>' : '') +
        '<a class="bt bt-p" href="/app/builder.html?site=' + encodeURIComponent(s.id) + '">' + ic('edit') + 'Editor vizual</a><a class="bt bt-s" href="/app/render.html?site=' + encodeURIComponent(s.id) + '" target="_blank" rel="noopener" data-act="openmodel">' + ic('ext') + 'Vezi site-ul</a></div></div></section>' +
        '<section class="cd"><div class="tb" style="margin:0 0 6px;align-items:center"><h2>Ultimele cereri</h2><a class="bt bt-g" href="#/cereri">Toate →</a></div><div class="ll">' + latest + '</div></section>' +
      '</div><div class="g">' +
        '<section class="cd kpi"><b>' + s.visits.reduce(function (a, b) { return a + b; }, 0) + '</b><span>vizite în ultimele 7 zile</span><div class="spark" aria-hidden="true">' + spark + '</div></section>' +
        '<section class="cd"><h2>Schimbări rapide</h2><p class="sub">Cele mai folosite, la un click.</p><div class="qa">' +
          '<button type="button" data-go="site" data-tab="program">' + ic('clock') + '<span>Programul<span>Ore de lucru, zile libere</span></span><i>→</i></button>' +
          '<button type="button" data-go="site" data-tab="preturi">' + ic('tag') + '<span>Prețuri<span>Servicii și tarife</span></span><i>→</i></button>' +
          '<button type="button" data-go="site" data-tab="texte">' + ic('edit') + '<span>Texte<span>Titlu, descriere, despre</span></span><i>→</i></button>' +
        '</div></section>' +
        '<section class="cd"><h2>Contul</h2><div class="qa">' +
          '<a href="#/gazduire">' + ic('globe') + '<span>Domeniu<span>Adresa site-ului, HTTPS</span></span><i>→</i></a>' +
          '<a href="#/integrari">' + ic('link') + '<span>Integrări<span>Google, e-mail, Make, Stripe</span></span><i>→</i></a>' +
          '<a href="#/echipa">' + ic('users') + '<span>Echipă<span>Cine are acces la cont</span></span><i>→</i></a>' +
          '<a href="#/facturi">' + ic('card') + '<span>Plan și facturi<span>Ce plătești</span></span><i>→</i></a>' +
        '</div></section>' +
        '<section class="cd"><h2>' + on + ' pluginuri active</h2><p class="sub">Formulare, programări, hartă și altele.</p><a class="bt bt-s" href="#/functii">' + ic('plug') + 'Vezi funcțiile</a></section>' +
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
    return '<div class="tb"><div><h1>Site-ul meu</h1><p>Schimbări rapide aici. Pentru design, secțiuni, culori și animații, deschide editorul vizual.</p></div><div class="tb-a"><a class="bt bt-p" href="/app/builder.html?site=' + encodeURIComponent(s.id) + '">' + ic('edit') + 'Deschide editorul vizual</a></div></div>' +
      '<div class="ed"><section class="cd"><div class="ed-tabs" role="tablist">' + T.map(function (t) {
        return '<button type="button" role="tab" data-tab2="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
        '<div id="edp">' + panel + '</div>' +
        '<div class="save"' + (dirty ? '' : ' hidden') + ' id="sv"><span>Ai modificări nepublicate</span><button class="bt bt-g" type="button" data-act="discard">Renunță</button><button class="bt bt-p" type="button" data-act="publish">Publică</button></div></section>' +
      '<section class="pv" aria-label="Previzualizare"><div class="pv-bar"><b>Previzualizare</b>' + esc(s.domain) + '<div class="pv-dev" role="group"><button type="button" data-dev="desk" aria-pressed="' + (device === 'desk') + '">Calculator</button><button type="button" data-dev="mob" aria-pressed="' + (device === 'mob') + '">Telefon</button></div></div>' +
      '<div class="pv-fr' + (device === 'mob' ? ' mob' : '') + '"><iframe src="/app/render.html" title="Previzualizare site" data-pv="draft"></iframe></div></section></div>';
  }
  function updateDraftUI() {
    var s = site(), dirty = JSON.stringify(draft.content) !== JSON.stringify(s.content), sv = $('#sv'); if (sv) sv.hidden = !dirty;
    var f = $('[data-pv="draft"]'); if (f && f.contentWindow && f.contentWindow.OHIRender) f.contentWindow.OHIRender.render(modelOf(draft), {});
  }

  /* plugins: each one is a feature OHI builds and maintains; some also add a section to the site */
  var PLUG = [
    ['Clienți', [
      ['form', 'form', 'Formular de cereri', 'Cererile apar în cont, pe e-mail și pe telefon.', 'Gratuit'],
      ['booking', 'cal', 'Programări online', 'Clienții aleg serviciul și ora; tu confirmi.', 'În plan', 'booking'],
      ['reviews', 'star', 'Recenzii Google', 'Cere recenzii după fiecare client și arată-le pe site.', 'În plan'],
      ['whatsapp', 'chat', 'WhatsApp', 'Buton de WhatsApp și cererile trimise pe WhatsApp.', 'Gratuit'],
      ['newsletter', 'mail', 'Newsletter', 'Strânge adrese de e-mail și trimite noutăți.', 'În plan']]],
    ['Vânzări și plăți', [
      ['payments', 'card', 'Plăți online', 'Avans sau plată integrală cu cardul, direct pe site.', 'Comision procesator', null, 1],
      ['shop', 'bag', 'Magazin', 'Produse, coș, livrare și comenzi.', 'În plan'],
      ['rates', 'calc', 'Calculator rate', 'Rata lunară orientativă și cerere de ofertă.', 'Gratuit', 'calc'],
      ['vouchers', 'tag', 'Vouchere cadou', 'Vinzi carduri cadou pe care clienții le folosesc la tine.', 'Curând', null, 0, 1]]],
    ['Conținut', [
      ['prices', 'tag', 'Prețuri sau meniu', 'Liste de prețuri, meniuri, pe categorii.', 'Gratuit'],
      ['map', 'pin', 'Hartă și program', 'Adresa, harta și orele de lucru.', 'Gratuit'],
      ['langs', 'lang', 'Trei limbi', 'Site-ul în română, maghiară și engleză.', 'În plan'],
      ['blog', 'edit', 'Noutăți (blog)', 'Articole scurte, bune și pentru Google.', 'În plan']]],
    ['Marketing', [
      ['seo', 'search', 'SEO local', 'Pagini și texte ca să te găsească lumea din oraș.', 'În plan'],
      ['gbp', 'pin', 'Profil Google', 'Program, poze și postări sincronizate cu Google.', 'Curând', null, 0, 1],
      ['stats', 'chart', 'Statistici', 'Vizite și cereri, fără cookie-uri de urmărire.', 'Gratuit']]],
    ['AI și automatizări', [
      ['aibuild', 'spark', 'Construiește cu AI', 'Descrii afacerea și primești site-ul gata făcut.', 'Gratuit'],
      ['ai', 'spark', 'Asistent pe site', 'Răspunde vizitatorilor din textele tale.', 'Curând', null, 0, 1],
      ['make', 'link', 'Make, Google Sheets, Calendar', 'Trimite cererile unde lucrezi deja.', 'În plan']]]
  ];
  var IC2 = { users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', chat: '<path d="M4 20l1.5-4A8 8 0 1 1 8 19z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>', search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>' };
  Object.keys(IC2).forEach(function (k) { I[k] = IC2[k]; });
  var plugQ = '', plugCat = 'Toate';
  function pageAddons() {
    var s = site(), on = function (k) { return !!s.addons[k]; };
    var cats = ['Toate', 'Instalate'].concat(PLUG.map(function (c) { return c[0]; }));
    var list = [];
    PLUG.forEach(function (c) { c[1].forEach(function (p) { list.push({ cat: c[0], p: p }); }); });
    list = list.filter(function (x) { return (plugCat === 'Toate' || (plugCat === 'Instalate' ? on(x.p[0]) : x.cat === plugCat)) && (!plugQ || (x.p[2] + ' ' + x.p[3]).toLowerCase().indexOf(plugQ.toLowerCase()) > -1); });
    var card = function (x) {
      var p = x.p, inst = on(p[0]), soon = p[7];
      return '<div class="pg' + (inst ? ' on' : '') + '"><div class="pg-h"><span class="ao-ic">' + ic(p[1]) + '</span><div><h3>' + esc(p[2]) + '</h3><small>' + esc(x.cat) + ' · ' + esc(p[4]) + '</small></div></div><p>' + esc(p[3]) + '</p><div class="pg-a">' +
        (soon ? '<span class="soon" style="margin:0">În curând</span>' : inst ? '<span class="st live">Instalat</span>' + (p[6] ? '<button class="bt bt-s" type="button" data-plset="' + p[0] + '">Setări</button>' : '') + '<button class="bt bt-g" type="button" data-plug="' + p[0] + '">Dezinstalează</button>' : '<button class="bt bt-p" type="button" data-plug="' + p[0] + '">Instalează</button>') + '</div></div>';
    };
    return '<div class="tb"><div><h1>Pluginuri</h1><p>Funcții noi pentru site, instalate cu un click. Le facem și le întreținem noi, așa că nu strică nimic.</p></div></div>' +
      '<div class="pg-bar"><input class="in" type="search" placeholder="Caută: plăți, recenzii, WhatsApp…" value="' + esc(plugQ) + '" data-plq aria-label="Caută pluginuri"><div class="flt" role="group" aria-label="Categorii">' + cats.map(function (c) { return '<button type="button" data-plcat="' + esc(c) + '" aria-pressed="' + (plugCat === c) + '">' + esc(c) + '</button>'; }).join('') + '</div></div>' +
      '<div class="pg-grid">' + (list.map(card).join('') || '<p class="empty">Niciun plugin găsit.</p>') + '</div>';
  }
  function plugToggle(k) {
    var s = site(), was = !!s.addons[k], meta; PLUG.forEach(function (c) { c[1].forEach(function (p) { if (p[0] === k) meta = p; }); });
    s.addons[k] = !was;
    var bt = meta && meta[5];
    if (bt) {
      var m = s.model || window.OHIModel.fromSite(s), ex = m.blocks.filter(function (b) { return b.type === bt; })[0];
      if (!was && !ex) m.blocks.splice(Math.max(1, m.blocks.length - 2), 0, window.OHIModel.block(bt, {}, { bg: 'surface', align: 'center' }));
      else if (ex) ex.hidden = was;
      s.model = m;
    }
    if (draft && draft.id === s.id) draft.addons = copy(s.addons);
    save(); render(); toast((was ? 'Dezinstalat: ' : 'Instalat: ') + meta[2] + (bt && !was ? ' · am adăugat și secțiunea pe site' : ''));
    if (!was && meta[6]) plugSettings(k);
  }
  function plugSettings(k) {
    var s = site(); s.pay = s.pay || { provider: 'stripe', mode: 'test', deposit: '30', currency: 'RON' };
    var P = s.pay, bg = document.createElement('div'); bg.className = 'dw-bg';
    var d = document.createElement('aside'); d.className = 'dw'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Setări plăți');
    var opt = function (v, l, cur) { return '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + l + '</option>'; };
    d.innerHTML = '<div class="dw-h"><div><small style="color:var(--mute)">Plugin</small><h2>Plăți online</h2></div><button class="x" type="button" aria-label="Închide">×</button></div>' +
      '<p style="margin:0 0 18px;color:var(--mute)">Banii ajung direct în contul firmei tale, prin procesatorul ales. OHI nu atinge banii și nu vede datele cardului.</p>' +
      '<label class="fl"><span>Procesator de plăți</span><select class="in" data-pay="provider">' + opt('stripe', 'Stripe', P.provider) + opt('netopia', 'NETOPIA Payments', P.provider) + opt('transfer', 'Doar transfer bancar (fără card)', P.provider) + '</select></label>' +
      '<label class="fl"><span>Ce plătește clientul online</span><select class="in" data-pay="deposit">' + opt('30', 'Avans 30%', P.deposit) + opt('50', 'Avans 50%', P.deposit) + opt('100', 'Tot prețul', P.deposit) + '</select></label>' +
      '<label class="fl"><span>Monedă</span><select class="in" data-pay="currency">' + opt('RON', 'Lei (RON)', P.currency) + opt('EUR', 'Euro (EUR)', P.currency) + '</select></label>' +
      '<div class="tgl" style="display:flex;align-items:center;justify-content:space-between;margin:6px 0 18px"><span><b>Mod de test</b><br><small style="color:var(--mute)">Plăți de probă, fără bani reali</small></span><button type="button" class="tg" role="switch" aria-checked="' + (P.mode === 'test') + '" data-paytest aria-label="Mod de test"></button></div>' +
      '<div class="banner" style="margin:0 0 16px">Pentru plăți reale conectezi contul firmei la procesator. Comisioanele le stabilește procesatorul.</div>' +
      '<button class="bt bt-p bt-w" type="button" data-payconnect>Conectează contul ' + (P.provider === 'netopia' ? 'NETOPIA' : P.provider === 'transfer' ? 'bancar' : 'Stripe') + '</button>';
    var close = function () { bg.remove(); d.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    bg.addEventListener('click', close); d.querySelector('.x').addEventListener('click', close); document.addEventListener('keydown', key);
    d.addEventListener('change', function (e) { var t = e.target; if (t.dataset.pay) { P[t.dataset.pay] = t.value; save(); d.querySelector('[data-payconnect]').textContent = 'Conectează contul ' + (P.provider === 'netopia' ? 'NETOPIA' : P.provider === 'transfer' ? 'bancar' : 'Stripe'); } });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-paytest]')) { P.mode = P.mode === 'test' ? 'live' : 'test'; save(); e.target.closest('[data-paytest]').setAttribute('aria-checked', P.mode === 'test'); toast(P.mode === 'test' ? 'Mod de test pornit' : 'Mod de test oprit'); }
      if (e.target.closest('[data-payconnect]')) toast('În platforma reală se deschide pagina procesatorului, unde firma își conectează contul.');
    });
    document.body.appendChild(bg); document.body.appendChild(d); d.querySelector('.x').focus();
  }

  /* domains: the client keeps their own domain; OHI hosts the site and the certificate */
  function pageHosting() {
    var s = site(); s.domains = s.domains || [{ name: s.domain, status: s.status === 'live' ? 'ok' : 'wait', main: true }, { name: 'www.' + s.domain, status: s.status === 'live' ? 'ok' : 'wait', redirect: s.domain }];
    var row = function (d, i) {
      return '<tr><td><b>' + esc(d.name) + '</b>' + (d.main ? ' <span class="st" style="margin-left:6px">Principal</span>' : '') + (d.redirect ? '<br><small style="color:var(--mute)">trimite către ' + esc(d.redirect) + '</small>' : '') + '</td>' +
        '<td>' + (d.status === 'ok' ? '<span class="st live">Conectat · HTTPS activ</span>' : d.status === 'check' ? '<span class="st progress">Se verifică</span>' : '<span class="st preview">Așteaptă setările DNS</span>') + '</td>' +
        '<td style="text-align:right">' + (d.status !== 'ok' ? '<button class="bt bt-s" type="button" data-dns="' + i + '">Instrucțiuni</button> ' : '') + (d.main ? '' : '<button class="bt bt-g" type="button" data-rmdom="' + i + '">Scoate</button>') + '</td></tr>';
    };
    return '<div class="tb"><div><h1>Domeniu și găzduire</h1><p>Domeniul rămâne al tău. Noi găzduim site-ul, certificatul HTTPS și actualizările.</p></div><div class="tb-a"><button class="bt bt-p" type="button" data-act="adddom">+ Conectează un domeniu</button></div></div>' +
      '<section class="cd" style="margin:0 0 16px"><h2>Domeniile tale</h2><p class="sub">Poți avea mai multe adrese; una e principală, celelalte trimit către ea.</p><table class="tbl"><thead><tr><th>Domeniu</th><th>Stare</th><th></th></tr></thead><tbody>' + s.domains.map(row).join('') + '</tbody></table></section>' +
      '<div class="g g3"><section class="cd"><h2>Găzduire inclusă</h2><ul class="chk"><li>Certificat HTTPS automat</li><li>Site rapid, servit din rețea globală</li><li>Protecție anti-atac inclusă</li></ul></section>' +
      '<section class="cd"><h2>Adresă de test</h2><p class="sub">Merge și fără domeniu, cât lucrăm la site.</p><p style="margin:0;font-weight:600">' + esc(s.id) + '.ohi.ro</p><small style="color:var(--mute)">exemplu de adresă, de stabilit</small></section>' +
      '<section class="cd"><h2>Nu ai domeniu?</h2><p class="sub">Te ajutăm să cumperi unul pe numele firmei tale, ca să rămână al tău.</p><a class="bt bt-s" href="#/ajutor">Scrie-ne</a></section></div>';
  }
  function domainDialog(i) {
    var s = site(), isNew = i === undefined, d = isNew ? null : s.domains[i];
    var bg = document.createElement('div'); bg.className = 'dw-bg';
    var w = document.createElement('aside'); w.className = 'dw'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', 'Conectează domeniul');
    var step2 = function (name) {
      return '<p style="margin:0 0 14px">Intră în contul unde ai cumpărat <b>' + esc(name) + '</b> (de ex. ROTLD, GoDaddy, Namecheap) și schimbă <b>serverele de nume</b> cu acestea:</p>' +
        '<table class="tbl" style="margin:0 0 14px"><thead><tr><th>Server de nume</th></tr></thead><tbody><tr><td><code>ns1.vercel-dns.com</code></td></tr><tr><td><code>ns2.vercel-dns.com</code></td></tr></tbody></table>' +
        '<p style="margin:0 0 18px;color:var(--mute);font-size:13.5px">Dacă nu poți schimba serverele de nume, îți arătăm înregistrările DNS exacte pentru domeniul tău după ce îl adaugi. Schimbarea poate dura până la 48 de ore; noi verificăm singuri și îți scriem când e gata.</p>' +
        '<button class="bt bt-p bt-w" type="button" data-domcheck>Am făcut setările, verifică</button>';
    };
    w.innerHTML = '<div class="dw-h"><div><small style="color:var(--mute)">Domeniu</small><h2>' + (isNew ? 'Conectează un domeniu' : esc(d.name)) + '</h2></div><button class="x" type="button" aria-label="Închide">×</button></div><div id="dstep">' +
      (isNew ? '<label class="fl"><span>Domeniul tău</span><input class="in" id="dname" placeholder="firmata.ro" autocomplete="off" spellcheck="false"></label><button class="bt bt-p bt-w" type="button" data-domadd>Continuă</button>' : step2(d.name)) + '</div>';
    var close = function () { bg.remove(); w.remove(); document.removeEventListener('keydown', key); render(); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    bg.addEventListener('click', close); w.querySelector('.x').addEventListener('click', close); document.addEventListener('keydown', key);
    w.addEventListener('click', function (e) {
      if (e.target.closest('[data-domadd]')) {
        var v = w.querySelector('#dname').value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(v)) { toast('Scrie domeniul așa: firmata.ro'); return; }
        s.domains.push({ name: v, status: 'wait', redirect: s.domains[0].name }); i = s.domains.length - 1; save(); w.querySelector('#dstep').innerHTML = step2(v);
      }
      if (e.target.closest('[data-domcheck]')) {
        var dd = s.domains[i]; dd.status = 'check'; save(); var b = e.target.closest('[data-domcheck]'); b.disabled = true; b.textContent = 'Se verifică…';
        setTimeout(function () { dd.status = 'ok'; save(); toast(dd.name + ' e conectat, cu HTTPS (demo)'); close(); }, 1600);
      }
    });
    document.body.appendChild(bg); document.body.appendChild(w); (w.querySelector('#dname') || w.querySelector('.x')).focus();
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

  /* ---------- new site from a template ---------- */
  function newSiteDialog() {
    var M = window.OHIModel, ov = document.createElement('div'); ov.className = 'dw-bg nsd-bg';
    var w = document.createElement('div'); w.className = 'nsd'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-label', 'Site nou');
    var pick = M.TEMPLATES[0].id;
    var cards = function () { return M.TEMPLATES.map(function (t) {
      var pal = M.PALETTES.filter(function (p) { return p.id === t.pal; })[0].colors;
      return '<button type="button" class="tpl" data-tpl="' + t.id + '" aria-pressed="' + (pick === t.id) + '"><i style="background:' + pal.bg + '"><span style="background:' + pal.accent + '"></span><span style="background:' + pal.surface + '"></span><span style="background:' + pal.dark + '"></span></i><b>' + esc(t.name) + '</b><small>' + esc(t.desc) + '</small></button>'; }).join(''); };
    w.innerHTML = '<div class="dw-h"><div><small style="color:var(--mute)">Site nou</small><h2>Pentru cine e site-ul?</h2></div><button class="x" type="button" aria-label="Închide">×</button></div>' +
      '<form id="nsf" novalidate><label class="fl"><span>Numele afacerii</span><input class="in" name="n" required maxlength="60" placeholder="ex. Salon Bianca"></label>' +
      '<div class="two-c"><label class="fl"><span>Orașul</span><input class="in" name="c" maxlength="40" placeholder="ex. Târgu Mureș"></label><label class="fl"><span>Telefon</span><input class="in" name="t" inputmode="tel" maxlength="20" placeholder="07xx xxx xxx"></label></div>' +
      '<span class="lbl2">Alege un șablon</span><div class="tpls" id="tpls">' + cards() + '</div>' +
      '<label class="fl" style="margin-top:14px"><span>Sau descrie-l cu cuvintele tale <em>(opțional, îl folosește AI-ul)</em></span><textarea class="in" name="d" maxlength="500" placeholder="ce faci, ce vrei să găsească clienții pe site"></textarea></label>' +
      '<button class="bt bt-p bt-w" type="submit">Creează site-ul</button><p class="note">Primești un site cu Acasă, Despre noi și Contact. Îl schimbi apoi cum vrei în editor.</p></form>';
    var close = function () { ov.remove(); w.remove(); document.removeEventListener('keydown', key); };
    var key = function (e) { if (e.key === 'Escape') close(); };
    ov.addEventListener('click', close); w.querySelector('.x').addEventListener('click', close); document.addEventListener('keydown', key);
    w.addEventListener('click', function (e) { var b = e.target.closest('[data-tpl]'); if (!b) return; pick = b.dataset.tpl; $$('[data-tpl]', w).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
    w.querySelector('#nsf').addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target, name = f.n.value.trim(), city = f.c.value.trim(), tel = f.t.value.trim();
      if (name.length < 2) { f.n.classList.add('err'); f.n.focus(); toast('Scrie numele afacerii.'); return; }
      var T = M.TEMPLATES.filter(function (x) { return x.id === pick; })[0];
      var prompt = (f.d.value.trim() ? f.d.value.trim() + '. ' : '') + T.prompt.replace(/„[^”]*”/, '„' + name + '”').replace(/ din [A-ZĂÂÎȘȚ][^,]*/, '') + (city ? ' din ' + city : '') + (tel ? ', telefon ' + tel : '');
      var m = M.generate(prompt, true); m.brand.name = name;
      m.blocks.forEach(function (b) { if (b.type === 'nav') b.d.logo = name; if (b.type === 'footer') { b.d.name = name; b.d.line = city; } });
      var hero = m.blocks.filter(function (b) { return b.type === 'hero'; })[0], hrs = m.blocks.filter(function (b) { return b.type === 'hours'; })[0], pr = m.blocks.filter(function (b) { return b.type === 'prices'; })[0];
      var id = M.slugify(name), n = 2; while (S.sites.some(function (x) { return x.id === id; })) id = M.slugify(name) + '-' + n++;
      var nsite = { id: id, name: name, type: T.name, domain: 'domeniul-tau.ro', status: 'progress', plan: 'Start', template: T.name, since: new Date().toISOString().slice(0, 10),
        content: { heroTitle: hero.d.title, heroText: hero.d.text, about: '', phone: tel || hrs.d.phone, address: hrs.d.address, hours: hrs.d.hours, prices: pr.d.items },
        leads: [], visits: [0, 0, 0, 0, 0, 0, 0], addons: { form: true, booking: m.blocks.some(function (b) { return b.type === 'booking'; }), prices: true, map: true }, domains: [], model: m };
      S.sites.push(nsite); S.siteId = id; save(); close(); location.hash = '#/acasa'; render(); toast('Site-ul „' + name + '” e gata de editat.');
    });
    document.body.appendChild(ov); document.body.appendChild(w); w.querySelector('[name=n]').focus();
  }

  /* ---------- integrations ---------- */
  function pageIntegrations() {
    var s = site(), g = s.integrations = s.integrations || { notify: true, email: demo.user.email, hook: '', gcal: 'off', stripe: 'off', gsv: '' };
    var card = function (icon, title, sub, body, badge) { return '<section class="cd ig"><div class="ig-h"><span class="ig-i">' + ic(icon) + '</span><div><h2>' + title + '</h2><p class="sub">' + sub + '</p></div>' + (badge || '') + '</div>' + body + '</section>'; };
    var conn = function (st) { return st === 'on' ? '<span class="st live">Conectat</span>' : st === 'wait' ? '<span class="st preview">Așteaptă aprobarea</span>' : ''; };
    return '<div class="tb"><div><h1>Integrări</h1><p>Leagă site-ul de aplicațiile cu care lucrezi deja. Nu îți cerem niciodată parola: te conectezi direct la Google sau Stripe și poți retrage accesul oricând.</p></div></div>' +
      '<div class="g g2">' +
      card('mail', 'Cereri pe e-mail', 'Fiecare cerere de pe site îți vine și pe e-mail. Când dai Răspunde, scrii direct clientului.',
        '<div class="tgl2"><span>Trimite-mi cererile pe e-mail</span><button class="tg" role="switch" aria-checked="' + !!g.notify + '" data-ig="notify" aria-label="Cereri pe e-mail"></button></div>' +
        (g.notify ? '<label class="fl"><span>Adresa</span><input class="in" type="email" data-igf="email" value="' + esc(g.email) + '"></label>' : ''), '<span class="st live">Fără conectare</span>') +
      card('cal', 'Google Calendar', 'Programările de pe site intră direct în calendarul tău, iar orele ocupate dispar din formular.',
        (g.gcal === 'on' ? '<p class="mini-t">Conectat la ' + esc(demo.user.email) + '. Calendarul: Programări.</p><button class="bt bt-g" type="button" data-igc="gcal">Deconectează</button>' : '<button class="bt bt-p" type="button" data-igc="gcal">Conectează Google</button>'), conn(g.gcal)) +
      card('link', 'Make, Zapier, n8n (webhook)', 'Trimite fiecare cerere unde vrei: Google Sheets, CRM, WhatsApp Business și altele.',
        '<label class="fl"><span>Adresa webhook</span><input class="in" data-igf="hook" value="' + esc(g.hook) + '" placeholder="https://hook.eu2.make.com/…" spellcheck="false"></label><button class="bt bt-s" type="button" data-igtest>Trimite o cerere de test</button>') +
      card('card', 'Stripe (plăți cu cardul)', 'Banii ajung direct în contul tău Stripe. OHI nu atinge banii și nu vede datele cardului.',
        (g.stripe === 'on' ? '<p class="mini-t">Cont Stripe conectat (mod de test).</p><button class="bt bt-g" type="button" data-igc="stripe">Deconectează</button>' : '<button class="bt bt-p" type="button" data-igc="stripe">Conectează Stripe</button>'), conn(g.stripe)) +
      card('search', 'Google Search Console', 'Vezi cum te găsesc oamenii în Google. Lipește codul de verificare din Search Console.',
        '<label class="fl"><span>Cod de verificare (meta)</span><input class="in" data-igf="gsv" value="' + esc(g.gsv) + '" placeholder="ex. AbC123…" spellcheck="false"></label><p class="mini-t">Sitemap-ul și pagina robots.txt le facem noi automat.</p>') +
      card('chart', 'Statistici OHI', 'Vizite, pagini văzute și de unde vin oamenii. Fără cookie-uri, deci fără banner obligatoriu pentru ele.',
        '<a class="bt bt-s" href="#/acasa">Vezi statisticile</a>', '<span class="st live">Inclus</span>') +
      '</div>' +
      '<section class="cd" style="margin-top:16px"><h2>În curând</h2><p class="sub">Google Analytics, Meta Pixel, Facebook și Instagram, Google Business Profile, facturare SmartBill și FGO. Le pornim pe rând, cu acordul vizitatorilor acolo unde legea o cere.</p></section>';
  }
  function igConnect(k) {
    var s = site(), g = s.integrations, names = { gcal: 'Google', stripe: 'Stripe' };
    if (g[k] === 'on') { g[k] = 'off'; save(); render(); toast('Deconectat de la ' + names[k] + '.'); return; }
    var ov = document.createElement('div'); ov.className = 'dw-bg nsd-bg'; var w = document.createElement('div'); w.className = 'nsd'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
    var what = k === 'gcal' ? ['Să vadă orele ocupate din calendarul tău', 'Să adauge programările făcute pe site'] : ['Să creeze plăți în contul tău Stripe', 'Să vadă dacă o plată a reușit (nu vede cardurile)'];
    w.innerHTML = '<div class="dw-h"><div><small style="color:var(--mute)">Demo</small><h2>Conectare ' + names[k] + '</h2></div><button class="x" type="button" aria-label="Închide">×</button></div>' +
      '<p>În platforma reală se deschide pagina oficială ' + names[k] + '. Acolo vezi exact ce poate face OHI și apeși „Permite”:</p><ul class="chk">' + what.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<p class="note">OHI nu primește niciodată parola ta. Accesul se poate retrage oricând, din contul ' + names[k] + ' sau de aici.</p><button class="bt bt-p bt-w" type="button" data-ok>Continuă (demo)</button>';
    var close = function () { ov.remove(); w.remove(); };
    ov.addEventListener('click', close); w.querySelector('.x').addEventListener('click', close);
    w.querySelector('[data-ok]').addEventListener('click', function () { g[k] = 'on'; save(); close(); render(); toast('Conectat la ' + names[k] + ' (demo).'); });
    document.body.appendChild(ov); document.body.appendChild(w); w.querySelector('[data-ok]').focus();
  }

  /* ---------- team ---------- */
  var ROLES = [['owner', 'Proprietar', 'Tot, inclusiv facturi, plăți și ștergerea site-ului.'], ['admin', 'Administrator', 'Tot, în afară de ștergerea contului. Poate porni pluginuri și conecta domenii.'], ['editor', 'Editor', 'Schimbă texte, poze și secțiuni; răspunde la cereri.'], ['viewer', 'Doar vizualizare', 'Vede site-ul și cererile, fără să schimbe ceva.']];
  function pageTeam() {
    var s = site(), team = s.team = s.team || [{ name: demo.user.name, email: demo.user.email, role: 'owner', you: true }];
    var rname = function (r) { return (ROLES.filter(function (x) { return x[0] === r; })[0] || [0, r])[1]; };
    return '<div class="tb"><div><h1>Echipă</h1><p>Cine are acces la contul ' + esc(s.name) + '. Fiecare intră cu e-mailul lui, fără parole împărțite.</p></div></div>' +
      '<div class="g g2"><section class="cd"><h2>Oameni</h2><table class="tbl team"><thead><tr><th>Persoana</th><th>Rol</th><th></th></tr></thead><tbody>' + team.map(function (m, i) {
        return '<tr><td><b>' + esc(m.name || m.email) + '</b>' + (m.you ? ' <span class="st">Tu</span>' : '') + '<br><small style="color:var(--mute)">' + esc(m.email) + (m.pending ? ' · invitație trimisă' : '') + '</small></td>' +
          '<td>' + (m.role === 'owner' ? rname(m.role) : '<select class="in sm" data-trole="' + i + '" aria-label="Rol">' + ROLES.slice(1).map(function (r) { return '<option value="' + r[0] + '"' + (m.role === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select>') + '</td>' +
          '<td style="text-align:right">' + (m.role === 'owner' ? '' : '<button class="bt bt-g" type="button" data-trm="' + i + '">Scoate</button>') + '</td></tr>'; }).join('') + '</tbody></table></section>' +
      '<section class="cd"><h2>Invită pe cineva</h2><form id="tf" novalidate><label class="fl"><span>E-mail</span><input class="in" type="email" name="e" required placeholder="coleg@firma.ro"></label>' +
      '<label class="fl"><span>Rol</span><select class="in" name="r">' + ROLES.slice(1).map(function (r) { return '<option value="' + r[0] + '"' + (r[0] === 'editor' ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select></label><button class="bt bt-p" type="submit">Trimite invitația</button></form>' +
      '<ul class="roles">' + ROLES.map(function (r) { return '<li><b>' + r[1] + '</b><span>' + r[2] + '</span></li>'; }).join('') + '</ul></section></div>';
  }

  /* ---------- render + events ---------- */
  function render() {
    if (!S.logged) return login();
    var r = route(), titles = {}; ROUTES.forEach(function (x) { titles[x[0]] = x[1]; });
    document.title = titles[r] + ' · ' + site().name + ' | OHI';
    shell(r, { acasa: pageHome, cereri: pageLeads, site: pageSite, functii: pageAddons, gazduire: pageHosting, facturi: pageBilling, ajutor: pageHelp, integrari: pageIntegrations, echipa: pageTeam }[r]());
    $$('iframe[data-pv]').forEach(function (f) {
      var go = function () { try { if (f.contentWindow.OHIRender) f.contentWindow.OHIRender.render(modelOf(f.dataset.pv === 'draft' ? draft : site()), {}); } catch (e) { /* not ready */ } };
      f.addEventListener('load', go); go();
    });
    var m = $('#main'); if (m) m.focus && m.setAttribute('tabindex', '-1');
  }
  window.__ohiRenderReady = function (w) { $$('iframe[data-pv]').forEach(function (f) { if (f.contentWindow === w) w.OHIRender.render(modelOf(f.dataset.pv === 'draft' ? draft : site()), {}); }); };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-ig],[data-igc],[data-igtest],[data-trm],[data-act],[data-site],[data-lead],[data-filter],[data-go],[data-tab2],[data-dev],[data-ao],[data-add],[data-rm],[data-plug],[data-plset],[data-plcat],[data-dns],[data-rmdom]');
    if (!t) { if (menuOpen && !e.target.closest('.sw')) { menuOpen = false; render(); } return; }
    var a = t.dataset.act;
    if (a === 'menu') { menuOpen = !menuOpen; render(); return; }
    if (a === 'logout') { S.logged = false; save(); menuOpen = false; location.hash = ''; render(); return; }
    if (a === 'newclient') { menuOpen = false; render(); newSiteDialog(); return; }
    if (a === 'approve') { site().status = 'live'; save(); render(); toast(site().domain + ' e acum online.'); return; }
    if (a === 'openmodel') { site().model = modelOf(site()); save(); return; }
    if (a === 'adddom') { domainDialog(); return; }
    if (t.dataset.ig) { var gi = site().integrations; gi[t.dataset.ig] = !gi[t.dataset.ig]; save(); render(); return; }
    if (t.dataset.igc) { igConnect(t.dataset.igc); return; }
    if (t.dataset.igtest !== undefined) { var hk = site().integrations.hook; toast(/^https:\/\/[^\s]+$/.test(hk) ? 'Demo: în platforma reală trimitem acum o cerere de test la adresa ta. Aici nu se trimite nimic.' : 'Pune întâi o adresă care începe cu https://'); return; }
    if (t.dataset.trm) { var tm = site().team, ti = +t.dataset.trm; confirmTeam(tm[ti], function () { tm.splice(ti, 1); save(); render(); toast('Accesul a fost retras.'); }); return; }
    if (t.dataset.plug) { plugToggle(t.dataset.plug); return; }
    if (t.dataset.plset) { plugSettings(t.dataset.plset); return; }
    if (t.dataset.plcat) { plugCat = t.dataset.plcat; render(); return; }
    if (t.dataset.dns) { domainDialog(+t.dataset.dns); return; }
    if (t.dataset.rmdom) { site().domains.splice(+t.dataset.rmdom, 1); save(); render(); toast('Domeniul a fost scos'); return; }
    if (a === 'open') { e.preventDefault(); toast('În platforma reală se deschide ' + site().domain + '.'); return; }
    if (a === 'publish') { site().content = copy(draft.content); site().model = modelOf(site()); save(); render(); toast('Publicat pe ' + site().domain); return; }
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
    var t = e.target;
    if (t.dataset.plq !== undefined) { plugQ = t.value; var pos = t.selectionStart; render(); var n = $('[data-plq]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
    if (!draft) return;
    if (t.dataset.f) { draft.content[t.dataset.f] = t.value; updateDraftUI(); }
    if (t.dataset.row) { draft.content[t.dataset.row][+t.dataset.i][+t.dataset.j] = t.value; updateDraftUI(); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.igf) { var v = t.value.trim(); if (t.dataset.igf === 'hook' && v && !/^https:\/\/[^\s]+$/.test(v)) { toast('Adresa trebuie să înceapă cu https://'); return; } site().integrations[t.dataset.igf] = v; save(); toast('Salvat'); return; }
    if (t.dataset.trole) { site().team[+t.dataset.trole].role = t.value; save(); toast('Rolul a fost schimbat.'); }
  });
  function confirmTeam(m, fn) { var b = document.createElement('div'); b.className = 'dw-bg nsd-bg'; var w = document.createElement('div'); w.className = 'nsd'; w.setAttribute('role', 'alertdialog'); w.setAttribute('aria-modal', 'true');
    w.innerHTML = '<h2>Scoți accesul pentru ' + esc(m.name || m.email) + '?</h2><p>Nu mai poate intra în cont. Îl poți invita din nou oricând.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="bt bt-s" type="button" data-n>Renunță</button><button class="bt bt-p" type="button" data-y>Scoate</button></div>';
    var close = function () { b.remove(); w.remove(); }; b.addEventListener('click', close); w.querySelector('[data-n]').addEventListener('click', close); w.querySelector('[data-y]').addEventListener('click', function () { close(); fn(); });
    document.body.appendChild(b); document.body.appendChild(w); w.querySelector('[data-y]').focus(); }
  document.addEventListener('submit', function (e) {
    if (e.target.id === 'tf') { e.preventDefault(); var em = e.target.e.value.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { toast('Scrie o adresă de e-mail validă.'); return; } if (site().team.some(function (x) { return x.email === em; })) { toast('Persoana are deja acces.'); return; } site().team.push({ email: em, role: e.target.r.value, pending: true }); save(); render(); toast('Invitație pregătită pentru ' + em + ' (demo: nu se trimite e-mail).'); return; }
    if (e.target.id !== 'hf') return; e.preventDefault();
    var v = e.target.t.value.trim(); if (v.length < 3) { toast('Scrie pe scurt ce ai nevoie.'); return; }
    S.tickets.push({ id: 'T-' + (36 + S.tickets.length), title: v.slice(0, 80), when: new Date().toISOString().slice(0, 10), status: 'Primit' }); save(); render(); toast('Am primit cererea. Îți răspundem în curând.');
  });
  addEventListener('hashchange', function () { menuOpen = false; render(); window.scrollTo(0, 0); });
  addEventListener('resize', function () { $$('.sb .nv a').forEach(function (a, i) { var l = a.querySelector('.lbl'); l.textContent = window.innerWidth > 760 ? ROUTES[i][1] : (ROUTES[i][0] === 'site' ? 'Site' : ROUTES[i][1].split(' ')[0]); }); });
  render();
})();
