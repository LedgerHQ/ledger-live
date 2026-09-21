#!/usr/bin/env node
// Captures the fully resolved tsconfig (`tsc --showConfig`) for every config in a tree. Two configs
// that resolve identically produce identical builds, so diffing these is a stronger and much
// faster check than rebuilding.
//
//   node tools/scripts/tsconfig-resolved-snapshot.mjs out.json <dir>...
//   node tools/scripts/tsconfig-resolved-snapshot.mjs --diff before.json after.json

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tsc = join(repoRoot, "node_modules", "typescript", "bin", "tsc6");

function snapshot(dirs) {
  const out = {};
  for (const d of dirs) {
    const abs = join(repoRoot, d);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs)) {
      const pkg = join(abs, entry);
      if (!existsSync(join(pkg, "package.json"))) continue;
      for (const name of ["tsconfig.json", "tsconfig.build.json", "tsconfig.prod.json"]) {
        const cfg = join(pkg, name);
        if (!existsSync(cfg)) continue;
        const r = spawnSync(process.execPath, [tsc, "-p", name, "--showConfig"], {
          cwd: pkg,
          encoding: "utf8",
          maxBuffer: 1 << 28,
        });
        let parsed;
        try {
          parsed = JSON.parse(r.stdout);
        } catch {
          out[`${d}/${entry}/${name}`] = { error: (r.stdout || r.stderr).slice(0, 200) };
          continue;
        }
        out[`${d}/${entry}/${name}`] = parsed;
      }
    }
  }
  return out;
}

const [first, ...rest] = process.argv.slice(2);
if (first === "--diff") {
  const b = JSON.parse(readFileSync(rest[0], "utf8"));
  const a = JSON.parse(readFileSync(rest[1], "utf8"));
  let changed = 0;
  for (const k of [...new Set([...Object.keys(b), ...Object.keys(a)])].sort()) {
    if (!b[k]) {
      process.stdout.write(`+ ${k}\n`);
      changed++;
      continue;
    }
    if (!a[k]) {
      process.stdout.write(`- ${k}\n`);
      changed++;
      continue;
    }
    if (JSON.stringify(b[k]) === JSON.stringify(a[k])) continue;
    changed++;
    process.stdout.write(`~ ${k}\n`);
    const keys = [...new Set([...Object.keys(b[k]), ...Object.keys(a[k])])];
    for (const top of keys) {
      const bv = JSON.stringify(b[k][top]);
      const av = JSON.stringify(a[k][top]);
      if (bv === av) continue;
      if (top === "compilerOptions") {
        const bo = b[k][top] ?? {},
          ao = a[k][top] ?? {};
        for (const o of [...new Set([...Object.keys(bo), ...Object.keys(ao)])]) {
          if (JSON.stringify(bo[o]) !== JSON.stringify(ao[o])) {
            process.stdout.write(
              `    ${o}: ${JSON.stringify(bo[o])} -> ${JSON.stringify(ao[o])}\n`,
            );
          }
        }
      } else {
        process.stdout.write(
          `    ${top}: ${(bv ?? "").slice(0, 70)} -> ${(av ?? "").slice(0, 70)}\n`,
        );
      }
    }
  }
  process.stdout.write(`\n${changed} configs differ\n`);
} else {
  const data = snapshot(rest);
  writeFileSync(first, `${JSON.stringify(data, null, 2)}\n`);
  const bad = Object.values(data).filter(v => v.error).length;
  process.stdout.write(`${Object.keys(data).length} configs resolved, ${bad} failed\n`);
}
