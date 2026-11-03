// Portfolio hero: the page is cut into thick smoked-glass shards with the text printed on them.
// The slab tilts toward the pointer, the shard under it lifts, and "Deschide arhiva 3D" shatters it
// to reveal the photo sphere behind. OHI build on three.js r160 (MIT, /vendor/three).
import * as THREE from '/vendor/three/three.module.js';
import { RoomEnvironment } from '/vendor/three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('pfStage');
const mount = document.getElementById('gsCv');
const layer = document.getElementById('gsText');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { renderer = null; }
if (!renderer || calm) {
  stage.classList.add('gs-static');
} else {
  init();
}

function init() {
  const PR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), .04).texture;
  const key = new THREE.DirectionalLight(0xdfe6ff, 1.1); key.position.set(-1, 1.2, 1.4); scene.add(key);
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 20000);
  const slab = new THREE.Group(); scene.add(slab);

  // ---------- layout ----------
  let W = 1, H = 1, S = 1, B = {}, portrait = false;
  const HD = 76;                                   // shared header height
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.position.set(0, 0, (H / 2) / Math.tan(THREE.MathUtils.degToRad(15))); camera.updateProjectionMatrix();
    const mx = W < 700 ? 14 : W * .055, top = HD + (W < 700 ? 10 : H * .03), bot = W < 700 ? 16 : H * .06;
    const bw = W - 2 * mx, bh = H - top - bot;
    portrait = bw / bh < 1;
    S = Math.max(.42, bw / 1730);
    const navH = Math.max(46, bh * .1), gap = 14 * S;
    B = { x: mx, y: top, w: bw, h: bh, navH, gap, px: mx, py: top + navH + gap, pw: bw, ph: bh - navH - gap };
    paint();
  }

  // ---------- the cut pattern (panel-normalised, x right, y down) ----------
  const base = {
    TL: [0, 0], TR: [1, 0], BR: [1, 1], BL: [0, 1],
    tAB: [.22, 0], tBC: [.515, 0], tCE: [.84, 0], bAD: [.34, 1], bDE: [.865, 1],
    J0: [.385, .72], J1: [.48, .62], J2: [.716, .49]
  };
  const CELLS = [['TL', 'tAB', 'J0', 'bAD', 'BL'], ['tAB', 'tBC', 'J1', 'J0'], ['tBC', 'tCE', 'J2', 'J1'], ['J0', 'J1', 'J2', 'bDE', 'bAD'], ['tCE', 'TR', 'BR', 'bDE', 'J2']];
  const ph = {}; Object.keys(base).forEach((k, i) => ph[k] = [i * 1.7, 10 + (i * 3.1) % 10, 12 + (i * 4.3) % 8]);
  const ptr = { x: .5, y: .5, on: 0, ton: 0, nx: 0, ny: 0, tnx: 0, tny: 0 };
  function points(t) {
    const P = {};
    for (const k in base) {
      let [x, y] = base[k];
      const corner = (x === 0 || x === 1) && (y === 0 || y === 1);
      if (!corner && !calm) {
        const [p0, px, py] = ph[k];
        x += .03 * Math.sin(t * 2 * Math.PI / px + p0);
        if (y > 0 && y < 1) y += .05 * Math.sin(t * 2 * Math.PI / py + p0 * 1.3);
        // the cursor pushes nearby points away, so the cell under it grows
        const dx = x - ptr.x, dy = (y - ptr.y) * (B.ph / B.pw), d = Math.hypot(dx, dy);
        if (d < .6 && d > 1e-4) { const f = (1 - d / .6) * .05 * ptr.on; x += dx / d * f; if (y > 0 && y < 1) y += dy / d * f; }
        x = Math.min(.97, Math.max(.03, x)); y = Math.min(.95, Math.max(0, y));
        if (base[k][1] === 0) y = 0; if (base[k][1] === 1) y = 1;
      }
      P[k] = portrait ? [y, x] : [x, y];
    }
    return P;
  }

  // ---------- geometry helpers ----------
  function inset(poly, d) {
    const n = poly.length, lines = [];
    let area = 0; for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    const sgn = area > 0 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n]; let ex = b[0] - a[0], ey = b[1] - a[1]; const l = Math.hypot(ex, ey) || 1; ex /= l; ey /= l;
      const nx = -ey * sgn, ny = ex * sgn;
      lines.push([a[0] + nx * d, a[1] + ny * d, ex, ey]);
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const L1 = lines[(i - 1 + n) % n], L2 = lines[i];
      const den = L1[2] * L2[3] - L1[3] * L2[2];
      if (Math.abs(den) < 1e-6) { out.push([L2[0], L2[1]]); continue; }
      const t = ((L2[0] - L1[0]) * L2[3] - (L2[1] - L1[1]) * L2[2]) / den;
      out.push([L1[0] + L1[2] * t, L1[1] + L1[3] * t]);
    }
    return out;
  }
  function shape(poly, r) {
    const s = new THREE.Shape(), n = poly.length;
    for (let i = 0; i < n; i++) {
      const p = poly[i], a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n];
      const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const rr = Math.min(r, la * .42, lb * .42);
      const p1 = [p[0] + (a[0] - p[0]) / la * rr, p[1] + (a[1] - p[1]) / la * rr], p2 = [p[0] + (b[0] - p[0]) / lb * rr, p[1] + (b[1] - p[1]) / lb * rr];
      if (i === 0) s.moveTo(p1[0], p1[1]); else s.lineTo(p1[0], p1[1]);
      s.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
    }
    s.closePath();
    return s;
  }

  // ---------- printed page (one canvas for the whole block) ----------
  const cvs = document.createElement('canvas'), cx = cvs.getContext('2d');
  const tex = new THREE.CanvasTexture(cvs); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const F = '"Schibsted Grotesk", system-ui, sans-serif';
  const hot = { pill: null, link: null }; let hoverUI = '';
  function paint() {
    const k = Math.max(1.5, PR); cvs.width = Math.round(B.w * k); cvs.height = Math.round(B.h * k);
    cx.setTransform(k, 0, 0, k, 0, 0); cx.clearRect(0, 0, B.w, B.h);
    // nav slab
    const nh = B.navH, u = Math.max(.75, S * 1.6);
    cx.textBaseline = 'middle'; cx.fillStyle = 'rgba(242,243,247,.92)';
    cx.font = `700 ${Math.round(15 * u)}px ${F}`; cx.fillText('Portofoliu', 26 * u, nh / 2);
    cx.font = `500 ${Math.round(13 * u)}px ${F}`; cx.fillStyle = 'rgba(242,243,247,.55)';
    const st = B.w < 640 ? '1 client · 6 concepte' : '1 client real  ·  6 concepte  ·  3 modele';
    cx.textAlign = 'right'; cx.fillText(st, B.w - 26 * u, nh / 2); cx.textAlign = 'left';
    cx.fillStyle = '#FFB020'; cx.beginPath(); cx.arc(26 * u + cx.measureText('Portofoliu').width * 1.18 + 10 * u, nh / 2, 3.2 * u, 0, 7); cx.fill();
    // panel
    const ox = 0, oy = B.py - B.y, pw = B.pw, phh = B.ph;
    const big = Math.min(pw * (portrait ? .15 : .078), phh * (portrait ? .12 : .2));
    const lx = ox + pw * (portrait ? .08 : .065);
    let y = oy + phh * (portrait ? .1 : .135);
    cx.font = `600 ${Math.round(11 * u)}px ${F}`; cx.fillStyle = 'rgba(242,243,247,.42)';
    try { cx.letterSpacing = `${(2.2 * u).toFixed(1)}px`; } catch (e) {}
    cx.fillText('OHI SOLUTIONS · TÂRGU MUREȘ', lx, y);
    try { cx.letterSpacing = `${(-.045 * big).toFixed(1)}px`; } catch (e) {}
    y += big * .9;
    const g = cx.createLinearGradient(0, y, 0, y + big * 2); g.addColorStop(0, '#E4E6F0'); g.addColorStop(1, '#AEB4CC');
    cx.fillStyle = g; cx.font = `800 ${Math.round(big)}px ${F}`; cx.textBaseline = 'top';
    cx.fillText('Lucrări', lx, y); y += big * .97;
    cx.fillText('reale', lx, y);
    const rw = cx.measureText('reale').width; cx.fillStyle = '#FFB020'; cx.fillText('.', lx + rw + big * .02, y);
    y += big * 1.25;
    try { cx.letterSpacing = '0px'; } catch (e) {}
    const fs = Math.max(13, 17 * u * .8); cx.font = `400 ${Math.round(fs)}px ${F}`; cx.fillStyle = 'rgba(242,243,247,.58)';
    const lines = portrait ? ['Un client real din Mureș și concepte', 'construite de la zero.', 'Atinge sticla, apoi deschide arhiva.'] :
      ['Un client real din Mureș și concepte construite de la zero.', 'Atinge sticla, apoi deschide arhiva 3D.'];
    lines.forEach(l => { cx.fillText(l, lx, y); y += fs * 1.45; });
    y += fs * 1.1;
    // pill + link
    const bh = Math.max(36, 42 * u * .85), bw = Math.max(150, 170 * u * .85);
    cx.fillStyle = hoverUI === 'pill' ? '#FFB020' : '#F2F3F7';
    cx.beginPath(); cx.roundRect(lx, y, bw, bh, 8); cx.fill();
    cx.fillStyle = '#0B0D17'; cx.font = `700 ${Math.round(Math.max(13, 14 * u * .85))}px ${F}`; cx.textBaseline = 'middle'; cx.textAlign = 'center';
    cx.fillText('Vezi proiectele', lx + bw / 2, y + bh / 2); cx.textAlign = 'left';
    hot.pill = [lx, y, bw, bh];
    const linkX = lx + bw + 24 * Math.max(.7, u * .8);
    cx.fillStyle = hoverUI === 'link' ? '#B9C2FF' : 'rgba(242,243,247,.9)'; cx.font = `600 ${Math.round(Math.max(13, 14 * u * .85))}px ${F}`;
    const lt = 'Deschide arhiva 3D →', lw = cx.measureText(lt).width;
    let lxx = linkX, lyy = y + bh / 2;
    if (portrait && linkX + lw > pw - 20) { lxx = lx; lyy = y + bh + 26; }
    cx.fillText(lt, lxx, lyy);
    if (hoverUI === 'link') cx.fillRect(lxx, lyy + 10, lw, 1.5);
    hot.link = [lxx, lyy - 14, lw, 28];
    // footer marks
    cx.font = `500 ${Math.round(Math.max(10, 11 * u))}px ${F}`; cx.fillStyle = 'rgba(242,243,247,.34)'; cx.textBaseline = 'alphabetic';
    cx.fillText('© OHI Solutions', lx, oy + phh - 22 * Math.max(.7, u));
    cx.textAlign = 'right'; cx.fillText(coarse ? 'Târgu Mureș · 2026' : 'Trage cursorul peste sticlă', ox + pw - pw * .04, oy + phh - 22 * Math.max(.7, u)); cx.textAlign = 'left';
    tex.needsUpdate = true;
    placeDom();
  }
  function placeDom() {
    const a = document.getElementById('gsPill'), b = document.getElementById('gsLink');
    if (!hot.pill) return;
    const off = (el, r) => { el.style.left = r[0] + 'px'; el.style.top = r[1] + 'px'; el.style.width = r[2] + 'px'; el.style.height = r[3] + 'px'; };
    off(a, hot.pill); off(b, hot.link);
    layer.style.width = B.w + 'px'; layer.style.height = B.h + 'px';
  }

  // ---------- pieces ----------
  const mats = [];
  function glassMat() {
    const m = new THREE.MeshPhysicalMaterial({ color: 0x17171b, roughness: .36, metalness: 0, clearcoat: .7, clearcoatRoughness: .12, specularIntensity: .7,
      iridescence: .55, iridescenceIOR: 1.3, iridescenceThicknessRange: [250, 650], envMapIntensity: .42 });
    m.userData.u = { uPtr: { value: new THREE.Vector3(0, 0, -1e4) }, uGlow: { value: 0 }, uR: { value: 300 } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, m.userData.u);
      sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader = 'varying vec3 vWP;uniform vec3 uPtr;uniform float uGlow,uR;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\nfloat gd=distance(vWP.xy,uPtr.xy)/uR;totalEmissiveRadiance+=vec3(.42,.37,.62)*.16*exp(-1.6*gd*gd)*uGlow;');
    };
    mats.push(m); return m;
  }
  const printMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const pieces = [];
  for (let i = 0; i < 6; i++) {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), glassMat());
    const print = new THREE.Mesh(new THREE.BufferGeometry(), printMat);
    mesh.add(print); slab.add(mesh);
    pieces.push({ mesh, print, nav: i === 5, lift: 0, vl: 0, rx: 0, vrx: 0, ry: 0, vry: 0, c: [0, 0], size: 1, fly: null });
  }
  // world coords: block px (x right, y down from stage top) -> world (centered, y up)
  const toW = (x, y) => [x - W / 2, H / 2 - y];
  function build(t) {
    const P = points(t), depth = 13 * S, bev = 2.6 * S, rad = 20 * S, gapH = 7 * S;
    const polys = CELLS.map(c => c.map(k => [B.px + P[k][0] * B.pw, B.py + P[k][1] * B.ph]));
    polys.push([[B.x, B.y], [B.x + B.w, B.y], [B.x + B.w, B.y + B.navH], [B.x, B.y + B.navH]]);
    polys.forEach((poly, i) => {
      const pc = pieces[i];
      const w = inset(poly.map(p => toW(p[0], p[1])), gapH);
      let cxm = 0, cym = 0; w.forEach(p => { cxm += p[0]; cym += p[1]; }); cxm /= w.length; cym /= w.length;
      const rel = w.map(p => [p[0] - cxm, p[1] - cym]);
      const shp = shape(rel, rad);
      pc.mesh.geometry.dispose();
      pc.mesh.geometry = new THREE.ExtrudeGeometry(shp, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, curveSegments: 5 });
      pc.print.geometry.dispose();
      const g = new THREE.ShapeGeometry(shp, 5), pos = g.attributes.position, uv = new Float32Array(pos.count * 2);
      for (let j = 0; j < pos.count; j++) {
        const wx = pos.getX(j) + cxm, wy = pos.getY(j) + cym;
        const bx = wx + W / 2, by = H / 2 - wy;
        uv[j * 2] = (bx - B.x) / B.w; uv[j * 2 + 1] = 1 - (by - B.y) / B.h;
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      pc.print.geometry = g; pc.print.position.z = depth + bev + .6;
      pc.c = [cxm, cym]; pc.size = Math.max(...rel.map(p => Math.hypot(p[0], p[1])));
    });
  }

  // ---------- input ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let hovered = null;
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    ptr.tnx = x / W * 2 - 1; ptr.tny = 1 - y / H * 2; ptr.ton = 1;
    ptr.x = (x - B.px) / B.pw; ptr.y = (y - B.py) / B.ph; if (portrait) { const t = ptr.x; ptr.x = ptr.y; ptr.y = t; }
    ndc.set(ptr.tnx, ptr.tny);
    const bx = x - B.x, by = y - B.y, inR = r4 => r4 && bx > r4[0] && bx < r4[0] + r4[2] && by > r4[1] && by < r4[1] + r4[3];
    const hv = inR(hot.pill) ? 'pill' : inR(hot.link) ? 'link' : '';
    if (hv !== hoverUI) { hoverUI = hv; paint(); }
  });
  stage.addEventListener('pointerleave', () => { ptr.ton = 0; ptr.tnx = 0; ptr.tny = 0; hovered = null; if (hoverUI) { hoverUI = ''; paint(); } });

  // ---------- shatter / back ----------
  let state = 'in', T0 = 0; const DUR = .72;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function plan() {
    pieces.forEach((p, i) => {
      const dx = p.c[0], dy = p.c[1], l = Math.hypot(dx, dy) || 1;
      const ax = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-.4, .4)).normalize();
      p.fly = { v: [dx / l * rnd(260, 520) * S * 2.2, dy / l * rnd(160, 360) * S * 2 - rnd(100, 260) * S, rnd(420, 800) * S * 2.4], ax, ang: rnd(2, 3.6) * (Math.random() < .5 ? -1 : 1),
        delay: p.nav ? 0 : .03 + (i * .03) };
    });
  }
  let pos01 = 1;     // 1 = assembled, 0 = scattered
  let dir = 0;       // -1 shattering, +1 assembling
  function shatter() { if (state !== 'in') return; plan(); state = 'out'; dir = -1; T0 = performance.now(); stage.classList.add('gs-open'); start(); }
  function back() { if (state !== 'gone') return; state = 'in'; dir = 1; T0 = performance.now(); stage.classList.remove('gs-open'); mount.style.visibility = ''; start(); }
  document.getElementById('gsLink').addEventListener('click', e => { e.preventDefault(); shatter(); });
  document.getElementById('gsBack').addEventListener('click', back);
  addEventListener('keydown', e => { if (e.key === 'Escape' && state === 'gone' && !document.body.classList.contains('lit')) back(); });
  const easeIn = t => t * t * t, easeOutBack = t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const q = new THREE.Quaternion();

  // ---------- loop ----------
  let running = false, visible = true, last = performance.now(), lastBuild = 0;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(stage);
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  function frame(now) {
    if (!visible || document.hidden) { running = false; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
    const k = 1 - Math.exp(-dt / .3);
    ptr.nx += (ptr.tnx - ptr.nx) * k; ptr.ny += (ptr.tny - ptr.ny) * k; ptr.on += (ptr.ton - ptr.on) * k;
    slab.rotation.y = THREE.MathUtils.degToRad(ptr.nx * 7 - 1.2);
    slab.rotation.x = THREE.MathUtils.degToRad(-ptr.ny * 5.5 + .8);
    if (state === 'in' && dir === 0 && (now - lastBuild > (coarse ? 1e9 : 22))) { build(t); lastBuild = now; }
    // hover pick
    slab.updateMatrixWorld();
    if (state === 'in' && dir === 0 && ptr.ton && !coarse) {
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pieces.map(p => p.mesh), false)[0];
      hovered = hit ? pieces.find(p => p.mesh === hit.object) : null;
      if (hit) { const lp = slab.worldToLocal(hit.point.clone()); mats.forEach(m => m.userData.u.uPtr.value.set(lp.x, lp.y, 0)); }
    } else hovered = null;
    mats.forEach(m => { const u = m.userData.u; u.uGlow.value += ((ptr.ton && state === 'in' ? 1 : 0) - u.uGlow.value) * k; u.uR.value = 300 * S; });
    // springs
    pieces.forEach(p => {
      const isH = p === hovered;
      let tl = 0, trx = 0, try_ = 0;
      if (isH) {
        tl = (p.nav ? 32 : 50) * S;
        const dx = (mats[0].userData.u.uPtr.value.x - p.c[0]) / p.size, dy = (mats[0].userData.u.uPtr.value.y - p.c[1]) / p.size;
        try_ = THREE.MathUtils.clamp(dx * .3, -.24, .24) * (p.nav ? .4 : 1); trx = THREE.MathUtils.clamp(-dy * .3, -.24, .24);
      }
      const spring = (x, v, tg) => { const a = 170 * (tg - x) - 19 * v; v += a * dt; return [x + v * dt, v]; };
      [p.lift, p.vl] = spring(p.lift, p.vl, tl); [p.rx, p.vrx] = spring(p.rx, p.vrx, trx); [p.ry, p.vry] = spring(p.ry, p.vry, try_);
      const m = p.mesh.material; const hk = isH ? 1 : 0;
      m.iridescence += ((.55 + .45 * hk) - m.iridescence) * k; m.envMapIntensity += ((.42 + .4 * hk) - m.envMapIntensity) * k;
    });
    // fly
    let done = true;
    pieces.forEach(p => {
      let e = 0;
      if (dir !== 0 || state === 'gone') {
        const el = (now - T0) / 1000 - (p.fly ? p.fly.delay : 0);
        const tt = THREE.MathUtils.clamp(el / DUR, 0, 1);
        if (tt < 1) done = false;
        e = dir === -1 ? easeIn(tt) : dir === 1 ? 1 - easeOutBack(tt) : 1;
        if (state === 'gone') e = 1;
      }
      p.mesh.position.set(p.c[0], p.c[1], p.lift);
      p.mesh.rotation.set(p.rx, p.ry, 0);
      if (e > 0 && p.fly) {
        const f = p.fly, s = e * DUR;
        p.mesh.position.x += f.v[0] * s; p.mesh.position.y += f.v[1] * s - 900 * S * s * s; p.mesh.position.z += f.v[2] * s;
        q.setFromAxisAngle(f.ax, f.ang * e); p.mesh.quaternion.multiply(q);
      }
    });
    if (dir === -1 && done) { dir = 0; state = 'gone'; }
    if (dir === 1 && done) { dir = 0; pieces.forEach(p => p.fly = null); }
    homography();
    renderer.render(scene, camera);
    if (state === 'gone') { mount.style.visibility = 'hidden'; running = false; return; }
    requestAnimationFrame(frame);
  }

  // DOM copy of the links, mapped onto the tilted slab so the hit areas follow it
  const v3 = new THREE.Vector3();
  function proj(x, y) { const [wx, wy] = toW(x, y); v3.set(wx, wy, 13 * S + 2.6 * S); slab.localToWorld(v3); v3.project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }
  function adj(m) { return [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]]; }
  function mm(a, b) { const c = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]; c[3 * i + j] = s; } return c; }
  function mv(m, v) { return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]; }
  function basis(p) { const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1]; const v = mv(adj(m), [p[3][0], p[3][1], 1]); return mm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); }
  function homography() {
    if (state !== 'in') return;
    const src = [[0, 0], [B.w, 0], [0, B.h], [B.w, B.h]];
    const dst = [proj(B.x, B.y), proj(B.x + B.w, B.y), proj(B.x, B.y + B.h), proj(B.x + B.w, B.y + B.h)];
    const t = mm(basis(dst), adj(basis(src))); for (let i = 0; i < 9; i++) t[i] /= t[8];
    layer.style.transform = `matrix3d(${t[0]},${t[3]},0,${t[6]},${t[1]},${t[4]},0,${t[7]},0,0,1,0,${t[2]},${t[5]},0,${t[8]})`;
  }

  addEventListener('resize', () => { layout(); build(performance.now() / 1000); start(); });
  const go = () => {
    layout(); build(0);
    // enter with the same fly-in
    plan(); state = 'in'; dir = 1; T0 = performance.now(); stage.classList.add('gs-ready'); start();
  };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(go); else go();
}
