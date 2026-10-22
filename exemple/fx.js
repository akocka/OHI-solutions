/* OHI example sites: trust-building motion layer.
   Runs before /motion.js: marks buttons as magnetic and cards as tiltable, then motion.js wires smooth scroll,
   magnetic buttons and 3D tilt. Adds a hero entrance, a scroll progress line and count-up numbers.
   Everything switches off for prefers-reduced-motion. */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.style.scrollBehavior='auto';
  document.querySelectorAll('.btn.p,.btn.o').forEach(b=>{
    b.dataset.mag=b.classList.contains('sm')?'.2':'.32';
    if(!b.querySelector('.lb')){const s=document.createElement('span');s.className='lb';s.style.display='inline-block';s.style.transition='transform .6s cubic-bezier(.22,1,.36,1)';
      while(b.firstChild)s.appendChild(b.firstChild);b.appendChild(s)}
    b.style.transition=(b.style.transition?b.style.transition+',':'')+'transform .6s cubic-bezier(.22,1,.36,1)';
  });
  document.querySelectorAll('.it.rv,.bb.rv,.td.rv,.sv.rv').forEach(c=>{c.dataset.tilt='6';c.style.transformStyle='preserve-3d'});
  const css=document.createElement('style');
  css.textContent=`
  .fxbar{position:fixed;left:0;top:0;height:3px;width:100%;transform-origin:0 50%;transform:scaleX(0);z-index:999;background:currentColor;opacity:.85;pointer-events:none}
  .fx-h1 .w1{display:inline-block;opacity:0;transform:translateY(.45em) rotateX(-40deg);transform-origin:50% 100%;transition:opacity .7s,transform .9s cubic-bezier(.22,1,.36,1)}
  .fx-on .fx-h1 .w1{opacity:1;transform:none}
  [data-tilt]{transition:transform .6s cubic-bezier(.22,1,.36,1)}
  .fine [data-tilt]:hover{transition:transform .12s linear}
  @media(prefers-reduced-motion:reduce){.fx-h1 .w1{opacity:1;transform:none}.fxbar{display:none}}`;
  document.head.appendChild(css);
  /* progress line in the site's accent colour */
  const acc=getComputedStyle(document.documentElement).getPropertyValue('--acc')||getComputedStyle(document.querySelector('.btn.p')||document.body).backgroundColor;
  const bar=document.createElement('div');bar.className='fxbar';bar.style.color=acc.trim()||'#fff';document.body.appendChild(bar);
  addEventListener('scroll',()=>{const m=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${m>0?scrollY/m:0})`},{passive:true});
  /* hero headline: words rise in one after another */
  const h1=document.querySelector('h1');
  if(h1&&!reduce){h1.classList.add('fx-h1');let i=0;
    (function wrap(node){[...node.childNodes].forEach(n=>{if(n.nodeType===3){const parts=n.textContent.split(/(\s+)/);const frag=document.createDocumentFragment();
      parts.forEach(p=>{if(!p)return;if(/^\s+$/.test(p)){frag.appendChild(document.createTextNode(p));return}const s=document.createElement('span');s.className='w1';s.textContent=p;s.style.transitionDelay=(.08*i++ +.1)+'s';frag.appendChild(s)});
      n.replaceWith(frag)}else if(n.nodeType===1)wrap(n)})})(h1);
    requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.add('fx-on')))}
  /* count-up for plain numbers in the hero facts */
  if(!reduce)document.querySelectorAll('.meta b').forEach(b=>{const m=b.textContent.match(/^(\d+)(.*)$/);if(!m)return;const to=+m[1],suf=m[2];
    const t0=performance.now()+500;(function f(t){const k=Math.min(1,Math.max(0,(t-t0)/1200)),e=1-Math.pow(1-k,4);b.textContent=Math.round(to*e)+suf;if(k<1)requestAnimationFrame(f)})(t0)});
})();
