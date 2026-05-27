// Midnight Tide WCAG contrast check.
// Computes contrast ratios for the palette pairs used across the site.

function hexToRgb(h) {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function relLum([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const la = relLum(hexToRgb(a));
  const lb = relLum(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function grade(r) {
  if (r >= 7) return "AAA";
  if (r >= 4.5) return "AA";
  if (r >= 3) return "AA-large";
  return "FAIL";
}

const pairs = [
  ["text on bg", "#f1f5f9", "#0a0e1a"],
  ["muted on bg", "#94a3b8", "#0a0e1a"],
  ["dim on bg (NEW)", "#7a8b9f", "#0a0e1a"],
  ["accent-glow on bg", "#60a5fa", "#0a0e1a"],
  ["text on surface", "#f1f5f9", "#111827"],
  ["muted on surface", "#94a3b8", "#111827"],
  ["btn: bg on accent (NEW)", "#0a0e1a", "#3b82f6"],
  ["btn hover: bg on accent-glow (NEW)", "#0a0e1a", "#60a5fa"],
];

for (const [label, fg, bg] of pairs) {
  const r = ratio(fg, bg);
  console.log(`${label.padEnd(22)} ${fg} on ${bg}: ${r.toFixed(2)} → ${grade(r)}`);
}
