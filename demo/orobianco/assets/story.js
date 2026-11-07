/* Orobianco homepage story (GSAP + ScrollTrigger, self-hosted) */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var cin = $('.cin');
  if (!window.gsap || !window.ScrollTrigger || RM) { if (cin) cin.remove(); $$('.shero h1 .w>span,.shero .fade').forEach(function (e) { e.style.transform = 'none'; e.style.opacity = 1; });
    return; }
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0); // animations follow real time even on slow phones
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- intro + hero entrance ---------- */
  var seen = false; try { seen = !!sessionStorage.getItem('oro-cin'); } catch (e) {}
  var hero = gsap.timeline({ paused: true })
    .fromTo('.shero .media', { scale: 1.2, opacity: 0 }, { scale: 1.06, opacity: 1, duration: 2.6, ease: 'expo.out' }, 0)
    .to('.shero .k i', { scaleX: 1, duration: .9, ease: 'power3.out' }, .2)
    .to('.shero h1 .w>span', { y: 0, duration: 1.2, ease: 'expo.out', stagger: .07 }, .25)
    .to('.shero .fade', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .12 }, .7);
  gsap.set('.shero .k i', { scaleX: 0 });
  if (cin && !seen) {
    try { sessionStorage.setItem('oro-cin', '1'); } catch (e) {}
    document.documentElement.classList.add('cin-on');
    gsap.timeline({ onComplete: function () { cin.remove(); document.documentElement.classList.remove('cin-on'); } })
      .to('.cin circle', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
      .to('.cin .em', { opacity: 1, scale: 1, duration: .8, ease: 'back.out(1.6)' }, .55).from('.cin .em', { scale: .6, rotate: -30, duration: .8, ease: 'back.out(1.6)' }, .55)
      .to('.cin b', { opacity: 1, letterSpacing: '.5em', duration: 1.2, ease: 'expo.out' }, .9)
      .to('.cin small', { opacity: 1, duration: .6 }, 1.25)
      .to('.cin .mk', { opacity: 0, y: -10, duration: .45, ease: 'power2.in' }, 2.15)
      .to('.cin .line', { width: '100vw', duration: .6, ease: 'expo.inOut' }, 2.3)
      .to('.cin .half.t', { yPercent: -101, duration: 1.1, ease: 'expo.inOut' }, 2.75)
      .to('.cin .half.b', { yPercent: 101, duration: 1.1, ease: 'expo.inOut' }, 2.75)
      .to('.cin .line', { opacity: 0, duration: .3 }, 2.8)
      .add(function () { hero.play(); }, 2.85);
  } else { if (cin) cin.remove(); hero.play(); }

  /* hero slideshow */
  (function () { if (!$('.shero .sl')) return; var sl = $$('.shero .sl'), bars = $$('.slnav .bars i'), cur = $('.slnav .cur'), cap = $('.slnav .cap'), i = 0;
    var CAP = { ro: ['Salonul', 'Barul', 'Orobianco Garden', 'Servit la masă', 'Intrarea'], hu: ['A terem', 'A bár', 'Orobianco Garden', 'Az asztalnál', 'A bejárat'], en: ['The dining room', 'The bar', 'Orobianco Garden', 'At the table', 'The entrance'] };
    function lang() { return window.oroLang ? oroLang.get() : 'ro'; }
    function show(n) { sl.forEach(function (s, k) { s.classList.toggle('on', k === n); });
      bars.forEach(function (b, k) { b.classList.remove('run'); b.classList.toggle('done', k < n); }); void bars[n].offsetWidth; bars[n].classList.add('run');
      cur.textContent = '0' + (n + 1); cap.style.opacity = 0; setTimeout(function () { cap.textContent = CAP[lang()][n]; cap.style.opacity = 1; }, 300); }
    show(0); setInterval(function () { if (document.hidden || scrollY > innerHeight) return; i = (i + 1) % sl.length; show(i); }, 5500);
    window.oroLang && oroLang.on(function () { cap.textContent = CAP[lang()][i]; }); })();

  /* hero: mouse depth + scroll-out */
  var img = $('.shero .media');
  if (matchMedia('(pointer:fine)').matches) addEventListener('pointermove', function (e) {
    if (scrollY > innerHeight) return; var x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    gsap.to(img, { x: -x * 24, y: -y * 16, duration: 1.4, ease: 'power3.out', overwrite: 'auto' });
    gsap.to('.shero .mega', { x: x * 18, y: y * 10, duration: 1.4, ease: 'power3.out', overwrite: 'auto' });
  });
  gsap.to('.shero .center', { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.shero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.shero .media', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.shero', start: 'top top', end: 'bottom top', scrub: true } });

  var mm = gsap.matchMedia();
  mm.add({ d: '(min-width: 761px)', m: '(max-width: 760px)' }, function (ctx) {
    var M = ctx.conditions.m;

    /* 1. arrival: arch window opens into the dining room */
    gsap.timeline({ scrollTrigger: { trigger: '.c1', start: 'top top', end: '+=160%', scrub: .8, pin: true, anticipatePin: 1 } })
      .to('.c1 .tx .l', { xPercent: -60, opacity: 0, ease: 'power2.in', duration: .5 }, 0)
      .to('.c1 .tx .r', { xPercent: 60, opacity: 0, ease: 'power2.in', duration: .5 }, 0)
      .to('.c1 .top', { opacity: 0, duration: .3 }, 0)
      .to('.c1 .arch', { width: '100vw', height: '100svh', top: '50%', yPercent: 0, y: 0, borderRadius: 0, boxShadow: 'none', transform: 'translate(-50%,-50%)', ease: 'power2.inOut', duration: 1 }, .05)
      .to('.c1 .arch img', { scale: 1.04, ease: 'power2.out', duration: 1.1 }, .05)
      .to('.c1 .arch .dim', { backgroundColor: 'rgba(13,10,8,.55)', duration: .4 }, .75)
      .to('.c1 .after', { opacity: 1, y: 0, duration: .35 }, .85).fromTo('.c1 .after', { y: 40 }, { y: 0, duration: .35 }, .85);

    /* 2. aperitivo: panels slide sideways, big word drifts the other way */
    var tr = $('.c2 .track');
    var dist = function () { return tr.scrollWidth - innerWidth + (M ? 20 : 80); };
    gsap.timeline({ scrollTrigger: { trigger: '.c2', start: 'top top', end: function () { return '+=' + (dist() * (M ? 1.1 : .9)); }, scrub: .8, pin: true, anticipatePin: 1, invalidateOnRefresh: true } })
      .to(tr, { x: function () { return -dist(); }, ease: 'none' }, 0)
      .fromTo('.c2 .big', { x: '10vw' }, { x: function () { return -dist() * .35; }, ease: 'none' }, 0)
      .to('.c2 .pan img', { xPercent: -6, ease: 'none' }, 0);

    /* 3. at the table: real dishes revealed one after another, like turning magazine pages */
    var dis = $$('.c3 .di'), n = dis.length;
    var t3 = gsap.timeline({ scrollTrigger: { trigger: '.c3', start: 'top top', end: '+=' + (n * (M ? 75 : 85)) + '%', scrub: .7, pin: true, anticipatePin: 1 } });
    t3.fromTo('.c3 .head', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .4 }, 0);
    dis.forEach(function (d, i) {
      var at = .25 + i * 1.1, ph = d.querySelector('.ph'), im = d.querySelector('img'), cap = d.querySelector('figcaption');
      if (i > 0) t3.fromTo(ph, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .7, ease: 'power3.inOut' }, at);
      t3.fromTo(im, { scale: 1.18 }, { scale: 1.02, duration: 1.4, ease: 'none' }, at - (i ? 0 : .25))
        .fromTo(cap.children, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .35, stagger: .06 }, at + .3);
      if (i < n - 1) t3.to(cap.children, { y: -16, opacity: 0, duration: .25, stagger: .03 }, at + .95);
    });
    t3.to({}, { duration: .4 });

    /* 4. garden: day turns to night, string lights come on */
    var t4 = gsap.timeline({ scrollTrigger: { trigger: '.c4', start: 'top top', end: '+=130%', scrub: .8, pin: true, anticipatePin: 1 } });
    t4.fromTo('.c4 .bg', { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.02, ease: 'none', duration: 1 }, 0)
      .to('.c4 .night', { opacity: 1, duration: .6 }, .2)
      .to('.c4 .lights i', { opacity: 1, duration: .08, stagger: { each: .025, from: 'random' } }, .45)
      .fromTo('.c4 .tx > *', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: .08, duration: .3 }, .1);
    return function () {};
  });

  /* ---------- evening clock ---------- */
  var clock = $('.clock'), cb = $('.clock b'), cs = $('.clock small'), fill = $('.clock .bar i');
  var CH = $$('[data-time]');
  ScrollTrigger.create({ trigger: CH[0], start: 'top 60%', endTrigger: '.fin', end: 'bottom 60%',
    onToggle: function (s) { gsap.to(clock, { opacity: s.isActive ? 1 : 0, duration: .4 }); document.body.classList.toggle('in-story', s.isActive); },
    onUpdate: function (s) { fill.style.height = (s.progress * 100).toFixed(1) + '%'; } });
  CH.forEach(function (c) { ScrollTrigger.create({ trigger: c, start: 'top 55%', end: 'bottom 55%', onToggle: function (s) { if (s.isActive) { cb.textContent = c.dataset.time; cs.textContent = c.dataset.label; gsap.fromTo(cb, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }); } } }); });
  window.oroLang && oroLang.on(function () { var a = CH.find(function (c) { var r = c.getBoundingClientRect(); return r.top < innerHeight * .55 && r.bottom > innerHeight * .55; }); if (a) { cs.textContent = a.dataset.label; } });

  /* finale rings */
  gsap.fromTo('.fin .ring', { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, stagger: .12, ease: 'none', scrollTrigger: { trigger: '.fin', start: 'top 85%', end: 'center center', scrub: true } });
  gsap.fromTo('.fin h2', { y: 60, opacity: 0 }, { y: 0, opacity: 1, ease: 'power3.out', scrollTrigger: { trigger: '.fin', start: 'top 70%' }, duration: 1.2 });

  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
