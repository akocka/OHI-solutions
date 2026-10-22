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

  const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FOLLOW=['Cât costă?','Cum e cu demo-ul gratuit?','Cât durează?','Ce include un site?','Faceți și asistent AI?','Aveți exemple?','Vreau să vorbesc cu cineva'];
  const css=document.createElement('style');css.textContent=`
  @property --oa-a{syntax:"<angle>";inherits:false;initial-value:0deg}
  .oa-orb{position:relative;display:block;border-radius:50%;background:conic-gradient(from var(--oa-a),#4C63FF,#7B8CFF,#FFB020,#4C63FF);animation:oaSpin 6s linear infinite;box-shadow:0 0 18px rgba(76,99,255,.55)}
  .oa-orb::before{content:"";position:absolute;inset:3px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2A3566,#0E1224 70%)}
  .oa-orb::after{content:"";position:absolute;left:50%;top:50%;width:34%;height:34%;margin:-17% 0 0 -17%;border-radius:50%;background:radial-gradient(circle,#FFE2A3,#FFB020 55%,rgba(255,176,32,0) 72%);animation:oaCore 2.6s ease-in-out infinite}
  .oa-orb.think{animation-duration:1.2s}.oa-orb.think::after{animation-duration:.8s}
  @keyframes oaSpin{to{--oa-a:360deg}}
  @keyframes oaCore{0%,100%{transform:scale(.8);opacity:.85}50%{transform:scale(1.15);opacity:1}}
  .oa-btn{position:fixed;right:18px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:60;display:flex;align-items:center;gap:11px;height:58px;padding:0 20px 0 9px;border-radius:999px;border:0;cursor:pointer;color:#F2F3F7;font:600 15px "Schibsted Grotesk",system-ui,sans-serif;background:linear-gradient(#151A2B,#151A2B) padding-box,conic-gradient(from var(--oa-a),rgba(76,99,255,.9),rgba(255,176,32,.9),rgba(76,99,255,.15),rgba(76,99,255,.9)) border-box;border:1.5px solid transparent;animation:oaSpin 5s linear infinite;box-shadow:0 20px 44px -12px rgba(0,0,0,.75),0 0 30px -6px rgba(76,99,255,.45);transition:transform .45s cubic-bezier(.22,1,.36,1),box-shadow .3s}
  .oa-btn:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 24px 50px -12px rgba(0,0,0,.8),0 0 40px -4px rgba(76,99,255,.65)}
  .oa-btn .oa-orb{width:40px;height:40px}
  .oa-btn .rg{position:absolute;left:9px;top:50%;width:40px;height:40px;margin-top:-20px;border-radius:50%;border:1.5px solid rgba(123,140,255,.6);animation:oaRing 2.8s ease-out infinite;pointer-events:none}
  .oa-btn .rg.r2{animation-delay:1.4s}
  @keyframes oaRing{0%{transform:scale(1);opacity:.8}100%{transform:scale(2);opacity:0}}
  .oa-btn[aria-expanded="true"] .rg{display:none}
  .oa-btn .lbl{display:flex;flex-direction:column;align-items:flex-start;line-height:1.15}.oa-btn .lbl small{font-weight:500;font-size:11.5px;color:#9AA6FF}
  .oa-tease{position:fixed;right:18px;bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:60;max-width:250px;padding:12px 34px 12px 14px;border-radius:16px 16px 4px 16px;background:#F2F3F7;color:#14172A;font:500 14px/1.4 "Schibsted Grotesk",system-ui,sans-serif;box-shadow:0 20px 40px -14px rgba(0,0,0,.6);cursor:pointer;opacity:0;transform:translateY(10px) scale(.96);transform-origin:100% 100%;pointer-events:none;transition:opacity .35s,transform .5s cubic-bezier(.22,1,.36,1)}
  .oa-tease.on{opacity:1;transform:none;pointer-events:auto}
  .oa-tease b{display:block;font-size:14.5px}
  .oa-tease button{position:absolute;right:6px;top:6px;width:24px;height:24px;border:0;border-radius:8px;background:transparent;color:#5A6077;font-size:16px;cursor:pointer}
  .oa-p{position:fixed;right:18px;bottom:calc(90px + env(safe-area-inset-bottom,0px));z-index:61;width:min(396px,calc(100vw - 24px));height:min(600px,calc(100svh - 120px));display:flex;flex-direction:column;border-radius:26px;overflow:hidden;isolation:isolate;
    background:linear-gradient(rgba(14,17,30,.96),rgba(14,17,30,.96)) padding-box,conic-gradient(from var(--oa-a),rgba(76,99,255,.75),rgba(255,176,32,.55),rgba(255,255,255,.08),rgba(255,255,255,.08),rgba(76,99,255,.75)) border-box;border:1px solid transparent;animation:oaSpin 8s linear infinite;
    backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 50px 100px -24px rgba(0,0,0,.9),0 0 60px -20px rgba(76,99,255,.5);color:#F2F3F7;font:400 15px/1.5 "Schibsted Grotesk",system-ui,sans-serif;
    opacity:0;transform:translateY(20px) scale(.92);transform-origin:calc(100% - 40px) 100%;pointer-events:none;transition:opacity .3s,transform .55s cubic-bezier(.22,1,.36,1)}
  .oa-p.on{opacity:1;transform:none;pointer-events:auto}
  .oa-au{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
  .oa-au i{position:absolute;border-radius:50%;filter:blur(50px);opacity:.35}
  .oa-au i:nth-child(1){width:240px;height:240px;left:-80px;top:-90px;background:#4C63FF;animation:oaDrift 14s ease-in-out infinite}
  .oa-au i:nth-child(2){width:200px;height:200px;right:-90px;top:120px;background:#FFB020;opacity:.16;animation:oaDrift 18s -6s ease-in-out infinite reverse}
  @keyframes oaDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(60px,40px)}}
  .oa-h{display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(76,99,255,.10),rgba(76,99,255,0))}
  .oa-h .oa-orb{width:42px;height:42px;flex:none}
  .oa-h b{display:block;font-size:15.5px;letter-spacing:-.01em}
  .oa-h small{display:flex;align-items:center;gap:6px;color:#9AA0B8;font-size:12px;line-height:1.3}
  .oa-h small i{width:7px;height:7px;border-radius:50%;background:#3DDC97;box-shadow:0 0 0 0 rgba(61,220,151,.6);animation:oaLive 2s infinite}
  @keyframes oaLive{70%{box-shadow:0 0 0 6px rgba(61,220,151,0)}100%{box-shadow:0 0 0 0 rgba(61,220,151,0)}}
  .oa-x{margin-left:auto;width:34px;height:34px;border-radius:10px;border:0;background:rgba(255,255,255,.06);color:#fff;font-size:20px;cursor:pointer;transition:background .2s,transform .3s}
  .oa-x:hover{background:rgba(255,255,255,.12);transform:rotate(90deg)}
  .oa-m{flex:1;overflow-y:auto;padding:18px 16px 10px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:#2D3450 transparent}
  .oa-row{display:flex;gap:9px;align-items:flex-end;animation:oaIn .5s cubic-bezier(.22,1,.36,1)}
  .oa-row.u{justify-content:flex-end}
  .oa-row .oa-orb{width:26px;height:26px;flex:none;box-shadow:0 0 10px rgba(76,99,255,.4)}
  .oa-b{max-width:84%;padding:11px 14px;border-radius:18px;word-wrap:break-word}
  .oa-row.u .oa-b{background:linear-gradient(135deg,#5A70FF,#3F55F0);border-bottom-right-radius:6px;box-shadow:0 10px 24px -12px rgba(76,99,255,.8)}
  .oa-row.r .oa-b{background:rgba(35,42,66,.85);border-bottom-left-radius:6px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
  .oa-b a{color:#FFB020}
  .oa-cur::after{content:"";display:inline-block;width:7px;height:15px;margin-left:2px;vertical-align:-2px;border-radius:2px;background:#FFB020;animation:oaBlink .8s steps(2) infinite}
  @keyframes oaBlink{50%{opacity:0}}
  .oa-go{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(255,176,32,.10);box-shadow:inset 0 0 0 1px rgba(255,176,32,.35);color:#FFC453!important;font-weight:600;font-size:14px;text-decoration:none;transition:background .2s,transform .3s;animation:oaIn .5s cubic-bezier(.22,1,.36,1)}
  .oa-go:hover{background:rgba(255,176,32,.18);transform:translateX(3px)}
  .oa-go span{transition:transform .3s}.oa-go:hover span{transform:translateX(3px)}
  .oa-th{display:flex;align-items:center;gap:9px;animation:oaIn .4s cubic-bezier(.22,1,.36,1)}
  .oa-th .oa-orb{width:26px;height:26px}
  .oa-th em{font-style:normal;font-size:13.5px;font-weight:500;background:linear-gradient(90deg,#6E7594 0%,#E8EAFF 45%,#6E7594 90%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:oaShim 1.4s linear infinite}
  @keyframes oaShim{from{background-position:100% 0}to{background-position:-100% 0}}
  @keyframes oaIn{from{opacity:0;transform:translateY(10px) scale(.98)}}
  .oa-q{display:flex;flex-wrap:wrap;gap:7px;padding:2px 16px 12px}
  .oa-q button{font:500 13px/1 "Schibsted Grotesk",system-ui,sans-serif;color:#E3E5EB;background:rgba(255,255,255,.03);border:1px solid #2D3450;border-radius:999px;padding:8px 12px;cursor:pointer;opacity:0;transform:translateY(6px);animation:oaChip .45s cubic-bezier(.22,1,.36,1) forwards;transition:border-color .2s,background .2s,color .2s}
  .oa-q button:hover{border-color:#FFB020;background:rgba(255,176,32,.08);color:#fff}
  @keyframes oaChip{to{opacity:1;transform:none}}
  .oa-p form{background:none!important;border-radius:0!important;backdrop-filter:none!important;box-shadow:none!important}
  .oa-f{display:flex!important;gap:8px;padding:12px!important;border-top:1px solid rgba(255,255,255,.07)}
  .oa-f .wr{flex:1;min-width:0;position:relative;border-radius:14px;background:#0B0D14;box-shadow:inset 0 0 0 1.5px #262C42;transition:box-shadow .25s}
  .oa-f .wr:focus-within{box-shadow:inset 0 0 0 1.5px #4C63FF,0 0 0 4px rgba(76,99,255,.18)}
  .oa-f input{width:100%;font:inherit;color:#fff;background:transparent;border:0;padding:12px 13px}
  .oa-f input:focus{outline:none}
  .oa-f button{flex:none;width:46px;border:0;border-radius:14px;background:linear-gradient(135deg,#FFC24D,#FF9F10);color:#14110A;cursor:pointer;display:grid;place-items:center;transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s;box-shadow:0 8px 20px -8px rgba(255,176,32,.8)}
  .oa-f button:hover{transform:translateY(-2px) rotate(-8deg)}
  .oa-f button svg{width:20px;height:20px}
  .oa-lead{display:grid!important;gap:7px!important;margin-top:10px;padding:0!important}.oa-lead input{font:inherit;color:#fff;background:#0B0D14;border:1.5px solid #262C42;border-radius:10px;padding:9px 10px}
  .oa-lead input:focus{outline:none;border-color:#4C63FF}
  .oa-lead button{border:0;border-radius:10px;background:linear-gradient(135deg,#FFC24D,#FF9F10);color:#14110A;font-weight:700;padding:10px;cursor:pointer}
  @media(prefers-reduced-motion:reduce){.oa-orb,.oa-orb::after,.oa-btn,.oa-p,.oa-au i,.oa-btn .rg,.oa-h small i{animation:none!important}.oa-row,.oa-th,.oa-go{animation:none}.oa-q button{animation:none;opacity:1;transform:none}.oa-p{transition:none}}
  @media(max-width:600px){.oa-btn .lbl{display:none}.oa-btn{padding:0 8px}.oa-tease{max-width:220px}}`;
  document.head.appendChild(css);
  const ORB='<span class="oa-orb"></span>';
  const btn=document.createElement('button');btn.className='oa-btn';btn.type='button';btn.setAttribute('aria-label','Deschide asistentul OHI');btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<span class="rg"></span><span class="rg r2"></span>'+ORB+'<span class="lbl">Întreabă-ne<small>Răspuns imediat</small></span>';
  const tease=document.createElement('div');tease.className='oa-tease';tease.setAttribute('role','status');
  tease.innerHTML='<b>Ai o întrebare?</b>Prețuri, demo gratuit, termene. Îți răspund pe loc.<button type="button" aria-label="Închide">×</button>';
  const p=document.createElement('div');p.className='oa-p';p.setAttribute('role','dialog');p.setAttribute('aria-label','Asistent OHI');
  p.innerHTML=`<div class="oa-au"><i></i><i></i></div><div class="oa-h">${ORB}<div><b>Asistent OHI</b><small><i></i>online · răspunde pe loc</small></div><button class="oa-x" type="button" aria-label="Închide">×</button></div>
  <div class="oa-m" id="oaM" aria-live="polite"></div>
  <div class="oa-q" id="oaQ"></div>
  <form class="oa-f" id="oaF"><div class="wr"><input id="oaI" placeholder="Scrie o întrebare…" autocomplete="off" maxlength="300" aria-label="Întrebarea ta"></div><button type="submit" aria-label="Trimite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>`;
  document.body.appendChild(tease);document.body.appendChild(btn);document.body.appendChild(p);
  const M=p.querySelector('#oaM'),I=p.querySelector('#oaI'),Q=p.querySelector('#oaQ'),hOrb=p.querySelector('.oa-h .oa-orb');let greeted=false,leadShown=false,busy=false,pend=[];const asked=new Set();
  const down=()=>{M.scrollTop=M.scrollHeight};
  function chips(list){Q.innerHTML='';list.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.style.animationDelay=(i*.07)+'s';Q.appendChild(b)})}
  function nextChips(){const l=FOLLOW.filter(t=>!asked.has(t));chips(l.slice(0,3))}
  function row(who){const r=document.createElement('div');r.className='oa-row '+who;r.innerHTML=(who==='r'?ORB:'')+'<div class="oa-b"></div>';M.appendChild(r);down();return r.querySelector('.oa-b')}
  /* reveal an answer word by word, keeping links and bold intact */
  function stream(el,html,done){if(RM){el.innerHTML=html;done&&done();return}
    const tk=html.match(/<[^>]+>|[^<\s]+\s*|\s+/g)||[];let i=0,acc='';el.classList.add('oa-cur');
    (function step(){let n=0;while(i<tk.length&&n<2){acc+=tk[i];if(tk[i][0]!=='<')n++;i++}
      el.innerHTML=acc;down();if(i<tk.length)setTimeout(step,28+Math.random()*30);else{el.classList.remove('oa-cur');done&&done()}})()}
  function reply(html,link,extra){busy=true;Q.innerHTML='';const t=document.createElement('div');t.className='oa-th';t.innerHTML=ORB+'<em>Caut răspunsul…</em>';M.appendChild(t);down();hOrb.classList.add('think');
    setTimeout(()=>{t.remove();hOrb.classList.remove('think');const d=row('r');
      stream(d,html,()=>{if(link){const a=document.createElement('a');a.className='oa-go';a.href=link[0];a.innerHTML=link[1]+'<span>→</span>';d.appendChild(a)}
        if(extra)extra(d);busy=false;if(pend.length){const q=pend.shift();setTimeout(()=>ask(q),250)}else if(!leadShown||!extra)nextChips();down()})},700+Math.random()*400)}
  function leadForm(d){if(leadShown)return;leadShown=true;const f=document.createElement('form');f.className='oa-lead';
    f.innerHTML='<input name="n" placeholder="Numele tău" autocomplete="name"><input name="t" type="tel" placeholder="Telefon" autocomplete="tel"><button type="submit">Sună-mă</button>';
    d.appendChild(f);down();
    f.addEventListener('submit',async e=>{e.preventDefault();const n=f.n.value.trim(),t=f.t.value.trim();
      if(!n||t.replace(/\D/g,'').length<9){f.t.focus();f.t.style.borderColor='#FF6B61';return}
      const qs=[...M.querySelectorAll('.oa-row.u .oa-b')].map(x=>x.textContent).join(' | ');
      const id='AS-'+Date.now().toString(36).toUpperCase();
      const data=new URLSearchParams({created_at:new Date().toISOString(),source:'site-asistent',request_id:id,name:n,business:'',phone:t,email:'',business_type:'',website:'',need:'Asistent site · vrea să fie sunat',message:'Întrebări în chat: '+qs+'\nPagina: '+location.pathname,marketing_consent:'nu',consent_at:new Date().toISOString(),design_json:''});
      f.querySelector('button').disabled=true;
      try{if(LIVE){const r=await fetch(WEBHOOK,{method:'POST',body:data});if(!r.ok)throw 0}
        f.remove();reply('Mulțumesc, '+n.split(' ')[0].replace(/[<>&]/g,'')+'! Te sunăm în cel mult 24 de ore.'+(LIVE?'':' <small>(previzualizare: nu s-a trimis nimic)</small>'))}
      catch(x){f.querySelector('button').disabled=false;reply('Nu s-a putut trimite. Sună-ne direct la <a href="tel:+40740267706">0740 267 706</a>.')}})}
  function ask(q){if(!q.trim())return;if(busy){pend.push(q);return}asked.add(q.trim());row('u').textContent=q;const e=answer(q);
    if(e)reply(e.a,e.l,e.f?leadForm:null);
    else reply('Nu am un răspuns sigur la asta și nu vreau să inventez. Lasă-mi numele și telefonul și te sună cineva din echipa OHI.',null,leadForm)}
  let teaseT;
  function hideTease(){tease.classList.remove('on');clearTimeout(teaseT)}
  function open(v){hideTease();try{sessionStorage.setItem('oaSeen','1')}catch(x){}
    p.classList.toggle('on',v);btn.setAttribute('aria-expanded',v);
    if(v){if(!greeted){greeted=true;reply('Bună! Sunt asistentul OHI. Răspund la întrebări despre site-uri, prețuri și demo-ul gratuit. Ce vrei să afli?')}setTimeout(()=>I.focus({preventScroll:true}),350)}}
  let seen=false;try{seen=!!sessionStorage.getItem('oaSeen')}catch(x){}
  if(!seen)teaseT=setTimeout(()=>{if(!p.classList.contains('on')){tease.classList.add('on');teaseT=setTimeout(hideTease,9000)}},7000);
  tease.addEventListener('click',e=>{if(e.target.closest('button')){hideTease();try{sessionStorage.setItem('oaSeen','1')}catch(x){}return}open(true)});
  btn.addEventListener('click',()=>open(!p.classList.contains('on')));
  p.querySelector('.oa-x').addEventListener('click',()=>open(false));
  addEventListener('keydown',e=>{if(e.key==='Escape')open(false)});
  Q.addEventListener('click',e=>{const b=e.target.closest('button');if(b)ask(b.textContent)});
  p.querySelector('#oaF').addEventListener('submit',e=>{e.preventDefault();ask(I.value);I.value=''});
})();
