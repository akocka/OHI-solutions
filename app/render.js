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
  var LABEL = { nav: 'Meniu', hero: 'Început', features: 'Avantaje', prices: 'Prețuri', gallery: 'Galerie', faq: 'Întrebări', hours: 'Program și contact', cta: 'Îndemn', booking: 'Plugin · Programări', calc: 'Plugin · Calculator rate', footer: 'Subsol', text: 'Text', form: 'Formular', blog: 'Noutăți', reviews: 'Recenzii', team: 'Echipa', article: 'Articol' };
  var CTX = { opts: {}, model: null };
  /* links between pages: the public site uses /slug, the stand-alone preview uses ?site=..&p=slug */
  var href = function (kind, slug) { var f = CTX.opts.href; if (f) return f(kind, slug); return kind === 'home' ? '?site=' + encodeURIComponent(CTX.opts.siteId || '') : '?site=' + encodeURIComponent(CTX.opts.siteId || '') + '&' + (kind === 'post' ? 'post' : 'p') + '=' + encodeURIComponent(slug); };
  var paras = function (txt) { return String(txt || '').split(/\n\s*\n/).map(function (p) { p = p.trim(); if (!p) return ''; return /^##\s+/.test(p) ? '<h3>' + esc(p.replace(/^##\s+/, '')) + '</h3>' : '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join(''); };
  var fmtDate = function (d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };
  var img = function (src, label, cls) { return '<div class="media ' + (cls || '') + '">' + (src ? '<img src="' + esc(src) + '" alt="">' : '<div class="ph">' + esc(label || 'Imagine') + '</div>') + '</div>'; };
  var t = function (tag, path, val, cls) { return '<' + tag + (cls ? ' class="' + cls + '"' : '') + ' data-t="' + path + '">' + esc(val) + '</' + tag + '>'; };
  var btns = function (d) {
    return (d.btn || d.btn2) ? '<div class="btns an">' + (d.btn ? '<a class="bt p" href="#" data-t="btn">' + esc(d.btn) + '</a>' : '') + (d.btn2 ? '<a class="bt s" href="#" data-t="btn2">' + esc(d.btn2) + '</a>' : '') + '</div>' : '';
  };
  var head = function (d) { return (d.kicker ? t('span', 'kicker', d.kicker, 'kick an') : '') + (d.title ? t('h2', 'title', d.title, 'h2 an') : '') + (d.text ? t('p', 'text', d.text, 'lead an') : ''); };

  var B = {
    nav: function (d, m) {
      var pages = (m.pages || []).filter(function (p) { return p.nav !== false; }), cur = CTX.page ? CTX.page.slug : '';
      var links = pages.length ? '<li><a href="' + esc(href('home')) + '" data-page=""' + (!cur && !CTX.post ? ' aria-current="page"' : '') + '>Acasă</a></li>' + pages.map(function (p) { return '<li><a href="' + esc(href('page', p.slug)) + '" data-page="' + esc(p.slug) + '"' + (cur === p.slug ? ' aria-current="page"' : '') + '>' + esc(p.title) + '</a></li>'; }).join('')
        : m.blocks.filter(function (x) { return !x.hidden && x.d && x.d.navLabel; }).map(function (x) { return '<li><a href="#' + x.id + '">' + esc(x.d.navLabel) + '</a></li>'; }).join('');
      return '<div class="w"><b data-t="logo">' + esc(d.logo || m.brand.name) + '</b>' + (links ? '<button class="mnu" type="button" aria-expanded="false" aria-label="Meniu"><span></span><span></span></button>' : '') + '<ul>' + links + '</ul>' + (d.btn ? '<a class="bt p" href="#" data-t="btn">' + esc(d.btn) + '</a>' : '') + '</div>';
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
    text: function (d, m, b) {
      var h = (d.kicker ? t('span', 'kicker', d.kicker, 'kick an') : '') + (d.title ? t('h2', 'title', d.title, 'h2 an') : '');
      return '<div class="w">' + (b.v === 'two' ? '<div class="tx2"><div class="al">' + h + '</div><div class="prose an">' + paras(d.body) + '</div></div>' : '<div class="al">' + h + '<div class="prose an">' + paras(d.body) + '</div></div>') + '</div>';
    },
    form: function (d, m, b) {
      var f = (d.fields || []).map(function (x, i) {
        var id = 'f' + b.id + i, req = x.r ? ' required' : '', lab = '<label for="' + id + '">' + esc(x.l) + (x.r ? ' *' : '') + '</label>';
        var ctl = x.t === 'area' ? '<textarea id="' + id + '" name="' + esc(x.l) + '" rows="4"' + req + '></textarea>'
          : x.t === 'select' ? '<select id="' + id + '" name="' + esc(x.l) + '"' + req + '>' + String(x.o || '').split(',').map(function (o) { return '<option>' + esc(o.trim()) + '</option>'; }).join('') + '</select>'
          : x.t === 'check' ? '' : '<input id="' + id + '" name="' + esc(x.l) + '" type="' + ({ tel: 'tel', email: 'email', date: 'date', num: 'number' }[x.t] || 'text') + '"' + (x.t === 'tel' ? ' autocomplete="tel" inputmode="tel"' : x.t === 'email' ? ' autocomplete="email"' : x.t === 'text' && i === 0 ? ' autocomplete="name"' : '') + req + '>';
        return x.t === 'check' ? '<label class="ck"><input type="checkbox" name="' + esc(x.l) + '"' + req + '> ' + esc(x.l) + '</label>' : '<div class="fld">' + lab + ctl + '</div>';
      }).join('');
      var form = '<form class="plug an ohi-form" data-form="' + b.id + '" novalidate>' + f + '<input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<button class="bt p" type="submit" data-t="btn">' + esc(d.btn || 'Trimite') + '</button>' + (d.consent ? '<p class="note">' + esc(d.consent) + '</p>' : '') + '<p class="ok" role="status" hidden>' + esc(d.ok) + '</p></form>';
      return '<div class="w">' + (b.v === 'split' ? '<div class="fsplit"><div class="al">' + head(d) + '</div>' + form + '</div>' : '<div class="al">' + head(d) + '</div>' + form) + '</div>';
    },
    blog: function (d, m, b) {
      var posts = (m.posts || []).filter(function (p) { return p.published || CTX.opts.edit; }).sort(function (a, c) { return a.date < c.date ? 1 : -1; }).slice(0, Math.max(1, Math.min(24, +d.count || 3)));
      var cards = posts.length ? posts.map(function (p) {
        return '<a class="post an" href="' + esc(href('post', p.slug)) + '" data-post="' + esc(p.slug) + '">' + (b.v === 'list' ? '' : img(p.cover, 'Copertă')) + '<span class="pd">' + esc(fmtDate(p.date)) + (p.published ? '' : ' · ciornă') + '</span><b>' + esc(p.title) + '</b>' + (p.excerpt ? '<span class="px">' + esc(p.excerpt) + '</span>' : '') + '</a>';
      }).join('') : '<p class="empty an">Primele articole apar aici după ce le publici.</p>';
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="posts ' + (b.v === 'list' ? 'pl' : '') + '">' + cards + '</div></div>';
    },
    reviews: function (d, m, b) {
      var it = (d.items || []).map(function (r, i) { return '<figure class="rv an"><blockquote data-t="items.' + i + '.x">' + esc(r.x) + '</blockquote><figcaption data-t="items.' + i + '.t">' + esc(r.t) + '</figcaption></figure>'; });
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="' + (b.v === 'quote' ? 'rv1' : 'cols') + '" style="--n:' + Math.min(3, Math.max(1, it.length)) + '">' + (b.v === 'quote' ? it.slice(0, 1) : it).join('') + '</div></div>';
    },
    team: function (d) {
      var it = (d.items || []).map(function (p, i) { return '<div class="card an tm"><span class="tav">' + esc(String(p.t || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase()) + '</span>' + t('h3', 'items.' + i + '.t', p.t) + t('p', 'items.' + i + '.x', p.x) + '</div>'; }).join('');
      return '<div class="w"><div class="al">' + head(d) + '</div><div class="cols" style="--n:' + Math.min(4, Math.max(1, (d.items || []).length)) + '">' + it + '</div></div>';
    },
    article: function (d) {
      return '<div class="w art"><a class="back an" href="' + esc(href('home')) + '" data-page="">← Înapoi</a><span class="pd an">' + esc(fmtDate(d.date)) + '</span><h1 class="an">' + esc(d.title) + '</h1>' + (d.cover ? '<div class="an">' + img(d.cover, '') + '</div>' : '') + '<div class="prose an">' + paras(d.body) + '</div></div>';
    },
    footer: function (d, m) { return '<div class="w"><span><b data-t="name">' + esc(d.name || m.brand.name) + '</b> · ' + esc(d.line || '') + '</span><span>© 2026 · Site găzduit de OHI</span></div>'; }
  };

  function render(model, opts) {
    opts = opts || {};
    var root = document.getElementById('site'), b = model.brand, v = vars(b);
    Object.keys(v).forEach(function (k) { document.documentElement.style.setProperty(k, v[k]); });
    document.body.classList.toggle('edit', !!opts.edit);
    /* which page: home (model.blocks), an extra page (shares the home menu and footer) or a blog post */
    var pages = model.pages || [], posts = model.posts || [];
    var pg = opts.page ? pages.filter(function (p) { return p.slug === opts.page || p.id === opts.page; })[0] : null;
    var po = opts.post ? posts.filter(function (p) { return (p.slug === opts.post || p.id === opts.post) && (p.published || opts.edit); })[0] : null;
    var nav = model.blocks.filter(function (x) { return x.type === 'nav'; })[0], foot = model.blocks.filter(function (x) { return x.type === 'footer'; })[0];
    var list = opts.notFound ? [nav, { id: 'nf', type: 'text', v: 'one', d: { kicker: '404', title: 'Pagina nu există', body: 'Poate a fost mutată sau ștearsă. Din meniu ajungi oriunde pe site.' }, s: { bg: 'bg', pad: 'l', align: 'center', width: 'narrow', anim: 'inherit' } }, foot]
      : po ? [nav, { id: 'art', type: 'article', v: '', d: po, s: { bg: 'bg', pad: 'm', align: 'left', width: 'narrow', anim: 'inherit' } }, foot]
      : pg ? [nav].concat(pg.blocks, [foot]) : model.blocks;
    CTX = { opts: opts, model: model, page: pg, post: po };
    var seo = po ? { title: po.title, desc: po.excerpt } : pg ? pg.seo || {} : model.seo || {};
    if (!opts.edit && !opts.keepTitle) { document.title = (seo.title || (pg ? pg.title + ' · ' : '') + b.name) ; var md = document.querySelector('meta[name=description]'); if (!md) { md = document.createElement('meta'); md.name = 'description'; document.head.appendChild(md); } md.content = seo.desc || ''; }
    document.documentElement.lang = (model.settings && model.settings.lang) || 'ro';
    root.innerHTML = list.filter(Boolean).map(function (blk) {
      if (blk.hidden && !opts.edit) return '';
      var s = blk.s || {}, an = s.anim && s.anim !== 'inherit' ? s.anim : b.anim, bs = s.btn && s.btn !== 'inherit' ? s.btn : b.btnStyle;
      var cls = blk.type === 'nav' ? 'nav' : blk.type === 'footer' ? 'foot' : 'blk ' + blk.type;
      var attrs = ' id="' + blk.id + '" data-id="' + blk.id + '" data-label="' + esc(LABEL[blk.type] || blk.type) + '" data-v="' + esc(blk.v || '') + '" data-bg="' + esc(s.bg || 'bg') + '" data-pad="' + esc(s.pad || 'm') + '" data-al="' + esc(s.align || 'left') + '" data-w="' + esc(s.width || 'normal') + '" data-img="' + esc(s.img || 'right') + '" data-an="' + esc(an === 'none' ? '' : an) + '" data-bs="' + esc(bs) + '"' + (s.fx && s.fx !== 'none' && blk.type !== 'nav' ? ' data-fx="' + esc(s.fx) + '"' : '');
      var html = (B[blk.type] || function () { return ''; })(blk.d || {}, model, blk);
      return '<section class="' + cls + (blk.hidden ? ' hidden-blk' : '') + (opts.sel === blk.id ? ' sel' : '') + '"' + attrs + '>' + html + '</section>';
    }).join('') + extras(model, opts);
    wireCalc(); reveal(!!opts.replay); fxInit();
  }
  /* site-wide extras: WhatsApp button and the cookie notice */
  function extras(m, opts) {
    var st = m.settings || {}, out = '', wa = '';
    if (st.wa && st.waPhone) {
      var num = String(st.waPhone).replace(/[^0-9]/g, '').replace(/^0/, '40');
      wa = '<a class="wa" href="https://wa.me/' + esc(num) + '?text=' + encodeURIComponent(st.waText || '') + '" target="_blank" rel="noopener" aria-label="Scrie-ne pe WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.4-4A8 8 0 1 1 8.2 18.6z"/><path d="M9 9.5c.3 1.8 2.2 3.8 4 4.4l1.2-1 1.8.8c-.2 1-1 1.8-2 1.7C11 15 8.5 12.6 8 9.7 7.9 8.7 8.6 8 9.6 7.8l.9 1.8z"/></svg></a>';
    }
    var seen = false; try { seen = !!localStorage.getItem('ohi-cookie-' + (opts.siteId || 'x')); } catch (e) { /* storage off */ }
    if (st.cookie && (opts.edit || !seen)) {
      out += '<div class="ck-bar" role="region" aria-label="Cookie-uri"><p>' + esc(st.cookieText) + '</p><div><button type="button" class="bt s" data-ck="no">Doar necesare</button><button type="button" class="bt p" data-ck="yes">Accept</button></div></div>';
    }
    return out + wa;
  }
  document.addEventListener('click', function (e) {
    var mn = e.target.closest('.mnu');
    if (mn) { var nv = mn.closest('.nav'), open = !nv.classList.contains('open'); nv.classList.toggle('open', open); mn.setAttribute('aria-expanded', open); return; }
    var openNav = document.querySelector('.nav.open'); if (openNav && e.target.closest('.nav ul a')) { openNav.classList.remove('open'); }
    var ck = e.target.closest('[data-ck]');
    if (ck) { try { localStorage.setItem('ohi-cookie-' + (CTX.opts.siteId || 'x'), ck.dataset.ck); } catch (x) { /* storage off */ } var bar = ck.closest('.ck-bar'); if (bar && !document.body.classList.contains('edit')) bar.remove(); return; }
    /* stand-alone preview: move between pages without reloading */
    var a = e.target.closest('a[data-page],a[data-post]');
    if (a && !document.body.classList.contains('edit') && CTX.opts.standalone) {
      e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); route(); scrollTo(0, 0);
    }
  });
  /* forms: on the real site they go to /api/lead; in previews nothing is sent */
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('.ohi-form'); if (!f) return; e.preventDefault();
    if (document.body.classList.contains('edit')) return;
    var bad = [].filter.call(f.querySelectorAll('[required]'), function (x) { return x.type === 'checkbox' ? !x.checked : !String(x.value).trim(); });
    [].forEach.call(f.querySelectorAll('.err'), function (x) { x.classList.remove('err'); });
    if (bad.length) { bad.forEach(function (x) { x.classList.add('err'); }); bad[0].focus(); return; }
    var ok = f.querySelector('.ok'), btn = f.querySelector('button[type=submit]');
    var done = function (good) { btn.disabled = false; ok.hidden = false; ok.textContent = good ? (CTX.model.blocks.concat.apply([], (CTX.model.pages || []).map(function (p) { return p.blocks; })).filter(function (b) { return b.id === f.dataset.form; })[0] || { d: {} }).d.ok || 'Mulțumim!' : 'Nu s-a putut trimite. Încearcă din nou sau sună-ne.'; if (good) f.reset(); };
    if (!CTX.opts.live) { done(true); return; }   // preview: show the thank-you, send nothing
    var parts = [].map.call(f.querySelectorAll('input:not(.hp),textarea,select'), function (x) { return x.name + ': ' + (x.type === 'checkbox' ? (x.checked ? 'da' : 'nu') : x.value); });
    var pick = function (type) { var x = f.querySelector('input[type=' + type + ']'); return x ? x.value : ''; };
    btn.disabled = true;
    fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: CTX.opts.siteSlug, name: (f.querySelector('input[autocomplete=name]') || {}).value || '', phone: pick('tel'), email: pick('email'), message: parts.join('\n'), source: 'form', website: f.website.value, t: Date.now() - (CTX.opts.loadedAt || 0) }) })
      .then(function (r) { done(r.ok); }).catch(function () { done(false); });
  });

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
    var pl = e.target.closest('a[data-page],a[data-post]'), P0 = window.parent && window.parent.__ohiBuilder;
    if (pl && P0 && P0.goPage && !e.target.closest('.sel [data-t]')) { e.preventDefault(); P0.goPage(pl.dataset.post !== undefined ? 'post:' + pl.dataset.post : pl.dataset.page); return; }
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
    /* public site: the server embeds the published site as data (not code), and we draw it */
    var live = document.getElementById('ohi-data');
    if (live) {
      try {
        var D = JSON.parse(live.textContent);
        render(D.model, { live: true, siteSlug: D.slug, siteId: D.slug, page: D.page, post: D.post, notFound: D.nf, keepTitle: true, loadedAt: Date.now(),
          href: function (kind, slug) { return kind === 'home' ? '/' : kind === 'post' ? '/noutati/' + encodeURIComponent(slug) : '/' + encodeURIComponent(slug); } });
      } catch (e) { /* keep the plain HTML the server sent */ }
      return;
    }
    var route = function () {
      var q = new URLSearchParams(location.search), id = q.get('site');
      try { var st = JSON.parse(localStorage.getItem('ohi-demo-v1') || 'null'); var s = st && st.sites.filter(function (x) { return x.id === id; })[0]; if (s && s.model) render(s.model, { standalone: true, siteId: id, page: q.get('p'), post: q.get('post') }); } catch (e) { /* nothing saved in this browser */ }
    };
    window.route = route; addEventListener('popstate', route); route();
  }
})();
