/* Orobianco hero: a candle-lit table, rendered live (three.js). Blurred real salon photo behind. */
import * as THREE from './three/three.module.js';
import { RoomEnvironment } from './three/RoomEnvironment.js';

const canvas = document.getElementById('table3d');
const B = document.documentElement.dataset.base || '/demo/orobianco/';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { document.documentElement.classList.add('no3d'); }
if (renderer) {
  const mobile = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.6 : 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environment = env;

  const camera = new THREE.PerspectiveCamera(mobile ? 42 : 30, 1, .05, 60);
  function size() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', size); size();

  /* light: warm candle + soft key + cool rim */
  scene.add(new THREE.HemisphereLight(0xffe7c7, 0x0d0907, .12));
  const key = new THREE.SpotLight(0xffdcae, 46, 12, .42, .85, 1.5); key.position.set(-.6, 4.4, 1.4); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0004; key.shadow.radius = 6; scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9fb4ff, .55); rim.position.set(3, 2, -3); scene.add(rim);
  const candleL = new THREE.PointLight(0xff9a3c, 7, 3.6, 1.6); candleL.castShadow = !mobile; candleL.shadow.mapSize.set(512, 512); scene.add(candleL);

  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

  /* dark walnut table that fades into the blurred room */
  const wood = tex(1024, 1024, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#2b1a10'); g.addColorStop(.5, '#3a2416'); g.addColorStop(1, '#2a190f'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const y = Math.random() * h; x.strokeStyle = `rgba(${Math.random() < .5 ? '15,8,4' : '90,60,36'},${.12 + Math.random() * .2})`; x.lineWidth = .6 + Math.random() * 2.2; x.beginPath(); x.moveTo(0, y); for (let k = 0; k <= w; k += 32) x.lineTo(k, y + Math.sin(k * .01 + i) * 6 + Math.sin(k * .043 + i * 2) * 2); x.stroke(); } });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(1.4, 1.4);
  const fade = tex(512, 512, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, w * .12, w / 2, h / 2, w * .5); g.addColorStop(0, '#fff'); g.addColorStop(.62, '#ddd'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  fade.colorSpace = THREE.NoColorSpace;
  const table = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshPhysicalMaterial({ map: wood, alphaMap: fade, transparent: true, roughness: .38, clearcoat: .8, clearcoatRoughness: .25, envMapIntensity: .35 }));
  table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
  /* linen runner under the plate */
  const run = new THREE.Mesh(new THREE.CircleGeometry(1.02, 96), new THREE.MeshStandardMaterial({ color: 0xece3d3, roughness: .95, envMapIntensity: .3 })); run.rotation.x = -Math.PI / 2; run.position.y = .002; run.receiveShadow = true; scene.add(run);
  /* plate: lathe profile, glazed porcelain with gold rim */
  const pp = [[0, 0], [.42, 0], [.46, .012], [.5, .03], [.56, .04], [.72, .055], [.8, .075], [.82, .08], [.815, .088], [.72, .07], [.56, .056], [.5, .046], [.0, .046]].map(p => new THREE.Vector2(p[0], p[1]));
  const plate = new THREE.Mesh(new THREE.LatheGeometry(pp, 96), new THREE.MeshPhysicalMaterial({ color: 0xfbf8f2, roughness: .18, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: .9 }));
  plate.castShadow = true; plate.receiveShadow = true; scene.add(plate);
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xd7b36c, metalness: 1, roughness: .22, envMapIntensity: 1.4 });
  const rimRing = new THREE.Mesh(new THREE.TorusGeometry(.785, .006, 8, 160), goldMat); rimRing.rotation.x = Math.PI / 2; rimRing.position.y = .079; scene.add(rimRing);
  /* the dish: real photo cut-out, gently domed so it catches light */
  const dishGeo = new THREE.CircleGeometry(.5, 64); { const pos = dishGeo.attributes.position; for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)); pos.setZ(i, (1 - (r / .5) ** 2) * .07); } dishGeo.computeVertexNormals(); }
  const dishTex = new THREE.TextureLoader().load(B + 'img/hd/pasta-mare.webp', t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  const dish = new THREE.Mesh(dishGeo, new THREE.MeshStandardMaterial({ map: dishTex, transparent: true, alphaTest: .05, roughness: .55, envMapIntensity: .5 }));
  dish.rotation.x = -Math.PI / 2; dish.rotation.z = .4; dish.position.y = .05; dish.scale.set(1.12, 1, 1); dish.castShadow = true; scene.add(dish);

  /* wine glass: thin crystal (transmission) + red wine */
  const gp = [[0, 0], [.2, 0], [.21, .006], [.2, .012], [.04, .02], [.022, .04], [.018, .45], [.03, .5], [.12, .56], [.2, .66], [.24, .78], [.245, .9], [.235, 1.02], [.22, 1.1]];
  const outer = gp.map(p => new THREE.Vector2(p[0], p[1])), inner = gp.slice(7).reverse().map(p => new THREE.Vector2(Math.max(0, p[0] - .008), p[1] + .004));
  const glassGeo = new THREE.LatheGeometry(outer.concat(inner), 96);
  // clear crystal: see-through in the middle, bright only at the edges (fresnel), like real glass against a dark room
  const glassMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { tint: { value: new THREE.Color(0xfff3e2) } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 tint; varying vec3 vN; varying vec3 vV; void main(){ float f = 1. - abs(dot(normalize(vN), normalize(vV))); float a = .025 + pow(f, 3.2) * .85; float hl = smoothstep(.55, .6, vN.x) * smoothstep(.8, .6, vN.x) * .35; gl_FragColor = vec4(tint, clamp(a + hl, 0., .95)); }'
  });
  const glass = new THREE.Mesh(glassGeo, glassMat); glass.position.set(mobile ? .62 : 1.32, 0, mobile ? -.95 : -.35); glass.renderOrder = 2; scene.add(glass);
  const wp = [[0, .53], [.1, .565], [.18, .64], [.215, .72], [0, .72]].map(p => new THREE.Vector2(p[0], p[1]));
  const wine = new THREE.Mesh(new THREE.LatheGeometry(wp, 64), new THREE.MeshPhysicalMaterial({ color: 0x5a0a16, roughness: .12, clearcoat: .6, clearcoatRoughness: .08, envMapIntensity: .55 }));
  wine.position.copy(glass.position); scene.add(wine);

  /* candle in a brass holder */
  const candle = new THREE.Group(); candle.position.set(mobile ? -.8 : -1.4, 0, mobile ? -.85 : -.25); scene.add(candle);
  const holder = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.12, 0], [.13, .01], [.07, .03], [.05, .06], [.075, .09], [.075, .1], [0, .1]].map(p => new THREE.Vector2(p[0], p[1])), 48), goldMat); holder.castShadow = true; candle.add(holder);
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(.045, .048, .42, 32), new THREE.MeshPhysicalMaterial({ color: 0xf6efe2, roughness: .45, transmission: .25, thickness: .2, sheen: .3 })); wax.position.y = .31; wax.castShadow = true; candle.add(wax);
  const flameTex = tex(128, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * .62, 2, w / 2, h * .58, w * .5); g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(.25, 'rgba(255,214,120,.95)'); g.addColorStop(.6, 'rgba(255,140,40,.45)'); g.addColorStop(1, 'rgba(255,90,0,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, 4); x.bezierCurveTo(w * .95, h * .5, w * .8, h * .95, w / 2, h - 4); x.bezierCurveTo(w * .2, h * .95, w * .05, h * .5, w / 2, 4); x.fill(); });
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); flame.scale.set(.1, .22, 1); flame.position.y = .62; candle.add(flame);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(128, 128, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,180,90,.55)'); g.addColorStop(1, 'rgba(255,150,60,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(1.1, 1.1, 1); halo.position.y = .6; candle.add(halo);
  candleL.position.set(candle.position.x, .62, candle.position.z);

  /* cutlery: polished steel */
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xdedede, metalness: 1, roughness: .12, envMapIntensity: 1.5 });
  const knife = new THREE.Group(); { const handle = new THREE.Mesh(new THREE.CapsuleGeometry(.018, .3, 6, 16), steel); handle.rotation.z = Math.PI / 2; handle.position.x = -.17; const blade = new THREE.Mesh(new THREE.BoxGeometry(.32, .004, .045), steel); blade.position.x = .16; knife.add(handle, blade); }
  knife.rotation.y = Math.PI / 2 + .04; knife.position.set(.98, .02, .3); knife.traverse(o => o.castShadow = true); scene.add(knife);
  const fork = new THREE.Group(); { const handle = new THREE.Mesh(new THREE.CapsuleGeometry(.017, .3, 6, 16), steel); handle.rotation.z = Math.PI / 2; handle.position.x = -.17; fork.add(handle);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(.08, .006, .05), steel); neck.position.x = .04; fork.add(neck);
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(.13, .005, .008), steel); t.position.set(.14, 0, -.021 + i * .014); fork.add(t); } }
  fork.rotation.y = Math.PI / 2 - .05; fork.position.set(-.98, .02, .3); fork.traverse(o => o.castShadow = true); scene.add(fork);

  /* camera rig */
  const look = new THREE.Vector3(0, mobile ? .55 : .42, -.05);
  const base = mobile ? { r: 5.6, h: 3.3, a: 0 } : { r: 3.9, h: 1.75, a: 0 };
  let tx = 0, ty = 0, mx = 0, my = 0, sp = 0;
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; } }, { passive: true });
  addEventListener('deviceorientation', e => { if (e.gamma == null) return; tx = Math.max(-.5, Math.min(.5, e.gamma / 50)); ty = Math.max(-.5, Math.min(.5, (e.beta - 45) / 60)); }, { passive: true });
  const hero = canvas.closest('section');
  const clock = new THREE.Clock(); let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
  let t0 = null;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    if (t0 === null) t0 = t;
    const intro = RM ? 1 : Math.min(1, (t - t0) / 3.2), ei = 1 - Math.pow(1 - intro, 3);
    const k = 1 - Math.exp(-dt * 2.4); mx += (tx - mx) * k; my += (ty - my) * k;
    sp += ((Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * .9)))) - sp) * (1 - Math.exp(-dt * 6));
    const drift = RM ? 0 : Math.sin(t * .12) * .16;
    const a = base.a + drift + mx * .45 + (1 - ei) * -.9;
    const r = (base.r + (1 - ei) * 2.2) * (1 - sp * .55);
    const h = base.h + (1 - ei) * 1.2 - my * .35 - sp * .9;
    camera.position.set(Math.sin(a) * r, h, Math.cos(a) * r);
    const lk = look.clone().lerp(glass.position.clone().setY(.62), sp * .9);
    camera.lookAt(lk);
    /* candle flicker */
    const fl = RM ? 1 : .86 + Math.sin(t * 13) * .05 + Math.sin(t * 23 + 1.3) * .04 + (Math.random() - .5) * .06;
    candleL.intensity = 7 * fl; flame.scale.set(.1 * (1 + (fl - 1) * .6), .22 * fl, 1); flame.position.x = Math.sin(t * 7) * .004; halo.material.opacity = .7 + (fl - .86) * 1.4;
    renderer.render(scene, camera);
  }
  frame();
  canvas.classList.add('on');
}
