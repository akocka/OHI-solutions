/* OHI shared shell behaviour: header state, reading progress, mobile menu. Loaded on every page. */
(function(){
  var hd=document.getElementById('ohd'),pr=document.getElementById('oprog'),bg=document.getElementById('oburger'),mn=document.getElementById('omnav');
  if(!hd)return;
  var tick=false;
  function upd(){tick=false;hd.classList.toggle('sc',scrollY>16);
    if(pr){var m=document.documentElement.scrollHeight-innerHeight;pr.style.width=(m>0?Math.min(100,scrollY/m*100):0)+'%'}}
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
  addEventListener('resize',upd);upd();
  function setMenu(o){document.documentElement.classList.toggle('o-mo',o);if(bg)bg.setAttribute('aria-expanded',o?'true':'false');
    document.documentElement.style.overflow=o?'hidden':''}
  if(bg)bg.addEventListener('click',function(){setMenu(!document.documentElement.classList.contains('o-mo'))});
  if(mn)mn.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
  addEventListener('resize',function(){if(innerWidth>1100)setMenu(false)});
})();
// footer wordmark: fit the faded "OHI Solutions" exactly to the footer width
(function(){
  function fit(){var s=document.getElementById('oWm'),t=document.getElementById('oWmT');if(!s||!t)return;
    try{var b=t.getBBox();if(b.width)s.setAttribute('viewBox',b.x+' '+b.y+' '+b.width+' '+b.height)}catch(e){}}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);else addEventListener('load',fit);
  addEventListener('resize',fit);fit();
})();

/* privacy: footer "Sună-mă" keeps the phone out of the URL; every lead form shows a short privacy note */
(function () {
  document.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('.o-ftform'); if (!f) return;
    e.preventDefault();
    var v = ((f.elements.tel || {}).value || '').replace(/[^\d+ ]/g, '').slice(0, 20);
    try { sessionStorage.setItem('ohi-tel', v); } catch (x) {}
    var t = document.getElementById('qfTel');
    if (t && document.getElementById('oferta')) { t.value = v; document.getElementById('oferta').scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(function () { var b = document.getElementById('qfName') || document.getElementById('qfBiz'); if (b) b.focus({ preventScroll: true }); }, 500); }
    else location.href = '/#oferta';
  }, true);
  function note(f) {
    if (f.dataset.priv || !f.querySelector('input[type=tel],input[type=email]')) return; f.dataset.priv = '1';
    var p = document.createElement('p'); p.className = 'o-fpriv';
    p.innerHTML = 'Folosim datele doar ca să-ți răspundem la cerere. Detalii în <a href="/confidentialitate">Politica de confidențialitate</a>.';
    if (f.classList.contains('o-ftform')) f.parentNode.appendChild(p); else f.appendChild(p);
  }
  function scan() { [].forEach.call(document.querySelectorAll('form'), note); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  new MutationObserver(function (m) { m.forEach(function (r) { [].forEach.call(r.addedNodes, function (n) { if (n.nodeType === 1) { if (n.tagName === 'FORM') note(n); else if (n.querySelectorAll) [].forEach.call(n.querySelectorAll('form'), note); } }); }); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();


/* where this visit came from (first page of the visit only; kept in this tab, sent only with a form) */
(function () {
  try {
    if (sessionStorage.getItem('ohi-src')) return;
    var q = new URLSearchParams(location.search), r = '';
    try { r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    if (r === location.hostname.replace(/^www\./, '')) r = '';
    var src = (q.get('utm_source') || '').toLowerCase().slice(0, 40) || (q.get('gclid') ? 'google-ads' : q.get('fbclid') ? 'facebook' :
      /google\./.test(r) ? 'google' : /facebook|fb\.|messenger/.test(r) ? 'facebook' : /instagram/.test(r) ? 'instagram' :
      /tiktok/.test(r) ? 'tiktok' : /bing|duckduckgo|yahoo/.test(r) ? 'cautare' : r ? r.slice(0, 40) : 'direct');
    var camp = [q.get('utm_medium'), q.get('utm_campaign')].filter(Boolean).join(' / ').slice(0, 80);
    sessionStorage.setItem('ohi-src', JSON.stringify({ src: src, campaign: camp, landing: location.pathname.slice(0, 120) }));
  } catch (e) {}
})();
