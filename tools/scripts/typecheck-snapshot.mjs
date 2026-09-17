#!/usr/bin/env node
// Runs every package's own `typecheck` script directly, without nx, and records pass/fail per
// package. Use it the same way as lint-diagnostics-snapshot.mjs: once before a migration, once
// after, then diff. Going through nx is not an option from a git worktree, because nx resolves its
// workspace-data lock to the main checkout.
//
//   node tools/scripts/typecheck-snapshot.mjs out.json [layer ...]
//   node tools/scripts/typecheck-snapshot.mjs --diff before.json after.json

import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_LAYERS = [
  "domain/entity",
  "domain/api",
  "shared",
  "features/flow",
  "features/platform",
  "devtools",
  "support",
];

function listPackages(layers) {
  const out = [];
  for (const layer of layers) {
    const abs = join(repoRoot, layer);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs)) {
      const dir = join(abs, entry);
      const manifest = join(dir, "package.json");
      if (!existsSync(manifest)) continue;
      let pkg;
      try {
        pkg = JSON.parse(readFileSync(manifest, "utf8"));
      } catch {
        continue;
      }
      if (!pkg.scripts?.typecheck) continue;
      out.push({ rel: `${layer}/${entry}`, dir, name: pkg.name });
    }
  }
  return out;
}

function run(pkg) {
  return new Promise(done => {
    const child = spawn("pnpm", ["run", "--silent", "typecheck"], {
      cwd: pkg.dir,
      encoding: "utf8",
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    let out = "";
    child.stdout.on("data", d => (out += d));
    child.stderr.on("data", d => (out += d));
    child.on("close", code => {
      const errors = [...out.matchAll(/error TS\d+/g)].length;
      done([
        pkg.rel,
        { name: pkg.name, exit: code, errors, tail: code === 0 ? "" : out.slice(-1500) },
      ]);
    });
  });
}

async function snapshot(layers) {
  const queue = listPackages(layers);
  const result = {};
  const limit = Math.max(2, Math.min(8, cpus().length - 2));
  let index = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (index < queue.length) {
        const pkg = queue[index++];
        const [rel, data] = await run(pkg);
        result[rel] = data;
        process.stderr.write(`${data.exit === 0 ? "ok  " : "FAIL"} ${rel}\n`);
      }
    }),
  );
  return result;
}

const [first, ...rest] = process.argv.slice(2);
if (first === "--diff") {
  const before = JSON.parse(readFileSync(rest[0], "utf8"));
  const after = JSON.parse(readFileSync(rest[1], "utf8"));
  for (const key of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()) {
    const b = before[key];
    const a = after[key];
    if (!b) process.stdout.write(`+ ${key}: new, exit ${a.exit} (${a.errors} errors)\n`);
    else if (!a) process.stdout.write(`- ${key}: gone\n`);
    else if (b.exit !== a.exit || b.errors !== a.errors) {
      process.stdout.write(
        `~ ${key}: exit ${b.exit} -> ${a.exit}, errors ${b.errors} -> ${a.errors}\n`,
      );
    }
  }
} else {
  const data = await snapshot(rest.length > 0 ? rest : DEFAULT_LAYERS);
  writeFileSync(first, `${JSON.stringify(data, null, 2)}\n`);
  const failed = Object.entries(data).filter(([, v]) => v.exit !== 0);
  process.stdout.write(`${Object.keys(data).length} packages, ${failed.length} failing\n`);
}
