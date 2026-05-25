// One-shot generator for public/og-default.png (1200×630).
// Run with: node scripts/generate-og.mjs
//
// Re-run if the tagline, palette, or layout changes. The file is committed
// to public/ — not generated on every build, since it's static content.

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/og-default.png");

const W = 1200;
const H = 630;

// Midnight Tide palette
const C = {
  bgDeep: "#050810",
  bg: "#0a0e1a",
  surface: "#111827",
  border: "#1e293b",
  accentDeep: "#1e40af",
  accent: "#3b82f6",
  accentGlow: "#60a5fa",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  textDim: "#64748b",
};

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glowA" cx="15%" cy="20%" r="55%">
      <stop offset="0%" stop-color="${C.accentDeep}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${C.accentDeep}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="90%" cy="110%" r="60%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="border" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.border}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${C.border}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- background -->
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#glowA)"/>
  <rect width="${W}" height="${H}" fill="url(#glowB)"/>

  <!-- top hairline -->
  <rect width="${W}" height="1" fill="url(#border)"/>

  <!-- kicker -->
  <text x="80" y="120"
        font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="22"
        font-weight="500"
        letter-spacing="4"
        fill="${C.textDim}">
    DANIEL PALMER &#183; SHOREVIEW, MN
  </text>

  <!-- tagline -->
  <text x="80" y="290"
        font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="72"
        font-weight="600"
        letter-spacing="-2.2"
        fill="${C.text}">
    I help businesses automate
  </text>
  <text x="80" y="380"
        font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="72"
        font-weight="600"
        letter-spacing="-2.2"
        fill="${C.text}">
    the work that wastes
  </text>
  <text x="80" y="470"
        font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="72"
        font-weight="600"
        letter-spacing="-2.2"
        fill="${C.accentGlow}">
    their time.
  </text>

  <!-- domain -->
  <text x="80" y="560"
        font-family="ui-monospace, SFMono-Regular, monospace"
        font-size="22"
        letter-spacing="3"
        fill="${C.textMuted}">
    DANPALMER.DEV
  </text>
</svg>
`;

await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`Wrote ${OUT}`);
