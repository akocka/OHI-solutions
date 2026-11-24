/* OHI visual editor (prototype). Edits a site model { brand, blocks } and shows it live through render.html.
   Saves only in this browser for now; the real platform saves to the database and publishes to the client's domain. */
(function () {
  'use strict';
  var M = window.OHIModel, LIB = M.LIB, KEY = 'ohi-demo-v1';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  var S = load() || { logged: true, siteId: window.OHI_DEMO.sites[0].id, sites: copy(window.OHI_DEMO.sites), tickets: copy(window.OHI_DEMO.tickets), notes: {} };
  var sid = new URLSearchParams(location.search).get('site') || S.siteId;
  var site = S.sites.filter(function (x) { return x.id === sid; })[0] || S.sites[0];
  if (!site.model) site.model = M.fromSite(site);
  M.normalize(site.model);
  var model = site.model, cur = 'home', sel = null, tab = 'sec', dev = 'desk', past = [], future = [], win = null, typing = false, published = JSON.stringify(model);
  var save = function () { site.model = model; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Spațiu plin în browser: pozele mari nu se pot păstra în demo.'); } };
  var toast = function (t) { var o = $('.toast'); if (o) o.remove(); var d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); };
  var I = {
    back: '<path d="M15 18l-6-6 6-6"/>', desk: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', tab: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/>',
    mob: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
    play: '<path d="M7 4l12 8-12 8z"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', eyeoff: '<path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.2 6.3C3.6 8 2 12 2 12s4 7 10 7a9.7 9.7 0 0 0 4.3-1"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>', down: '<path d="M12 5v14M5 12l7 7 7-7"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    al: '<path d="M4 6h16M4 12h10M4 18h13"/>', ac: '<path d="M4 6h16M7 12h10M5.5 18h13"/>', ar: '<path d="M4 6h16M10 12h10M7 18h13"/>', spark: '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>'
  };
  var ic = function (k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
  var curPage = function () { return cur === 'home' || cur.indexOf('post:') === 0 ? null : model.pages.filter(function (p) { return p.id === cur; })[0] || null; };
  var curPost = function () { return cur.indexOf('post:') === 0 ? model.posts.filter(function (p) { return 'post:' + p.id === cur; })[0] || null : null; };
  /* blocks of the page being edited. Extra pages share the home menu and footer. */
  var B = function () { var p = curPage(); return p ? p.blocks : model.blocks; };
  var blk = function (id) { return B().filter(function (b) { return b.id === id; })[0] || model.blocks.filter(function (b) { return b.id === id; })[0]; };
  var shared = function (b) { return b && (b.type === 'nav' || b.type === 'footer'); };
  function go(id) {
    if (id && id.indexOf('post:') !== 0 && id !== 'home' && !model.pages.some(function (p) { return p.id === id; })) { var bySlug = model.pages.filter(function (p) { return p.slug === id; })[0]; id = bySlug ? bySlug.id : 'home'; }
    if (id && id.indexOf('post:') === 0 && !model.posts.some(function (p) { return 'post:' + p.id === id || 'post:' + p.slug === id; })) id = 'home';
    if (id && id.indexOf('post:') === 0) { var ps = model.posts.filter(function (p) { return 'post:' + p.slug === id; })[0]; if (ps) id = 'post:' + ps.id; }
    cur = id || 'home'; sel = null; if (cur.indexOf('post:') === 0 || (window.innerWidth <= 1180 && tab === 'ins')) tab = 'sec'; panels(); preview(true); if (win) win.scrollTo(0, 0);
  }
  var dirty = function () { return JSON.stringify(model) !== published; };

  /* history */
  function snap() { past.push(JSON.stringify(model)); if (past.length > 80) past.shift(); future = []; }
  function commit(fn, keepPanels) { snap(); fn(); save(); preview(); if (!keepPanels) panels(); topState(); }
  function undo() { if (!past.length) return; future.push(JSON.stringify(model)); model = JSON.parse(past.pop()); site.model = model; if (!curPage() && !curPost()) cur = 'home'; if (sel && !blk(sel)) sel = null; save(); preview(); panels(); topState(); }
  function redo() { if (!future.length) return; past.push(JSON.stringify(model)); model = JSON.parse(future.pop()); site.model = model; if (!curPage() && !curPost()) cur = 'home'; save(); preview(); panels(); topState(); }

  /* ---------- layout ---------- */
  function shell() {
    $('#ed').innerHTML =
      '<div class="ed"><header class="top"><a class="back" href="/app/#/site">' + ic('back') + 'Contul meu</a>' +
      '<div class="nm">' + esc(site.name) + '<small>' + esc(site.domain) + '</small></div>' +
      '<div class="mid"><span class="dev-g" style="display:contents"><button class="ib" data-dev="desk" title="Calculator">' + ic('desk') + '</button><button class="ib" data-dev="tab" title="Tabletă">' + ic('tab') + '</button><button class="ib" data-dev="mob" title="Telefon">' + ic('mob') + '</button></span>' +
      '<button class="ib" data-a="undo" title="Anulează (Ctrl+Z)">' + ic('undo') + '</button><button class="ib" data-a="redo" title="Refă (Ctrl+Shift+Z)">' + ic('redo') + '</button>' +
      '<button class="ib" data-a="replay" title="Rulează animațiile din nou">' + ic('play') + '</button></div>' +
      '<div class="rt"><a class="bt bt-d" href="/app/render.html?site=' + encodeURIComponent(site.id) + '" target="_blank" rel="noopener">' + ic('ext') + 'Previzualizare</a><button class="bt bt-p" data-a="publish">Publică</button></div></header>' +
      '<div class="body"><aside class="pn l" id="pl"></aside><main class="cv" id="cv" data-dev="' + dev + '"><div class="frame"><iframe id="fr" src="/app/render.html" title="Previzualizarea site-ului"></iframe></div><p class="hint">Click pe o secțiune ca s-o editezi · dublu-click pe un text ca să-l schimbi direct</p></main><aside class="pn r" id="pr"></aside></div></div>';
    topState();
  }
  function topState() {
    $$('[data-dev]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.dev === dev); });
    var u = $('[data-a=undo]'), r = $('[data-a=redo]'); if (u) u.disabled = !past.length; if (r) r.disabled = !future.length;
    var p = $('[data-a=publish]'); if (p) p.textContent = dirty() ? 'Publică' : 'Publicat ✓';
  }
  /* the preview is drawn at its real width (1280 / 820 / 390 px) and scaled down to fit the canvas */
  function fit() {
    var cv = $('#cv'), fr = $('#fr'), box = cv && cv.querySelector('.frame'); if (!fr) return;
    var W = { desk: 1280, tab: 820, mob: 390 }[dev], aw = cv.clientWidth - 36, ah = cv.clientHeight - 36;
    var k = Math.min(1, aw / W); box.style.width = Math.round(W * k) + 'px'; box.style.height = ah + 'px';
    fr.style.width = W + 'px'; fr.style.height = Math.round(ah / k) + 'px'; fr.style.transform = k < 1 ? 'scale(' + k + ')' : 'none';
  }
  function preview(replay) { var p = curPage(), po = curPost(); if (win && win.OHIRender) win.OHIRender.render(model, { edit: true, sel: sel, replay: replay, siteId: site.id, page: p ? p.id : null, post: po ? po.id : null }); }
  window.__ohiRenderReady = function (w) { win = w; preview(); };
  window.__ohiBuilder = {
    select: function (id) { sel = id; if (window.innerWidth <= 1180) tab = 'ins'; markSel(); panels(); },
    goPage: function (slug) { go(slug === '' ? 'home' : slug); },
    setText: function (id, path, val) { var b = blk(id); if (!b) return; commit(function () { setPath(b.d, path, val); }); }
  };
  function markSel() { if (!win) return; $$('[data-id]', win.document).forEach(function (e) { e.classList.toggle('sel', e.dataset.id === sel); }); }
  function setPath(o, path, val) { var p = path.split('.'), x = o; for (var i = 0; i < p.length - 1; i++) x = x[p[i]]; x[p[p.length - 1]] = val; }

  /* ---------- left + right panels ---------- */
  function panels() {
    var narrow = window.innerWidth <= 1180;
    if (!narrow && tab === 'ins') tab = 'sec';
    var tabs = '<div class="tabs" role="tablist">' + [['sec', 'Pagină'], ['site', 'Site'], ['des', 'Design'], ['ai', 'AI'], ['ins', 'Secțiune']].map(function (t) {
      return '<button role="tab" class="' + (t[0] === 'ins' ? 't-ins' : '') + '" data-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body = tab === 'site' ? sitePanel() : tab === 'sec' ? (curPost() ? postPanel() : secPanel()) : tab === 'des' ? designPanel() : tab === 'ai' ? aiPanel() : inspector();
    $('#pl').innerHTML = tabs + body;
    if (!narrow) $('#pr').innerHTML = inspector();
    wireDnD();
  }
  function secPanel() {
    var list = B().map(function (b, i) {
      var L = LIB[b.type], vn = (L.variants.filter(function (v) { return v[0] === b.v; })[0] || L.variants[0])[1];
      return '<li draggable="true" data-sel="' + b.id + '" data-i="' + i + '" class="' + (b.id === sel ? 'sel' : '') + (b.hidden ? ' off' : '') + '"><span class="grip" aria-hidden="true">⋮⋮</span><span class="tx"><b>' + esc(L.name) + (L.plugin ? '<span class="pl">Plugin</span>' : '') + '</b><small>' + esc(vn) + '</small></span>' +
        '<button class="mini" data-mv="-1" data-i="' + i + '" title="Mută în sus">' + ic('up') + '</button><button class="mini" data-mv="1" data-i="' + i + '" title="Mută în jos">' + ic('down') + '</button><button class="mini" data-hide="' + b.id + '" title="' + (b.hidden ? 'Arată' : 'Ascunde') + '">' + ic(b.hidden ? 'eyeoff' : 'eye') + '</button></li>';
    }).join('');
    var p = curPage();
    return pagePicker() + '<div class="sec"><h3>Secțiuni' + (p ? ' · ' + esc(p.title) : '') + '</h3><p class="h">Trage ca să schimbi ordinea. Click ca s-o editezi.' + (p ? ' Meniul și subsolul sunt comune tuturor paginilor: le schimbi din Acasă.' : '') + '</p><ul class="sl" id="sl">' + (list || '<li class="none">Pagina e goală. Adaugă prima secțiune.</li>') + '</ul></div>' +
      '<div class="sec"><button class="bt bt-p bt-w" data-a="lib">+ Adaugă secțiune</button></div>';
  }
  function designPanel() {
    var b = model.brand, c = b.colors;
    var seg = function (key, opts) { return '<div class="seg" role="group">' + opts.map(function (o) { return '<button data-brand="' + key + '" data-val="' + o[0] + '" aria-pressed="' + (String(b[key]) === String(o[0])) + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    var pals = M.PALETTES.map(function (p) { return '<button data-pal="' + p.id + '" aria-pressed="' + (b.palette === p.id) + '"><i>' + ['bg', 'surface', 'accent', 'dark'].map(function (k) { return '<span style="background:' + p.colors[k] + '"></span>'; }).join('') + '</i>' + esc(p.name) + '</button>'; }).join('');
    var cols = [['accent', 'Principală'], ['bg', 'Fundal'], ['surface', 'Fundal 2'], ['ink', 'Text'], ['mute', 'Text estompat'], ['dark', 'Închisă']].map(function (k) {
      return '<label><input type="color" data-color="' + k[0] + '" value="' + esc(c[k[0]]) + '">' + k[1] + '</label>'; }).join('');
    var F = window.OHIRenderFonts || {};
    var fonts = M.FONT_PAIRS.map(function (f) { return '<button data-fp="' + f.id + '" aria-pressed="' + (b.fontPair === f.id) + '"><b style="font-family:' + fam(f.head) + '">' + esc(famName(f.head)) + (f.head === f.body ? '' : ' + ' + esc(famName(f.body))) + '</b><small>' + esc(f.name) + '</small></button>'; }).join('');
    var fsel = function (key) { return '<select class="in" data-font="' + key + '">' + Object.keys(FAM).map(function (k) { return '<option value="' + k + '"' + (b[key] === k ? ' selected' : '') + '>' + esc(FAM[k]) + ' · ' + FSTYLE[k] + '</option>'; }).join('') + '</select>'; };
    fonts += '</div><div class="fsel"><label class="fl"><span>Font titluri</span>' + fsel('headFont') + '</label><label class="fl"><span>Font text</span>' + fsel('bodyFont') + '</label><p class="h">Toate sunt din Google Fonts, gratuite și pentru uz comercial.</p>';
    return '<div class="sec"><h3>Culori</h3><div class="pal">' + pals + '</div></div>' +
      '<div class="sec"><h3>Culorile tale</h3><p class="h">Alege exact nuanța brandului. Textul de pe butoane se adaptează singur.</p><div class="colors">' + cols + '</div></div>' +
      '<div class="sec"><h3>Fonturi</h3><div class="fonts">' + fonts + '</div></div>' +
      '<div class="sec"><h3>Butoane</h3><label class="fl"><span>Formă</span></label>' + seg('btnShape', [['pill', 'Rotunjite'], ['round', 'Colțuri moi'], ['square', 'Drepte']]) +
      '<label class="fl" style="margin-top:12px"><span>Stil</span></label>' + seg('btnStyle', [['fill', 'Plin'], ['outline', 'Contur'], ['soft', 'Discret']]) + '</div>' +
      '<div class="sec"><h3>Colțuri</h3><label class="fl"><span>Rotunjire carduri și poze <em>' + b.radius + ' px</em></span><input type="range" min="0" max="36" step="2" value="' + b.radius + '" data-radius></label></div>' +
      '<div class="sec"><h3>Animații</h3>' + seg('anim', [['none', 'Fără'], ['fade', 'Apariție'], ['up', 'Sus'], ['left', 'Lateral'], ['zoom', 'Zoom']]) +
      '<label class="fl" style="margin-top:12px"><span>Viteză</span></label>' + seg('animSpeed', [['fast', 'Rapidă'], ['normal', 'Normală'], ['slow', 'Lentă']]) +
      '<button class="bt bt-s bt-w" style="margin-top:12px" data-a="replay">' + ic('play') + 'Vezi animațiile</button></div>' +
      '<div class="sec"><h3>Spațiere</h3>' + seg('density', [['compact', 'Compactă'], ['normal', 'Normală'], ['airy', 'Aerisită']]) + '</div>';
  }
  var FAM = { fraunces: 'Fraunces', playfair: 'Playfair Display', cormorant: 'Cormorant Garamond', instrument: 'Instrument Serif', archivo: 'Archivo', manrope: 'Manrope', inter: 'Inter', dmsans: 'DM Sans', poppins: 'Poppins', schibsted: 'Schibsted Grotesk' };
  var FSTYLE = { fraunces: 'clasic', playfair: 'editorial', cormorant: 'elegant', instrument: 'rafinat', archivo: 'modern', manrope: 'modern', inter: 'curat', dmsans: 'prietenos', poppins: 'rotund', schibsted: 'grotesc' };
  var famName = function (k) { return FAM[k] || k; };
  var fam = function (k) { return '\'' + famName(k) + '\',serif'; };
  function aiPanel() {
    var ex = ['Salon de coafură numit „Ana” din Târgu Mureș, telefon 0740 123 456, vrem programări online', 'Pensiunea „Valea Verde” din Sovata, 6 camere, mic dejun inclus', 'Atelier de tâmplărie din Reghin, mobilier la comandă, plată în rate'];
    return '<div class="sec"><div class="ai-box"><h3>' + ic('spark') + ' Construiește cu AI</h3><textarea class="in" id="aiP" placeholder="Descrie afacerea: ce faci, cum se numește, unde ești, ce vrei pe site…"></textarea>' +
      '<div class="ai-ex">' + ex.map(function (e) { return '<button data-ex="' + esc(e) + '">' + esc(e) + '</button>'; }).join('') + '</div>' +
      '<label class="ck2"><input type="checkbox" id="aiPg" checked> Fă și paginile Despre noi și Contact</label><button class="bt bt-p bt-w" data-a="gen">Generează site-ul</button><ul class="ai-steps" id="aiS"></ul>' +
      '<p class="note">Demo: aici textele și structura sunt făcute de un generator simplu, cu reguli. În platforma reală le scrie Claude, printr-o funcție pe server.</p></div></div>' +
      '<div class="sec"><h3>Modifică prin mesaj</h3><p class="h">Scrie ce vrei schimbat, ca unui om. Merge și pe secțiunea selectată.</p><input class="in" id="cmd" placeholder="ex. culoarea principală verde"><div class="ai-ex" style="margin-top:8px">' +
      ['culoarea principală albastru', 'butoane drepte', 'colțuri mai rotunjite', 'animații zoom', 'temă închisă', 'adaugă o galerie', 'titlul: Bine ai venit!', 'centrează'].map(function (e) { return '<button class="bt-s" style="background:#fff;color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)" data-cmdx="' + esc(e) + '">' + esc(e) + '</button>'; }).join('') +
      '</div><ul class="log" id="log"></ul></div>';
  }
  function inspector() {
    var b = sel && blk(sel);
    if (!b) return '<div class="empty-ins"><b>Alege o secțiune</b>Dă click pe ea în previzualizare sau în lista din stânga. Aici o schimbi: conținut, poziție, culori, animații.</div>';
    var L = LIB[b.type], s = b.s;
    var seg = function (key, opts) { return '<div class="seg" role="group">' + opts.map(function (o) { return '<button data-st="' + key + '" data-val="' + o[0] + '" aria-pressed="' + (s[key] === o[0]) + '" title="' + esc(o[2] || o[1]) + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    var fields = L.f.map(function (f) { return field(b, f); }).join('');
    var c = model.brand.colors;
    var bgs = [['bg', 'Fundal', c.bg], ['surface', 'Fundal 2', c.surface], ['dark', 'Închis', c.dark], ['accent', 'Principal', c.accent]].map(function (o) {
      return '<button data-st="bg" data-val="' + o[0] + '" aria-pressed="' + (s.bg === o[0]) + '" style="background:' + o[2] + '" title="' + o[1] + '"><small>' + o[1] + '</small></button>'; }).join('');
    return '<div class="ins-h"><div><b>' + esc(L.name) + '</b><small>' + esc((L.variants.filter(function (v) { return v[0] === b.v; })[0] || [])[1] || '') + '</small></div>' + (L.plugin ? '<span class="pl">Plugin</span>' : '') + '</div>' +
      (L.variants.length > 1 ? '<div class="sec"><h3>Aspect</h3><div class="chips">' + L.variants.map(function (v) { return '<button data-var="' + v[0] + '" aria-pressed="' + (b.v === v[0]) + '">' + esc(v[1]) + '</button>'; }).join('') + '</div></div>' : '') +
      '<div class="sec"><h3>Conținut</h3>' + fields + '</div>' +
      (b.type === 'nav' || b.type === 'footer' ? '' :
      '<div class="sec"><h3>Poziție și spațiu</h3><label class="fl"><span>Aliniere text</span></label>' + seg('align', [['left', ic('al'), 'Stânga'], ['center', ic('ac'), 'Centru'], ['right', ic('ar'), 'Dreapta']]) +
        (b.type === 'hero' && b.v === 'split' ? '<label class="fl" style="margin-top:12px"><span>Imaginea</span></label>' + seg('img', [['left', 'În stânga'], ['right', 'În dreapta']]) : '') +
        '<label class="fl" style="margin-top:12px"><span>Lățime</span></label>' + seg('width', [['narrow', 'Îngustă'], ['normal', 'Normală'], ['wide', 'Lată']]) +
        '<label class="fl" style="margin-top:12px"><span>Spațiu sus și jos</span></label>' + seg('pad', [['s', 'Mic'], ['m', 'Mediu'], ['l', 'Mare']]) +
        '<label class="fl" style="margin-top:12px"><span>Unde se vede</span></label>' + seg('vis', [['all', 'Peste tot'], ['desk', 'Calculator'], ['mob', 'Telefon']]) + '</div>' +
      '<div class="sec"><h3>Fundal</h3><div class="sw" style="margin-bottom:18px">' + bgs + '</div></div>' +
      '<div class="sec"><h3>Butoane și animație</h3><label class="fl"><span>Stil butoane aici</span></label>' + seg('btn', [['inherit', 'Implicit'], ['fill', 'Plin'], ['outline', 'Contur'], ['soft', 'Discret']]) +
        '<label class="fl" style="margin-top:12px"><span>Animație la apariție</span></label><select class="in" data-stsel="anim">' + [['inherit', 'Ca tot site-ul'], ['none', 'Fără'], ['fade', 'Apariție lină'], ['up', 'De jos în sus'], ['left', 'Din stânga'], ['right', 'Din dreapta'], ['zoom', 'Zoom'], ['blur', 'Din ceață (blur)'], ['flip', 'Se ridică în 3D']].map(function (o) { return '<option value="' + o[0] + '"' + (s.anim === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
        (false ? '' : '<label class="fl" style="margin-top:12px"><span>Efect la derulare</span></label><select class="in" data-stsel="fx">' + [['none', 'Fără'], ['split', 'Imaginea coboară, textul urcă'], ['parallax', 'Imagine în adâncime (parallax)'], ['zoom', 'Imaginea se apropie'], ['drift', 'Textul plutește în sus'], ['slide', 'Intră din lateral'], ['cover', 'Urcă peste secțiunea de sus']].map(function (o) { return '<option value="' + o[0] + '"' + ((s.fx || 'none') === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select><p class="h" style="margin-top:6px">Derulează în previzualizare ca să vezi efectul.</p>') + '</div>') +
      '<div class="sec"><div class="acts"><button data-a="up">↑ Sus</button><button data-a="down">↓ Jos</button><button data-a="dup">Copiază</button><button data-a="del" class="del">Șterge</button></div></div>';
  }
  function field(b, f) {
    var k = f[0], lab = f[1], ty = f[2], v = b.d[k];
    if (ty === 'text') return '<label class="fl"><span>' + lab + '</span><input class="in" data-fd="' + k + '" value="' + esc(v) + '"></label>';
    if (ty === 'area') return '<label class="fl"><span>' + lab + '</span><textarea class="in" data-fd="' + k + '">' + esc(v) + '</textarea></label>';
    if (ty === 'long') return '<label class="fl"><span>' + lab + '</span><textarea class="in" rows="9" data-fd="' + k + '">' + esc(v) + '</textarea></label>';
    if (ty === 'num') return '<label class="fl"><span>' + lab + '</span><input class="in" type="number" min="1" max="24" data-fd="' + k + '" value="' + esc(v) + '"></label>';
    if (ty === 'fields') return '<div class="fl"><span style="display:block;font-size:12.5px;font-weight:600;margin:0 0 5px">' + lab + '</span><div class="li-ed">' + (v || []).map(function (x, i) {
      return '<div class="ffr"><input class="in" data-ff="' + i + '" data-fk="l" value="' + esc(x.l) + '" aria-label="Eticheta câmpului"><select class="in" data-ffsel="' + i + '" aria-label="Tipul câmpului">' +
        [['text', 'Text'], ['tel', 'Telefon'], ['email', 'E-mail'], ['area', 'Mesaj lung'], ['select', 'Listă de opțiuni'], ['date', 'Dată'], ['num', 'Număr'], ['check', 'Bifă (acord)']].map(function (o) { return '<option value="' + o[0] + '"' + (x.t === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
        '<button class="mini' + (x.r ? ' on' : '') + '" data-ffr="' + i + '" title="Obligatoriu" aria-pressed="' + !!x.r + '">*</button><button class="mini x" data-rmi="' + k + '" data-i="' + i + '" aria-label="Șterge">×</button>' +
        (x.t === 'select' ? '<input class="in ffo" data-ff="' + i + '" data-fk="o" value="' + esc(x.o || '') + '" placeholder="Opțiuni, despărțite prin virgulă">' : '') + '</div>'; }).join('') +
      '</div><button class="add" data-addi="' + k + '" data-ty="fields">+ Adaugă câmp</button><p class="h" style="margin-top:6px">* = obligatoriu. Cererile ajung în Cereri, în contul tău.</p></div>';
    if (ty === 'bool') return '<div class="tgl">' + lab + '<button class="tg" role="switch" aria-checked="' + !!v + '" data-bool="' + k + '" aria-label="' + lab + '"></button></div>';
    if (ty === 'lines') return '<label class="fl"><span>' + lab + ' <em>unul pe rând</em></span><textarea class="in" data-lines="' + k + '">' + esc((v || []).join('\n')) + '</textarea></label>';
    if (ty === 'img') return '<div class="fl"><span style="display:block;font-size:12.5px;font-weight:600;margin:0 0 5px">' + lab + '</span>' + (v ? '<div class="one-img"><img src="' + esc(v) + '" alt=""></div><button class="add" data-rmimg="' + k + '">Scoate poza</button>' : '<label class="up"><input type="file" accept="image/*" data-img="' + k + '">Încarcă o poză</label>') + '</div>';
    if (ty === 'imgs') return '<div class="fl"><span style="display:block;font-size:12.5px;font-weight:600;margin:0 0 5px">' + lab + '</span><div class="imgs">' + (v || []).map(function (src, i) { return '<div class="t"><img src="' + esc(src) + '" alt=""><button data-rmg="' + k + '" data-i="' + i + '" aria-label="Scoate">×</button></div>'; }).join('') + '</div><label class="up"><input type="file" accept="image/*" multiple data-imgs="' + k + '">Adaugă poze</label></div>';
    var rows = (v || []).map(function (it, i) {
      if (ty === 'pairs') return '<div class="two"><input class="in" data-li="' + k + '" data-i="' + i + '" data-j="0" value="' + esc(it[0]) + '"><input class="in" data-li="' + k + '" data-i="' + i + '" data-j="1" value="' + esc(it[1]) + '"><button class="mini" data-rmi="' + k + '" data-i="' + i + '" aria-label="Șterge">×</button></div>';
      var a = ty === 'qa' ? ['q', 'a'] : ['t', 'x'];
      return '<div class="it"><input class="in" data-li="' + k + '" data-i="' + i + '" data-j="' + a[0] + '" value="' + esc(it[a[0]]) + '"><textarea class="in" data-li="' + k + '" data-i="' + i + '" data-j="' + a[1] + '">' + esc(it[a[1]]) + '</textarea><button class="mini x" data-rmi="' + k + '" data-i="' + i + '" aria-label="Șterge">×</button></div>';
    }).join('');
    return '<div class="fl"><span style="display:block;font-size:12.5px;font-weight:600;margin:0 0 5px">' + lab + '</span><div class="li-ed' + (ty === 'pairs' ? '' : '') + '">' + rows + '</div><button class="add" data-addi="' + k + '" data-ty="' + ty + '">+ Adaugă</button></div>';
  }

  /* ---------- pages, posts, site settings ---------- */
  function pagePicker() {
    var opts = '<option value="home"' + (cur === 'home' ? ' selected' : '') + '>Acasă</option>' + model.pages.map(function (p) { return '<option value="' + p.id + '"' + (cur === p.id ? ' selected' : '') + '>' + esc(p.title) + '</option>'; }).join('');
    return '<div class="sec pgpick"><label class="fl"><span>Pagina pe care o editezi</span><select class="in" data-go>' + opts + '</select></label><button class="bt bt-s" data-a="newpage">+ Pagină</button></div>';
  }
  var gprev = function (title, url, desc) {
    return '<div class="gp" aria-label="Cum arată în Google"><small>' + esc(url) + '</small><b>' + esc(title || 'Titlu lipsă') + '</b><span>' + esc(desc || 'Adaugă o descriere: 1–2 propoziții despre ce găsește omul pe pagină.') + '</span></div>';
  };
  var len = function (v, max) { var n = String(v || '').length; return '<em class="' + (n > max ? 'over' : '') + '">' + n + ' / ' + max + '</em>'; };
  function sitePanel() {
    var p = curPage(), st = model.settings, dom = site.domain;
    var rows = [['home', 'Acasă', '/', true]].concat(model.pages.map(function (x) { return [x.id, x.title, '/' + x.slug, x.nav !== false]; })).map(function (r, i) {
      var extra = i > 0;
      return '<li class="' + (cur === r[0] ? 'sel' : '') + '"><button class="pg-go" data-gopage="' + r[0] + '"><b>' + esc(r[1]) + '</b><small>' + esc(r[2]) + (r[3] ? '' : ' · ascunsă din meniu') + '</small></button>' +
        (extra ? '<button class="mini" data-pgmv="-1" data-i="' + (i - 1) + '" title="Mai sus în meniu">' + ic('up') + '</button><button class="mini" data-pgmv="1" data-i="' + (i - 1) + '" title="Mai jos în meniu">' + ic('down') + '</button><button class="mini" data-pgnav="' + r[0] + '" title="' + (r[3] ? 'Scoate din meniu' : 'Pune în meniu') + '">' + ic(r[3] ? 'eye' : 'eyeoff') + '</button>' : '') + '</li>';
    }).join('');
    var seo = p ? p.seo : model.seo, url = dom + (p ? '/' + p.slug : '');
    var pageSet = (p ? '<label class="fl"><span>Numele paginii (apare în meniu)</span><input class="in" data-pg="title" value="' + esc(p.title) + '" maxlength="40"></label>' +
        '<label class="fl"><span>Adresa</span><div class="slug"><i>' + esc(dom) + '/</i><input class="in" data-pg="slug" value="' + esc(p.slug) + '" maxlength="60"></div></label>' : '') +
      '<label class="fl"><span>Titlu în Google ' + len(seo.title, 60) + '</span><input class="in" data-seo="title" value="' + esc(seo.title || '') + '" placeholder="' + esc((p ? p.title + ' · ' : '') + model.brand.name) + '"></label>' +
      '<label class="fl"><span>Descriere în Google ' + len(seo.desc, 155) + '</span><textarea class="in" data-seo="desc" rows="3">' + esc(seo.desc || '') + '</textarea></label>' +
      gprev(seo.title || (p ? p.title + ' · ' : '') + model.brand.name, url, seo.desc) +
      '<div class="tgl">Ascunde pagina din Google<button class="tg" role="switch" aria-checked="' + !!seo.noindex + '" data-seobool="noindex" aria-label="Ascunde pagina din Google"></button></div>' +
      (p ? '<button class="add del-l" data-a="delpage">Șterge pagina</button>' : '');
    var posts = model.posts.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (x) {
      return '<li><button class="pg-go" data-gopage="post:' + x.id + '"><b>' + esc(x.title) + '</b><small>' + esc(x.date) + ' · ' + (x.published ? 'publicat' : 'ciornă') + '</small></button></li>'; }).join('');
    var vers = (site.versions || []).map(function (v, i) { return '<li><span><b>' + esc(v.at.replace('T', ' ').slice(0, 16)) + '</b><small>' + esc(v.note || 'Publicare') + '</small></span><button class="bt bt-s" data-restore="' + i + '">Revino</button></li>'; }).join('');
    return '<div class="sec"><h3>Pagini</h3><ul class="pgl">' + rows + '</ul><button class="bt bt-p bt-w" data-a="newpage">+ Pagină nouă</button></div>' +
      '<div class="sec"><h3>' + (p ? 'Pagina „' + esc(p.title) + '”' : 'Pagina Acasă') + ': Google și adresă</h3>' + pageSet + '</div>' +
      '<div class="sec"><h3>Noutăți (blog)</h3><p class="h">Articolele apar în secțiunea Noutăți. Bune și pentru Google.</p><ul class="pgl">' + (posts || '<li class="none">Niciun articol încă.</li>') + '</ul><button class="bt bt-s bt-w" data-a="newpost">+ Articol nou</button></div>' +
      '<div class="sec"><h3>Pe tot site-ul</h3>' +
        '<label class="fl"><span>Limba site-ului</span><select class="in" data-set="lang">' + [['ro', 'Română'], ['hu', 'Maghiară'], ['en', 'Engleză']].map(function (o) { return '<option value="' + o[0] + '"' + (st.lang === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
        '<div class="tgl">Buton WhatsApp<button class="tg" role="switch" aria-checked="' + !!st.wa + '" data-setbool="wa" aria-label="Buton WhatsApp"></button></div>' +
        (st.wa ? '<label class="fl"><span>Numărul de WhatsApp</span><input class="in" data-set="waPhone" value="' + esc(st.waPhone) + '" inputmode="tel" placeholder="07xx xxx xxx"></label><label class="fl"><span>Mesajul de început</span><input class="in" data-set="waText" value="' + esc(st.waText) + '"></label>' : '') +
        '<div class="tgl">Banner de cookie-uri<button class="tg" role="switch" aria-checked="' + !!st.cookie + '" data-setbool="cookie" aria-label="Banner de cookie-uri"></button></div>' +
        (st.cookie ? '<label class="fl"><span>Textul bannerului</span><textarea class="in" data-set="cookieText" rows="3">' + esc(st.cookieText) + '</textarea></label>' : '<p class="h">Pornește-l dacă pui hartă Google, video sau statistici cu cookie-uri. Statisticile OHI nu folosesc cookie-uri.</p>') + '</div>' +
      '<div class="sec"><h3>Versiuni</h3><p class="h">La fiecare publicare păstrăm o copie. Poți reveni oricând.</p><ul class="vl">' + (vers || '<li class="none">Prima versiune apare după ce publici.</li>') + '</ul></div>';
  }
  function postPanel() {
    var x = curPost();
    return '<div class="sec"><button class="add" data-gopage="home" style="margin:0 0 6px">← Înapoi la pagini</button><h3>Articol</h3>' +
      '<label class="fl"><span>Titlu</span><input class="in" data-po="title" value="' + esc(x.title) + '" maxlength="120"></label>' +
      '<div class="two" style="grid-template-columns:1fr 1fr"><label class="fl"><span>Data</span><input class="in" type="date" data-po="date" value="' + esc(x.date) + '"></label><label class="fl"><span>Adresa</span><input class="in" data-po="slug" value="' + esc(x.slug) + '"></label></div>' +
      '<label class="fl"><span>Rezumat (apare pe card și în Google) ' + len(x.excerpt, 155) + '</span><textarea class="in" data-po="excerpt" rows="3">' + esc(x.excerpt) + '</textarea></label>' +
      '<div class="fl"><span style="display:block;font-size:12.5px;font-weight:600;margin:0 0 5px">Copertă</span>' + (x.cover ? '<div class="one-img"><img src="' + esc(x.cover) + '" alt=""></div><button class="add" data-pocover="rm">Scoate poza</button>' : '<label class="up"><input type="file" accept="image/*" data-pocover="1">Încarcă o poză</label>') + '</div>' +
      '<label class="fl"><span>Text <em>rând gol = paragraf nou · „## ” la început = subtitlu</em></span><textarea class="in" data-po="body" rows="14">' + esc(x.body) + '</textarea></label>' +
      '<div class="tgl">Publicat pe site<button class="tg" role="switch" aria-checked="' + !!x.published + '" data-pobool="published" aria-label="Publicat pe site"></button></div>' +
      '<button class="add del-l" data-a="delpost">Șterge articolul</button></div>';
  }
  function newPageDialog() {
    var ov = document.createElement('div'); ov.className = 'ov';
    var K = M.PAGE_PRESETS, labels = { gol: 'Goală', despre: 'Despre noi', servicii: 'Servicii și prețuri', contact: 'Contact cu formular', noutati: 'Noutăți (blog)' };
    var desc = { gol: 'Pornești de la zero.', despre: 'Povestea ta, echipa, îndemn.', servicii: 'Ce faci, prețuri, întrebări.', contact: 'Formular, program, hartă.', noutati: 'Lista de articole.' };
    ov.innerHTML = '<div class="md lib" role="dialog" aria-modal="true" aria-label="Pagină nouă"><button class="x" aria-label="Închide">×</button><h2>Pagină nouă</h2><p>Alege un punct de plecare. Apoi schimbi orice.</p><div class="gr">' +
      Object.keys(K).map(function (k) { return '<button class="cdl pgk" data-newpg="' + k + '"><b>' + labels[k] + '</b><small>' + desc[k] + '</small></button>'; }).join('') + '</div></div>';
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.x')) return ov.remove();
      var b = e.target.closest('[data-newpg]'); if (!b) return;
      var np = M.page(b.dataset.newpg, model); commit(function () { model.pages.push(np); });
      ov.remove(); go(np.id); toast('Pagina „' + np.title + '” e gata. Apare și în meniu.');
    });
    document.body.appendChild(ov); ov.querySelector('[data-newpg]').focus();
  }

  /* ---------- library modal ---------- */
  function library() {
    var groups = {}; Object.keys(LIB).forEach(function (k) { if (k === 'nav' || k === 'footer') return; var g = LIB[k].group; (groups[g] = groups[g] || []).push(k); });
    var ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="md lib" role="dialog" aria-modal="true" aria-label="Adaugă secțiune"><button class="x" aria-label="Închide">×</button><h2>Adaugă o secțiune</h2><p>Alege tipul și aspectul. O pui după secțiunea selectată și o poți schimba oricând.</p>' +
      Object.keys(groups).map(function (g) { return '<h4>' + g + '</h4><div class="gr">' + groups[g].map(function (k) { var L = LIB[k]; return '<div class="cdl"><b>' + esc(L.name) + (L.plugin ? '<span class="pl">Plugin</span>' : '') + '</b><div class="vs">' + L.variants.map(function (v) { return '<button data-addb="' + k + '" data-v="' + v[0] + '">' + esc(v[1]) + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>'; }).join('') + '</div>';
    var close = function () { ov.remove(); };
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.x')) return close();
      var b = e.target.closest('[data-addb]'); if (!b) return;
      var nb = M.block(b.dataset.addb, {}, {}, b.dataset.v), at = sel ? B().indexOf(blk(sel)) + 1 : B().length - 1;
      if (curPage() && !sel) at = B().length; if (curPage() && shared(blk(sel))) at = B().length; commit(function () { B().splice(curPage() ? Math.max(0, at) : Math.max(1, at), 0, nb); sel = nb.id; });
      close(); toast('Am adăugat: ' + LIB[nb.type].name + (LIB[nb.type].plugin ? ' (pluginul se pornește automat)' : ''));
      setTimeout(function () { var el = win && win.document.getElementById(nb.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
    });
    document.body.appendChild(ov); ov.querySelector('[data-addb]').focus();
  }
  function confirmBox(title, text, ok, fn) {
    var ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="md" style="width:min(440px,100%)" role="alertdialog" aria-modal="true"><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="bt bt-s" data-no>Renunță</button><button class="bt bt-p" data-ok>' + esc(ok) + '</button></div></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-no]')) ov.remove(); if (e.target.closest('[data-ok]')) { ov.remove(); fn(); } });
    document.body.appendChild(ov); ov.querySelector('[data-ok]').focus();
  }

  /* ---------- images: shrink before storing ---------- */
  function readImg(file, cb) {
    var r = new FileReader();
    r.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .8)); }; im.src = r.result; };
    r.readAsDataURL(file);
  }

  /* ---------- AI ---------- */
  function generate() {
    var p = ($('#aiP') || {}).value || ''; if (p.trim().length < 8) { toast('Descrie afacerea în câteva cuvinte.'); return; }
    var go = function () {
      var steps = ['Citesc descrierea', 'Aleg culorile și fonturile', 'Scriu textele', 'Așez secțiunile', 'Pornesc pluginurile potrivite'], ul = $('#aiS'), i = 0;
      ul.innerHTML = steps.map(function (s) { return '<li>' + s + '</li>'; }).join('');
      var tick = setInterval(function () {
        var li = ul.children[i]; if (li) li.className = 'done'; i++;
        if (i === steps.length) { clearInterval(tick); var gen = M.generate(p, !!($('#aiPg') || {}).checked); commit(function () { model.brand = gen.brand; model.blocks = gen.blocks; model.pages = gen.pages; model.seo = gen.seo; cur = 'home'; sel = null; }); preview(true); toast('Gata! Acum schimbă orice vrei.'); }
      }, 320);
    };
    confirmBox('Construiești site-ul de la zero?', 'Secțiunile de acum se înlocuiesc. Poți reveni oricând cu Anulează (Ctrl+Z).', 'Generează', go);
  }
  function runCmd(text) {
    var did = []; commit(function () { did = M.command({ brand: model.brand, blocks: B() }, text, sel); });
    if (!did.length) past.pop();
    var log = $('#log'); if (!log) return;
    var li = document.createElement('li'); li.className = did.length ? '' : 'bad';
    li.textContent = did.length ? '✓ ' + did.join(', ') : 'Nu am înțeles „' + text + '”. Încearcă un exemplu de mai sus.';
    log.insertBefore(li, log.firstChild);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,[data-sel],[data-dev]'); if (!t) return;
    var d = t.dataset, b = sel && blk(sel);
    if (d.dev) { dev = d.dev; $('#cv').dataset.dev = dev; fit(); topState(); return; }
    if (d.tab) { tab = d.tab; panels(); return; }
    if (d.a === 'undo') return undo();
    if (d.a === 'redo') return redo();
    if (d.a === 'replay') return preview(true);
    if (d.a === 'lib') return library();
    if (d.a === 'gen') return generate();
    if (d.a === 'publish') {
      published = JSON.stringify(model); site.status = 'live';
      site.versions = [{ at: new Date().toISOString(), note: 'Publicare', model: copy(model) }].concat(site.versions || []).slice(0, 10);
      save(); topState(); if (tab === 'site') panels(); toast('Publicat pe ' + site.domain + ' (demo)'); return;
    }
    if (d.gopage !== undefined) { go(d.gopage); return; }
    if (d.a === 'newpage') return newPageDialog();
    if (d.a === 'delpage') { var dp = curPage(); confirmBox('Ștergi pagina „' + dp.title + '”?', 'Dispare și din meniu. Poți reveni cu Anulează (Ctrl+Z).', 'Șterge', function () { commit(function () { model.pages.splice(model.pages.indexOf(dp), 1); }); go('home'); }); return; }
    if (d.a === 'newpost') { var np = M.post('Articol nou'); commit(function () { model.posts.push(np); }); go('post:' + np.id); if (!B().concat.apply([], [model.blocks].concat(model.pages.map(function (x) { return x.blocks; }))).some(function (x) { return x.type === 'blog'; })) toast('Adaugă și secțiunea Noutăți pe o pagină, ca să apară articolele.'); return; }
    if (d.a === 'delpost') { var cp = curPost(); confirmBox('Ștergi articolul?', 'Poți reveni cu Anulează (Ctrl+Z).', 'Șterge', function () { commit(function () { model.posts.splice(model.posts.indexOf(cp), 1); }); go('home'); }); return; }
    if (d.pgmv) { var pi = +d.i, pj = pi + +d.pgmv; if (pj < 0 || pj >= model.pages.length) return; commit(function () { var x = model.pages.splice(pi, 1)[0]; model.pages.splice(pj, 0, x); }); return; }
    if (d.pgnav) { commit(function () { var x = model.pages.filter(function (y) { return y.id === d.pgnav; })[0]; x.nav = x.nav === false; }); return; }
    if (d.seobool) { commit(function () { var o = curPage() ? curPage().seo : model.seo; o[d.seobool] = !o[d.seobool]; }); return; }
    if (d.setbool) { commit(function () { model.settings[d.setbool] = !model.settings[d.setbool]; }); return; }
    if (d.pobool) { commit(function () { var x = curPost(); x[d.pobool] = !x[d.pobool]; }); toast(curPost().published ? 'Articolul apare pe site.' : 'Articolul e acum ciornă.'); return; }
    if (d.pocover === 'rm') { commit(function () { curPost().cover = ''; }); return; }
    if (d.restore !== undefined) { var v = (site.versions || [])[+d.restore]; if (!v) return; confirmBox('Revii la versiunea din ' + v.at.slice(0, 10) + '?', 'Ce ai acum se poate recupera cu Anulează (Ctrl+Z).', 'Revino', function () { commit(function () { var m2 = copy(v.model); Object.keys(model).forEach(function (k) { delete model[k]; }); Object.assign(model, M.normalize(m2)); cur = 'home'; sel = null; }); toast('Am revenit la versiunea aleasă.'); }); return; }
    if (d.mv) { e.stopPropagation(); var i = +d.i, j = i + +d.mv; if (j < 0 || j >= B().length) return; commit(function () { var x = B().splice(i, 1)[0]; B().splice(j, 0, x); }); return; }
    if (d.hide) { e.stopPropagation(); commit(function () { var h = blk(d.hide); h.hidden = !h.hidden; }); return; }
    if (d.sel && !e.target.closest('.mini')) { sel = d.sel; if (window.innerWidth <= 1180) tab = 'ins'; markSel(); panels(); var el = win && win.document.getElementById(sel); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (d.pal) { var p = M.PALETTES.filter(function (x) { return x.id === d.pal; })[0]; commit(function () { model.brand.palette = p.id; model.brand.colors = copy(p.colors); }); return; }
    if (d.fp) { var f = M.FONT_PAIRS.filter(function (x) { return x.id === d.fp; })[0]; commit(function () { model.brand.fontPair = f.id; model.brand.headFont = f.head; model.brand.bodyFont = f.body; }); return; }
    if (d.brand) { commit(function () { model.brand[d.brand] = d.val; }); if (d.brand === 'anim' || d.brand === 'animSpeed') preview(true); return; }
    if (d.ex) { $('#aiP').value = d.ex; $('#aiP').focus(); return; }
    if (d.cmdx) { runCmd(d.cmdx); return; }
    if (!b) return;
    if (d['var']) { commit(function () { b.v = d['var']; }); return; }
    if (d.st) { commit(function () { b.s[d.st] = d.val; }); return; }
    if (d.bool) { commit(function () { b.d[d.bool] = !b.d[d.bool]; }); return; }
    if (d.ffr !== undefined) { commit(function () { var f = b.d.fields[+d.ffr]; f.r = !f.r; }); return; }
    if (d.rmimg) { commit(function () { b.d[d.rmimg] = ''; }); return; }
    if (d.rmg) { commit(function () { b.d[d.rmg].splice(+d.i, 1); }); return; }
    if (d.rmi) { commit(function () { b.d[d.rmi].splice(+d.i, 1); }); return; }
    if (d.addi) { commit(function () { var arr = b.d[d.addi] = b.d[d.addi] || []; arr.push(d.ty === 'pairs' ? ['', ''] : d.ty === 'fields' ? { l: 'Câmp nou', t: 'text', r: false } : d.ty === 'qa' ? { q: 'Întrebare nouă?', a: 'Răspuns.' } : { t: 'Element nou', x: 'Descriere scurtă.' }); }); return; }
    if ((d.a === 'up' || d.a === 'down' || d.a === 'dup' || d.a === 'del') && curPage() && shared(b)) { toast('Meniul și subsolul se schimbă din pagina Acasă.'); return; }
    if (d.a === 'up' || d.a === 'down') { var k = B().indexOf(b), n = k + (d.a === 'up' ? -1 : 1); if (n < 0 || n >= B().length) return; commit(function () { B().splice(k, 1); B().splice(n, 0, b); }); return; }
    if (d.a === 'dup') { var c = copy(b); c.id = M.uid(); commit(function () { B().splice(B().indexOf(b) + 1, 0, c); sel = c.id; }); toast('Secțiune copiată'); return; }
    if (d.a === 'del') { confirmBox('Ștergi secțiunea?', 'Poți reveni cu Anulează (Ctrl+Z).', 'Șterge', function () { commit(function () { B().splice(B().indexOf(b), 1); sel = null; }); }); return; }
  });
  document.addEventListener('focusin', function (e) { if (e.target.matches('[data-fd],[data-li],[data-lines],[data-color],[data-seo],[data-pg],[data-po],[data-set],[data-ff]')) typing = false; });
  document.addEventListener('input', function (e) {
    var t = e.target, d = t.dataset, b = sel && blk(sel);
    var live = function (fn) { if (!typing) { snap(); typing = true; } fn(); save(); preview(); topState(); };
    if (d.color !== undefined) return live(function () { model.brand.colors[d.color] = t.value; model.brand.palette = 'custom'; });
    if (d.radius !== undefined) return live(function () { model.brand.radius = +t.value; var em = t.parentNode.querySelector('em'); if (em) em.textContent = t.value + ' px'; });
    var counter = function (max) { var em = t.parentNode.querySelector('em'); if (em) { em.textContent = t.value.length + ' / ' + max; em.classList.toggle('over', t.value.length > max); } };
    if (d.pg === 'title') return live(function () { curPage().title = t.value; });
    if (d.seo) return live(function () {
      var o = curPage() ? curPage().seo : model.seo; o[d.seo] = t.value; counter(d.seo === 'title' ? 60 : 155);
      var g = $('.gp'); if (g) { g.querySelector('b').textContent = o.title || ((curPage() ? curPage().title + ' · ' : '') + model.brand.name); g.querySelector('span').textContent = o.desc || 'Adaugă o descriere: 1–2 propoziții despre ce găsește omul pe pagină.'; }
    });
    if (d.set && t.tagName !== 'SELECT') return live(function () { model.settings[d.set] = t.value; });
    if (d.po && d.po !== 'slug') return live(function () { var x = curPost(); x[d.po] = t.value; if (d.po === 'excerpt') counter(155); if (d.po === 'title' && x.slugAuto !== false && !x.published) { x.slug = M.slugify(t.value); var sf = $('[data-po=slug]'); if (sf) sf.value = x.slug; } });
    if (!b) return;
    if (d.ff !== undefined) return live(function () { b.d.fields[+d.ff][d.fk] = t.value; });
    if (d.fd && t.type === 'number') return live(function () { b.d[d.fd] = Math.max(1, Math.min(24, +t.value || 1)); });
    if (d.fd) return live(function () { b.d[d.fd] = t.value; });
    if (d.lines) return live(function () { b.d[d.lines] = t.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); });
    if (d.li) return live(function () { var it = b.d[d.li][+d.i]; if (Array.isArray(it)) it[+d.j] = t.value; else it[d.j] = t.value; });
  });
  document.addEventListener('change', function (e) {
    var t = e.target, d = t.dataset, b = sel && blk(sel);
    if (d.color !== undefined || d.radius !== undefined) { typing = false; panels(); return; }
    if (d.go !== undefined && t.tagName === 'SELECT') { go(t.value); return; }
    if (d.set && t.tagName === 'SELECT') { commit(function () { model.settings[d.set] = t.value; }); return; }
    if (d.pg === 'slug' || d.po === 'slug') {
      var taken = d.pg ? model.pages.filter(function (x) { return x !== curPage(); }).map(function (x) { return x.slug; }) : model.posts.filter(function (x) { return x !== curPost(); }).map(function (x) { return x.slug; });
      var sl = M.slugify(t.value); if (taken.indexOf(sl) > -1) sl += '-2';
      commit(function () { var o = d.pg ? curPage() : curPost(); o.slug = sl; if (!d.pg) o.slugAuto = false; }); return;
    }
    if (d.pocover && t.files && t.files[0]) { readImg(t.files[0], function (u) { commit(function () { curPost().cover = u; }); }); return; }
    if (d.seo || d.pg || d.po || d.set || d.ff !== undefined) { typing = false; return; }   // no redraw here: it would swallow the click that caused the blur
    if (d.font) { commit(function () { model.brand[d.font] = t.value; var hit = M.FONT_PAIRS.filter(function (x) { return x.head === model.brand.headFont && x.body === model.brand.bodyFont; })[0]; model.brand.fontPair = hit ? hit.id : 'custom'; }); return; }
    if (!b) return;
    if (d.ffsel !== undefined) { commit(function () { b.d.fields[+d.ffsel].t = t.value; }); return; }
    if (d.stsel) { commit(function () { b.s[d.stsel] = t.value; }); preview(true); return; }
    if (d.img && t.files[0]) { readImg(t.files[0], function (u) { commit(function () { b.d[d.img] = u; }); }); return; }
    if (d.imgs && t.files.length) { var fs = [].slice.call(t.files, 0, 9), out = []; fs.forEach(function (f) { readImg(f, function (u) { out.push(u); if (out.length === fs.length) commit(function () { b.d[d.imgs] = (b.d[d.imgs] || []).concat(out); }); }); }); return; }
    if (d.fd || d.li || d.lines || d.ff !== undefined) { typing = false; topState(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.id === 'cmd' && e.key === 'Enter' && e.target.value.trim()) { runCmd(e.target.value.trim()); e.target.value = ''; return; }
    var mod = e.ctrlKey || e.metaKey; if (!mod || e.key.toLowerCase() !== 'z') return;
    if (e.target.matches('input,textarea')) return;
    e.preventDefault(); if (e.shiftKey) redo(); else undo();
  });
  function wireDnD() {
    var list = $('#sl'); if (!list) return; var from = null;
    $$('li', list).forEach(function (li) {
      li.addEventListener('dragstart', function (e) { from = +li.dataset.i; li.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', li.dataset.i); } catch (x) { /* old browsers */ } });
      li.addEventListener('dragend', function () { li.classList.remove('drag'); $$('li', list).forEach(function (x) { x.classList.remove('over'); }); });
      li.addEventListener('dragover', function (e) { e.preventDefault(); $$('li', list).forEach(function (x) { x.classList.toggle('over', x === li); }); });
      li.addEventListener('drop', function (e) { e.preventDefault(); var to = +li.dataset.i; if (from === null || from === to) return; commit(function () { var x = B().splice(from, 1)[0]; B().splice(to, 0, x); }); from = null; });
    });
  }
  var rw; addEventListener('resize', function () { clearTimeout(rw); rw = setTimeout(function () { panels(); fit(); }, 150); });
  addEventListener('beforeunload', function (e) { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });

  shell(); panels(); fit(); save();
  setTimeout(function () { var h = $('.hint'); if (h) { h.style.opacity = 0; setTimeout(function () { h.remove(); }, 700); } }, 6000);
})();
