/* Chowbeans — small progressive enhancements. No dependencies. */
(function () {
  'use strict';

  /* Header condenses once the page leaves the top. */
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Easter egg: five clicks on the wordmark dot opens the rail rule editor.
     No password — this is a mockup, and the page is unlisted, not secret. */
  var dot = document.querySelector('.wordmark i');
  if (dot) {
    var hits = 0;
    var reset;
    dot.addEventListener('click', function (event) {
      event.preventDefault();
      clearTimeout(reset);
      reset = setTimeout(function () { hits = 0; }, 1200);
      if (++hits >= 5) window.location.href = 'admin.html';
    });
  }

  /* Staggered reveals. Elements start hidden only if JS runs, so
     no-JS visitors still see everything. */
  var targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  document.documentElement.classList.add('reveal-ready');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  targets.forEach(function (el) { io.observe(el); });
})();
