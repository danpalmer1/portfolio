import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// ScrollTrigger registration is idempotent — re-registering on every page-load
// is cheap, and we need it here because this module may load before the Lenis
// bridge has registered it.
gsap.registerPlugin(ScrollTrigger);

let mm: gsap.MatchMedia | null = null;

function setup() {
  const root = document.querySelector("[data-hero]");
  if (!root) return;

  // Tear down any previous run before re-creating triggers on this page.
  destroy();

  mm = gsap.matchMedia();

  mm.add(
    {
      animated: "(prefers-reduced-motion: no-preference)",
      reduced: "(prefers-reduced-motion: reduce)",
    },
    (ctx) => {
      const { reduced } = ctx.conditions as { reduced: boolean };
      if (reduced) return; // CSS handles the static layout

      // ─── Scene 1: slow background zoom + tagline parallax ────────────
      const backdrop = root.querySelector(".hero-scene-1__backdrop");
      if (backdrop) {
        gsap.fromTo(
          backdrop,
          { scale: 1 },
          {
            scale: 1.15,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero-scene-1",
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }

      const taglineLede = root.querySelectorAll(
        ".hero-scene-1__tagline, .hero-scene-1__lede",
      );
      if (taglineLede.length) {
        gsap.to(taglineLede, {
          y: -30,
          opacity: 0.6,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-scene-1",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // ─── Scene 2: pinned phrase cross-fade ───────────────────────────
      const phrases = root.querySelectorAll<HTMLElement>(".hero-scene-2__phrase");
      if (phrases.length === 3) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".hero-scene-2",
            start: "top top",
            end: "+=2000",
            scrub: 0.5,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
          },
        });
        // Left-anchored layout means we don't need large y motion to mask
        // horizontal jitter — a 6px settle is enough character.
        // 0 → 1
        tl.to(phrases[0], { opacity: 0, y: -6, duration: 1 }, 0);
        tl.fromTo(phrases[1], { y: 6 }, { opacity: 1, y: 0, duration: 1 }, 0);
        // 1 → 2
        tl.to(phrases[1], { opacity: 0, y: -6, duration: 1 }, 1.5);
        tl.fromTo(phrases[2], { y: 6 }, { opacity: 1, y: 0, duration: 1 }, 1.5);
      }

      // ─── Scene 3: stat rise-in ───────────────────────────────────────
      const statElems = root.querySelectorAll(
        ".hero-scene-3__label, .hero-scene-3__stat, .hero-scene-3__sub, .hero-scene-3__caption",
      );
      if (statElems.length) {
        gsap.from(statElems, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".hero-scene-3",
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        });
      }

      // ─── Scene 4: cards stagger in ──────────────────────────────────
      const cards = root.querySelectorAll(".hero-scene-4__card");
      if (cards.length) {
        gsap.from(cards, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".hero-scene-4",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        });
      }

      // Lenis is bridged to ScrollTrigger via gsap.ticker; nothing else needed.
      // Refresh after layout settles to catch font-load shifts.
      ScrollTrigger.refresh();
    },
  );
}

function destroy() {
  if (mm) {
    mm.revert();
    mm = null;
  }
  // Belt-and-suspenders: kill any orphaned triggers from this page.
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

// Initial run + view-transition lifecycle.
setup();
document.addEventListener("astro:page-load", setup);
document.addEventListener("astro:before-swap", destroy);
