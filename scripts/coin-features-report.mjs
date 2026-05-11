#!/usr/bin/env node

/**
 * Scans each coin-module's src/api/index.ts to detect which CoinModuleApi methods
 * are implemented vs stubbed ("not supported") vs missing.
 *
 * Usage:
 *   node scripts/coin-features-report.mjs
 *   pnpm coin:features:report
 */

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COIN_MODULES_DIR = join(ROOT, "libs/coin-modules");

const METHODS = [
  "lastBlock",
  "getBlockInfo",
  "getBlock",
  "getValidators",
  "getBalance",
  "listOperations",
  "getStakes",
  "getRewards",
  "craftTransaction",
  "craftRawTransaction",
  "estimateFees",
  "combine",
  "broadcast",
  "validateIntent",
  "getNextSequence",
  "validateAddress",
];

function getCoinModuleDirs() {
  return readdirSync(COIN_MODULES_DIR)
    .filter(name => {
      const full = join(COIN_MODULES_DIR, name);
      return statSync(full).isDirectory() && existsSync(join(full, "package.json"));
    })
    .sort();
}

/**
 * Extract the return block from createApi, handling nested braces.
 */
function extractReturnBlock(content) {
  const returnMatch = content.match(/return\s*\{/);
  if (!returnMatch) return null;

  let depth = 0;
  const start = returnMatch.index + returnMatch[0].length - 1;
  for (let i = start; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") {
      depth--;
      if (depth === 0) return content.substring(start, i + 1);
    }
  }
  return null;
}

/**
 * Split the return block into per-property chunks keyed by method name.
 */
function extractMethodChunks(returnBlock) {
  const chunks = {};
  const pattern = new RegExp(`(?:^|[,{]\\s*\\n?)\\s*(${METHODS.join("|")})\\s*(?:[:,({])`, "gm");

  const matches = [];
  let m;
  while ((m = pattern.exec(returnBlock)) !== null) {
    matches.push({ name: m[1], index: m.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : returnBlock.length;
    chunks[matches[i].name] = returnBlock.substring(start, end);
  }

  return chunks;
}

function analyzeModule(modDir) {
  const apiFile = join(COIN_MODULES_DIR, modDir, "src", "api", "index.ts");
  if (!existsSync(apiFile)) return null;

  const content = readFileSync(apiFile, "utf-8");
  if (!content.includes("CoinModuleApi") && !content.includes("createApi")) return null;

  const returnBlock = extractReturnBlock(content);
  if (!returnBlock) return null;

  const chunks = extractMethodChunks(returnBlock);

  const result = {};
  for (const method of METHODS) {
    if (!chunks[method]) {
      result[method] = "missing";
      continue;
    }
    const chunk = chunks[method];
    if (/not supported/i.test(chunk) && /throw\s+new\s+Error/i.test(chunk)) {
      result[method] = "stub";
    } else {
      result[method] = "ok";
    }
  }
  return result;
}

function main() {
  const modules = getCoinModuleDirs();
  const results = [];

  for (const mod of modules) {
    const analysis = analyzeModule(mod);
    results.push({ name: mod, methods: analysis });
  }

  const hasApi = results.filter(r => r.methods !== null);
  const noApi = results.filter(r => r.methods === null);

  if (hasApi.length === 0) {
    console.error("\n\x1b[31mNo coin-modules with CoinModuleApi found.\x1b[0m\n");
    process.exit(1);
  }

  const nameWidth = Math.max(22, ...results.map(r => r.name.length)) + 2;

  const SHORT = {
    lastBlock: "last",
    getBlockInfo: "blkI",
    getBlock: "blk ",
    getValidators: "vals",
    getBalance: "bal ",
    listOperations: "ops ",
    getStakes: "stak",
    getRewards: "rwds",
    craftTransaction: "crft",
    craftRawTransaction: "crRw",
    estimateFees: "fees",
    combine: "comb",
    broadcast: "brdc",
    validateIntent: "vInt",
    getNextSequence: "seq ",
    validateAddress: "vAdr",
  };

  const headerCols = METHODS.map(m => SHORT[m]).join(" ");
  const sep = "─".repeat(nameWidth + METHODS.length * 5 + 2);

  console.log(`\n\x1b[1m  Coin-Module features \x1b[0m`);
  console.log(`  ${sep}`);
  console.log(`  ${"Module".padEnd(nameWidth)} ${headerCols}`);
  console.log(`  ${sep}`);

  for (const { name, methods } of hasApi) {
    const cols = METHODS.map(m => {
      const status = methods[m];
      if (status === "ok") return `\x1b[32m  ✓ \x1b[0m`;
      if (status === "stub") return `\x1b[90m  · \x1b[0m`;
      return `\x1b[31m  ✗ \x1b[0m`;
    }).join(" ");

    const count = METHODS.filter(m => methods[m] === "ok").length;
    console.log(`  ${name.padEnd(nameWidth)} ${cols} ${count}/${METHODS.length}`);
  }

  if (noApi.length > 0) {
    for (const { name } of noApi) {
      const cols = METHODS.map(() => `\x1b[31m  ✗ \x1b[0m`).join(" ");
      console.log(`  ${name.padEnd(nameWidth)} ${cols} 0/${METHODS.length}`);
    }
  }

  console.log(`  ${sep}`);

  console.log(
    `\n  \x1b[1mLegend:\x1b[0m  \x1b[32m✓\x1b[0m implemented  \x1b[90m·\x1b[0m not supported  \x1b[31m✗\x1b[0m missing`,
  );

  console.log();
}

main();
