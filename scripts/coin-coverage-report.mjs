#!/usr/bin/env node

/**
 * Reads coverage-final.json from each coin-module under libs/coin-modules/
 * and prints a summary table with statements, branches, functions, and lines
 * coverage percentages.
 *
 * Usage:
 *   # Run coverage first, then report
 *   pnpm coin:coverage && node scripts/coin-coverage-report.mjs
 *
 *   # Or use the combined shortcut
 *   pnpm coin:coverage:report
 * 
 *   # Or use the summary shortcut
 *   pnpm coin:coverage:summary
 */

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COIN_MODULES_DIR = join(ROOT, "libs/coin-modules");

function getCoinModuleDirs() {
  return readdirSync(COIN_MODULES_DIR)
    .filter(name => {
      const full = join(COIN_MODULES_DIR, name);
      return statSync(full).isDirectory() && existsSync(join(full, "package.json"));
    })
    .sort();
}

function computeCoverage(coverageData) {
  let totalStmts = 0,
    coveredStmts = 0;
  let totalBranches = 0,
    coveredBranches = 0;
  let totalFns = 0,
    coveredFns = 0;
  let totalLines = 0,
    coveredLines = 0;

  for (const file of Object.values(coverageData)) {
    for (const count of Object.values(file.s ?? {})) {
      totalStmts++;
      if (count > 0) coveredStmts++;
    }

    for (const counts of Object.values(file.b ?? {})) {
      for (const count of counts) {
        totalBranches++;
        if (count > 0) coveredBranches++;
      }
    }

    for (const count of Object.values(file.f ?? {})) {
      totalFns++;
      if (count > 0) coveredFns++;
    }

    const lineHits = file.l ?? buildLineMap(file);
    for (const count of Object.values(lineHits)) {
      totalLines++;
      if (count > 0) coveredLines++;
    }
  }

  return {
    statements: pct(coveredStmts, totalStmts),
    branches: pct(coveredBranches, totalBranches),
    functions: pct(coveredFns, totalFns),
    lines: pct(coveredLines, totalLines),
    totalFiles: Object.keys(coverageData).length,
  };
}

function buildLineMap(file) {
  const lines = {};
  if (!file.statementMap || !file.s) return lines;
  for (const [id, loc] of Object.entries(file.statementMap)) {
    const line = loc.start.line;
    const hit = file.s[id] ?? 0;
    lines[line] = Math.max(lines[line] ?? 0, hit);
  }
  return lines;
}

function pct(covered, total) {
  if (total === 0) return "N/A";
  return ((covered / total) * 100).toFixed(2);
}

function fmtPct(value) {
  if (value === "N/A") return "   N/A";
  const str = `${value}%`;
  return str.padStart(7);
}

function colorPct(value) {
  if (value === "N/A") return `\x1b[90m${fmtPct(value)}\x1b[0m`;
  const num = parseFloat(value);
  if (num >= 80) return `\x1b[32m${fmtPct(value)}\x1b[0m`;
  if (num >= 50) return `\x1b[33m${fmtPct(value)}\x1b[0m`;
  return `\x1b[31m${fmtPct(value)}\x1b[0m`;
}

function main() {
  const modules = getCoinModuleDirs();
  const results = [];
  const missing = [];

  for (const mod of modules) {
    const coveragePath = join(COIN_MODULES_DIR, mod, "coverage", "coverage-final.json");
    if (!existsSync(coveragePath)) {
      missing.push(mod);
      continue;
    }

    try {
      const data = JSON.parse(readFileSync(coveragePath, "utf-8"));
      const cov = computeCoverage(data);
      results.push({ name: mod, ...cov });
    } catch {
      missing.push(mod);
    }
  }

  if (results.length === 0) {
    console.error("\n\x1b[31mNo coverage data found.\x1b[0m");
    console.error("Run coverage first:  pnpm coin:coverage\n");
    process.exit(1);
  }

  const nameWidth = Math.max(20, ...results.map(r => r.name.length)) + 2;
  const sep = "─".repeat(nameWidth + 46);

  console.log(`\n\x1b[1m  Coin-Module Coverage Report\x1b[0m`);
  console.log(`  ${sep}`);
  console.log(
    `  ${"Module".padEnd(nameWidth)} ${"Stmts".padStart(7)}  ${"Branch".padStart(7)}  ${"Funcs".padStart(7)}  ${"Lines".padStart(7)}  ${"Files".padStart(5)}`,
  );
  console.log(`  ${sep}`);

  for (const r of results) {
    console.log(
      `  ${r.name.padEnd(nameWidth)} ${colorPct(r.statements)}  ${colorPct(r.branches)}  ${colorPct(r.functions)}  ${colorPct(r.lines)}  ${String(r.totalFiles).padStart(5)}`,
    );
  }

  console.log(`  ${sep}`);

  if (missing.length > 0) {
    console.log(`\n  \x1b[90mNo coverage data for: ${missing.join(", ")}\x1b[0m`);
  }

  console.log();
}

main();
