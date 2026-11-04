// Landing sections on the home previews: parallax photo, "Ce primești" carousel, project videos, mouse trail, bottom pill.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  var $ = function (id) { return document.getElementById(id); };

  // parallax photo
  var par = $('lpPar');
  if (par && !reduce) {
    var box = par.parentNode, anchor = box.parentNode, on = false, tick = false;
    new IntersectionObserver(function (e) { on = e[0].isIntersecting; }).observe(anchor);
    var upd = function () { tick = false; if (!on) return; var r = anchor.getBoundingClientRect(), p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      box.style.translate = '0 ' + (Math.max(-1, Math.min(1, p)) * 200 * .5).toFixed(1) + 'px'; };
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // carousel: cards tripled so it can loop; slides one card every 3s, pauses on hover
  var row = $('lpRow'), view = $('lpView');
  if (row) {
    var base = Array.prototype.slice.call(row.children), n = base.length;
    base.forEach(function (c) { row.appendChild(c.cloneNode(true)); });
    base.forEach(function (c) { row.appendChild(c.cloneNode(true)); });
    var cards = row.children, i = n, hover = false, timer;
    var step = function () { return cards[1].offsetLeft - cards[0].offsetLeft; };
    var place = function (anim) {
      if (!anim) row.style.transition = 'none';
      row.style.transform = 'translateX(' + (-i * step()) + 'px)';
      for (var k = 0; k < cards.length; k++) cards[k].classList.toggle('out', k < i);
      if (!anim) { row.offsetWidth; row.style.transition = ''; }
    };
    var go = function (d) { i += d; place(true); };
    row.addEventListener('transitionend', function (e) { if (e.target !== row) return; if (i >= 2 * n) { i -= n; place(false); } else if (i < n) { i += n; place(false); } });
    $('lpNext').onclick = function () { go(1); };
    $('lpPrev').onclick = function () { go(-1); };
    view.addEventListener('mouseenter', function () { hover = true; });
    view.addEventListener('mouseleave', function () { hover = false; });
    addEventListener('resize', function () { place(false); });
    place(false);
    var vis = false;
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(view);
    if (!reduce) timer = setInterval(function () { if (!hover && vis && !document.hidden) go(1); }, 3000);
    // swipe on phones
    var sx = null;
    view.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    view.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); sx = null; });
  }

  // marquee: the strip is doubled so it can loop at -50%
  var mt = document.querySelector('.vk-mtrack');
  if (mt) Array.prototype.slice.call(mt.children).forEach(function (v) { var c = v.cloneNode(true); c.setAttribute('aria-hidden', 'true'); mt.appendChild(c); });

  // fade-in-up when a block enters the screen (once)
  var reveal = document.querySelectorAll('.vk-a,.vk-io');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }); }, { threshold: 0, rootMargin: '0px 0px 12% 0px' });
    reveal.forEach(function (el) { ro.observe(el); });
  } else reveal.forEach(function (el) { el.classList.add('in'); });

  // videos play only while on screen
  var vids = document.querySelectorAll('.vk-marq video');
  if (vids.length && 'IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var v = e.target; if (e.isIntersecting && !reduce) v.play().catch(function () {}); else v.pause(); });
    }, { threshold: .05 });
    vids.forEach(function (v) { v.autoplay = false; v.pause(); vo.observe(v); });
  }

  // partner box: little site previews follow the mouse
  var trail = $('lpTrail');
  if (trail && fine && !reduce) {
    var imgs = ['bbb', 'valeaurie', 'bbb-build', 'orobianco', 'david', 'amaryllis', 'ferestre', 'amaryllis-atelier'].map(function (k) { return '/portofoliu-media/' + k + '.webp'; });
    var last = 0, idx = 0;
    trail.addEventListener('mousemove', function (e) {
      var t = performance.now(); if (t - last < 80) return; last = t;
      var r = trail.getBoundingClientRect(), d = document.createElement('div');
      d.className = 'lp-tr'; d.style.left = (e.clientX - r.left) + 'px'; d.style.top = (e.clientY - r.top) + 'px';
      d.style.setProperty('--r', (Math.random() * 20 - 10).toFixed(1) + 'deg');
      d.innerHTML = '<img src="' + imgs[idx++ % imgs.length] + '" alt="">';
      trail.appendChild(d);
      requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('bye'); }); });
      setTimeout(function () { d.remove(); }, 1050);
    });
  }

  // floating pill appears once the hero is behind you, hides near the footer
  var pill = $('lpPill');
  if (pill) {
    var ft = document.querySelector('.o-ft');
    var hero = document.querySelector('.orb,.va,.dr');
    var chk = function () { var past = hero ? hero.getBoundingClientRect().bottom < innerHeight * .4 : scrollY > innerHeight * .9; var nearEnd = ft && ft.getBoundingClientRect().top < innerHeight; pill.classList.toggle('on', past && !nearEnd); };
    addEventListener('scroll', chk, { passive: true }); chk();
  }
})();


// projects: monitors side by side; only the one in focus loads its live site (intro plays), tap to scroll inside it
(function () {
  var track = document.getElementById('pjTrack');
  if (!track) return;
  var items = [].slice.call(track.querySelectorAll('.vk-pr')), cur = -1;
  function fit(d) { var s = d.querySelector('.vk-scr'), f = d.querySelector('iframe'); if (!s.clientWidth) return; var k = s.clientWidth / 1440; f.style.transform = 'scale(' + k + ')'; f.style.height = Math.ceil(s.clientHeight / k) + 'px'; }
  function unload(d) { var f = d.querySelector('iframe'); d.classList.remove('loaded', 'live'); delete d.dataset.on; if (f.getAttribute('src')) f.removeAttribute('src'); }
  function load(d) { if (d.dataset.on) return; d.dataset.on = 1; fit(d); d.querySelector('iframe').src = d.dataset.src; }
  items.forEach(function (it) {
    var d = it.querySelector('.vk-desk'), f = d.querySelector('iframe');
    f.addEventListener('load', function () { if (d.dataset.on && f.getAttribute('src')) setTimeout(function () { if (d.dataset.on) d.classList.add('loaded'); }, 250); });
    d.querySelector('.vk-try').addEventListener('click', function () { if (!it.classList.contains('on')) { go(items.indexOf(it)); return; } load(d); d.classList.add('live'); });
    d.querySelector('.vk-done').addEventListener('click', function () { d.classList.remove('live'); });
    d.addEventListener('mouseleave', function () { d.classList.remove('live'); });
  });
  var inView = false;
  function activate(i) {
    if (i === cur) return; cur = i;
    items.forEach(function (it, k) { it.classList.toggle('on', k === i); var d = it.querySelector('.vk-desk'); if (k !== i) unload(d); });
    var c = document.getElementById('pjCount'); if (c) c.textContent = (i + 1) + ' / ' + items.length;
    if (inView) load(items[i].querySelector('.vk-desk'));
  }
  function go(i) { i = Math.max(0, Math.min(items.length - 1, i)); var it = items[i]; track.scrollTo({ left: it.offsetLeft - (track.clientWidth - it.clientWidth) / 2, behavior: 'smooth' }); activate(i); }
  document.getElementById('pjPrev').onclick = function () { go(cur - 1); };
  document.getElementById('pjNext').onclick = function () { go(cur + 1); };
  var t = null;
  track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(function () {
    var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
    items.forEach(function (it, k) { var c = it.offsetLeft + it.clientWidth / 2, dd = Math.abs(c - mid); if (dd < bd) { bd = dd; best = k; } });
    activate(best); }, 120); }, { passive: true });
  addEventListener('resize', function () { items.forEach(function (it) { fit(it.querySelector('.vk-desk')); }); });
  new IntersectionObserver(function (es) { inView = es[0].isIntersecting;
    var d = items[Math.max(cur, 0)].querySelector('.vk-desk'); if (inView) load(d); else items.forEach(function (it) { unload(it.querySelector('.vk-desk')); });
  }, { threshold: .35 }).observe(track);
  activate(0);
})();

// demo form at the end of the page: sends straight to the OHI leads scenario in Make
(function () {
  var f = document.getElementById('qf');
  if (!f) return;
  var HOOK = 'https://hook.eu2.make.com/pjyknr3dp5tb8b5stpbit53yqluizecy';
  var LIVE = /(^|\.)vercel\.app$|\.ro$/.test(location.hostname);
  var biz = document.getElementById('qfBiz'), tel = document.getElementById('qfTel'), plan = document.getElementById('qfPlan'),
      hp = document.getElementById('qfHp'), msg = document.getElementById('qfMsg'), btn = f.querySelector('button[type=submit]'), T0 = Date.now(), sent = false;
  function say(t, bad) { msg.textContent = t; msg.classList.toggle('bad', !!bad); }
  // a package button anywhere on the page picks the plan for this form
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () { plan.value = a.dataset.plan; say('Pachet ales: ' + a.dataset.plan + '. Îl poți schimba oricând.'); setTimeout(function () { biz.focus({ preventScroll: true }); }, 600); });
  });
  // footer "Sună-mă" and old links can pass ?tel= / ?biz=
  var qp = new URLSearchParams(location.search);
  if (qp.get('tel')) tel.value = qp.get('tel').replace(/[^\d+ ]/g, '').slice(0, 20);
  if (qp.get('biz')) biz.value = qp.get('biz').slice(0, 80);
  if (qp.get('tel') || qp.get('biz')) setTimeout(function () { document.getElementById('oferta').scrollIntoView({ block: 'center' }); (biz.value ? tel : biz).focus({ preventScroll: true }); }, 400);
  f.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (sent) { say('Am primit deja cererea ta. Te sunăm în curând.'); return; }
    var b = biz.value.trim(), p = tel.value.trim();
    if (!b) { say('Scrie numele afacerii.', 1); biz.focus(); return; }
    if (p.replace(/\D/g, '').length < 9) { say('Lasă un număr de telefon complet, ca să te putem suna.', 1); tel.focus(); return; }
    var done = function () { sent = true; f.classList.add('ok'); btn.disabled = true; btn.firstChild.textContent = 'Cerere trimisă '; say('Mulțumim! Te sunăm în curând cu demo-ul pentru ' + b + '.'); };
    if (hp.value || Date.now() - T0 < 3000) { done(); return; }
    var id = 'OHI-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var data = new URLSearchParams({ created_at: new Date().toISOString(), source: 'site-acasa-oferta', request_id: id, name: '', business: b, phone: p, email: '',
      business_type: '', website: '', need: 'Site nou · demo gratuit' + (plan.value ? ' · pachet: ' + plan.value : ''),
      message: 'Cerere din formularul de pe prima pagină.\nPachet: ' + (plan.value || 'nealeas'), page: location.pathname });
    if (!LIVE) { console.log('[OHI] preview, not sent:', Object.fromEntries(data)); done(); return; }
    btn.disabled = true; var old = btn.firstChild.textContent; btn.firstChild.textContent = 'Se trimite… ';
    try {
      var ctrl = new AbortController(), tm = setTimeout(function () { ctrl.abort(); }, 15000);
      var res = await fetch(HOOK, { method: 'POST', body: data, signal: ctrl.signal }); clearTimeout(tm);
      if (!res.ok) throw new Error('http ' + res.status);
      done();
    } catch (x) {
      // network/CORS errors usually still deliver to Make; only a timeout or HTTP error is a real failure
      if (x.name === 'TypeError') { done(); return; }
      btn.disabled = false; btn.firstChild.textContent = old;
      say('Nu s-a putut trimite. Încearcă din nou sau sună la 0740 267 706.', 1);
    }
  });
})();
