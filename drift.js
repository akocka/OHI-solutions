// Hero 2: a pink jellyfish floats in a lilac sky; huge black words arrive from the lower right on a curve,
// pass behind it, rest in the centre and leave left. Then the jellyfish grows and two panels appear.
// Raw WebGL2, no libraries. Sky and jellyfish are drawn in shaders (no outside images).
(function () {
  const $ = id => document.getElementById(id);
  const track = $('drTrack'), cv = $('drGl');
  if (!track || !cv) return;
  const gl = cv.getContext('webgl2', { alpha: false, antialias: true, premultipliedAlpha: true });
  if (!gl) { track.classList.add('dr-nogl'); return; }

  const WORDS = ['OHI', 'SITE-URI', 'CARE ADUC', 'CLIENȚI', 'DIN MUREȘ'];
  const STEP = .14, GAP = 3.4, RADIUS = 9, CAM = 11, FOCAL = 8.14;
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
  const NOISE = `float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}`;

  // lilac sky with soft drifting clouds
  const skyP = program(QUAD, `in vec2 v;uniform vec3 C;out vec4 O;${NOISE}
    void main(){
      vec2 p=v; p.x=(p.x-.5)*C.x+.5; p.x+=C.y*.05+C.z*.0022;
      vec3 top=vec3(.79,.76,.94), bot=vec3(.91,.86,.95);
      vec3 c=mix(bot,top,smoothstep(0.,1.,v.y));
      float cl=fbm(p*vec2(2.2,3.)+vec2(C.z*.01,0.));
      float cl2=fbm(p*vec2(5.,6.)-vec2(C.z*.006,0.));
      c=mix(c,vec3(.97,.95,1.),smoothstep(.45,.85,cl)*.55);
      c=mix(c,vec3(.95,.84,.93),smoothstep(.55,.9,cl2)*.25);
      c+=vec3(.04,.02,.05)*exp(-pow(length((v-vec2(.5,.45))*vec2(1.,1.4)),2.)*3.);
      O=vec4(c,1.);}`, ['C']);

  const wordP = program(`layout(location=0) in vec2 a;uniform vec4 W;uniform vec4 B;uniform float A;uniform vec3 L;out vec2 v;
    void main(){
      float t=(a.x-.5)*W.x+W.y;
      float th=clamp(t/${RADIUS.toFixed(1)},-1.45,1.45);
      float x=${RADIUS.toFixed(1)}*sin(th),z=${RADIUS.toFixed(1)}*(1.-cos(th))*.82;
      float y=(a.y-.5)*L.x+L.y-L.z-3.6*pow(smoothstep(.8,8.,t),1.25)-.012*t*t;
      v=vec2(mix(B.x,B.z,a.x),mix(B.w,B.y,a.y));
      gl_Position=vec4(x*${FOCAL.toFixed(2)}/A,y*${FOCAL.toFixed(2)},0.,${CAM.toFixed(1)}-z);
    }`, `in vec2 v;uniform sampler2D T;out vec4 O;void main(){float a=texture(T,v).a;O=vec4(vec3(.043,.043,.063)*a,a);}`, ['W', 'B', 'A', 'L', 'T']);

  const dotP = program(`layout(location=0) in vec4 a;uniform float S,H,P;out float k;out float r;
    void main(){k=a.w;float y=fract(a.y+S*.012*(.4+a.z))*2.3-1.15;float x=fract(a.x+H*(a.w>.5?.035:.004))*2.4-1.2+.03*sin(S*.2+a.z*9.);
      gl_Position=vec4(x,y,0,1);gl_PointSize=(a.w>.5?5.+a.z*15.:5.+a.z*24.)*P;r=S*.6+a.z*7.+H;}`,
    `in float k;in float r;out vec4 O;void main(){vec2 p=gl_PointCoord-.5;
      if(k>.5){float c=cos(r),s=sin(r);p=mat2(c,-s,s,c)*p;float a=step(max(abs(p.x),abs(p.y)),.3);O=vec4(vec3(.04)*a,a);}
      else{float a=smoothstep(.5,.1,length(p))*.62;O=vec4(vec3(1.)*a,a);}}`, ['S', 'H', 'P']);

  // the jellyfish, painted in a shader on a 1080:1920 quad: pulsing bell, frilled oral arms, thin tentacles
  const jellyP = program(`uniform mat3 M;out vec2 v;void main(){vec2 c=vec2((gl_VertexID<<1)&2,gl_VertexID&2);if(gl_VertexID==3)c=vec2(2,2);c*=.5;v=vec2(c.x,1.-c.y);gl_Position=vec4((M*vec3(c-.5,1.)).xy,0,1);}`,
    `in vec2 v;uniform float T;out vec4 O;${NOISE}
    vec4 over(vec4 a,vec4 b){return a+b*(1.-a.a);}
    void main(){
      vec2 p=vec2((v.x-.5)*.5625,v.y);
      float pulse=sin(T*2.1);
      vec2 bc=vec2(0.,.33+.006*pulse);
      vec2 br=vec2(.205*(1.+.05*pulse),.17*(1.-.04*pulse));
      vec2 q=(p-bc)/br;
      float rimY=.12+.05*sin(atan(q.y,q.x)*1.+T)+.03*sin(p.x*70.+T*2.);
      float d=length(vec2(q.x,min(q.y,0.)*1.))-1.;
      float inside=(q.y<rimY&&d<0.)?1.:0.;
      float edge=smoothstep(.0,-.06,d)*smoothstep(rimY+.02,rimY-.06,q.y);
      vec4 acc=vec4(0.);
      // bell
      if(edge>0.){
        float rib=.5+.5*cos(atan(q.x,-q.y+.6)*18.);
        float depth=clamp(1.+q.y,0.,1.);
        vec3 c=mix(vec3(1.,.62,.78),vec3(1.,.82,.9),smoothstep(.2,-1.,q.y));
        c=mix(c,vec3(.93,.38,.62),rib*.18*depth);
        float gon=0.;
        for(int i=0;i<4;i++){float an=float(i)*1.5708+.8+T*.05;vec2 g=vec2(cos(an)*.42,-.35+sin(an)*.18);gon+=exp(-dot(q-g,q-g)*28.);}
        c=mix(c,vec3(.86,.3,.55),clamp(gon,0.,1.)*.55);
        float rim=smoothstep(-.12,0.,d)*.8+smoothstep(rimY-.12,rimY,q.y)*.6;
        c=mix(c,vec3(1.,.94,.97),rim*.6);
        float a=edge*(.55+.25*rim+.15*gon);
        acc=over(acc,vec4(c*a,a));
      }
      // oral arms
      float yb=bc.y+br.y*.12;
      for(int i=0;i<4;i++){
        float fi=float(i);
        float len=.42+.06*fi;
        float t=(p.y-yb)/len;
        if(t>0.&&t<1.){
          float x0=(fi-1.5)*.022+.035*sin(p.y*11.-T*1.7+fi*1.3)*t;
          float w=(.026-.016*t)*(1.+.35*sin(p.y*60.+fi*3.+T*3.));
          float dd=abs(p.x-x0)/w;
          float a=smoothstep(1.,.55,dd)*(1.-t)*.78;
          vec3 c=mix(vec3(.95,.45,.66),vec3(1.,.78,.88),smoothstep(.9,.2,dd));
          acc=over(acc,vec4(c*a,a));
        }
      }
      // tentacles
      for(int i=0;i<12;i++){
        float fi=float(i);
        float sx=(fi/11.-.5)*br.x*1.85;
        float y0=bc.y+br.y*(.08+.06*cos(fi));
        float len=.5+.12*fract(sin(fi*7.1)*91.);
        float t=(p.y-y0)/len;
        if(t>0.&&t<1.){
          float x0=sx*(1.-.3*t)+.045*sin(p.y*8.-T*1.4+fi*.9)*t;
          float dd=abs(p.x-x0)/.0026;
          float a=smoothstep(1.4,.3,dd)*(1.-t)*.55;
          acc=over(acc,vec4(vec3(1.,.72,.85)*a,a));
        }
      }
      float sp=smoothstep(.985,1.,vn(p*90.+T*.3))*edge*.6;
      acc.rgb+=sp;
      O=acc;
    }`, ['M', 'T']);

  // word atlas
  const ROW = 512, EM = 440, atlas = document.createElement('canvas'); atlas.width = 4096; atlas.height = ROW * WORDS.length;
  let layout = [];
  function drawAtlas() {
    const x = atlas.getContext('2d'); x.clearRect(0, 0, atlas.width, atlas.height); x.font = `${EM}px Anton, Impact, "Arial Narrow", sans-serif`; x.textBaseline = 'alphabetic'; x.fillStyle = '#000'; x.textAlign = 'left';
    try { x.letterSpacing = '8px'; } catch (e) {}
    let c = 0; layout = [];
    WORDS.forEach((w, i) => {
      const m = Math.min(atlas.width - 16, x.measureText(w).width + 16); x.fillText(w, 8, i * ROW + EM * .92 + 6);
      const uW = m / EM * .86; layout.push({ len: uW, c: c + uW / 2, u: m / atlas.width, top: i / WORDS.length, bot: (i + 1) / WORDS.length }); c += uW + GAP;
    });
  }
  const tex = (unit, filter) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); return t; };
  const tWords = tex(1, gl.LINEAR_MIPMAP_LINEAR);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');

  const cols = 56, ribbon = new Float32Array((cols + 1) * 4);
  for (let i = 0; i <= cols; i++) ribbon.set([i / cols, 0, i / cols, 1], i * 4);
  const vaoW = gl.createVertexArray(); gl.bindVertexArray(vaoW); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, ribbon, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const dots = []; let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 40; i++) dots.push(rnd(), rnd(), rnd(), i % 4 ? 0 : 1);
  const vaoD = gl.createVertexArray(); gl.bindVertexArray(vaoD); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dots), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
  const vaoE = gl.createVertexArray();

  let W = 1, H = 1, dpr = 1, asp = 1;
  function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = Math.round(cv.clientWidth * dpr); H = Math.round(cv.clientHeight * dpr); cv.width = W; cv.height = H; asp = W / H; gl.viewport(0, 0, W, H); }
  addEventListener('resize', size);

  function draw(s, sec) {
    const n = WORDS.length, span = STEP * (n - 1), k = clamp(s / span) * (n - 1), i = Math.min(n - 2, Math.floor(k)), f = k - i;
    const c0 = layout[i].c, c1 = layout[i + 1].c, head = c0 + (c1 - c0) * ease(f);
    const sink = ease(smooth(span + .015, span + .105, s)) * 6;
    const grow = ease(smooth(span + .08, span + .22, s)), side = smooth(.76, .82, s) - 2 * smooth(.88, .94, s);
    gl.disable(gl.BLEND); gl.useProgram(skyP.p); gl.bindVertexArray(vaoE);
    const ca = asp / (16 / 9); gl.uniform3f(skyP.u.C, Math.max(1, ca) * .92, s, sec); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(dotP.p); gl.bindVertexArray(vaoD); gl.uniform1f(dotP.u.S, sec); gl.uniform1f(dotP.u.H, head * .1 + s * 4); gl.uniform1f(dotP.u.P, H / 900); gl.drawArrays(gl.POINTS, 0, 40);
    gl.useProgram(wordP.p); gl.bindVertexArray(vaoW); gl.uniform1i(wordP.u.T, 1); gl.uniform1f(wordP.u.A, asp);
    const hs = clamp(asp * .58, .26, 1); gl.uniform3f(wordP.u.L, hs, .19 + .1 * (1 - hs), sink);
    layout.forEach(w => { const t = w.c - head; if (Math.abs(t) > 24) return;
      gl.uniform4f(wordP.u.W, w.len * hs, t * hs, 0, 0); gl.uniform4f(wordP.u.B, 0, w.top, w.u, w.bot); gl.drawArrays(gl.TRIANGLE_STRIP, 0, (cols + 1) * 2); });
    gl.useProgram(jellyP.p); gl.bindVertexArray(vaoE); gl.uniform1f(jellyP.u.T, calm ? 1 : sec);
    const h = (.98 + grow * .42) * clamp(.62 + asp * .4, .6, 1), w = h * (1080 / 1920) / asp * (.93 + .07 * Math.cos(s * 14));
    const roll = (.1 * Math.sin(s * 13 + .4) + .03 * Math.sin(sec * .5)) * (1 + grow * .5), co = Math.cos(roll), si = Math.sin(roll);
    const ox = (mx * .018 + side * .34 * Math.min(1, asp)), oy = .03 + .018 * Math.sin(sec * .8) + my * .018 - grow * .1;
    gl.uniformMatrix3fv(jellyP.u.M, false, [w * 2 * co, w * 2 * si * asp, 0, -h * 2 * si / asp, h * 2 * co, 0, ox, oy, 1]);
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
    const b = $('drSound'), on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); $('drSt').textContent = on ? 'ON' : 'OFF';
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext); gain = ctx.createGain(); gain.gain.value = 0;
      const nb = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = nb.getChannelData(c); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } }
      const src = ctx.createBufferSource(); src.buffer = nb; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .09; lg.gain.value = 240; lfo.connect(lg).connect(lp.frequency);
      src.connect(lp).connect(gain).connect(ctx.destination); src.start(); lfo.start();
    }
    ctx.resume(); gain.gain.setTargetAtTime(on ? .34 : 0, ctx.currentTime, .4);
  };

  const fontReady = document.fonts ? Promise.race([document.fonts.load(`${EM}px Anton`, 'CLIENȚI'), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  fontReady.then(() => {
    drawAtlas();
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tWords); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas); gl.generateMipmap(gl.TEXTURE_2D);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    size(); read(); now = target; start();
  });
})();
