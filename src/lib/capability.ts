/**
 * Detect whether this client can comfortably render the WebGL background.
 * Gates from SPEC.md: viewport ≥1024px, ≥4 cores, ≥4GB RAM (where exposed),
 * and prefers-reduced-motion not set.
 *
 * deviceMemory is not exposed by Safari/Firefox; treat absent as "pass" rather
 * than fail, otherwise we'd never run WebGL on Safari.
 */
export function canRunWebGL(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (window.innerWidth < 1024) return false;

  const cores = navigator.hardwareConcurrency ?? 0;
  if (cores < 4) return false;

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory < 4) return false;

  return true;
}
