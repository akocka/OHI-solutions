// Personalizate: pick features, they collect in the side panel, the button sends the list to the demo form.
(function () {
  var feats = [].slice.call(document.querySelectorAll('.x-f')), list = document.getElementById('cartList'), n = document.getElementById('cartN'),
      w = document.getElementById('cartW'), go = document.getElementById('cartGo'), cart = document.getElementById('cart');
  function upd() {
    var on = feats.filter(function (f) { return f.getAttribute('aria-pressed') === 'true'; }).map(function (f) { return f.dataset.k; });
    list.innerHTML = on.length ? on.map(function (k) { return '<li>' + k + '</li>'; }).join('') : '<li class="empty">Nicio funcție aleasă încă.</li>';
    n.textContent = on.length; w.textContent = on.length === 1 ? 'funcție aleasă' : 'funcții alese';
    go.href = '/?pachet=Business' + (on.length ? '&extra=' + encodeURIComponent(on.join(', ')) : '') + '#oferta';
    go.firstChild.textContent = on.length ? 'Cere oferta pentru ' + on.length + (on.length === 1 ? ' funcție' : ' funcții') : 'Cere oferta';
    cart.classList.remove('bump'); void cart.offsetWidth; if (on.length) cart.classList.add('bump');
  }
  feats.forEach(function (f) { f.addEventListener('click', function () { f.setAttribute('aria-pressed', f.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); upd(); }); });
  upd();
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }); rv.forEach(function (el) { io.observe(el); }); }
  else rv.forEach(function (el) { el.classList.add('in'); });
})();
