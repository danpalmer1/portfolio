// Static QA audit: walks dist/ and reports on SEO meta, headings, alt text,
// form labels, OG/canonical, etc. Doesn't replace Lighthouse / axe — those
// require a real browser — but catches the cheap-to-find issues before
// running the heavy tools.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".html")) out.push(p);
  }
  return out;
}

const findings = [];
function flag(file, level, msg) {
  findings.push({ file: relative(DIST, file), level, msg });
}

for (const file of walk(DIST)) {
  const html = readFileSync(file, "utf8");

  // SEO
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  if (!titleMatch || !titleMatch[1].trim()) flag(file, "error", "missing or empty <title>");

  const desc = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (!desc) flag(file, "error", "missing meta description");
  else if (desc[1].length < 50) flag(file, "warn", `meta description short (${desc[1].length} chars)`);
  else if (desc[1].length > 200) flag(file, "warn", `meta description long (${desc[1].length} chars)`);

  if (!html.includes('rel="canonical"')) flag(file, "error", "missing canonical link");
  if (!html.includes('property="og:image"')) flag(file, "warn", "missing og:image");
  if (!html.includes('name="twitter:card"')) flag(file, "warn", "missing twitter:card");

  // Headings — only check that an h1 exists
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  if (h1Count === 0) flag(file, "error", "no <h1>");
  else if (h1Count > 1) flag(file, "warn", `multiple <h1> (${h1Count})`);

  // Images — alt attribute presence
  const imgs = html.match(/<img\b[^>]*>/g) || [];
  for (const img of imgs) {
    if (!/\balt=/.test(img)) flag(file, "error", `<img> without alt: ${img.slice(0, 80)}…`);
  }

  // Form inputs / labels
  const inputs = html.match(/<(input|textarea|select)\b[^>]*>/g) || [];
  for (const inp of inputs) {
    const type = (inp.match(/\btype="([^"]+)"/) || [])[1];
    if (type && ["hidden", "submit", "button"].includes(type)) continue;
    const id = (inp.match(/\bid="([^"]+)"/) || [])[1];
    const ariaLabel = /\baria-label=/.test(inp);
    const ariaLabelledby = /\baria-labelledby=/.test(inp);
    if (!id && !ariaLabel && !ariaLabelledby) {
      flag(file, "warn", `<input>/textarea has no id, aria-label, or aria-labelledby: ${inp.slice(0, 80)}…`);
      continue;
    }
    if (id) {
      const re = new RegExp(`<label[^>]+for="${id}"`);
      if (!re.test(html) && !ariaLabel && !ariaLabelledby) {
        flag(file, "warn", `no <label for="${id}">`);
      }
    }
  }

  // Landmarks
  if (!html.includes("<main")) flag(file, "error", "missing <main>");
  if (!html.includes('<nav')) flag(file, "warn", "missing <nav>");
}

// Report
const errors = findings.filter((f) => f.level === "error");
const warns = findings.filter((f) => f.level === "warn");

console.log(`Audited ${walk(DIST).length} HTML files`);
console.log(`  ${errors.length} errors`);
console.log(`  ${warns.length} warnings`);
console.log();

if (errors.length) {
  console.log("ERRORS");
  for (const f of errors) console.log(`  ${f.file}: ${f.msg}`);
  console.log();
}
if (warns.length) {
  console.log("WARNINGS");
  for (const f of warns) console.log(`  ${f.file}: ${f.msg}`);
}

process.exit(errors.length ? 1 : 0);
