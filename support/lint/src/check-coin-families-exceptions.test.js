import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { findProblems } from "./check-coin-families-exceptions.js";

const SCRIPT = fileURLToPath(new URL("./check-coin-families-exceptions.js", import.meta.url));

/**
 * @param {unknown} exceptions
 * @param {Record<string, unknown>} baseline
 * @param {string[]} [files] source files to create, relative to the app root
 * @returns {string} an app root
 */
function app(exceptions, baseline = {}, files = ["src/a.ts"]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coin-families-exceptions-test-"));
  fs.writeFileSync(path.join(root, "coin-families-exceptions.json"), JSON.stringify(exceptions));
  fs.writeFileSync(path.join(root, "oxlint-suppressions.json"), JSON.stringify(baseline));
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), "");
  }
  return root;
}

const ACCEPTED = {
  file: "src/a.ts",
  kind: "accepted",
  owner: "@ledgerhq/platform",
  reason: "Why.",
};
const BASELINE = { "src/a.ts": { "coin-families/no-coin-specific-import": { count: 1 } } };

const messages = (root, problems) => problems.map(line => line.replace(`${root}${path.sep}`, ""));

test("passes a complete entry whose file exists and whose rule is still baselined", () => {
  const root = app([{ ...ACCEPTED, rules: ["no-coin-specific-import"] }], BASELINE);

  assert.deepEqual(findProblems(root), []);
});

test("passes an entry no rule reports, with no rules listed", () => {
  const root = app([ACCEPTED]);

  assert.deepEqual(findProblems(root), []);
});

test("passes a temporary entry that has a ticket and no reason", () => {
  const root = app([{ file: "src/a.ts", kind: "temporary", ticket: "LIVE-1" }]);

  assert.deepEqual(findProblems(root), []);
});

test("reports an entry whose file was deleted", () => {
  const root = app([ACCEPTED], {}, []);

  assert.deepEqual(messages(root, findProblems(root)), [
    "src/a.ts: the file does not exist, remove its entry",
  ]);
});

test("reports a rule the baseline no longer holds for the file", () => {
  const root = app([{ ...ACCEPTED, rules: ["no-coin-specific-import"] }], {});

  assert.deepEqual(messages(root, findProblems(root)), [
    "src/a.ts: no-coin-specific-import no longer reports it in oxlint-suppressions.json, remove the rule from its entry",
  ]);
});

test("reports an accepted entry without owner or reason", () => {
  const root = app([{ file: "src/a.ts", kind: "accepted" }]);

  assert.deepEqual(messages(root, findProblems(root)), [
    "src/a.ts: an accepted entry needs an owner",
    "src/a.ts: an accepted entry needs a reason",
  ]);
});

test("reports a temporary entry with neither reason nor ticket", () => {
  const root = app([{ file: "src/a.ts", kind: "temporary" }]);

  assert.deepEqual(messages(root, findProblems(root)), [
    "src/a.ts: a temporary entry needs a reason or a ticket",
  ]);
});

test("reports an unknown kind and an unknown rule", () => {
  const root = app(
    [
      { ...ACCEPTED, kind: "burn-down" },
      { file: "src/b.ts", kind: "accepted", owner: "@a", reason: "Why.", rules: ["no-such-rule"] },
    ],
    {},
    ["src/a.ts", "src/b.ts"],
  );

  assert.deepEqual(messages(root, findProblems(root)), [
    "src/a.ts: kind must be one of accepted, temporary",
    "src/b.ts: unknown rule no-such-rule",
  ]);
});

test("reports a file listed twice", () => {
  const root = app([ACCEPTED, ACCEPTED]);

  assert.deepEqual(messages(root, findProblems(root)), ["src/a.ts: listed twice"]);
});

test("exits 1 with the problems on stderr, and 0 when there is none", () => {
  const stale = spawnSync("node", [SCRIPT, app([ACCEPTED], {}, [])], { encoding: "utf8" });
  const clean = spawnSync("node", [SCRIPT, app([ACCEPTED])], { encoding: "utf8" });

  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /the file does not exist/);
  assert.equal(clean.status, 0);
});
