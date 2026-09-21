#!/usr/bin/env node
// The lint-side counterpart of validate-tsconfig-presets.mts.
//
// Rules are shared through a layer config that oxlint finds by walking up, which is the same way
// the editor extension resolves them. Three ways that can silently break:
//
//   - a layer loses its config, and every package under it falls back to oxlint's built-in
//     defaults without anything failing;
//   - a package grows its own config, which then shadows the layer for that package only;
//   - a package depends on a `@support/lint-*` preset directly, which is unnecessary (the layer
//     config resolves it from the workspace root) and leaks into published manifests.
//
//   node tools/scripts/validate-lint-presets.mjs

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Layer directory -> the preset its config must name.
const LAYERS = {
  domain: "lint-domain",
  shared: "lint-shared",
  "features/flow": "lint-features-flow",
  "features/platform": "lint-features-platform",
  devtools: "lint-devtools",
  support: "lint-support",
  tools: "lint-tools",
  libs: "lint-libs",
};

// Sub-trees under a migrated layer that legitimately keep their own config, because their rule
// vocabulary is genuinely different. Each is a preset of its own waiting to be written.
const OWN_CONFIG_ALLOWED = new Set([
  "libs/coin-modules",
  "libs/coin-modules/coin-bitcoin",
  "libs/coin-tester",
  "libs/coin-tester-modules",
  "libs/ledger-live-common",
  "libs/ledger-services",
  "libs/ledgerjs/packages",
  "libs/ui",
  "libs/wallet-btc",
]);

const CONFIG_FILES = [".oxlintrc.json", ".oxlintrc.jsonc"];
const problems = [];

for (const [layer, preset] of Object.entries(LAYERS)) {
  const config = join(repoRoot, layer, "oxlint.config.mts");
  if (!existsSync(config)) {
    problems.push(
      `${layer}/oxlint.config.mts is missing; every package below it falls back to oxlint's defaults`,
    );
    continue;
  }
  const body = readFileSync(config, "utf8");
  if (!body.includes(`@support/${preset}/oxlint.config`)) {
    problems.push(`${layer}/oxlint.config.mts does not name @support/${preset}/oxlint.config`);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs);
      continue;
    }
    if (entry.name !== "package.json") continue;

    const rel = relative(repoRoot, dir).split("\\").join("/");
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(abs, "utf8"));
    } catch {
      continue;
    }

    const layer = Object.keys(LAYERS).find(l => rel === l || rel.startsWith(`${l}/`));
    if (layer) {
      for (const config of CONFIG_FILES) {
        if (!existsSync(join(dir, config))) continue;
        const shadowed = [...OWN_CONFIG_ALLOWED].some(a => rel === a || rel.startsWith(`${a}/`));
        if (!shadowed) {
          problems.push(
            `${rel}/${config} shadows the ${layer} layer config for this package alone`,
          );
        }
      }
    }

    const direct = Object.keys(pkg.devDependencies ?? {}).filter(d =>
      d.startsWith("@support/lint-"),
    );
    if (direct.length > 0 && !rel.startsWith("support/")) {
      problems.push(
        `${rel}: depends on ${direct.join(", ")}; the layer config resolves presets from the workspace root`,
      );
    }
  }
}
for (const top of [
  "apps",
  "devtools",
  "domain",
  "e2e",
  "features",
  "libs",
  "shared",
  "support",
  "tests",
  "tools",
]) {
  const abs = join(repoRoot, top);
  if (existsSync(abs)) walk(abs);
}

if (problems.length > 0) {
  process.stderr.write(`${problems.length} lint preset violation(s):\n`);
  for (const p of problems) process.stderr.write(`  - ${p}\n`);
  process.exit(1);
}
process.stdout.write("lint presets: every migrated layer resolves through its layer config\n");
