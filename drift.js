// Hero B: huge words curve in from the lower right, pass behind a phone that shows a site scrolling,
// then two short panels. Raw WebGL2, no libraries. Structure adapted from a scroll-hero recipe; visuals are OHI's own.
(function () {
  const $ = id => document.getElementById(id);
  const track = $('drTrack'), cv = $('drGl');
  if (!track || !cv) return;
  const gl = cv.getContext('webgl2', { alpha: false, antialias: true, premultipliedAlpha: true });
  if (!gl) { track.classList.add('dr-nogl'); return; }

  const WORDS = ['OHI', 'SITE-URI', 'CARE ADUC', 'CLIENȚI', 'DIN MUREȘ'];
  const SCREENS = ['/exemple/img/cofetarie.webp', '/exemple/img/frizerie.webp', '/exemple/img/service-auto.webp'];
  const STEP = .14, GAP = 3.4, RADIUS = 9, CAM = 11, FOCAL = 8.14, K = 1.18;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const ease = x => x * x * x * (x * (6 * x - 15) + 10);
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  function program(vs, fs, names) {
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, '#version 300 es\nprecision highp float;\n' + s); gl.compileShader(o);
      if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    const u = {}; names.forEach(n => u[n] = gl.getUniformLocation(p, n)); return { p, u };
  }
  const QUAD = `out vec2 v;void main(){vec2 c=vec2((gl_VertexID<<1)&2,gl_VertexID&2);v=c;gl_Position=vec4(c*2.-1.,0,1);}`;

  // night sky drawn in code: navy, a drifting cobalt glow, a warm amber floor, fine grain
  const skyP = program(QUAD, `in vec2 v;uniform vec3 C;out vec4 O;
    float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}
    void main(){
      vec2 p=v; p.x=(p.x-.5)*C.x+.5;
      vec3 c=vec3(.027,.031,.051);
      vec2 g1=vec2(.5+.18*sin(C.y*.9+C.z*.2),.62+.05*cos(C.z*.17));
      c+=vec3(.20,.26,.75)*.55*exp(-pow(length((p-g1)*vec2(1.,1.25)),2.)*5.5);
      vec2 g2=vec2(.2+.1*cos(C.y*1.3),.18);
      c+=vec3(1.,.62,.13)*.10*exp(-pow(length(p-g2),2.)*9.);
      vec2 g3=vec2(.86,.85+.03*sin(C.z*.3));
      c+=vec3(.48,.55,1.)*.12*exp(-pow(length(p-g3),2.)*14.);
      c+=(h(gl_FragCoord.xy+fract(C.z))-.5)*.018;
      O=vec4(c,1.);}`, ['C']);

  const wordP = program(`layout(location=0) in vec2 a;uniform vec4 W;uniform vec4 B;uniform float A;uniform vec3 L;out vec2 v;
    void main(){
      float t=(a.x-.5)*W.x+W.y;
      float th=clamp(t/${RADIUS.toFixed(1)},-1.45,1.45);
      float x=${RADIUS.toFixed(1)}*sin(th),z=${RADIUS.toFixed(1)}*(1.-cos(th))*.82;
      float y=(a.y-.5)*L.x+L.y-L.z-3.6*pow(smoothstep(.8,8.,t),1.25)-.012*t*t;
      v=vec2(mix(B.x,B.z,a.x),mix(B.w,B.y,a.y));
      gl_Position=vec4(x*${FOCAL.toFixed(2)}/A,y*${FOCAL.toFixed(2)},0.,${CAM.toFixed(1)}-z);
    }`, `in vec2 v;uniform sampler2D T;out vec4 O;void main(){float a=texture(T,v).a;O=vec4(vec3(.95,.955,.975)*a,a);}`, ['W', 'B', 'A', 'L', 'T']);

  const dotP = program(`layout(location=0) in vec4 a;uniform float S,H,P;out float k;out float r;
    void main(){k=a.w;float y=fract(a.y+S*.012*(.4+a.z))*2.3-1.15;float x=fract(a.x+H*(a.w>.5?.035:.004))*2.4-1.2+.03*sin(S*.2+a.z*9.);
      gl_Position=vec4(x,y,0,1);gl_PointSize=(a.w>.5?4.+a.z*11.:4.+a.z*18.)*P;r=S*.6+a.z*7.+H;}`,
    `in float k;in float r;out vec4 O;void main(){vec2 p=gl_PointCoord-.5;
      if(k>.5){float c=cos(r),s=sin(r);p=mat2(c,-s,s,c)*p;float a=step(max(abs(p.x),abs(p.y)),.3)*.9;O=vec4(vec3(.30,.39,1.)*a,a);}
      else{float a=smoothstep(.5,.1,length(p))*.5;O=vec4(vec3(1.)*a,a);}}`, ['S', 'H', 'P']);

  // the phone: rounded body with a cobalt rim, a screen that scrolls through a long page screenshot
  const PH = 2.05; // phone height / width
  const phoneP = program(`uniform mat3 M;out vec2 v;void main(){vec2 c=vec2((gl_VertexID<<1)&2,gl_VertexID&2);if(gl_VertexID==3)c=vec2(2,2);c*=.5;v=vec2(c.x,1.-c.y);gl_Position=vec4((M*vec3(c-.5,1.)).xy,0,1);}`,
    `in vec2 v;uniform sampler2D T;uniform vec3 S;out vec4 O;
    float rr(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
    void main(){
      vec2 p=(v-.5)*vec2(1.,${PH.toFixed(2)});
      float body=rr(p,vec2(.5,${(PH / 2).toFixed(3)}),.1);
      float aa=fwidth(body)*1.2;
      float ab=1.-smoothstep(-aa,aa,body);
      vec3 c=mix(vec3(.05,.06,.1),vec3(.09,.1,.17),v.y);
      c+=vec3(.36,.43,1.)*(1.-smoothstep(0.,.012,abs(body+.008)))*.95;
      float b=.032;
      float scr=rr(p,vec2(.5-b,${(PH / 2).toFixed(3)}-b),.075);
      float as=1.-smoothstep(-aa,aa,scr);
      vec2 su=vec2(p.x/(1.-2.*b)+.5,(p.y+${(PH / 2).toFixed(3)}-b)/(${PH.toFixed(2)}-2.*b));
      float win=S.y;
      vec3 t=texture(T,vec2(su.x,S.x+su.y*win)).rgb;
      t*=.93+.07*su.y;
      c=mix(c,t,as);
      float isl=rr(p-vec2(0.,-${(PH / 2).toFixed(3)}+b+.05),vec2(.13,.028),.028);
      c=mix(c,vec3(.01),1.-smoothstep(-aa,aa,isl));
      float gl0=smoothstep(.0,.6,1.-abs(su.x-su.y*.35-.2))*.05;
      c+=gl0*as;
      O=vec4(c*ab,ab);}`, ['M', 'T', 'S']);

  // word atlas
  const ROW = 512, EM = 350, atlas = document.createElement('canvas'); atlas.width = 4096; atlas.height = ROW * WORDS.length;
  let layout = [];
  const FONT = `800 ${EM}px "Schibsted Grotesk", system-ui, sans-serif`;
  function drawAtlas() {
    const x = atlas.getContext('2d'); x.clearRect(0, 0, atlas.width, atlas.height); x.font = FONT; x.textBaseline = 'alphabetic'; x.fillStyle = '#000';
    try { x.letterSpacing = '-6px'; } catch (e) {}
    let c = 0; layout = [];
    WORDS.forEach((w, i) => {
      const m = Math.min(atlas.width - 20, x.measureText(w).width + 20); x.fillText(w, 10, i * ROW + ROW * .76);
      const uW = m / ROW * K; layout.push({ len: uW, c: c + uW / 2, u: m / atlas.width, top: i / WORDS.length, bot: (i + 1) / WORDS.length }); c += uW + GAP;
    });
  }
  const tex = (unit, filter) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); return t; };
  const tWords = tex(1, gl.LINEAR_MIPMAP_LINEAR), tScr = tex(2, gl.LINEAR_MIPMAP_LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 24, 40, 255]));
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  const load = url => new Promise(r => { const i = new Image; i.onload = () => {
    if (i.height <= 4096) return r(i);
    const c = document.createElement('canvas'), k = 4096 / i.height; c.width = Math.round(i.width * k); c.height = 4096;
    c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); r(c);
  }; i.onerror = () => r(null); i.src = url; });

  const cols = 56, ribbon = new Float32Array((cols + 1) * 4);
  for (let i = 0; i <= cols; i++) ribbon.set([i / cols, 0, i / cols, 1], i * 4);
  const vaoW = gl.createVertexArray(); gl.bindVertexArray(vaoW); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, ribbon, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const dots = []; let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 40; i++) dots.push(rnd(), rnd(), rnd(), i % 4 ? 0 : 1);
  const vaoD = gl.createVertexArray(); gl.bindVertexArray(vaoD); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dots), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
  const vaoE = gl.createVertexArray();

  let W = 1, H = 1, dpr = 1, asp = 1, scrImg = null, scrIdx = 0;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = Math.round(cv.clientWidth * dpr); H = Math.round(cv.clientHeight * dpr); cv.width = W; cv.height = H; asp = W / H; gl.viewport(0, 0, W, H); }
  addEventListener('resize', size);

  function setScreen(img) {
    if (!img) return; scrImg = img;
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tScr); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  }
  const screens = [];

  function draw(s, sec) {
    const n = WORDS.length, span = STEP * (n - 1), k = clamp(s / span) * (n - 1), i = Math.min(n - 2, Math.floor(k)), f = k - i;
    const c0 = layout[i].c, c1 = layout[i + 1].c, head = c0 + (c1 - c0) * ease(f);
    const sink = ease(smooth(span + .015, span + .105, s)) * 6;
    const grow = ease(smooth(span + .08, span + .22, s)), side = smooth(.76, .82, s) - 2 * smooth(.88, .94, s);
    // sky
    gl.disable(gl.BLEND); gl.useProgram(skyP.p); gl.bindVertexArray(vaoE);
    gl.uniform3f(skyP.u.C, asp, s * 3, sec); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // points
    gl.useProgram(dotP.p); gl.bindVertexArray(vaoD); gl.uniform1f(dotP.u.S, sec); gl.uniform1f(dotP.u.H, head * .1 + s * 4); gl.uniform1f(dotP.u.P, H / 900); gl.drawArrays(gl.POINTS, 0, 40);
    // words
    gl.useProgram(wordP.p); gl.bindVertexArray(vaoW); gl.uniform1i(wordP.u.T, 1); gl.uniform1f(wordP.u.A, asp);
    const hs = clamp(asp * .58, .26, 1); gl.uniform3f(wordP.u.L, hs * K, .19 + .1 * (1 - hs), sink);
    layout.forEach(w => { const t = w.c - head; if (Math.abs(t) > 24) return;
      gl.uniform4f(wordP.u.W, w.len * hs, t * hs, 0, 0); gl.uniform4f(wordP.u.B, 0, w.top, w.u, w.bot); gl.drawArrays(gl.TRIANGLE_STRIP, 0, (cols + 1) * 2); });
    // phone: the screenshot scrolls with the page, a different example site per stretch of the story
    const want = s < .3 ? 0 : s < .62 ? 1 : 2;
    if (want !== scrIdx && screens[want]) { scrIdx = want; setScreen(screens[want]); }
    gl.useProgram(phoneP.p); gl.bindVertexArray(vaoE); gl.uniform1i(phoneP.u.T, 2);
    const win = scrImg ? (PH - .064) / (1 - .064) * scrImg.width / scrImg.height : 1;
    const local = scrIdx === 0 ? s / .3 : scrIdx === 1 ? (s - .3) / .32 : (s - .62) / .38;
    const off = (1 - win) * clamp(.5 - .5 * Math.cos(clamp(local) * Math.PI) + .02 * Math.sin(sec * .4));
    gl.uniform3f(phoneP.u.S, clamp(off, 0, 1 - win), win, 0);
    const h = (.6 + grow * .12) * clamp(.62 + asp * .4, .6, 1), w = h / PH / asp * (.94 + .06 * Math.cos(s * 14));
    const roll = (.09 * Math.sin(s * 13 + .4) + .03 * Math.sin(sec * .5)) * (1 + grow * .4), co = Math.cos(roll), si = Math.sin(roll);
    const ox = (mx * .018 + side * .34 * Math.min(1, asp)), oy = .02 + .018 * Math.sin(sec * .8) + my * .018 - grow * .06;
    gl.uniformMatrix3fv(phoneP.u.M, false, [w * 2 * co, w * 2 * si * asp, 0, -h * 2 * si / asp, h * 2 * co, 0, ox, oy, 1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    ui(s, k);
  }

  let lastIdx = 0; const marks = [...$('drIndex').querySelectorAll('b')];
  function ui(s, k) {
    const op = (a, b, c, d) => smooth(a, b, s) * (1 - smooth(c, d, s));
    const c1 = 1 - smooth(.04, .08, s), c2 = op(.08, .12, .56, .62); $('drC1').style.opacity = c1; $('drC2').style.opacity = c2; $('drMark').style.opacity = Math.max(c1, c2);
    const a = op(.72, .77, .84, .88), b = op(.9, .95, 1.1, 1.2);
    $('drP1').style.opacity = a; $('drP1').style.transform = `translateY(calc(-50% + ${(1 - a) * 18}px))`;
    $('drP2').style.opacity = b; $('drP2').style.transform = `translateY(calc(-50% + ${(1 - b) * 18}px))`;
    $('drP2').style.pointerEvents = b > .5 ? 'auto' : 'none';
    const idx = Math.round(k); if (idx !== lastIdx) { marks[lastIdx].classList.remove('on'); marks[idx].classList.add('on'); lastIdx = idx; }
    $('drThumb').style.transform = `translateY(${(s * 1011).toFixed(1)}%)`;
  }

  let target = 0, now = 0, mx = 0, my = 0, tmx = 0, tmy = 0, vis = true, running = false;
  const read = () => { const r = track.getBoundingClientRect(), m = r.height - innerHeight; target = clamp(-r.top / m); };
  addEventListener('scroll', read, { passive: true });
  addEventListener('pointermove', e => { tmx = e.clientX / innerWidth * 2 - 1; tmy = 1 - e.clientY / innerHeight * 2; });
  function loop(t) {
    if (!vis || document.hidden) { running = false; return; }
    now += (target - now) * (calm ? 1 : .1); mx += (tmx - mx) * .05; my += (tmy - my) * .05; draw(now, t / 1000);
    requestAnimationFrame(loop);
  }
  const start = () => { if (!running && layout.length) { running = true; requestAnimationFrame(loop); } };
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) start(); }).observe(track);
  document.addEventListener('visibilitychange', start);

  $('drSkip').onclick = () => { const r = track.getBoundingClientRect(); scrollTo({ top: scrollY + r.bottom - 60, behavior: calm ? 'auto' : 'smooth' }); };

  let ctx, gain;
  $('drSound').onclick = () => {
    const b = $('drSound'), on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); $('drSt').textContent = on ? 'PORNIT' : 'OPRIT';
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext); gain = ctx.createGain(); gain.gain.value = 0;
      const nb = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = nb.getChannelData(c); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } }
      const src = ctx.createBufferSource(); src.buffer = nb; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .09; lg.gain.value = 240; lfo.connect(lg).connect(lp.frequency);
      src.connect(lp).connect(gain).connect(ctx.destination); src.start(); lfo.start();
    }
    ctx.resume(); gain.gain.setTargetAtTime(on ? .3 : 0, ctx.currentTime, .4);
  };

  const fontReady = document.fonts ? Promise.race([document.fonts.load(FONT, 'CLIENȚI'), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  Promise.all([load(SCREENS[0]), fontReady]).then(([first]) => {
    screens[0] = first; setScreen(first);
    SCREENS.slice(1).forEach((u, i) => load(u).then(im => { screens[i + 1] = im; }));
    drawAtlas();
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tWords); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas); gl.generateMipmap(gl.TEXTURE_2D);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    size(); read(); now = target; track.classList.add('ready'); start();
  });
})();
