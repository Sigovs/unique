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
     * 7. Inventory cards — staggered reveal
     * --------------------------------------------------- */
    const initCards = () => {
        const cards = gsap.utils.toArray("[data-card]");
        if (!cards.length) return;

        gsap.fromTo(
            cards,
            { y: 56, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.3,
                ease: "expo.out",
                stagger: 0.12,
                scrollTrigger: {
                    trigger: cards[0],
                    start: "top 85%",
                    toggleActions: "play none none none",
                },
            }
        );
    };

    /* -----------------------------------------------------
     * 8. Sold carousel — arrows + drag-to-scroll
     * --------------------------------------------------- */
    const initSoldCarousel = () => {
        const track = document.querySelector("[data-sold-track]");
        const rail = document.querySelector("[data-sold-rail]");
        const prev = document.querySelector("[data-sold-prev]");
        const next = document.querySelector("[data-sold-next]");
        if (!track || !rail) return;

        const stepDistance = () => {
            const card = rail.querySelector(".sold-card");
            if (!card) return track.clientWidth * 0.8;
            const style = getComputedStyle(rail);
            const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
            return card.getBoundingClientRect().width + gap;
        };

        const updateButtons = () => {
            if (!prev || !next) return;
            const max = track.scrollWidth - track.clientWidth - 1;
            prev.disabled = track.scrollLeft <= 0;
            next.disabled = track.scrollLeft >= max;
        };

        prev?.addEventListener("click", () => {
            track.scrollBy({ left: -stepDistance(), behavior: "smooth" });
        });
        next?.addEventListener("click", () => {
            track.scrollBy({ left: stepDistance(), behavior: "smooth" });
        });

        track.addEventListener("scroll", updateButtons, { passive: true });
        window.addEventListener("resize", updateButtons);
        updateButtons();

        // Drag-to-scroll (mouse). Touch uses native horizontal scroll.
        let isDown = false;
        let startX = 0;
        let startLeft = 0;
        let moved = 0;

        track.addEventListener("mousedown", (e) => {
            isDown = true;
            moved = 0;
            startX = e.pageX;
            startLeft = track.scrollLeft;
            track.classList.add("is-dragging");
        });

        const release = () => {
            if (!isDown) return;
            isDown = false;
            track.classList.remove("is-dragging");
        };
        window.addEventListener("mouseup", release);
        track.addEventListener("mouseleave", release);

        track.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            e.preventDefault();
            const dx = e.pageX - startX;
            moved = Math.abs(dx);
            track.scrollLeft = startLeft - dx;
        });

        // Suppress click after a meaningful drag.
        track.addEventListener("click", (e) => {
            if (moved > 6) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        // Sold rail entrance
        gsap.fromTo(
            rail.querySelectorAll(".sold-card"),
            { x: 60, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 1.2,
                ease: "expo.out",
                stagger: 0.08,
                scrollTrigger: {
                    trigger: track,
                    start: "top 85%",
                    toggleActions: "play none none none",
                },
            }
        );
    };

    /* -----------------------------------------------------
     * Boot
     * --------------------------------------------------- */
    const start = () => {
        if (reduceMotion) {
            // Make everything visible without motion.
            gsap.set("[data-hero-line], [data-reveal], [data-card], .sold-card",
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
        initSoldCarousel();

        // Refresh after fonts/images settle so triggers measure correctly.
        window.addEventListener("load", () => ScrollTrigger.refresh());
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
