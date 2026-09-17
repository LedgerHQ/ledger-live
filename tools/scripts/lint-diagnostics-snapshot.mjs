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

const WORKSPACE_DIRS = [
  "apps",
  "devtools",
  "domain/api",
  "domain/entity",
  "e2e",
  "features/flow",
  "features/platform",
  "libs",
  "libs/coin-modules",
  "libs/coin-tester-modules",
  "libs/ledger-services",
  "libs/ledgerjs/packages",
  "libs/ui/packages",
  "shared",
  "support",
  "tests",
  "tools",
];

function listPackages() {
  const out = [];
  for (const dir of WORKSPACE_DIRS) {
    const abs = join(repoRoot, dir);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs)) {
      const pkgDir = join(abs, entry);
      if (!statSync(pkgDir).isDirectory()) continue;
      const manifest = join(pkgDir, "package.json");
      if (!existsSync(manifest)) continue;
      out.push({ rel: `${dir}/${entry}`, dir: pkgDir, manifest });
    }
  }
  return out;
}

// Turns `oxlint -c ../x/.oxlintrc.json ./src && pnpm lint:tailwind` into the oxlint argv. The `&&`
// tail is dropped: it is the tailwind eslint sidecar, which this snapshot does not cover.
function oxlintArgs(script) {
  const head = script.split("&&")[0].trim();
  const tokens = head.match(/'[^']*'|"[^"]*"|\S+/g) ?? [];
  if (tokens[0] !== "oxlint" && tokens[0] !== "pnpm") return null;
  const start = tokens.indexOf("oxlint");
  if (start === -1) return null;
  return tokens.slice(start + 1).map(t => t.replace(/^['"]|['"]$/g, ""));
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
    const args = oxlintArgs(script);
    if (!args) {
      result[pkg.rel] = { script, error: "unparsed" };
      continue;
    }
    const run = spawnSync(process.execPath, [oxlintCli, ...args, "-f", "json"], {
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
