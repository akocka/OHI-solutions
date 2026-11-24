/* OHI site model: block library, design presets, starter sites and the AI builder.
   The AI here is a local rule-based stand-in so the prototype works offline. In the real platform the same
   functions call Claude through a server function (the API key lives only in a server environment variable). */
(function () {
  'use strict';
  var uid = function () { return 'b' + Math.random().toString(36).slice(2, 8); };

  var PALETTES = [
    { id: 'lut', name: 'Lut', colors: { bg: '#FAF7F2', ink: '#1C1A17', mute: '#6B645A', surface: '#F0E9DE', accent: '#B5532A', dark: '#1F1B17' } },
    { id: 'padure', name: 'Pădure', colors: { bg: '#F6F7F2', ink: '#18201A', mute: '#5E6A60', surface: '#E6EBE0', accent: '#2F6B45', dark: '#132018' } },
    { id: 'noapte', name: 'Noapte', colors: { bg: '#111113', ink: '#F2F0EC', mute: '#A3A09A', surface: '#1C1C20', accent: '#E9B44C', dark: '#000000' } },
    { id: 'mare', name: 'Mare', colors: { bg: '#F5F8FA', ink: '#0F1E2B', mute: '#5A6B78', surface: '#E3ECF2', accent: '#1F6FB2', dark: '#0B1722' } },
    { id: 'roz', name: 'Atelier roz', colors: { bg: '#FBF6F4', ink: '#2A1C1F', mute: '#7A6366', surface: '#F3E5E2', accent: '#C2456B', dark: '#2A1C1F' } },
    { id: 'grafit', name: 'Grafit', colors: { bg: '#FFFFFF', ink: '#141414', mute: '#666666', surface: '#F2F2F2', accent: '#141414', dark: '#141414' } }
  ];
  var FONT_PAIRS = [
    { id: 'clasic', name: 'Clasic cald', head: 'fraunces', body: 'inter' },
    { id: 'elegant', name: 'Elegant', head: 'cormorant', body: 'dmsans' },
    { id: 'modern', name: 'Modern', head: 'archivo', body: 'inter' },
    { id: 'prietenos', name: 'Prietenos', head: 'poppins', body: 'dmsans' },
    { id: 'editorial', name: 'Editorial', head: 'playfair', body: 'manrope' },
    { id: 'curat', name: 'Curat', head: 'schibsted', body: 'schibsted' }
  ];

  /* each block: default data, variants, which fields the inspector shows */
  var LIB = {
    nav: { name: 'Meniu', group: 'Bază', variants: [['simple', 'Pe un rând'], ['center', 'Centrat']], d: { logo: '', btn: 'Sună acum' },
      f: [['logo', 'Nume / logo', 'text'], ['btn', 'Buton', 'text']] },
    hero: { name: 'Început (hero)', group: 'Bază', variants: [['split', 'Text + imagine'], ['center', 'Centrat'], ['cover', 'Imagine pe tot ecranul']],
      d: { kicker: 'Târgu Mureș', title: 'Titlul care spune ce faci', text: 'O frază scurtă despre cine ești și de ce să te aleagă clienții.', btn: 'Cere ofertă', btn2: 'Vezi prețurile', img: '', navLabel: '' },
      f: [['kicker', 'Text mic deasupra', 'text'], ['title', 'Titlu', 'area'], ['text', 'Text', 'area'], ['btn', 'Buton principal', 'text'], ['btn2', 'Buton secundar', 'text'], ['img', 'Imagine', 'img']] },
    features: { name: 'Avantaje', group: 'Conținut', variants: [['cards', 'Carduri'], ['list', 'Listă'], ['numbers', 'Pași numerotați']],
      d: { kicker: '', title: 'De ce noi', text: '', navLabel: 'Despre', items: [{ t: 'Primul avantaj', x: 'O frază care explică.' }, { t: 'Al doilea', x: 'O frază care explică.' }, { t: 'Al treilea', x: 'O frază care explică.' }] },
      f: [['kicker', 'Text mic deasupra', 'text'], ['title', 'Titlu', 'text'], ['text', 'Text', 'area'], ['items', 'Elemente', 'items'], ['navLabel', 'Nume în meniu', 'text']] },
    prices: { name: 'Prețuri', group: 'Conținut', variants: [['list', 'Listă'], ['cards', 'Carduri']],
      d: { kicker: '', title: 'Prețuri', text: '', navLabel: 'Prețuri', items: [['Serviciu', '100 lei'], ['Alt serviciu', '150 lei']] },
      f: [['title', 'Titlu', 'text'], ['text', 'Text', 'area'], ['items', 'Prețuri', 'pairs'], ['navLabel', 'Nume în meniu', 'text']] },
    gallery: { name: 'Galerie', group: 'Conținut', variants: [['grid', 'Grilă'], ['masonry', 'Mozaic'], ['strip', 'Bandă glisantă']],
      d: { title: 'Lucrări', text: '', navLabel: 'Galerie', imgs: [] }, f: [['title', 'Titlu', 'text'], ['text', 'Text', 'area'], ['imgs', 'Poze', 'imgs'], ['navLabel', 'Nume în meniu', 'text']] },
    faq: { name: 'Întrebări frecvente', group: 'Conținut', variants: [['accordion', 'Acordeon']],
      d: { title: 'Întrebări frecvente', text: '', navLabel: '', items: [{ q: 'O întrebare des primită?', a: 'Răspunsul, pe scurt.' }] },
      f: [['title', 'Titlu', 'text'], ['items', 'Întrebări', 'qa']] },
    hours: { name: 'Program și contact', group: 'Bază', variants: [['split', 'Cu hartă'], ['card', 'Card simplu']],
      d: { title: 'Program și contact', text: '', navLabel: 'Contact', hours: [['Luni – Vineri', '09:00 – 18:00'], ['Sâmbătă', '10:00 – 14:00']], address: 'Strada, număr, oraș', phone: '07xx xxx xxx', map: true },
      f: [['title', 'Titlu', 'text'], ['hours', 'Program', 'pairs'], ['address', 'Adresă', 'text'], ['phone', 'Telefon', 'text'], ['map', 'Arată harta', 'bool']] },
    cta: { name: 'Îndemn final', group: 'Bază', variants: [['band', 'Bandă'], ['card', 'Card închis']],
      d: { title: 'Hai să vorbim', text: 'Sună-ne sau scrie-ne și îți răspundem azi.', btn: 'Sună acum', btn2: 'WhatsApp' },
      f: [['title', 'Titlu', 'text'], ['text', 'Text', 'area'], ['btn', 'Buton principal', 'text'], ['btn2', 'Buton secundar', 'text']] },
    booking: { name: 'Programări online', group: 'Pluginuri', plugin: 'booking', variants: [['card', 'Formular']],
      d: { title: 'Programează-te online', text: 'Alege serviciul și ora. Confirmăm pe telefon.', navLabel: 'Programare', services: ['Serviciul 1', 'Serviciul 2'], btn: 'Programează-mă' },
      f: [['title', 'Titlu', 'text'], ['text', 'Text', 'area'], ['services', 'Servicii', 'lines'], ['btn', 'Buton', 'text']] },
    calc: { name: 'Calculator rate', group: 'Pluginuri', plugin: 'rates', variants: [['card', 'Calculator']],
      d: { title: 'Plătești în rate', text: 'Vezi cât ar fi rata lunară.', navLabel: '', min: 5000, max: 150000, def: 30000 },
      f: [['title', 'Titlu', 'text'], ['text', 'Text', 'area']] },
    footer: { name: 'Subsol', group: 'Bază', variants: [['simple', 'Simplu']], d: { name: '', line: 'Târgu Mureș' }, f: [['name', 'Nume', 'text'], ['line', 'Text', 'text']] }
  };
  var block = function (type, d, s, v) {
    var L = LIB[type]; var data = JSON.parse(JSON.stringify(L.d)); Object.keys(d || {}).forEach(function (k) { data[k] = d[k]; });
    return { id: uid(), type: type, v: v || L.variants[0][0], d: data, s: Object.assign({ bg: 'bg', pad: 'm', align: 'left', width: 'normal', anim: 'inherit', btn: 'inherit', img: 'right' }, s || {}) };
  };
  var brand = function (name, pal, fonts, extra) {
    var p = PALETTES.filter(function (x) { return x.id === pal; })[0] || PALETTES[0], f = FONT_PAIRS.filter(function (x) { return x.id === fonts; })[0] || FONT_PAIRS[0];
    return Object.assign({ name: name, palette: p.id, colors: JSON.parse(JSON.stringify(p.colors)), fontPair: f.id, headFont: f.head, bodyFont: f.body, radius: 14, btnShape: 'pill', btnStyle: 'fill', anim: 'up', animSpeed: 'normal', density: 'normal' }, extra || {});
  };

  /* ---------- AI builder (local stand-in) ---------- */
  var KINDS = [
    { k: /salon|coafur|frizer|barber|unghii|manichiur|beauty|înfrumuse/i, type: 'salon', pal: 'roz', fonts: 'elegant', book: true, hero: 'center',
      title: function (n, c) { return 'Te simți bine în pielea ta, la ' + n; }, feats: [['Programare fără așteptare', 'Alegi ora online și vii direct.'], ['Produse profesionale', 'Lucrăm doar cu produse în care avem încredere.'], ['Sfaturi sincere', 'Îți spunem ce ți se potrivește, nu ce e mai scump.']],
      prices: [['Tuns', '70 lei'], ['Coafat', '80 lei'], ['Vopsit', 'de la 150 lei']], services: ['Tuns', 'Coafat', 'Vopsit'] },
    { k: /pensiune|cazare|camer|vil[aă]|cabana|cabană|hotel/i, type: 'pensiune', pal: 'padure', fonts: 'editorial', book: true, hero: 'cover',
      title: function (n, c) { return 'Liniște și aer curat' + (c ? ' lângă ' + c : '') + ', la ' + n; }, feats: [['Mic dejun de casă', 'Cu produse de la gospodăriile din zonă.'], ['Camere liniștite', 'Paturi bune, baie proprie, Wi-Fi.'], ['Rezervi direct', 'Fără comision, cu răspuns rapid.']],
      prices: [['Cameră dublă', '280 lei / noapte'], ['Apartament', '420 lei / noapte']], services: ['Cameră dublă', 'Apartament'] },
    { k: /restaurant|pizz|bistro|cafenea|cafe|bar|cofet|patiser|brut[aă]r/i, type: 'restaurant', pal: 'noapte', fonts: 'editorial', book: true, hero: 'cover',
      title: function (n, c) { return 'Mâncare bună, făcută cu răbdare, la ' + n; }, feats: [['Ingrediente proaspete', 'Gătim zilnic, din ce e bun în sezon.'], ['Rezervi o masă online', 'Alegi ora și numărul de persoane.'], ['Livrare în oraș', 'Comanzi la telefon sau pe site.']],
      prices: [['Meniul zilei', '35 lei'], ['Pizza', 'de la 32 lei'], ['Desert', '22 lei']], services: ['Masă pentru 2', 'Masă pentru 4', 'Eveniment'] },
    { k: /service|auto|mașin|masin|vulcaniz|itp|mecanic/i, type: 'auto', pal: 'mare', fonts: 'modern', book: true, hero: 'split',
      title: function (n, c) { return 'Mașina ta, reparată corect și la timp'; }, feats: [['Diagnoză clară', 'Îți spunem ce are mașina înainte să lucrăm.'], ['Preț spus dinainte', 'Fără surprize la final.'], ['Programare online', 'Alegi ziua, noi pregătim piesele.']],
      prices: [['Schimb ulei', 'de la 150 lei'], ['Diagnoză', '100 lei'], ['Vulcanizare', 'de la 80 lei']], services: ['Revizie', 'Diagnoză', 'Vulcanizare'] },
    { k: /tâmpl|tampl|lemn|mobil|construc|modul|acoperi|renov|instal/i, type: 'atelier', pal: 'lut', fonts: 'clasic', book: false, rates: true, hero: 'split',
      title: function (n, c) { return 'Făcut de mână, în atelierul nostru' + (c ? ' din ' + c : ''); }, feats: [['Pe dimensiunile tale', 'Lucrăm după măsurile și ideea ta.'], ['Materiale bune', 'Lemn uscat corect, feronerie solidă.'], ['Montaj inclus', 'Aducem și montăm noi.']],
      prices: [['Masă la comandă', 'de la 2.400 lei'], ['Raft', 'de la 600 lei']], services: [] }
  ];
  var DEF = { type: 'firma', pal: 'grafit', fonts: 'curat', book: false, hero: 'split', title: function (n) { return n + ': tot ce ai nevoie, într-un singur loc'; },
    feats: [['Răspundem repede', 'Îți scriem sau te sunăm în aceeași zi.'], ['Prețuri clare', 'Știi de la început cât costă.'], ['Aproape de tine', 'Suntem din zonă și venim la tine.']], prices: [['Serviciu', 'de la 100 lei']], services: [] };

  function generate(prompt) {
    var p = String(prompt || ''), kind = KINDS.filter(function (k) { return k.k.test(p); })[0] || DEF;
    var name = (p.match(/(?:numit|numele|se nume[sș]te|firma|salonul|pensiunea|restaurantul|atelierul)\s+[„"']?([A-ZĂÂÎȘȚ][\wăâîșțĂÂÎȘȚ\- ]{1,30}?)(?=[,.„"'”]|\s+(?:din|în|la|cu|și)\b|$)/) || [])[1] ||
      (p.match(/[„"']([^"'”]{2,30})[”"']/) || [])[1] || 'Afacerea ta';
    var city = (p.match(/\b(?:din|în|la)\s+([A-ZĂÂÎȘȚ][a-zăâîșț]+(?:[ -][A-ZĂÂÎȘȚ][a-zăâîșț]+)?)/) || [])[1] || '';
    var phone = (p.match(/0\d{3}[\s.]?\d{3}[\s.]?\d{3}/) || [])[0] || '07xx xxx xxx';
    var blocks = [
      block('nav', { logo: name, btn: kind.book ? 'Programează-te' : 'Sună acum' }),
      block('hero', { kicker: city || 'Bine ai venit', title: kind.title(name, city), text: 'Suntem ' + name + (city ? ' din ' + city : '') + '. Află ce facem, cât costă și cum ne găsești, totul pe o singură pagină.', btn: kind.book ? 'Programează-te' : 'Cere ofertă', btn2: 'Vezi prețurile' }, { pad: 'l', align: kind.hero === 'center' ? 'center' : 'left' }, kind.hero),
      block('features', { title: 'De ce ' + name, items: kind.feats.map(function (f) { return { t: f[0], x: f[1] }; }) }, { bg: 'surface' }, kind.type === 'auto' ? 'numbers' : 'cards'),
      block('prices', { items: kind.prices }, {}, kind.type === 'restaurant' ? 'cards' : 'list'),
      block('gallery', { title: 'Din ' + (kind.type === 'pensiune' ? 'pensiune' : kind.type === 'restaurant' ? 'bucătărie' : 'lucrările noastre') }, {}, 'masonry')
    ];
    if (kind.book) blocks.push(block('booking', { services: kind.services }, { bg: 'surface', align: 'center' }));
    if (kind.rates) blocks.push(block('calc', { title: 'Plătești în rate', text: 'Vezi cât ar fi rata lunară pentru proiectul tău.' }, { bg: 'surface', align: 'center' }));
    blocks.push(block('faq', { items: [{ q: 'Cum vă pot contacta cel mai repede?', a: 'Sună-ne la ' + phone + ' sau scrie-ne pe WhatsApp.' }, { q: 'Unde vă găsesc?', a: 'Adresa și harta sunt mai jos, la Program și contact.' }] }));
    blocks.push(block('hours', { address: city ? 'Strada, număr, ' + city : 'Strada, număr, oraș', phone: phone }));
    blocks.push(block('cta', { title: 'Hai să vorbim', text: 'Ne găsești la ' + phone + '. Îți răspundem azi.', btn: 'Sună acum', btn2: 'WhatsApp' }, { bg: 'dark', align: 'center' }, 'band'));
    blocks.push(block('footer', { name: name, line: city || '' }));
    return { brand: brand(name, kind.pal, kind.fonts), blocks: blocks };
  }

  /* "edit by message": understands a few simple Romanian instructions */
  var COLORS = { verde: '#2F6B45', albastru: '#1F6FB2', rosu: '#C0392B', roșu: '#C0392B', portocaliu: '#E8641B', galben: '#E9B44C', mov: '#6D4DC2', roz: '#C2456B', negru: '#141414', maro: '#8A5A3B', auriu: '#C9A227', turcoaz: '#14A3A3' };
  function command(model, text, selId) {
    var t = String(text || '').toLowerCase().trim(), did = [];
    var sel = model.blocks.filter(function (b) { return b.id === selId; })[0];
    Object.keys(COLORS).forEach(function (c) { if (t.indexOf(c) > -1 && /culoar|accent|buton|principal/.test(t)) { model.brand.colors.accent = COLORS[c]; did.push('culoarea principală: ' + c); } });
    if (/butoan.*(rotunj|pastil|pill)/.test(t)) { model.brand.btnShape = 'pill'; did.push('butoane rotunjite'); }
    if (/butoan.*(drept|p[aă]trat|col[tț]uri drepte)/.test(t)) { model.brand.btnShape = 'square'; did.push('butoane drepte'); }
    if (/butoan.*contur/.test(t)) { model.brand.btnStyle = 'outline'; did.push('butoane cu contur'); }
    if (/f[aă]r[aă] anima/.test(t)) { model.brand.anim = 'none'; did.push('fără animații'); }
    else if (/anima.*(zoom|m[aă]rire)/.test(t)) { model.brand.anim = 'zoom'; did.push('animații zoom'); }
    else if (/anima.*(lateral|st[aâ]nga|alunec)/.test(t)) { model.brand.anim = 'left'; did.push('animații din lateral'); }
    else if (/anima/.test(t)) { model.brand.anim = 'up'; did.push('animații de jos în sus'); }
    var fxT = sel || model.blocks.filter(function (x) { return x.type === 'hero'; })[0], fx = null;
    if (/parallax|adâncime|adancime/.test(t)) fx = ['parallax', 'imagine în adâncime'];
    else if (/(text\w* urc|imagin\w* coboar|derulare)/.test(t)) fx = ['split', 'imaginea coboară, textul urcă'];
    else if (/peste sec|urc[aă] peste/.test(t)) fx = ['cover', 'secțiunea urcă peste cea de sus'];
    else if (/f[aă]r[aă] efect/.test(t)) fx = ['none', 'fără efect la derulare'];
    if (fx && fxT) { fxT.s.fx = fx[0]; did.push(fx[1]); }
    if (/(mai )?(rotunjit|rotund)/.test(t) && /col[tț]/.test(t)) { model.brand.radius = 24; did.push('colțuri mai rotunjite'); }
    if (/col[tț]uri drepte|f[aă]r[aă] rotunj/.test(t) && !/butoan/.test(t)) { model.brand.radius = 0; did.push('colțuri drepte'); }
    if (/(temă|tema|fundal) (închis|inchis|întunecat|dark)|mod (închis|întunecat)/.test(t)) { var p = PALETTES[2]; model.brand.colors = Object.assign({}, p.colors, { accent: model.brand.colors.accent }); did.push('temă închisă'); }
    if (/(temă|tema|fundal) (deschis|luminos|alb)/.test(t)) { var q = PALETTES[0]; model.brand.colors = Object.assign({}, q.colors, { accent: model.brand.colors.accent }); did.push('temă deschisă'); }
    var m = text.match(/titlu(?:l)?\s*[:=]\s*(.+)$/i); if (m) { var h = sel && sel.d.title !== undefined ? sel : model.blocks.filter(function (b) { return b.type === 'hero'; })[0]; if (h) { h.d.title = m[1].trim(); did.push('titlu nou'); } }
    var add = t.match(/adaug[aă]\s+(?:o |un )?(galerie|pre[tț]uri|întrebări|intrebari|program[aă]ri|calculator|avantaje|îndemn|contact)/);
    if (add) { var map = { galerie: 'gallery', 'prețuri': 'prices', preturi: 'prices', 'întrebări': 'faq', intrebari: 'faq', programari: 'booking', 'programări': 'booking', calculator: 'calc', avantaje: 'features', 'îndemn': 'cta', contact: 'hours' }; var ty = map[add[1]]; if (ty) { model.blocks.splice(model.blocks.length - 1, 0, block(ty)); did.push('secțiune nouă: ' + LIB[ty].name); } }
    if (sel && /centr/.test(t)) { sel.s.align = 'center'; did.push('secțiunea aleasă, centrată'); }
    if (sel && /(la |în )?st[aâ]nga/.test(t) && !/anima/.test(t)) { sel.s.align = 'left'; did.push('aliniere la stânga'); }
    return did;
  }


  /* turn an existing simple site (texts, prices, hours) into a block model */
  function fromSite(site) {
    var c = site.content || {}, a = site.addons || {}, kind = /pensiune/i.test(site.type) ? 'padure' : /salon|înfrumuse/i.test(site.type) ? 'roz' : /tâmpl|tampl|lemn/i.test(site.type) ? 'lut' : 'lut';
    var fonts = kind === 'roz' ? 'elegant' : kind === 'padure' ? 'editorial' : 'clasic';
    var blocks = [
      block('nav', { logo: site.name, btn: a.booking ? 'Programează-te' : 'Sună acum' }),
      block('hero', { kicker: (c.address || '').split(',').pop().trim(), title: c.heroTitle, text: c.heroText, btn: a.booking ? 'Programează-te' : 'Cere ofertă', btn2: 'Vezi prețurile' }, { pad: 'l' }),
      block('features', { title: 'Despre ' + site.name, text: c.about, items: [{ t: 'Programare simplă', x: 'Alegi ora online sau ne suni.' }, { t: 'Lucru atent', x: 'Ne luăm timpul să facem lucrurile bine.' }, { t: 'Aproape de tine', x: c.address || '' }] }, { bg: 'surface' }),
      block('prices', { items: c.prices || [] })
    ];
    if (a.booking) blocks.push(block('booking', { services: (c.prices || []).map(function (p) { return p[0]; }).slice(0, 4) }, { bg: 'surface', align: 'center' }));
    blocks.push(block('gallery', {}, {}, 'masonry'));
    blocks.push(block('hours', { hours: c.hours || [], address: c.address, phone: c.phone, map: !!a.map }));
    blocks.push(block('cta', { title: 'Hai să vorbim', text: 'Ne găsești la ' + (c.phone || '') + '.', btn: 'Sună acum', btn2: 'WhatsApp' }, { bg: 'dark', align: 'center' }));
    blocks.push(block('footer', { name: site.name, line: c.address || '' }));
    return { brand: brand(site.name, kind, fonts), blocks: blocks };
  }

  window.OHIModel = { LIB: LIB, PALETTES: PALETTES, FONT_PAIRS: FONT_PAIRS, block: block, brand: brand, generate: generate, command: command, uid: uid, fromSite: fromSite };
})();
