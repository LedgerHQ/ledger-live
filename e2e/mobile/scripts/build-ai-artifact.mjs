#!/usr/bin/env node
/**
 * @fileoverview Builds a filtered artifact directory for AI analysis.
 *
 * - Only failed/broken result files are copied (passed tests are counted but not included).
 * - Attachments are included only for failed/broken tests, excluding images and videos.
 * - Deduplicates by historyId so retries don't inflate counts.
 *
 * @example
 * ARTIFACTS=e2e/mobile/artifacts OUT=e2e/mobile/artifacts-ai node build-ai-artifact.mjs
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  copyFileSync,
  cpSync,
  writeFileSync,
  statSync,
} from "fs";
import { join, basename } from "path";

/**
 * @typedef {Object} AllureAttachment
 * @property {string} [name]
 * @property {string} [source]
 * @property {string} [type]
 */

/**
 * @typedef {Object} AllureStep
 * @property {AllureAttachment[]} [attachments]
 * @property {AllureStep[]} [steps]
 */

/**
 * @typedef {Object} AllureResult
 * @property {string} [historyId]
 * @property {string} [testCaseId]
 * @property {string} [name]
 * @property {string} [status]
 * @property {number} [start]
 * @property {AllureStep[]} [steps]
 * @property {AllureAttachment[]} [attachments]
 */

/**
 * @typedef {Object} AISummary
 * @property {number} total_results
 * @property {number} passed_results
 */

const ARTIFACTS = process.env.ARTIFACTS || "e2e/mobile/artifacts";
const OUT = process.env.OUT || "e2e/mobile/artifacts-ai";

/**
 * Returns the deduplication key for an Allure result.
 * Falls back through historyId → testCaseId → name.
 * @param {AllureResult} result
 * @returns {string}
 */
function getHistoryId(result) {
  return result.historyId || result.testCaseId || result.name || "unknown";
}

/**
 * Collects all non-image/video attachment source paths from a result,
 * walking both top-level and step-level attachments.
 * @param {AllureResult} result
 * @returns {string[]}
 */
function collectAttachmentSources(result) {
  /** @type {Set<string>} */
  const sources = new Set();

  /** @param {AllureAttachment[]} attachments */
  function walkAttachments(attachments = []) {
    for (const att of attachments) {
      if (
        att.source &&
        att.type &&
        !att.type.startsWith("video/") &&
        !att.type.startsWith("image/")
      ) {
        sources.add(att.source);
      }
    }
  }

  /** @param {AllureStep[]} steps */
  function walkSteps(steps = []) {
    for (const step of steps) {
      walkAttachments(step.attachments);
      walkSteps(step.steps);
    }
  }

  walkAttachments(result.attachments);
  walkSteps(result.steps);
  return [...sources];
}

/**
 * Deduplicates results by historyId, keeping the latest attempt per unique test.
 * @param {{ file: string, data: AllureResult }[]} results
 * @returns {Map<string, AllureResult>}
 */
function deduplicateByHistoryId(results) {
  /** @type {Map<string, AllureResult>} */
  const latest = new Map();
  for (const { data } of results) {
    const hid = getHistoryId(data);
    const existing = latest.get(hid);
    if (!existing || (data.start ?? 0) > (existing.start ?? 0)) {
      latest.set(hid, data);
    }
  }
  return latest;
}

/**
 * Computes deduplicated test counts from the latest attempt per unique test.
 * @param {Map<string, AllureResult>} latestByHistoryId
 * @returns {AISummary}
 */
function computeSummary(latestByHistoryId) {
  let passed = 0;
  for (const result of latestByHistoryId.values()) {
    if (result.status === "passed") passed++;
  }
  return { total_results: latestByHistoryId.size, passed_results: passed };
}

// --- Main ---

mkdirSync(join(OUT, "attachments"), { recursive: true });

// Copy metadata files
for (const f of [
  "categories.json",
  "executor.json",
  "environment.properties",
  "speculos-instances.json",
  "appVersion",
]) {
  const src = join(ARTIFACTS, f);
  if (!existsSync(src)) continue;
  if (statSync(src).isDirectory()) {
    cpSync(src, join(OUT, f), { recursive: true });
  } else {
    copyFileSync(src, join(OUT, f));
  }
}

// Load all result files
const resultFiles = readdirSync(ARTIFACTS).filter(f => f.endsWith("-result.json"));
if (resultFiles.length === 0) {
  console.error(`No result files found in ${ARTIFACTS} — skipping AI artifact build.`);
  process.exit(0);
}

/** @type {{ file: string, data: AllureResult }[]} */
const results = resultFiles.map(file => ({
  file,
  data: JSON.parse(readFileSync(join(ARTIFACTS, file), "utf-8")),
}));

// Copy failed/broken results and their text attachments
for (const { file, data } of results) {
  if (data.status === "failed" || data.status === "broken") {
    copyFileSync(join(ARTIFACTS, file), join(OUT, file));

    for (const source of collectAttachmentSources(data)) {
      const attSrc = join(ARTIFACTS, source);
      if (existsSync(attSrc)) {
        copyFileSync(attSrc, join(OUT, "attachments", basename(source)));
      }
    }
  }
}

// Write deduplicated summary
const summary = computeSummary(deduplicateByHistoryId(results));
writeFileSync(join(OUT, "summary.json"), JSON.stringify(summary) + "\n");
console.log(
  `AI artifact built: ${summary.total_results} unique tests (${summary.passed_results} passed, ${summary.total_results - summary.passed_results} failed/broken)`,
);
