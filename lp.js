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
  var vids = document.querySelectorAll('.vk video');
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

