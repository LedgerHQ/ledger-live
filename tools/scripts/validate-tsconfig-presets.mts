#!/usr/bin/env tsx
/**
 * Validates that tsconfig files extending @support/ts-config-* presets do not
 * re-declare compilerOptions fields already set (with the same value) by the
 * preset. Redundant re-declarations split maintenance across two files.
 *
 * Usage: tsx tools/scripts/validate-tsconfig-presets.mts [tsconfig files...]
 * Exits 0 if no files passed or no violations found.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";

// ── JSON-with-comments parser ─────────────────────────────────────────────────

function stripComments(text: string): string {
  // Remove line comments, then block comments, preserving newlines for error msgs.
  return text
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,(\s*[}\]])/g, "$1"); // trailing commas (tsconfig uses them)
}

function parseJsonc(filePath: string): Record<string, unknown> {
  return JSON.parse(stripComments(readFileSync(filePath, "utf-8")));
}

// ── Module resolution ─────────────────────────────────────────────────────────

function resolveNodeModule(
  startDir: string,
  packageName: string,
  subPath: string,
): string | null {
  // Try node_modules walk first (works after pnpm install).
  let dir = startDir;
  while (true) {
    const candidate = join(dir, "node_modules", packageName, subPath);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Fallback: resolve @support/* directly from workspace source (works in CI
  // without pnpm install, since support/ is always in the checkout).
  if (packageName.startsWith("@support/")) {
    const pkgFolder = packageName.slice("@support/".length);
    let root = startDir;
    while (true) {
      const candidate = join(root, "support", pkgFolder, subPath);
      if (existsSync(candidate)) return candidate;
      const parent = dirname(root);
      if (parent === root) break;
      root = parent;
    }
  }

  return null;
}

/** Splits "@support/ts-config-web-x-native/tsconfig.web.json" into
 *  { pkg: "@support/ts-config-web-x-native", sub: "tsconfig.web.json" } */
function parseExtendsSpecifier(specifier: string): { pkg: string; sub: string } {
  const parts = specifier.split("/");
  // scoped package: first two segments are the package name
  const pkg = parts.slice(0, 2).join("/");
  const sub = parts.slice(2).join("/") || "tsconfig.json";
  return { pkg, sub };
}

// ── Preset compilerOptions resolver ──────────────────────────────────────────

function resolvePresetCompilerOptions(
  presetPath: string,
  visited = new Set<string>(),
): Record<string, unknown> {
  const abs = resolve(presetPath);
  if (visited.has(abs)) return {};
  visited.add(abs);

  let config: Record<string, unknown>;
  try {
    config = parseJsonc(presetPath);
  } catch {
    return {};
  }

  const local = (config.compilerOptions as Record<string, unknown>) ?? {};
  const extendsVal = config.extends as string | undefined;
  if (!extendsVal) return local;

  let parentPath: string | null = null;

  if (extendsVal.startsWith(".")) {
    let candidate = resolve(dirname(presetPath), extendsVal);
    if (!candidate.endsWith(".json")) candidate += ".json";
    parentPath = existsSync(candidate) ? candidate : null;
  } else if (extendsVal.startsWith("@support/ts-config-")) {
    const { pkg, sub } = parseExtendsSpecifier(extendsVal);
    parentPath = resolveNodeModule(dirname(presetPath), pkg, sub);
  }
  // Other extends (e.g. root relative paths) are not chased.

  const parent = parentPath
    ? resolvePresetCompilerOptions(parentPath, visited)
    : {};

  return { ...parent, ...local };
}

// ── Main ─────────────────────────────────────────────────────────────────────

const SUPPORT_PRESET_RE = /^@support\/ts-config-/;

const files = process.argv.slice(2).filter(Boolean);
if (files.length === 0) process.exit(0);

let hasErrors = false;

for (const file of files) {
  if (!existsSync(file)) continue;

  let config: Record<string, unknown>;
  try {
    config = parseJsonc(file);
  } catch {
    continue;
  }

  const extendsVal = config.extends as string | undefined;
  if (!extendsVal || !SUPPORT_PRESET_RE.test(extendsVal)) continue;

  const { pkg, sub } = parseExtendsSpecifier(extendsVal);
  const presetPath = resolveNodeModule(dirname(resolve(file)), pkg, sub);
  if (!presetPath) {
    process.stderr.write(`warn: ${file}: could not resolve ${extendsVal}\n`);
    continue;
  }

  const presetOptions = resolvePresetCompilerOptions(presetPath);
  const localOptions = (config.compilerOptions as Record<string, unknown>) ?? {};

  const redundant: string[] = [];
  for (const [key, value] of Object.entries(localOptions)) {
    if (
      key in presetOptions &&
      JSON.stringify(presetOptions[key]) === JSON.stringify(value)
    ) {
      redundant.push(key);
    }
  }

  if (redundant.length > 0) {
    process.stderr.write(`error: ${file}\n`);
    process.stderr.write(
      `  Redundant compilerOptions already set by ${extendsVal}:\n`,
    );
    for (const key of redundant) {
      process.stderr.write(
        `  - "${key}": ${JSON.stringify(localOptions[key])}\n`,
      );
    }
    process.stderr.write(
      `  Remove these fields — they create a hidden maintenance copy.\n\n`,
    );
    hasErrors = true;
  }
}

process.exit(hasErrors ? 1 : 0);
