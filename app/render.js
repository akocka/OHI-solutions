/* OHI site renderer. render(model, {edit, sel}) draws a whole site from a brand kit + a list of blocks.
   Used for the live preview in the editor and in the dashboard; the real platform runs the same code for the public site. */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var FONTS = {
    fraunces: ['Fraunces', 500, '-.02em'], playfair: ['Playfair Display', 600, '-.01em'], cormorant: ['Cormorant Garamond', 600, '-.01em'],
    instrument: ['Instrument Serif', 400, '-.01em'], archivo: ['Archivo', 700, '-.03em'], manrope: ['Manrope', 700, '-.03em'],
    inter: ['Inter', 650, '-.03em'], dmsans: ['DM Sans', 650, '-.03em'], poppins: ['Poppins', 600, '-.02em'], schibsted: ['Schibsted Grotesk', 650, '-.03em']
  };
  var lum = function (hex) {
    var h = String(hex || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var v = [0, 2, 4].map(function (i) { var c = parseInt(h.substr(i, 2), 16) / 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); });
    return .2126 * v[0] + .7152 * v[1] + .0722 * v[2];
  };
  var on = function (hex) { return lum(hex) > .42 ? '#141311' : '#FFFFFF'; };
  var vars = function (b) {
    var hf = FONTS[b.headFont] || FONTS.fraunces, bf = FONTS[b.bodyFont] || FONTS.inter, c = b.colors;
    var br = { pill: '999px', round: Math.max(6, b.radius) + 'px', square: '0px' }[b.btnShape] || '999px';
    return {
      '--c-bg': c.bg, '--c-ink': c.ink, '--c-mute': c.mute, '--c-surface': c.surface, '--c-accent': c.accent, '--c-dark': c.dark,
      '--c-on-accent': on(c.accent), '--c-on-dark': on(c.dark),
      '--f-head': '"' + hf[0] + '",Georgia,serif', '--w-head': hf[1], '--ls-head': hf[2], '--f-body': '"' + bf[0] + '",system-ui,sans-serif',
      '--r': b.radius + 'px', '--btn-r': br, '--sp': { compact: '56px', normal: '88px', airy: '128px' }[b.density] || '88px',
      '--maxw': '1160px', '--an-d': { slow: '1.1s', normal: '.7s', fast: '.4s' }[b.animSpeed] || '.7s'
    };
  };
  var LABEL = { nav: 'Meniu', hero: 'Început', features: 'Avantaje', prices: 'Prețuri', gallery: 'Galerie', faq: 'Întrebări', hours: 'Program și contact', cta: 'Îndemn', booking: 'Plugin · Programări', calc: 'Plugin · Calculator rate', footer: 'Subsol' };
  var img = function (src, label, cls) { return '<div class="media ' + (cls || '') + '">' + (src ? '<img src="' + esc(src) + '" alt="">' : '<div class="ph">' + esc(label || 'Imagine') + '</div>') + '</div>'; };
  var t = function (tag, path, val, cls) { return '<' + tag + (cls ? ' class="' + cls + '"' : '') + ' data-t="' + path + '">' + esc(val) + '</' + tag + '>'; };
  var btns = function (d) {
    return (d.btn || d.btn2) ? '<div class="btns an">' + (d.btn ? '<a class="bt p" href="#" data-t="btn">' + esc(d.btn) + '</a>' : '') + (d.btn2 ? '<a class="bt s" href="#" data-t="btn2">' + esc(d.btn2) + '</a>' : '') + '</div>' : '';
  };
  var head = function (d) { return (d.kicker ? t('span', 'kicker', d.kicker, 'kick an') : '') + (d.title ? t('h2', 'title', d.title, 'h2 an') : '') + (d.text ? t('p', 'text', d.text, 'lead an') : ''); };

  var B = {
    nav: function (d, m) {
      var links = m.blocks.filter(function (x) { return !x.hidden && x.d && x.d.navLabel; }).map(function (x) { return '<li><a href="#' + x.id + '">' + esc(x.d.navLabel) + '</a></li>'; }).join('');
      return '<div class="w"><b data-t="logo">' + esc(d.logo || m.brand.name) + '</b><ul>' + links + '</ul>' + (d.btn ? '<a class="bt p" href="#" data-t="btn">' + esc(d.btn) + '</a>' : '') + '</div>';
    },
    hero: function (d, m, b) {
      var text = '<div class="al">' + (d.kicker ? t('span', 'kicker', d.kicker, 'kick an') : '') + t('h1', 'title', d.title, 'an') + t('p', 'text', d.text, 'lead an') + btns(d) + '</div>';
      if (b.v === 'cover') return img(d.img, 'Imagine mare de fundal', 'bgimg') + '<div class="w">' + text + '</div>';
      if (b.v === 'center') return '<div class="w">' + text + '<div class="an">' + img(d.img, 'Imagine lată') + '</div></div>';
      return '<div class="w"><div class="grid">' + text + '<div class="an">' + img(d.img, 'Imaginea principală') + '</div></div></div>';
    },
    features: function (d, m, b) {
      var items = (d.items || []).map(function (it, i) {
        return '<div class="card an">' + (b.v === 'numbers' ? '<span class="num">0' + (i + 1) + '</span>' : '') + t('h3', 'items.' + i + '.t', it.t) + t('p', 'items.' + i + '.x', it.x) + '</div>';
      }).join('');
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="cols" style="--n:' + Math.min(4, Math.max(1, (d.items || []).length)) + '">' + items + '</div></div>';
    },
    prices: function (d) {
      var rows = (d.items || []).map(function (r, i) { return '<div class="pr an">' + t('span', 'items.' + i + '.0', r[0]) + '<i></i>' + t('b', 'items.' + i + '.1', r[1]) + '</div>'; }).join('');
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="plist">' + rows + '</div></div>';
    },
    gallery: function (d) {
      var n = Math.max(3, (d.imgs || []).length), tiles = '';
      for (var i = 0; i < n; i++) tiles += img((d.imgs || [])[i], 'Poza ' + (i + 1), 'an');
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="gal">' + tiles + '</div></div>';
    },
    faq: function (d) {
      var it = (d.items || []).map(function (q, i) { return '<details class="an"' + (i ? '' : ' open') + '><summary data-t="items.' + i + '.q">' + esc(q.q) + '</summary>' + t('p', 'items.' + i + '.a', q.a) + '</details>'; }).join('');
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="faq-l">' + it + '</div></div>';
    },
    hours: function (d, m, b) {
      var rows = (d.hours || []).map(function (r, i) { return '<div class="row">' + t('span', 'hours.' + i + '.0', r[0]) + t('b', 'hours.' + i + '.1', r[1]) + '</div>'; }).join('');
      var left = '<div class="an">' + rows + '<p style="margin:18px 0 4px">' + t('span', 'address', d.address) + '</p><p style="margin:0"><a href="tel:' + esc(String(d.phone || '').replace(/\s/g, '')) + '" data-t="phone">' + esc(d.phone) + '</a></p></div>';
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="hc">' + left + (d.map && b.v !== 'card' ? '<div class="map an">Harta Google apare aici</div>' : '') + '</div></div>';
    },
    cta: function (d, m, b) {
      var inner = '<div class="al">' + t('h2', 'title', d.title, 'h2 an') + t('p', 'text', d.text, 'lead an') + btns(d) + '</div>';
      return '<div class="w">' + (b.v === 'card' ? '<div class="box">' + inner + '</div>' : inner) + '</div>';
    },
    booking: function (d) {
      var sv = (d.services || []).map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
      var slots = ['10:00', '11:30', '13:00', '15:30', '17:00'].map(function (h, i) { return '<button type="button"' + (i === 1 ? ' class="on"' : '') + '>' + h + '</button>'; }).join('');
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="plug an"><label>Serviciul</label><select>' + sv + '</select><label style="margin-top:16px">Ora, mâine</label><div class="slots">' + slots + '</div><a class="bt p" href="#">' + esc(d.btn || 'Programează-mă') + '</a><p class="note">Confirmarea vine pe telefon. Plata online se poate porni din pluginul Plăți.</p></div></div>';
    },
    calc: function (d) {
      var def = d.def || 30000;
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="plug an" data-calc><label>Valoarea: <span data-cv>' + def.toLocaleString('ro-RO') + ' lei</span></label><input type="range" min="' + (d.min || 5000) + '" max="' + (d.max || 150000) + '" step="1000" value="' + def + '">' +
        '<div class="slots" style="margin-top:16px">' + [6, 12, 24, 36].map(function (n) { return '<button type="button" data-n="' + n + '"' + (n === 12 ? ' class="on"' : '') + '>' + n + ' luni</button>'; }).join('') + '</div>' +
        '<div class="calc-v" data-cr></div><p class="note">Calcul orientativ, fără dobândă. Rata finală o stabilește partenerul de finanțare.</p></div></div>';
    },
    footer: function (d, m) { return '<div class="w"><span><b data-t="name">' + esc(d.name || m.brand.name) + '</b> · ' + esc(d.line || '') + '</span><span>© 2026 · Site găzduit de OHI</span></div>'; }
  };

  function render(model, opts) {
    opts = opts || {};
    var root = document.getElementById('site'), b = model.brand, v = vars(b);
    Object.keys(v).forEach(function (k) { document.documentElement.style.setProperty(k, v[k]); });
    document.body.classList.toggle('edit', !!opts.edit);
    root.innerHTML = model.blocks.map(function (blk) {
      if (blk.hidden && !opts.edit) return '';
      var s = blk.s || {}, an = s.anim && s.anim !== 'inherit' ? s.anim : b.anim, bs = s.btn && s.btn !== 'inherit' ? s.btn : b.btnStyle;
      var cls = blk.type === 'nav' ? 'nav' : blk.type === 'footer' ? 'foot' : 'blk ' + blk.type;
      var attrs = ' id="' + blk.id + '" data-id="' + blk.id + '" data-label="' + esc(LABEL[blk.type] || blk.type) + '" data-v="' + esc(blk.v || '') + '" data-bg="' + esc(s.bg || 'bg') + '" data-pad="' + esc(s.pad || 'm') + '" data-al="' + esc(s.align || 'left') + '" data-w="' + esc(s.width || 'normal') + '" data-img="' + esc(s.img || 'right') + '" data-an="' + esc(an === 'none' ? '' : an) + '" data-bs="' + esc(bs) + '"' + (s.fx && s.fx !== 'none' && blk.type !== 'nav' ? ' data-fx="' + esc(s.fx) + '"' : '');
      var html = (B[blk.type] || function () { return ''; })(blk.d || {}, model, blk);
      return '<section class="' + cls + (blk.hidden ? ' hidden-blk' : '') + (opts.sel === blk.id ? ' sel' : '') + '"' + attrs + '>' + html + '</section>';
    }).join('');
    wireCalc(); reveal(!!opts.replay); fxInit();
  }
  function wireCalc() {
    [].forEach.call(document.querySelectorAll('[data-calc]'), function (c) {
      var r = c.querySelector('input'), n = 12;
      var upd = function () { var v = +r.value; c.querySelector('[data-cv]').textContent = v.toLocaleString('ro-RO') + ' lei'; c.querySelector('[data-cr]').textContent = 'aprox. ' + Math.round(v / n).toLocaleString('ro-RO') + ' lei / lună'; };
      r.addEventListener('input', upd);
      c.addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; n = +b.dataset.n; [].forEach.call(c.querySelectorAll('[data-n]'), function (x) { x.classList.toggle('on', x === b); }); upd(); });
      upd();
    });
  }
  var io = null;
  function reveal(replay) {
    var els = [].slice.call(document.querySelectorAll('.an'));
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12 });
    els.forEach(function (e) { if (replay) e.classList.remove('in'); io.observe(e); });
  }

  /* scroll effects per section: --fx runs from -0.5 (section entering at the bottom) to 0.5 (leaving at the top),
     --fxp from 0 to 1 while the section enters. CSS turns these into movement with the translate/scale properties,
     so they never fight the appear animations, which use transform. */
  var fxEls = [], fxTick = false;
  function fxRun() {
    fxTick = false; var vh = innerHeight;
    fxEls.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return;
      var p = (vh - r.top) / (vh + r.height), e = Math.min(1, Math.max(0, (vh - r.top) / (vh * .9)));
      el.style.setProperty('--fx', (Math.min(1, Math.max(0, p)) - .5).toFixed(4)); el.style.setProperty('--fxp', e.toFixed(4));
    });
  }
  function fxInit() {
    fxEls = [].slice.call(document.querySelectorAll('[data-fx]'));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) fxEls = [];
    fxRun();
  }
  addEventListener('scroll', function () { if (!fxTick) { fxTick = true; requestAnimationFrame(fxRun); } }, { passive: true });
  addEventListener('resize', fxRun);

  /* editing: click selects a block, double-click edits text in place */
  document.addEventListener('click', function (e) {
    if (!document.body.classList.contains('edit')) return;
    if (e.target.closest('a')) e.preventDefault();
    if (e.target.closest('[contenteditable=true]')) return;
    var b = e.target.closest('[data-id]'); var P = window.parent && window.parent.__ohiBuilder;
    if (b && P) P.select(b.dataset.id);
  });
  document.addEventListener('dblclick', function (e) {
    if (!document.body.classList.contains('edit')) return;
    var el = e.target.closest('[data-t]'), b = e.target.closest('[data-id]'); if (!el || !b) return;
    e.preventDefault(); el.contentEditable = 'true'; el.focus();
    var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r);
    var done = function () { el.contentEditable = 'false'; el.removeEventListener('blur', done); var P = window.parent && window.parent.__ohiBuilder; if (P) P.setText(b.dataset.id, el.dataset.t, el.textContent.trim()); };
    el.addEventListener('blur', done);
    el.addEventListener('keydown', function (k) { if (k.key === 'Enter' && el.tagName !== 'P') { k.preventDefault(); el.blur(); } if (k.key === 'Escape') el.blur(); });
  });

  window.OHIRender = { render: render, labels: LABEL, fonts: FONTS };
  if (window.parent && window.parent !== window && window.parent.__ohiRenderReady) window.parent.__ohiRenderReady(window);
  else {
    /* stand-alone preview: /app/render.html?site=<id> shows the saved demo site full-screen */
    var id = new URLSearchParams(location.search).get('site');
    try { var st = JSON.parse(localStorage.getItem('ohi-demo-v1') || 'null'); var s = st && st.sites.filter(function (x) { return x.id === id; })[0]; if (s && s.model) { document.title = s.name; render(s.model, {}); } } catch (e) { /* nothing saved in this browser */ }
  }
})();
