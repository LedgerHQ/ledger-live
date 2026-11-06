#!/usr/bin/env node
// TEST-BRANCH ONLY (LIVE-39321): reads device logs from a rejection scan and groups unhandled promise
// rejections, matching each one to the Detox test that was running at that time.
// Usage: node report.mjs <scan output dir>. Writes report.json and report.md in that dir.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const MARKER = "[UNHANDLED_REJECTION]";
const HANDLED_MARKER = "[REJECTION_HANDLED]";
const READY_MARKER = "[REJECTION_SCAN_READY]";
const CANARY_MESSAGE = "rejection-scan-canary";
const STACK_FRAMES_IN_KEY = 3;
const SAMPLE_TESTS = 5;
const MICROSECONDS_PER_MS = 1000;
const SETUP_LABEL = "app start / setup before first test";

const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage: node report.mjs <scan output dir>");
  process.exit(1);
}

function listFiles(dir, accept) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listFiles(path, accept);
    return accept(name) ? [path] : [];
  });
}

function isDeviceLog(name) {
  const isRunnerLog = name === "test-run.log" || name === "detox.log";
  return name.endsWith(".log") && !isRunnerLog;
}

// logcat cuts lines at ~4 KB, so a long payload can lose its end: keep what we can read.
function salvage(raw) {
  const field = key => raw.match(new RegExp(`"${key}":"((?:[^"\\\\]|\\\\.)*)"`))?.[1];
  const number = key => Number(raw.match(new RegExp(`"${key}":(\\d+)`))?.[1]);
  const unescape = text => (text ? text.replace(/\\n/g, "\n").replace(/\\"/g, '"') : undefined);
  return {
    id: number("id"),
    at: number("at"),
    name: field("name") ?? "unparsed",
    message: unescape(field("message")) ?? raw.slice(0, 300),
    stack: unescape(raw.match(/"stack":"(.*)$/)?.[1]) ?? "",
    truncated: true,
  };
}

function parsePayload(line, marker) {
  const raw = line.slice(line.indexOf(marker) + marker.length).trim();
  try {
    return JSON.parse(raw.slice(0, raw.lastIndexOf("}") + 1));
  } catch {
    return salvage(raw);
  }
}

function normalizeMessage(message) {
  return String(message ?? "")
    .replace(/0x[0-9a-fA-F]{6,}/g, "<hex>")
    .replace(/[0-9a-fA-F-]{32,}/g, "<id>")
    .replace(/\d{3,}/g, "<n>")
    .slice(0, 300);
}

function topFrames(stack) {
  return String(stack ?? "")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith("at "))
    .map(line => line.replace(/\s*\(.*\)?$/, "").replace(/^at /, ""))
    .slice(0, STACK_FRAMES_IN_KEY);
}

function loadTestStarts() {
  const traces = listFiles(outDir, name => name === "detox.trace.json");
  return traces
    .flatMap(file => JSON.parse(readFileSync(file, "utf8")))
    .filter(event => event.ph === "B" && event.args?.context === "test")
    .map(event => ({ at: event.ts / MICROSECONDS_PER_MS, test: event.args.fullName ?? event.name }))
    .sort((a, b) => a.at - b.at);
}

function testAt(testStarts, at) {
  if (!Number.isFinite(at)) return "unknown test";
  const running = testStarts.filter(start => start.at <= at).pop();
  return running?.test ?? SETUP_LABEL;
}

function scanFile(file) {
  const entries = [];
  const latestById = new Map();
  const seen = new Set();
  let readyLines = 0;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    // RN also echoes console.error under another logcat tag: skip that copy.
    if (line.includes(`console.error: [`)) continue;
    if (line.includes(READY_MARKER)) readyLines += 1;
    else if (line.includes(HANDLED_MARKER)) {
      const { id } = parsePayload(line, HANDLED_MARKER);
      const rejection = latestById.get(id);
      if (rejection) rejection.handledLater = true;
    } else if (line.includes(MARKER)) {
      const payload = parsePayload(line, MARKER);
      const key = `${payload.id}-${payload.at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = { ...payload, handledLater: false, sourceFile: basename(file) };
      entries.push(entry);
      latestById.set(payload.id, entry);
    }
  }
  return { readyLines, entries };
}

function platformOf(file) {
  if (/ios-test-artifacts/.test(file)) return "iOS";
  if (/android-test-artifacts/.test(file)) return "Android";
  return "local";
}

// Written by e2e/mobile/bridge/server.ts: one JSON object per line, in arrival order per worker.
function loadBridgeEntries() {
  const files = listFiles(outDir, name => /^unhandled-rejections-.*\.jsonl$/.test(name));
  const entries = [];
  let readyLines = 0;
  for (const file of files) {
    const latestById = new Map();
    for (const line of readFileSync(file, "utf8").split("\n").filter(Boolean)) {
      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }
      if (record.kind === "ready") readyLines += 1;
      else if (record.kind === "handled") {
        const rejection = latestById.get(record.id);
        if (rejection) rejection.handledLater = true;
      } else if (record.kind === "unhandled") {
        const entry = {
          ...record,
          handledLater: false,
          platform: platformOf(file),
          test: record.testName || `${record.testPath ?? "unknown spec"} (setup)`,
        };
        entries.push(entry);
        latestById.set(record.id, entry);
      }
    }
  }
  return { files, entries, readyLines };
}

function buildGroups(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const frames = topFrames(entry.stack);
    const key = `${entry.name}: ${normalizeMessage(entry.message)} | ${frames.join(" < ")}`;
    const group = groups.get(key) ?? {
      key,
      name: entry.name,
      message: entry.message,
      frames,
      sampleStack: entry.stack ?? "",
      count: 0,
      handledLaterCount: 0,
      tests: new Set(),
      platforms: new Set(),
    };
    group.count += 1;
    if (entry.handledLater) group.handledLaterCount += 1;
    group.tests.add(entry.test);
    group.platforms.add(entry.platform ?? "local");
    groups.set(key, group);
  }
  return [...groups.values()]
    .map(group => ({ ...group, tests: [...group.tests], platforms: [...group.platforms] }))
    .sort((a, b) => b.tests.length - a.tests.length || b.count - a.count);
}

function escapeCell(text) {
  return String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function toMarkdown(summary, groups) {
  return [
    "# Unhandled promise rejections — scan report",
    "",
    `- Source: ${summary.source}; files read: ${summary.logFiles}; tests seen in Detox trace: ${summary.testsInTrace}`,
    `- App launches with the scan active: ${summary.readyLines}`,
    `- Tracker check (canary seen): **${summary.canarySeen ? "YES, tracker works" : "NO, check the setup"}**`,
    `- Rejections (without canary): ${summary.totalRejections} in ${groups.length} group(s)`,
    `- Of them handled later (false alarm): ${summary.handledLater}`,
    "",
    "| # | Tests | Count | Handled later | Platforms | Error | Top frames |",
    "|---|---|---|---|---|---|---|",
    ...groups.map(
      (group, index) =>
        `| ${index + 1} | ${group.tests.length} | ${group.count} | ${group.handledLaterCount} | ${group.platforms.join(
          ", ",
        )} | ${escapeCell(
          `${group.name}: ${group.message}`.slice(0, 160),
        )} | ${escapeCell(group.frames.join(" < "))} |`,
    ),
    "",
    "## Details",
    ...groups.flatMap((group, index) => [
      "",
      `### ${index + 1}. ${escapeCell(`${group.name}: ${group.message}`.slice(0, 120))}`,
      "",
      `Tests (${group.tests.length}): ${group.tests.slice(0, SAMPLE_TESTS).join("; ")}${
        group.tests.length > SAMPLE_TESTS ? " …" : ""
      }`,
      "",
      "```",
      group.sampleStack || "(no stack: rejected with a non-Error value)",
      "```",
    ]),
  ].join("\n");
}

function loadLogcatEntries(testStarts) {
  const files = listFiles(outDir, isDeviceLog);
  const scans = files.map(scanFile);
  const entries = scans
    .flatMap(scan => scan.entries)
    .map(entry => ({ ...entry, platform: "local", test: testAt(testStarts, entry.at) }));
  const readyLines = scans.reduce((sum, scan) => sum + scan.readyLines, 0);
  return { files, entries, readyLines };
}

const testStarts = loadTestStarts();
// Prefer the bridge files: exact test names, no logcat line limits. Never mix, or we count twice.
const bridge = loadBridgeEntries();
const source = bridge.files.length > 0 ? "bridge (.jsonl)" : "device log (logcat)";
const {
  files,
  entries: allEntries,
  readyLines,
} = bridge.files.length > 0 ? bridge : loadLogcatEntries(testStarts);
const realEntries = allEntries.filter(entry => entry.message !== CANARY_MESSAGE);
const groups = buildGroups(realEntries);
const summary = {
  source,
  logFiles: files.length,
  testsInTrace: testStarts.length,
  readyLines,
  canarySeen: allEntries.some(entry => entry.message === CANARY_MESSAGE),
  totalRejections: realEntries.length,
  handledLater: realEntries.filter(entry => entry.handledLater).length,
  truncatedLines: realEntries.filter(entry => entry.truncated).length,
};

writeFileSync(join(outDir, "report.json"), JSON.stringify({ summary, groups }, null, 2));
writeFileSync(join(outDir, "report.md"), toMarkdown(summary, groups));

console.log(`==> report: ${join(outDir, "report.md")}`);
console.log(JSON.stringify(summary, null, 2));
if (bridge.files.length === 0 && testStarts.length === 0)
  console.log("WARNING: no test ran. Read test-run.log in the output dir.");
if (files.length === 0) console.log("WARNING: no device log files found.");
else if (!summary.canarySeen)
  console.log(
    "WARNING: canary not found. The tracker or the log channel does not work in this build.",
  );
