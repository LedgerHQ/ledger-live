#!/usr/bin/env node
// Captures, for every workspace package that has a `lint` script, the set of oxlint rules that are
// actually enabled for it and every diagnostic those rules produce. Run it before and after a lint
// preset migration and diff the two snapshots: any rule that appears, disappears or changes severity
// is then a deliberate line item rather than a surprise in CI.
//
//   node tools/scripts/lint-diagnostics-snapshot.mjs before.json
//   node tools/scripts/lint-diagnostics-snapshot.mjs after.json
//   node tools/scripts/lint-diagnostics-snapshot.mjs --diff before.json after.json

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const oxlintCli = join(repoRoot, "node_modules", "oxlint", "bin", "oxlint");

// Package roots are derived from pnpm-workspace.yaml rather than hardcoded, because a hardcoded
// list silently misses nested workspaces: `tools/**` covers tools/actions/* two levels down.
function workspaceGlobs() {
  const yaml = readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8");
  const globs = [];
  for (const line of yaml.split("\n")) {
    const m = line.match(/^\s*-\s*"([^"]+)"\s*$/);
    if (!m) continue;
    if (line.startsWith("  -") || line.startsWith("- ")) globs.push(m[1]);
    if (globs.length > 0 && !/^\s*-/.test(line)) break;
  }
  return globs;
}

function matches(rel, globs) {
  for (const g of globs) {
    if (g.endsWith("/**")) {
      const base = g.slice(0, -3);
      if (rel === base || rel.startsWith(`${base}/`)) return true;
    } else {
      const rx = new RegExp(
        `^${g
          .split("*")
          .map(x => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
          .join("[^/]*")}$`,
      );
      if (rx.test(rel)) return true;
    }
  }
  return false;
}

function listPackages() {
  const globs = workspaceGlobs();
  const out = [];
  const SKIP = new Set(["node_modules", ".git", ".nx", "dist", "build", "lib", "lib-es"]);
  const walk = (dir, rel) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || SKIP.has(entry.name) || entry.name.startsWith(".")) continue;
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const childDir = join(dir, entry.name);
      const manifest = join(childDir, "package.json");
      if (existsSync(manifest) && matches(childRel, globs)) {
        out.push({ rel: childRel, dir: childDir, manifest });
      }
      walk(childDir, childRel);
    }
  };
  walk(repoRoot, "");
  return out;
}

// Resolves a package's `lint` script to something runnable with `-f json`. Two shapes exist: a
// direct `oxlint ...` call, and a `@support/lint-*` preset bin linked into the package's own
// node_modules/.bin, which forwards its arguments straight to oxlint. The `&& pnpm lint:tailwind`
// tail is dropped either way: that is the tailwind eslint sidecar, which this snapshot does not
// cover.
function lintInvocation(script, pkgDir) {
  const head = script.split("&&")[0].trim();
  const tokens = head.match(/'[^']*'|"[^"]*"|\S+/g) ?? [];
  if (tokens.length === 0) return null;
  const stripped = tokens.map(t => t.replace(/^['"]|['"]$/g, ""));
  const start = stripped.indexOf("oxlint");
  if (start !== -1) return { bin: oxlintCli, args: stripped.slice(start + 1) };
  const presetBin = join(pkgDir, "node_modules", ".bin", stripped[0]);
  if (existsSync(presetBin)) return { bin: presetBin, args: stripped.slice(1) };
  return null;
}

function snapshot() {
  const result = {};
  for (const pkg of listPackages()) {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(pkg.manifest, "utf8"));
    } catch {
      continue;
    }
    const script = manifest.scripts?.lint;
    if (!script) continue;
    const invocation = lintInvocation(script, pkg.dir);
    if (!invocation) {
      result[pkg.rel] = { script, error: "unparsed" };
      continue;
    }
    // A preset bin is a pnpm shell shim, not a JS file, so it is spawned directly; the raw oxlint
    // CLI still goes through node.
    const direct = invocation.bin !== oxlintCli;
    const cmd = direct ? invocation.bin : process.execPath;
    const argv = direct ? invocation.args : [invocation.bin, ...invocation.args];
    const run = spawnSync(cmd, [...argv, "-f", "json"], {
      cwd: pkg.dir,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    });
    let parsed;
    try {
      parsed = JSON.parse(run.stdout);
    } catch {
      result[pkg.rel] = { script, error: (run.stderr || run.stdout).slice(0, 400) };
      continue;
    }
    const byRule = {};
    for (const d of parsed.diagnostics ?? []) {
      // `code` looks like `eslint(no-console)` or `typescript(no-explicit-any)`.
      const key = `${d.severity ?? "error"} ${d.code ?? "?"}`;
      byRule[key] = (byRule[key] ?? 0) + 1;
    }
    result[pkg.rel] = {
      script,
      exit: run.status,
      files: parsed.number_of_files,
      rules: parsed.number_of_rules,
      diagnostics: parsed.diagnostics?.length ?? 0,
      byRule,
    };
  }
  return result;
}

function diff(beforePath, afterPath) {
  const before = JSON.parse(readFileSync(beforePath, "utf8"));
  const after = JSON.parse(readFileSync(afterPath, "utf8"));
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const lines = [];
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    if (!b) {
      lines.push(`+ ${key}  NEWLY LINTED  rules=${a.rules} diagnostics=${a.diagnostics}`);
      continue;
    }
    if (!a) {
      lines.push(`- ${key}  NO LONGER LINTED (was rules=${b.rules})`);
      continue;
    }
    const changes = [];
    if (b.rules !== a.rules) changes.push(`rules ${b.rules} -> ${a.rules}`);
    if (b.diagnostics !== a.diagnostics) {
      changes.push(`diagnostics ${b.diagnostics} -> ${a.diagnostics}`);
    }
    if (b.exit !== a.exit) changes.push(`exit ${b.exit} -> ${a.exit}`);
    const ruleKeys = [...new Set([...Object.keys(b.byRule ?? {}), ...Object.keys(a.byRule ?? {})])];
    for (const r of ruleKeys.sort()) {
      const bn = b.byRule?.[r] ?? 0;
      const an = a.byRule?.[r] ?? 0;
      if (bn !== an) changes.push(`${r}: ${bn} -> ${an}`);
    }
    if (changes.length > 0) lines.push(`~ ${key}\n    ${changes.join("\n    ")}`);
  }
  return lines.join("\n");
}

const [first, ...rest] = process.argv.slice(2);
if (first === "--diff") {
  process.stdout.write(`${diff(rest[0], rest[1])}\n`);
} else {
  const data = snapshot();
  writeFileSync(first, `${JSON.stringify(data, null, 2)}\n`);
  const linted = Object.keys(data).length;
  const failing = Object.values(data).filter(d => d.exit !== 0).length;
  process.stdout.write(`${linted} packages snapshotted, ${failing} non-zero exit -> ${first}\n`);
}
