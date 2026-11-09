/* Big Big Boon preview · site-wide motion layer (all pages).
   Adds: page-transition curtain + loader, scroll progress line, word-by-word headings,
   staggered reveals for every text block / card / product / image that has no animation yet,
   and a light parallax on photos. Never leaves content hidden: if anything fails, all stays visible. */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var home = !!document.querySelector('.oh');

  /* 1 · curtain: covers the page while it loads, lifts when ready, closes again before leaving */
  var cur = null;
  if (!RM) {
    cur = document.createElement('div'); cur.className = 'an-cur'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<b><i></i><i></i><i></i></b>';
    // the homepage has its own intro (same as the original site), so there the curtain only shows when leaving
    if (home) cur.className = 'an-cur in';
    document.body.appendChild(cur);
    if (!home) {
      var lift = function () { cur.style.setProperty('--ld', 1); setTimeout(function () { cur.classList.add('out'); }, 180); };
      requestAnimationFrame(function () { cur.style.setProperty('--ld', .6); });
      if (document.readyState === 'complete') lift(); else { addEventListener('load', lift); setTimeout(lift, 2500); }
    }
    // coming back with the browser's back button: never show a closed curtain
    addEventListener('pageshow', function (e) { if (e.persisted) { cur.className = 'an-cur out'; } });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]'); if (!a || e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || a.target === '_blank' || a.hasAttribute('download')) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || !/\/concept\/bbb-v2/.test(u.pathname)) return;
      if (u.pathname === location.pathname && u.hash) return; // same-page anchor
      if (/^(mailto|tel):/.test(a.getAttribute('href'))) return;
      e.preventDefault();
      cur.className = 'an-cur in'; void cur.offsetWidth; cur.classList.add('go');
      setTimeout(function () { location.href = u.href; }, 560);
    });
  }

  /* 2 · scroll progress line */
  var bar = document.createElement('div'); bar.className = 'an-prog'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
  var tick = false;
  addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tick = false; var h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0).toFixed(4) + ')'; });
  }, { passive: true });

  if (RM || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // things that already have their own motion (or must not move)
  var SKIP = 'header,nav,.nav,.mm,.mmenu,#intro,.oh,.b3,.pr,.fcta,.mcta,.rib,.pv-rib,.an-cur,.pq-cfg,.mo-w,.an-w,.up,.rv,.tv,.tv-img,#stmt,.mq,.oh-mq,form .err,[aria-hidden="true"]';
  var free = function (el) { return !el.closest(SKIP) && !el.dataset.an; };

  /* 3 · headings rise word by word */
  function split(el) {
    el.dataset.an = 1;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), f = document.createDocumentFragment();
          parts.forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { f.appendChild(document.createTextNode(w)); return; }
            var o = document.createElement('span'); o.className = 'an-w'; var i = document.createElement('span'); i.textContent = w; o.appendChild(i); f.appendChild(o);
          });
          c.parentNode.replaceChild(f, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && c.tagName !== 'SVG') walk(c);
      });
    })(el);
    return $$('.an-w>span', el);
  }
  $$('main h2, section h2, .sec h2, footer h2, .lo-card h2, h3').forEach(function (h) {
    if (!free(h) || h.closest('.card,.pq-c,.tm,.post,.plan')) return;
    var w = split(h); if (!w.length) return;
    gsap.from(w, { yPercent: 110, rotate: 4, duration: 1.05, ease: 'expo.out', stagger: .045, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  /* 4 · every other block comes in, one after another inside its group */
  var blocks = $$('section p, section li, section .btn, section .chips, section blockquote, section figure, section .card, section .tm, section .post, section .plan, section .pil, section .cc, section .opt, section dl, section details, section .fs-steps, section label, footer p, footer li, footer .ft-l, .pq-c, .nb-i, .rf-i, .ps-i, .fq details, .lo-card > *, .rv-c')
    .filter(free);
  var seen = new Set();
  blocks = blocks.filter(function (el) { for (var p = el.parentElement; p; p = p.parentElement) if (seen.has(p)) return false; seen.add(el); return true; });
  blocks.forEach(function (el) { el.dataset.an = 1; });
  ScrollTrigger.batch(blocks, {
    start: 'top 90%', once: true,
    onEnter: function (b) {
      gsap.fromTo(b, { opacity: 0, y: 36, scale: .985 }, { opacity: 1, y: 0, scale: 1, duration: .95, ease: 'power3.out', stagger: .07, overwrite: 'auto', clearProps: 'transform' });
    }
  });
  // hide them only once the batch is armed, and only those still below the fold (no flash on what is visible)
  blocks.forEach(function (el) { if (el.getBoundingClientRect().top > innerHeight * .9) gsap.set(el, { opacity: 0 }); });

  /* 5 · products: the panels rise in a wave, the photo settles from a slight zoom */
  var pq = $$('.pq-c');
  if (pq.length) {
    pq.forEach(function (c) { var im = c.querySelector('img'); if (im) gsap.from(im, { scale: 1.18, yPercent: 8, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 85%', once: true } }); });
  }

  /* 6 · photos: unveil from the bottom, then drift slightly slower than the page */
  $$('section img, footer img').forEach(function (im) {
    if (!free(im) || im.closest('.pq-c,.logo,.lg,.av,.card,.gl-g') || (im.naturalWidth && im.naturalWidth < 200)) return;
    var box = im.parentElement; im.dataset.an = 1;
    gsap.fromTo(im, { clipPath: 'inset(18% 0% 0% 0% round 22px)', scale: 1.12 }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', scale: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: box, start: 'top 90%', once: true }, clearProps: 'clipPath' });
  });


  /* 9 · photos drift a little slower than the page (parallax), without touching their hover zoom */
  $$('.fx-zpar img, .gl-g figure img, .fd-ph img, section .ph img').forEach(function (im) {
    if (im.closest('.fly,.pq-c,.b3')) return;
    gsap.fromTo(im, { '--py': '-7%' }, { '--py': '7%', ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    im.classList.add('an-px');
  });

  /* 10 · big numbers count up when they appear */
  $$('.nb b').forEach(function (b) {
    var tn = [].slice.call(b.childNodes).filter(function (n) { return n.nodeType === 3 && /\d/.test(n.textContent); })[0];
    if (!tn) return; var m = tn.textContent.match(/(\d+)/); if (!m) return;
    var target = +m[1], pre = tn.textContent.slice(0, m.index), post = tn.textContent.slice(m.index + m[1].length), o = { v: 0 };
    tn.textContent = pre + '0' + post;
    ScrollTrigger.create({ trigger: b, start: 'top 85%', once: true, onEnter: function () {
      gsap.to(o, { v: target, duration: 1.6, ease: 'power3.out', onUpdate: function () { tn.textContent = pre + Math.round(o.v) + post; } });
    } });
  });

  /* 7 · safety net: whatever happens, nothing stays invisible */
  setTimeout(function () { ScrollTrigger.refresh(); }, 1200);
  addEventListener('load', function () { ScrollTrigger.refresh(); });
  setTimeout(function () {
    blocks.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0 && +getComputedStyle(el).opacity < .05) gsap.to(el, { opacity: 1, y: 0, duration: .5 }); });
  }, 4000);
})();
