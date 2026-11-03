// Hero A: a night valley of glowing points that drifts toward you.
// Original OHI build on three.js (MIT, /vendor/three). Mouse pushes the lights away, the arrow calms the valley.
import * as THREE from '/vendor/three/three.module.js';

const host = document.getElementById('valea');
const mount = document.getElementById('vaCv');
const ui = document.getElementById('vaUi');
const loader = document.getElementById('vaLoad');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  host.classList.add('va-nogl'); loader.classList.add('gone'); ui.classList.add('on');
  throw e;
}
const PR = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 1.75);
renderer.setPixelRatio(PR);
renderer.setClearColor(0x000000, 1);
mount.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
camera.position.set(0, 0.55, 0);

const L = 90;                       // length of the valley loop
const N = coarse ? 7000 : 15000;     // lights on the ground
const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

// ground lights
const pos = new Float32Array(N * 3), seed = new Float32Array(N), kind = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const u = rnd(), side = (rnd() - 0.5) * 2;
  pos[i * 3] = side * Math.abs(side) * 30;          // denser in the middle of the valley
  pos[i * 3 + 1] = 0;
  pos[i * 3 + 2] = rnd() * L;
  seed[i] = u;
  const k = rnd();
  kind[i] = k < 0.58 ? 0 : k < 0.9 ? 1 : 2;        // 0 cobalt flower, 1 small speck, 2 amber flower
}
const g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));

const uni = {
  uTime: { value: 0 }, uTravel: { value: 0 }, uL: { value: L }, uDisp: { value: 0 },
  uMouse: { value: new THREE.Vector2(9, 9) }, uOn: { value: 0 }, uAsp: { value: 1 },
  uPx: { value: 800 }, uC1: { value: new THREE.Color('#FFB8D6') }, uC2: { value: new THREE.Color('#F5EFE2') },
  uC3: { value: new THREE.Color('#C8B6FF') }
};

const TERR = `
float terr(vec2 p){
  return .85*sin(p.x*.17+1.3)*cos(p.y*.12) + .55*sin(p.x*.065+p.y*.05) + pow(abs(p.x)/12.,2.)*1.5;
}`;

const mat = new THREE.ShaderMaterial({
  uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `
    uniform float uTime,uTravel,uL,uDisp,uOn,uAsp,uPx; uniform vec2 uMouse;
    attribute float aSeed; attribute float aKind;
    varying float vKind,vSeed,vGlow,vFade,vBloom;
    ${TERR}
    void main(){
      vec3 p=position;
      float wz=p.z+uTravel;
      p.z=-uL+mod(wz,uL)+2.5;
      p.y=terr(vec2(p.x,wz))-1.25+(aKind>.5&&aKind<1.5?.02:.1+aSeed*.22);
      p.x+=sin(uTime*.7+aSeed*40.)*.05;
      float d=uDisp*(.6+.4*aSeed);
      p.y+=d*(1.2+aSeed*3.5)+d*.35*sin(uTime*.9+aSeed*30.);
      p.x+=d*sin(aSeed*91.)*1.8;
      vec4 mv=modelViewMatrix*vec4(p,1.);
      vec4 cp=projectionMatrix*mv;
      vec2 n=cp.xy/cp.w, dv=n-uMouse; dv.x*=uAsp;
      float r=length(dv);
      vec2 dir=r>1e-4?dv/r:vec2(0.); dir.x/=uAsp;
      n+=dir*uOn*exp(-r*r*14.)*.09;
      cp.xy=n*cp.w;
      gl_Position=cp;
      float z=-mv.z;
      vBloom=smoothstep(26.,5.,z);
      vFade=smoothstep(uL-2.,uL*.5,z)*smoothstep(.4,2.2,z)*(.55+.45*smoothstep(60.,20.,z));
      vGlow=uOn*exp(-r*r*26.);
      float s=aKind<.5?(.08+.15*vBloom):aKind<1.5?.06:(.09+.17*vBloom);
      s*=1.+smoothstep(20.,70.,z)*1.2;
      s*=(.7+aSeed*.6)*(1.+vGlow*.9+uDisp*.25);
      gl_PointSize=s*uPx/z;
      vKind=aKind; vSeed=aSeed;
    }`,
  fragmentShader: `
    uniform vec3 uC1,uC2,uC3; uniform float uTime;
    varying float vKind,vSeed,vGlow,vFade,vBloom;
    void main(){
      vec2 q=gl_PointCoord-.5; float r=length(q); float a; vec3 c;
      if(vKind>.5&&vKind<1.5){
        a=smoothstep(.5,.0,r)*.42; c=vec3(.42,.62,.46);
      }else{
        float ang=atan(q.y,q.x);
        float open=mix(.5,1.,vBloom);
        float pet=(.2+.11*cos(ang*5.+vSeed*6.283))*open+.06;
        float shape=1.-smoothstep(pet-.1,pet+.02,r);
        float core=1.-smoothstep(.0,.09,r);
        float hr=1.-smoothstep(.0,.5,r); float halo=hr*hr*.42;
        a=max(shape*.8,core)+halo;
        c=vKind<.5?mix(uC1,uC2,vSeed):uC3;
        c=mix(c,vec3(1.),core*.55);
      }
      float tw=.8+.2*sin(uTime*1.7+vSeed*60.);
      a*=vFade*tw;
      c+=vGlow*vec3(.9,.85,.8);
      a=min(1.,a*(1.+vGlow*1.4));
      if(a<.004)discard;
      gl_FragColor=vec4(c*a,a);
    }`
});
const field = new THREE.Points(g, mat);
field.frustumCulled = false;
scene.add(field);

// floating dust above the valley
const DN = coarse ? 160 : 320, dpos = new Float32Array(DN * 3), dseed = new Float32Array(DN);
for (let i = 0; i < DN; i++) { dpos[i * 3] = (rnd() - .5) * 26; dpos[i * 3 + 1] = rnd() * 4 - .6; dpos[i * 3 + 2] = rnd() * 40; dseed[i] = rnd(); }
const dg = new THREE.BufferGeometry();
dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
dg.setAttribute('aSeed', new THREE.BufferAttribute(dseed, 1));
const dust = new THREE.Points(dg, new THREE.ShaderMaterial({
  uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `uniform float uTime,uTravel,uPx,uDisp; attribute float aSeed; varying float vA;
    void main(){ vec3 p=position; float wz=p.z+uTravel*.6; p.z=-40.+mod(wz,40.)+1.;
      p.y+=sin(uTime*.3+aSeed*20.)*.25+uDisp*aSeed; p.x+=cos(uTime*.2+aSeed*14.)*.3;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; float z=-mv.z;
      vA=smoothstep(40.,14.,z)*smoothstep(.5,3.,z)*(.35+.65*aSeed); gl_PointSize=(.03+.05*aSeed)*uPx/z; }`,
  fragmentShader: `varying float vA; void main(){ float r=length(gl_PointCoord-.5); float a=(1.-smoothstep(.0,.5,r))*vA*.7; if(a<.004)discard; gl_FragColor=vec4(vec3(1.,.95,.86)*a,a); }`
}));
dust.frustumCulled = false;
scene.add(dust);

// size, visibility, input
let W = 1, H = 1, visible = true, running = false;
function size() {
  W = host.clientWidth; H = host.clientHeight;
  renderer.setSize(W, H, false);
  camera.aspect = W / H; camera.fov = W < H ? 68 : 55; camera.updateProjectionMatrix();
  uni.uAsp.value = W / H;
  uni.uPx.value = H * PR * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
}
addEventListener('resize', size);
size();

const mouse = { x: 9, y: 9, tx: 9, ty: 9, on: 0, ton: 0 };
if (!coarse) {
  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width * 2 - 1; mouse.ty = 1 - (e.clientY - r.top) / r.height * 2; mouse.ton = 1;
    if (mouse.x > 5) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
  });
  host.addEventListener('pointerleave', () => { mouse.ton = 0; });
}

let disp = 0, tdisp = 0, speed = 1.1, travel = 0, lastY = scrollY, boost = 0;
const go = document.getElementById('vaGo');
if (go && !coarse) {
  go.addEventListener('pointerenter', () => { tdisp = 1; host.classList.add('hush'); });
  go.addEventListener('pointerleave', () => { tdisp = 0; host.classList.remove('hush'); });
}
addEventListener('scroll', () => { const y = scrollY; if (y < H * 1.2) boost += Math.min(30, Math.abs(y - lastY)) * 0.02; lastY = y; }, { passive: true });

new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(host);
document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });

let prev = performance.now(), first = true;
function frame(now) {
  if (!visible || document.hidden) { running = false; return; }
  const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
  disp += (tdisp - disp) * (1 - Math.exp(-dt * 3));
  boost *= Math.exp(-dt * 2.2);
  const v = calm ? 0 : (speed + boost) * (1 - disp * 0.96);
  travel += v * dt;
  mouse.x += (mouse.tx - mouse.x) * 0.12; mouse.y += (mouse.ty - mouse.y) * 0.12;
  mouse.on += (mouse.ton - mouse.on) * 0.06;
  uni.uTime.value = now / 1000; uni.uTravel.value = travel; uni.uDisp.value = disp;
  uni.uMouse.value.set(mouse.x, mouse.y); uni.uOn.value = mouse.on;
  const mx = mouse.ton ? mouse.x : 0, my = mouse.ton ? mouse.y : 0;
  camera.rotation.set(-0.12 + my * 0.035, -mx * 0.05, 0);
  host.style.setProperty('--va-speed', Math.min(1, boost * 0.35).toFixed(3));
  renderer.render(scene, camera);
  if (first) { first = false; loader.classList.add('gone'); setTimeout(() => ui.classList.add('on'), calm ? 0 : 450); }
  if (calm) { running = false; return; }
  requestAnimationFrame(frame);
}
function start() { if (running) return; running = true; prev = performance.now(); requestAnimationFrame(frame); }
start();

// optional ambient sound: soft brown noise through a slow low-pass, off until pressed
const sound = document.getElementById('vaSound');
let ctx, gain;
sound && sound.addEventListener('click', () => {
  const on = sound.getAttribute('aria-pressed') !== 'true';
  sound.setAttribute('aria-pressed', String(on));
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)(); gain = ctx.createGain(); gain.gain.value = 0;
    const b = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } }
    const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = 200; lfo.connect(lg).connect(lp.frequency);
    src.connect(lp).connect(gain).connect(ctx.destination); src.start(); lfo.start();
  }
  ctx.resume(); gain.gain.setTargetAtTime(on ? .3 : 0, ctx.currentTime, .5);
});
