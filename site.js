/* OHI shared page behaviour: header state, mobile menu, demo form → Make webhook, counters. Needs motion.js first. */
(function(){
  const {reduce,clamp}=window.OHI||{reduce:true,clamp:(v,a,b)=>Math.min(b,Math.max(a,v))};
  const $=s=>document.querySelector(s);
  requestAnimationFrame(()=>{document.body.classList.add('ready');setTimeout(()=>document.body.classList.remove('intro'),40)});
  const hd=$('#hd');if(hd){const f=()=>hd.classList.toggle('sc',scrollY>10);addEventListener('scroll',f,{passive:true});f()}
  const bg=$('#burger'),nv=$('#nav');
  if(bg&&nv){bg.addEventListener('click',()=>{const o=document.body.classList.toggle('menu');bg.setAttribute('aria-expanded',o)});
    nv.addEventListener('click',e=>{if(e.target.closest('a'))document.body.classList.remove('menu')})}
  /* counters */
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)return;const el=en.target,to=+el.dataset.count;io.unobserve(el);
    if(reduce)return;const t0=performance.now();(function f(t){const k=clamp((t-t0)/1100,0,1),e=1-Math.pow(1-k,4);el.textContent=(k<1?Math.round(to*e):to).toLocaleString('ro-RO');if(k<1)requestAnimationFrame(f)})(t0)}),{threshold:.6});
  document.querySelectorAll('[data-count]').forEach(e=>io.observe(e));
  /* demo form → Make webhook (CRM "Leads") */
  const form=$('#leadForm');if(!form)return;
  const WEBHOOK="https://hook.eu2.make.com/pjyknr3dp5tb8b5stpbit53yqluizecy";
  const LIVE=/(^|\.)vercel\.app$|\.ro$/.test(location.hostname);
  const LOCK="ohi-lead-sent";
  const locked=()=>{try{const r=JSON.parse(localStorage.getItem(LOCK)||"null");if(r&&Date.now()-r.at<30*864e5)return r}catch(e){}return null};
  const lock=r=>{try{localStorage.setItem(LOCK,JSON.stringify({...r,at:Date.now()}))}catch(e){}};
  const Q={type:"",plan:""};const T0=performance.now();
  const qp=(new URLSearchParams(location.search).get('pachet')||'').toLowerCase();
  const PL={start:'Start',basic:'Start',business:'Business',ultra:'Business',pro:'Pro',gratuit:'Gratuit (primele 5)'};
  const planNote=$('#planNote');
  function setPlan(p){Q.plan=p||'';if(planNote)planNote.textContent=Q.plan?`Pachet ales: ${Q.plan}. Îl poți schimba oricând.`:'Fără avans și fără obligații.'}
  if(PL[qp])setPlan(PL[qp]);
  document.querySelectorAll('[data-plan]').forEach(a=>a.addEventListener('click',()=>setPlan(a.dataset.plan)));
  const qt=$('#qType');
  if(qt)qt.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;Q.type=b.dataset.v;
    qt.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#qOther').hidden=Q.type!=='Altceva';if(Q.type==='Altceva')$('#qOther').focus()});
  if(!LIVE&&$('#pvNote'))$('#pvNote').textContent='Previzualizare: aici formularul nu trimite nimic. Pe site-ul live, cererea ajunge în CRM.';
  form.addEventListener('submit',async e=>{
    e.preventDefault();const err=$('#lErr'),biz=$('#qBiz').value.trim(),name=$('#lName').value.trim(),phone=$('#lPhone').value.trim(),link=($('#qLink')||{value:''}).value.trim();
    const type=Q.type==='Altceva'?($('#qOther').value.trim()||'Altceva'):Q.type;
    if(!biz){err.textContent='Scrie numele afacerii.';$('#qBiz').focus();return}
    if(qt&&!Q.type){err.textContent='Alege domeniul afacerii.';qt.querySelector('button').focus();return}
    if(!name){err.textContent='Scrie-ți numele.';$('#lName').focus();return}
    if(phone.replace(/\D/g,'').length<9){err.textContent='Lasă un număr de telefon complet, ca să te putem suna.';$('#lPhone').focus();return}
    if(!$('#lOk').checked){err.textContent='Bifează acordul ca să te putem contacta.';return}
    const prev=locked();if(prev){err.textContent=`Ai trimis deja o cerere${prev.id?' (cod '+prev.id+')':''}. Pentru modificări, sună-ne la 0740 267 706.`;return}
    err.textContent='';
    const id='REQ-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase(),mk=!!($('#lMk')&&$('#lMk').checked);
    const finish=()=>{lock({id,name,biz});$('#leadFields').hidden=true;$('#leadDone').hidden=false;$('#leadId').textContent='Cod cerere: '+id};
    if($('#lHp').value||performance.now()-T0<3000){finish();return}
    const src=form.dataset.source||'site-demo-rapid',topic=form.dataset.topic||'Site nou · demo gratuit';
    const data=new URLSearchParams({created_at:new Date().toISOString(),source:src,request_id:id,name,business:biz,phone,email:'',business_type:type,website:link,
      need:topic+(Q.plan?` · pachet: ${Q.plan}`:''),message:`Cerere de pe ${location.pathname}.\nDomeniu: ${type||'-'}\nFacebook/Instagram/site: ${link||'-'}\nPachet: ${Q.plan||'nealeas'}\nMarketing: ${mk?'DA':'nu'}`,
      marketing_consent:mk?'da':'nu',consent_at:new Date().toISOString(),design_json:''});
    const btn=$('#lSend'),lb=btn.querySelector('.lb');btn.disabled=true;lb.textContent='Se trimite…';
    if(!LIVE){setTimeout(finish,600);return}
    try{const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),15000);let res=null;
      try{res=await fetch(WEBHOOK,{method:'POST',body:data,signal:ctrl.signal})}catch(x){if(x.name==='AbortError')throw x}finally{clearTimeout(tm)}
      if(res&&!res.ok)throw new Error('http '+res.status);finish();
    }catch(x){btn.disabled=false;lb.textContent='Trimite cererea';err.textContent='Nu s-a putut trimite. Încearcă din nou sau sună-ne la 0740 267 706.'}
  });
})();
