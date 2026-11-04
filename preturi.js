// Prices page: payback calculator (animated numbers), reveal on scroll.
(function () {
  var seg = [].slice.call(document.querySelectorAll('.pr-seg button')), range = document.getElementById('cVal');
  if (range) {
    var out = document.getElementById('cValOut'), N = document.getElementById('cN'), word = document.getElementById('cWord'),
        name = document.getElementById('cName'), day = document.getElementById('cDay'), price = 500, shownN = 3, shownD = 1.37, raf = null;
    var fmt = function (n, d) { return n.toLocaleString('ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d }); };
    function paintRange() { var p = (range.value - range.min) / (range.max - range.min) * 100; range.style.setProperty('--p', p + '%'); }
    function calc(animate) {
      var v = +range.value, n = Math.max(1, Math.ceil(price / v)), d = price / 365;
      out.textContent = fmt(v, 0) + ' lei';
      word.textContent = n === 1 ? 'client nou' : 'clienți noi';
      paintRange();
      cancelAnimationFrame(raf);
      var n0 = shownN, d0 = shownD, t0 = performance.now(), dur = animate ? 420 : 0;
      (function step(t) {
        var k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
        shownN = n0 + (n - n0) * e; shownD = d0 + (d - d0) * e;
        N.textContent = Math.round(shownN); day.textContent = fmt(shownD, 2) + ' lei / zi';
        if (k < 1) raf = requestAnimationFrame(step); else { shownN = n; shownD = d; }
      })(t0);
    }
    range.addEventListener('input', function () { calc(true); });
    seg.forEach(function (b) {
      b.addEventListener('click', function () {
        seg.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        price = +b.dataset.price; name.textContent = b.dataset.name; calc(true);
        document.getElementById('calc').classList.toggle('biz', b.dataset.name === 'Business');
      });
    });
    calc(false);
  }
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });
})();
