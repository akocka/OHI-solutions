/* OHI Ribbon — a ribbon of cards (video, image or canvas) sweeping through 3D space on scroll,
   then landing in a grid. One scroll number p (0..1, smoothed) drives everything.
   Usage: import {ribbon} from '/ribbon.js'; ribbon({track, canvas, cards:[{title, src, kind, href}], onP}) */
import * as THREE from './three.module.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const out = t => 1 - (1 - t) ** 3;
const span = (p, a, b) => clamp((p - a) / (b - a));

export function ribbon(cfg) {
  const {track, canvas, cards: list, onP = () => {}, nameEl = null, base = [.075, .075, .075], edgeTint = 1, gridZ = 8} = cfg;
  const stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  const FOV = 35, camera = new THREE.PerspectiveCamera(FOV, 1, .1, 100);

  /* ---------- rail ---------- */
  let PATH_L = 1; const SAMPLES = 1200, pathP = [], pathT = [];
  const PH0 = -1.5, PH1 = Math.PI * 2 + 1.35;
  function buildPath() {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160, ph = mix(PH0, PH1, t), cs = Math.cos(ph), u = 2 * t - 1;
      const depth = cs > 0 ? 7.6 + 16.4 * cs ** .9 : 7.6 + 2.2 * cs;
      const edge = .84 + .5 * span(.14 - t, 0, .14) + .8 * span(t, .84, 1);
      pts.push(new THREE.Vector3(edge * Math.sin(ph) * depth * .561, .5 * Math.sign(u) * Math.abs(u) ** 1.4 * depth * .63, -depth));
    }
    const path = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    path.arcLengthDivisions = 1500; PATH_L = path.getLength(); pathP.length = pathT.length = 0;
    for (let i = 0; i <= SAMPLES; i++) { const u = i / SAMPLES; pathP.push(path.getPointAt(u)); pathT.push(path.getTangentAt(u)); }
  }
  const at = (s, op, ot) => {
    const f = clamp(s / PATH_L) * SAMPLES, i = Math.min(SAMPLES - 1, Math.floor(f)), k = f - i;
    op.lerpVectors(pathP[i], pathP[i + 1], k); ot.lerpVectors(pathT[i], pathT[i + 1], k).normalize();
  };

  /* ---------- cards ---------- */
  const CARD_W = 2.1, CARD_H = 1.32, GAP = .03, STEP = CARD_W + GAP, NX = 28, NY = 3;
  const vs = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const fs = `uniform sampler2D map;uniform vec2 cover;uniform float aspect,ready,radius,edgeTint;uniform vec3 base;varying vec2 vUv;
  void main(){
    vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+radius;
    float d=length(max(q,0.))+min(max(q.x,q.y),0.)-radius;
    float px=fwidth(d),a=1.-smoothstep(-px,px,d);
    if(a<.01)discard;
    vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
    vec3 c=mix(base,texture2D(map,(uv-.5)*cover+.5).rgb,ready);
    float edge=smoothstep(-.012-px,-.012,d);
    gl_FragColor=vec4(mix(c,vec3(edgeTint),edge*.1),a);
  }`;
  const setCover = (mat, w, h) => { const va = w / h, ca = CARD_W / CARD_H; mat.uniforms.cover.value.set(va > ca ? ca / va : 1, va > ca ? 1 : va / ca); mat.uniforms.ready.value = 1; };
  const cards = list.map((it, i) => {
    let tex, v = null;
    const mat = new THREE.ShaderMaterial({vertexShader: vs, fragmentShader: fs, transparent: true, side: THREE.DoubleSide,
      uniforms: {map: {value: null}, cover: {value: new THREE.Vector2(1, 1)}, aspect: {value: CARD_W / CARD_H}, ready: {value: 0}, radius: {value: .018}, base: {value: new THREE.Vector3(...base)}, edgeTint: {value: edgeTint}}});
    if (it.kind === 'video') {
      v = document.createElement('video');
      Object.assign(v, {muted: true, loop: true, playsInline: true, preload: 'metadata', src: it.src});
      v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      tex = new THREE.VideoTexture(v);
      if (it.poster) {
        // show a still frame instantly, swap to the live video once it plays
        const pt = new THREE.TextureLoader().load(it.poster, t => { if (mat.uniforms.map.value === pt) setCover(mat, t.image.width, t.image.height); });
        pt.colorSpace = THREE.NoColorSpace; pt.minFilter = THREE.LinearFilter; pt.generateMipmaps = false;
        v.addEventListener('playing', () => { mat.uniforms.map.value = tex; setCover(mat, v.videoWidth, v.videoHeight); }, {once: true});
        tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
        tex = pt;
      } else v.addEventListener('loadeddata', () => setCover(mat, v.videoWidth, v.videoHeight));
    } else if (it.kind === 'canvas') {
      tex = new THREE.CanvasTexture(it.src); setCover(mat, it.src.width, it.src.height);
    } else {
      tex = new THREE.TextureLoader().load(it.src, t => setCover(mat, t.image.width, t.image.height));
    }
    tex.colorSpace = THREE.NoColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    mat.uniforms.map.value = tex;
    const geo = new THREE.PlaneGeometry(1, 1, NX, NY);
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh);
    return {i, title: it.title, href: it.href, v, geo, mesh, rect: null};
  });

  /* ---------- layout ---------- */
  let W = 1, H = 1, asp = 1, cols = 3, rows = 2, tanH = .3153;
  function resize() {
    W = stage.clientWidth || innerWidth; H = stage.clientHeight || innerHeight; asp = W / H;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W, H, false);
    camera.aspect = asp; camera.fov = asp < 16 / 9 ? Math.atan(.561 / asp) * 360 / Math.PI : FOV; camera.updateProjectionMatrix();
    tanH = Math.tan(camera.fov * Math.PI / 360);
    cols = asp < .9 ? 2 : 3; rows = asp < .9 ? 3 : 2;
    dirty = true;
  }
  let dirty = true;
  addEventListener('resize', resize); resize(); buildPath();
  function grid(i) {
    const vh = 2 * gridZ * tanH, vw = vh * asp, gw = vw * (cols === 3 ? .74 : .88), gap = gw * .017;
    const cw = (gw - gap * (cols - 1)) / cols, ch = cw / (CARD_W / CARD_H), gh = ch * rows + gap * 1.6 * (rows - 1);
    const c = i % cols, r = Math.floor(i / cols);
    return {x: -gw / 2 + cw / 2 + c * (cw + gap), y: gh / 2 - ch / 2 - r * (ch + gap * 1.6), w: cw, h: ch, vw, vh, c, r};
  }

  /* ---------- scroll ---------- */
  let target = 0, p = 0, visible = true;
  const readScroll = () => { const r = track.getBoundingClientRect(); const raw = clamp(-r.top / Math.max(1, track.offsetHeight - innerHeight)); target = clamp(raw + .42 * Math.sin(2 * Math.PI * raw) / (2 * Math.PI)); };
  addEventListener('scroll', readScroll, {passive: true}); readScroll(); p = target;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, {rootMargin: '200px'}).observe(track);

  /* ---------- poses ---------- */
  const op = new THREE.Vector3(), ot = new THREE.Vector3(), up = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), vp = new THREE.Vector3();
  function poseRibbon(c, head) {
    const pos = c.geo.attributes.position, centre = head - c.i * STEP;
    for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
      const k = iy * (NX + 1) + ix, lu = ix / NX - .5, lv = .5 - iy / NY;
      at(centre + lu * CARD_W, op, ot);
      up.copy(Y).addScaledVector(ot, -Y.dot(ot)).normalize();
      vp.copy(op).addScaledVector(up, lv * CARD_H);
      pos.setXYZ(k, vp.x, vp.y, vp.z);
    }
    pos.needsUpdate = true;
  }
  function poseGrid(c, q) {
    const g = grid(c.i), pos = c.geo.attributes.position;
    const dx = (g.c - (cols - 1) / 2) * 1.2, dy = g.r < rows / 2 ? 1 : -1;
    const ox = dx * g.vw * .62 * (1 - q), oy = dy * g.vh * (g.c === 1 ? .95 : .34) * (1 - q), tilt = (1 - q) * .22 * (g.c - 1 || .5) * dy;
    const cs = Math.cos(tilt), sn = Math.sin(tilt);
    for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) {
      const k = iy * (NX + 1) + ix, x = (ix / NX - .5) * g.w, y = (.5 - iy / NY) * g.h;
      pos.setXYZ(k, g.x + ox + x * cs - y * sn, g.y + oy + x * sn + y * cs, -gridZ - (1 - q) * .6 * Math.sin(ix / NX * Math.PI));
    }
    pos.needsUpdate = true; c.rect = g;
  }
  const RIB_A = .14, RIB_B = .63;
  function render() {
    onP(p);
    const pr = span(p, RIB_A, RIB_B), head = mix(0, PATH_L + cards.length * STEP, pr);
    for (const c of cards) {
      const s = head - c.i * STEP, end = PATH_L - CARD_W;
      if (s < end) { c.mesh.visible = s > CARD_W; c.rect = null; if (c.mesh.visible) poseRibbon(c, head); }
      else if (c.i < cols * rows) {
        const st = mix(RIB_A, RIB_B, (end + c.i * STEP) / (PATH_L + cards.length * STEP)), q = out(span(p, st, st + .13));
        c.mesh.visible = q > .001; if (c.mesh.visible) poseGrid(c, q);
      } else { c.mesh.visible = false; c.rect = null; }
    }
    renderer.render(scene, camera);
  }

  /* ---------- hover + click on the grid ---------- */
  const hitTest = e => {
    if (p < .86) return null; const r = stage.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / W - .5), ny = (.5 - (e.clientY - r.top) / H); let hit = null;
    for (const c of cards) { const g = c.rect; if (!g) continue; const x = nx * g.vw, y = ny * g.vh; if (Math.abs(x - g.x) < g.w / 2 && Math.abs(y - g.y) < g.h / 2) hit = c; }
    return hit;
  };
  stage.addEventListener('pointermove', e => {
    const hit = hitTest(e); stage.style.cursor = hit && hit.href ? 'pointer' : '';
    if (!nameEl) return; nameEl.style.opacity = hit ? 1 : 0;
    if (hit) { nameEl.textContent = hit.title; const r = stage.getBoundingClientRect(); nameEl.style.transform = `translate(${e.clientX - r.left + 14}px,${e.clientY - r.top + 16}px)`; }
  });
  stage.addEventListener('click', e => { const hit = hitTest(e); if (hit && hit.href) { const u = new URL(hit.href, location.href); if (u.origin === location.origin) location.href = u.href; else window.open(u.href, '_blank', 'noopener'); } });

  /* ---------- loop ---------- */
  let last = -1;
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) { cards.forEach(c => c.v && !c.v.paused && c.v.pause()); return; }
    p += (target - p) * .09; if (Math.abs(target - p) < .00005) p = target;
    for (const c of cards) if (c.v) { if (c.mesh.visible && c.v.paused) c.v.play().catch(() => {}); else if (!c.mesh.visible && !c.v.paused) c.v.pause(); }
    if (p !== last || dirty || cards.some(c => c.v && c.mesh.visible)) { render(); last = p; dirty = false; }
  })();
  return {cards};
}
