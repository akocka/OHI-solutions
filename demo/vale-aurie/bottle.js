// 3D wine bottle engine (three.js r160). Real geometry + PBR glass + canvas label, scroll-driven pose.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export const VARIETIES={
  red:{glass:0x16200f,glassOp:.95,wine:0x4a0612,foil:0x6e0f1f,paper:'#f3ead8',ink:'#3a0d14',accent:'#8c1a2b',name:'Fetească Neagră',short:'ROȘU',year:'2023'},
  white:{glass:0xdfe8cf,glassOp:.24,wine:0xd6aa3c,foil:0xc9a64a,paper:'#f6f1e3',ink:'#2d3a1f',accent:'#9a7a2a',name:'Fetească Regală',short:'ALB',year:'2024'},
  rose:{glass:0xf6e2dc,glassOp:.22,wine:0xe06a62,foil:0xd8a7a0,paper:'#fbf3ee',ink:'#5a2a2c',accent:'#c4626a',name:'Rosé de Mureș',short:'ROSÉ',year:'2024'}
};

function labelTexture(v,renderer){
  const W=1024,H=640,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  g.fillStyle=v.paper;g.fillRect(0,0,W,H);
  // paper grain
  for(let i=0;i<5000;i++){g.fillStyle=`rgba(80,60,30,${Math.random()*.05})`;g.fillRect(Math.random()*W,Math.random()*H,1.5,1.5)}
  const cx=W/2;
  g.strokeStyle=v.accent;g.lineWidth=3;g.strokeRect(cx-230,40,460,H-80);g.lineWidth=1;g.strokeRect(cx-220,50,440,H-100);
  // vine leaf emblem
  g.save();g.translate(cx,150);g.fillStyle=v.accent;
  for(let i=0;i<5;i++){g.save();g.rotate((i-2)*.45);g.beginPath();g.ellipse(0,-34,13,30,0,0,Math.PI*2);g.fill();g.restore()}
  g.beginPath();for(let r=0;r<3;r++)for(let k=0;k<=r;k++){g.moveTo(-r*11+k*22+8,18+r*19);g.arc(-r*11+k*22,18+r*19,9,0,Math.PI*2)}g.fillStyle=v.ink;g.fill();g.restore();
  g.textAlign='center';g.fillStyle=v.ink;
  g.font='600 26px Inter, Arial';g.letterSpacing='10px';g.fillText('CRAMA',cx,262);
  g.font='italic 400 76px Fraunces, Georgia, serif';g.letterSpacing='0px';g.fillText('Vale Aurie',cx,338);
  g.fillStyle=v.accent;g.fillRect(cx-60,362,120,3);
  g.fillStyle=v.ink;g.font='500 34px Fraunces, Georgia, serif';g.fillText(v.name,cx,418);
  g.font='600 22px Inter, Arial';g.letterSpacing='6px';g.fillText(v.short+' · SEC · '+v.year,cx,462);
  g.font='400 18px Inter, Arial';g.letterSpacing='3px';g.globalAlpha=.75;g.fillText('MUREȘ · ROMÂNIA · 750 ML',cx,540);g.globalAlpha=1;
  // back panel text on the far sides of the wrap
  g.textAlign='left';g.font='400 17px Inter, Arial';g.letterSpacing='0px';g.globalAlpha=.6;
  ['Cules manual. Fermentat lent.','Maturat cu răbdare, pentru','mesele lungi cu prieteni.'].forEach((t,i)=>g.fillText(t,40,250+i*28));
  g.textAlign='right';['A se servi la 12–16°C.','Concept demo · brand fictiv.'].forEach((t,i)=>g.fillText(t,W-40,250+i*28));g.globalAlpha=1;
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}

function profile(){ // Bordeaux bottle half-profile (x=radius,y=height), units ≈ cm/10
  const p=[[0,0],[.34,0],[.37,.02],[.38,.08],[.38,1.95],[.37,2.12],[.33,2.32],[.24,2.52],[.15,2.66],[.125,2.74],[.12,3.18],[.135,3.2],[.135,3.27],[.12,3.29],[0,3.29]];
  return p.map(([x,y])=>new THREE.Vector2(x,y));
}

export function createBottle(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(renderer),.04).texture;
  const cam=new THREE.PerspectiveCamera(30,1,.1,50);cam.position.set(0,.35,7.2);cam.lookAt(0,.05,0);
  const key=new THREE.DirectionalLight(0xfff1dc,2.2);key.position.set(3,5,4);scene.add(key);
  const rim=new THREE.DirectionalLight(0xffd7a8,1.6);rim.position.set(-4,3,-3);scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff,.25));

  const root=new THREE.Group();scene.add(root);const bottle=new THREE.Group();root.add(bottle);bottle.position.y=-1.64;
  const pts=profile();
  const glassMat=new THREE.MeshPhysicalMaterial({color:0x1d2a16,roughness:.06,metalness:0,clearcoat:1,clearcoatRoughness:.04,transparent:true,opacity:.92,ior:1.5,specularIntensity:1,envMapIntensity:1.4,side:THREE.FrontSide});
  const glass=new THREE.Mesh(new THREE.LatheGeometry(pts,96),glassMat);bottle.add(glass);
  // wine inside (slightly smaller, up to the shoulder)
  const wpts=pts.filter(v=>v.y<=1.9).map(v=>new THREE.Vector2(Math.max(0,v.x-.03),Math.max(.04,v.y)));wpts.push(new THREE.Vector2(.35,1.9),new THREE.Vector2(0,1.9));
  const wineMat=new THREE.MeshPhysicalMaterial({color:0x4a0612,roughness:.1,transparent:true,opacity:.62,envMapIntensity:.5,clearcoat:.6});
  const wine=new THREE.Mesh(new THREE.LatheGeometry(wpts,64),wineMat);wine.renderOrder=-1;bottle.add(wine);
  // foil capsule
  const foilMat=new THREE.MeshStandardMaterial({color:0x6e0f1f,metalness:.85,roughness:.32,envMapIntensity:1.2});
  const foil=new THREE.Mesh(new THREE.CylinderGeometry(.14,.128,.62,64,1,false),foilMat);foil.position.y=2.99;bottle.add(foil);
  const foilTop=new THREE.Mesh(new THREE.CircleGeometry(.14,48),foilMat);foilTop.rotation.x=-Math.PI/2;foilTop.position.y=3.301;bottle.add(foilTop);
  // label wrap (front label covers ~250°)
  const labelMat=new THREE.MeshStandardMaterial({roughness:.85,metalness:0,envMapIntensity:.5});
  const label=new THREE.Mesh(new THREE.CylinderGeometry(.386,.386,1.12,128,1,true,Math.PI*1.15,Math.PI*1.7),labelMat);label.position.y=1.05;bottle.add(label);
  // neck label
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.128,.13,.12,64,1,true),new THREE.MeshStandardMaterial({color:0xc9a64a,metalness:.7,roughness:.3}));neck.position.y=2.63;bottle.add(neck);
  // soft contact shadow
  const sc=document.createElement('canvas');sc.width=sc.height=256;const sg=sc.getContext('2d');const gr=sg.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');sg.fillStyle=gr;sg.fillRect(0,0,256,256);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.64;root.add(shadow);

  const labels={};function setVariety(k){const v=VARIETIES[k];labels[k]=labels[k]||labelTexture(v,renderer);labelMat.map=labels[k];labelMat.needsUpdate=true;
    tgt.glass.set(v.glass);tgt.wine.set(v.wine);tgt.foil.set(v.foil);tgt.op=v.glassOp}
  const tgt={glass:new THREE.Color(0x1d2a16),wine:new THREE.Color(0x4a0612),foil:new THREE.Color(0x6e0f1f),op:.92};

  // pose: driven from outside (x,y,scale,tilt) + spin; eased
  const pose={x:0,y:0,s:1,tilt:0,spin:0},cur={x:0,y:0,s:.6,tilt:0,spin:-1.2};let drag=0,dragV=0,auto=true;
  function size(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
    cam.position.z=w<700?8.6:7.2;cam.lookAt(0,.05,0)}
  size();addEventListener('resize',size);
  let last=performance.now(),running=true;const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(t){if(!running)return;const dt=Math.min(.05,(t-last)/1000);last=t;const k=1-Math.pow(.0015,dt);
    for(const p of ['x','y','s','tilt'])cur[p]+=(pose[p]-cur[p])*k;
    if(auto&&!reduce)pose.spin+=dt*.35;pose.spin+=dragV*dt;dragV*=Math.pow(.04,dt);cur.spin+=(pose.spin-cur.spin)*k;
    root.position.set(cur.x,cur.y+(reduce?0:Math.sin(t/1400)*.04),0);root.scale.setScalar(cur.s);bottle.rotation.y=cur.spin;root.rotation.z=cur.tilt;
    glassMat.color.lerp(tgt.glass,k*.6);wineMat.color.lerp(tgt.wine,k*.6);foilMat.color.lerp(tgt.foil,k*.6);glassMat.opacity+=(tgt.op-glassMat.opacity)*k*.6;
    wine.visible=glassMat.opacity<.85;renderer.render(scene,cam);requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{running=!document.hidden;if(running){last=performance.now();requestAnimationFrame(frame)}});
  return {setVariety,pose,spinBy:(r)=>{dragV+=r},setAuto:a=>auto=a,renderer};
}
