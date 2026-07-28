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

        /* nothing may keep moving behind an open dialog */
        document.addEventListener('umc:pause', stop);
        document.addEventListener('umc:resume', start);

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
        document.addEventListener('umc:pause', stop);
        document.addEventListener('umc:resume', start);

        var resizeTimer;
        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () { go(index); }, 150);
        });

        go(0);
        start();
    }());

    /* ----------------------------------------------------------------------
       Newsletter — drives every [data-newsletter] form on the page
       ---------------------------------------------------------------------- */
    (function newsletter() {
        var forms = Array.prototype.slice.call(document.querySelectorAll('[data-newsletter]'));
        if (!forms.length) return;

        /* ---- WordPress integration point ---------------------------------
           All Auto Network still owe us the AJAX action name, the nonce and
           the field names. Set ENDPOINT (and NONCE if they require one) and
           this is wired. Until then the call resolves locally so every state
           can be reviewed end to end. Nothing else needs to change. */
        var ENDPOINT = null;                       /* '/wp-admin/admin-ajax.php' */
        var ACTION   = 'umc_newsletter_subscribe';
        var NONCE    = null;

        function submitNewsletter(email, source) {
            if (!ENDPOINT) {
                return new Promise(function (resolve) { window.setTimeout(resolve, 700); });
            }
            var body = new FormData();
            body.append('action', ACTION);
            body.append('email', email);
            body.append('source', source || '');
            if (NONCE) body.append('_wpnonce', NONCE);

            return window.fetch(ENDPOINT, { method: 'POST', body: body, credentials: 'same-origin' })
                .then(function (res) {
                    if (!res.ok) throw new Error('http ' + res.status);
                    return res.json().catch(function () { return {}; });
                })
                .then(function (data) {
                    if (data && data.success === false) throw new Error('rejected');
                });
        }

        /* Deliberately permissive — the server is the real validator. This only
           catches the typos worth catching before a round trip. */
        var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        forms.forEach(function (form) {
            var input = form.querySelector('.nl__input');
            var msg = form.querySelector('.nl__msg');
            if (!input || !msg) return;

            function say(text, tone) {
                msg.textContent = text;
                if (tone) { msg.setAttribute('data-tone', tone); }
                else { msg.removeAttribute('data-tone'); }
            }

            function setState(state) {
                if (state) { form.setAttribute('data-state', state); }
                else { form.removeAttribute('data-state'); }
            }

            function fail(text) {
                setState('error');
                input.setAttribute('aria-invalid', 'true');
                say(text, 'error');
                input.focus();
            }

            /* clear the error as soon as the visitor starts fixing it */
            input.addEventListener('input', function () {
                if (form.getAttribute('data-state') !== 'error') return;
                setState(null);
                say('');
                input.removeAttribute('aria-invalid');
            });

            form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (form.getAttribute('data-state') === 'loading') return;

                var email = input.value.trim();

                /* every message names the problem in words — colour only reinforces it */
                if (!email) {
                    fail('Error: enter an email address so we know where to write.');
                    return;
                }
                if (!EMAIL.test(email)) {
                    fail('Error: that address looks incomplete — check it and try again.');
                    return;
                }

                setState('loading');
                input.removeAttribute('aria-invalid');
                say('Adding you to the list…');

                submitNewsletter(email, form.getAttribute('data-source'))
                    .then(function () {
                        setState('done');
                        say('You’re on the list. We’ll write when something rare arrives.');
                        document.dispatchEvent(new CustomEvent('umc:joined'));
                    })
                    .catch(function () {
                        fail('Error: that didn’t go through. Try again, or email edward@uniquemotorcollection.com.');
                    });
            });
        });
    }());

    /* ----------------------------------------------------------------------
       Newsletter pop-up

       Opens on load, as briefed. Dismissal is remembered for 30 days and a
       completed signup is remembered for good — without that it would reappear
       on every reload, which costs more than the capture is worth.
       ---------------------------------------------------------------------- */
    (function popup() {
        var root = document.querySelector('[data-popup]');
        if (!root) return;

        var dialog = root.querySelector('.pop__dialog');
        var form = root.querySelector('[data-newsletter]');
        /* Set to true before go-live. While false the pop-up opens on every
           reload, which is what you want for review and what you do not want
           for real visitors — it reappears after every dismissal. */
        var REMEMBER_DISMISSAL = false;

        var KEY = 'umc.newsletter';
        var DISMISS_DAYS = 30;
        var lastFocused = null;

        function readState() {
            try { return JSON.parse(window.localStorage.getItem(KEY)) || {}; }
            catch (e) { return {}; }
        }

        function writeState(patch) {
            try {
                var next = readState();
                Object.keys(patch).forEach(function (k) { next[k] = patch[k]; });
                window.localStorage.setItem(KEY, JSON.stringify(next));
            } catch (e) { /* private mode — the pop-up simply shows again */ }
        }

        function suppressed(now) {
            if (!REMEMBER_DISMISSAL) return false;
            var s = readState();
            if (s.joined) return true;
            if (!s.dismissedAt) return false;
            return (now - s.dismissedAt) < DISMISS_DAYS * 864e5;
        }

        function focusables() {
            return Array.prototype.slice.call(dialog.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )).filter(function (el) { return el.offsetParent !== null; });
        }

        function onKeydown(e) {
            if (e.key === 'Escape') { close(); return; }
            if (e.key !== 'Tab') return;

            var items = focusables();
            if (!items.length) return;
            var first = items[0];
            var last = items[items.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        }

        function open() {
            lastFocused = document.activeElement;
            root.hidden = false;
            document.body.style.overflow = 'hidden';
            document.dispatchEvent(new CustomEvent('umc:pause'));

            /* let the browser paint the hidden state before transitioning in */
            window.requestAnimationFrame(function () {
                window.requestAnimationFrame(function () { root.classList.add('is-open'); });
            });

            document.addEventListener('keydown', onKeydown);
            var items = focusables();
            if (items.length) items[0].focus();
        }

        function close() {
            root.classList.remove('is-open');
            document.removeEventListener('keydown', onKeydown);
            document.body.style.overflow = '';
            document.dispatchEvent(new CustomEvent('umc:resume'));

            var finish = function () { root.hidden = true; };
            if (reduceMotion) { finish(); } else { window.setTimeout(finish, 400); }

            if (!readState().joined) writeState({ dismissedAt: Date.now() });
            if (lastFocused && lastFocused.focus) lastFocused.focus();
        }

        root.addEventListener('click', function (e) {
            if (e.target.closest('[data-popup-close]')) close();
        });

        /* a completed signup anywhere on the page retires the pop-up for good */
        document.addEventListener('umc:joined', function () {
            writeState({ joined: true });
        });

        if (form) {
            form.addEventListener('submit', function () {
                window.setTimeout(function () {
                    if (form.getAttribute('data-state') === 'done') {
                        window.setTimeout(close, 1600);
                    }
                }, 900);
            });
        }

        if (!suppressed(Date.now())) open();
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
