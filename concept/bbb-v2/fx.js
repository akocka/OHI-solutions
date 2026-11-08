/* Big Big Boon preview · interaction layer (homepage + inner pages) */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  /* 1 · amber light in every section (dark and cream): follows the cursor on desktop and swells while it moves, drifts by itself on phones */
  var lum = function (el) { var c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g); if (!c || (c[3] !== undefined && +c[3] < .05)) return -1; return (.2126 * c[0] + .7152 * c[1] + .0722 * c[2]) / 255; };
  $$('main > section, body > section, .sec, .hero, footer').forEach(function (sec) {
    if (sec.classList.contains('b3') || sec.querySelector(':scope > .fx-glow')) return;
    var L = lum(sec); if (L < 0) return;
    if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
    sec.classList.add('fx-host'); if (L > .55) sec.classList.add('fx-light');
    var g = document.createElement('div'); g.className = 'fx-glow'; g.setAttribute('aria-hidden', 'true');
    sec.insertBefore(g, sec.firstChild);
    if (!fine || reduce) return;
    var lx = 0, ly = 0, lt = 0, sc = 1, dec = 0;
    sec.addEventListener('pointermove', function (e) {
      var r = sec.getBoundingClientRect(), now = performance.now();
      g.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      g.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      var v = Math.hypot(e.clientX - lx, e.clientY - ly) / Math.max(16, now - lt); lx = e.clientX; ly = e.clientY; lt = now;
      sc = Math.min(1.45, Math.max(sc, 1 + v * .35)); g.style.setProperty('--ms', sc.toFixed(3)); g.style.setProperty('--mo', '1');
      clearTimeout(dec); dec = setTimeout(function () { sc = 1; g.style.setProperty('--ms', '1'); }, 140);
    });
    sec.addEventListener('pointerleave', function () { g.style.setProperty('--mo', '.75'); g.style.setProperty('--ms', '.9'); });
  });

  /* 1c · cream sections: a field of small "scales" (dots) that pop out bigger and turn amber around the cursor */
  var DPR = Math.min(2, devicePixelRatio || 1);
  $$('.fx-light').forEach(function (sec) {
    var host = sec.querySelector(':scope > .fx-glow'); if (!host) return;
    var cv = document.createElement('canvas'); cv.className = 'fx-dots'; host.appendChild(cv);
    var ctx = cv.getContext('2d'), W = 0, H = 0, pts = [], mx = -999, my = -999, tx = -999, ty = -999, on = false, vis = false, raf = 0, t0 = performance.now();
    var GAP = innerWidth < 700 ? 24 : 30, R = innerWidth < 700 ? 120 : 170;
    function size() { var r = sec.getBoundingClientRect(); W = Math.ceil(r.width); H = Math.ceil(r.height); cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      pts = []; for (var y = GAP / 2; y < H; y += GAP) for (var x = GAP / 2 + ((y / GAP | 0) % 2 ? GAP / 2 : 0); x < W; x += GAP) pts.push([x, y, 0]); draw(); }
    function draw() {
      ctx.clearRect(0, 0, W, H); var any = false;
      for (var i = 0; i < pts.length; i++) { var p = pts[i], d = Math.hypot(p[0] - mx, p[1] - my), k = d < R ? 1 - d / R : 0; k = k * k * (3 - 2 * k);
        p[2] += (k - p[2]) * .18; if (p[2] > .01) any = true; var e = p[2];
        var rad = 1.1 + e * 4.6;
        ctx.fillStyle = e > .02 ? 'rgba(' + (74 + (47 - 74) * e | 0) + ',' + (67 + (111 - 67) * e | 0) + ',' + (60 + (219 - 60) * e | 0) + ',' + (.16 + .7 * e).toFixed(3) + ')' : 'rgba(74,67,60,.16)';
        ctx.beginPath(); ctx.arc(p[0], p[1], rad, 0, 6.2832); ctx.fill(); }
      return any;
    }
    function loop(now) {
      if (!fine && !reduce) { var t = (now - t0) / 1000; tx = W * (.5 + .38 * Math.sin(t * .45)); ty = H * (.5 + .34 * Math.sin(t * .31 + 1)); on = true; }
      mx += (tx - mx) * .2; my += (ty - my) * .2;
      var any = draw();
      if (vis && (on || any)) raf = requestAnimationFrame(loop); else raf = 0;
    }
    var kick = function () { if (!raf && vis) raf = requestAnimationFrame(loop); };
    if (fine) {
      sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; if (!on) { mx = tx; my = ty; } on = true; kick(); });
      sec.addEventListener('pointerleave', function () { on = false; tx = ty = -999; kick(); });
    }
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) { if (!W) size(); kick(); } }, { rootMargin: '100px' }).observe(sec);
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 200); });
    if (window.ResizeObserver) new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(size, 200); }).observe(sec);
  });

  /* 1b · hero depth: module and lights move with the cursor (desktop) or with scroll (phone) */
  var oh = document.querySelector('.oh');
  if (oh && !reduce) {
    if (fine) oh.addEventListener('pointermove', function (e) { var r = oh.getBoundingClientRect(); oh.style.setProperty('--hx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3)); oh.style.setProperty('--hy', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3)); });
    else addEventListener('scroll', function () { var k = Math.min(1, scrollY / innerHeight); oh.style.setProperty('--hy', (k * 1.5).toFixed(3)); oh.style.setProperty('--hx', (Math.sin(k * 3) * .6).toFixed(3)); }, { passive: true });
  }

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
  var cards = $$('.card, .plan, .pc-card, .post, .gl-g figure, .tm, .lo-card, .fd-ph');
  cards.forEach(function (c) {
    c.classList.add('fx-zoom');
    var im = c.querySelector('img'); if (im) { im.classList.add('fx-zi'); if (im.parentElement !== c) im.parentElement.classList.add('fx-zpar'); else c.classList.add('fx-zpar'); }
    if (fine) { c.addEventListener('pointerenter', function () { c.classList.add('fx-on'); }); c.addEventListener('pointerleave', function () { c.classList.remove('fx-on'); }); }
  });
  if (!fine && !reduce && 'IntersectionObserver' in window) {
    // phones: the card in the middle of the screen zooms in
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('fx-on', e.isIntersecting); }); }, { rootMargin: '-38% 0px -38% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }
  $$('[data-b3f], .chips button').forEach(function (o) { o.classList.add('fx-pick'); });
})();
