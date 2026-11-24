/* Renders a client site from its content (used for the live preview inside the dashboard). */
window.renderSite = function (site) {
  var c = site.content, a = site.addons || {};
  var set = function (k, v) { [].forEach.call(document.querySelectorAll('[data-k="' + k + '"]'), function (el) { el.textContent = v; }); };
  set('name', site.name); set('heroTitle', c.heroTitle); set('heroText', c.heroText); set('about', c.about); set('address', c.address);
  set('footer', '© 2026 ' + site.name + ' · ' + c.phone);
  var ph = document.querySelector('[data-k="phoneLink"]'); ph.textContent = c.phone; ph.href = 'tel:' + c.phone.replace(/\s/g, '');
  var rows = function (id, list) { var box = document.getElementById(id); box.textContent = ''; list.forEach(function (r) { if (!r[0] && !r[1]) return; var d = document.createElement('div'); d.className = 'li'; var x = document.createElement('span'); x.textContent = r[0]; var y = document.createElement('span'); y.textContent = r[1]; d.appendChild(x); d.appendChild(y); box.appendChild(d); }); };
  rows('prices', c.prices); rows('hours', c.hours);
  document.getElementById('preturi').querySelector('.cols > div').classList.toggle('hide', !a.prices);
  document.getElementById('map').classList.toggle('hide', !a.map);
  document.getElementById('programare').classList.toggle('hide', !a.booking);
  document.getElementById('ctaBook').classList.toggle('hide', !a.booking);
};
if (window.parent && window.parent !== window && window.parent.__ohiPreviewReady) window.parent.__ohiPreviewReady(window);
