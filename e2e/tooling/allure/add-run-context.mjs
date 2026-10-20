#!/usr/bin/env node
/* eslint-disable no-console */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KEY_PREFIX = "RUN.";
const EMPTY_VALUE = "(none)";

function escapeValue(value) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n|\r/g, " ");
}

function formatPair(pair) {
  const separator = pair.indexOf("=");
  if (separator <= 0) {
    throw new Error(`Expected key=value, got "${pair}"`);
  }
  const key = pair.slice(0, separator).trim();
  const value = pair.slice(separator + 1).trim();
  return `${KEY_PREFIX}${key} = ${value ? escapeValue(value) : EMPTY_VALUE}\n`;
}

export function formatRunContext(pairs) {
  return pairs.map(formatPair).join("");
}

// Allure lists environment entries in file order, so the run context goes first to stay
// visible above the long FF.* / ENV.* lists the test teardowns write.
export function addRunContext(resultsDir, pairs) {
  mkdirSync(resultsDir, { recursive: true });
  const file = path.join(resultsDir, "environment.properties");
  const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
  writeFileSync(file, formatRunContext(pairs) + existing, "utf8");
  return file;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  const [resultsDir, ...pairs] = process.argv.slice(2);
  if (!resultsDir || pairs.length === 0) {
    console.error("Usage: add-run-context.mjs <results-dir> key=value [key=value...]");
    process.exit(1);
  }
  const file = addRunContext(resultsDir, pairs);
  console.log(`Added ${pairs.length} run context entries to ${file}`);
}
