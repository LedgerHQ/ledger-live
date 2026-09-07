#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { joinFilter, splitFilter } from "./escaping.mjs";
import { isRuntimeGeneratedTag } from "./generatedTags.mjs";
import { findTestFiles as findSpecFiles, filterTestFiles } from "./selectSpecs.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const repoRoot = path.resolve(currentDir, "../../..");
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
    filter: joinFilter(resolvedParts),
    expandedTags: expandedGenericCoinFramework ? genericCoinFrameworkTags : [],
  };
}

export function applySmokeFilter(filter, smokeTests) {
  if (!smokeTests) return filter;
  return filter ? `@smoke ${filter}` : "@smoke";
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

function warnZeroMatches(checkDir, baseFilter, expandedTags, runner) {
  if (!checkDir) return;

  const testDir = path.resolve(repoRoot, checkDir);
  // Decide "0 matches" the same way the target runner actually selects tests, so the warning
  // can't disagree with what runs:
  // - detox (mobile) selects whole spec files by path + declared @-tags (selectSpecs.filterTestFiles).
  //   Content-only filters (a TMS id, a describe/it title) select nothing, so they MUST warn.
  // - playwright (desktop) selects by test title via --grep, approximated by a regex over the
  //   spec path and content.
  const isDetox = runner === "detox";
  const files = findSpecFiles(testDir);

  if (files.length === 0) {
    console.warn(`::warning title=E2E filter check skipped::No test files found in ${checkDir}`);
    return;
  }

  const selectsSomething = isDetox
    ? pattern => filterTestFiles(files, pattern).length > 0
    : pattern => hasMatch(files, pattern);

  // Only the playwright check is an approximation (a regex over spec path/content), so it alone
  // can miss tags that buildTags() attaches at collection time. The detox check *is* how the
  // mobile runner selects specs, so a 0-match there is a real empty run and must stay a warning.
  const isUnverifiableTag = tag => !isDetox && isRuntimeGeneratedTag(tag);

  for (const tag of expandedTags) {
    if (selectsSomething(tag)) continue;
    // Family tags are attached by buildTags() at collection time, so a spec that carries one
    // never spells it out. Only flag a tag that isn't a real family either.
    if (isUnverifiableTag(tag)) {
      // stderr, like every other message here: stdout carries the resolved filter to the workflow.
      console.warn(
        `::notice title=E2E tag not statically verifiable::${tag} is generated at runtime (buildTags); its specs can't be detected before the run`,
      );
      continue;
    }
    console.warn(`::warning title=Missing E2E tag::${tag} has no matching specs in ${checkDir}`);
  }

  // filterTestFiles already splits on whitespace/","/"|"; the playwright regex needs "|" alternation.
  const baseFilterPattern = isDetox
    ? baseFilter
    : baseFilter.split(/\s+/).filter(Boolean).join("|");
  if (baseFilter && !selectsSomething(baseFilterPattern)) {
    // The filter is an OR: one runtime-generated tag is enough for the run to select specs,
    // so "0 matches" here would be an artefact of the static check, not a real empty run.
    const runtimeTags = splitFilter(baseFilter).filter(isUnverifiableTag);
    if (runtimeTags.length > 0) {
      console.warn(
        `::notice title=E2E filter not statically verifiable::${runtimeTags.join(", ")} ${runtimeTags.length === 1 ? "is" : "are"} generated at runtime (buildTags); matching specs can't be detected before the run`,
      );
      return;
    }
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
    runner: "playwright",
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
      case "--runner":
        parsed.runner = args[++i] ?? "playwright";
        break;
      default:
        if (!parsed.input) parsed.input = arg;
        break;
    }
  }

  return parsed;
}

export function resolveTestFilter({
  input = "",
  smokeTests = false,
  checkDir = "",
  runner = "playwright",
} = {}) {
  const { filter: baseFilter, expandedTags } = resolveBaseFilter(input);
  warnZeroMatches(checkDir, baseFilter, expandedTags, runner);
  return applySmokeFilter(baseFilter, smokeTests);
}

if (process.argv[1] === currentFile) {
  const options = parseArgs(process.argv.slice(2));
  console.log(resolveTestFilter(options));
}
