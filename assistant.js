/* Asistent OHI: answers from the site's own facts (no invented info). Unknown questions → asks for name + phone
   and sends them to the same Make webhook (source "site-asistent"). Built so the answer() step can later call an AI API. */
(function(){
  if(window.__ohiAsst)return;window.__ohiAsst=1;
  const WEBHOOK="https://hook.eu2.make.com/pjyknr3dp5tb8b5stpbit53yqluizecy";
  const LIVE=/(^|\.)vercel\.app$|\.ro$/.test(location.hostname);
  const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]/g,' ');
  const KB=[
    {k:['cost','costa','pret','preturi','tarif','lei','bani','price','how much','abonament','lunar'],a:'Avem două variante. <b>Lunar</b>, cu totul inclus (găzduire, domeniu, modificări), contract 12 luni: Start 99 lei, Business 199 lei, Pro 299 lei pe lună. Sau <b>o singură plată</b>: Start 500 lei, Business 1.199 lei (prețuri de lansare). Plătești doar după ce vezi demo-ul.',l:['/preturi','Vezi prețurile']},
    {k:['demo','gratuit','gratis','free','incerc','vad'],a:'Îți facem gratuit prima pagină a site-ului, cu numele și serviciile tale, și o primești pe telefon în 24 de ore. Dacă nu-ți place, nu datorezi nimic. Poți vedea și o schiță acum, în demo-ul live de pe prima pagină.',l:['/contact#demo','Cere demo-ul']},
    {k:['dureaza','cand','timp','termen','repede','zile','ore','how long'],a:'Demo-ul îl primești în 24 de ore. Site-ul complet e gata de obicei în câteva zile după ce primim textele și pozele; termenul exact îl stabilim când vorbim.'},
    {k:['avans','platesc','plata','card','factura','pay'],a:'Fără avans. După ce aprobi demo-ul primești un link de plată online, cu cardul. La abonament, prima lună se plătește abia când site-ul e live.'},
    {k:['include','primesc','contine','ce face','pagini','functii'],a:'Orice site e făcut pentru telefon, are butoane de apel și WhatsApp, formular, hartă și e pregătit pentru Google. Business adaugă până la 5 pagini, programări sau comenzi online, Google Business configurat și exclusivitate pe zonă.',l:['/creare-site-web','Ce include un site']},
    {k:['domeniu','hosting','gazduire','al cui','server'],a:'Domeniul e pe numele tău. La abonamente, găzduirea și domeniul .ro sunt incluse; la plata unică, domeniul îl plătești anual, la registrator, iar noi îl conectăm.'},
    {k:['asistent','chat','robot','inteligenta artificiala','chatbot'],a:'Facem și un asistent AI pentru site-ul tău, care răspunde clienților în română, maghiară și engleză și preia cererile. E inclus în Pro sau costă 99,99 lei pe lună separat.',l:['/asistent-ai','Despre asistentul AI']},
    {k:['automat','sheets','email','recenzi','cereri'],a:'Putem lega site-ul de emailul și tabelul tău: fiecare cerere e salvată, clientul primește răspuns imediat, iar după lucrare i se cere o recenzie Google. Prețul îl stabilim după o discuție de 15 minute.',l:['/automatizari','Vezi automatizările']},
    {k:['am deja','site existent','refac','modific','schimb'],a:'Dacă ai deja un site, îl putem reface sau putem adăuga automatizări și asistentul AI la el. Spune-ne adresa lui în formular și ne uităm.'},
    {k:['magazin','shop','meniu qr','qr','rezerv','voucher','fidelitate','calendar'],a:'Funcțiile extra (magazin mic, meniu QR, rezervări, programări în Google Calendar, vouchere, card de fidelitate) se adaugă pe Business, cu preț fix stabilit după un apel scurt.',l:['/solutii-personalizate','Vezi funcțiile extra']},
    {k:['gratuit primele','primele 5','loc gratuit','fondator'],a:'Primele 5 site-uri pentru afaceri din Târgu Mureș le facem gratuit, în schimbul unei recenzii și al acordului să arătăm site-ul. Un loc e deja ocupat.'},
    {k:['exemplu','portofoliu','client','lucrari','bbb','big big boon'],a:'Un client real: <a href="https://www.bigbigboon.ro" target="_blank" rel="noopener">bigbigboon.ro</a>, construcții modulare, site în trei limbi. Pe prima pagină găsești și exemple de site-uri pentru frizerie, cofetărie și service auto.'},
    {k:['google','gasit','seo','cautare','prima pagina'],a:'Site-ul e construit să fie înțeles de Google și îl legăm de profilul tău Google Business. Poziția depinde și de concurență și de recenzii, așa că nu promitem locul 1.'},
    {k:['unde','oras','targu','mures','adresa voastra','sunteti'],a:'Suntem în Târgu Mureș și lucrăm cu afaceri din tot județul Mureș, și nu numai.'},
    {k:['telefon','suna','sunati','apel','contact','vorbesc','cineva','persoana','whatsapp','call'],a:'Ne poți suna la <a href="tel:+40740267706">0740 267 706</a> sau ne poți scrie pe <a href="https://wa.me/40740267706" target="_blank" rel="noopener">WhatsApp</a>. Sau lasă-mi numele și telefonul aici și te sunăm noi.',f:1},
    {k:['salut','buna','hello','hi','hey','szia'],a:'Bună! Cu ce te pot ajuta? Poți întreba despre prețuri, demo-ul gratuit, cât durează sau ce include un site.'},
    {k:['multumesc','mersi','thanks','ms'],a:'Cu plăcere! Dacă vrei, lasă-ne datele și îți facem demo-ul gratuit.',l:['/contact#demo','Cere demo-ul']}
  ];
  function answer(q){const n=' '+norm(q)+' ';let best=null,score=0;
    KB.forEach(e=>{let s=0;e.k.forEach(k=>{if(n.includes(norm(k).trim()?(' '+norm(k).trim()):k))s+=k.length>3?2:1});if(s>score){score=s;best=e}});
    return score>0?best:null}

  const css=document.createElement('style');css.textContent=`
  .oa-btn{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:60;display:flex;align-items:center;gap:10px;height:54px;padding:0 18px 0 8px;border-radius:999px;border:0;cursor:pointer;background:#151A2B;color:#F2F3F7;font:600 15px "Schibsted Grotesk",system-ui,sans-serif;box-shadow:0 0 0 1px rgba(255,255,255,.12),0 20px 40px -12px rgba(0,0,0,.7);transition:transform .4s cubic-bezier(.22,1,.36,1)}
  .oa-btn:hover{transform:translateY(-3px)}
  .oa-btn i{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#4C63FF;font-style:normal;position:relative}
  .oa-btn i::after{content:"";position:absolute;right:1px;top:1px;width:10px;height:10px;border-radius:50%;background:#FFB020;box-shadow:0 0 0 2px #151A2B}
  .oa-btn svg{width:20px;height:20px}
  .oa-p{position:fixed;right:18px;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:61;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100svh - 120px));display:flex;flex-direction:column;border-radius:24px;overflow:hidden;background:rgba(17,21,36,.97);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 0 0 1px rgba(255,255,255,.1),0 40px 80px -20px rgba(0,0,0,.85);color:#F2F3F7;font:400 15px/1.45 "Schibsted Grotesk",system-ui,sans-serif;opacity:0;transform:translateY(16px) scale(.98);pointer-events:none;transition:opacity .3s,transform .45s cubic-bezier(.22,1,.36,1)}
  .oa-p.on{opacity:1;transform:none;pointer-events:auto}
  .oa-h{display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
  .oa-h .av{width:36px;height:36px;border-radius:11px;background:#4C63FF;display:grid;place-items:center;font-weight:700;font-size:13px}
  .oa-h b{display:block;font-size:15px}.oa-h small{color:#9AA0B8;font-size:12px;display:block;line-height:1.3}
  .oa-x{margin-left:auto;width:34px;height:34px;border-radius:10px;border:0;background:rgba(255,255,255,.06);color:#fff;font-size:20px;cursor:pointer}
  .oa-m{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:9px}
  .oa-b{max-width:86%;padding:10px 13px;border-radius:16px;animation:oaIn .35s cubic-bezier(.22,1,.36,1)}
  .oa-b.u{align-self:flex-end;background:#4C63FF;border-bottom-right-radius:5px}
  .oa-b.r{align-self:flex-start;background:#232A42;border-bottom-left-radius:5px}
  .oa-b a{color:#FFB020}
  .oa-b .go{display:inline-block;margin-top:8px;font-weight:600;color:#FFB020;text-decoration:none}
  .oa-t{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#232A42;border-radius:16px}
  .oa-t i{width:6px;height:6px;border-radius:50%;background:#9AA0B8;animation:oaT 1s infinite}.oa-t i:nth-child(2){animation-delay:.15s}.oa-t i:nth-child(3){animation-delay:.3s}
  @keyframes oaT{50%{transform:translateY(-4px);opacity:.5}}@keyframes oaIn{from{opacity:0;transform:translateY(8px)}}
  .oa-q{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}
  .oa-q button{font:500 13px inherit;font-family:inherit;color:#E3E5EB;background:transparent;border:1.5px solid #2D3450;border-radius:999px;padding:7px 11px;cursor:pointer}
  .oa-q button:hover{border-color:#FFB020}
  .oa-p form{background:none!important;border-radius:0!important;backdrop-filter:none!important;box-shadow:none!important}
  .oa-f{display:flex!important;gap:8px;padding:12px!important;border-top:1px solid rgba(255,255,255,.08)}
  .oa-f input{flex:1;min-width:0;font:inherit;color:#fff;background:#0B0D14;border:1.5px solid #262C42;border-radius:12px;padding:11px 12px}
  .oa-f input:focus{outline:none;border-color:#4C63FF}
  .oa-f button{border:0;border-radius:12px;background:#FFB020;color:#14110A;font-weight:700;padding:0 14px;cursor:pointer}
  .oa-lead{display:grid!important;gap:7px!important;margin-top:8px;padding:0!important}.oa-lead input{font:inherit;color:#fff;background:#0B0D14;border:1.5px solid #262C42;border-radius:10px;padding:9px 10px}
  .oa-lead button{border:0;border-radius:10px;background:#FFB020;color:#14110A;font-weight:700;padding:10px;cursor:pointer}
  .oa-note{padding:0 16px 10px;font-size:11.5px;color:#7E849C}
  @media(prefers-reduced-motion:reduce){.oa-b{animation:none}.oa-p{transition:none}}
  @media(max-width:600px){.oa-btn span{display:none}.oa-btn{padding:0 7px}}`;
  document.head.appendChild(css);
  const btn=document.createElement('button');btn.className='oa-btn';btn.type='button';btn.setAttribute('aria-label','Deschide asistentul OHI');btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 5h16v11H9l-5 4z"/></svg></i><span>Întreabă-ne</span>';
  const p=document.createElement('div');p.className='oa-p';p.setAttribute('role','dialog');p.setAttribute('aria-label','Asistent OHI');
  p.innerHTML=`<div class="oa-h"><span class="av">OHI</span><div><b>Asistent OHI</b><small>răspunsuri automate · un om te poate suna</small></div><button class="oa-x" type="button" aria-label="Închide">×</button></div>
  <div class="oa-m" id="oaM" aria-live="polite"></div>
  <div class="oa-q" id="oaQ"><button type="button">Cât costă?</button><button type="button">Cum e cu demo-ul gratuit?</button><button type="button">Cât durează?</button><button type="button">Vreau să vorbesc cu cineva</button></div>
  <form class="oa-f" id="oaF"><input id="oaI" placeholder="Scrie o întrebare…" autocomplete="off" maxlength="300"><button type="submit">Trimite</button></form>`;
  document.body.appendChild(btn);document.body.appendChild(p);
  const M=p.querySelector('#oaM'),I=p.querySelector('#oaI');let greeted=false,leadShown=false;
  function bub(html,who){const d=document.createElement('div');d.className='oa-b '+who;d.innerHTML=html;M.appendChild(d);M.scrollTop=M.scrollHeight;return d}
  function reply(html,extra){const t=document.createElement('div');t.className='oa-t';t.innerHTML='<i></i><i></i><i></i>';M.appendChild(t);M.scrollTop=M.scrollHeight;
    setTimeout(()=>{t.remove();const d=bub(html,'r');if(extra)extra(d)},650)}
  function leadForm(d){if(leadShown)return;leadShown=true;const f=document.createElement('form');f.className='oa-lead';
    f.innerHTML='<input name="n" placeholder="Numele tău" autocomplete="name"><input name="t" type="tel" placeholder="Telefon" autocomplete="tel"><button type="submit">Sună-mă</button>';
    d.appendChild(f);M.scrollTop=M.scrollHeight;
    f.addEventListener('submit',async e=>{e.preventDefault();const n=f.n.value.trim(),t=f.t.value.trim();
      if(!n||t.replace(/\D/g,'').length<9){f.t.focus();f.t.style.borderColor='#FF6B61';return}
      const qs=[...M.querySelectorAll('.oa-b.u')].map(x=>x.textContent).join(' | ');
      const id='AS-'+Date.now().toString(36).toUpperCase();
      const data=new URLSearchParams({created_at:new Date().toISOString(),source:'site-asistent',request_id:id,name:n,business:'',phone:t,email:'',business_type:'',website:'',need:'Asistent site · vrea să fie sunat',message:'Întrebări în chat: '+qs+'\nPagina: '+location.pathname,marketing_consent:'nu',consent_at:new Date().toISOString(),design_json:''});
      f.querySelector('button').disabled=true;
      try{if(LIVE){const r=await fetch(WEBHOOK,{method:'POST',body:data});if(!r.ok)throw 0}
        f.remove();reply('Mulțumesc, '+n.split(' ')[0]+'! Te sunăm în cel mult 24 de ore.'+(LIVE?'':' <small>(previzualizare: nu s-a trimis nimic)</small>'))}
      catch(x){f.querySelector('button').disabled=false;reply('Nu s-a putut trimite. Sună-ne direct la <a href="tel:+40740267706">0740 267 706</a>.')}})}
  function ask(q){if(!q.trim())return;bub(q.replace(/[<>&]/g,''),'u');const e=answer(q);
    if(e)reply(e.a+(e.l?`<br><a class="go" href="${e.l[0]}">${e.l[1]}</a>`:''),e.f?leadForm:null);
    else reply('Nu am un răspuns sigur la asta și nu vreau să inventez. Lasă-mi numele și telefonul și te sună cineva din echipa OHI.',leadForm)}
  function open(v){p.classList.toggle('on',v);btn.setAttribute('aria-expanded',v);if(v){if(!greeted){greeted=true;reply('Bună! Sunt asistentul OHI. Răspund la întrebări despre site-uri, prețuri și demo-ul gratuit. Ce vrei să afli?')}setTimeout(()=>I.focus(),300)}}
  btn.addEventListener('click',()=>open(!p.classList.contains('on')));
  p.querySelector('.oa-x').addEventListener('click',()=>open(false));
  addEventListener('keydown',e=>{if(e.key==='Escape')open(false)});
  p.querySelector('#oaQ').addEventListener('click',e=>{const b=e.target.closest('button');if(b)ask(b.textContent)});
  p.querySelector('#oaF').addEventListener('submit',e=>{e.preventDefault();ask(I.value);I.value=''});
})();
