/* OHI "journey" — fixed WebGL space behind the page.
   The rounded-square O of the logo becomes glossy gates the camera flies through as you scroll;
   the amber dot travels along and lands next to the last gate, forming the logo behind the form. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cvs = document.getElementById('space');
if (cvs && !reduce) start();

function start() {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { return; }
  const mobile = innerWidth < 760;
  const inner = document.body.classList.contains('inner');
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x0B0D14, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0B0D14, 9, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const cam = new THREE.PerspectiveCamera(mobile ? 62 : 48, 1, 0.1, 120);

  /* lights in brand colours */
  scene.add(new THREE.AmbientLight(0x8090ff, 0.35));
  const kCob = new THREE.PointLight(0x4C63FF, 60, 30, 1.6); scene.add(kCob);
  const kAmb = new THREE.PointLight(0xFFB020, 40, 18, 1.8); scene.add(kAmb);

  /* the O: rounded square frame, extruded */
  function roundedRect(s, w, h, r) {
    const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  const outer = roundedRect(new THREE.Shape(), 2.2, 2.2, 0.62);
  outer.holes.push(roundedRect(new THREE.Path(), 1.6, 1.6, 0.36));
  const ringGeo = new THREE.ExtrudeGeometry(outer, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 5, curveSegments: 24 });
  ringGeo.center();
  const ringMat = new THREE.MeshPhysicalMaterial({ color: 0x4C63FF, metalness: 0.55, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15, emissive: 0x1a2380, emissiveIntensity: 0.35, transparent: true, opacity: mobile ? 0.38 : (inner ? 0.5 : 0.92) });

  /* gates along the path; z = depth where each section lives */
  const GATES = [
    { pos: [3.5, 0.25, -1.5], s: 1.25, tilt: -0.18 },   // hero: frames the phone
    { pos: [3.3, -0.2, -17], s: 1.5, tilt: -0.17 },     // story: beside the phone
    { pos: [3.8, 0.7, -30], s: 1.1, tilt: -0.1 },       // client + examples
    { pos: [3.0, -0.5, -42], s: 1.0, tilt: -0.2 },      // seats / automations
    { pos: [0.9, 0.0, -61], s: 1.25, tilt: -0.17 },     // final: logo lockup behind the form
  ];
  if (inner) GATES.forEach((g, i) => { g.pos = [5.6 + (i % 2) * 0.5, g.pos[1], g.pos[2]]; g.s *= 0.85; });
  const gates = GATES.map((g, i) => {
    const m = new THREE.Mesh(ringGeo, ringMat);
    m.position.set(...g.pos); m.scale.setScalar(g.s); m.rotation.z = g.tilt; m.userData = { ...g, i };
    scene.add(m); return m;
  });
  if (inner) gates.forEach((g, i) => { if (i > 0) g.visible = false; });

  /* the amber dot */
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 40, 40),
    new THREE.MeshStandardMaterial({ color: 0xFFB020, emissive: 0xFFB020, emissiveIntensity: 1.4, roughness: 0.3 }));
  scene.add(dot);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('255,176,32'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
  halo.scale.setScalar(1.2); dot.add(halo);

  /* star field: a long tube of points along the flight path */
  const N = mobile ? 1400 : 2600, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const cA = new THREE.Color(0x7B8CFF), cB = new THREE.Color(0xFFFFFF), cC = new THREE.Color(0xFFB020);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = 2.5 + Math.pow(Math.random(), 0.6) * 14;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.sin(a) * r * 0.62; pos[i * 3 + 2] = 12 - Math.random() * 80;
    const c = Math.random() < 0.07 ? cC : (Math.random() < 0.5 ? cA : cB); col.set([c.r, c.g, c.b], i * 3);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(pg, new THREE.PointsMaterial({ size: mobile ? 0.07 : 0.055, map: glowTex('255,255,255'), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9, sizeAttenuation: true }));
  scene.add(stars);

  /* faint perspective grid that appears around the "build" part of the journey */
  const grid = new THREE.GridHelper(80, 80, 0x4C63FF, 0x4C63FF);
  grid.material.transparent = true; grid.material.opacity = 0; grid.material.depthWrite = false;
  grid.position.set(0, -3.2, -34); scene.add(grid);

  function glowTex(rgb) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, `rgba(${rgb},1)`); r.addColorStop(0.25, `rgba(${rgb},.55)`); r.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  /* camera path: keyframes (scroll progress → camera z / x / y and look offset) */
  const K = [
    { p: 0.00, z: 7.5, x: 0.3, y: 0.0 },
    { p: 0.10, z: 4.0, x: 0.1, y: 0.0 },
    { p: 0.32, z: -21, x: 0.0, y: 0.0 },   // through gate 1 during the pinned story
    { p: 0.52, z: -27, x: -0.6, y: 0.2 },
    { p: 0.72, z: -39, x: 0.5, y: -0.1 },
    { p: 0.88, z: -50, x: 0.0, y: 0.1 },
    { p: 1.00, z: -52.5, x: 0.0, y: 0.15 },
  ];
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function along(p, key) {
    for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (p <= b.p) { const t = ease((p - a.p) / (b.p - a.p)); return a[key] + (b[key] - a[key]) * t; } }
    return K[K.length - 1][key];
  }

  let mx = 0, my = 0, smx = 0, smy = 0, sp = 0, lastP = 0, vel = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);

  const clock = new THREE.Clock(); let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); loop(); } });
  document.documentElement.classList.add('has-space');

  function loop() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max));
    sp += (p - sp) * Math.min(1, dt * 4.5);                  // smoothed progress
    vel += ((sp - lastP) / Math.max(dt, 1e-3) - vel) * 0.1; lastP = sp;
    smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;

    cam.position.set(along(sp, 'x') + smx * 0.9, along(sp, 'y') - smy * 0.6, along(sp, 'z'));
    cam.lookAt(cam.position.x * 0.6 - smx * 0.4, cam.position.y * 0.6 + smy * 0.3, cam.position.z - 10);
    cam.rotation.z += Math.sin(t * 0.25) * 0.004;

    gates.forEach((g, i) => {
      g.rotation.y = Math.sin(t * 0.35 + i) * 0.28 + smx * 0.25;
      g.rotation.x = Math.cos(t * 0.3 + i) * 0.12 - smy * 0.2;
      g.position.y = g.userData.pos[1] + Math.sin(t * 0.6 + i * 1.7) * 0.08;
    });
    /* final gate settles flat so it reads as the logo */
    const fin = gates[4], fk = inner ? 0 : Math.min(1, Math.max(0, (sp - 0.86) / 0.12));
    fin.rotation.y *= 1 - fk; fin.rotation.x *= 1 - fk;

    /* amber dot: drifts ahead of the camera, then lands at the logo position of the final gate */
    const ahead = new THREE.Vector3((mobile ? 2.5 : (inner ? 4.6 : 2.2)) + Math.sin(t * 0.7) * 0.5, 0.9 + Math.cos(t * 0.9) * 0.35, cam.position.z - 6);
    const land = new THREE.Vector3(fin.position.x + 1.55 * fin.scale.x * 0.98, fin.position.y - 0.62 * fin.scale.x, fin.position.z + 0.2);
    dot.position.lerpVectors(ahead, land, inner ? 0 : fk * fk);
    halo.material.opacity = 0.7 + Math.sin(t * 2) * 0.15;

    kCob.position.set(cam.position.x - 3, cam.position.y + 2, cam.position.z - 6);
    kAmb.position.copy(dot.position).add(new THREE.Vector3(0, 0, 1));

    stars.material.size = (mobile ? 0.07 : 0.055) * (1 + Math.min(2.5, Math.abs(vel) * 9));
    stars.rotation.z = t * 0.01;
    grid.material.opacity = 0.11 * Math.max(0, 1 - Math.abs(sp - 0.6) / 0.2);

    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  }
  loop();
}
