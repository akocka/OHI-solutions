// Hero: a glowing liquid orb (violet, blue, orange) drawn in one WebGL shader. It drifts toward the cursor,
// swirls slowly and pulses when you hover the main button. No libraries.
(function () {
  var host = document.getElementById('orbHero'), cv = document.getElementById('orbCv');
  if (!host || !cv) return;
  var gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) { host.classList.add('orb-nogl'); return; }
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 R;uniform float T;uniform vec2 C;uniform float S;uniform float P;uniform vec2 M;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<' + (coarse ? 4 : 5) + ';i++){s+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s;}',
    'void main(){',
    ' vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;',
    ' vec2 q=(uv-C)/S;',
    ' float ang=atan(q.y,q.x);',
    ' float wob=.045*(fbm(vec2(ang*1.6,T*.35))-.5)+.025*sin(ang*3.+T*.9)+.03*P*sin(ang*6.-T*4.);',
    ' float d=length(q)/(1.+wob);',
    ' vec3 bg=vec3(.039,.027,.078);',
    ' bg+=vec3(.3,.18,.6)*.05*(1.-length(uv));',
    ' vec3 col=bg;',
    // outer glow: violet with a warm orange side
    ' float g=exp(-max(d-1.,0.)*3.2);',
    ' vec3 glow=mix(vec3(.55,.36,.98),vec3(1.,.42,.1),smoothstep(-.6,.9,q.x*.7-q.y*.5+.25*sin(T*.4)));',
    ' col+=glow*g*.55*(1.+.4*P);',
    ' col+=vec3(1.,.42,.1)*.18*exp(-pow(max(d-1.,0.)*1.2,2.))*smoothstep(.2,-1.,q.y);',
    ' if(d<1.){',
    '  float z=sqrt(1.-d*d);',
    '  vec3 nrm=normalize(vec3(q/(1.+wob),z));',
    // liquid: domain-warped noise flowing inside the sphere
    '  vec2 w=nrm.xy*1.1+vec2(T*.05,-T*.035)+M*.2;',
    '  vec2 o=vec2(fbm(w+T*.12),fbm(w+vec2(5.2,1.3)-T*.1));',
    '  float f=fbm(w*1.3+o*2.2+T*.05);',
    '  vec3 violet=vec3(.55,.36,.98),blue=vec3(.3,.39,1.),orange=vec3(1.,.42,.1),deep=vec3(.12,.06,.3);',
    '  vec3 c=mix(deep,violet,smoothstep(.3,.75,f)*.85);',
    '  c=mix(c,blue,smoothstep(.5,.8,o.x)*.55);',
    '  c=mix(c,orange,smoothstep(.7,.95,f+o.y*.3)*.75*smoothstep(-.2,.7,nrm.x-nrm.y*.6));',
    '  c=mix(c,vec3(1.,.85,.7),smoothstep(.9,1.05,f+o.y*.3)*.4);',
    '  float lit=.55+.45*dot(nrm,normalize(vec3(-.4,.55,.75)));',
    '  c*=lit;',
    '  float fres=pow(1.-z,2.6);',
    '  c+=mix(vec3(.62,.48,1.),vec3(1.,.45,.12),smoothstep(-.3,.6,q.x-q.y*.5))*fres*1.35;',
    '  float spec=pow(max(dot(reflect(-normalize(vec3(-.35,.5,1.)),nrm),vec3(0,0,1)),0.),40.);',
    '  c+=vec3(1.)*spec*.28;',
    '  float edge=smoothstep(1.,.985,d);',
    '  col=mix(col,c,edge);',
    ' }',
    ' col+=(h(gl_FragCoord.xy+fract(T)*91.)-.5)*.025;',
    ' col=1.-exp(-col*1.35);',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(o)); return o; }
  var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['R', 'T', 'C', 'S', 'P', 'M'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

  var W = 1, H = 1, dpr = 1;
  function size() { dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 1.75); W = Math.round(cv.clientWidth * dpr); H = Math.round(cv.clientHeight * dpr); cv.width = W; cv.height = H; gl.viewport(0, 0, W, H); }
  addEventListener('resize', size); size();

  var mx = 0, my = 0, tx = 0, ty = 0, pulse = 0, tp = 0;
  host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = -((e.clientY - r.top) / r.height - .5) * 2; });
  host.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
  var cta = document.getElementById('orbCta');
  if (cta) { cta.addEventListener('pointerenter', function () { tp = 1; }); cta.addEventListener('pointerleave', function () { tp = 0; }); cta.addEventListener('focus', function () { tp = 1; }); cta.addEventListener('blur', function () { tp = 0; }); }

  var vis = true, run = false, t0 = performance.now(), first = true;
  function frame(now) {
    if (!vis || document.hidden) { run = false; return; }
    var t = calm ? 8 : (now - t0) / 1000;
    mx += (tx - mx) * .045; my += (ty - my) * .045; pulse += (tp - pulse) * .08;
    var narrow = W / H < .9, cx0 = 0, cy = narrow ? .23 : .15, S = narrow ? Math.min(.27, .43 * W / H) : .29;
    var st = document.getElementById('hbStage');
    if (st) { var hr = host.getBoundingClientRect(), r = st.getBoundingClientRect(), hh = hr.height || 1;
      cx0 = ((r.left + r.width / 2 - hr.left) / hr.width - .5) * (hr.width / hh); cy = -((r.top + r.height * .45 - hr.top) / hh - .5); S = Math.min(r.width, r.height) / hh * .62; }
    gl.uniform2f(U.R, W, H); gl.uniform1f(U.T, t); gl.uniform1f(U.S, S * (1 + .03 * Math.sin(t * .8)) * (1 + .04 * pulse));
    gl.uniform2f(U.C, cx0 + mx * .06 * (W / H), cy + my * .05); gl.uniform1f(U.P, pulse); gl.uniform2f(U.M, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (first) { first = false; host.classList.add('orb-on'); }
    if (calm) { run = false; return; }
    requestAnimationFrame(frame);
  }
  function start() { if (!run) { run = true; requestAnimationFrame(frame); } }
  new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) start(); }).observe(host);
  document.addEventListener('visibilitychange', start);
  start();
})();
