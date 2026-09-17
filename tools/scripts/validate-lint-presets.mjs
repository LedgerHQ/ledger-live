#!/usr/bin/env node
// The lint-side counterpart of validate-tsconfig-presets.mts.
//
// A layer that has moved onto a `@support/lint-*` preset must not drift back: no package may carry
// its own oxlint or oxfmt config file, and its `lint` / `format` scripts must go through the preset
// bin rather than calling the tool directly. Both failures are silent — a stray `.oxlintrc.json` is
// picked up by oxlint's upward discovery and quietly replaces the preset.
//
//   node tools/scripts/validate-lint-presets.mjs

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Layers that have been migrated, and the preset bin their packages must call.
const MIGRATED = {
  "domain/entity": "lint-domain",
  "domain/api": "lint-domain",
  shared: "lint-shared",
  "features/flow": "lint-features-flow",
  "features/platform": "lint-features-platform",
  devtools: "lint-devtools",
  support: "lint-support",
};
const CONFIG_FILES = [".oxlintrc.json", ".oxlintrc.jsonc", ".oxfmtrc.json", ".oxfmtrc.jsonc"];
// The presets themselves, and jest-only fixture packages, have no TypeScript of their own to lint.
const EXEMPT = /^support\/(lint-|ts-|fmt-|jest-)/;

const problems = [];

for (const [layer, bin] of Object.entries(MIGRATED)) {
  const layerDir = join(repoRoot, layer);
  if (!existsSync(layerDir)) continue;

  for (const config of CONFIG_FILES) {
    if (existsSync(join(layerDir, config))) {
      problems.push(`${layer}/${config}: layer-level config; fold it into @support/${bin}`);
    }
  }

  for (const entry of readdirSync(layerDir)) {
    const rel = `${layer}/${entry}`;
    const dir = join(layerDir, entry);
    if (!existsSync(join(dir, "package.json"))) continue;

    for (const config of CONFIG_FILES) {
      if (existsSync(join(dir, config))) {
        problems.push(
          `${rel}/${config}: migrated packages carry no lint config; @support/${bin} is the config`,
        );
      }
    }

    if (EXEMPT.test(rel)) continue;
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    } catch {
      continue;
    }
    const scripts = pkg.scripts ?? {};
    const devDeps = pkg.devDependencies ?? {};

    for (const name of ["lint", "lint:fix"]) {
      const script = scripts[name];
      if (!script) continue;
      if (/(^|\s)oxlint(\s|$)/.test(script)) {
        problems.push(`${rel}: scripts.${name} calls oxlint directly; use \`${bin}\``);
      }
    }
    for (const name of ["format", "format:check"]) {
      const script = scripts[name];
      if (!script) continue;
      if (/(^|\s)oxfmt(\s|$)/.test(script)) {
        problems.push(`${rel}: scripts.${name} calls oxfmt directly; use \`fmt-base\``);
      }
    }
    if (scripts.lint && !devDeps[`@support/${bin}`]) {
      problems.push(
        `${rel}: scripts.lint uses \`${bin}\` but @support/${bin} is not a devDependency`,
      );
    }
    if (scripts.format && !devDeps["@support/fmt-base"]) {
      problems.push(
        `${rel}: scripts.format uses \`fmt-base\` but @support/fmt-base is not a devDependency`,
      );
    }
  }
}

if (problems.length > 0) {
  process.stderr.write(`${problems.length} lint preset violation(s):\n`);
  for (const p of problems) process.stderr.write(`  - ${p}\n`);
  process.exit(1);
}
process.stdout.write("lint presets: all migrated layers conform\n");
