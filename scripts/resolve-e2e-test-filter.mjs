#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "..");
const genericCoinFrameworkFamiliesPath = path.join(
  repoRoot,
  "libs/ledger-live-common/src/bridge/generic-coin-framework/genericCoinFrameworkFamilies.json",
);

const GENERIC_COIN_FRAMEWORK_ALIASES = new Set([
  "generic-family",
  "@generic-family",
  "generic-coin-framework",
  "@generic-coin-framework",
]);

function readEnabledGenericCoinFrameworkFamilies() {
  const familyFlags = JSON.parse(fs.readFileSync(genericCoinFrameworkFamiliesPath, "utf8"));
  return Object.entries(familyFlags)
    .filter(([, isEnabled]) => isEnabled)
    .map(([family]) => family);
}

function splitFilter(input) {
  return input
    .split(/[|,]/)
    .map(part => part.trim())
    .filter(Boolean);
}

function joinFilterParts(parts) {
  return [...new Set(parts)].join("|");
}

export function resolveBaseFilter(
  input,
  enabledGenericCoinFrameworkFamilies = readEnabledGenericCoinFrameworkFamilies(),
) {
  const parts = splitFilter(input);
  const genericCoinFrameworkTags = enabledGenericCoinFrameworkFamilies.map(
    family => `@family-${family}`,
  );
  let expandedGenericCoinFramework = false;
  const resolvedParts = [];

  for (const part of parts) {
    if (GENERIC_COIN_FRAMEWORK_ALIASES.has(part)) {
      expandedGenericCoinFramework = true;
      resolvedParts.push(...genericCoinFrameworkTags);
    } else {
      resolvedParts.push(part);
    }
  }

  return {
    filter: joinFilterParts(resolvedParts),
    expandedTags: expandedGenericCoinFramework ? genericCoinFrameworkTags : [],
  };
}

export function applySmokeFilter(filter, smokeTests) {
  if (!smokeTests) return filter;
  return filter ? `@smoke ${filter}` : "@smoke";
}

function findTestFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTestFiles(fullPath));
    } else if (entry.name.endsWith(".spec.ts") && !entry.name.endsWith(".skip.spec.ts")) {
      results.push(fullPath);
    }
  }

  return results;
}

function hasMatch(files, pattern) {
  let matcher;
  try {
    matcher = new RegExp(pattern, "i");
  } catch {
    console.warn(`::warning title=E2E filter check skipped::${pattern} is not a valid regex`);
    return true;
  }

  return files.some(filePath => {
    if (matcher.test(filePath)) return true;
    return matcher.test(fs.readFileSync(filePath, "utf8"));
  });
}

function warnZeroMatches(checkDir, baseFilter, expandedTags) {
  if (!checkDir) return;

  const testDir = path.resolve(repoRoot, checkDir);
  const files = findTestFiles(testDir);

  if (files.length === 0) {
    console.warn(`::warning title=E2E filter check skipped::No test files found in ${checkDir}`);
    return;
  }

  for (const tag of expandedTags) {
    if (!hasMatch(files, tag)) {
      console.warn(`::warning title=Missing E2E tag::${tag} has no matching specs in ${checkDir}`);
    }
  }

  if (baseFilter && !hasMatch(files, baseFilter.split(/\s+/).filter(Boolean).join("|"))) {
    console.warn(
      `::warning title=E2E filter has no matches::${baseFilter} matched 0 specs in ${checkDir}`,
    );
  }
}

function parseArgs(args) {
  const parsed = {
    input: "",
    smokeTests: false,
    checkDir: "",
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--input":
        parsed.input = args[++i] ?? "";
        break;
      case "--smoke-tests":
        parsed.smokeTests = args[++i] === "true";
        break;
      case "--check-dir":
        parsed.checkDir = args[++i] ?? "";
        break;
      default:
        if (!parsed.input) parsed.input = arg;
        break;
    }
  }

  return parsed;
}

export function resolveTestFilter({ input = "", smokeTests = false, checkDir = "" } = {}) {
  const { filter: baseFilter, expandedTags } = resolveBaseFilter(input);
  warnZeroMatches(checkDir, baseFilter, expandedTags);
  return applySmokeFilter(baseFilter, smokeTests);
}

if (process.argv[1] === currentFile) {
  const options = parseArgs(process.argv.slice(2));
  console.log(resolveTestFilter(options));
}
