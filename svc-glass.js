// Services hero: the page is cut into thick smoked-glass shards, one service printed on each.
// The slab tilts toward the pointer, the shard under it lifts. Click a shard: the glass shatters and that
// service opens; "Înapoi" puts the glass back together. three.js r160 (MIT, /vendor/three).
import * as THREE from 'three';
import { RoomEnvironment } from '/vendor/three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('svStage');
const mount = document.getElementById('svCv');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const items = [...document.querySelectorAll('.sv-item')].map(a => ({ n: a.dataset.n, t: a.dataset.t, s: a.dataset.s, soon: a.classList.contains('soon') }));

let renderer = null;
try { if (!calm) renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { renderer = null; }
if (renderer) init();

function init() {
  const PR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  mount.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(renderer), .04).texture;
  const key = new THREE.DirectionalLight(0xe8deff, 1.1); key.position.set(-1, 1.2, 1.4); scene.add(key);
  const warm = new THREE.DirectionalLight(0xffa06a, .55); warm.position.set(1.2, -1, .8); scene.add(warm);
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 20000);
  const slab = new THREE.Group(); scene.add(slab);

  // ---------- layout ----------
  let W = 1, H = 1, S = 1, B = {}, portrait = false;
  const HD = 76;
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.position.set(0, 0, (H / 2) / Math.tan(THREE.MathUtils.degToRad(15))); camera.updateProjectionMatrix();
    const mx = W < 700 ? 12 : W * .05, top = HD + (W < 700 ? 8 : H * .025), bot = W < 700 ? 64 : H * .085;
    const bw = W - 2 * mx, bh = H - top - bot;
    portrait = bw / bh < 1;
    S = Math.max(.42, bw / 1730);
    const navH = Math.max(52, bh * .11), gap = 14 * S;
    B = { x: mx, y: top, w: bw, h: bh, navH, gap, px: mx, py: top + navH + gap, pw: bw, ph: bh - navH - gap };
    paint();
  }

  // ---------- cut pattern: five even cells, one per service ----------
  const base = {
    TL: [0, 0], TR: [1, 0], BR: [1, 1], BL: [0, 1],
    tAB: [.31, 0], tBC: [.56, 0], tCE: [.785, 0], bAD: [.37, 1], bDE: [.72, 1],
    J0: [.335, .6], J1: [.525, .5], J2: [.755, .47]
  };
  const CELLS = [['TL', 'tAB', 'J0', 'bAD', 'BL'], ['tAB', 'tBC', 'J1', 'J0'], ['tBC', 'tCE', 'J2', 'J1'], ['J0', 'J1', 'J2', 'bDE', 'bAD'], ['tCE', 'TR', 'BR', 'bDE', 'J2']];
  // which service sits on which cell (0..4 → items index)
  const CELL_ITEM = [0, 1, 2, 3, 4];
  const ph = {}; Object.keys(base).forEach((k, i) => ph[k] = [i * 1.7, 10 + (i * 3.1) % 10, 12 + (i * 4.3) % 8]);
  const ptr = { x: .5, y: .5, on: 0, ton: 0, nx: 0, ny: 0, tnx: 0, tny: 0 };
  function points(t, still) {
    const P = {};
    for (const k in base) {
      let [x, y] = base[k];
      const corner = (x === 0 || x === 1) && (y === 0 || y === 1);
      if (!corner && !still) {
        const [p0, px, py] = ph[k];
        x += .018 * Math.sin(t * 2 * Math.PI / px + p0);
        if (y > 0 && y < 1) y += .03 * Math.sin(t * 2 * Math.PI / py + p0 * 1.3);
        const dx = x - ptr.x, dy = (y - ptr.y) * (B.ph / B.pw), d = Math.hypot(dx, dy);
        if (d < .5 && d > 1e-4) { const f = (1 - d / .5) * .035 * ptr.on; x += dx / d * f; if (y > 0 && y < 1) y += dy / d * f; }
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
      lines.push([a[0] - ey * sgn * d, a[1] + ex * sgn * d, ex, ey]);
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
  function inside(poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  // biggest-ish rectangle that fits in a cell, grown from its centre
  function textBox(poly) {
    let cx0 = 0, cy0 = 0; poly.forEach(p => { cx0 += p[0]; cy0 += p[1]; }); cx0 /= poly.length; cy0 /= poly.length;
    const ok = (l, t, r, b) => [[l, t], [r, t], [l, b], [r, b], [(l + r) / 2, t], [(l + r) / 2, b], [l, (t + b) / 2], [r, (t + b) / 2]].every(p => inside(poly, p[0], p[1]));
    let l = cx0 - 2, r = cx0 + 2, t = cy0 - 2, b = cy0 + 2, grew = true, step = 3;
    while (grew) {
      grew = false;
      if (ok(l - step, t, r, b)) { l -= step; grew = true; }
      if (ok(l, t, r + step, b)) { r += step; grew = true; }
      if (ok(l, t - step, r, b)) { t -= step; grew = true; }
      if (ok(l, t, r, b + step)) { b += step; grew = true; }
    }
    return { x: l, y: t, w: r - l, h: b - t };
  }

  // ---------- printed page ----------
  const cvs = document.createElement('canvas'), cx = cvs.getContext('2d');
  const tex = new THREE.CanvasTexture(cvs); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const F = 'Inter, "Schibsted Grotesk", system-ui, sans-serif', SERIF = '"Instrument Serif", Georgia, serif';
  let hoverCell = -1;
  function wrap(text, maxW) {
    const words = text.split(' '), lines = []; let line = '';
    words.forEach(w => { const tst = line ? line + ' ' + w : w; if (cx.measureText(tst).width > maxW && line) { lines.push(line); line = w; } else line = tst; });
    if (line) lines.push(line); return lines;
  }
  function paint() {
    const k = Math.max(1.5, PR); cvs.width = Math.round(B.w * k); cvs.height = Math.round(B.h * k);
    cx.setTransform(k, 0, 0, k, 0, 0); cx.clearRect(0, 0, B.w, B.h);
    const u = Math.max(.72, S * 1.55);
    // nav slab
    const nh = B.navH; cx.textBaseline = 'middle';
    cx.fillStyle = 'rgba(244,241,255,.95)'; cx.font = `700 ${Math.round(17 * u)}px ${F}`; cx.fillText('Servicii', 26 * u, nh / 2);
    const tw = cx.measureText('Servicii').width;
    cx.fillStyle = '#FF6B1A'; cx.beginPath(); cx.arc(26 * u + tw + 9 * u, nh / 2 + 4 * u, 3.4 * u, 0, 7); cx.fill();
    cx.font = `500 ${Math.round(13 * u)}px ${F}`; cx.fillStyle = 'rgba(244,241,255,.55)'; cx.textAlign = 'right';
    cx.fillText(B.w < 640 ? '5 servicii · plată unică' : 'Cinci servicii  ·  plată unică, de la 500 lei  ·  demo gratuit', B.w - 26 * u, nh / 2); cx.textAlign = 'left';
    // one service per cell
    const P = points(0, true), oy = B.py - B.y;
    CELLS.forEach((c, ci) => {
      const it = items[CELL_ITEM[ci]]; if (!it) return;
      const poly = inset(c.map(key => [P[key][0] * B.pw, oy + P[key][1] * B.ph]), 26 * S + 10);
      const bx = textBox(poly), pad = Math.min(bx.w, bx.h) * .06;
      const x = bx.x + pad, w = bx.w - pad * 2;
      const hot = hoverCell === ci;
      let fsT = Math.max(17, Math.min(w / 6.4, bx.h / 4.4, 54 * u));
      cx.textBaseline = 'top';
      cx.font = `400 ${Math.round(fsT)}px ${SERIF}`;
      let tl = wrap(it.t, w);
      while (tl.length > 3 && fsT > 16) { fsT -= 2; cx.font = `400 ${Math.round(fsT)}px ${SERIF}`; tl = wrap(it.t, w); }
      let fsS, sl, fsN, blockH, guard = 0;
      const measure = () => { fsS = Math.max(10.5, Math.min(fsT * .36, 16 * u)); cx.font = `400 ${Math.round(fsS)}px ${F}`; sl = wrap(it.s, w).slice(0, 3);
        fsN = Math.max(10, fsT * .3); blockH = fsN * 1.8 + tl.length * fsT * 1.02 + fsS * .9 + sl.length * fsS * 1.45 + fsS * 2.4; };
      measure();
      while (blockH > bx.h - pad && guard++ < 30) {
        if (sl.length > 1 && fsT < 22) { it._short = true; }
        fsT = Math.max(13, fsT - 1.5); cx.font = `400 ${Math.round(fsT)}px ${SERIF}`; tl = wrap(it.t, w); measure();
        if (fsT <= 13) { sl = sl.slice(0, 1); blockH = fsN * 1.8 + tl.length * fsT * 1.02 + fsS * 3.8; break; }
      }
      let y = bx.y + Math.max(pad, (bx.h - blockH) / 2);
      cx.font = `700 ${Math.round(fsN)}px ${F}`; cx.fillStyle = hot ? '#FF8A4C' : 'rgba(255,138,76,.85)';
      try { cx.letterSpacing = `${(fsN * .12).toFixed(1)}px`; } catch (e) {}
      cx.fillText(it.n + (it.soon ? '  ·  ÎN CURÂND' : ''), x, y); y += fsN * 1.8;
      try { cx.letterSpacing = '0px'; } catch (e) {}
      const g = cx.createLinearGradient(0, y, 0, y + tl.length * fsT); g.addColorStop(0, '#F7F4FF'); g.addColorStop(1, '#CFC6F2');
      cx.fillStyle = g; cx.font = `400 ${Math.round(fsT)}px ${SERIF}`;
      tl.forEach(l => { cx.fillText(l, x, y); y += fsT * 1.02; });
      y += fsS * .9;
      cx.font = `400 ${Math.round(fsS)}px ${F}`; cx.fillStyle = 'rgba(244,241,255,.62)';
      sl.forEach(l => { cx.fillText(l, x, y); y += fsS * 1.45; });
      y += fsS * .9;
      cx.font = `600 ${Math.round(fsS)}px ${F}`; cx.fillStyle = hot ? '#FFB27A' : '#FF8A4C';
      const lt = 'Vezi detalii →'; cx.fillText(lt, x, y);
      if (hot) cx.fillRect(x, y + fsS * 1.15, cx.measureText(lt).width, 1.5);
    });
    tex.needsUpdate = true;
  }

  // ---------- pieces ----------
  const mats = [];
  function glassMat() {
    const m = new THREE.MeshPhysicalMaterial({ color: 0x1a1430, roughness: .34, metalness: 0, clearcoat: .7, clearcoatRoughness: .12, specularIntensity: .7,
      iridescence: .55, iridescenceIOR: 1.3, iridescenceThicknessRange: [250, 650], envMapIntensity: .42 });
    m.userData.u = { uPtr: { value: new THREE.Vector3(0, 0, -1e4) }, uGlow: { value: 0 }, uR: { value: 300 } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, m.userData.u);
      sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader = 'varying vec3 vWP;uniform vec3 uPtr;uniform float uGlow,uR;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\nfloat gd=distance(vWP.xy,uPtr.xy)/uR;totalEmissiveRadiance+=mix(vec3(.5,.36,.95),vec3(1.,.45,.15),.35)*.16*exp(-1.6*gd*gd)*uGlow;');
    };
    mats.push(m); return m;
  }
  const printMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const pieces = [];
  for (let i = 0; i < 6; i++) {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), glassMat());
    const print = new THREE.Mesh(new THREE.BufferGeometry(), printMat);
    mesh.add(print); slab.add(mesh);
    pieces.push({ mesh, print, nav: i === 5, cell: i < 5 ? i : -1, lift: 0, vl: 0, rx: 0, vrx: 0, ry: 0, vry: 0, c: [0, 0], size: 1, fly: null });
  }
  const toW = (x, y) => [x - W / 2, H / 2 - y];
  function build(t) {
    const P = points(t, coarse), depth = 13 * S, bev = 2.6 * S, rad = 20 * S, gapH = 7 * S;
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
        const bx = pos.getX(j) + cxm + W / 2, by = H / 2 - (pos.getY(j) + cym);
        uv[j * 2] = (bx - B.x) / B.w; uv[j * 2 + 1] = 1 - (by - B.y) / B.h;
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      pc.print.geometry = g; pc.print.position.z = depth + bev + .6;
      pc.c = [cxm, cym]; pc.size = Math.max(...rel.map(p => Math.hypot(p[0], p[1])));
    });
  }

  // ---------- input ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let hovered = null;
  function pick(clientX, clientY) {
    const r = stage.getBoundingClientRect();
    ndc.set((clientX - r.left) / W * 2 - 1, 1 - (clientY - r.top) / H * 2);
    slab.updateMatrixWorld(); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pieces.map(p => p.mesh), false)[0];
    return hit ? { p: pieces.find(p => p.mesh === hit.object), point: hit.point } : null;
  }
  stage.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    ptr.tnx = x / W * 2 - 1; ptr.tny = 1 - y / H * 2; ptr.ton = 1;
    ptr.x = (x - B.px) / B.pw; ptr.y = (y - B.py) / B.ph; if (portrait) { const t = ptr.x; ptr.x = ptr.y; ptr.y = t; }
    ndc.set(ptr.tnx, ptr.tny);
  });
  stage.addEventListener('pointerleave', () => { ptr.ton = 0; ptr.tnx = 0; ptr.tny = 0; hovered = null; setHover(-1); });
  function setHover(c) { if (c !== hoverCell) { hoverCell = c; paint(); stage.style.cursor = c >= 0 ? 'pointer' : ''; } }
  let down = null;
  stage.addEventListener('pointerdown', e => { if (state === 'in' && dir === 0 && !e.target.closest('button,a')) down = [e.clientX, e.clientY]; });
  stage.addEventListener('pointerup', e => {
    if (!down) return; const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null;
    if (moved > 12 || state !== 'in' || dir !== 0) return;
    const h = pick(e.clientX, e.clientY);
    if (h && h.p.cell >= 0) open(CELL_ITEM[h.p.cell]);
  });

  // ---------- shatter / back ----------
  let state = 'in', T0 = 0, dir = 0; const DUR = .72;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function plan(focus) {
    pieces.forEach((p, i) => {
      const dx = p.c[0], dy = p.c[1], l = Math.hypot(dx, dy) || 1;
      const ax = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-.4, .4)).normalize();
      p.fly = { v: [dx / l * rnd(260, 520) * S * 2.2, dy / l * rnd(160, 360) * S * 2 - rnd(100, 260) * S, rnd(420, 800) * S * 2.4], ax, ang: rnd(2, 3.6) * (Math.random() < .5 ? -1 : 1),
        delay: p.nav ? 0 : p.cell === focus ? .12 : .03 + (i * .03) };
    });
  }
  const api = window.__svGlass = {
    shatter(focus) { if (state !== 'in') return false; plan(focus); state = 'out'; dir = -1; T0 = performance.now(); start(); return true; },
    back() { if (state !== 'gone' && state !== 'out') return; state = 'in'; dir = 1; T0 = performance.now(); mount.style.visibility = ''; start(); }
  };
  function open(i) { if (window.__svOpen) window.__svOpen(i, true); }
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
    slab.rotation.y = THREE.MathUtils.degToRad(ptr.nx * 6 - 1);
    slab.rotation.x = THREE.MathUtils.degToRad(-ptr.ny * 4.5 + .8);
    if (state === 'in' && dir === 0 && (now - lastBuild > (coarse ? 1e9 : 24))) { build(t); lastBuild = now; }
    slab.updateMatrixWorld();
    if (state === 'in' && dir === 0 && ptr.ton && !coarse) {
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pieces.map(p => p.mesh), false)[0];
      hovered = hit ? pieces.find(p => p.mesh === hit.object) : null;
      if (hit) { const lp = slab.worldToLocal(hit.point.clone()); mats.forEach(m => m.userData.u.uPtr.value.set(lp.x, lp.y, 0)); }
      setHover(hovered && hovered.cell >= 0 ? hovered.cell : -1);
    } else hovered = null;
    mats.forEach(m => { const u = m.userData.u; u.uGlow.value += ((ptr.ton && state === 'in' ? 1 : 0) - u.uGlow.value) * k; u.uR.value = 300 * S; });
    pieces.forEach(p => {
      const isH = p === hovered;
      let tl = 0, trx = 0, try_ = 0;
      if (isH) {
        tl = (p.nav ? 26 : 50) * S;
        const dx = (mats[0].userData.u.uPtr.value.x - p.c[0]) / p.size, dy = (mats[0].userData.u.uPtr.value.y - p.c[1]) / p.size;
        try_ = THREE.MathUtils.clamp(dx * .3, -.22, .22) * (p.nav ? .4 : 1); trx = THREE.MathUtils.clamp(-dy * .3, -.22, .22);
      }
      const spring = (x, v, tg) => { const a = 170 * (tg - x) - 19 * v; v += a * dt; return [x + v * dt, v]; };
      [p.lift, p.vl] = spring(p.lift, p.vl, tl); [p.rx, p.vrx] = spring(p.rx, p.vrx, trx); [p.ry, p.vry] = spring(p.ry, p.vry, try_);
      const m = p.mesh.material, hk = isH ? 1 : 0;
      m.iridescence += ((.55 + .45 * hk) - m.iridescence) * k; m.envMapIntensity += ((.42 + .4 * hk) - m.envMapIntensity) * k;
    });
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
    renderer.render(scene, camera);
    if (state === 'gone') { mount.style.visibility = 'hidden'; running = false; return; }
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { layout(); build(performance.now() / 1000); start(); });
  const go = () => { layout(); build(0); plan(-1); state = 'in'; dir = 1; T0 = performance.now(); stage.classList.add('sv-ready'); start(); };
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(go); else go();
}
