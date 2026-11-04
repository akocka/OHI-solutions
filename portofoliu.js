// Portfolio: the sphere reveals its title when on screen; vertical scroll slides the projects sideways.
(function () {
  var stage = document.getElementById('pfStage');
  if (stage) setTimeout(function () { stage.classList.add('on'); }, 1300);
  var run = document.getElementById('pfRun'), rail = document.getElementById('pfRail'), prog = document.getElementById('pfProg'), now = document.getElementById('pfNow');
  var slides = rail ? [].slice.call(rail.children) : [];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, wide = matchMedia('(min-width: 901px)');
  var cur = -1, tick = false;
  function play(i) {
    slides.forEach(function (s, k) {
      var v = s.querySelector('video'); s.classList.toggle('on', k === i);
      if (k === i) { if (!v.src) v.src = v.dataset.src; if (!reduce) v.play().catch(function () {}); } else v.pause();
    });
    if (now) now.textContent = String(i + 1).padStart(2, '0');
  }
  function upd() {
    tick = false;
    if (!wide.matches) return;
    var r = run.getBoundingClientRect(), m = r.height - innerHeight, p = Math.min(1, Math.max(0, -r.top / m));
    var max = rail.scrollWidth - innerWidth;
    rail.style.transform = 'translate3d(' + (-p * max).toFixed(1) + 'px,0,0)';
    prog.style.width = (p * 100) + '%';
    var i = Math.min(slides.length - 1, Math.round(p * (slides.length - 1)));
    if (i !== cur) { cur = i; play(i); }
  }
  if (run) {
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
    // phones: projects are stacked; each video plays while it is on screen
    if ('IntersectionObserver' in window) {
      var po = new IntersectionObserver(function (es) {
        if (wide.matches) return;
        es.forEach(function (e) { var v = e.target.querySelector('video');
          if (e.isIntersecting) { e.target.classList.add('on'); if (!v.src) v.src = v.dataset.src; if (!reduce) v.play().catch(function () {}); } else v.pause(); });
      }, { threshold: .4 });
      slides.forEach(function (s) { po.observe(s); });
    }
  }
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });
})();
