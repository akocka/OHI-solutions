/* OHI forms: one module, several forms, each sent to the same Make webhook with its own `source`.
   Buttons:  <a href="/#oferta" data-form="automatizari">  open a pop-up form (falls back to the homepage form without JS).
   Inline:   <div data-ohi-form="intrebare"></div>         renders the form in place. */
(function () {
  if (window.__ohiForms) return; window.__ohiForms = 1;
  var HOOK = 'https://hook.eu2.make.com/pjyknr3dp5tb8b5stpbit53yqluizecy';
  var LIVE = /(^|\.)vercel\.app$|\.ro$/.test(location.hostname);
  var V = {
    automatizari: { k: 'Automatizări', t: 'Ce vrei să meargă <em>singur?</em>', s: 'Spune-ne ce faci acum de mână. Îți spunem ce se poate automatiza și cât costă, înainte să lucrăm.',
      q: 'Ce ai vrea să se facă singur?', chips: ['Cererile salvate în tabel', 'Răspuns automat pe email', 'Cerere de recenzii', 'Programări în calendar', 'Altceva'],
      f: ['biz', 'tel', 'site', 'msg'], src: 'site-automatizari', need: 'Automatizări', go: 'Trimite cererea', ok: 'Te sunăm să vorbim despre automatizări.' },
    personalizate: { k: 'Funcții personalizate', t: 'Primești <em>prețul fix</em> pentru ce ai ales', s: 'Verifică funcțiile, lasă-ne un telefon și te sunăm pentru un apel scurt de 15 minute.',
      q: 'Ce funcții vrei pe site?', chips: [], f: ['biz', 'tel', 'site', 'msg'], src: 'site-personalizate', need: 'Funcții personalizate', go: 'Cere oferta', ok: 'Te sunăm cu oferta pentru funcțiile alese.' },
    abonament: { k: 'Abonamente · în curând', t: 'Te anunțăm <em>primul</em>', s: 'Abonamentele pornesc după înregistrarea firmei. Lasă-ne un telefon și te sunăm când sunt gata.',
      q: 'Ce te interesează?', chips: ['Mentenanță', 'Asistent AI', 'Totul inclus'], f: ['name', 'tel'], src: 'site-abonamente', need: 'Abonament · anunță-mă', go: 'Anunță-mă', ok: 'Te anunțăm când pornesc abonamentele.' },
    intrebare: { k: 'Ajutor', t: 'Pune-ne o <em>întrebare</em>', s: 'Îți răspundem noi, un om din echipă, de obicei în aceeași zi.',
      f: ['name', 'tel', 'msgReq'], src: 'site-ajutor', need: 'Întrebare', go: 'Trimite întrebarea', ok: 'Îți răspundem cât mai repede.' }
  };
  var FIELD = {
    name: '<label class="fm-l"><span>Numele tău</span><input name="name" autocomplete="name" maxlength="80"></label>',
    biz: '<label class="fm-l"><span>Numele afacerii</span><input name="biz" autocomplete="organization" maxlength="80" placeholder="ex. Salon Ana"></label>',
    tel: '<label class="fm-l"><span>Telefon</span><input name="tel" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="07xx xxx xxx"></label>',
    site: '<label class="fm-l"><span>Site sau pagina de Facebook <small>(opțional)</small></span><input name="site" type="url" inputmode="url" maxlength="160" placeholder="https://"></label>',
    msg: '<label class="fm-l fm-w"><span>Detalii <small>(opțional)</small></span><textarea name="msg" rows="3" maxlength="800" placeholder="Cum lucrezi acum, ce te încurcă…"></textarea></label>',
    msgReq: '<label class="fm-l fm-w"><span>Întrebarea ta</span><textarea name="msg" rows="4" maxlength="800" placeholder="Scrie aici…"></textarea></label>'
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  function build(key, opts) {
    var v = V[key]; opts = opts || {};
    var chips = (opts.chips && opts.chips.length ? opts.chips : v.chips) || [];
    var pre = opts.pre || [];
    var f = document.createElement('form'); f.className = 'fm-f'; f.noValidate = true; f.dataset.key = key;
    f.innerHTML =
      '<p class="fm-k">' + v.k + '</p><h3 class="fm-t">' + v.t + '</h3><p class="fm-s">' + v.s + '</p>' +
      (chips.length ? '<div class="fm-q"><span>' + v.q + '</span><div class="fm-chips">' + chips.map(function (c) {
        var on = pre.indexOf(c) > -1;
        return '<button type="button" class="fm-c" aria-pressed="' + on + '">' + esc(c) + '</button>'; }).join('') + '</div></div>' : '') +
      '<div class="fm-g">' + v.f.map(function (x) { return FIELD[x]; }).join('') + '</div>' +
      '<input class="fm-hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="fm-end"><button type="submit" class="fm-go"><span>' + v.go + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
      '<p class="fm-alt">sau sună-ne: <a href="tel:+40740267706">0740 267 706</a></p></div>' +
      '<p class="fm-msg" role="status" aria-live="polite"></p>' +
      '<p class="fm-note">Folosim datele doar ca să te contactăm despre această cerere.</p>';
    var t0 = Date.now(), sent = false, msgEl = f.querySelector('.fm-msg'), go = f.querySelector('.fm-go');
    var say = function (t, bad) { msgEl.textContent = t; msgEl.classList.toggle('bad', !!bad); };
    f.addEventListener('click', function (e) { var c = e.target.closest('.fm-c'); if (c) c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true'); });
    f.addEventListener('submit', async function (e) {
      e.preventDefault(); if (sent) return;
      var g = function (n) { var el = f.elements[n]; return el ? el.value.trim() : ''; };
      var picked = [].slice.call(f.querySelectorAll('.fm-c[aria-pressed="true"]')).map(function (c) { return c.textContent; });
      if (f.elements.biz && !g('biz')) { say('Scrie numele afacerii.', 1); f.elements.biz.focus(); return; }
      if (f.elements.name && !f.elements.biz && !g('name')) { say('Scrie-ne numele tău.', 1); f.elements.name.focus(); return; }
      if (g('tel').replace(/\D/g, '').length < 9) { say('Lasă un număr de telefon complet, ca să te putem suna.', 1); f.elements.tel.focus(); return; }
      if (v.f.indexOf('msgReq') > -1 && g('msg').length < 3) { say('Scrie întrebarea ta.', 1); f.elements.msg.focus(); return; }
      var done = function () { sent = true; f.classList.add('ok'); go.disabled = true; go.firstChild.textContent = 'Trimis ✓';
        say('Mulțumim' + (g('name') ? ', ' + g('name').split(' ')[0] : '') + '! ' + v.ok + (LIVE ? '' : ' (previzualizare: nu s-a trimis nimic)')); };
      if (g('company') || Date.now() - t0 < 2500) { done(); return; }
      var id = 'OHI-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      var data = new URLSearchParams({ created_at: new Date().toISOString(), source: v.src, request_id: id, name: g('name'), business: g('biz'), phone: g('tel'), email: '',
        business_type: '', website: g('site'), need: v.need + (picked.length ? ' · ' + picked.join(', ') : ''),
        message: (picked.length ? v.q + ': ' + picked.join(', ') + '\n' : '') + (g('msg') ? 'Mesaj: ' + g('msg') + '\n' : '') + 'Pagina: ' + location.pathname, page: location.pathname });
      if (!LIVE) { console.log('[OHI forms] preview, not sent:', Object.fromEntries(data)); done(); return; }
      go.disabled = true; var old = go.firstChild.textContent; go.firstChild.textContent = 'Se trimite…';
      try {
        var ctrl = new AbortController(), tm = setTimeout(function () { ctrl.abort(); }, 15000);
        var r = await fetch(HOOK, { method: 'POST', body: data, signal: ctrl.signal }); clearTimeout(tm);
        if (!r.ok) throw 0; done();
      } catch (x) { go.disabled = false; go.firstChild.textContent = old; say('Nu s-a putut trimite. Sună-ne la 0740 267 706 sau scrie-ne pe WhatsApp.', 1); }
    });
    return f;
  }

  /* inline forms */
  [].forEach.call(document.querySelectorAll('[data-ohi-form]'), function (box) { if (V[box.dataset.ohiForm]) box.appendChild(build(box.dataset.ohiForm)); });

  /* pop-up forms */
  var dlg = null, last = null;
  function open(key, src) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'fm-d'; dlg.setAttribute('aria-label', 'Formular');
      dlg.innerHTML = '<div class="fm-p"><button type="button" class="fm-x" aria-label="Închide">×</button><div class="fm-body"></div></div>';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('.fm-x')) close(); });
      dlg.addEventListener('close', function () { document.documentElement.classList.remove('fm-lock'); if (last) last.focus({ preventScroll: true }); });
    }
    var list = (src && src.dataset.chips || '').split('|').filter(Boolean);
    var body = dlg.querySelector('.fm-body'); body.innerHTML = '';
    body.appendChild(build(key, { chips: list.length ? list : null, pre: (src && src.dataset.pre || '').split('|') }));
    last = src; document.documentElement.classList.add('fm-lock');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    var first = body.querySelector('input:not(.fm-hp),textarea'); if (first && matchMedia('(min-width: 700px)').matches) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
  }
  function close() { if (!dlg) return; dlg.classList.add('out'); setTimeout(function () { dlg.classList.remove('out'); dlg.close ? dlg.close() : dlg.removeAttribute('open'); }, 220); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-form]'); if (!a || !V[a.dataset.form]) return;
    e.preventDefault(); open(a.dataset.form, a);
  });
  window.ohiForm = open;
})();
