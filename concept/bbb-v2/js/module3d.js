/* Big Big Boon concept · hero: the green modular unit from BBB's own photo, in 3D.
   On load it assembles layer by layer with outlined labels; on scroll the walls go see-through to show the layers,
   the camera walks to the double door, the door opens and the camera steps inside. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const sec = document.getElementById('mhero'), cvs = document.getElementById('m3'), stage = cvs.parentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fail = (e) => { if (e) console.warn('3D hero fallback', e); document.documentElement.classList.add('nogl-h'); };
main().catch(fail);

async function main() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return fail(e); }
  const mobile = innerWidth < 900;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.3 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const BG = new THREE.Color('#16201b'); scene.background = BG; scene.fog = new THREE.Fog(BG, 18, 40);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 90);

  scene.add(new THREE.HemisphereLight(0xe8eef2, 0x30281f, 0.6));
  const sun = new THREE.DirectionalLight(0xfff1de, 2.3); sun.position.set(-6, 10, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 34 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4; scene.add(sun);
  const rim = new THREE.DirectionalLight(0xbcd0ff, 0.6); rim.position.set(7, 5, -6); scene.add(rim);

  /* ---------- textures ---------- */
  const TL = new THREE.TextureLoader();
  let planks, pine;
  try { [planks, pine] = await Promise.all(['/concept/bbb-v2/img/tex-1.jpg', '/concept/bbb-v2/img/tex-2.jpg'].map(s => TL.loadAsync(s))); } catch (e) { return fail(e); }
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const rep = (base, rx, ry, rot = 0) => { const t = base.clone(); t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.repeat.set(rx, ry); t.rotation = rot; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.needsUpdate = true; return t; };
  const canvasTex = (w, h, draw, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };
  // standing-seam green cladding, ~0.5 m between seams (as in the photo)
  const seamTex = (rx, ry) => canvasTex(256, 64, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#4c6646'); gr.addColorStop(.5, '#567250'); gr.addColorStop(1, '#4a6444'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, 5, h); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(5, 0, 4, h);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},.03)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  }, rx, ry);
  const woolTex = canvasTex(128, 128, (g) => { g.fillStyle = '#d6c27f'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '120,100,50' : '245,230,175'},${.15 + Math.random() * .25})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1 + Math.random() * 2); } }, 3, 3);

  const std = (o) => new THREE.MeshStandardMaterial(o);
  const M = {
    base: std({ color: 0x2b2e31, roughness: .6, metalness: .4 }),
    steel: std({ color: 0x1b1d20, roughness: .45, metalness: .7 }),
    wool: std({ map: woolTex, roughness: .95 }),
    pine: (w, h) => std({ map: rep(pine, w / .45, h / .8), roughness: .6, envMapIntensity: .6 }),
    wood: (w, h, rot = 0) => std({ map: rep(planks, w / 2.8, h / .74, rot), roughness: .55 }),
    frameWood: (w, h, vertical) => std({ map: rep(planks, vertical ? h / 2.8 : w / 2.8, vertical ? w / .74 : h / .74, vertical ? Math.PI / 2 : 0), roughness: .5, color: 0xffe2c4 }),
    anth: std({ color: 0x2c3036, roughness: .4, metalness: .5 }),
    roof: std({ color: 0x3f4b45, roughness: .45, metalness: .5 }),
    glass: std({ color: 0xcfe3ee, roughness: .03, metalness: .25, transparent: true, opacity: .14, envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide }),
    bulb: std({ color: 0xffe6bf, emissive: 0xffb866, emissiveIntensity: 0 }),
    floor: (w, d) => std({ map: rep(planks, w / 2.8, d / .74), roughness: .7, color: 0xbba48c }),
    fabric: std({ color: 0x3c4a44, roughness: .95 }), cushion: std({ color: 0xa8997f, roughness: .95 }), leaf: std({ color: 0x3f6b45, roughness: .8 })
  };

  /* ---------- dimensions (from the photo) ---------- */
  const W = 6.0, D = 3.0, H = 2.6, y0 = 0.16, yt = y0 + H, T = 0.12;
  const win1 = { x: -2.15, w: 0.62, y: 0.75, h: 1.5 }, door = { x: -0.55, w: 1.5, y: 0.02, h: 2.15 }, win2 = { x: 1.65, w: 2.0, y: 0.7, h: 1.45 };
  const unit = new THREE.Group(); scene.add(unit);
  const parts = []; // {group, start, end, dir, label}
  const box = (w, h, d, m, x, y, z) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.position.set(x, y, z); g.castShadow = true; g.receiveShadow = true; return g; };
  const outlineM = new THREE.LineBasicMaterial({ color: 0xF2A65E, transparent: true, opacity: 0 });
  function part(key, meshes, start, end, dir, dist) {
    const g = new THREE.Group(); meshes.forEach(m => g.add(m)); unit.add(g);
    const lines = []; meshes.forEach(m => { if (!m.geometry || m.isLine) return; const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), outlineM.clone()); l.position.copy(m.position); l.rotation.copy(m.rotation); l.scale.copy(m.scale); g.add(l); lines.push(l); });
    const p = { key, g, start, end, dir: new THREE.Vector3(...dir).normalize(), dist, lines, xray: [] };
    parts.push(p); return p;
  }

  /* base */
  part('base', [box(W + 0.1, y0, D + 0.1, M.base, 0, y0 / 2, 0)], 0, .35, [0, -1, 0], 1.2);
  /* steel frame */
  const fr = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fr.push(box(.09, H, .09, M.steel, sx * (W / 2 - .06), y0 + H / 2, sz * (D / 2 - .06)));
  for (const x of [win1.x - win1.w / 2 - .05, win1.x + win1.w / 2 + .05, door.x - door.w / 2 - .05, door.x + door.w / 2 + .05, win2.x - win2.w / 2 - .05, win2.x + win2.w / 2 + .05]) fr.push(box(.07, H, .07, M.steel, x, y0 + H / 2, D / 2 - .06));
  for (const x of [-1.5, 0, 1.5]) fr.push(box(.07, H, .07, M.steel, x, y0 + H / 2, -D / 2 + .06));
  for (const yy of [y0 + .04, yt - .04]) { fr.push(box(W - .1, .08, .08, M.steel, 0, yy, D / 2 - .06), box(W - .1, .08, .08, M.steel, 0, yy, -D / 2 + .06)); for (const sx of [-1, 1]) fr.push(box(.08, .08, D - .1, M.steel, sx * (W / 2 - .06), yy, 0)); }
  const frame = part('frame', fr, .25, .95, [0, 1, 0], 0); frame.grow = true;
  /* insulation in the wall cavities */
  const ins = [box(W - .3, H - .25, .08, M.wool, 0, y0 + H / 2, -D / 2 + .13)];
  for (const sx of [-1, 1]) ins.push(box(.08, H - .25, D - .3, M.wool, sx * (W / 2 - .13), y0 + H / 2, 0));
  ins.push(box(1.1, H - .25, .08, M.wool, -2.55 + .3, y0 + H / 2, D / 2 - .13), box(1.0, H - .25, .08, M.wool, .85 - .35, y0 + H / 2, D / 2 - .13));
  const insul = part('insulation', ins, .85, 1.45, [0, 0, 1], 1.4);
  /* interior lining, floor, ceiling + furniture */
  const inn = [];
  const plane = (w, h, m, x, y, z, ry = 0, rx = 0) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); g.position.set(x, y, z); g.rotation.set(rx, ry, 0); g.receiveShadow = true; return g; };
  inn.push(plane(W - .36, H - .02, M.pine(W, H), 0, y0 + H / 2, -D / 2 + .19));
  inn.push(plane(D - .38, H - .02, M.pine(D, H), -W / 2 + .19, y0 + H / 2, 0, Math.PI / 2), plane(D - .38, H - .02, M.pine(D, H), W / 2 - .19, y0 + H / 2, 0, -Math.PI / 2));
  inn.push(plane(W - .36, D - .38, M.floor(W, D), 0, y0 + .01, 0, 0, -Math.PI / 2), plane(W - .36, D - .38, M.pine(W, D), 0, yt - .02, 0, 0, Math.PI / 2));
  inn.push(box(1.9, .42, .82, M.fabric, 1.2, y0 + .21, -D / 2 + .62), box(1.9, .5, .2, M.fabric, 1.2, y0 + .55, -D / 2 + .3), box(.5, .16, .5, M.cushion, .65, y0 + .5, -D / 2 + .55), box(.5, .16, .5, M.cushion, 1.75, y0 + .5, -D / 2 + .55));
  inn.push(box(.9, .05, .55, M.wood(.9, .55), 1.2, y0 + .42, -.1), box(.06, .4, .06, M.steel, .8, y0 + .2, -.3), box(.06, .4, .06, M.steel, 1.6, y0 + .2, -.3), box(.06, .4, .06, M.steel, .8, y0 + .2, .1), box(.06, .4, .06, M.steel, 1.6, y0 + .2, .1));
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.18, .14, .4, 20), M.anth); pot.position.set(-2.4, y0 + .2, -D / 2 + .5); inn.push(pot);
  const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(.42, 1), M.leaf); bush.position.set(-2.4, y0 + .78, -D / 2 + .5); inn.push(bush);
  inn.push(box(1.4, .75, .05, M.wood(1.4, .75), -1.0, y0 + .9, -D / 2 + .23), box(1.2, .03, .3, M.wood(1.2, .3), -1.0, y0 + 1.55, -D / 2 + .34));
  const lining = part('interior', inn, 1.05, 1.55, [0, 1, 0], 0); lining.grow = true; lining.noOutline = true;
  const warm = new THREE.PointLight(0xffc98a, 0, 7, 1.5); warm.position.set(0, yt - .5, 0); scene.add(warm);

  /* cladding: front wall with openings (extruded), back + sides */
  const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, H); sh.lineTo(-W / 2, H); sh.closePath();
  for (const o of [win1, door, win2]) { const h = new THREE.Path(); h.moveTo(o.x - o.w / 2, o.y); h.lineTo(o.x + o.w / 2, o.y); h.lineTo(o.x + o.w / 2, o.y + o.h); h.lineTo(o.x - o.w / 2, o.y + o.h); h.closePath(); sh.holes.push(h); }
  const fMat = std({ map: seamTex(1 / .5, 1 / H), roughness: .5, metalness: .25, transparent: true, opacity: 1 });
  const front = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .05, bevelEnabled: false }), fMat); front.position.set(0, y0, D / 2 - .05); front.castShadow = true; front.receiveShadow = true;
  const wallM = (w) => std({ map: seamTex(w / .5, 1), roughness: .5, metalness: .25, transparent: true, opacity: 1 });
  const back = box(W, H, .05, wallM(W), 0, y0 + H / 2, -D / 2 + .025);
  const left = box(.05, H, D, wallM(D), -W / 2 + .025, y0 + H / 2, 0), right = box(.05, H, D, wallM(D), W / 2 - .025, y0 + H / 2, 0);
  const cFront = part('cladding', [front], 1.45, 2.05, [0, 0, 1], 1.6);
  const cBack = part('cladding', [back], 1.4, 1.95, [0, 0, -1], 1.6);
  const cLeft = part('cladding', [left], 1.5, 2.05, [-1, 0, 0], 1.6), cRight = part('cladding', [right], 1.55, 2.1, [1, 0, 0], 1.6);
  const cladMats = [fMat, back.material, left.material, right.material];

  /* windows + wooden frames */
  const frameSet = (o, sill) => {
    const ms = [], fw = .11, z = D / 2 + .03;
    ms.push(box(o.w + fw * 2, fw, .12, M.frameWood(o.w + fw * 2, fw), o.x, y0 + o.y + o.h + fw / 2, z));
    ms.push(box(o.w + fw * 2 + (sill ? .5 : 0), fw, sill ? .2 : .12, M.frameWood(o.w + .5, fw), o.x + (sill ? .1 : 0), y0 + o.y - fw / 2, z + (sill ? .04 : 0)));
    for (const sx of [-1, 1]) ms.push(box(fw, o.h, .12, M.frameWood(fw, o.h, true), o.x + sx * (o.w / 2 + fw / 2), y0 + o.y + o.h / 2, z));
    return ms;
  };
  const glassPane = (o) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(o.w - .06, o.h - .06), M.glass); g.position.set(o.x, y0 + o.y + o.h / 2, D / 2 - .03); return g; };
  const winMs = [...frameSet(win1), ...frameSet(win2, true), ...frameSet(door), glassPane(win1), glassPane(win2)];
  for (const o of [win1, win2]) { winMs.push(box(.05, o.h, .05, M.anth, o.x - o.w / 2 + .03, y0 + o.y + o.h / 2, D / 2 - .02), box(.05, o.h, .05, M.anth, o.x + o.w / 2 - .03, y0 + o.y + o.h / 2, D / 2 - .02), box(o.w, .05, .05, M.anth, o.x, y0 + o.y + .03, D / 2 - .02), box(o.w, .05, .05, M.anth, o.x, y0 + o.y + o.h - .03, D / 2 - .02)); }
  const windows = part('windows', winMs, 2.0, 2.55, [0, .2, 1], 2.2);
  /* double door: two hinged leaves (anthracite frame + glass) */
  const leaves = [];
  for (const sx of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(door.x + sx * door.w / 2, y0 + door.y, D / 2 - .03);
    const lw = door.w / 2 - .01, lh = door.h - .02, cx = -sx * lw / 2;
    piv.add(box(.07, lh, .06, M.anth, cx - lw / 2 + .035, lh / 2, 0), box(.07, lh, .06, M.anth, cx + lw / 2 - .035, lh / 2, 0), box(lw, .09, .06, M.anth, cx, .045, 0), box(lw, .09, .06, M.anth, cx, lh - .045, 0), box(lw, .06, .05, M.anth, cx, lh * .5, 0));
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(lw - .1, lh - .16), M.glass); gp.position.set(cx, lh / 2, 0); piv.add(gp);
    const hd = box(.025, .22, .04, M.steel, cx + sx * (lw / 2 - .1), lh * .5, .06); piv.add(hd);
    leaves.push({ piv, sx }); }
  const doorPart = part('door', leaves.map(l => l.piv), 2.05, 2.6, [0, 0, 1], 2.4); doorPart.noOutline = true;

  /* roof: thin slab with big front overhang, green fascia, wooden soffit + festoon bulbs */
  const ov = .75, RW = W + .5, RD = D + ov + .25;
  const roofMs = [box(RW, .12, RD, M.roof, 0, yt + .1, (ov - .25) / 2)];
  roofMs.push(box(RW + .02, .2, .05, std({ map: seamTex(RW / .5, 1), roughness: .5, metalness: .3 }), 0, yt + .06, D / 2 + ov + .01));
  for (const sx of [-1, 1]) roofMs.push(box(.05, .2, RD, std({ map: seamTex(RD / .5, 1), roughness: .5, metalness: .3 }), sx * RW / 2, yt + .06, (ov - .25) / 2));
  roofMs.push(box(RW - .04, .025, ov + .1, M.wood(RW, ov, 0), 0, yt - .02, D / 2 + ov / 2));
  const bulbs = [], glows = [];
  const gtex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 1, 32, 32, 32); r.addColorStop(0, 'rgba(255,214,150,1)'); r.addColorStop(.3, 'rgba(255,180,95,.5)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  for (let i = 0; i < 12; i++) { const x = -RW / 2 + .45 + i * (RW - .9) / 11; const b = new THREE.Mesh(new THREE.SphereGeometry(.04, 12, 10), M.bulb); b.position.set(x, yt - .1, D / 2 + ov - .18); roofMs.push(b); const c = box(.01, .06, .01, M.steel, x, yt - .05, D / 2 + ov - .18); roofMs.push(c);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })); s.scale.set(.5, .5, 1); s.position.copy(b.position); roofMs.push(s); glows.push(s); }
  const roof = part('roof', roofMs, 2.45, 3.05, [0, 1, 0], 2.4);

  /* ground */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), std({ color: 0x1a221e, roughness: .95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.035; ground.receiveShadow = true; scene.add(ground);
  const padTex = canvasTex(256, 256, (g) => { g.fillStyle = '#7f7b74'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 9000; i++) { const v = 90 + Math.random() * 70 | 0; g.fillStyle = `rgba(${v},${v - 3},${v - 8},${.25 + Math.random() * .3})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5); } }, 4, 3);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(W + 3, .06, D + 4), std({ map: padTex, roughness: .9, color: 0xbab5ad })); pad.position.set(0, -.03, .7); pad.receiveShadow = true; scene.add(pad);

  // remember resting transforms
  parts.forEach(p => { p.g.userData.base = p.g.position.clone(); p.size = new THREE.Box3().setFromObject(p.g).getSize(new THREE.Vector3()); });

  /* ---------- HTML labels pinned to 3D points ---------- */
  const labels = [...document.querySelectorAll('.ml')].map(el => ({ el, at: new THREE.Vector3(...el.dataset.at.split(',').map(Number)) }));
  const v3 = new THREE.Vector3();
  function placeLabels(show) {
    const w = stage.clientWidth, h = stage.clientHeight;
    labels.forEach(L => { const o = show[L.el.dataset.k] || 0; L.el.style.opacity = o.toFixed(3); if (o < .01) return;
      v3.copy(L.at).applyMatrix4(unit.matrixWorld).project(camera); if (v3.z > 1) { L.el.style.opacity = 0; return; }
      L.el.style.transform = `translate(${((v3.x + 1) / 2 * w).toFixed(1)}px,${((1 - v3.y) / 2 * h).toFixed(1)}px)`; });
  }

  /* ---------- choreography ---------- */
  const clamp = THREE.MathUtils.clamp, seg = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, outC = x => 1 - Math.pow(1 - x, 3);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const KEYS = [
    [0.00, V(9.6, 3.4, 12.6), V(0, 1.45, 0)],
    [0.10, V(10.0, 3.8, 10.6), V(0, 1.45, 0)],
    [0.30, V(7.4, 3.4, 7.4), V(.3, 1.4, 0)],                 // see-through: layers
    [0.44, V(.6, 1.7, 7.2), V(door.x, 1.3, D / 2)],          // walk up to the door
    [0.58, V(door.x, 1.55, D / 2 + 2.6), V(door.x, 1.35, 0)], // door opens while we wait outside
    [0.76, V(door.x, 1.55, .85), V(door.x + .6, 1.1, -D / 2)],// through the door
    [1.00, V(-2.25, 1.6, 1.0), V(1.5, .85, -1.2)]             // corner view of the room
  ];
  const cp = V(0, 0, 0), ct = V(0, 0, 0);
  function camAt(p) { let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++; const [p0, a0, t0] = KEYS[i], [p1, a1, t1] = KEYS[i + 1], k = ease(seg(p, p0, p1)); cp.lerpVectors(a0, a1, k); ct.lerpVectors(t0, t1, k);
    if (portrait) { const off = cp.clone().sub(ct).multiplyScalar(1 + .5 * (1 - seg(p, .4, .56))); cp.copy(ct).add(off); } }

  let portrait = false, vw = 1, vh = 1, t0 = performance.now(), introT = reduce ? 9 : 0;
  function apply(p, it) {
    // intro assembly (time based)
    const show = {};
    for (const P of parts) {
      const k = it >= P.end ? 1 : outC(seg(it, P.start, P.end)); P.g.visible = it >= P.start - .001;
      if (P.grow) { const s = Math.max(.001, k); P.g.scale.set(1, s, 1); P.g.position.copy(P.g.userData.base); P.g.position.y = P.g.userData.base.y - (1 - s) * (y0 + H / 2); }
      else { const f = 1 - k; P.g.position.copy(P.g.userData.base).addScaledVector(P.dir, f * (P.dist + 1)); P.g.position.y += f * .8; }
      const glow = P.noOutline ? 0 : Math.max(0, Math.sin(Math.PI * seg(it, P.start, P.end + .5))) * .95;
      P.lines.forEach(l => { l.material.opacity = Math.max(glow, xrayLine(P, p)); });
      if (it > P.start && it < P.end + .6) show['i-' + P.key] = Math.sin(Math.PI * seg(it, P.start, P.end + .6));
    }
    // see-through walls between .12 and .34: show frame / insulation / lining
    const x = Math.sin(Math.PI * seg(p, .12, .36));
    cladMats.forEach(m => { m.opacity = 1 - .82 * x; m.depthWrite = x < .05; });
    show['x-frame'] = seg(p, .14, .2) * (1 - seg(p, .3, .35)); show['x-ins'] = seg(p, .17, .23) * (1 - seg(p, .3, .35)); show['x-clad'] = seg(p, .2, .26) * (1 - seg(p, .3, .35)); show['x-pine'] = seg(p, .23, .28) * (1 - seg(p, .3, .35));
    show['d-wood'] = seg(p, .38, .42) * (1 - seg(p, .5, .54)); show['d-roof'] = seg(p, .4, .44) * (1 - seg(p, .5, .54));
    // door opens, warm light inside
    const o = ease(seg(p, .46, .58)); leaves.forEach(L => { L.piv.rotation.y = L.sx * -1.6 * o; });
    const L = Math.min(1, it / 3.2) * .5 + .5 * Math.max(seg(p, .45, .6), 1 - seg(p, 0, .1));
    warm.intensity = 2 + 2.5 * seg(p, .48, .7); M.bulb.emissiveIntensity = 3.2 * seg(it, 2.9, 3.3); glows.forEach(s => { s.material.opacity = .85 * seg(it, 2.9, 3.3); });
    if (bloom) bloom.strength = .35 + .25 * L;
    unit.rotation.y = it < 3.2 ? -.18 + (1 - outC(seg(it, 0, 3.2))) * .7 : -.18 * (1 - seg(p, .3, .46));
    camAt(p); camera.position.copy(cp); camera.lookAt(ct);
    const fv = (portrait ? 42 : 32) + (portrait ? 24 : 30) * ease(seg(p, .6, .82)); if (Math.abs(camera.fov - fv) > .01) camera.fov = fv;
    if (!portrait) { const s = .2 * (1 - seg(p, .06, .14)); camera.setViewOffset(vw, vh, -vw * s, 0, vw, vh); }
    else { const s = .3 * (1 - seg(p, .06, .14)); camera.setViewOffset(vw, vh, 0, vh * s, vw, vh); }
    camera.updateProjectionMatrix(); unit.updateMatrixWorld();
    placeLabels(show);
  }
  function xrayLine(P, p) { const x = Math.sin(Math.PI * seg(p, .12, .36)); return (P.key === 'frame' || P.key === 'insulation') ? .8 * x : 0; }

  let composer = null, bloom = null;
  try { composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), .4, .5, .88); composer.addPass(bloom); composer.addPass(new OutputPass()); } catch (e) { composer = null; }
  const render = () => composer ? composer.render() : renderer.render(scene, camera);
  function resize() { const w = stage.clientWidth, h = stage.clientHeight; vw = w; vh = h; renderer.setSize(w, h, false); if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h); }
    portrait = w / h < .9; camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  let cur = 0, goal = 0, last = performance.now(), visible = true;
  const readGoal = () => { const r = sec.getBoundingClientRect(); goal = clamp(-r.top / (r.height - innerHeight), 0, 1); };
  function tick(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; if (!reduce) introT = (now - t0) / 1000;
    readGoal(); cur += (goal - cur) * Math.min(1, dt * 6); if (visible) { apply(cur, introT); render(); } requestAnimationFrame(tick); }
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '150px 0px' }).observe(sec);
  readGoal(); cur = goal; apply(cur, introT); render(); document.documentElement.classList.add('glh-ready'); requestAnimationFrame(tick);
}
