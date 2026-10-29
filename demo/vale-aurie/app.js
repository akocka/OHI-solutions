import {createBottle} from './bottle.js';
const VT={
 red:{ro:{kind:'Vin roșu sec',name:'Fetească Neagră',desc:'Cireșe negre, prune coapte și un final catifelat, ușor condimentat.',abv:'13,5%',temp:'16°C',nose:'Cireșe negre, prune uscate, o notă de vanilie.',taste:'Corp mediu spre plin, taninuri fine, final lung.',pair:'Friptură de vită, tocăniță, brânzeturi maturate.',big:'NEAGRĂ'},
      hu:{kind:'Száraz vörösbor',name:'Fetească Neagră',desc:'Fekete cseresznye, érett szilva és bársonyos, enyhén fűszeres lecsengés.',abv:'13,5%',temp:'16°C',nose:'Fekete cseresznye, aszalt szilva, egy csipet vanília.',taste:'Közepes-testes, finom tanninok, hosszú lecsengés.',pair:'Marhasült, pörkölt, érlelt sajtok.',big:'NEAGRĂ'},
      en:{kind:'Dry red wine',name:'Fetească Neagră',desc:'Black cherries, ripe plums and a velvety, gently spiced finish.',abv:'13.5%',temp:'16°C',nose:'Black cherry, dried plum, a hint of vanilla.',taste:'Medium to full body, fine tannins, long finish.',pair:'Roast beef, stews, aged cheeses.',big:'NEAGRĂ'}},
 white:{ro:{kind:'Vin alb sec',name:'Fetească Regală',desc:'Flori de salcâm, mere verzi și o aciditate proaspătă, vie.',abv:'12,5%',temp:'10°C',nose:'Flori albe, măr verde, citrice.',taste:'Proaspăt, mineral, cu o aciditate vie.',pair:'Pește, paste cu sos alb, salate de vară.',big:'REGALĂ'},
      hu:{kind:'Száraz fehérbor',name:'Fetească Regală',desc:'Akácvirág, zöldalma és friss, élénk savak.',abv:'12,5%',temp:'10°C',nose:'Fehér virágok, zöldalma, citrusok.',taste:'Friss, ásványos, élénk savakkal.',pair:'Hal, fehér szószos tészta, nyári saláták.',big:'REGALĂ'},
      en:{kind:'Dry white wine',name:'Fetească Regală',desc:'Acacia blossom, green apple and fresh, lively acidity.',abv:'12.5%',temp:'10°C',nose:'White flowers, green apple, citrus.',taste:'Fresh, mineral, with lively acidity.',pair:'Fish, pasta with white sauce, summer salads.',big:'REGALĂ'}},
 rose:{ro:{kind:'Vin rosé sec',name:'Rosé de Mureș',desc:'Căpșuni de pădure, zmeură și o prospețime de vară.',abv:'12%',temp:'9°C',nose:'Căpșuni, zmeură, coajă de grepfrut.',taste:'Ușor, fructat, cu final răcoritor.',pair:'Aperitive, pui la grătar, deserturi cu fructe.',big:'ROSÉ'},
      hu:{kind:'Száraz rozé',name:'Rosé de Mureș',desc:'Erdei szamóca, málna és nyári frissesség.',abv:'12%',temp:'9°C',nose:'Eper, málna, grapefruithéj.',taste:'Könnyed, gyümölcsös, frissítő lecsengés.',pair:'Előételek, grillcsirke, gyümölcsös desszertek.',big:'ROSÉ'},
      en:{kind:'Dry rosé',name:'Rosé de Mureș',desc:'Wild strawberries, raspberries and summer freshness.',abv:'12%',temp:'9°C',nose:'Strawberry, raspberry, grapefruit peel.',taste:'Light, fruity, with a refreshing finish.',pair:'Starters, grilled chicken, fruit desserts.',big:'ROSÉ'}}};
const T={hu:{nNotes:'Kóstolás',nCellar:'A pince',nGifts:'Ajándékok',cOrder:'Rendelés',hE:'Vale Aurie pince · Maros',hH1:'Türelemmel',hH2:'készült bor.',hP:'Kézzel szedett szőlő, lassú erjesztés, kapkodás nélküli érlelés. Forgassátok meg az üveget, és válasszatok.',cGift:'Céges ajándékok',cNotes:'Kóstolási jegyzetek',mAbv:'alkohol',mTemp:'tálalás',mPrice:'példaár',vRed:'Vörös',vWhite:'Fehér',vRose:'Rozé',drag:'Húzd az üveg forgatásához',nE:'Kóstolási jegyzetek',nH:'a pohárban',n1:'Illat',n2:'Íz',n3:'Mihez illik',noteEx:'A jegyzetek, árak és nevek ennek a koncepciónak a példái.',cE:'A szőlőtől a pohárig',cH:'Három lépés, <em>rövidítés nélkül</em>',c1:'Kézi szüret',c1p:'A szőlőt szemenként válogatjuk, hűvös őszi reggeleken.',c2:'Lassú erjesztés',c2p:'Szabályozott hőmérsékleten, hogy az aromák tiszták maradjanak.',c3:'Türelmes érlelés',c3p:'Hónapokig pihen, mielőtt palackba kerül.',gE:'Céges ajándékok',gH:'A karácsonyi ajándék, <em>amire emlékeznek</em>',gP:'Ajándékdobozok borainkkal, személyre szabott üdvözlőlappal és a cégetek logójával. Rendelés 10 doboztól.',bot:'üveg',b1:'Duo doboz',b1p:'Vörös + fehér, üdvözlőlap',pop:'A legnépszerűbb',b2:'Trio doboz',b2p:'Mindhárom fajta, gravírozott logó',b3:'Pince láda',b3p:'Fa láda partnereknek',oQ:'Dobozok száma',oC:'Cég',oD:'Szállítás eddig',oS:'Ajánlatkérés WhatsAppon',pvH:'Demo · ez az üzenet érkezne a pincéhez:',foot:'3D weboldal-koncepció az OHI Solutions-tól. A „Vale Aurie pince” kitalált márka.',age:'Mértékkel fogyassz alkoholt. Csak 18 év felettieknek.'},
 en:{nNotes:'Tasting',nCellar:'The cellar',nGifts:'Gifts',cOrder:'Order',hE:'Vale Aurie winery · Mureș',hH1:'Wine made',hH2:'with patience.',hP:'Hand-picked grapes, slow fermentation, unhurried ageing. Turn the bottle and choose your wine.',cGift:'Corporate gifts',cNotes:'Tasting notes',mAbv:'alcohol',mTemp:'serving',mPrice:'sample price',vRed:'Red',vWhite:'White',vRose:'Rosé',drag:'Drag to turn the bottle',nE:'Tasting notes',nH:'in the glass',n1:'Nose',n2:'Palate',n3:'Pairs with',noteEx:'Notes, prices and names are examples for this concept.',cE:'From vine to glass',cH:'Three steps, <em>no shortcuts</em>',c1:'Hand-picked',c1p:'Grapes are chosen berry by berry on cool autumn mornings.',c2:'Slow fermentation',c2p:'At controlled temperatures, so the aromas stay pure.',c3:'Patient ageing',c3p:'Months of rest before the wine reaches the bottle.',gE:'Corporate gifts',gH:'The Christmas gift <em>they will remember</em>',gP:'Gift boxes with our wines, a personalised card and your company logo. Orders from 10 boxes.',bot:'bottles',b1:'Duo box',b1p:'Red + white, card',pop:'Most chosen',b2:'Trio box',b2p:'All three wines, engraved logo',b3:'Cellar crate',b3p:'Wooden crate for partners',oQ:'Number of boxes',oC:'Company',oD:'Deliver by',oS:'Request a quote on WhatsApp',pvH:'Demo · the message the winery would receive:',foot:'3D website concept by OHI Solutions. “Vale Aurie winery” is a fictional brand.',age:'Drink responsibly. Adults over 18 only.'}};
T.ro={};document.querySelectorAll('[data-t]').forEach(e=>T.ro[e.dataset.t]=e.innerHTML);
let L='ro',V='red';const order=['red','white','rose'];
const B=createBottle(document.getElementById('gl'));B.setVariety('red');
function fillV(){const d=VT[V][L];document.querySelectorAll('[data-vt]').forEach(e=>{const k=e.dataset.vt;if(d[k]!=null)e.textContent=d[k]})}
const big=document.getElementById('bigword');
function setV(v){if(v===V)return;V=v;document.body.dataset.v=v;B.setVariety(v);B.spinBy(9);
  document.querySelectorAll('.vdot').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  big.classList.add('sw');setTimeout(()=>{big.textContent=VT[v][L].big;big.classList.remove('sw')},300);
  document.querySelectorAll('.vcard,.ncol h2').forEach(el=>el.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:600,easing:'cubic-bezier(.16,1,.3,1)'}));fillV()}
document.querySelectorAll('.vdot').forEach(b=>b.onclick=()=>setV(b.dataset.v));
document.querySelector('.vprev').onclick=()=>setV(order[(order.indexOf(V)+2)%3]);
document.querySelector('.vnext').onclick=()=>setV(order[(order.indexOf(V)+1)%3]);
function setLang(l){L=l;document.documentElement.lang=l;try{localStorage.setItem('vaLang',l)}catch(e){}
  document.querySelectorAll('[data-t]').forEach(e=>{const v=(T[l]||{})[e.dataset.t]??T.ro[e.dataset.t];if(v!=null)e.innerHTML=v});fillV();big.textContent=VT[V][L].big;
  document.querySelectorAll('button[data-l]').forEach(b=>b.classList.toggle('on',b.dataset.l===l));document.getElementById('lcode').textContent=l.toUpperCase();lg.classList.remove('open')}
const lg=document.getElementById('lang');document.getElementById('lcur').onclick=e=>{e.stopPropagation();lg.classList.toggle('open')};
document.addEventListener('click',()=>lg.classList.remove('open'));document.querySelectorAll('button[data-l]').forEach(b=>b.onclick=e=>{e.stopPropagation();setLang(b.dataset.l)});
/* drag to turn the bottle */
(function(){const z=document.getElementById('drag');let on=false,lx=0,lt=0;z.addEventListener('pointerdown',e=>{on=true;lx=e.clientX;lt=performance.now();z.setPointerCapture(e.pointerId);B.setAuto(false)});
  z.addEventListener('pointermove',e=>{if(!on)return;const now=performance.now(),dx=e.clientX-lx;B.pose.spin+=dx*.012;B.spinBy(dx*.06/Math.max(.008,(now-lt)/1000)*.016);lx=e.clientX;lt=now});
  const up=()=>{on=false;setTimeout(()=>B.setAuto(true),1500)};z.addEventListener('pointerup',up);z.addEventListener('pointercancel',up)})();
/* scroll choreography: each section declares where the bottle should be */
const secs=[...document.querySelectorAll('section[data-pose]')];const mob=()=>innerWidth<=900;
const P=s=>(mob()?s.dataset.poseM:s.dataset.pose).split(',').map(Number);let lastSec=-1;
function choreo(){const y=scrollY,a=secs.map(s=>s.offsetTop+s.offsetHeight/2-innerHeight/2);let i=0;while(i<a.length-1&&y>a[i+1])i++;
  let t=i<a.length-1?(y-a[i])/(a[i+1]-a[i]):0;t=Math.max(0,Math.min(1,t));t=t*t*(3-2*t);
  const p0=P(secs[i]),p1=P(secs[Math.min(i+1,secs.length-1)]);const m=(k)=>p0[k]+(p1[k]-p0[k])*t;
  B.pose.x=m(0);B.pose.y=m(1);B.pose.s=m(2);B.pose.tilt=m(3);
  const near=t<.5?i:i+1;if(near!==lastSec){if(lastSec>=0)B.spinBy(6);lastSec=near}
  big.style.opacity=Math.max(0,1-y/(innerHeight*.9)).toFixed(2)}
addEventListener('scroll',choreo,{passive:true});addEventListener('resize',choreo);
/* header */
const hdr=document.getElementById('hdr');let ly=scrollY;addEventListener('scroll',()=>{const y=scrollY;if(y>ly+6&&y>300&&!lg.classList.contains('open'))hdr.classList.add('hide');else if(y<ly-6)hdr.classList.remove('hide');ly=y},{passive:true});
/* reveal */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});document.querySelectorAll('.rv').forEach(e=>io.observe(e));
/* corporate order → WhatsApp message (demo: shown instead of sent) */
(function(){const f=document.getElementById('order');let q=20;const qe=document.getElementById('qty');
  f.querySelectorAll('.step button').forEach(b=>b.onclick=()=>{q=Math.max(10,Math.min(500,q+ +b.dataset.s));qe.textContent=q});
  const d=new Date(Date.now()+7*864e5);f.d.min=new Date().toISOString().slice(0,10);f.d.value=d.toISOString().slice(0,10);
  const M={ro:['Bună ziua! Aș dori o ofertă pentru cadouri corporate:','Cutie','sticle','Cantitate','cutii','Companie','Livrare până la','Mulțumesc!'],hu:['Jó napot! Ajánlatot kérnék céges ajándékokra:','Doboz','üveg','Mennyiség','doboz','Cég','Szállítás eddig','Köszönöm!'],en:['Hello! I would like a quote for corporate gifts:','Box','bottles','Quantity','boxes','Company','Deliver by','Thank you!']};
  f.onsubmit=e=>{e.preventDefault();const m=M[L],box=document.querySelector('input[name=box]:checked').value,dt=new Date(f.d.value+'T12:00').toLocaleDateString({ro:'ro-RO',hu:'hu-HU',en:'en-GB'}[L],{day:'numeric',month:'long',year:'numeric'});
    const msg=[m[0],`🎁 ${m[1]}: ${box} ${m[2]}`,`📦 ${m[3]}: ${q} ${m[4]}`,`🏢 ${m[5]}: ${f.co.value}`,`📅 ${m[6]}: ${dt}`,'',m[7]].join('\n');
    document.getElementById('pvT').textContent=msg;const pv=document.getElementById('preview');pv.hidden=false;pv.scrollIntoView({behavior:'smooth',block:'center'})}})();
/* bottle rises in after the intro */
const introDelay=document.documentElement.classList.contains('nointro')?100:1900;B.pose.s=.0001;setTimeout(()=>{choreo()},introDelay);
try{const s=localStorage.getItem('vaLang');if(s&&s!=='ro')setLang(s)}catch(e){}
try{sessionStorage.setItem('vaIntro','1')}catch(e){}
window.__ok=1;window.__B=B;
