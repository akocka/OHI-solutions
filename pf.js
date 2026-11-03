// Portfolio archive: project cards on a sphere (CSS 3D). Drag to rotate, tap a card to open it.
// The title sits on the sphere's centre and counter-rotates so it always faces you.
(function () {
  var stage = document.getElementById('pfStage'), sp = document.getElementById('sp');
  if (!stage || !sp) return;
  var world = document.getElementById('spWorld'), orb = document.getElementById('spOrb'), head = document.getElementById('spHead');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  var M = '/portofoliu-media/';
  var ITEMS = [
    { img: M + 'bbb.webp', t: 'Big Big Boon', tag: 'Client', where: 'Construcții modulare · Mureș', note: 'Site cu configurator 3D, blog și cerere de ofertă. Primul nostru client.', href: 'https://www.bigbigboon.ro', ext: 1 },
    { img: M + 'valeaurie.webp', t: 'Vale Aurie', tag: 'Concept', where: 'Cramă · brand fictiv', note: 'Sticla 3D se rotește în timp ce derulezi, cu note de degustare și cadouri corporate.', href: '/demo/vale-aurie' },
    { img: '/exemple/img/cofetarie.webp', t: 'Fragă & Fistic', tag: 'Exemplu', where: 'Cofetărie · nume inventat', note: 'Model de site pentru cofetării: produse, comandă de tort pe WhatsApp, program.', href: '/exemple/cofetarie', tall: 1 },
    { img: M + 'orobianco.webp', t: 'Orobianco', tag: 'Concept', where: 'Restaurant italian', note: 'Meniu, evenimente și rezervări pe WhatsApp. Propunere de design, nu site comandat.', href: '/demo/orobianco' },
    { img: M + 'bbb-build.webp', t: 'Configurator 3D', tag: 'Client', where: 'Big Big Boon', note: 'Clientul își alege modulul și finisajele, apoi cere oferta direct din site.', href: 'https://www.bigbigboon.ro', ext: 1 },
    { img: M + 'amaryllis.webp', t: 'Florăria Amaryllis', tag: 'Concept', where: 'Florărie', note: 'Film la derulare și buchet compus de client. Propunere de design, nu site comandat.', href: '/demo/amaryllis' },
    { img: '/exemple/img/frizerie.webp', t: 'Atelierul Brici', tag: 'Exemplu', where: 'Frizerie · nume inventat', note: 'Model de site pentru frizerii: echipa, prețuri și programare online.', href: '/exemple/frizerie', tall: 1 },
    { img: M + 'ferestre.webp', t: 'Ferestre Partner', tag: 'Concept', where: 'Ferestre și uși', note: 'Configurator și poveste la derulare. Propunere de design, nu site comandat.', href: '/demo/ferestre-partner' },
    { img: M + 'david.webp', t: 'Pensiunea David', tag: 'Concept', where: 'Pensiune', note: 'Rezervare rapidă și ilustrații. Propunere de design, nu site comandat.', href: '/demo/pensiunea-david' },
    { img: '/exemple/img/service-auto.webp', t: 'Piston Garage', tag: 'Exemplu', where: 'Service auto · nume inventat', note: 'Model de site pentru service-uri: prețuri orientative, martorii de bord, programare.', href: '/exemple/service-auto', tall: 1 },
    { img: M + 'amaryllis-atelier.webp', t: 'Amaryllis · atelier', tag: 'Concept', where: 'Florărie', note: 'Pagina de atelier, cu aranjamente pe comandă.', href: '/demo/amaryllis' },
    { img: '/clienti/bbb-m.webp', t: 'Big Big Boon pe telefon', tag: 'Client', where: 'Varianta de mobil', note: 'Același site, gândit întâi pentru telefon, unde intră majoritatea vizitatorilor.', href: 'https://www.bigbigboon.ro', ext: 1, tall: 1 }
  ];
  var N = ITEMS.length, GA = Math.PI * (3 - Math.sqrt(5)), cards = [];
  ITEMS.forEach(function (it, i) {
    var y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(Math.max(0, 1 - y * y)), th = i * GA;
    var x = Math.cos(th) * rad, z = Math.sin(th) * rad;
    var c = document.createElement('div');
    c.className = 'sp-card' + (it.tall ? ' tall' : ''); c.dataset.idx = i;
    c.innerHTML = '<figure><img alt="' + it.t.replace(/"/g, '') + '" decoding="async" src="' + it.img + '"></figure>';
    var img = c.querySelector('img'); img.onload = function () { img.classList.add('in'); };
    orb.appendChild(c);
    cards.push({ el: c, v: [x, y, z], lat: Math.asin(y) * 180 / Math.PI, lon: Math.atan2(x, z) * 180 / Math.PI, d: -1, o: -1 });
  });

  var R = 300, cw = 140, persp = 1150;
  function lay() {
    var w = innerWidth, h = stage.clientHeight;
    var hr = w <= 380 ? .38 : w <= 640 ? .42 : .46, wr = w <= 380 ? .48 : w <= 640 ? .52 : .58, fl = w <= 380 ? 108 : w <= 640 ? 120 : 155;
    R = Math.max(fl, Math.min(460, (h - 80) * hr, w * wr));
    cw = Math.round(Math.max(72, R * (w <= 380 ? .56 : w <= 640 ? .58 : .6)));
    persp = w <= 380 ? 620 : w <= 640 ? 760 : w <= 900 ? 920 : 1150;
    sp.style.setProperty('--persp', persp + 'px');
    cards.forEach(function (c) {
      var e = c.el, tall = e.classList.contains('tall');
      e.style.width = cw + 'px'; e.style.height = (tall ? cw * 1.25 : cw / 1.5) + 'px';
      e.style.marginLeft = (-cw / 2) + 'px'; e.style.marginTop = (tall ? -cw * .625 : -cw / 3) + 'px';
      e.style.transform = 'translate3d(' + (c.v[0] * R) + 'px,' + (-c.v[1] * R) + 'px,' + (c.v[2] * R) + 'px) rotateY(' + c.lon + 'deg) rotateX(' + c.lat + 'deg)';
    });
  }
  lay();
  var lw = innerWidth, lh = innerHeight;
  addEventListener('resize', function () { if (Math.abs(innerWidth - lw) < 20 && Math.abs(innerHeight - lh) < 20) return; lw = innerWidth; lh = innerHeight; lay(); });

  // camera
  var spin = 0, tilt = -4, dX = 0, dY = 0, vX = 0, vY = 0, drag = null, lit = -1, active = false, run = false;
  function frame() {
    if (!active) { run = false; return; }
    if (!drag && lit < 0) {
      dX += vX; dY += vY; vX *= .94; vY *= .94;
      if (Math.abs(vX) < .002) vX = 0; if (Math.abs(vY) < .002) vY = 0;
      if (!reduce) spin += .045;
    }
    dY = Math.max(-32 - tilt, Math.min(32 - tilt, dY));
    var sx = tilt + dY, sy = spin + dX;
    world.style.transform = 'rotateY(' + sy + 'deg) rotateX(' + sx + 'deg)';
    head.style.transform = 'rotateX(' + (-sx) + 'deg) rotateY(' + (-sy) + 'deg) translateZ(' + (R * .62) + 'px)';
    var ry = sy * Math.PI / 180, rx = sx * Math.PI / 180, cy = Math.cos(ry), syy = Math.sin(ry), cxx = Math.cos(rx), sxx = Math.sin(rx);
    cards.forEach(function (c, i) {
      var x = c.v[0], y = -c.v[1], z = c.v[2];
      var x1 = x * cy + z * syy, z1 = -x * syy + z * cy;
      var z2 = y * sxx + z1 * cxx;
      var zf = z2, base = .14 + .86 * Math.pow((zf + 1) / 2, .85), dim = 1 - base;
      if (lit >= 0) dim = Math.min(1, dim + .78);
      var o = (lit === i) ? 0 : 1;
      dim = Math.round(dim * 100) / 100;
      if (dim !== c.d) { c.el.style.setProperty('--d', dim); c.d = dim; }
      if (o !== c.o) { c.el.style.opacity = o; c.o = o; }
      c.el.style.zIndex = Math.round((zf + 1) * 100);
    });
    requestAnimationFrame(frame);
  }
  function setActive(a) { active = a; if (a && !run) { run = true; requestAnimationFrame(frame); } }
  // runs only while the archive is open (after the glass shatters) and on screen
  var onScreen = true;
  new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; setActive(onScreen && stage.classList.contains('gs-open')); }).observe(stage);
  new MutationObserver(function () { setActive(onScreen && stage.classList.contains('gs-open')); }).observe(stage, { attributes: true, attributeFilter: ['class'] });

  // drag
  var downCard = null, sx0 = 0, sy0 = 0, moved = 0, lastX = 0, lastY = 0, cap = false;
  sp.addEventListener('pointerdown', function (e) {
    if (lit >= 0 || !stage.classList.contains('gs-open')) return;
    downCard = e.target.closest('.sp-card'); sx0 = lastX = e.clientX; sy0 = lastY = e.clientY; moved = 0; vX = vY = 0;
    drag = { id: e.pointerId, type: e.pointerType }; cap = false;
    if (e.pointerType !== 'touch') { sp.setPointerCapture(e.pointerId); cap = true; }
  });
  sp.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
    moved = Math.max(moved, Math.hypot(e.clientX - sx0, e.clientY - sy0));
    if (drag.type === 'touch' && !cap && moved > 10) {
      if (Math.abs(e.clientY - sy0) > Math.abs(e.clientX - sx0) * 1.15) { drag = null; return; }
      try { sp.setPointerCapture(e.pointerId); } catch (er) {} cap = true;
    }
    dX += dx * .13; dY -= dy * .13; vX = dx * .13; vY = -dy * .13;
  });
  function up(e) {
    if (!drag) return;
    var slop = coarse ? 14 : 6;
    if (moved < slop && downCard) open(+downCard.dataset.idx, downCard);
    drag = null;
  }
  sp.addEventListener('pointerup', up); sp.addEventListener('pointercancel', function () { drag = null; });

  // lightbox
  var L = document.getElementById('spLit'), plate = L.querySelector('.sp-plate'), limg = L.querySelector('.sp-shot img');
  var src = null;
  function flipFrom(el) {
    var r = el.getBoundingClientRect(), p = plate.getBoundingClientRect();
    var s = Math.max(.04, r.width / p.width), dx = (r.left + r.width / 2) - (p.left + p.width / 2), dy = (r.top + r.height / 2) - (p.top + p.height / 2);
    plate.style.transition = 'none'; plate.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')'; plate.style.opacity = '0';
    plate.offsetWidth; plate.style.transition = ''; plate.style.transform = ''; plate.style.opacity = '';
  }
  function open(i, el) {
    var it = ITEMS[i]; lit = i; src = el;
    limg.src = it.img; limg.alt = it.t;
    L.classList.toggle('tall', !!it.tall);
    document.getElementById('spT').textContent = it.t;
    document.getElementById('spTag').textContent = it.tag;
    document.getElementById('spWhere').textContent = it.where;
    document.getElementById('spNote').textContent = it.note;
    var a = document.getElementById('spGo'); a.href = it.href;
    if (it.ext) { a.target = '_blank'; a.rel = 'noopener'; } else { a.removeAttribute('target'); a.removeAttribute('rel'); }
    a.firstChild.textContent = it.tag === 'Client' ? 'Deschide site-ul ' : it.tag === 'Exemplu' ? 'Deschide modelul ' : 'Deschide conceptul ';
    document.body.classList.add('lit'); L.hidden = false; flipFrom(el);
    setTimeout(function () { L.querySelector('[data-close]').focus({ preventScroll: true }); }, 50);
  }
  function close() {
    if (lit < 0) return;
    var el = src; lit = -1; document.body.classList.remove('lit');
    if (el) { var r = el.getBoundingClientRect(), p = plate.getBoundingClientRect();
      plate.style.transform = 'translate(' + ((r.left + r.width / 2) - (p.left + p.width / 2)) + 'px,' + ((r.top + r.height / 2) - (p.top + p.height / 2)) + 'px) scale(' + Math.max(.04, r.width / p.width) + ')'; plate.style.opacity = '0'; }
    setTimeout(function () { L.hidden = true; plate.style.transition = 'none'; plate.style.transform = ''; plate.style.opacity = ''; plate.offsetWidth; plate.style.transition = ''; }, 560);
  }
  L.addEventListener('click', function (e) { if (e.target.closest('[data-close]') || e.target === L || e.target.classList.contains('sp-scrim')) close(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // fallback when the glass can't run: plain buttons open and close the archive
  var gl = document.getElementById('gsLink'), bk = document.getElementById('gsBack'), fo = document.getElementById('gsOpen2');
  function noGlass() { return !stage.classList.contains('gs-ready'); }
  [gl, fo].forEach(function (b) { b && b.addEventListener('click', function (e) { if (noGlass()) { e.preventDefault(); stage.classList.add('gs-open'); } }); });
  bk && bk.addEventListener('click', function () { if (noGlass()) stage.classList.remove('gs-open'); });
})();
