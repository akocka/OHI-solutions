/* Big Big Boon preview · extra scroll motion on inner pages (on top of the live motion.js) */
(function () {
  try { var L = localStorage.getItem('bbb-lang'); var r = document.querySelector('.pv-rib'); if (r && L === 'hu') r.textContent = 'Előnézet · az OHI Solutions új dizájnjavaslata'; if (r && L === 'en') r.textContent = 'Preview · new design proposed by OHI Solutions'; } catch (e) {}
  if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  // header goes solid after a bit of scroll
  var hdr = document.getElementById('hdr');
  if (hdr) addEventListener('scroll', function () { hdr.classList.toggle('solid', scrollY > 40); }, { passive: true });
  // hero image drifts slower than the page
  $$('.hero .bgimg').forEach(function (b) {
    gsap.to(b, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: b.closest('.hero'), start: 'top top', end: 'bottom top', scrub: true } });
  });
  // cards and blocks: staggered rise per group (skip things motion.js already reveals)
  var groups = {};
  $$('.sec .wrap > *:not(.rv):not(.eyebrow):not(.h2), .tm, .post, .pil, .cc, .plan, .pr, .opt, .fac, .cinfo').forEach(function (el) {
    if (el.classList.contains('rv') || el.closest('header,footer,.mmenu,#intro,form')) return;
    var key = el.parentElement ? el.parentElement : document.body; (groups[key.dataset.tg || (key.dataset.tg = Math.random().toString(36).slice(2))] = groups[key.dataset.tg] || []).push(el);
  });
  Object.keys(groups).forEach(function (k) {
    var els = groups[k]; els.forEach(function (e) { e.classList.add('tv'); });
    ScrollTrigger.batch(els, { start: 'top 88%', once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .08, overwrite: true }); } });
  });
  // images unveil from the bottom as they enter
  $$('.sec img').forEach(function (im) {
    if (im.closest('header,footer,.logo,.av,form') || im.width < 160) return;
    im.classList.add('tv-img');
    gsap.to(im, { clipPath: 'inset(0% 0 0 0 round 24px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: im, start: 'top 90%', once: true } });
  });
  // safety: never leave anything hidden
  setTimeout(function () { ScrollTrigger.refresh(); }, 1200);
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
