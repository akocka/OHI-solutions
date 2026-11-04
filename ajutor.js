// Ajutor: live search and topic filter over the questions.
(function () {
  var q = document.getElementById('qSearch'), items = [].slice.call(document.querySelectorAll('#faq details')), cats = [].slice.call(document.querySelectorAll('.x-cats button')),
      none = document.getElementById('none'), noneQ = document.getElementById('noneQ'), cat = 'all';
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  items.forEach(function (d) { d.dataset.t = norm(d.textContent); });
  function run() {
    var t = norm(q.value.trim()), words = t.split(/\s+/).filter(Boolean), shown = 0;
    items.forEach(function (d) {
      var ok = (cat === 'all' || d.dataset.c === cat) && words.every(function (w) { return d.dataset.t.indexOf(w) > -1; });
      d.hidden = !ok; if (ok) shown++;
      if (ok && words.length && shown === 1) d.open = true;
    });
    none.hidden = shown > 0; noneQ.textContent = q.value.trim();
  }
  q.addEventListener('input', run);
  cats.forEach(function (b) { b.addEventListener('click', function () { cat = b.dataset.c; cats.forEach(function (x) { x.classList.toggle('on', x === b); }); run(); }); });
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }); rv.forEach(function (el) { io.observe(el); }); }
  else rv.forEach(function (el) { el.classList.add('in'); });
})();
