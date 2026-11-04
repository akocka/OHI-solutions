/* Orobianco scroll story. Needs GSAP + ScrollTrigger (loaded from cdnjs before this file).
   Without them, or with reduced motion, the five scenes stay as normal stacked sections. */
(function () {
  var root = document.querySelector('.st');
  if (!root) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) { root.classList.add('st-static'); return; }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.documentElement.classList.add('st-on');

  var pin = function (sel, len, scrub) {
    return gsap.timeline({ scrollTrigger: { trigger: sel, start: 'top top', end: '+=' + len + '%', scrub: scrub || true, pin: true, anticipatePin: 1 } });
  };

  /* 1. street: slow push in, title lifts away */
  pin('.sc1', 70)
    .to('.sc1 .st-street', { scale: 1.2, ease: 'none' }, 0)
    .to('.sc1 .st-hint', { opacity: 0, duration: 0.15 }, 0)
    .to('.sc1 .st-c', { yPercent: -18, opacity: 0, ease: 'none', duration: 0.6 }, 0.4);

  /* 2. salon: interior zooms in slowly */
  pin('.sc2', 110)
    .fromTo('.sc2 .st-salon img', { scale: 1.04 }, { scale: 1.4, ease: 'none', duration: 1 }, 0)
    .from('.sc2 .st-c > *', { y: 50, opacity: 0, stagger: 0.06, duration: 0.25 }, 0.04)
    .to('.sc2 .st-c', { y: -40, opacity: 0, duration: 0.18 }, 0.82);

  /* 3. kitchen: dishes slide in one by one, with their names */
  var dishes = gsap.utils.toArray('.st-dish');
  var count = document.querySelector('.st-count b');
  var step = 1.4;
  var tl = pin('.sc3', dishes.length * 65, 0.6);
  ScrollTrigger.create({
    trigger: '.sc3', start: 'top top', end: '+=' + dishes.length * 65 + '%',
    onUpdate: function (s) { if (count) count.textContent = Math.min(dishes.length, Math.floor(s.progress * dishes.length) + 1); }
  });
  tl.from('.sc3 .st-top > *', { y: 30, opacity: 0, stagger: 0.1, duration: 0.4 }, 0);
  dishes.forEach(function (d, i) {
    var at = i * step + 0.2;
    tl.fromTo(d, { xPercent: 70, opacity: 0, rotate: 18 }, { xPercent: 0, opacity: 1, rotate: 0, duration: 1, ease: 'power2.out' }, at)
      .fromTo(d.querySelector('figcaption'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, at + 0.45);
    if (i < dishes.length - 1) {
      tl.to(d, { xPercent: -70, opacity: 0, rotate: -18, duration: 1, ease: 'power2.in' }, at + step - 0.3);
    }
  });

  /* 4. terrace: three layers moving at different speeds */
  pin('.sc4', 110)
    .fromTo('.sc4 .st-ter img', { scale: 1.3, yPercent: -5 }, { scale: 1.08, yPercent: 5, ease: 'none', duration: 1 }, 0)
    .fromTo('.sc4 .p1', { yPercent: 45 }, { yPercent: -35, ease: 'none', duration: 1 }, 0)
    .fromTo('.sc4 .p2', { yPercent: 110, rotate: -10 }, { yPercent: -70, rotate: 8, ease: 'none', duration: 1 }, 0)
    .from('.sc4 .st-c > *', { y: 50, opacity: 0, stagger: 0.06, duration: 0.25 }, 0.04);

  /* 5. final: reserve + phone */
  gsap.from('.sc5 .st-c > *', {
    y: 40, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.sc5', start: 'top 70%' }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
