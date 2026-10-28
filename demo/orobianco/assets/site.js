/* Orobianco demo · shared script */
const C={
hu:{nHome:"Főoldal",nMenu:"Étlap",nEv:"Események",nAbout:"Rólunk",cRes:"Asztalfoglalás",open:"Nyitva minden nap",fDate:"Dátum",fTime:"Időpont",fG:"Személyek",fN:"Név",fP:"Telefon",fM:"Megjegyzés (opcionális)",fMp:"Évforduló, gyerekszék, allergiák...",fS:"Foglalási kérés küldése",okH:"Köszönjük!",okP:"A kérés megérkezett az étteremhez. Telefonon visszaigazoljuk. (Demo: semmi nem lett elküldve.)",sCall:"Hívj minket",sWa:"Írj nekünk",sOpen:"Nyitvatartás",sOpenV:"Minden nap, 12:00 – 23:00",dMF:"Hétfő – Péntek",dSa:"Szombat",dSu:"Vasárnap",fHours:"Nyitvatartás",fLinks:"Oldalak",fCont:"Kapcsolat",demo:"Weboldal-javaslat az OHI Solutions-tól az Orobianco számára. Nem a hivatalos oldal.",ctaH:"Foglalj asztalt <em>ma estére</em>",ctaP:"Online kérés két perc alatt, vagy hívj minket közvetlenül.",ctaB:"Asztalfoglalás"},
en:{nHome:"Home",nMenu:"Menu",nEv:"Events",nAbout:"About",cRes:"Book a table",open:"Open daily",fDate:"Date",fTime:"Time",fG:"Guests",fN:"Name",fP:"Phone",fM:"Notes (optional)",fMp:"Anniversary, high chair, allergies...",fS:"Send booking request",okH:"Thank you!",okP:"Your request reached the restaurant. We will confirm by phone. (Demo: nothing was sent.)",sCall:"Call us",sWa:"Send us a message",sOpen:"Opening hours",sOpenV:"Daily, 12:00 – 23:00",dMF:"Monday – Friday",dSa:"Saturday",dSu:"Sunday",fHours:"Opening hours",fLinks:"Pages",fCont:"Contact",demo:"Website proposal by OHI Solutions for Orobianco. Not the official site.",ctaH:"Book a table <em>for tonight</em>",ctaP:"An online request in two minutes, or call us directly.",ctaB:"Book a table"}};
const PT=window.PT||{hu:{},en:{}};
const T={ro:{},hu:Object.assign({},C.hu,PT.hu),en:Object.assign({},C.en,PT.en)};
document.querySelectorAll('[data-t]').forEach(e=>T.ro[e.dataset.t]=e.innerHTML);
document.querySelectorAll('[data-tp]').forEach(e=>T.ro[e.dataset.tp]=e.placeholder);
let L='ro';const hooks=[];
function setLang(l){L=l;document.documentElement.lang=l;try{localStorage.setItem('oroLang',l)}catch(e){}
  document.querySelectorAll('[data-t]').forEach(e=>{const v=T[l][e.dataset.t]??T.ro[e.dataset.t];if(v!=null)e.innerHTML=v});
  document.querySelectorAll('[data-tp]').forEach(e=>{e.placeholder=T[l][e.dataset.tp]??T.ro[e.dataset.tp]});
  document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===l));hooks.forEach(f=>f())}
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>setLang(b.dataset.l));
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(pointer:fine)').matches;

/* ===== menu data (example dishes; prices left blank on purpose) ===== */
const MENU=[
 {id:"antipasti",ro:"Antipasti",hu:"Előételek",en:"Starters",items:[
  ["Bruschetta al pomodoro",{ro:"Pâine prăjită, roșii, busuioc, ulei de măsline",hu:"Pirított kenyér, paradicsom, bazsalikom, olívaolaj",en:"Toasted bread, tomatoes, basil, olive oil"},"v"],
  ["Burrata",{ro:"Burrata cremoasă, roșii cherry, pesto",hu:"Krémes burrata, koktélparadicsom, pesto",en:"Creamy burrata, cherry tomatoes, pesto"},"v"],
  ["Carpaccio di manzo",{ro:"Vită feliată subțire, rucola, parmezan",hu:"Vékonyra szelt marhahús, rukkola, parmezán",en:"Thinly sliced beef, rocket, parmesan"},""],
  ["Tagliere italiano",{ro:"Mezeluri și brânzeturi italiene",hu:"Olasz felvágottak és sajtok",en:"Italian cured meats and cheeses"},""]]},
 {id:"zuppe",ro:"Zuppe",hu:"Levesek",en:"Soups",items:[
  ["Zuppa di pomodoro",{ro:"Supă cremoasă de roșii, busuioc, crutoane",hu:"Krémes paradicsomleves, bazsalikom, krutton",en:"Creamy tomato soup, basil, croutons"},"v"],
  ["Minestrone",{ro:"Supă de legume de sezon",hu:"Szezonális zöldségleves",en:"Seasonal vegetable soup"},"v"]]},
 {id:"pasta",ro:"Pasta",hu:"Tészták",en:"Pasta",items:[
  ["Tagliatelle al ragù",{ro:"Sos de carne gătit încet, parmezan",hu:"Lassan főtt húsragu, parmezán",en:"Slow-cooked meat sauce, parmesan"},""],
  ["Spaghetti alle vongole",{ro:"Scoici, usturoi, vin alb, pătrunjel",hu:"Kagyló, fokhagyma, fehérbor, petrezselyem",en:"Clams, garlic, white wine, parsley"},""],
  ["Ravioli ricotta e spinaci",{ro:"Ricotta, spanac, unt cu salvie",hu:"Ricotta, spenót, zsályás vaj",en:"Ricotta, spinach, sage butter"},"v"],
  ["Penne all'arrabbiata",{ro:"Sos de roșii iute, usturoi, ardei",hu:"Csípős paradicsomszósz, fokhagyma, chili",en:"Spicy tomato sauce, garlic, chilli"},"v"]]},
 {id:"risotto",ro:"Risotto",hu:"Rizottó",en:"Risotto",items:[
  ["Risotto ai funghi",{ro:"Orez carnaroli, ciuperci, parmezan",hu:"Carnaroli rizs, gomba, parmezán",en:"Carnaroli rice, mushrooms, parmesan"},"v"],
  ["Risotto ai frutti di mare",{ro:"Fructe de mare, vin alb, lămâie",hu:"Tenger gyümölcsei, fehérbor, citrom",en:"Seafood, white wine, lemon"},""]]},
 {id:"secondi",ro:"Secondi",hu:"Főételek",en:"Main courses",items:[
  ["Tagliata di manzo",{ro:"Vită la grătar, rucola, parmezan",hu:"Grillezett marha, rukkola, parmezán",en:"Grilled beef, rocket, parmesan"},""],
  ["Branzino al forno",{ro:"Lup de mare la cuptor, legume",hu:"Sült tengeri sügér, zöldségek",en:"Baked sea bass, vegetables"},""],
  ["Pollo alla cacciatora",{ro:"Pui cu roșii, măsline și ierburi",hu:"Csirke paradicsommal, olívával, fűszernövényekkel",en:"Chicken with tomatoes, olives and herbs"},""],
  ["Saltimbocca alla romana",{ro:"Vițel, prosciutto, salvie",hu:"Borjú, prosciutto, zsálya",en:"Veal, prosciutto, sage"},""]]},
 {id:"dolci",ro:"Dolci",hu:"Desszertek",en:"Desserts",items:[
  ["Tiramisù",{ro:"Mascarpone, cafea, cacao",hu:"Mascarpone, kávé, kakaó",en:"Mascarpone, coffee, cocoa"},"v"],
  ["Panna cotta",{ro:"Sos de fructe de pădure",hu:"Erdei gyümölcsszósz",en:"Forest berry sauce"},"v"],
  ["Cannoli siciliani",{ro:"Cu ricotta dulce",hu:"Édes ricottával",en:"With sweet ricotta"},"v"]]},
 {id:"vini",ro:"Vini & cocktail",hu:"Borok & koktélok",en:"Wines & cocktails",items:[
  ["Vino della casa",{ro:"Alb, roșu sau rosé, la pahar",hu:"Fehér, vörös vagy rozé, pohárral",en:"White, red or rosé, by the glass"},""],
  ["Prosecco",{ro:"La pahar sau la sticlă",hu:"Pohárral vagy palackkal",en:"By the glass or bottle"},""],
  ["Aperol Spritz",{ro:"Aperol, prosecco, apă minerală, portocală",hu:"Aperol, prosecco, szóda, narancs",en:"Aperol, prosecco, soda, orange"},""],
  ["Negroni",{ro:"Gin, vermut roșu, Campari",hu:"Gin, vörös vermut, Campari",en:"Gin, red vermouth, Campari"},""]]}];
const PRICE={ro:"— lei",hu:"— lej",en:"— lei"};
(function(){const w=document.getElementById('menuWrap');if(!w)return;const nav=document.getElementById('mnav');let vegOnly=false;
  function draw(){nav.innerHTML=MENU.map(c=>`<a href="#${c.id}">${c[L]}</a>`).join('');
    w.innerHTML=MENU.map(c=>{const it=c.items.filter(i=>!vegOnly||i[2]==='v');if(!it.length)return'';return `<section class="mcat rv in" id="${c.id}"><h3>${c[L]}</h3>${it.map(i=>`<div class="mitem"><div><h4>${i[0]}${i[2]==='v'?' <span class="vtag" title="vegetarian">V</span>':''}</h4><p>${i[1][L]}</p></div><span class="dots"></span><span class="pr">${PRICE[L]}</span></div>`).join('')}</section>`}).join('')}
  draw();hooks.push(draw);const vb=document.getElementById('veg');if(vb)vb.onclick=()=>{vegOnly=!vegOnly;vb.classList.toggle('on',vegOnly);draw()};
  const io2=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){nav.querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-40% 0px -55% 0px'});
  new MutationObserver(()=>w.querySelectorAll('.mcat').forEach(s=>io2.observe(s))).observe(w,{childList:true});w.querySelectorAll('.mcat').forEach(s=>io2.observe(s))})();

/* ===== forms ===== */
document.querySelectorAll('select[data-times]').forEach(t=>{for(let h=12;h<=22;h++)for(const m of['00','30']){if(h===22&&m==='30')continue;t.add(new Option(h+':'+m))}});
document.querySelectorAll('select[data-guests]').forEach(g=>{for(let n=1;n<=(+g.dataset.guests||12);n++)g.add(new Option(n));g.value=g.dataset.def||'2'});
document.querySelectorAll('input[type=date]').forEach(d=>d.min=new Date().toISOString().slice(0,10));
document.querySelectorAll('form.rform').forEach(f=>f.onsubmit=e=>{e.preventDefault();[...f.children].forEach(c=>{if(!c.classList.contains('ok'))c.style.display='none'});f.querySelector('.ok').classList.add('on')});

/* ===== header, mobile CTA, reveals, motion ===== */
const hdr=document.getElementById('hdr'),mres=document.getElementById('mres');
function onS(){hdr.classList.toggle('solid',scrollY>40);if(!mres)return;const f=document.querySelector('form.rform'),s=document.getElementById('spec');
  const inForm=f&&(r=>r.top<innerHeight&&r.bottom>0)(f.getBoundingClientRect()),inSpin=s&&(r=>r.top<=0&&r.bottom>=innerHeight)(s.getBoundingClientRect());
  mres.classList.toggle('on',scrollY>innerHeight*.6&&!inForm&&!inSpin)}
addEventListener('scroll',onS,{passive:true});onS();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(e=>io.observe(e));
const burger=document.getElementById('burger');if(burger)burger.onclick=()=>document.body.classList.toggle('mopen');
if(fine&&!reduce){
  document.querySelectorAll('[data-mag]').forEach(b=>{b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;b.style.transform=`translate(${x*.25}px,${y*.35}px)`;if(b.firstElementChild)b.firstElementChild.style.transform=`translate(${x*.12}px,${y*.12}px)`});
    b.addEventListener('mouseleave',()=>{b.style.transform='';if(b.firstElementChild)b.firstElementChild.style.transform=''})});
  document.querySelectorAll('[data-tilt]').forEach(c=>{c.addEventListener('mousemove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-4px)`});c.addEventListener('mouseleave',()=>c.style.transform='')});
  const g=document.getElementById('glow');if(g)addEventListener('mousemove',e=>{g.style.opacity=1;g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'},{passive:true});
}
(function(){const h=document.getElementById('h1');if(!h)return;let i=0;h.querySelectorAll('span,em').forEach(p=>{const t=p.textContent;p.textContent='';[...t].forEach(c=>{const s=document.createElement('span');s.className='ch';s.textContent=c;s.style.animationDelay=(.25+i++*.07)+'s';p.appendChild(s)})})})();

/* ===== signature dishes (illustrated placeholders, swap for real cut-out photos) ===== */
(function(){if(!document.getElementById("spec"))return;
const R=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(7);
const plate=(inner)=>`<svg viewBox="0 0 400 400"><defs>
<radialGradient id="pl" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#fbf8f2"/><stop offset=".75" stop-color="#ece5d8"/><stop offset="1" stop-color="#cfc5b3"/></radialGradient>
<radialGradient id="well" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#e3dccd"/></radialGradient></defs>
<circle cx="200" cy="200" r="190" fill="url(#pl)"/><circle cx="200" cy="200" r="190" fill="none" stroke="#c9a96e" stroke-width="2" opacity=".7"/>
<circle cx="200" cy="200" r="182" fill="none" stroke="#c9a96e" stroke-width=".8" opacity=".5"/>
<circle cx="200" cy="200" r="132" fill="url(#well)"/><circle cx="200" cy="200" r="132" fill="none" stroke="#d8cfbd" stroke-width="3"/>${inner}</svg>`;
function specks(n,cx,cy,rad,cols,sz){let s='';for(let i=0;i<n;i++){const a=R()*6.283,r=Math.sqrt(R())*rad;s+=`<circle cx="${(cx+Math.cos(a)*r).toFixed(1)}" cy="${(cy+Math.sin(a)*r).toFixed(1)}" r="${(sz*(.5+R())).toFixed(1)}" fill="${cols[i%cols.length]}"/>`}return s}
function leaf(x,y,a,s,c){return `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0C8-10 22-10 30 0C22 10 8 10 0 0Z" fill="${c}"/><path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M2 0H27" stroke="#2f5a1f" stroke-width=".8" opacity=".6"/>`}
const soup=plate(`<defs><radialGradient id="sp" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#f07a3a"/><stop offset="1" stop-color="#b8411a"/></radialGradient></defs>
<circle cx="200" cy="200" r="112" fill="url(#sp)"/><circle cx="200" cy="200" r="112" fill="none" stroke="#8f3214" stroke-width="2" opacity=".5"/>
<path d="M200 200m-60 0a60 60 0 1 0 120 0a45 45 0 1 0-90 0a30 30 0 1 0 60 0a15 15 0 1 0-30 0" fill="none" stroke="#fff6ea" stroke-width="7" stroke-linecap="round" opacity=".92"/>
${specks(26,200,200,95,['#3f7a2a','#2f5f1f'],1.6)}${leaf(232,150,20,1.1,'#4f8f32')}${leaf(238,160,-40,.9,'#3e7a27')}
${[[150,250],[260,240],[170,140]].map(([x,y])=>`<rect x="${x}" y="${y}" width="16" height="16" rx="3" fill="#d9a35a" stroke="#a8722f" transform="rotate(${R()*60} ${x+8} ${y+8})"/>`).join('')}`);
let nest='';for(let i=0;i<70;i++){const a=R()*6.283,r=20+R()*80,w=30+R()*60;nest+=`<path d="M${(200+Math.cos(a)*r).toFixed(1)} ${(200+Math.sin(a)*r).toFixed(1)}q${(R()*w-w/2).toFixed(1)} ${(R()*w-w/2).toFixed(1)} ${(R()*w-w/2).toFixed(1)} ${(R()*w-w/2).toFixed(1)}" stroke="${['#f1cf7c','#e7bd63','#f5da93'][i%3]}" stroke-width="7" fill="none" stroke-linecap="round"/>`}
const pasta=plate(`<circle cx="200" cy="200" r="98" fill="#e9c46e"/>${nest}<circle cx="200" cy="200" r="42" fill="#9c2a17"/>${specks(40,200,200,40,['#b8401f','#7a1f10','#c85a2c'],3)}
${specks(14,200,200,70,['#fff8e6','#f3e8cc'],3.2)}${leaf(206,178,-30,1,'#4f8f32')}${leaf(196,186,60,.8,'#3e7a27')}`);
const risotto=plate(`<circle cx="200" cy="200" r="104" fill="#efe2bf"/>${specks(260,200,200,100,['#f7edd2','#e3d1a5','#fffaf0'],2.6)}
${Array.from({length:9},(_,i)=>{const a=i/9*6.283+R(),r=40+R()*45,x=200+Math.cos(a)*r,y=200+Math.sin(a)*r;return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(R()*360).toFixed(0)})"><path d="M-14 4C-14-12 14-12 14 4Z" fill="#8a5a33"/><rect x="-4" y="2" width="8" height="12" rx="3" fill="#c9a07a"/></g>`}).join('')}
${specks(30,200,200,95,['#3f7a2a'],1.4)}<ellipse cx="170" cy="170" rx="18" ry="8" fill="#fff" opacity=".35"/>`);
const steak=plate(`${Array.from({length:7},(_,i)=>{const a=-60+i*20;return `<g transform="rotate(${a} 200 200)"><rect x="196" y="98" width="34" height="112" rx="10" fill="#6b2f1d"/><rect x="200" y="104" width="26" height="100" rx="8" fill="#c0505a"/><rect x="204" y="110" width="18" height="88" rx="6" fill="#d97a7f"/></g>`}).join('')}
${Array.from({length:16},()=>leaf(140+R()*120,215+R()*70,R()*360,.9+R()*.5,['#3f7a2a','#4f8f32','#5aa03a'][Math.floor(R()*3)])).join('')}
${Array.from({length:8},()=>`<path d="M${(150+R()*110).toFixed(0)} ${(220+R()*55).toFixed(0)}l14-4l4 10l-15 3z" fill="#f3e3b4" opacity=".95"/>`).join('')}`);
const tira=plate(`<g transform="rotate(12 200 200)"><rect x="128" y="128" width="144" height="144" rx="8" fill="#6a3d22"/><rect x="128" y="128" width="144" height="144" rx="8" fill="url(#cc)"/>
<defs><pattern id="cc" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#5a3019"/><circle cx="2" cy="2" r="1.2" fill="#7a4a2a"/><circle cx="5" cy="4.5" r=".8" fill="#4a2512"/></pattern></defs>
<rect x="128" y="128" width="144" height="144" rx="8" fill="none" stroke="#3b1f0e" stroke-width="2"/></g>
${leaf(250,140,-35,1.2,'#4f8f32')}${leaf(255,150,20,.9,'#3e7a27')}${specks(30,200,200,128,['#5a3019'],1.4)}
<path d="M110 290q30-14 60 0" stroke="#e8c27a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>`);
const D=[
 {svg:soup,n:"01",ro:["Zuppa","<em>di pomodoro</em>","Supă cremoasă de roșii, busuioc proaspăt și crutoane aurii."],hu:["Zuppa","<em>di pomodoro</em>","Krémes paradicsomleves friss bazsalikommal és aranyló kruttonnal."],en:["Zuppa","<em>di pomodoro</em>","Creamy tomato soup with fresh basil and golden croutons."]},
 {svg:pasta,n:"02",ro:["Tagliatelle","<em>al ragù</em>","Paste lungi, sos de carne gătit încet, parmezan."],hu:["Tagliatelle","<em>al ragù</em>","Hosszú tészta, lassan főtt húsraguval és parmezánnal."],en:["Tagliatelle","<em>al ragù</em>","Long pasta, slow-cooked meat sauce, parmesan."]},
 {svg:risotto,n:"03",ro:["Risotto","<em>ai funghi</em>","Orez carnaroli, ciuperci și o cremozitate fără grabă."],hu:["Risotto","<em>ai funghi</em>","Carnaroli rizs, gomba és türelmes krémesség."],en:["Risotto","<em>ai funghi</em>","Carnaroli rice, mushrooms and unhurried creaminess."]},
 {svg:steak,n:"04",ro:["Tagliata","<em>di manzo</em>","Vită la grătar, feliată, cu rucola și parmezan."],hu:["Tagliata","<em>di manzo</em>","Grillezett, szeletelt marhahús rukkolával és parmezánnal."],en:["Tagliata","<em>di manzo</em>","Grilled sliced beef with rocket and parmesan."]},
 {svg:tira,n:"05",ro:["Tiramisù","<em>della casa</em>","Mascarpone, cafea și cacao, finalul perfect."],hu:["Tiramisù","<em>della casa</em>","Mascarpone, kávé és kakaó, a tökéletes befejezés."],en:["Tiramisù","<em>della casa</em>","Mascarpone, coffee and cocoa, the perfect finish."]}];
const pw=document.getElementById('pw'),tx=document.getElementById('dtxt'),dots=document.getElementById('ddots'),ring=document.getElementById('ring'),sec=document.getElementById('spec');
D.forEach((d,i)=>{const el=document.createElement('div');el.className='dish';el.innerHTML=d.svg;pw.insertBefore(el,ring);d.el=el;
  const t=document.createElement('div');t.className='dish-t';tx.appendChild(t);d.t=t;dots.appendChild(document.createElement('i'))});
function txt(){D.forEach(d=>{const v=d[L]||d.ro;d.t.innerHTML=`<span class="n">${d.n} / 0${D.length}</span><h3>${v[0]} ${v[1]}</h3><p>${v[2]}</p>`})}
txt();const _set=setLang;setLang=function(l){_set(l);txt()};
let cur=-1;
function tick(){const r=sec.getBoundingClientRect(),total=r.height-innerHeight,p=Math.min(1,Math.max(0,-r.top/total));
  const i=Math.min(D.length-1,Math.floor(p*D.length*.999));
  if(i!==cur){cur=i;D.forEach((d,k)=>{d.el.classList.toggle('on',k===i);d.t.classList.toggle('on',k===i)});[...dots.children].forEach((d,k)=>d.classList.toggle('on',k<=i))}
  const rot=p*720;D.forEach(d=>d.el.firstChild.style.setProperty('--r',rot+'deg'));ring.style.setProperty('--p',p)}
addEventListener('scroll',()=>requestAnimationFrame(tick),{passive:true});addEventListener('resize',tick);tick();
})();
/* gold dust */
(function(){const c=document.getElementById('dust');if(reduce||!c)return;const x=c.getContext('2d');let W,H,P=[];
  function size(){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=c.width=r.width*d;H=c.height=r.height*d;P=Array.from({length:Math.round(r.width/18)},()=>({x:Math.random()*W,y:Math.random()*H,r:(Math.random()*1.6+.4)*d,s:(Math.random()*.25+.05)*d,o:Math.random()*.6+.2,p:Math.random()*6.3}))}
  size();addEventListener('resize',size);let vis=true;new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(c);
  (function f(t){if(vis){x.clearRect(0,0,W,H);for(const p of P){p.y-=p.s;p.x+=Math.sin(t/1600+p.p)*.15;if(p.y<-5){p.y=H+5;p.x=Math.random()*W}x.globalAlpha=p.o*(.6+.4*Math.sin(t/700+p.p));x.fillStyle='#e6cf9f';x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill()}}requestAnimationFrame(f)})(0)})();
(function(){let s=null;try{s=localStorage.getItem("oroLang")}catch(e){}if(s&&s!=="ro")setLang(s)})();
