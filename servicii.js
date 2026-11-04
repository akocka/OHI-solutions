// Services page: opens one service in the panel over the hero (after the glass shatters), keyboard friendly.
(function () {
  var stage = document.getElementById('svStage'), panel = document.getElementById('svDetail'), body = document.getElementById('svdBody');
  if (!stage || !panel) return;
  var items = [].slice.call(document.querySelectorAll('.sv-item')), cur = 0, isOpen = false, lastFocus = null;
  function fill(i) {
    cur = (i + items.length) % items.length;
    var a = items[cur];
    body.innerHTML = '<p class="sv-dnum">' + a.dataset.n + (a.classList.contains('soon') ? ' · În curând' : '') + '</p>' +
      '<h2 id="svdT">' + a.querySelector('h3').innerHTML + '</h2>' + a.querySelector('.sv-main').innerHTML.replace(/<h3[\s\S]*?<\/h3>/, '') +
      '<div class="sv-dside">' + a.querySelector('.sv-side').innerHTML + '</div>';
    document.getElementById('svCount').textContent = (cur + 1) + ' / ' + items.length;
  }
  function open(i, fromGlass) {
    fill(i); lastFocus = document.activeElement;
    var g = window.__svGlass, shattered = g && g.shatter(i);
    var show = function () { panel.hidden = false; requestAnimationFrame(function () { panel.classList.add('on'); }); stage.classList.add('sv-open'); isOpen = true; document.getElementById('svBack').focus({ preventScroll: true }); };
    if (shattered) setTimeout(show, 380); else if (!isOpen) show();
  }
  function close() {
    if (!isOpen) return; isOpen = false;
    panel.classList.remove('on'); stage.classList.remove('sv-open');
    setTimeout(function () { panel.hidden = true; }, 300);
    if (window.__svGlass) window.__svGlass.back();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  window.__svOpen = open;
  document.querySelectorAll('[data-open]').forEach(function (b) { b.addEventListener('click', function () { open(+b.dataset.open); }); });
  document.getElementById('svBack').addEventListener('click', close);
  document.getElementById('svPrev').addEventListener('click', function () { fill(cur - 1); });
  document.getElementById('svNext').addEventListener('click', function () { fill(cur + 1); });
  addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') fill(cur + 1);
    if (e.key === 'ArrowLeft') fill(cur - 1);
  });
  // list below: reveal on scroll
  var rv = document.querySelectorAll('.sv-item,.sv-end .sv-wrap');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });
})();
