import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis;
    __lenisRaf?: (time: number) => void;
  }
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function init() {
  if (prefersReducedMotion()) return;
  if (window.__lenis) return;

  const lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    autoRaf: false,
  });

  lenis.on("scroll", ScrollTrigger.update);

  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  window.__lenis = lenis;
  window.__lenisRaf = raf;
}

function teardown() {
  if (!window.__lenis) return;
  if (window.__lenisRaf) gsap.ticker.remove(window.__lenisRaf);
  window.__lenis.destroy();
  window.__lenis = undefined;
  window.__lenisRaf = undefined;
}

// Initial page load
init();

// Astro View Transitions lifecycle:
// - before-swap: tear down so the new page starts clean
// - page-load: re-init + refresh ScrollTrigger after DOM is in place
document.addEventListener("astro:before-swap", teardown);
document.addEventListener("astro:page-load", () => {
  init();
  ScrollTrigger.refresh();
});
