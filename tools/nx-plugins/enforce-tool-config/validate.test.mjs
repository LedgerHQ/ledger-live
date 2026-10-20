import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { EXCLUSIONS } from "./exclusions.mjs";
import { RULES } from "./rules/index.mjs";
import { checkProject, findProjectRoots, isExcluded } from "./validate.mjs";

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, "../../..");

/**
 * @param {Record<string, string>} files paths relative to the workspace root
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

/**
 * @param {string} name
 * @param {string[]} offenders project roots the rule reports
 * @returns {import("./rules/index.mjs").Rule}
 */
function fakeRule(name, offenders) {
  return {
    name,
    inputs: [`{projectRoot}/${name}.json`],
    check: ({ projectRoot }) =>
      offenders.includes(projectRoot)
        ? [{ file: `${projectRoot}/${name}.json`, message: "nope" }]
        : [],
  };
}

test("every workspace package passes the enabled rules", () => {
  const roots = findProjectRoots(WORKSPACE_ROOT);
  assert.ok(roots.length > 100, `expected the whole workspace, found ${roots.length} package(s)`);
  for (const root of roots) {
    assert.deepEqual(checkProject(WORKSPACE_ROOT, root), [], root);
  }
});

test("a rule's violations are reported under its name", () => {
  const rules = [fakeRule("fmt", ["shared/thing"]), fakeRule("lint", [])];
  assert.deepEqual(checkProject("/ws", "shared/thing", rules, {}), [
    { rule: "fmt", file: "shared/thing/fmt.json", message: "nope" },
  ]);
  assert.deepEqual(checkProject("/ws", "shared/other", rules, {}), []);
});

test("an exclusion covers its directory and everything below it, nothing else", () => {
  const exclusions = { libs: { rules: ["fmt"], reason: "r" } };
  assert.equal(isExcluded("libs", "fmt", exclusions), true);
  assert.equal(isExcluded("libs/coin-modules/coin-evm", "fmt", exclusions), true);
  assert.equal(isExcluded("libs-extra/thing", "fmt", exclusions), false);
  assert.equal(isExcluded("shared/libs", "fmt", exclusions), false);

  const rules = [fakeRule("fmt", ["libs/a", "shared/b"])];
  assert.deepEqual(checkProject("/ws", "libs/a", rules, exclusions), []);
  assert.equal(checkProject("/ws", "shared/b", rules, exclusions).length, 1);
});

test("an exclusion scoped to some rules leaves the others enforced", () => {
  const exclusions = { apps: { rules: ["jest"], reason: "r" } };
  const rules = [fakeRule("jest", ["apps/desktop"]), fakeRule("fmt", ["apps/desktop"])];
  assert.deepEqual(
    checkProject("/ws", "apps/desktop", rules, exclusions).map(v => v.rule),
    ["fmt"],
  );
});

test("every exclusion names an existing directory and states its exit condition", () => {
  for (const [dir, entry] of Object.entries(EXCLUSIONS)) {
    assert.ok(fs.statSync(path.join(WORKSPACE_ROOT, dir)).isDirectory(), `${dir} must exist`);
    assert.match(entry.reason, /exit condition/i, `${dir} must state how the exclusion goes away`);
  }
});

test("every exclusion names the rules it exempts, and only rules that exist", () => {
  const names = new Set(RULES.map(rule => rule.name));
  for (const [dir, entry] of Object.entries(EXCLUSIONS)) {
    assert.ok(
      Array.isArray(entry.rules) && entry.rules.length > 0,
      `${dir} must name the rules it exempts`,
    );
    for (const rule of entry.rules) {
      assert.ok(names.has(rule), `${dir} names unknown rule ${rule}`);
    }
  }
});

test("every rule has a unique name, its inputs and a check", () => {
  const names = RULES.map(rule => rule.name);
  assert.equal(new Set(names).size, names.length, "rule names must be unique");
  for (const rule of RULES) {
    assert.equal(typeof rule.name, "string");
    assert.ok(Array.isArray(rule.inputs) && rule.inputs.length > 0, `${rule.name} needs inputs`);
    assert.equal(typeof rule.check, "function");
  }
});

test("findProjectRoots returns the workspace packages only", () => {
  const root = workspace({
    "package.json": "{}",
    "pnpm-workspace.yaml": 'packages:\n  - "libs/*"\n  - "shared/*"\n',
    "libs/a/package.json": "{}",
    "libs/a/node_modules/dep/package.json": "{}",
    "libs/a/src/__fixtures__/package.json": "{}",
    "shared/b/package.json": "{}",
    "tools/unlisted/package.json": "{}",
  });
  assert.deepEqual(findProjectRoots(root), ["libs/a", "shared/b"]);
});
