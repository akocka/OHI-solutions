/* Big Big Boon preview · interaction layer (homepage + inner pages) */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  /* 1 · amber light in dark sections: follows the cursor on desktop, drifts by itself on phones */
  $$('.oh, .hero, .dark, .ct, .nb, footer').forEach(function (sec) {
    if (sec.querySelector(':scope > .fx-glow')) return;
    if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
    sec.classList.add('fx-host');
    var g = document.createElement('div'); g.className = 'fx-glow'; g.setAttribute('aria-hidden', 'true');
    sec.insertBefore(g, sec.firstChild);
    if (!fine || reduce) return;
    sec.addEventListener('pointermove', function (e) {
      var r = sec.getBoundingClientRect();
      g.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      g.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      g.style.setProperty('--mo', '1');
    });
    sec.addEventListener('pointerleave', function () { g.style.setProperty('--mo', '.85'); });
  });

  /* 2 · magnetic buttons with an elastic bounce back (desktop only) */
  if (fine && !reduce) {
    $$('.btn, .langs button, .b3c, [data-b3f]').forEach(function (b) {
      if (b.classList.contains('fx-mag') || b.closest('.pv-rib')) return;
      b.classList.add('fx-mag');
      var inner = document.createElement('span'); inner.className = 'fx-in';
      while (b.firstChild) inner.appendChild(b.firstChild); b.appendChild(inner);
      var strength = b.classList.contains('btn') ? .35 : .25, raf = 0, tx = 0, ty = 0;
      var set = function (el, x, y, t) { el.style.transition = t || 'none'; el.style.transform = 'translate(' + x + 'px,' + y + 'px)'; };
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.setProperty('--bx', (e.clientX - r.left) + 'px'); b.style.setProperty('--by', (e.clientY - r.top) + 'px');
        tx = x * strength; ty = y * strength;
        cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { set(b, tx, ty, 'transform .25s cubic-bezier(.2,.8,.2,1)'); set(inner, tx * .45, ty * .45, 'transform .25s cubic-bezier(.2,.8,.2,1)'); });
      });
      b.addEventListener('pointerleave', function () {
        cancelAnimationFrame(raf);
        var spring = 'transform .9s cubic-bezier(.34,1.8,.5,1)'; // overshoots, then settles: the bounce back
        set(b, 0, 0, spring); set(inner, 0, 0, spring);
      });
    });
  }

  /* 3 · product and price options zoom in */
  var cards = $$('.card, .plan, .pc-card, .post, .gl-g figure, .tm, .lo-card');
  cards.forEach(function (c) {
    c.classList.add('fx-zoom');
    var im = c.querySelector('img'); if (im) im.classList.add('fx-zi');
    if (fine) { c.addEventListener('pointerenter', function () { c.classList.add('fx-on'); }); c.addEventListener('pointerleave', function () { c.classList.remove('fx-on'); }); }
  });
  if (!fine && !reduce && 'IntersectionObserver' in window) {
    // phones: the card in the middle of the screen zooms in
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('fx-on', e.isIntersecting); }); }, { rootMargin: '-38% 0px -38% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }
  $$('[data-b3f], .chips button').forEach(function (o) { o.classList.add('fx-pick'); });
})();
