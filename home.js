/* OHI home page: 3D site ring, cinematic push-in, manifest words, stacked service cards. */
(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* ---- hero ring ---- */
const wrap=document.getElementById('ringw'),ring=document.getElementById('ring'),hc=document.getElementById('hc');
if(ring){
const cards=[...ring.children],n=cards.length,step=360/n;
let R=0,ang=0,vel=0,base=reduce?0:-.12,drag=null,moved=0,tilt=-7,scl=1,visible=true;
function layout(){const cw=cards[0].offsetWidth;R=Math.round(cw/2/Math.tan(Math.PI/n)*1.1);cards.forEach((c,i)=>c.style.transform=`rotateY(${i*step}deg) translateZ(${R}px)`)}
layout();addEventListener('resize',layout);
function frame(){
  if(visible){
    if(!drag){vel+=(base-vel)*.03;ang+=vel}
    ring.style.transform=`translateZ(${-R}px) scale(${scl}) rotateX(${tilt}deg) rotateY(${ang}deg)`;
    cards.forEach((c,i)=>{let f=((i*step+ang)%360+540)%360-180,a=Math.abs(f);
      c.querySelector('.sh').style.opacity=Math.min(.82,a/110).toFixed(3);
      const v=c.querySelector('video');
      if(a<55){if(!v.src){v.src='/portofoliu-media/'+c.dataset.v+'.mp4'}if(v.paused)v.play().catch(()=>{})}else if(!v.paused)v.pause()});
  }
  requestAnimationFrame(frame)}
requestAnimationFrame(frame);
wrap.addEventListener('pointerdown',e=>{drag={x:e.clientX,t:performance.now()};moved=0;vel=0});
addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,now=performance.now();moved+=Math.abs(dx);const d=dx*.22;ang+=d;vel=d/Math.max(1,(now-drag.t)/16.7);drag.x=e.clientX;drag.t=now});
addEventListener('pointerup',()=>{drag=null;vel=Math.max(-6,Math.min(6,vel))});
addEventListener('pointercancel',()=>{drag=null});
wrap.addEventListener('click',e=>{if(moved>6){e.preventDefault();e.stopPropagation()}},true);
wrap.addEventListener('dragstart',e=>e.preventDefault());
const hero=document.querySelector('.hero');
function heroScroll(){const p=Math.min(1,Math.max(0,scrollY/(hero.offsetHeight*.7)));
  tilt=-7+p*9;scl=1+p*.22;if(!reduce){hc.style.transform=`translateY(${-p*70}px)`;hc.style.opacity=1-p*1.1}}
addEventListener('scroll',heroScroll,{passive:true});heroScroll();
new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(!visible)cards.forEach(c=>c.querySelector('video').pause())}).observe(hero);
}

/* ---- cinematic push-in ---- */
const sec=document.getElementById('poveste');
if(sec){
const track=sec.querySelector('.cintrack'),stage=document.getElementById('cinstage');
const zoom=document.getElementById('cinzoom'),vig=document.getElementById('cinvig'),fade=document.getElementById('cinfade'),bar=document.getElementById('cinbar');
const beats=[...sec.querySelectorAll('.cinb')].map(el=>({el,a:parseFloat(el.dataset.a),b:parseFloat(el.dataset.b)}));
const ez=t=>Math.pow(t,1.12);
function cinFrame(){
  const r=track.getBoundingClientRect(),run=track.offsetHeight-stage.offsetHeight;
  const p=Math.min(1,Math.max(0,(-r.top)/run));
  const S=innerWidth<760?2.35:3.0;
  zoom.style.setProperty('--s',(1+ez(p)*(S-1)).toFixed(4));
  vig.style.setProperty('--vg',Math.min(1,p*1.35).toFixed(3));
  fade.style.setProperty('--fo',Math.min(1,Math.max(0,(p-.74)/.2)).toFixed(3));
  bar.style.width=(p*100).toFixed(1)+'%';
  beats.forEach(({el,a,b})=>{let o=0,y=22;
    const fi=(p-a)/.09,fo=(b-p)/.09;
    if(p>=a-.09&&p<=b+.09){o=Math.min(1,Math.max(0,Math.min(fi,fo)));y=22-22*Math.min(1,Math.max(0,fi))+(1-Math.min(1,Math.max(0,fo)))*-18}
    el.style.opacity=o.toFixed(3);el.style.transform='translateY('+y.toFixed(1)+'px)';el.style.pointerEvents=o>.6?'auto':'none'});
}
if(reduce){zoom.style.setProperty('--s',1);beats[3].el.style.opacity=1;beats[3].el.style.transform='none'}
else{addEventListener('scroll',cinFrame,{passive:true});addEventListener('resize',cinFrame);cinFrame()}
}

/* ---- manifest words ---- */
const mfp=document.getElementById('mft');
if(mfp){
const mf=mfp.closest('.mf'),mbar=document.getElementById('mfbar');
const HL={'instant,':'c','impecabil':'c','clienți.':'a'};
const words=mfp.textContent.trim().split(/\s+/);
mfp.innerHTML=words.map(w=>'<i'+(HL[w]?' data-k="'+HL[w]+'"':'')+'>'+w+'</i>').join(' ');
const its=[...mfp.querySelectorAll('i')];
const mtrack=mf.querySelector('.mftrack'),mstage=mf.querySelector('.mfstage');
function mfFrame(){const r=mtrack.getBoundingClientRect(),run=mtrack.offsetHeight-mstage.offsetHeight;
  const q=Math.min(1,Math.max(0,(-r.top)/run));const lit=Math.round(q*1.25*its.length);
  its.forEach((el,k)=>{const on=k<lit;el.classList.toggle('lit',on);if(el.dataset.k)el.classList.toggle(el.dataset.k,on)});
  mbar.style.width=Math.min(100,q*125)+'%'}
addEventListener('scroll',mfFrame,{passive:true});addEventListener('resize',mfFrame);mfFrame();
}

/* ---- stacked cards ---- */
const cards2=[...document.querySelectorAll('.svlist .card')],svs=document.getElementById('servicii');
let run2=false;
function tick(){if(!run2)return;
  cards2.forEach((c,i)=>{const nx=cards2[i+1];let d=0;
    if(nx){const nr=nx.getBoundingClientRect();d=Math.min(1,Math.max(0,(innerHeight-nr.top)/(innerHeight*0.9)))}
    c.style.transform='scale('+(1-d*0.055)+') translateY('+(-d*10)+'px)';c.style.filter='brightness('+(1-d*0.3)+')'});
  requestAnimationFrame(tick)}
if(!reduce&&svs){new IntersectionObserver(e=>{const v=e[0].isIntersecting;if(v&&!run2){run2=true;requestAnimationFrame(tick)}else if(!v)run2=false},{rootMargin:'200px'}).observe(svs)}
})();
