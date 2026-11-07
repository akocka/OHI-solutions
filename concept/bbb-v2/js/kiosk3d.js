/* Big Big Boon concept: cinematic 3D hero. Model = BBB's premium kiosk, textured from their own photos.
   Scroll progress of #film drives: assembled at dusk -> explodes -> rebuilds layer by layer -> camera tours details -> night. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
const sec = document.getElementById('film'), cvs = document.getElementById('k3'), stage = cvs.parentElement;
const fail = (e) => { if (e) console.warn('3D fallback', e); document.documentElement.classList.add('nogl'); };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
main().catch(fail);
async function main() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return fail(e); }
  const mobile = innerWidth < 900;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.3 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const BG_DAY = new THREE.Color('#1c2621'), BG_NIGHT = new THREE.Color('#0c1210');
  scene.background = BG_DAY.clone();
  scene.fog = new THREE.Fog(scene.background, 14, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight(0xe4e9f0, 0x2b2520, 0.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.4);
  sun.position.set(-5, 9, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 4096, mobile ? 1024 : 4096);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 4;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xbfd2ff, 0.7); rim.position.set(6, 5, -6); scene.add(rim);

  /* ---------- textures (cut from Big Big Boon's own photos) ---------- */
  const TL = new THREE.TextureLoader();
  const load = (src) => TL.loadAsync(src);
  let T;
  try {
    const [seam, planks, pine, slat] = await Promise.all(['/concept/bbb-v2/img/tex-0.jpg', '/concept/bbb-v2/img/tex-1.jpg', '/concept/bbb-v2/img/tex-2.jpg', '/concept/bbb-v2/img/tex-3.jpg'].map(load));
    T = { seam, planks, pine, slat };
  } catch (e) { return fail(e); }
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const rep = (base, rx, ry, mirror = true) => {
    const t = base.clone();
    t.wrapS = t.wrapT = mirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
    t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, maxAniso); t.needsUpdate = true;
    return t;
  };
  // real-world scale of each photo texture (metres covered by one tile)
  const SC = { seam: [0.5, 2.3], planks: [2.8, 0.74], pine: [0.45, 0.8], slat: [0.26, 1.2] };
  const mat = (kind, w, h, o = {}) => new THREE.MeshStandardMaterial({
    map: rep(T[kind], w / SC[kind][0], h / SC[kind][1], kind !== 'seam'),
    roughness: o.r ?? 0.62, metalness: o.m ?? 0, envMapIntensity: o.env ?? 0.8, color: o.c ?? 0xffffff
  });
  const plain = (c, r = 0.6, m = 0, env = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, envMapIntensity: env });

  // noise texture for mineral wool insulation
  const wool = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#cdb97c'; g.fillRect(0, 0, 128, 128);
    let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '120,100,50' : '240,225,170'},${0.15 + rnd() * 0.25})`; g.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 3, 1 + rnd() * 2); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();

  /* ---------- dimensions (metres, from the premium kiosk photos) ---------- */
  const W = 3.0, D = 2.2, H = 2.3, y0 = 0.14, yt = y0 + H, t = 0.06, PEAK = 0.95, pitch = PEAK / (W / 2);
  const kiosk = new THREE.Group(); scene.add(kiosk);
  const parts = [];
  const box = (w, h, d, m, x, y, z) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.position.set(x, y, z); return g; };
  const beam = (ax, ay, bx, by, th, dz, z, m) => {
    const len = Math.hypot(bx - ax, by - ay);
    const g = new THREE.Mesh(new THREE.BoxGeometry(len, th, dz), m);
    g.position.set((ax + bx) / 2, (ay + by) / 2, z); g.rotation.z = Math.atan2(by - ay, bx - ax); return g;
  };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const part = (name, dir, dist, meshes, spin = 1) => {
    const g = new THREE.Group(); g.name = name;
    const bb = new THREE.Box3(); meshes.forEach(m => { m.updateMatrixWorld(); bb.expandByObject(m); });
    const c = bb.getCenter(new THREE.Vector3());
    meshes.forEach(m => { m.position.sub(c); m.castShadow = true; m.receiveShadow = true; g.add(m); });
    g.position.copy(c);
    const size = bb.getSize(new THREE.Vector3()).length();
    g.userData = {
      base: c.clone(), dir: new THREE.Vector3(...dir).normalize(), dist, size, h: bb.getSize(new THREE.Vector3()).y,
      rand: 0.8 + rnd() * 0.4, spin: (rnd() * 2 - 1) * 0.35 * spin, ax: rnd(), ay: rnd() * 0.5, az: rnd()
    };
    kiosk.add(g); parts.push(g); return g;
  };

  /* materials (two finishes) */
  const M = {
    base: plain(0x2a2d31, 0.55, 0.5),
    frame: mat('pine', 0.1, 2.3, { r: 0.7 }),
    wool: new THREE.MeshStandardMaterial({ map: wool, roughness: 0.95 }),
    pineIn: mat('pine', 3, 2.3, { r: 0.55, env: 0.6 }),
    roof: plain(0x24272c, 0.5, 0.5, 0.7),
    black: plain(0x15171a, 0.55, 0.35),
    wood: (w, h) => mat('planks', w, h, { r: 0.58 }),
    seam: (w, h) => mat('seam', w, h, { r: 0.5, m: 0.35, env: 1 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xcfe2ee, roughness: 0.03, metalness: 0.2, transparent: true, opacity: 0.07, envMapIntensity: 1.1, depthWrite: false }),
    lampOn: new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffc27a, emissiveIntensity: 0 })
  };
  const finishable = []; // {mesh, black, wood}
  const fin = (mesh, black, wood) => { finishable.push({ mesh, black, wood }); return mesh; };

  /* base */
  part('base', [0, -1, 0], 0.7, [box(W + 0.14, y0, D + 0.14, M.base, 0, y0 / 2, 0)], 0.2);

  /* frame (stays as the core) */
  const fr = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fr.push(box(0.1, H, 0.1, M.frame, sx * (W / 2 - 0.12), y0 + H / 2, sz * (D / 2 - 0.12)));
  for (const sx of [-1, 1]) fr.push(box(0.09, H, 0.09, M.frame, sx * 1.05, y0 + H / 2, D / 2 - 0.12));
  for (const yy of [y0 + 0.05, yt - 0.05]) {
    fr.push(box(W - 0.2, 0.1, 0.1, M.frame, 0, yy, D / 2 - 0.12), box(W - 0.2, 0.1, 0.1, M.frame, 0, yy, -D / 2 + 0.12));
    fr.push(box(0.1, 0.1, D - 0.2, M.frame, -W / 2 + 0.12, yy, 0), box(0.1, 0.1, D - 0.2, M.frame, W / 2 - 0.12, yy, 0));
  }
  part('frame', [0, 1, 0], 0, fr, 0);

  /* interior pine lining (stays) */
  const inner = [];
  const pl = (w, h, m, x, y, z, ry = 0, rx = 0) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); g.position.set(x, y, z); g.rotation.set(rx, ry, 0); return g; };
  inner.push(pl(W - 0.3, H - 0.02, M.pineIn, 0, y0 + H / 2, -D / 2 + 0.18));
  inner.push(pl(D - 0.36, H - 0.02, M.pineIn, -W / 2 + 0.18, y0 + H / 2, 0, Math.PI / 2));
  inner.push(pl(D - 0.36, H - 0.02, M.pineIn, W / 2 - 0.18, y0 + H / 2, 0, -Math.PI / 2));
  inner.push(pl(W - 0.3, D - 0.36, M.pineIn, 0, yt - 0.02, 0, 0, Math.PI / 2));
  inner.push(pl(W - 0.3, D - 0.36, mat('planks', W, D, { r: 0.7, c: 0x9a8d80 }), 0, y0 + 0.01, 0, 0, -Math.PI / 2));
  const dl = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe0b0, emissiveIntensity: 0 });
  for (const x of [-0.8, 0, 0.8]) inner.push(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 20), dl)), inner.at(-1).position.set(x, yt - 0.03, 0.45);
  part('interior', [0, 1, 0], 0, inner, 0);

  /* insulation panels */
  const ins = (w, h, d, x, y, z, dir) => part('insulation', dir, 0.55, [box(w, h, d, M.wool, x, y, z)], 0.4);
  ins(W - 0.3, H - 0.25, 0.06, 0, y0 + H / 2, -D / 2 + 0.09, [0, 0, -1]);
  ins(0.06, H - 0.25, D - 0.3, -W / 2 + 0.09, y0 + H / 2, 0, [-1, 0, 0]);
  ins(0.06, H - 0.25, D - 0.3, W / 2 - 0.09, y0 + H / 2, 0, [1, 0, 0]);
  ins(2.1, 0.75, 0.06, 0, y0 + 0.45, D / 2 - 0.09, [0, -0.3, 1]);

  /* cladding: front wall with the serving window */
  const shape = new THREE.Shape(); shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H); shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const hole = new THREE.Path(); hole.moveTo(-1.0, 0.95); hole.lineTo(-1.0, 1.95); hole.lineTo(1.0, 1.95); hole.lineTo(1.0, 0.95); hole.lineTo(-1.0, 0.95); shape.holes.push(hole);
  const fg = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  const fBlack = M.seam(1, 1); fBlack.map.repeat.set(1 / SC.seam[0], 1 / SC.seam[1]);
  const fWood = M.wood(1, 1); fWood.map.repeat.set(1 / SC.planks[0], 1 / SC.planks[1]);
  const front = fin(new THREE.Mesh(fg, fBlack), fBlack, fWood); front.position.set(0, y0, D / 2 - t);
  part('front wall', [0, 0, 1], 1.25, [front]);

  const back = fin(box(W, H, t, M.seam(W, H), 0, y0 + H / 2, -D / 2 + t / 2), null, M.wood(W, H)); back.userData.f = 1;
  finishable.at(-1).black = back.material;
  part('back wall', [0, 0, -1], 1.3, [back]);
  for (const sx of [-1, 1]) {
    const sb = M.seam(D, H), sw = M.wood(D, H);
    const side = fin(box(t, H, D, sb, sx * (W / 2 - t / 2), y0 + H / 2, 0), sb, sw);
    part(sx < 0 ? 'left wall' : 'right wall', [sx, 0, 0], 1.35, [side]);
  }

  /* wooden slat pillars + wall lamps (premium finish only) */
  const premiumOnly = [];
  for (const sx of [-1, 1]) {
    const s = box(0.24, H - 0.02, 0.05, mat('slat', 0.24, H, { r: 0.6 }), sx * 1.25, y0 + H / 2, D / 2 + 0.025);
    premiumOnly.push(part('slats', [sx * 0.7, 0, 1], 1.55, [s], 0.6));
  }
  const glows = [], eaveGlows = [];
  const gtex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 64, 2, 32, 64, 62); r.addColorStop(0, 'rgba(255,214,150,1)'); r.addColorStop(0.35, 'rgba(255,180,95,.45)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 128); return new THREE.CanvasTexture(c); })();
  for (const sx of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 24), M.black);
    lamp.position.set(sx * 1.25, y0 + 1.55, D / 2 + 0.1);
    const capT = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.01, 20), M.lampOn); capT.position.set(sx * 1.25, y0 + 1.66, D / 2 + 0.1);
    const capB = capT.clone(); capB.position.y = y0 + 1.44;
    const g = part('lamps', [sx, 0.2, 1], 1.8, [lamp, capT, capB], 1.4);
    for (const dy of [0.45, -0.45]) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      sp.scale.set(0.42, 0.95, 1); sp.position.set(0, dy, -0.03); g.add(sp); glows.push(sp);
    }
    premiumOnly.push(g);
  }

  /* serving window: black frame + two sliding glass panes */
  const wf = [box(2.06, 0.05, 0.08, M.black, 0, y0 + 1.95, D / 2 + 0.02), box(2.06, 0.05, 0.08, M.black, 0, y0 + 0.95, D / 2 + 0.02),
    box(0.05, 1.05, 0.08, M.black, -1.03, y0 + 1.45, D / 2 + 0.02), box(0.05, 1.05, 0.08, M.black, 1.03, y0 + 1.45, D / 2 + 0.02), box(0.035, 0.98, 0.06, M.black, 0, y0 + 1.45, D / 2 + 0.03)];
  part('window frame', [0, 0.1, 1], 1.7, wf, 0.5);
  const gl = [];
  for (const [x, z] of [[-0.5, D / 2 + 0.005], [0.5, D / 2 + 0.035]]) { const g = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.96), M.glass); g.position.set(x, y0 + 1.45, z); gl.push(g); }
  const glassPart = part('glass', [0, 0.15, 1], 2.0, gl, 0.5); glassPart.children.forEach(m => { m.castShadow = false; });

  /* wooden counter */
  part('counter', [0, -0.25, 1], 2.1, [box(2.34, 0.075, 0.44, M.wood(2.34, 0.44), 0, y0 + 0.92, D / 2 + 0.2), box(2.34, 0.11, 0.04, M.wood(2.34, 0.11), 0, y0 + 0.86, D / 2 + 0.41)], 0.5);

  /* gable triangle */
  const tri = new THREE.Shape(); tri.moveTo(-W / 2, 0); tri.lineTo(W / 2, 0); tri.lineTo(0, PEAK); tri.lineTo(-W / 2, 0);
  const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false });
  const gBlack = plain(0x1c1f23, 0.6, 0.3); const gWood = M.wood(1, 1); gWood.map.repeat.set(1 / SC.planks[0], 1 / SC.planks[1]);
  const gable = fin(new THREE.Mesh(tg, gBlack), gBlack, gWood); gable.position.set(0, yt, D / 2 - 0.04);
  const gableB = fin(new THREE.Mesh(tg, gBlack), gBlack, gWood); gableB.position.set(0, yt, -D / 2);
  part('gable', [0, 0.35, 1], 1.45, [gable]); part('gable', [0, 0.35, -1], 1.45, [gableB]);

  /* exposed timber truss + fascia rafters */
  const tw = M.wood(3.6, 0.2);
  const ex = W / 2 + 0.38, ey = yt + PEAK - ex * pitch;
  const truss = [box(3.4, 0.16, 0.14, tw, 0, yt + 0.02, D / 2 + 0.07), box(0.12, 0.74, 0.12, tw, 0, yt + 0.47, D / 2 + 0.07),
    beam(0, yt + 0.5, -0.78, yt + 0.1, 0.11, 0.11, D / 2 + 0.07, tw), beam(0, yt + 0.5, 0.78, yt + 0.1, 0.11, 0.11, D / 2 + 0.07, tw),
    beam(-ex, ey - 0.13, 0, yt + PEAK - 0.07, 0.15, 0.12, D / 2 + 0.24, tw), beam(ex, ey - 0.13, 0, yt + PEAK - 0.07, 0.15, 0.12, D / 2 + 0.24, tw)];
  part('truss', [0, 0.55, 1], 1.9, truss, 0.7);

  /* roof: two metal planes + wooden soffit + ridge */
  const rl = Math.hypot(ex, ex * pitch) + 0.02, ang = Math.atan(pitch), RD = D + 0.6;
  for (const sx of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(rl, 0.07, RD), M.roof);
    r.position.set(sx * ex / 2, yt + PEAK - (ex / 2) * pitch + 0.06, 0.08); r.rotation.z = -sx * ang;
    part('roof', [sx * 0.55, 1, 0], 1.6, [r], 0.5);
    const so = new THREE.Mesh(new THREE.BoxGeometry(rl - 0.05, 0.02, RD - 0.04), M.wood(rl, RD));
    so.position.set(sx * ex / 2, yt + PEAK - (ex / 2) * pitch - 0.0, 0.08); so.rotation.z = -sx * ang;
    part('soffit', [sx * 0.4, 1, 0], 1.15, [so], 0.4);
  }
  part('ridge', [0, 1, 0], 2.3, [box(0.2, 0.07, RD + 0.02, M.roof, 0, yt + PEAK + 0.11, 0.08)], 0.6);

  /* ground + warm light pool */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ color: 0x18201c, roughness: 0.92, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, 'rgba(255,190,110,.9)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.5), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.012, D / 2 + 1.1); scene.add(pool);

  /* interior light */
  const inLight = new THREE.PointLight(0xffc98a, 0, 4.5, 1.6); inLight.position.set(0, yt - 0.4, 0.2); scene.add(inLight);

  /* LED downlights under both eaves (ride with the soffit boards) */
  parts.filter(g => g.name === 'soffit').forEach((g, i) => {
    const sx = i === 0 ? -1 : 1, x = sx * (ex - 0.28), y = yt + PEAK - (ex - 0.28) * pitch - 0.035;
    for (const z of [-0.85, 0, 0.85]) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 16), dl);
      d.position.set(x - g.position.x, y - g.position.y, z + 0.08 - g.position.z); g.add(d);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      sp.scale.set(0.5, 0.9, 1); sp.position.set(d.position.x - sx * 0.08, d.position.y - 0.45, d.position.z); g.add(sp); eaveGlows.push(sp);
    }
  });

  /* market string lights (appear in the last stage) */
  const festoon = new THREE.Group(); scene.add(festoon);
  const wireM = plain(0x111214, 0.6, 0.2), poleM = plain(0x1b1d20, 0.5, 0.4);
  const bulbM = new THREE.MeshStandardMaterial({ color: 0xffe2b5, emissive: 0xffbd70, emissiveIntensity: 0 });
  const bulbGlows = [];
  const P4 = [[-4.4, 3.5], [4.4, 3.5], [4.6, -3.4], [-4.6, -3.4]];
  P4.forEach(([x, z]) => { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.7, 12), poleM); pole.position.set(x, 1.85, z); pole.castShadow = true; festoon.add(pole); });
  const string = (a, b, sag) => {
    const A = new THREE.Vector3(a[0], 3.62, a[1]), Bv = new THREE.Vector3(b[0], 3.62, b[1]);
    const mid = A.clone().lerp(Bv, 0.5); mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, Bv);
    festoon.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.008, 5, false), wireM));
    const n = Math.round(A.distanceTo(Bv) / 0.5);
    for (let i = 1; i < n; i++) {
      const pt = curve.getPoint(i / n);
      const bl = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), bulbM); bl.position.copy(pt).y -= 0.06; festoon.add(bl);
      const gs = new THREE.Sprite(new THREE.SpriteMaterial({ map: poolTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      gs.scale.set(0.26, 0.26, 1); gs.position.copy(bl.position); festoon.add(gs); bulbGlows.push(gs);
    }
  };
  string(P4[3], P4[2], 0.5); string(P4[0], P4[3], 0.6); string(P4[1], P4[2], 0.6); string(P4[3], P4[1], 0.9);
  festoon.visible = false;

  /* size factor: small parts fly further */

  /* ---------- extra detail, so it reads like the real product ---------- */
  const steelM = plain(0xc9ccd0, 0.28, 1, 1.2), trimM = plain(0x111315, 0.45, 0.6, 0.9), rubber = plain(0x0a0a0a, 0.9, 0);
  // corner flashings (L-profiles on the four vertical corners) + top/bottom drip trims
  const trims = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    trims.push(box(0.07, H + 0.02, 0.012, trimM, sx * (W / 2 + 0.006), y0 + H / 2, sz * (D / 2 + 0.002) - sz * 0.03));
    trims.push(box(0.012, H + 0.02, 0.07, trimM, sx * (W / 2 + 0.002) - sx * 0.03, y0 + H / 2, sz * (D / 2 + 0.006)));
  }
  trims.push(box(W + 0.04, 0.05, 0.02, trimM, 0, y0 + 0.02, D / 2 + 0.012), box(W + 0.04, 0.05, 0.02, trimM, 0, y0 + 0.02, -D / 2 - 0.012));
  part('trims', [0, 0.3, 1], 1.1, trims, 0.3);
  // side door with frame, handle and hinges (right wall)
  const doorM = M.seam(0.9, 2.0);
  const door = [box(0.02, 1.98, 0.86, doorM, W / 2 + 0.012, y0 + 1.0, -0.35), box(0.03, 2.04, 0.04, trimM, W / 2 + 0.014, y0 + 1.02, 0.1), box(0.03, 2.04, 0.04, trimM, W / 2 + 0.014, y0 + 1.02, -0.8), box(0.03, 0.04, 0.94, trimM, W / 2 + 0.014, y0 + 2.02, -0.35)];
  const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 12), steelM); h1.rotation.x = Math.PI / 2; h1.position.set(W / 2 + 0.06, y0 + 1.02, -0.02); door.push(h1);
  door.push(box(0.05, 0.03, 0.03, steelM, W / 2 + 0.035, y0 + 1.02, 0.05), box(0.05, 0.03, 0.03, steelM, W / 2 + 0.035, y0 + 1.02, -0.09));
  for (const y of [0.35, 1.65]) door.push(box(0.03, 0.12, 0.03, steelM, W / 2 + 0.028, y0 + y, -0.79));
  part('door', [1, 0, 0], 1.3, door, 0.3);
  // small electrical box on the left wall
  part('ebox', [-1, 0, 0], 1.6, [box(0.05, 0.32, 0.26, plain(0x8d9195, 0.55, 0.3), -W / 2 - 0.03, y0 + 1.5, -0.55)], 0.5);
  // window gaskets + lock on the sliding pane
  const gk = [box(1.98, 0.018, 0.02, rubber, 0, y0 + 1.92, D / 2 + 0.06), box(1.98, 0.018, 0.02, rubber, 0, y0 + 0.98, D / 2 + 0.06)];
  gk.push(box(0.03, 0.12, 0.03, steelM, 0.06, y0 + 1.45, D / 2 + 0.07));
  part('gaskets', [0, 0.1, 1], 1.8, gk, 0.4);
  // counter brackets + LED strip under the counter edge
  const brM = trimM, br = [];
  for (const x of [-0.95, 0, 0.95]) { br.push(box(0.03, 0.03, 0.36, brM, x, y0 + 0.87, D / 2 + 0.2)); br.push(beam(0, 0, 0.36, 0.3, 0.03, 0.03, 0, brM)); br.at(-1).rotation.set(0, -Math.PI / 2, Math.atan2(0.3, 0.36)); br.at(-1).position.set(x, y0 + 0.72, D / 2 + 0.17); }
  const ledM = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffc27a, emissiveIntensity: 0 });
  br.push(box(2.2, 0.012, 0.012, ledM, 0, y0 + 0.875, D / 2 + 0.4));
  part('brackets', [0, -0.4, 1], 1.9, br, 0.4);
  // inside: shelves with goods, espresso machine, menu board (seen through the window)
  const shelfM = mat('pine', 2.2, 0.3, { r: 0.6 }), props = [];
  for (const y of [1.55, 1.95]) props.push(box(2.2, 0.035, 0.26, shelfM, 0, y0 + y, -D / 2 + 0.33));
  const goods = [0xb8432e, 0xe2c69a, 0x3e6e57, 0xd9d4c8, 0x8a5a32, 0x1f2a33];
  let gi = 0;
  for (const y of [1.55, 1.95]) for (let x = -1.0; x <= 1.0; x += 0.18) {
    if (Math.sin(x * 9 + y * 5) > 0.75) continue;
    const c = goods[gi++ % goods.length], tall = 0.12 + ((gi * 37) % 7) * 0.012;
    const g = (gi % 3 === 0) ? box(0.11, tall, 0.11, plain(c, 0.55), x, y0 + y + 0.018 + tall / 2, -D / 2 + 0.33)
      : new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, tall, 16), plain(c, 0.35, 0, 1));
    if (!(gi % 3 === 0)) g.position.set(x, y0 + y + 0.018 + tall / 2, -D / 2 + 0.33);
    props.push(g);
  }
  props.push(box(0.42, 0.42, 0.4, steelM, -0.65, y0 + 1.15, -D / 2 + 0.45), box(0.36, 0.08, 0.34, plain(0x15171a, 0.4, 0.5), -0.65, y0 + 1.4, -D / 2 + 0.45));
  props.push(box(1.1, 0.06, 0.55, mat('pine', 1.1, 0.55, { r: 0.6 }), 0.1, y0 + 0.92, -D / 2 + 0.5), box(1.1, 0.88, 0.5, plain(0x2a2d31, 0.6, 0.2), 0.1, y0 + 0.47, -D / 2 + 0.5));
  props.push(box(0.8, 0.5, 0.02, plain(0x141618, 0.85), 0.6, y0 + 2.18, -D / 2 + 0.2));
  part('props', [0, 1, -1], 0.9, props, 0.3);
  // standing-seam roof skin + gutters with a downpipe
  const roofSkin = (w, d) => mat('seam', d, w, { r: 0.4, m: 0.5, env: 0.9, c: 0x3b3f45 });
  const gutters = [];
  for (const sx of [-1, 1]) {
    const rs = new THREE.Mesh(new THREE.BoxGeometry(rl, 0.004, RD), roofSkin(rl, RD)); rs.material.map.rotation = Math.PI / 2;
    rs.position.set(sx * ex / 2, yt + PEAK - (ex / 2) * pitch + 0.1, 0.08); rs.rotation.z = -sx * ang;
    part('roof', [sx * 0.55, 1, 0], 1.6, [rs], 0.5);
    const gt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, RD, 16, 1, true, 0, Math.PI), steelM);
    gt.rotation.set(Math.PI / 2, 0, 0); gt.rotation.z = sx > 0 ? 0 : 0; gt.position.set(sx * (ex + 0.02), ey - 0.02, 0.08); gt.material.side = THREE.DoubleSide;
    gutters.push(gt);
  }
  const dp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, yt + 0.3, 14), steelM); dp.position.set(ex + 0.02, (yt + 0.3) / 2 - 0.02, -RD / 2 + 0.3); gutters.push(dp);
  part('gutter', [0, 1, 0], 2.4, gutters, 0.5);
  // concrete pad under the kiosk + leveling feet
  const conc = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#7d7a74'; g.fillRect(0, 0, 256, 256); let s2 = 7; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 9000; i++) { const v = 90 + r2() * 70 | 0; g.fillStyle = `rgba(${v},${v - 3},${v - 8},${0.25 + r2() * 0.3})`; g.fillRect(r2() * 256, r2() * 256, 1 + r2() * 2, 1 + r2() * 2); } const t2 = new THREE.CanvasTexture(c); t2.wrapS = t2.wrapT = THREE.RepeatWrapping; t2.repeat.set(3, 3); t2.colorSpace = THREE.SRGBColorSpace; return t2; })();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(W + 1.6, 0.08, D + 2.2), new THREE.MeshStandardMaterial({ map: conc, roughness: 0.88, color: 0xbab5ad })); pad.position.set(0, -0.04, 0.35); pad.receiveShadow = true; scene.add(pad);

  /* ---------- the rest of the range, revealed at the end: modular office + natural-wood market stall ---------- */
  const others = [];
  const office = new THREE.Group(); scene.add(office); others.push(office);
  {
    const OW = 6.0, OD = 2.8, OH = 2.75, ob = 0.18, g = office;
    const add = (m) => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    add(box(OW + 0.1, ob, OD + 0.1, M.base, 0, ob / 2, 0));
    add(box(OW, OH, 0.06, M.seam(OW, OH), 0, ob + OH / 2, -OD / 2 + 0.03));
    for (const sx of [-1, 1]) add(box(0.06, OH, OD, M.seam(OD, OH), sx * (OW / 2 - 0.03), ob + OH / 2, 0));
    // front: cladding left, big glazing, wood slat panel, glass door
    add(box(1.1, OH, 0.06, M.seam(1.1, OH), -OW / 2 + 0.55, ob + OH / 2, OD / 2 - 0.03));
    const gw = 3.0, gx = -OW / 2 + 1.1 + gw / 2;
    const og = new THREE.Mesh(new THREE.PlaneGeometry(gw, OH - 0.2), M.glass); og.position.set(gx, ob + OH / 2, OD / 2 - 0.02); g.add(og);
    for (const x of [gx - gw / 2, gx, gx + gw / 2]) add(box(0.06, OH, 0.08, trimM, x, ob + OH / 2, OD / 2));
    add(box(gw, 0.06, 0.08, trimM, gx, ob + 0.05, OD / 2)); add(box(gw, 0.06, 0.08, trimM, gx, ob + OH - 0.05, OD / 2));
    add(box(0.9, OH, 0.08, mat('slat', 0.9, OH, { r: 0.6 }), gx + gw / 2 + 0.45, ob + OH / 2, OD / 2 - 0.02));
    const dx = gx + gw / 2 + 0.9 + 0.5;
    const dg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, OH - 0.25), M.glass); dg.position.set(dx, ob + (OH - 0.25) / 2 + 0.05, OD / 2 - 0.02); g.add(dg);
    add(box(0.05, OH - 0.2, 0.08, trimM, dx - 0.47, ob + OH / 2 - 0.08, OD / 2)); add(box(0.05, OH - 0.2, 0.08, trimM, dx + 0.47, ob + OH / 2 - 0.08, OD / 2));
    add(box(OW - (dx + 0.5 + OW / 2) + 0.02, OH, 0.06, M.seam(0.3, OH), (dx + 0.5 + OW / 2) / 2 , ob + OH / 2, OD / 2 - 0.03));
    // flat roof with timber fascia + LED soffit
    add(box(OW + 0.7, 0.14, OD + 0.7, M.roof, 0, ob + OH + 0.07, 0.1));
    add(box(OW + 0.72, 0.3, 0.06, M.wood(OW + 0.7, 0.3), 0, ob + OH + 0.05, OD / 2 + 0.46));
    for (const sx of [-1, 1]) add(box(0.06, 0.3, OD + 0.72, M.wood(OD + 0.7, 0.3), sx * (OW / 2 + 0.36), ob + OH + 0.05, 0.1));
    add(box(OW + 0.6, 0.02, 0.62, M.wood(OW, 0.6), 0, ob + OH - 0.01, OD / 2 + 0.16));
    for (let x = -2.6; x <= 2.6; x += 0.86) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 14), dl); d.position.set(x, ob + OH - 0.03, OD / 2 + 0.3); g.add(d); }
    // inside: wood floor, desk, warm back wall that glows at night
    g.add(box(OW - 0.15, 0.02, OD - 0.15, mat('planks', OW, OD, { r: 0.7, c: 0xa89a8a }), 0, ob + 0.01, 0));
    const warm = new THREE.MeshStandardMaterial({ color: 0xd9b48a, emissive: 0xffc98a, emissiveIntensity: 0, roughness: 0.8 });
    g.add(box(OW - 0.2, OH - 0.1, 0.02, warm, 0, ob + OH / 2, -OD / 2 + 0.08)); office.userData.warm = warm;
    add(box(1.6, 0.05, 0.7, mat('pine', 1.6, 0.7, { r: 0.6 }), -0.6, ob + 0.76, -0.2)); add(box(1.5, 0.72, 0.6, plain(0x2a2d31, 0.6), -0.6, ob + 0.38, -0.2));
    add(box(0.5, 0.9, 0.5, plain(0x3e6e57, 0.8), 1.2, ob + 0.45, -0.6));
    const ol = new THREE.PointLight(0xffc98a, 0, 6, 1.6); ol.position.set(0, ob + OH - 0.5, 0); g.add(ol); office.userData.light = ol;
    g.position.set(6.7, 0, -2.4); g.rotation.y = -0.5;
  }
  // natural-wood market stall: the same kiosk, in its wood finish
  const woodOf = new Map(); finishable.forEach(o => { if (o.black && o.wood) woodOf.set(o.black, o.wood); });
  const stall = kiosk.clone(true); scene.add(stall); others.push(stall);
  stall.traverse(o => { if (o.isMesh && woodOf.has(o.material)) o.material = woodOf.get(o.material); });
  stall.position.set(-5.4, 0, -1.6); stall.rotation.y = 0.55; stall.scale.setScalar(0.88);
  for (const [o, x, z, w, d2] of [[office, 6.7, -2.4, 7.6, 4.4], [stall, -5.4, -1.6, 4.2, 3.6]]) {
    const pd = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d2), pad.material); pd.position.set(x, -0.04, z); pd.rotation.y = o.rotation.y; pd.receiveShadow = true; scene.add(pd); others.push(pd);
  }
  others.forEach(o => { o.userData.y0 = o.position.y; o.visible = false; });
  

  const modelSize = new THREE.Box3().setFromObject(kiosk).getSize(new THREE.Vector3()).length();
  parts.forEach(p => { p.userData.k = THREE.MathUtils.clamp(0.55 / (p.userData.size / modelSize), 0.75, 1.6); });
  /* build order: 6 steps, each part flies in during its own window */
  const ORDER = { props: [0.3, 0.4], trims: [0.52, 0.6], door: [0.5, 0.58], ebox: [0.55, 0.6], gaskets: [0.64, 0.7], brackets: [0.66, 0.74], gutter: [0.95, 1], base: [0, 0.07], frame: [0.04, 0.16], insulation: [0.18, 0.3], interior: [0.2, 0.32],
    'back wall': [0.34, 0.44], 'left wall': [0.38, 0.48], 'right wall': [0.4, 0.5], 'front wall': [0.46, 0.56],
    'window frame': [0.58, 0.66], glass: [0.6, 0.68], counter: [0.64, 0.72],
    gable: [0.74, 0.8], truss: [0.77, 0.85], slats: [0.8, 0.86], lamps: [0.83, 0.88], soffit: [0.86, 0.92], roof: [0.88, 0.96], ridge: [0.93, 1] };
  const seen = {};
  parts.forEach(p => { const w = ORDER[p.name] || [0, 0.05]; const i = seen[p.name] = (seen[p.name] ?? -1) + 1; p.userData.win = [Math.min(w[0] + i * 0.02, 0.98), Math.min(w[1] + i * 0.02, 1)]; p.userData.grow = (p.name === 'frame' || p.name === 'interior'); });
  /* ---------- choreography ---------- */
  const clamp = THREE.MathUtils.clamp, seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // camera keyframes: [progress, camera position, look-at target]
  const KEYS = [
    [0.00, V(5.6, 3.1, 9.4), V(0, 1.55, 0)],
    [0.08, V(4.4, 3.4, 8.6), V(0, 1.6, 0)],
    [0.14, V(0.6, 5.2, 12.5), V(0, 1.7, 0)],   // pull up to watch it come apart
    [0.30, V(5.4, 3.3, 7.8), V(0, 1.45, 0)],   // circle closer while the layers go on
    [0.46, V(-3.2, 3.6, 9.6), V(0, 1.6, 0)],    // rebuilt
    [0.51, V(0.55, 1.62, 3.05), V(0, y0 + 1.42, D / 2)],          // glass
    [0.57, V(1.9, 1.25, 2.35), V(0.55, y0 + 0.9, D / 2 + 0.2)],   // counter
    [0.63, V(-1.1, 2.75, 2.9), V(0, yt + 0.42, D / 2 + 0.1)],     // timber truss
    [0.69, V(2.35, 1.75, 2.05), V(1.25, y0 + 1.5, D / 2 + 0.05)], // slats + lamp
    [0.76, V(-4.6, 2.6, 8.8), V(0, 1.55, 0)],
    [0.86, V(1.2, 7.4, 22.5), V(0.7, 1.2, -1.6)],  // the whole range
    [0.93, V(-1.8, 5.6, 20.5), V(0.6, 1.3, -1.6)],
    [1.00, V(-2.6, 5.2, 19.8), V(0.5, 1.4, -1.6)]
  ];
  const camPos = V(0, 0, 0), camTgt = V(0, 0, 0);
  function cam(p) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const [p0, a0, t0] = KEYS[i], [p1, a1, t1] = KEYS[i + 1], k = ease(seg(p, p0, p1));
    camPos.lerpVectors(a0, a1, k); camTgt.lerpVectors(t0, t1, k);
    if (portrait) { const off = camPos.clone().sub(camTgt).multiplyScalar(camPos.distanceTo(camTgt) > 5 ? 1.5 : 1.25); camPos.copy(camTgt).add(off); }
  }
  let shadowWide = false, vw = 1, vh = 1, finish = 'black', portrait = false, dirty = true, idle = 0;
  window.bbbFinish = (f) => { finish = f; finishable.forEach(o => { o.mesh.material = f === 'wood' ? o.wood : (o.black || o.mesh.material); }); dirty = true; };
  function apply(p) {
    cam(p);
    // assembly: 1 = built. Built -> explode (0.12-0.2) -> rebuild layer by layer (0.2-0.4)
    const q = p < 0.08 ? 1 : p < 0.14 ? 1 - ease(seg(p, 0.08, 0.14)) * 0.999 : seg(p, 0.14, 0.46);
    const explode = p >= 0.08 && p < 0.14;
    for (const g of parts) {
      const u = g.userData, k = explode ? q : ease(seg(q, u.win[0], u.win[1]));
      g.visible = (explode || q >= u.win[0] - 0.001) && (finish !== 'wood' || !premiumOnly.includes(g));
      if (u.grow) { const sy = Math.max(0.001, explode ? 1 : k); g.scale.set(1, sy, 1); g.position.copy(u.base); g.position.y = u.base.y - (1 - sy) * u.h / 2; g.rotation.set(0, 0, 0); continue; }
      const f = 1 - k;
      g.position.copy(u.base).addScaledVector(u.dir, f * (u.dist + 1.2) * u.rand * u.k); g.position.y += f * 1.4;
      g.rotation.set(u.ax * u.spin * f * 1.6, u.ay * u.spin * f * 1.6, u.az * u.spin * f * 1.6);
    }
    kiosk.rotation.y = -0.22 + (p < 0.46 ? (1 - ease(seg(p, 0.08, 0.46))) * Math.PI * 2 : 0) + Math.sin(idle * 0.25) * 0.04 * (1 - seg(p, 0.46, 0.5));
    const rr = ease(seg(p, 0.74, 0.86));
    others.forEach(o => { o.visible = rr > 0.001; o.position.y = o.userData.y0 - 3.2 * (1 - rr); });
    scene.fog.far = 30 + 26 * seg(p, 0.72, 0.86); scene.fog.near = 14 + 8 * seg(p, 0.72, 0.86);
    // light: dusk at start, day while building and touring, night at the end
    const L = Math.max(1 - seg(p, 0.06, 0.12), seg(p, 0.66, 0.74));
    office.userData.warm.emissiveIntensity = 0.28 * L * rr; office.userData.light.intensity = 2.2 * L * rr;
    const wide = p > 0.73; if (wide !== shadowWide) { shadowWide = wide; const sc = sun.shadow.camera, r = wide ? 14 : 7; sc.left = -r; sc.right = r; sc.top = wide ? 10 : 7; sc.bottom = wide ? -10 : -7; sc.updateProjectionMatrix(); }
    scene.background.copy(BG_DAY).lerp(BG_NIGHT, L); scene.fog.color.copy(scene.background);
    sun.intensity = 2.5 - 1.8 * L; hemi.intensity = 0.55 - 0.32 * L; rim.intensity = 0.75 - 0.35 * L;
    const lampsOn = finish === 'wood' ? 0 : L;
    M.lampOn.emissiveIntensity = 3 * lampsOn; glows.forEach(s => { s.material.opacity = 0.95 * lampsOn; });
    ledM.emissiveIntensity = 3 * lampsOn; if (bloom) bloom.strength = 0.18 + 0.62 * L;
    if (bokeh) { const close = seg(p, 0.47, 0.5) * (1 - seg(p, 0.71, 0.74)); bokeh.enabled = close > 0.01; bokeh.uniforms.focus.value = camPos.distanceTo(camTgt); bokeh.uniforms.aperture.value = 0.0035 * close; }
    dl.emissiveIntensity = 1.6 * L; inLight.intensity = 5 * L; eaveGlows.forEach(s => { s.material.opacity = 0.75 * L; }); pool.material.opacity = 0.55 * L;
    const fl = Math.max(1 - seg(p, 0.05, 0.1), seg(p, 0.86, 0.94)), bulbs = fl;
    festoon.visible = fl > 0.001; festoon.position.y = -3.9 * (1 - ease(fl));
    bulbM.emissiveIntensity = 4 * bulbs; bulbGlows.forEach(s => { s.material.opacity = 0.6 * bulbs; });
    cam(p); camera.position.copy(camPos); camera.lookAt(camTgt);
    // desktop: push the kiosk to the right while the headline is on screen, centre it for the close-ups
    if (!portrait) { const sh = 0.2 * (1 - seg(p, 0.04, 0.12)); camera.setViewOffset(vw, vh, -vw * sh, 0, vw, vh); }
    else { const sy = 0.24 * (1 - seg(p, 0.04, 0.12)) + 0.04 + 0.08 * seg(p, 0.9, 1); camera.setViewOffset(vw, vh, 0, vh * sy, vw, vh); }
    camera.updateProjectionMatrix();
  }
  /* ---------- post: soft contact shadows, real lamp glow, depth of field in close-ups ---------- */
  let composer = null, bloom = null, bokeh = null;
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    if (!mobile) { try { const ao = new GTAOPass(scene, camera, 800, 600); ao.blendIntensity = 0.85; composer.addPass(ao); } catch (e) { console.warn('AO off', e); } }
    bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.5, 0.9); composer.addPass(bloom);
    if (!mobile) { bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0.0, maxblur: 0.008 }); bokeh.enabled = false; composer.addPass(bokeh); }
    composer.addPass(new OutputPass());
  } catch (e) { console.warn('post off', e); composer = null; }
  const render = () => composer ? composer.render() : renderer.render(scene, camera);
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight; vw = w; vh = h;
    renderer.setSize(w, h, false); portrait = w / h < 0.9;
    if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
    camera.aspect = w / h; camera.fov = portrait ? 40 : 32; camera.clearViewOffset();
    camera.updateProjectionMatrix(); dirty = true;
  }
  addEventListener('resize', resize); resize();
  let cur = 0, goal = 0, last = performance.now(), visible = true;
  const readGoal = () => { const r = sec.getBoundingClientRect(); goal = clamp(-r.top / (r.height - innerHeight), 0, 1); };
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; idle += dt;
    readGoal();
    const d = goal - cur; cur += d * Math.min(1, dt * (reduce ? 30 : 6));
    if (visible) { apply(cur); render(); }
    requestAnimationFrame(tick);
  }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '200px 0px' }).observe(sec);
  readGoal(); cur = goal; apply(cur); render();
  document.documentElement.classList.add('gl-ready');
  requestAnimationFrame(tick);
}
