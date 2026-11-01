import {ribbon} from '/ribbon.js';
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),span=(p,a,b)=>clamp((p-a)/(b-a));
document.querySelectorAll('.rbsec').forEach(sec=>{
  const cards=[...sec.querySelector('template.rsrc').content.querySelectorAll('a')].map(a=>({title:a.dataset.title,href:a.getAttribute('href'),kind:'video',src:a.dataset.video,poster:a.dataset.poster}));
  const head=sec.querySelector('.rhead'),hint=sec.querySelector('.rhint');
  ribbon({track:sec.querySelector('.rtrack'),canvas:sec.querySelector('canvas'),nameEl:sec.querySelector('.rname'),base:[.08,.09,.13],speed:+sec.dataset.speed||1.15,cards,
    onP(p){const f=span(p,.42,.6);head.style.opacity=1-f;head.style.transform=`translateY(${-f*40}px)`;hint.style.opacity=span(p,.84,.92)}});
});
