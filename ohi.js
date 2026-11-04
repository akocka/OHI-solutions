/* OHI behaviour for the new pages: reveals, lead form, billing toggle, chat demo, automation flow, portfolio previews. */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

  /* reveal on scroll */
  if('IntersectionObserver' in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    $$('.rv').forEach(function(el){io.observe(el)});
  }else $$('.rv').forEach(function(el){el.classList.add('in')});

  /* billing toggle: buttons [data-bill] show the matching [data-plans] group */
  $$('[data-bill]').forEach(function(b){b.addEventListener('click',function(){
    var v=b.dataset.bill;$$('[data-bill]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
    $$('[data-plans]').forEach(function(g){g.hidden=g.dataset.plans!==v;if(!g.hidden)$$('.rv',g).forEach(function(r){r.classList.add('in')})});
  })});

  /* chat demo: plays bubbles one by one when it scrolls into view */
  var chat=$('#chatDemo');
  if(chat){var bubs=$$('.bub',chat),typing=$('.typing',chat),played=false;
    function play(){if(played)return;played=true;var t=0;
      bubs.forEach(function(b){var bot=b.classList.contains('b');
        if(bot&&!reduce){setTimeout(function(){typing.classList.add('show');b.parentNode.insertBefore(typing,b)},t);t+=900}
        setTimeout(function(){typing.classList.remove('show');b.classList.add('show')},t);t+=bot?700:1100});
    }
    if(reduce)bubs.forEach(function(b){b.classList.add('show')});
    else new IntersectionObserver(function(e,o){if(e[0].isIntersecting){o.disconnect();play()}},{threshold:.4}).observe(chat);
  }

  /* automation flow: steps light up one after another */
  var flow=$('#flowDemo');
  if(flow){var li=$$('li',flow),k=0,tm=null;
    function step(){li.forEach(function(x,i){x.classList.toggle('on',i<=k)});k=(k+1)%(li.length+2)}
    if(reduce)li.forEach(function(x){x.classList.add('on')});
    else new IntersectionObserver(function(e){if(e[0].isIntersecting){if(!tm)tm=setInterval(step,900)}else{clearInterval(tm);tm=null}},{threshold:.3}).observe(flow);
  }

  /* portfolio cards: play the preview video while the card is on screen */
  var cards=$$('.pcard[data-v]');
  if(cards.length&&!reduce){var vo=new IntersectionObserver(function(es){es.forEach(function(e){var c=e.target,v=$('video',c);
      if(e.isIntersecting){if(!v.src)v.src=c.dataset.v;var p=v.play();if(p&&p.then)p.then(function(){c.classList.add('play')}).catch(function(){})}
      else{v.pause();c.classList.remove('play')}})},{threshold:.55});
    cards.forEach(function(c){vo.observe(c)})}

  /* demo form → Make webhook (CRM "Leads"). Same fields and IDs as before. */
  var form=$('#leadForm');if(!form)return;
  var WEBHOOK="https://hook.eu2.make.com/pjyknr3dp5tb8b5stpbit53yqluizecy";
  var LIVE=/(^|\.)vercel\.app$|\.ro$/.test(location.hostname);
  var LOCK="ohi-lead-sent";
  function locked(){try{var r=JSON.parse(localStorage.getItem(LOCK)||"null");if(r&&Date.now()-r.at<30*864e5)return r}catch(e){}return null}
  function lock(r){try{r.at=Date.now();localStorage.setItem(LOCK,JSON.stringify(r))}catch(e){}}
  var Q={type:"",plan:""},T0=performance.now();
  var qp=(new URLSearchParams(location.search).get('pachet')||'').toLowerCase();
  var PL={start:'Start',basic:'Start',business:'Business',ultra:'Business',pro:'Pro',gratuit:'Gratuit (primele 5)'};
  var planNote=$('#planNote');
  function setPlan(p){Q.plan=p||'';if(planNote)planNote.textContent=Q.plan?('Pachet ales: '+Q.plan+'. Îl poți schimba oricând.'):'Fără avans și fără obligații.'}
  if(PL[qp])setPlan(PL[qp]);
  var QM=(new URLSearchParams(location.search).get('model')||'').replace(/[^a-z-]/g,'').slice(0,30);
  if(QM&&planNote)planNote.textContent='Model ales: '+QM+'. Îl adaptăm pentru afacerea ta.';
  var qbiz=(new URLSearchParams(location.search).get('biz')||'').slice(0,80);
  if(qbiz&&$('#qBiz'))$('#qBiz').value=qbiz;
  var qtel=(new URLSearchParams(location.search).get('tel')||'').replace(/[^\d+ ]/g,'').slice(0,20);
  if(qtel&&$('#lPhone')){$('#lPhone').value=qtel;var dm=document.getElementById('demo');if(dm)setTimeout(function(){dm.scrollIntoView({block:'start'});var b=$('#qBiz');if(b)b.focus({preventScroll:true})},300)}
  var qt=$('#qType');
  if(qt)qt.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;Q.type=b.dataset.v;
    $$('button',qt).forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
    $('#qOther').hidden=Q.type!=='Altceva';if(Q.type==='Altceva')$('#qOther').focus()});
  if(!LIVE&&$('#pvNote'))$('#pvNote').textContent='Previzualizare: aici formularul nu trimite nimic. Pe site-ul live, cererea ajunge în CRM.';
  form.addEventListener('submit',function(e){
    e.preventDefault();var err=$('#lErr'),biz=$('#qBiz').value.trim(),name=$('#lName').value.trim(),phone=$('#lPhone').value.trim(),link=($('#qLink')||{value:''}).value.trim();
    var type=Q.type==='Altceva'?($('#qOther').value.trim()||'Altceva'):Q.type;
    if(!biz){err.textContent='Scrie numele afacerii.';$('#qBiz').focus();return}
    if(qt&&!Q.type){err.textContent='Alege domeniul afacerii.';$('button',qt).focus();return}
    if(!name){err.textContent='Scrie-ți numele.';$('#lName').focus();return}
    if(phone.replace(/\D/g,'').length<9){err.textContent='Lasă un număr de telefon complet, ca să te putem suna.';$('#lPhone').focus();return}
    if(!$('#lOk').checked){err.textContent='Bifează acordul ca să te putem contacta.';return}
    var prev=locked();if(prev){err.textContent='Ai trimis deja o cerere'+(prev.id?' (cod '+prev.id+')':'')+'. Pentru modificări, sună-ne la 0740 267 706.';return}
    err.textContent='';
    var id='REQ-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(),mk=!!($('#lMk')&&$('#lMk').checked);
    function finish(){lock({id:id,name:name,biz:biz});$('#leadFields').hidden=true;$('#leadDone').hidden=false;$('#leadId').textContent='Cod cerere: '+id}
    if($('#lHp').value||performance.now()-T0<3000){finish();return}
    var src=form.dataset.source||'site-demo-rapid',topic=form.dataset.topic||'Site nou · demo gratuit';
    var data=new URLSearchParams({created_at:new Date().toISOString(),source:src,request_id:id,name:name,business:biz,phone:phone,email:'',business_type:type,website:link,
      need:topic+(Q.plan?(' · pachet: '+Q.plan):''),message:'Cerere de pe '+location.pathname+'.\nDomeniu: '+(type||'-')+'\nFacebook/Instagram/site: '+(link||'-')+'\nPachet: '+(Q.plan||'nealeas')+(QM?'\nModel ales: '+QM:'')+'\nMarketing: '+(mk?'DA':'nu'),
      marketing_consent:mk?'da':'nu',consent_at:new Date().toISOString(),design_json:''});
    var btn=$('#lSend'),lb=$('.lb',btn);btn.disabled=true;lb.textContent='Se trimite…';
    if(!LIVE){setTimeout(finish,600);return}
    var ctrl=new AbortController(),tm=setTimeout(function(){ctrl.abort()},15000);
    /* Same rule as the old form: a network/CORS error still counts as sent (the webhook receives it),
       only a timeout or an explicit HTTP error shows the retry message. */
    fetch(WEBHOOK,{method:'POST',body:data,signal:ctrl.signal}).then(function(res){clearTimeout(tm);if(!res.ok)throw new Error('http '+res.status);finish()})
      .catch(function(x){clearTimeout(tm);
        if(x&&x.name!=='AbortError'&&String(x.message||'').indexOf('http ')!==0){finish();return}
        btn.disabled=false;lb.textContent='Trimite cererea';err.textContent='Nu s-a putut trimite. Încearcă din nou sau sună-ne la 0740 267 706.'});
  });
})();
