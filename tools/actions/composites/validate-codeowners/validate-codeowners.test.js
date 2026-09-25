"use strict";

const test = require("node:test");
const assert = require("node:assert");
const {
  parseCodeowners,
  compilePattern,
  compileRules,
  resolveOwners,
  analyse,
} = require("./validate-codeowners");

const matches = (pattern, file) => compilePattern(pattern).regex.test(file);
const run = (content, files) => analyse(parseCodeowners(content), files).findings;

test("patterns follow gitignore semantics, case-sensitively", () => {
  assert.ok(matches("/docs/", "docs/a.md"));
  assert.ok(!matches("/docs/", "libs/docs/a.md"));
  assert.ok(matches("e2e/", "apps/mobile/e2e/a.ts"));
  assert.ok(matches("libs/coin-*/", "libs/coin-modules/a.ts"));
  assert.ok(!matches("libs/coin-*/", "apps/libs/coin-x/a.ts"));
  assert.ok(matches("apps/**/families/", "apps/desktop/src/families/evm/a.ts"));
  assert.ok(matches("**/tsconfig*", "tsconfig.json"));
  assert.ok(matches("**/tsconfig*", "libs/a/tsconfig.build.json"));
  assert.ok(matches("**/Foo/**", "a/Foo/b/c.ts"));
  assert.ok(matches("AGENTS.md", "libs/a/AGENTS.md"));
  assert.ok(!matches("/docs/", "docs"));
  assert.ok(!matches("**/screens/customImage", "src/screens/CustomImage/a.ts"));
});

test("resolves owners with the last matching rule", () => {
  const rules = compileRules(
    parseCodeowners("/libs/ @team/a\nlibs/b/ @team/b @team/c\nlibs/b/errors/\n"),
  );
  assert.deepStrictEqual(resolveOwners(rules, "libs/a/x.ts"), ["@team/a"]);
  assert.deepStrictEqual(resolveOwners(rules, "libs/b/x.ts"), ["@team/b", "@team/c"]);
  assert.deepStrictEqual(resolveOwners(rules, "libs/b/errors/e.ts"), []);
  assert.deepStrictEqual(resolveOwners(rules, "apps/x.ts"), []);
});

test("reports a rule that matches no file", () => {
  const findings = run("libs/gone/ @team/a\n", ["libs/here/a.ts"]);
  assert.strictEqual(findings.length, 1);
  assert.match(findings[0].message, /matches no tracked file/);
});

test("reports a rule every file of which is re-owned later", () => {
  const findings = run("libs/a/x.ts @team/a\nlibs/a/ @team/b\n", ["libs/a/x.ts", "libs/a/y.ts"]);
  assert.deepStrictEqual(
    findings.map(f => f.line),
    [1, 2],
  );
  assert.match(findings[0].message, /never takes effect/);
  assert.match(findings[1].message, /broad rule placed after narrower ones/);
});

test("reports a broad rule placed after a narrower one", () => {
  const files = [
    "libs/a/src/x.ts",
    "libs/a/tsconfig.json",
    "libs/b/tsconfig.json",
    "libs/c/tsconfig.json",
  ];
  const findings = run("libs/a/ @team/a\n**/tsconfig* @team/platform\n", files);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].line, 2);
});

test("counts only files taken from narrower rules", () => {
  const files = [
    "src/a.ts",
    "src/b.ts",
    "src/c.ts",
    "src/d.ts",
    "src/analytics/x.ts",
    "src/analytics/y.ts",
    "src/analytics/useDevice.ts",
  ];
  const content = "/src/ @team/app\n**/useDevice* @team/devices\n/src/analytics/ @team/analytics\n";
  const findings = run(content, files).filter(f => f.line === 3);
  assert.strictEqual(findings.length, 1);
  assert.match(findings[0].message, /takes 1 file\(s\) from 1 narrower earlier rule\(s\): L2 /);
});

test("accepts a narrower rule placed after a broad one", () => {
  const files = [
    "libs/a/src/x.ts",
    "libs/a/tsconfig.json",
    "libs/b/tsconfig.json",
    "libs/c/tsconfig.json",
  ];
  assert.deepStrictEqual(run("**/tsconfig* @team/platform\nlibs/a/ @team/a\n", files), []);
});

test("the allow-override comment covers its block", () => {
  const files = [
    "shared/env/x.ts",
    "shared/env/team-a/i.ts",
    "shared/flags/team-a/f.ts",
    "shared/flags/team-a/g.ts",
  ];
  const content =
    "/shared/env/ @team/platform\n\n# codeowners-check: allow-override\n**/team-a/ @team/a\n";
  assert.deepStrictEqual(run(content, files), []);
  assert.strictEqual(
    run(content.replace("# codeowners-check: allow-override\n", ""), files).length,
    1,
  );
});

test("rules without owners are opt-outs and may override anything", () => {
  const files = ["libs/a/x.ts", "libs/a/errors/e.ts", "libs/b/errors/e.ts"];
  assert.deepStrictEqual(run("libs/a/ @team/a\nlibs/**/errors/\n", files), []);
});

test("reports an unanchored name that matches in several places", () => {
  const findings = run("tools @team/platform\n", ["tools/a.sh", "apps/desktop/tools/b.sh"]);
  assert.strictEqual(findings.length, 1);
  assert.match(findings[0].message, /unanchored pattern matches in 2 places/);
  assert.deepStrictEqual(
    run("/tools @team/platform\n", ["tools/a.sh", "apps/desktop/tools/b.sh"]),
    [],
  );
});
