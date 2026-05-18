#!/usr/bin/env node

/**
 * Run all tests for a given coin/bridge family.
 *
 * For a given family name the script will:
 *  1. Find every workspace package whose `name` field contains the family name
 *     and run its test script.
 *  2. Auto-detect test directories inside @ledgerhq/live-common:
 *       src/families/<family>/                               → split into Logic + UI runs
 *       src/bridge/generic-coin-framework/families/<family>/ → Logic
 *
 * coin-tester-* packages require Docker infrastructure (Anvil, Agave, Atlas…)
 * and are always skipped — run them manually once Docker is up.
 *
 * Output:
 *  - All test output is streamed live to the terminal.
 *  - A summary table (Logic / UI) is printed at the end.
 *  - For every failed suite, the jest failure blocks are reprinted at the end.
 *
 * Usage (from repo root):
 *   pnpm test:family evm
 *   pnpm test:family bitcoin
 *   pnpm test:family internet_computer
 */

import { spawn } from "node:child_process";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE_COMMON_SRC = join(ROOT, "libs/ledger-live-common/src");

const SEARCH_DIRS = [
  "libs",
  "libs/coin-modules",
  "libs/coin-tester-modules",
  "libs/ledgerjs",
  "libs/ledger-services",
  "libs/ui/packages",
  "apps",
  "domain/entity",
  "domain/api",
  "shared",
];

// Test file name fragments that classify a live-common test as "UI"
const UI_FILE_FRAGMENTS = ["react", "platformAdapter", "walletApiAdapter", "banner"];

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------

/**
 * @type {{ label: string, category: "logic" | "ui", status: "pass" | "fail", output: string }[]}
 */
const results = [];

// ---------------------------------------------------------------------------
// Process runner — streams output live AND captures it
// ---------------------------------------------------------------------------

function runCommand(cmd) {
  return new Promise(resolve => {
    const child = spawn("sh", ["-c", cmd], {
      cwd: ROOT,
      env: { ...process.env, FORCE_COLOR: "1" },
    });
    let output = "";

    child.stdout.on("data", chunk => {
      process.stdout.write(chunk);
      output += chunk.toString();
    });

    child.stderr.on("data", chunk => {
      process.stderr.write(chunk);
      output += chunk.toString();
    });

    child.on("close", exitCode => resolve({ exitCode: exitCode ?? 1, output }));
    child.on("error", err => {
      process.stderr.write(`\nFailed to start process: ${err.message}\n`);
      resolve({ exitCode: 1, output });
    });
  });
}

async function run(label, category, cmd) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`▶ [${category.toUpperCase()}] ${label}`);
  console.log(`  ${cmd}`);
  console.log(`${"─".repeat(70)}\n`);

  const { exitCode, output } = await runCommand(cmd);
  results.push({ label, category, status: exitCode === 0 ? "pass" : "fail", output });
}

// ---------------------------------------------------------------------------
// Package helpers
// ---------------------------------------------------------------------------

function familyMatchesPackage(family, packageName) {
  const escaped = family.replace(/[-_/\\^$*+?.()|[\]{}]/g, "\\$&");
  return new RegExp(`(^|[/_-])${escaped}($|[/_-])`, "i").test(packageName);
}

function resolveTestScript(scripts = {}) {
  if (scripts.test) return { script: "test", integration: false };
  // coin-tester-* packages launch docker-backed integration suites via "start"
  if (scripts.start && scripts.start.includes("jest")) return { script: "start", integration: true };
  return null;
}

function getWorkspacePackages() {
  const packages = [];
  for (const dir of SEARCH_DIRS) {
    const full = join(ROOT, dir);
    if (!existsSync(full)) continue;
    for (const entry of readdirSync(full)) {
      const pkgDir = join(full, entry);
      const pkgJson = join(pkgDir, "package.json");
      if (!statSync(pkgDir).isDirectory()) continue;
      if (!existsSync(pkgJson)) continue;
      try {
        const data = JSON.parse(readFileSync(pkgJson, "utf8"));
        const resolved = resolveTestScript(data.scripts);
        if (data.name && resolved) {
          packages.push({ name: data.name, ...resolved });
        }
      } catch {
        // ignore malformed package.json
      }
    }
  }
  return packages;
}

// ---------------------------------------------------------------------------
// Live-common test helpers
// ---------------------------------------------------------------------------

function dirToJestPattern(relDir) {
  return relDir.replace(/[/\\]/g, "[\\\\/]");
}

function liveCommonJestCmd(testPathPattern) {
  return `pnpm --filter "@ledgerhq/live-common" exec jest --testPathPatterns "${testPathPattern}" --passWithNoTests --forceExit`;
}

async function runLiveCommonTests(family) {
  const familiesDir = join(LIVE_COMMON_SRC, "families", family);
  const familyDir = join(LIVE_COMMON_SRC, "bridge", "generic-coin-framework", "families", family);

  // generic-coin-framework/<family>/ — all Logic
  if (existsSync(familyDir) && statSync(familyDir).isDirectory()) {
    const pattern = dirToJestPattern(familyDir.replace(LIVE_COMMON_SRC + "/", ""));
    await run(
      `live-common: bridge/generic-coin-framework/families/${family}`,
      "logic",
      liveCommonJestCmd(pattern),
    );
  }

  // families/<family>/ — split into Logic and UI.
  // Anchored to "src/families/" so it never overlaps with
  // "bridge/generic-coin-framework/families/" which is handled above.
  if (existsSync(familiesDir) && statSync(familiesDir).isDirectory()) {
    const base = dirToJestPattern(`src/families/${family}`);
    const uiFrag = UI_FILE_FRAGMENTS.join("|");

    await run(
      `live-common: families/${family} (logic)`,
      "logic",
      liveCommonJestCmd(`${base}\\/(?!.*(${uiFrag})\\.test)`),
    );

    await run(
      `live-common: families/${family} (ui)`,
      "ui",
      liveCommonJestCmd(`${base}\\/.*(?:${uiFrag})\\.test`),
    );
  }

  // Integration tests — uses ci-test-integration (env-cmd + jest --ci)
  // scoped to families/<family> and generated directories.
  await run(
    `live-common: families/${family} (integration)`,
    "logic",
    `pnpm --filter "@ledgerhq/live-common" run ci-test-integration -- --testPathPatterns "families/${family}" "generated" --forceExit`,
  );
}

// ---------------------------------------------------------------------------
// Failure detail extraction
// ---------------------------------------------------------------------------

function extractJestFailures(output) {
  const lines = output.split("\n");
  const blocks = [];
  let current = null;

  for (const line of lines) {
    if (/^ {2}●/.test(line)) {
      if (current !== null) blocks.push(current.join("\n"));
      current = [line];
      continue;
    }
    if (current !== null) {
      if (/^(Test Suites|Tests|Snapshots|Time):/.test(line.trim())) {
        blocks.push(current.join("\n"));
        current = null;
        continue;
      }
      current.push(line);
    }
  }

  if (current !== null) blocks.push(current.join("\n"));
  return blocks.map(b => b.split("\n").slice(0, 40).join("\n").trimEnd());
}

// ---------------------------------------------------------------------------
// Summary + failure detail printer
// ---------------------------------------------------------------------------

function printSummary() {
  const green = s => `\x1b[32m${s}\x1b[0m`;
  const red   = s => `\x1b[31m${s}\x1b[0m`;

  const statusIcon = s => (s === "pass" ? green("✓ PASS") : red("✗ FAIL"));

  const categories = ["logic", "ui"];
  const categoryLabels = { logic: "Logic Tests", ui: "UI Tests" };

  console.log(`\n${"═".repeat(70)}`);
  console.log("  TEST SUMMARY");
  console.log(`${"═".repeat(70)}`);

  let totalPass = 0;
  let totalFail = 0;

  for (const cat of categories) {
    const group = results.filter(r => r.category === cat);
    if (group.length === 0) continue;

    const pass = group.filter(r => r.status === "pass").length;
    const fail = group.filter(r => r.status === "fail").length;
    totalPass += pass;
    totalFail += fail;

    console.log(`\n  ${categoryLabels[cat]}:`);
    for (const r of group) {
      console.log(`    ${statusIcon(r.status)}  ${r.label}`);
    }
    console.log(`    ${"─".repeat(45)}`);
    console.log(`    ${green(`${pass} passed`)}, ${fail > 0 ? red(`${fail} failed`) : "0 failed"}`);
  }

  console.log(`\n${"═".repeat(70)}`);
  const overallStatus = totalFail > 0 ? "fail" : "pass";
  console.log(
    `  Overall: ${statusIcon(overallStatus)}  ${green(`${totalPass} passed`)}, ${totalFail > 0 ? red(`${totalFail} failed`) : "0 failed"}`,
  );
  console.log(`${"═".repeat(70)}`);

  // Failure details
  const failed = results.filter(r => r.status === "fail");
  if (failed.length === 0) return;

  console.log(`\n${"═".repeat(70)}`);
  console.log("  FAILURE DETAILS");
  console.log(`${"═".repeat(70)}`);

  for (const r of failed) {
    console.log(`\n${red("✗")} ${r.label}`);
    console.log(`  ${"─".repeat(67)}`);

    const blocks = extractJestFailures(r.output);
    if (blocks.length === 0) {
      const tail = r.output.trimEnd().split("\n").slice(-30).join("\n");
      console.log(tail);
    } else {
      for (const block of blocks) {
        console.log(block);
        console.log();
      }
    }
  }

  console.log(`${"═".repeat(70)}\n`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const family = process.argv[2];

  if (!family || family.startsWith("--")) {
    console.error("Usage: pnpm test:family <family-name>");
    console.error("Example: pnpm test:family evm");
    process.exit(1);
  }

  const pattern = family.toLowerCase();
  const allPackages = getWorkspacePackages();
  const matched = allPackages.filter(pkg => familyMatchesPackage(pattern, pkg.name));

  const hasLiveCommonTests =
    existsSync(join(LIVE_COMMON_SRC, "families", pattern)) ||
    existsSync(join(LIVE_COMMON_SRC, "bridge", "generic-alpaca", "families", pattern));

  if (matched.length === 0 && !hasLiveCommonTests) {
    console.error(`No packages or test directories found for family "${pattern}".`);
    process.exit(1);
  }

  console.log(`\nRunning all tests for family: "${family}"`);
  if (matched.length > 0) {
    console.log(`\nPackages:\n` + matched.map(p => `  • ${p.name}${p.integration ? "  [needs Docker]" : ""}`).join("\n"));
  }

  // 1. Package-level tests (Logic)
  for (const pkg of matched) {
    await run(pkg.name, "logic", `pnpm --filter "${pkg.name}" ${pkg.script}`);
  }

  // 2. Live-common tests (Logic + UI split)
  await runLiveCommonTests(pattern);

  // 3. Summary + failure details
  printSummary();

  process.exit(results.some(r => r.status === "fail") ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
