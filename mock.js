/* OHI shared: business types, site preview renderer and lead sender. Used by every page. */
try{if("scrollRestoration" in history)history.scrollRestoration="manual"}catch(e){}
if(!location.hash){scrollTo(0,0);addEventListener("load",()=>scrollTo(0,0));addEventListener("pageshow",()=>scrollTo(0,0))}
const WA="40740267706";
const WEBHOOK="https://hook.eu2.make.com/pjyknr3dp5tb8b5stpbit53yqluizecy"; // same webhook as the current site form → CRM "Leads"
const LIVE=/(^|\.)vercel\.app$|\.ro$/.test(location.hostname);
const NICHES={
 frizerie:{label:"Frizerie",ico:"💈",ph:"Frizeria lui Andrei",tag:"Barbershop",p:"Tunsori, fade și barbă la brici. Alegi frizerul și ora, din telefon.",cta:"Programează-te",feat:"Alegi frizerul și ora liberă",fi:"✂",items:[["Tunsoare","clasic sau modern","45 lei"],["Fade","degrade curat","55 lei"],["Barbă","contur la brici","35 lei"]],chat:"Bună! Mai aveți loc azi la 17:00?",card:"Programări cu alegerea frizerului, sau link direct spre Mero.",dark:true,sw:["#C9A45C","#E2483D","#4C63FF","#2BC48A"]},
 cofetarie:{label:"Cofetărie",ico:"🎂",ph:"Cofetăria Dulce Mureș",tag:"Cofetărie",p:"Torturi la comandă și prăjituri făcute zilnic. Comanzi în 1 minut.",cta:"Comandă un tort",feat:"Comandă de tort direct pe WhatsApp",fi:"✦",items:[["Torturi","la comandă","de la 180 lei"],["Prăjituri","făcute azi","12 lei"],["Evenimente","nunți și botezuri","ofertă"]],chat:"Pot comanda un tort pentru sâmbătă?",card:"Constructor de tort: mărime, gust, dată, trimis gata scris pe WhatsApp.",dark:false,sw:["#E5679B","#C47A3F","#7A3D2B","#4C63FF"]},
 service:{label:"Service auto",ico:"🔧",ph:"Auto Service Mureș",tag:"Service auto",p:"Reparații făcute atent și prețul spus înainte. Programarea ajunge direct la recepție.",cta:"Cere programare",feat:"Ce înseamnă martorul de pe bord?",fi:"⚠",items:[["Revizie","ulei și filtre","ofertă"],["Diagnoză","erori și cauze","ofertă"],["Frâne","plăcuțe și discuri","ofertă"]],chat:"Mi s-a aprins martorul de motor…",card:"Programare cu problema scrisă și explicarea martorilor de bord.",dark:true,sw:["#FFD23F","#F06A1D","#2BC48A","#4C63FF"]},
 salon:{label:"Salon",ico:"💅",ph:"Studio Bella",tag:"Salon",p:"Unghii, gene și tratamente faciale. Rezervi în câteva secunde.",cta:"Rezervă acum",feat:"Galerie cu lucrările tale",fi:"♥",items:[["Manichiură","gel și semipermanent","90 lei"],["Gene","extensii","150 lei"],["Facial","tratamente","120 lei"]],chat:"Aveți liber vineri pentru gel?",card:"Galerie cu lucrări, prețuri clare și rezervare online.",dark:false,sw:["#B4487A","#8E5BD6","#D9963B","#2BC48A"]},
 restaurant:{label:"Restaurant",ico:"🍔",ph:"Bistro Central",tag:"Restaurant",p:"Meniul la vedere, rezervări și comenzi, direct de pe telefon.",cta:"Vezi meniul",feat:"Meniu cu poze și prețuri",fi:"◎",items:[["Burger","casa","39 lei"],["Pizza","cuptor pe lemne","42 lei"],["Desert","al casei","22 lei"]],chat:"Aveți masă pentru 4 diseară?",card:"Meniu cu poze, rezervare de masă și comenzi rapide.",dark:true,sw:["#E2483D","#FFB020","#2BC48A","#4C63FF"]},
 pensiune:{label:"Pensiune",ico:"🏡",ph:"Pensiunea Mureș",tag:"Cazare",p:"Camere liniștite, mic dejun inclus și rezervare directă, fără comision.",cta:"Verifică disponibilitatea",feat:"Asistentul răspunde în RO, HU și EN",fi:"✉",items:[["Cameră dublă","mic dejun inclus","de la 250 lei"],["Apartament","familie","de la 380 lei"],["Evenimente","până la 60 de persoane","ofertă"]],chat:"Do you have a room for Friday?",card:"Rezervări directe și asistent care răspunde turiștilor străini.",dark:false,sw:["#2F7A5B","#C47A3F","#4C63FF","#B4487A"]},
 cabinet:{label:"Cabinet",ico:"🩺",ph:"Cabinet Dr. Pop",tag:"Cabinet medical",p:"Consultații programate online, fără telefoane și fără așteptat.",cta:"Programează o consultație",feat:"Programare cu medicul preferat",fi:"✚",items:[["Consultație","inițială","ofertă"],["Control","periodic","ofertă"],["Analize","la cerere","ofertă"]],chat:"Aveți program sâmbătă?",card:"Programări pe medic, servicii clare și hartă.",dark:false,sw:["#19A7A0","#4C63FF","#2BC48A","#8E5BD6"]},
 altceva:{label:"Altă afacere",ico:"✨",ph:"Afacerea Ta",tag:"Afacere locală",p:"Tot ce trebuie să știe clienții tăi, într-un singur loc, pe telefon.",cta:"Contactează-ne",feat:"Apel și WhatsApp dintr-o atingere",fi:"☎",items:[["Serviciul 1","descriere scurtă","ofertă"],["Serviciul 2","descriere scurtă","ofertă"],["Serviciul 3","descriere scurtă","ofertă"]],chat:"Bună! Aveți program mâine?",card:"Orice afacere locală: servicii, contact și hartă.",dark:false,sw:["#4C63FF","#2BC48A","#E2483D","#FFB020"]}
};
const KEYS=Object.keys(NICHES);
const EXTRA=["#FF6B61","#FFB020","#2BC48A","#19A7A0","#4C63FF","#8E5BD6","#E5679B","#C9A45C","#14181F","#F2F3F7"];
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function lum(hex){const n=parseInt(String(hex).slice(1),16);return ((n>>16)*299+((n>>8)&255)*587+(n&255)*114)/1000}
const ink=c=>lum(c)>150?"#14110A":"#FFFFFF";
function siteVars(o){
  const bg=o.bg||(o.theme==="dark"?"dark":o.theme==="light"?"light":(NICHES[o.niche].dark?"dark":"light"));
  const dark=bg!=="light";const a=o.color,a2=o.color2||a;
  const st={modern:["var(--fd)","800","none","22px","999px"],elegant:["Georgia,'Instrument Serif',serif","500","none","10px","8px"],bold:["var(--fd)","800","uppercase","4px","4px"]}[o.style||"modern"];
  const base=dark?{sb:"#0F1115",si:"#F2F3F7",sc:"#1A1D24",sh:`linear-gradient(160deg,color-mix(in srgb,${a} 22%,#0F1115),#0F1115)`}
                  :{sb:"#FAF9F6",si:"#16181F",sc:"#F0EEE9",sh:`linear-gradient(160deg,color-mix(in srgb,${a} 18%,#ffffff),#FAF9F6)`};
  if(bg==="gradient"||bg==="animated"){base.sb=`linear-gradient(160deg,color-mix(in srgb,${a} 38%,#0B0D12),color-mix(in srgb,${a2} 38%,#0B0D12)${bg==="animated"?`,color-mix(in srgb,${a} 30%,#0B0D12)`:""})`;base.sc="rgba(255,255,255,.08)";base.sh="rgba(255,255,255,.06)"}
  const acc=(dark&&lum(a)<45)?"#F2F3F7":(!dark&&lum(a)>225)?"#16181F":a;
  return `--sb:${base.sb};--si:${base.si};--sc:${base.sc};--sh:${base.sh};--sa:${acc};--sai:${ink(acc)};--shf:${st[0]};--shw:${st[1]};--stt:${st[2]};--sr:${st[3]};--sbr:${st[4]}`;
}
/* What the business offers: [list title, one item, title with prices] */
const OFFER={svc:["Servicii","Serviciu","Servicii și prețuri"],prod:["Produse","Produs","Produse și prețuri"],menu:["Meniu","Preparat","Meniu și prețuri"]};
const offerDefault=k=>k==="cofetarie"?"prod":k==="restaurant"?"menu":"svc";
/* o: {niche,name,slogan,color,style,theme,lang,secs,services:[{n,d,p}],about,hours,city,bookVia} */
function siteHTML(o){
  const N=NICHES[o.niche],nm=(o.name&&o.name.trim())||N.ph,S=o.secs||{book:1,prices:1,map:1};
  const items=(o.services&&o.services.filter(s=>s.n&&s.n.trim()).length)?o.services.filter(s=>s.n&&s.n.trim()).map(s=>[s.n,s.d||"",s.p||"ofertă"]):N.items;
  const langs=o.lang==="rohuen"?"RO | HU | EN":o.lang==="rohu"?"RO | HU":"";
  const city=(o.city&&o.city.trim())||"Târgu Mureș";
  let h=`<div class="scroll"><div class="s-nav"><div class="s-logo"><span class="s-mark">${esc(nm.trim()[0].toUpperCase())}</span><span>${esc(nm)}</span></div><div class="s-right">${langs?`<span class="s-lang">${langs}</span>`:""}<div class="s-burger"></div></div></div>
  <div class="s-hero">${o.fx==="3d"?'<div class="s-3d" aria-hidden="true"><i></i><i></i><i></i><b></b></div>':""}${o.fx==="draw"?'<svg class="s-draw" viewBox="0 0 120 80" aria-hidden="true"><path d="M8 60 C 25 20, 45 70, 62 32 S 100 18, 112 44"/><path d="M86 12 l4 9 10 1 -8 6 3 10 -9-6 -9 6 3-10 -8-6 10-1z"/></svg>':""}<div class="tag">${esc(N.tag)} · ${esc(city)}</div><h3>${esc(nm)}</h3><p>${esc((o.slogan&&o.slogan.trim())||N.p)}</p><span class="s-cta">${esc(N.cta)}</span><div class="deco"></div></div>
  <div class="s-feat"><i>${N.fi}</i><span>${esc(N.feat)}</span></div>`;
  if(S.about)h+=`<div class="s-h4">Despre noi</div><div class="s-about">${esc((o.about&&o.about.trim())||"Povestea afacerii tale, pe scurt: de când existați și ce vă face diferiți.")}</div>`;
  if(S.book)h+=`<div class="s-h4">${o.bookVia&&o.bookVia!=="form"?"Programare online":"Alege ora"}</div>${o.bookVia&&o.bookVia!=="form"?`<div class="s-ext">Rezervă pe ${esc({mero:"Mero",fresha:"Fresha",booksy:"Booksy",whatsapp:"WhatsApp",phone:"telefon"}[o.bookVia]||"aplicație")} →</div>`:`<div class="s-slots"><span>10:00</span><span class="on">11:30</span><span>14:00</span><span>17:00</span></div>`}`;
  const of=o.offer||offerDefault(o.niche),list=arr=>`<div class="s-list">${arr.map(([a,b,p])=>`<div class="s-item"><span>${esc(a)}${b?`<br><small>${esc(b)}</small>`:""}</span><b>${S.prices?esc(p):"→"}</b></div>`).join("")}</div>`;
  if(of==="both"){const src=(o.services||[]).filter(s=>s.n&&s.n.trim());const sv=src.filter(s=>s.t!=="p").map(s=>[s.n,s.d||"",s.p||"ofertă"]),pr=src.filter(s=>s.t==="p").map(s=>[s.n,s.d||"",s.p||"ofertă"]);
    if(sv.length||!src.length)h+=`<div class="s-h4">${OFFER.svc[S.prices?2:0]}</div>`+list(sv.length?sv:items);if(pr.length)h+=`<div class="s-h4">${OFFER.prod[S.prices?2:0]}</div>`+list(pr)}
  else h+=`<div class="s-h4">${OFFER[of][S.prices?2:0]}</div>`+list(items);
  if(S.team)h+=`<div class="s-h4">Echipa</div><div class="s-team"><i></i><i></i><i></i></div>`;
  if(S.gallery)h+=`<div class="s-h4">Galerie</div><div class="s-gal"><i></i><i></i><i></i></div>`;
  if(S.reviews)h+=`<div class="s-h4">Recenzii</div><div class="s-rev"><b>★</b><div><span>★★★★★</span><small>Recenziile tale de pe Google, afișate aici</small></div></div>`;
  if(S.faq)h+=`<div class="s-h4">Întrebări</div><div class="s-list"><div class="s-item"><span>Unde parchez?</span><b>+</b></div><div class="s-item"><span>Cum plătesc?</span><b>+</b></div></div>`;
  if(S.offers)h+=`<div class="s-h4">Oferte</div><div class="s-ext" style="background:transparent;color:inherit;border:1.5px dashed var(--sa)">−10% la prima vizită · cod BUNVENIT</div>`;
  if(S.beforeafter)h+=`<div class="s-h4">Înainte și după</div><div class="s-gal" style="grid-template-columns:1fr 1fr;grid-template-rows:70px"><i style="opacity:.45;grid-row:auto"></i><i style="grid-row:auto"></i></div>`;
  if(S.video)h+=`<div class="s-h4">Video</div><div class="s-vid">▶</div>`;
  if(S.insta)h+=`<div class="s-h4">Instagram</div><div class="s-team" style="grid-template-columns:repeat(4,1fr)"><i style="border-radius:8px;border-style:solid;opacity:.5"></i><i style="border-radius:8px;border-style:solid;opacity:.5"></i><i style="border-radius:8px;border-style:solid;opacity:.5"></i><i style="border-radius:8px;border-style:solid;opacity:.5"></i></div>`;
  if(S.blog)h+=`<div class="s-h4">Noutăți</div><div class="s-list"><div class="s-item"><span>Articol nou<br><small>sfaturi pentru clienți</small></span><b>→</b></div></div>`;
  if(S.contact)h+=`<div class="s-h4">Contact</div><div class="s-about">Nume · Telefon · Mesaj<br><b style="color:var(--sa)">Trimite →</b></div>`;
  if(S.map)h+=`<div class="s-h4">Program și hartă</div><div class="s-hours">${esc((o.hours&&o.hours.trim())||"L–V 09:00–18:00 · S 09:00–13:00")}</div><div class="s-map"></div>`;
  h+=`</div>`;
  if(S.rai)h+=`<div class="s-chat"><span>${esc(N.chat)}</span><i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 5h16v11H8l-4 4z"/></svg></i></div>`;
  if(o.fx==="intro")h+=`<div class="s-intro" aria-hidden="true"><span class="s-mark">${esc(nm.trim()[0].toUpperCase())}</span><b>${esc(nm)}</b></div>`;
  return h+`<div class="scan"></div>`;
}
function paint(el,o){el.style.cssText=siteVars(o);el.dataset.bg=o.bg||"";el.innerHTML=siteHTML(o)}
const preset=k=>({niche:k,color:NICHES[k].sw[0],theme:"auto",style:"modern",secs:{book:1,prices:1,map:1,rai:1}});
/* builder catalog (shared by builder, pricing and custom-solutions pages) */
const PRICES={free:0,basic:500,ultra:1199,raiMonth:"99,99",raiSetup:300};
const SECTIONS=[["about","Despre noi"],["book","Programare / comenzi"],["prices","Prețuri"],["map","Program și hartă"],["contact","Formular de contact"],["reviews","Recenzii Google"],["gallery","Galerie"],["team","Echipa"],["faq","Întrebări frecvente"],
  ["offers","Oferte și cupoane",1],["beforeafter","Înainte și după",1],["video","Video de prezentare",1],["insta","Instagram pe site",1],["blog","Noutăți / blog",1],
  ["rai","Asistent RAI 24/7",0,"+99,99 lei/lună"]];
const EXTRAS=[["shop","Magazin mic","câteva produse, coș și comandă"],["qr","Meniu QR","meniul pe telefon, schimbat oricând"],["table","Rezervare de masă","alegi ora și numărul de persoane"],["gcal","Programări în Google Calendar","fiecare programare intră direct în calendarul tău"],
  ["voucher","Vouchere cadou","clienții cumpără un voucher pentru altcineva"],["loyalty","Card de fidelitate","a 10-a vizită gratuită, de exemplu"],["cake","Constructor de comandă","tort, meniu sau pachet ales pas cu pas"],["multi","Mai multe locații","fiecare locație cu program și hartă"],["lang3","Încă o limbă","de ex. germană, pe lângă RO, HU, EN"]];
const EFFECTS=[["none","Fără efecte","design curat"],["3d","Element 3D","obiect 3D care se rotește în prima secțiune"],["draw","Ilustrații desenate","desene animate de mână, unice pentru tine"],["intro","Intro animat","logo-ul tău apare animat la deschidere"]];
const CARE=[["none","Fără administrare","",""],["m1","Lunar","149 lei/lună","fără angajament"],["m3","3 luni plătite înainte","425 lei","≈142 lei/lună · −5%"],["m6","6 luni plătite înainte","805 lei","≈134 lei/lună · −10%"],["m12","12 luni plătite înainte","1.520 lei","≈127 lei/lună · −15%"]];
/* one request per visitor: remembered in this browser for 30 days */
const LOCK_KEY="ohi-lead-sent";
function leadLocked(){try{const r=JSON.parse(localStorage.getItem(LOCK_KEY)||"null");if(r&&Date.now()-r.at<30*864e5)return r}catch(e){}return null}
function lockLead(r){try{localStorage.setItem(LOCK_KEY,JSON.stringify({...r,at:Date.now()}))}catch(e){}}
function reqId(){return "REQ-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase()}
/* send one lead to the CRM webhook. Fields follow the CRM "Leads" columns; extra fields (design_json, marketing_consent…) need mapping in Make. */
async function sendLead(fields){
  const data=new URLSearchParams(fields);
  if(!LIVE){await new Promise(r=>setTimeout(r,600));return {preview:true}}
  const ctrl=new AbortController(),tm=setTimeout(()=>ctrl.abort(),15000);let res=null;
  try{res=await fetch(WEBHOOK,{method:"POST",body:data,signal:ctrl.signal})}
  catch(x){if(x.name==="AbortError")throw x /* otherwise the browser hid the reply (CORS); the request was sent */}
  finally{clearTimeout(tm)}
  if(res&&!res.ok)throw new Error("http "+res.status);
  return {ok:true};
}

/* site menu: injected into every page's nav, so all pages share one list */
(function(){
  const nav=document.querySelector("nav .wrap");if(!nav)return;
  const here=(location.pathname.split("/").pop()||"/").replace(/\.html$/,"")||"index";
  const L=[["Pagini",[["/","Acasă",""],["/#cum","Cum lucrăm",""],["/preturi","Prețuri","pachete și comparație"],["/constructor","Trimite datele","pentru demo-ul tău gratuit"],["/automatizari","OHI Autopilot","cereri automate și recenzii"],["/solutii-personalizate","Soluții personalizate","funcții extra pentru pachetul Business"],["/blog","Blog","sfaturi pentru afaceri locale"]]],
           ["Site-uri pe domenii",[["/site-uri-saloane","Saloane și frizerii",""],["/site-uri-restaurante","Restaurante și cafenele",""],["/site-uri-service-auto","Service-uri auto",""]]],
           ["Altele",[["https://rais-pi.vercel.app/","Asistent AI (RAI)","răspunde clienților 24/7"],["/#intrebari","Întrebări frecvente",""]]]];
  const cta=nav.querySelector(":scope > .btn");const wrap=document.createElement("div");wrap.className="navr";nav.appendChild(wrap);if(cta)wrap.appendChild(cta);
  const b=document.createElement("button");b.type="button";b.className="mbtn";b.setAttribute("aria-label","Deschide meniul");b.setAttribute("aria-expanded","false");b.innerHTML="<i></i><span>Meniu</span>";wrap.appendChild(b);
  const d=document.createElement("div");d.className="drawer";d.setAttribute("aria-hidden","true");
  d.innerHTML=`<div class="dpanel" role="dialog" aria-label="Meniu"><div class="dtop"><b>Meniu</b><button type="button" class="dclose" aria-label="Închide meniul">×</button></div>`+
    L.map(([t,items])=>`<div class="dsec">${t}</div>`+items.map(([h,n,s])=>{const k=h.replace(/^\//,"").replace(/\.html.*$/,"").replace(/#.*/,"")||"index";const cur=k===here&&!h.includes("#");return `<a class="dlink ${cur?"cur":""}" href="${h}"${h.startsWith("http")?' target="_blank" rel="noopener"':""}><span>${n}${s?`<br><small>${s}</small>`:""}</span><span>→</span></a>`}).join("")).join("")+
    `<div class="dcta"><a class="btn a" href="/#construieste">Vreau demo gratuit</a><a class="btn g" href="tel:+${WA}">Sună: 0740 267 706</a></div></div>`;
  document.body.appendChild(d);
  const open=v=>{d.classList.toggle("open",v);d.setAttribute("aria-hidden",String(!v));b.setAttribute("aria-expanded",String(v));document.documentElement.style.overflow=v?"hidden":"";if(v)d.querySelector(".dclose").focus()};
  b.onclick=()=>open(true);d.querySelector(".dclose").onclick=()=>open(false);
  d.addEventListener("click",e=>{if(e.target===d||e.target.closest(".dlink"))open(false)});
  addEventListener("keydown",e=>{if(e.key==="Escape")open(false)});
})();
