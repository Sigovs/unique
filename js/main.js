/**
 * Unique Motor Collection — home page interactions
 *
 * Vanilla, no dependencies. Mirrors the live site's behaviour:
 *   - Hero: 2-slide autoplay carousel, 5s interval, numbered dots (01. / 02.)
 *   - About: entrance reveal when the card scrolls into view
 *   - Instagram: continuous tile carousel with prev/next arrows
 *   - Mobile: burger menu toggle
 */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----------------------------------------------------------------------
       Hero slider
       ---------------------------------------------------------------------- */
    (function heroSlider() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) return;

        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        if (slides.length < 2) return;

        var index = 0;
        var timer = null;
        var INTERVAL = 5000;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                var active = i === index;
                dot.classList.toggle('is-active', active);
                dot.setAttribute('aria-selected', active ? 'true' : 'false');
            });
        }

        function start() {
            if (reduceMotion) return;
            stop();
            timer = window.setInterval(function () { show(index + 1); }, INTERVAL);
        }

        function stop() {
            if (timer) { window.clearInterval(timer); timer = null; }
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener('click', function () { show(i); start(); });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { stop(); } else { start(); }
        });

        show(0);
        start();
    }());

    /* ----------------------------------------------------------------------
       Scroll reveal (About card)
       ---------------------------------------------------------------------- */
    (function reveal() {
        var targets = Array.prototype.slice.call(document.querySelectorAll('[data-anim]'));
        if (!targets.length) return;

        if (reduceMotion || !('IntersectionObserver' in window)) {
            targets.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

        targets.forEach(function (el) { io.observe(el); });
    }());

    /* ----------------------------------------------------------------------
       Instagram gallery
       ---------------------------------------------------------------------- */
    (function gallery() {
        var root = document.querySelector('[data-gallery]');
        if (!root) return;

        var track = root.querySelector('[data-gallery-track]');
        var viewport = root.querySelector('.ig__viewport');
        var prev = root.querySelector('[data-gallery-prev]');
        var next = root.querySelector('[data-gallery-next]');
        var slides = Array.prototype.slice.call(track.children);
        if (!slides.length) return;

        var index = 0;
        var timer = null;
        var INTERVAL = 6000;   // matches the live Swiper autoplay delay

        function step() {
            var first = slides[0];
            var gap = parseFloat(getComputedStyle(track).gap) || 0;
            return first.getBoundingClientRect().width + gap;
        }

        function maxIndex() {
            var perView = Math.max(1, Math.round(viewport.clientWidth / step()));
            return Math.max(0, slides.length - perView);
        }

        function go(next_) {
            var limit = maxIndex();
            if (next_ > limit) next_ = 0;
            if (next_ < 0) next_ = limit;
            index = next_;
            track.style.transform = 'translate3d(' + (-index * step()) + 'px, 0, 0)';
        }

        function start() {
            if (reduceMotion) return;
            stop();
            timer = window.setInterval(function () { go(index + 1); }, INTERVAL);
        }

        function stop() {
            if (timer) { window.clearInterval(timer); timer = null; }
        }

        if (prev) prev.addEventListener('click', function () { go(index - 1); start(); });
        if (next) next.addEventListener('click', function () { go(index + 1); start(); });

        root.addEventListener('mouseenter', stop);
        root.addEventListener('mouseleave', start);

        var resizeTimer;
        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () { go(index); }, 150);
        });

        go(0);
        start();
    }());

    /* ----------------------------------------------------------------------
       Mobile menu
       ---------------------------------------------------------------------- */
    (function burger() {
        var btn = document.querySelector('[data-burger]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (!btn || !menu) return;

        btn.addEventListener('click', function () {
            var open = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', open ? 'false' : 'true');
            menu.hidden = open;
        });

        menu.addEventListener('click', function (e) {
            if (e.target.closest('a')) {
                btn.setAttribute('aria-expanded', 'false');
                menu.hidden = true;
            }
        });
    }());

}());
