/**
 * UNIQUE MOTORS — homepage interactions
 *
 * GSAP + ScrollTrigger drive:
 *   - Hero text reveal on load (mask + rise)
 *   - Hero image parallax (yPercent on scroll)
 *   - Sticky header shrink + frosted blur
 *   - Section / card reveals on scroll
 *   - About headline word-stagger reveal
 *   - About background parallax
 *   - Sold horizontal carousel: arrows, drag-to-scroll, button states
 */

(() => {
    "use strict";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof gsap === "undefined") {
        console.warn("GSAP failed to load; falling back to static page.");
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Slow, cinematic defaults
    gsap.defaults({ ease: "power3.out", duration: 1.2 });

    /* -----------------------------------------------------
     * 1. Hero — mask reveal of text + scrollcue
     * --------------------------------------------------- */
    const initHero = () => {
        const lines = gsap.utils.toArray("[data-hero-line]");
        if (!lines.length) return;

        gsap.set(lines, { yPercent: 110, opacity: 0 });

        gsap.to(lines, {
            yPercent: 0,
            opacity: 1,
            duration: 1.4,
            ease: "expo.out",
            stagger: 0.12,
            delay: 0.15,
        });
    };

    /* -----------------------------------------------------
     * 2. Hero image parallax — scroll-bound
     * --------------------------------------------------- */
    const initHeroParallax = () => {
        const heroImg = document.querySelector("[data-hero-img]");
        const hero = document.querySelector("[data-hero]");
        if (!heroImg || !hero) return;

        gsap.to(heroImg, {
            yPercent: 18,
            ease: "none",
            scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: true,
            },
        });
    };

    /* -----------------------------------------------------
     * 3. Sticky header — compact + frosted on scroll
     * --------------------------------------------------- */
    const initHeader = () => {
        const header = document.querySelector("[data-header]");
        if (!header) return;

        ScrollTrigger.create({
            start: "top -40",
            end: 99999,
            onUpdate: (self) => {
                header.classList.toggle("is-scrolled", self.scroll() > 40);
            },
        });
    };

    /* -----------------------------------------------------
     * 4. Generic reveal — fade + rise on scroll
     * --------------------------------------------------- */
    const initReveals = () => {
        const items = gsap.utils.toArray("[data-reveal]");
        items.forEach((el) => {
            gsap.fromTo(
                el,
                { y: 36, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.3,
                    ease: "expo.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 88%",
                        toggleActions: "play none none none",
                    },
                }
            );
        });
    };

    /* -----------------------------------------------------
     * 5. About headline — word-by-word reveal
     * --------------------------------------------------- */
    const initAboutSplit = () => {
        const target = document.querySelector("[data-reveal-split]");
        if (!target) return;

        // Walk text nodes and wrap each word in a <span>.
        const words = [];
        const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const frag = document.createDocumentFragment();
                node.textContent.split(/(\s+)/).forEach((part) => {
                    if (/^\s+$/.test(part)) {
                        frag.appendChild(document.createTextNode(part));
                    } else if (part.length) {
                        const wrap = document.createElement("span");
                        wrap.className = "word";
                        wrap.style.display = "inline-block";
                        wrap.style.willChange = "transform, opacity";
                        wrap.textContent = part;
                        frag.appendChild(wrap);
                        words.push(wrap);
                    }
                });
                node.parentNode.replaceChild(frag, node);
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
                Array.from(node.childNodes).forEach(walk);
            }
        };
        Array.from(target.childNodes).forEach(walk);

        gsap.set(words, { yPercent: 100, opacity: 0 });
        gsap.to(words, {
            yPercent: 0,
            opacity: 1,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.04,
            scrollTrigger: {
                trigger: target,
                start: "top 80%",
                toggleActions: "play none none none",
            },
        });
    };

    /* -----------------------------------------------------
     * 6. About background — slow parallax drift
     * --------------------------------------------------- */
    const initAboutParallax = () => {
        const bg = document.querySelector("[data-about-bg]");
        const section = document.querySelector("[data-about]");
        if (!bg || !section) return;

        gsap.to(bg, {
            yPercent: -12,
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
            },
        });
    };

    /* -----------------------------------------------------
     * 7. Card reveals (inventory + sold) — staggered per
     *    section using ScrollTrigger.batch so each row of
     *    cards animates only when its own section enters.
     * --------------------------------------------------- */
    const initCards = () => {
        if (!document.querySelector("[data-card]")) return;

        gsap.set("[data-card]", { y: 56, opacity: 0 });

        ScrollTrigger.batch("[data-card]", {
            start: "top 88%",
            onEnter: (batch) =>
                gsap.to(batch, {
                    y: 0,
                    opacity: 1,
                    duration: 1.3,
                    ease: "expo.out",
                    stagger: 0.1,
                    overwrite: true,
                }),
        });
    };

    /* -----------------------------------------------------
     * 9. Magnetic buttons — taste-skill MOTION_INTENSITY > 5
     *    Cursor-pull via gsap.quickTo (off the React/render
     *    cycle equivalent — direct GSAP transform).
     *    Skipped on touch devices to prevent stuck offsets.
     * --------------------------------------------------- */
    const initMagnetic = () => {
        const isTouch = window.matchMedia("(hover: none)").matches;
        if (isTouch) return;

        const targets = document.querySelectorAll("[data-magnetic]");
        targets.forEach((el) => {
            const xTo = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
            const yTo = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });
            const strength = 0.28;

            el.addEventListener("mousemove", (e) => {
                const r = el.getBoundingClientRect();
                xTo((e.clientX - r.left - r.width / 2) * strength);
                yTo((e.clientY - r.top - r.height / 2) * strength);
            });
            el.addEventListener("mouseleave", () => {
                xTo(0);
                yTo(0);
            });
        });
    };

    /* -----------------------------------------------------
     * Boot
     * --------------------------------------------------- */
    const start = () => {
        if (reduceMotion) {
            // Make everything visible without motion.
            gsap.set("[data-hero-line], [data-reveal], [data-card]",
                { clearProps: "all" });
            return;
        }

        initHero();
        initHeroParallax();
        initHeader();
        initReveals();
        initAboutSplit();
        initAboutParallax();
        initCards();
        initMagnetic();

        // Refresh after fonts/images settle so triggers measure correctly.
        window.addEventListener("load", () => ScrollTrigger.refresh());
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
