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
  addEventListener('resize',function(){if(innerWidth>1180)setMenu(false)});
})();
// footer wordmark: fit the faded "OHI Solutions" exactly to the footer width
(function(){
  function fit(){var s=document.getElementById('oWm'),t=document.getElementById('oWmT');if(!s||!t)return;
    try{var b=t.getBBox();if(b.width)s.setAttribute('viewBox',b.x+' '+b.y+' '+b.width+' '+b.height)}catch(e){}}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);else addEventListener('load',fit);
  addEventListener('resize',fit);fit();
})();
