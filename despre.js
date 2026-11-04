// About page: manifesto words light up with scroll, step progress line, count-up facts, reveals.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mf = document.getElementById('abMf');
  if (mf && !reduce) {
    var HOT = ['site', 'gata', 'numele', 'bani.', 'merită'];
    mf.innerHTML = mf.textContent.trim().split(/\s+/).map(function (w) { var h = HOT.some(function (k) { return w.toLowerCase().indexOf(k) === 0; }); return '<span class="w' + (h ? ' h' : '') + '">' + w + '</span>'; }).join(' ');
    var words = mf.querySelectorAll('.w'), track = mf.closest('.ab-mftrack'), bar = document.getElementById('abMfBar');
    var tick = false;
    var upd = function () {
      tick = false; var r = track.getBoundingClientRect(), m = r.height - innerHeight, p = Math.min(1, Math.max(0, -r.top / m));
      var n = Math.round(p * 1.15 * words.length);
      for (var i = 0; i < words.length; i++) { var on = i < n; words[i].classList.toggle('on', on); words[i].classList.toggle('hot', on && words[i].classList.contains('h')); }
      bar.style.width = (p * 100) + '%';
    };
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }
  var steps = document.getElementById('abSteps'), prog = document.getElementById('abProg');
  if (steps && prog) {
    var t2 = false;
    var up2 = function () { t2 = false; var r = steps.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height)); prog.style.height = (p * 100) + '%'; };
    addEventListener('scroll', function () { if (!t2) { t2 = true; requestAnimationFrame(up2); } }, { passive: true }); up2();
  }
  function count(el) { var to = +el.dataset.to, t0 = performance.now(), d = reduce ? 0 : 900; (function s(t) { var k = d ? Math.min(1, (t - t0) / d) : 1; el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(s); })(t0); }
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); var b = e.target.querySelector('b[data-to]'); if (b) count(b); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); document.querySelectorAll('b[data-to]').forEach(function (b) { b.textContent = b.dataset.to; }); }
})();
