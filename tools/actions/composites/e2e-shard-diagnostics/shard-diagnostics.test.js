"use strict";

const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { renderShardDiagnostics } = require("./shard-diagnostics");

const NOT_READY =
  "Error: Timeout: https://speculinho.test/status/ethereum-lw-ci-0a1b did not become ready within 150000ms";

function writeLeg(root, suffix, { results = [], log, nxReport, proxy }) {
  const allureDir = path.join(root, "allure", `allure-results${suffix}`);
  fs.mkdirSync(allureDir, { recursive: true });
  results.forEach((result, index) =>
    fs.writeFileSync(path.join(allureDir, `${index}-result.json`), JSON.stringify(result)),
  );
  const logDir = path.join(root, "logs", `e2e-logs${suffix}`);
  if (log !== undefined) {
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, "playwright-output.log"), log);
  }
  if (nxReport !== undefined) {
    fs.mkdirSync(logDir, { recursive: true });
    fs.writeFileSync(path.join(logDir, "nx-run-report.md"), nxReport);
  }
  if (proxy !== undefined) {
    const proxyDir = path.join(root, "proxy", `firebase-capture-logs${suffix}`);
    fs.mkdirSync(proxyDir, { recursive: true });
    fs.writeFileSync(path.join(proxyDir, "firebase-capture-summary.json"), JSON.stringify(proxy));
  }
}

const attempt = (historyId, status, start, extra = {}) => ({
  name: `test ${historyId}`,
  historyId,
  status,
  start,
  stop: start + 1000,
  ...extra,
});

const nxRunReport = (duration, cache) =>
  [
    "## Nx Run Report — `nx run ledger-live-desktop:build-lib-deps`",
    "",
    "### ✅ All tasks succeeded",
    "",
    "### Performance",
    "",
    `- **Run duration:** ${duration}`,
    ...(cache ? [`- **Cache:** ${cache}`] : []),
    "- **Critical path:** 3m 50s (12 tasks)",
    "",
  ].join("\n");

const tempRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), "shard-diagnostics-"));

test("one row per shard, in shard order, with retries folded into one outcome", () => {
  const root = tempRoot();
  writeLeg(root, "-stax-shard-2", {
    results: [attempt("a", "passed", 0)],
    log: "",
    nxReport: nxRunReport("1m 5s", "40/40 hit (100%)"),
    proxy: { project: { upstream: 1, replayed: 9, timedOut: 0, failed: 0 } },
  });
  writeLeg(root, "-stax-shard-1", {
    results: [
      attempt("a", "passed", 0),
      attempt("b", "failed", 0, { statusDetails: { message: NOT_READY } }),
      attempt("b", "passed", 60000),
      attempt("c", "broken", 0),
      attempt("c", "failed", 1000),
      attempt("d", "skipped", 0),
      attempt("e", "failed", 0),
      attempt("e", "skipped", 1000),
    ],
    log: "Pass 2: 3 test(s) whose exclusive locks were busy\nPass 3: 1 test(s) whose exclusive locks were busy\n",
    nxReport: nxRunReport("4m 12s", "31/40 hit (78%)"),
    proxy: {
      a: { upstream: 2, replayed: 5, timedOut: 1, failed: 0 },
      b: { upstream: 1, replayed: 4, failed: 2 },
    },
  });

  const markdown = renderShardDiagnostics(root);

  assert.match(
    markdown,
    /^<details><summary>Shard diagnostics: 2 shards · longest test time 1m 01s · 1 flaky · 1 Speculinho not ready · 4 lock deferrals<\/summary>/,
  );
  const rows = markdown.split("\n").filter(line => /^\| \d/.test(line));
  assert.deepStrictEqual(rows, [
    "| 1 | 5 | 1 | 2 | 1 | 1 | 4m 12s, 31/40 cached | 1m 01s | 1 | 4 | 3 / 9, 1 timed out, 2 failed |",
    "| 2 | 1 | 1 | 0 | 0 | 0 | 1m 5s, 40/40 cached | 0m 01s | 0 | 0 | 1 / 9 |",
  ]);
  assert.match(markdown, /\*\*Speculinho not ready, by app:\*\* ethereum ×1/);
  assert.match(markdown, /\*\*Flaky, passed on retry \(1\):\*\*\n\n- shard 1: test b\n/);
  assert.match(markdown, /<\/details>$/);
});

test("an unsharded leg without logs shows dashes and the proxy as off", () => {
  const root = tempRoot();
  writeLeg(root, "-macos", { results: [attempt("a", "failed", 0), attempt("a", "passed", 2000)] });

  const markdown = renderShardDiagnostics(root);

  assert.match(markdown, /Shard diagnostics: 1 shard ·/);
  assert.ok(markdown.includes("| — | 1 | 0 | 0 | 1 | 0 | — | 0m 03s | 0 | — | off |"));
  assert.match(markdown, /\n- test a\n/);
  assert.ok(!markdown.includes("Speculinho not ready, by app"));
});

test("escapes HTML in test names", () => {
  const root = tempRoot();
  writeLeg(root, "-shard-1", {
    results: [
      { ...attempt("a", "failed", 0), name: "<Swap> flow" },
      { ...attempt("a", "passed", 1000), name: "<Swap> flow" },
    ],
  });

  assert.match(renderShardDiagnostics(root), /- shard 1: &lt;Swap&gt; flow/);
});

test("renders nothing without Allure results", () => {
  assert.strictEqual(renderShardDiagnostics(tempRoot()), "");
});
