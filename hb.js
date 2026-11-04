// Hero: a small site builds itself on a laptop and a phone, piece by piece, then a new request arrives.
// It cycles through three of our example businesses (cofetărie, frizerie, service auto). Plain DOM + CSS.
(function () {
  var stage = document.getElementById('hbStage');
  if (!stage) return;
  var L = document.getElementById('hbSiteL'), Mo = document.getElementById('hbSiteM');
  var toast = document.getElementById('hbToast'), cursor = document.getElementById('hbCursor'), steps = [].slice.call(document.querySelectorAll('#hbSteps li'));
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ICON = {
    cake: '<svg viewBox="0 0 64 64"><path d="M14 54h36V34H14Z"/><path d="M14 42c4 3 8 3 12 0s8-3 12 0 8 3 12 0"/><path d="M20 34v-8h24v8"/><path d="M32 26v-8"/><path d="M32 12c2 2 2 4 0 6-2-2-2-4 0-6Z"/></svg>',
    scissors: '<svg viewBox="0 0 64 64"><circle cx="18" cy="46" r="8"/><circle cx="46" cy="46" r="8"/><path d="M23 40 48 10M41 40 16 10"/></svg>',
    wrench: '<svg viewBox="0 0 64 64"><path d="M40 8a14 14 0 0 0-13 19L9 45a6 6 0 0 0 9 9l18-18a14 14 0 0 0 19-13l-8 8-8-2-2-8 8-8Z"/></svg>'
  };
  var T = [
    { cls: 't-cake', step: 0, brand: 'Fragă &amp; Fistic', nav: ['Produse', 'Torturi', 'Contact'], cta: 'Comandă un tort', kick: 'Cofetărie · Târgu Mureș',
      title: ['Torturi care se', 'termină primele.'], sub: 'Făcute în fiecare dimineață, cu fructe de sezon.', icon: 'cake',
      cards: [['Torturi la comandă', 'din 2 kg'], ['Prăjituri zilnic', '8 – 20'], ['Livrare în oraș', 'gratuit peste 150 lei']],
      toast: ['Comandă nouă', 'Tort de ciocolată, 2 kg · Ioana'] },
    { cls: 't-cut', step: 1, brand: 'Atelierul Brici', nav: ['Prețuri', 'Echipa', 'Contact'], cta: 'Programează-te', kick: 'Frizerie · Târgu Mureș',
      title: ['Tunsori făcute', 'cu răbdare.'], sub: 'Clasic sau modern, cu prosop cald și cafea.', icon: 'scissors',
      cards: [['Tuns clasic', '45 min'], ['Barbă', '30 min'], ['Tuns + barbă', '70 min']],
      toast: ['Programare nouă', 'Sâmbătă, 10:30 · Andrei'] },
    { cls: 't-car', step: 2, brand: 'Piston Garage', nav: ['Servicii', 'Prețuri', 'Contact'], cta: 'Cere programare', kick: 'Service auto · Târgu Mureș',
      title: ['Prețul îl afli', 'înainte să începem.'], sub: 'Diagnoză clară, ofertă scrisă, piese la vedere.', icon: 'wrench',
      cards: [['Diagnoză', '30 min'], ['Revizie', '1 zi'], ['Pregătire ITP', 'la cerere']],
      toast: ['Cerere nouă', 'Revizie, Dacia Logan · Mihai'] }
  ];

  function site(t) {
    return '<div class="s-nav s-p p1"><b>' + t.brand + '</b><span>' + t.nav.map(function (n) { return '<i>' + n + '</i>'; }).join('') + '</span><em class="s-btn sm">' + t.cta + '</em></div>' +
      '<div class="s-hero"><div class="s-txt"><small class="s-p p2">' + t.kick + '</small><h4 class="s-p p3"><span class="s-type" data-l1="' + t.title[0] + '" data-l2="' + t.title[1] + '"></span></h4>' +
      '<p class="s-p p4">' + t.sub + '</p><div class="s-p p5 s-ctas"><em class="s-btn go">' + t.cta + '</em><em class="s-btn gh">Vezi mai mult</em></div></div>' +
      '<div class="s-pic s-p p6">' + ICON[t.icon] + '</div></div>' +
      '<div class="s-cards">' + t.cards.map(function (c, i) { return '<div class="s-card s-p p' + (7 + i) + '"><b>' + c[0] + '</b><span>' + c[1] + '</span></div>'; }).join('') + '</div>';
  }
  function typeIn(el, ms) {
    var a = el.dataset.l1, b = el.dataset.l2, full = a + '\n' + b, i = 0, step = Math.max(18, ms / full.length);
    el.innerHTML = '';
    return new Promise(function (res) {
      (function tick() {
        i++; var s = full.slice(0, i); el.innerHTML = s.replace('\n', '<br>') + '<i class="s-caret"></i>';
        if (i < full.length) setTimeout(tick, step); else { el.innerHTML = a + '<br>' + b; res(); }
      })();
    });
  }
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var on = true, k = 0, running = false;

  function moveCursorTo(el) {
    var r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    cursor.style.transform = 'translate(' + (r.left - s.left + r.width * .6) + 'px,' + (r.top - s.top + r.height * .6) + 'px)';
  }
  async function play(t) {
    stage.className = 'hb-stage ' + t.cls;
    steps.forEach(function (li, i) { li.classList.toggle('on', i === t.step); });
    [L, Mo].forEach(function (el) { el.innerHTML = site(t); el.classList.remove('done'); });
    toast.classList.remove('show'); cursor.classList.remove('show', 'click');
    if (calm) { [L, Mo].forEach(function (el) { el.querySelectorAll('.s-p').forEach(function (p) { p.classList.add('in'); }); el.querySelectorAll('.s-type').forEach(function (s) { s.innerHTML = s.dataset.l1 + '<br>' + s.dataset.l2; }); });
      toast.querySelector('b').textContent = t.toast[0]; toast.querySelector('span').textContent = t.toast[1]; toast.classList.add('show'); return; }
    await wait(350);
    var order = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'];
    for (var i = 0; i < order.length; i++) {
      if (!on) return;
      [L, Mo].forEach(function (el) { el.querySelectorAll('.' + order[i]).forEach(function (p) { p.classList.add('in'); }); });
      if (order[i] === 'p3') await Promise.all([L, Mo].map(function (el) { return typeIn(el.querySelector('.s-type'), 900); }));
      else await wait(order[i] === 'p1' ? 420 : 300);
    }
    [L, Mo].forEach(function (el) { el.classList.add('done'); });
    // a visitor taps the button, a request comes in
    var btn = L.querySelector('.s-btn.go');
    cursor.classList.add('show'); await wait(60); moveCursorTo(btn); await wait(900);
    cursor.classList.add('click'); btn.classList.add('press'); await wait(260); btn.classList.remove('press'); cursor.classList.remove('click');
    toast.querySelector('b').textContent = t.toast[0]; toast.querySelector('span').textContent = t.toast[1]; toast.classList.add('show');
    await wait(2600);
    cursor.classList.remove('show'); toast.classList.remove('show');
    stage.classList.add('out'); await wait(600);
  }
  async function loop() {
    if (running) return; running = true;
    while (on) { await play(T[k % T.length]); k++; if (calm) break; }
    running = false;
  }
  new IntersectionObserver(function (e) { on = e[0].isIntersecting && !document.hidden; if (on) loop(); }, { threshold: .15 }).observe(stage);
  document.addEventListener('visibilitychange', function () { on = !document.hidden; if (on) loop(); });
  steps.forEach(function (li, i) { li.addEventListener('click', function () { k = i; }); });
})();
