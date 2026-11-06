/* Orobianco v5 shared script: languages, booking widget, nav, reveals, page transitions, intro, open-now, demo modal */
(function () {
  var B = document.documentElement.dataset.base || '/demo/orobianco/';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- i18n ---------- */
  var G = {
    hu: { nHome: 'Kezdőlap', nMenu: 'Étlap', nEv: 'Események', nAbout: 'Rólunk', nBlog: 'Napló', nRes: 'Asztalfoglalás', bDay: 'Nap', bTime: 'Óra', bPeople: 'Fő', bGo: 'Foglalás', today: 'Ma', tomorrow: 'Holnap', people: 'fő', person: 'fő',
      mRes: 'Asztalfoglalás', fCta: 'Tartunk neked <em>egy asztalt.</em>', fAddr: 'Cím', fHours: 'Nyitvatartás', fDaily: 'Minden nap, 12:00 – 23:00', fContact: 'Kapcsolat', fPages: 'Oldalak', fMaps: 'Útvonal ↗',
      legal: 'Weboldal-javaslat az OHI Solutions-tól az Orobianco számára. Nem a hivatalos oldal.', open: 'Most nyitva', closed: 'Most zárva', dmT: 'Az üzenet, ami az étterembe érkezne', dmP: 'Ez egy demó. Az élő oldalon a gomb megnyitja a WhatsAppot ezzel a kész üzenettel, közvetlenül az Orobianco felé.', dmX: 'Értem', iSub: 'Ristorante · Marosvásárhely' },
    en: { nHome: 'Home', nMenu: 'Menu', nEv: 'Events', nAbout: 'About', nBlog: 'Journal', nRes: 'Book a table', bDay: 'Day', bTime: 'Time', bPeople: 'Guests', bGo: 'Book', today: 'Today', tomorrow: 'Tomorrow', people: 'guests', person: 'guest',
      mRes: 'Book a table', fCta: 'We will keep <em>a table for you.</em>', fAddr: 'Address', fHours: 'Opening hours', fDaily: 'Every day, 12:00 – 23:00', fContact: 'Contact', fPages: 'Pages', fMaps: 'Directions ↗',
      legal: 'Website proposal by OHI Solutions for Orobianco. Not the official site.', open: 'Open now', closed: 'Closed now', dmT: 'The message that would reach the restaurant', dmP: 'This is a demo. On the live site, the button opens WhatsApp with this message ready, straight to Orobianco.', dmX: 'Got it', iSub: 'Ristorante · Târgu Mureș' }
  };
  var RO = { today: 'Azi', tomorrow: 'Mâine', people: 'persoane', person: 'persoană', open: 'Deschis acum', closed: 'Închis acum' };
  $$('[data-t]').forEach(function (e) { if (!(e.dataset.t in RO)) RO[e.dataset.t] = e.innerHTML; });
  $$('[data-tp]').forEach(function (e) { RO[e.dataset.tp] = e.placeholder; });
  var P = window.PAGE_T || {};
  var L = 'ro'; try { L = localStorage.getItem('oro-lang') || 'ro'; } catch (e) {}
  var t = window.ot = function (k) { return (P[L] && P[L][k]) || (G[L] && G[L][k]) || RO[k] || k; };
  var hooks = [];
  function setLang(l) {
    L = l; document.documentElement.lang = l;
    $$('[data-t]').forEach(function (e) { var v = t(e.dataset.t); if (v != null) e.innerHTML = v; });
    $$('[data-tp]').forEach(function (e) { e.placeholder = t(e.dataset.tp); });
    $$('.lang button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === l); });
    try { localStorage.setItem('oro-lang', l); } catch (e) {}
    hooks.forEach(function (h) { h(); });
  }
  window.oroLang = { get: function () { return L; }, on: function (f) { hooks.push(f); } };
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.l); }); });

  /* ---------- booking state (shared by all widgets, kept between pages) ---------- */
  var S = { d: 0, t: '20:00', p: 2 };
  try { var sv = JSON.parse(sessionStorage.getItem('oro-bk') || 'null'); if (sv) S = sv; } catch (e) {}
  var q = new URLSearchParams(location.search);
  if (q.get('d')) S.d = +q.get('d') || 0; if (q.get('t')) S.t = q.get('t'); if (q.get('p')) S.p = Math.min(20, Math.max(1, +q.get('p') || 2));
  function save() { try { sessionStorage.setItem('oro-bk', JSON.stringify(S)); } catch (e) {} }
  var LOC = { ro: 'ro-RO', hu: 'hu-HU', en: 'en-GB' };
  function dayDate(i) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i); return d; }
  function dayLabel(i, long) {
    if (i === 0) return t('today'); if (i === 1) return t('tomorrow');
    return dayDate(i).toLocaleDateString(LOC[L], long ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' });
  }
  var SLOTS = []; for (var h = 12; h <= 22; h++) { SLOTS.push(h + ':00'); if (h < 22) SLOTS.push(h + ':30'); }
  function peopleLabel(n) { return n + ' ' + (n === 1 ? t('person') : t('people')); }
  window.oroBooking = { state: S, dayLabel: dayLabel, peopleLabel: peopleLabel, slots: SLOTS, save: save,
    message: function (extra) {
      var d = dayDate(S.d).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });
      return 'Bună ziua! Aș dori o rezervare la Orobianco:\n• ' + d + ', ora ' + S.t + '\n• ' + S.p + (S.p === 1 ? ' persoană' : ' persoane') + (extra || '');
    } };
  var widgets = [];
  function render(w) {
    $('[data-f=d] b', w).textContent = dayLabel(S.d);
    $('[data-f=t] b', w).textContent = S.t;
    $('[data-f=p] b', w).textContent = peopleLabel(S.p);
    var dp = $('[data-f=d] .pop', w); dp.innerHTML = '';
    for (var i = 0; i < 14; i++) { var b = document.createElement('button'); b.type = 'button'; b.dataset.v = i; b.textContent = dayLabel(i, true); if (i === S.d) b.className = 'on'; dp.appendChild(b); }
    var tp = $('[data-f=t] .pop .grid', w); tp.innerHTML = '';
    SLOTS.forEach(function (s) { var b = document.createElement('button'); b.type = 'button'; b.dataset.v = s; b.textContent = s; if (s === S.t) b.className = 'on'; tp.appendChild(b); });
    $('[data-f=p] .stepper b', w).textContent = S.p;
  }
  function renderAll() { widgets.forEach(render); var md = $('.mdock .rez small'); if (md) md.textContent = dayLabel(S.d) + ' · ' + S.t + ' · ' + peopleLabel(S.p); }
  window.oroBooking.refresh = renderAll;
  $$('[data-book]').forEach(function (w) {
    w.innerHTML = '<div class="f" data-f="d" tabindex="0"><small data-t="bDay">Ziua</small><b></b><div class="pop"></div></div>' +
      '<div class="f" data-f="t" tabindex="0"><small data-t="bTime">Ora</small><b></b><div class="pop"><div class="grid"></div></div></div>' +
      '<div class="f" data-f="p" tabindex="0"><small data-t="bPeople">Persoane</small><b></b><div class="pop"><div class="stepper"><button type="button" data-s="-1" aria-label="-">−</button><b></b><button type="button" data-s="1" aria-label="+">+</button></div></div></div>' +
      '<a class="btn gold go" href="' + B + 'rezervare"><span data-t="bGo">Rezervă</span><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>';
    ['bDay', 'bTime', 'bPeople', 'bGo'].forEach(function (k) { if (!(k in RO)) RO[k] = { bDay: 'Ziua', bTime: 'Ora', bPeople: 'Persoane', bGo: 'Rezervă' }[k]; });
    widgets.push(w); render(w);
    w.addEventListener('click', function (e) {
      var f = e.target.closest('.f'), pb = e.target.closest('.pop button');
      if (pb) {
        var k = f.dataset.f;
        if (k === 'd') S.d = +pb.dataset.v; else if (k === 't') S.t = pb.dataset.v; else if (pb.dataset.s) { S.p = Math.min(20, Math.max(1, S.p + +pb.dataset.s)); save(); renderAll(); return; }
        save(); renderAll(); f.classList.remove('open'); return;
      }
      if (f && !e.target.closest('.pop')) { var was = f.classList.contains('open'); $$('.f.open').forEach(function (x) { x.classList.remove('open'); }); if (!was) f.classList.add('open'); }
    });
    $('.go', w).addEventListener('click', function (e) { if (document.body.dataset.page === 'rezervare') { e.preventDefault(); var fm = $('#resForm'); if (fm) fm.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      e.preventDefault(); go(B + 'rezervare?d=' + S.d + '&t=' + encodeURIComponent(S.t) + '&p=' + S.p); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.f')) $$('.f.open').forEach(function (x) { x.classList.remove('open'); }); });
  hooks.push(renderAll);

  /* ---------- nav, dock, sheet ---------- */
  var nav = $('.nav'), dock = $('.dock'), mdock = $('.mdock'), hero = $('.hero,.shero');
  $$('.links a').forEach(function (a) { if (a.dataset.p === document.body.dataset.page) a.classList.add('cur'); });
  function chrome() {
    var y = scrollY, vh = innerHeight, past = hero ? y > hero.offsetHeight - 90 : y > 40;
    nav.classList.toggle('solid', past || !hero && y > 40);
    var nearEnd = y + vh > document.documentElement.scrollHeight - vh * .55;
    var show = (hero ? y > hero.offsetHeight * .6 : y > 120) && !nearEnd && document.body.dataset.page !== 'rezervare';
    if (dock) dock.classList.toggle('on', show); if (mdock) mdock.classList.toggle('on', (hero ? y > vh * .5 : true) && !nearEnd && document.body.dataset.page !== 'rezervare');
  }
  if (!hero) nav.classList.add('light');
  addEventListener('scroll', chrome, { passive: true }); chrome();
  var bg = $('.burger'); if (bg) bg.addEventListener('click', function () { document.documentElement.classList.toggle('menu-open'); });
  $$('.sheet a').forEach(function (a) { a.addEventListener('click', function () { document.documentElement.classList.remove('menu-open'); }); });

  /* ---------- reveals + parallax ---------- */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('.rv,.clip').forEach(function (el) { io.observe(el); });
  var par = $$('[data-par]');
  if (par.length && !RM) { var tick = false; addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false;
    par.forEach(function (el) { var r = el.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - innerHeight / 2) * -(+el.dataset.par)).toFixed(1) + 'px,0)'; }); }); }, { passive: true }); }
  /* drag to scroll rows */
  $$('[data-drag]').forEach(function (r) { var down = false, x0 = 0, s0 = 0, moved = false;
    r.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; x0 = e.clientX; s0 = r.scrollLeft; r.classList.add('grab'); });
    addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; r.scrollLeft = s0 - dx; });
    addEventListener('pointerup', function () { down = false; r.classList.remove('grab'); });
    r.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true); });

  /* ---------- page transitions ---------- */
  function go(url) { if (RM) { location.href = url; return; } document.body.classList.add('leaving'); setTimeout(function () { location.href = url; }, 320); }
  document.addEventListener('click', function (e) { var a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || a.target === '_blank') return;
    var u = new URL(a.href, location.href); if (u.origin !== location.origin || u.pathname === location.pathname || u.pathname.indexOf(B.replace(/\/$/, '')) !== 0) return;
    if (a.hasAttribute('data-wa') || a.getAttribute('href').charAt(0) === '#') return; e.preventDefault(); go(a.href); });
  addEventListener('pageshow', function () { document.body.classList.remove('leaving'); });

  /* ---------- intro: first page of the visit ---------- */
  var intro = $('.intro'), seen = false; try { seen = !!sessionStorage.getItem('oro-intro'); } catch (e) {}
  if (intro) { if (seen || RM) intro.remove(); else { try { sessionStorage.setItem('oro-intro', '1'); } catch (e) {} document.documentElement.classList.add('intro-on');
    setTimeout(function () { intro.classList.add('out'); document.documentElement.classList.remove('intro-on'); setTimeout(function () { intro.remove(); }, 1200); }, 1700); } }

  /* ---------- open now (Europe/Bucharest) ---------- */
  function openNow() { var d; try { d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Bucharest' })); } catch (e) { d = new Date(); }
    var h = d.getHours() + d.getMinutes() / 60, on = h >= 12 && h < 23;
    $$('[data-open]').forEach(function (el) { el.classList.toggle('closed', !on); var s = $('span', el); if (s) s.textContent = t(on ? 'open' : 'closed'); }); }
  hooks.push(openNow);

  /* ---------- demo WhatsApp ---------- */
  var dm = $('#dm');
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-wa]'); if (!a || !dm) return; e.preventDefault();
    var msg = a.dataset.wa === 'booking' ? window.oroBooking.message(a.dataset.extra ? '\n' + a.dataset.extra : '') : a.dataset.wa;
    if (typeof a.oroMsg === 'function') msg = a.oroMsg(); if (!msg) return;
    $('#dmMsg').textContent = msg; dm.classList.add('on'); });
  if (dm) { $('#dmX').addEventListener('click', function () { dm.classList.remove('on'); }); dm.addEventListener('click', function (e) { if (e.target === dm) dm.classList.remove('on'); }); }

  setLang(L);
})();
