/* OHI concept motion kit: smooth wheel scroll, magnetic buttons, reveals, scroll progress, 3D tilt */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(pointer: fine)').matches;
  const root=document.documentElement;
  root.classList.toggle('rm',reduce);root.classList.toggle('fine',fine);
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const hooks=[];window.OHI={onFrame:f=>hooks.push(f),reduce,fine,clamp};

  /* smooth, eased wheel scrolling on desktop only (touch keeps native momentum) */
  let cur=scrollY,tgt=scrollY,act=false;
  const max=()=>root.scrollHeight-innerHeight;
  function loop(){cur+=(tgt-cur)*0.085;if(Math.abs(tgt-cur)<0.4){cur=tgt;act=false}window.scrollTo(0,cur);if(act)requestAnimationFrame(loop)}
  function go(y){if(reduce||!fine){window.scrollTo({top:y,behavior:reduce?'auto':'smooth'});return}tgt=clamp(y,0,max());if(!act){cur=scrollY;act=true;requestAnimationFrame(loop)}}
  if(fine&&!reduce){
    addEventListener('wheel',e=>{if(e.ctrlKey||e.defaultPrevented)return;e.preventDefault();if(!act){cur=tgt=scrollY}
      tgt=clamp(tgt+e.deltaY*(e.deltaMode===1?36:1),0,max());if(!act){act=true;requestAnimationFrame(loop)}},{passive:false});
    addEventListener('scroll',()=>{if(!act){cur=tgt=scrollY}},{passive:true});
  }
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href');if(id.length<2)return;
    const el=document.querySelector(id);if(!el)return;e.preventDefault();go(el.getBoundingClientRect().top+scrollY-(parseInt(a.dataset.off)||0))});

  /* magnetic buttons: the button and its label follow the pointer */
  if(fine&&!reduce)document.querySelectorAll('[data-mag]').forEach(b=>{
    const s=parseFloat(b.dataset.mag)||.3,lab=b.querySelector('.lb');
    b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
      b.style.transform=`translate(${x*s}px,${y*s}px)`;if(lab)lab.style.transform=`translate(${x*s*.35}px,${y*s*.35}px)`});
    b.addEventListener('pointerleave',()=>{b.style.transform='';if(lab)lab.style.transform=''});
  });

  /* reveal once when entering the viewport */
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}}),{threshold:.16,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('[data-rv]').forEach(e=>reduce?e.classList.add('in'):io.observe(e));

  /* 3D tilt on hover */
  if(fine&&!reduce)document.querySelectorAll('[data-tilt]').forEach(c=>{
    const m=parseFloat(c.dataset.tilt)||8;
    c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      c.style.transform=`perspective(900px) rotateX(${-y*m}deg) rotateY(${x*m}deg) translateZ(0)`;c.style.setProperty('--gx',(x+.5)*100+'%');c.style.setProperty('--gy',(y+.5)*100+'%')});
    c.addEventListener('pointerleave',()=>{c.style.transform=''});
  });

  /* scroll progress: [data-pin] = sticky scenes (0→1 while pinned), [data-prog] = element passing through viewport */
  const pins=[...document.querySelectorAll('[data-pin]')],progs=[...document.querySelectorAll('[data-prog]')];
  let mx=0,my=0;addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
  function frame(){
    pins.forEach(el=>{const r=el.getBoundingClientRect(),d=r.height-innerHeight;el.style.setProperty('--p',d>0?clamp(-r.top/d,0,1).toFixed(4):0)});
    progs.forEach(el=>{const r=el.getBoundingClientRect();el.style.setProperty('--p',clamp((innerHeight-r.top)/(innerHeight+r.height),0,1).toFixed(4))});
    hooks.forEach(f=>f(mx,my));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
