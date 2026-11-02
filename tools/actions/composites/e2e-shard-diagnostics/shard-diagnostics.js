#!/usr/bin/env node
"use strict";

/**
 * Render the collapsed "Shard diagnostics" section of a desktop E2E device report.
 *
 * Reads one directory per downloaded artifact of the device's test legs, under <root>/allure,
 * <root>/playwright-log and <root>/proxy. Artifacts of a leg share a suffix: "-shard-2",
 * "-stax-shard-2" or "-macos" (an unsharded leg).
 *
 * Run locally: node shard-diagnostics.js <root>   (prints the Markdown)
 * From actions/github-script: require this file and append renderShardDiagnostics(root).
 */

const fs = require("fs");
const path = require("path");

const listDir = dir => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const escapeHtml = text => String(text).replace(/</g, "&lt;").replace(/>/g, "&gt;");
const formatDuration = ms =>
  `${Math.floor(ms / 60000)}m ${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}s`;

const shardOf = suffix => Number(/-shard-(\d+)$/.exec(suffix)?.[1] ?? 0);

function allureStats(dir) {
  const attempts = listDir(dir)
    .filter(file => file.endsWith("-result.json"))
    .map(file => readJson(path.join(dir, file)));
  const attemptsByTest = new Map();
  for (const attempt of attempts) {
    const id = attempt.historyId ?? attempt.fullName ?? attempt.name;
    attemptsByTest.set(id, [...(attemptsByTest.get(id) ?? []), attempt]);
  }
  // Same rule as get-failed-tests-summary: failed means it never passed, retries included.
  const outcomes = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
  const flakyTests = [];
  for (const tries of attemptsByTest.values()) {
    const passed = tries.some(t => t.status === "passed");
    const failed = tries.some(t => t.status === "failed" || t.status === "broken");
    const outcome = passed && failed ? "flaky" : passed ? "passed" : failed ? "failed" : "skipped";
    outcomes[outcome] += 1;
    if (outcome === "flaky") flakyTests.push(tries[0].name);
  }
  // Speculinho errors read "Timeout: <url>/status/<app>-lw-ci-<id> did not become ready within <ms>ms".
  const notReadyApps = attempts
    .map(t => t.statusDetails?.message ?? "")
    .filter(message => message.includes("did not become ready"))
    .map(message => /\/status\/(.+?)-lw-ci-/.exec(message)?.[1] ?? "unknown");
  const starts = attempts.map(t => t.start).filter(Number.isFinite);
  const stops = attempts.map(t => t.stop).filter(Number.isFinite);
  const testTimeMs = starts.length && stops.length ? Math.max(...stops) - Math.min(...starts) : 0;
  return { tests: attemptsByTest.size, ...outcomes, flakyTests, notReadyApps, testTimeMs };
}

// e2e/desktop/scripts/playwrightWithDeferrals.mjs prints "Pass <n>: <count> test(s) whose exclusive locks were busy".
function lockDeferrals(file) {
  if (!fs.existsSync(file)) return null;
  const passes = fs
    .readFileSync(file, "utf8")
    .matchAll(/Pass \d+: (\d+) test\(s\) whose exclusive locks were busy/g);
  return [...passes].reduce((sum, match) => sum + Number(match[1]), 0);
}

function remoteConfigFetches(file) {
  if (!fs.existsSync(file)) return "off";
  const stats = Object.values(readJson(file));
  const sum = key => stats.reduce((total, entry) => total + (entry[key] ?? 0), 0);
  const problems = [
    ["timed out", sum("timedOut")],
    ["failed", sum("failed")],
  ].filter(([, count]) => count > 0);
  return `${sum("upstream")} / ${sum("replayed")}${problems.map(([label, count]) => `, ${count} ${label}`).join("")}`;
}

function renderShardDiagnostics(root) {
  const legs = listDir(path.join(root, "allure"))
    .filter(name => name.startsWith("allure-results"))
    .map(name => name.slice("allure-results".length))
    .map(suffix => ({
      shard: shardOf(suffix),
      ...allureStats(path.join(root, "allure", `allure-results${suffix}`)),
      lockDeferrals: lockDeferrals(
        path.join(root, "playwright-log", `playwright-log${suffix}`, "playwright-output.log"),
      ),
      remoteConfig: remoteConfigFetches(
        path.join(root, "proxy", `firebase-capture-logs${suffix}`, "firebase-capture-summary.json"),
      ),
    }))
    .sort((a, b) => a.shard - b.shard);
  if (legs.length === 0) return "";

  const total = key => legs.reduce((sum, leg) => sum + (leg[key] ?? 0), 0);
  const notReadyApps = legs.flatMap(leg => leg.notReadyApps);
  const notReadyByApp = Object.entries(
    notReadyApps.reduce((counts, app) => ({ ...counts, [app]: (counts[app] ?? 0) + 1 }), {}),
  ).sort(([, a], [, b]) => b - a);
  const headline = [
    `${legs.length} shard${legs.length === 1 ? "" : "s"}`,
    `longest test time ${formatDuration(Math.max(...legs.map(leg => leg.testTimeMs)))}`,
    `${total("flaky")} flaky`,
    `${notReadyApps.length} Speculinho not ready`,
    `${total("lockDeferrals")} lock deferrals`,
  ].join(" · ");
  const rows = legs.map(leg =>
    [
      leg.shard || "—",
      leg.tests,
      leg.passed,
      leg.failed,
      leg.flaky,
      leg.skipped,
      formatDuration(leg.testTimeMs),
      leg.notReadyApps.length,
      leg.lockDeferrals ?? "—",
      leg.remoteConfig,
    ].join(" | "),
  );
  const flakyList = legs.flatMap(leg =>
    leg.flakyTests.map(name => `- ${leg.shard ? `shard ${leg.shard}: ` : ""}${escapeHtml(name)}`),
  );

  return [
    `<details><summary>Shard diagnostics: ${headline}</summary>`,
    "",
    "| Shard | Tests | Passed | Failed | Flaky | Skipped | Test time | Speculinho not ready | Lock deferrals | Remote Config upstream / replayed |",
    "| --: | --: | --: | --: | --: | --: | --: | --: | --: | --- |",
    ...rows.map(row => `| ${row} |`),
    ...(notReadyByApp.length
      ? [
          "",
          `**Speculinho not ready, by app:** ${notReadyByApp.map(([app, count]) => `${app} ×${count}`).join(", ")}`,
        ]
      : []),
    ...(flakyList.length
      ? ["", `**Flaky, passed on retry (${flakyList.length}):**`, "", ...flakyList]
      : []),
    "",
    "</details>",
  ].join("\n");
}

if (require.main === module) {
  process.stdout.write(`${renderShardDiagnostics(process.argv[2] ?? ".")}\n`);
}

module.exports = { renderShardDiagnostics };
