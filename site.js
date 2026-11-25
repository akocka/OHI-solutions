/* OHI website: live demo in the hero (the real OHI engine builds a site) + phone menu. */
(function () {
  'use strict';
  var M = window.OHIModel;
  var $ = function (q) { return document.querySelector(q); };
  var $$ = function (q) { return [].slice.call(document.querySelectorAll(q)); };

  /* phone menu */
  var mb = $('.hd-m'), mn = $('#mnav');
  if (mb) mb.addEventListener('click', function () { var o = mb.getAttribute('aria-expanded') !== 'true'; mb.setAttribute('aria-expanded', o); mn.hidden = !o; document.body.classList.toggle('mopen', o); });
  if (mn) mn.addEventListener('click', function (e) { if (e.target.closest('a')) { mb.setAttribute('aria-expanded', 'false'); mn.hidden = true; document.body.classList.remove('mopen'); } });
  var hd = $('#hd'); addEventListener('scroll', function () { hd.classList.toggle('sc', scrollY > 8); }, { passive: true });

  if (!M || !$('#dfr')) return;
  var KINDS = {
    salon: { prompt: 'Salon de înfrumusețare numit „Salonul Tău” din Târgu Mureș, programări online', url: 'salonul-tau.ro', hero: 'h-editorial', pals: ['roz', 'lut', 'grafit', 'noapte'], words: 'Tunsori · Coafuri · Vopsit · Tratamente · Manichiură' },
    pensiune: { prompt: 'Pensiunea „Casa din Deal” din Sovata, camere și mic dejun', url: 'casadindeal.ro', hero: 'h-gradient', pals: ['padure', 'lut', 'mare', 'noapte'], words: 'Camere · Mic dejun · Liniște · Pădure · Lacul Ursu' },
    restaurant: { prompt: 'Restaurant numit „La Masă” din Cluj, rezervări', url: 'lamasa.ro', hero: 'h-minimal', pals: ['noapte', 'lut', 'roz', 'padure'], words: 'Prânz · Cină · Rezervări · Terasă · Meniul zilei' },
    auto: { prompt: 'Service auto numit „Auto Plus” din Reghin, programări', url: 'autoplus.ro', hero: 'h-gradient', pals: ['mare', 'grafit', 'noapte', 'lut'], words: 'Revizii · Frâne · Diagnoză · Anvelope · ITP' },
    atelier: { prompt: 'Atelier de tâmplărie numit „Lemn Bun” din Reghin, mobilier la comandă', url: 'lemnbun.ro', hero: 'h-editorial', pals: ['lut', 'padure', 'grafit', 'mare'], words: 'Bucătării · Dulapuri · Mese · Uși · La comandă' }
  };
  var state = { kind: 'salon', pal: null, mo: 'lively' }, win = null, model = null;

  function build() {
    var K = KINDS[state.kind], m = M.generate(K.prompt, false);
    var pal = M.PALETTES.filter(function (p) { return p.id === (state.pal || K.pals[0]); })[0] || M.PALETTES[0];
    m.brand.palette = pal.id; m.brand.colors = JSON.parse(JSON.stringify(pal.colors)); m.brand.motion = state.mo;
    var c = m.brand.colors, src = m.blocks.filter(function (b) { return b.type === 'hero'; })[0];
    var hero = M.PRESETS.filter(function (p) { return p.id === K.hero; })[0].make(m.brand.name);
    hero.d.kicker = src.d.kicker; hero.d.title = src.d.title; hero.d.text = src.d.text; hero.d.btn = src.d.btn; hero.d.btn2 = src.d.btn2;
    if (hero.s.bgType === 'gradient') { hero.s.g1 = c.accent; hero.s.g2 = c.dark; }
    hero.e = hero.e || {}; hero.e.img = { hide: 1 };
    var keep = m.blocks.filter(function (b) { return ['nav', 'features', 'prices', 'faq', 'cta', 'footer'].indexOf(b.type) > -1; });
    var band = M.block('marquee', { words: K.words, speed: '34' }, { bg: 'accent' });
    var steps = M.PRESETS.filter(function (p) { return p.id === 'st-row'; })[0].make(m.brand.name);
    var cta = M.PRESETS.filter(function (p) { return p.id === 'c-gradient'; })[0].make(m.brand.name);
    cta.d = keep.filter(function (b) { return b.type === 'cta'; })[0].d; cta.s.g1 = c.accent; cta.s.g2 = c.dark;
    m.blocks = [keep[0], hero, band].concat(keep.filter(function (b) { return b.type === 'features' || b.type === 'prices'; }), [steps, cta], keep.filter(function (b) { return b.type === 'footer'; }));
    return m;
  }
  function draw(replay) {
    if (!win || !win.OHIRender) return;
    model = build(); win.OHIRender.render(model, { replay: replay !== false, keepTitle: true, siteId: 'demo' }); win.scrollTo(0, 0);
    $('#url').textContent = KINDS[state.kind].url;
    var K = KINDS[state.kind];
    $('#sw').innerHTML = K.pals.map(function (id) {
      var p = M.PALETTES.filter(function (x) { return x.id === id; })[0];
      return '<button type="button" data-pal="' + id + '" aria-pressed="' + ((state.pal || K.pals[0]) === id) + '" aria-label="Culori ' + p.name + '" title="' + p.name + '" style="--a:' + p.colors.accent + ';--b:' + p.colors.bg + '"></button>';
    }).join('');
  }
  function fit() {
    var v = $('#wv'), f = $('#dfr'); if (!v) return;
    var base = v.clientWidth < 640 ? v.clientWidth : 1280, sc = v.clientWidth / base;
    f.style.width = base + 'px'; f.style.transform = 'scale(' + sc + ')'; f.style.height = Math.ceil(v.clientHeight / sc) + 'px';
  }
  $('#demo').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.kind) { state.kind = t.dataset.kind; state.pal = null; $$('[data-kind]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); draw(); }
    if (t.dataset.pal) { state.pal = t.dataset.pal; draw(false); }
    if (t.dataset.mo) { state.mo = t.dataset.mo; $$('[data-mo]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); draw(); }
  });
  var fr = $('#dfr');
  var ready = function () { win = fr.contentWindow; fit(); draw(); };
  if (fr.contentWindow && fr.contentWindow.OHIRender) ready(); else fr.addEventListener('load', ready);
  addEventListener('resize', fit);
})();
