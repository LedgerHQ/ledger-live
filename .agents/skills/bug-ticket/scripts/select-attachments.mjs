#!/usr/bin/env node
// Usage: select-attachments.mjs --allure <dir> [--allure <dir>] --test "<title>" --out <dir>
// Picks Allure attachments of the last failed attempt. Writes files and manifest.json.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = name => {
  const out = [];
  args.forEach((a, i) => a === `--${name}` && out.push(args[i + 1]));
  return out;
};
const allureDirs = opt("allure");
const test = opt("test")[0];
const outDir = opt("out")[0];
if (!allureDirs.length || !test || !outDir) {
  console.error('usage: select-attachments.mjs --allure <dir> --test "<title>" --out <dir>');
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, "..", "config", "jira.json"), "utf8"));
const maxFile = config.limits.max_file_mb * 1024 * 1024;
const maxTotal = config.limits.max_total_mb * 1024 * 1024;
const maxFiles = config.limits.max_files;

// Lower number is attached first
const PRIORITY = [
  [/video/i, 0],
  [/error-context/i, 1],
  [/app screenshot|screenshot/i, 2],
  [/network failures/i, 3],
  [/webview console/i, 4],
  [/merged feature flags/i, 5],
];
const rank = name => PRIORITY.find(([re]) => re.test(name))?.[1] ?? 9;
const SKIP = /app network logs|test logs|stdout|stderr/i;
const TEXT = new Set([".txt", ".md", ".json", ".log", ".html"]);
const SECRET = /(authorization|x-api-key|api[_-]?key|token|secret|password)(["']?\s*[:=]\s*["']?)[^\s"',}]+/gi;

const walk = (steps, acc = []) => {
  for (const s of steps ?? []) {
    acc.push(...(s.attachments ?? []));
    walk(s.steps, acc);
  }
  return acc;
};

// Find the last failed attempt whose name is part of the test title
let best = null;
for (const dir of allureDirs) {
  for (const sub of [dir, ...readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => join(dir, d.name))]) {
    for (const f of readdirSync(sub).filter(n => n.endsWith("-result.json"))) {
      const r = JSON.parse(readFileSync(join(sub, f), "utf8"));
      if (!["failed", "broken"].includes(r.status) || !test.includes(r.name)) continue;
      if (!best || r.start > best.r.start) best = { r, dir: sub };
    }
  }
}
if (!best) {
  console.error(`no failed result found for: ${test}`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const slug = best.r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const candidates = [...(best.r.attachments ?? []), ...walk(best.r.steps)]
  .filter(a => !SKIP.test(a.name) && existsSync(join(best.dir, a.source)))
  .sort((a, b) => rank(a.name) - rank(b.name));

const manifest = [];
let total = 0;
for (const a of candidates) {
  if (manifest.length >= maxFiles) break;
  const src = join(best.dir, a.source);
  const size = statSync(src).size;
  if (size > maxFile || total + size > maxTotal) continue;
  const ext = extname(a.source);
  const base = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const name = `${slug}-${base}${ext}`;
  const dest = join(outDir, name);
  if (TEXT.has(ext)) {
    writeFileSync(dest, readFileSync(src, "utf8").replace(SECRET, "$1$2[redacted]"));
  } else {
    copyFileSync(src, dest);
  }
  total += size;
  manifest.push({ name, file: name, size, mime: a.type, from: a.name });
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify({ test: best.r.name, files: manifest }, null, 2));
console.log(`selected ${manifest.length} file(s), ${(total / 1048576).toFixed(1)} MB, for ${best.r.name}`);
