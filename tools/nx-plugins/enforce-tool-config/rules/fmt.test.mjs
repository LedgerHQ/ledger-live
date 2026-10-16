import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import fmt from "./fmt.mjs";

/**
 * @param {Record<string, string>} files paths relative to the workspace root
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-fmt-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

/**
 * @param {Record<string, string>} scripts
 * @returns {string} a package.json
 */
function manifest(scripts = {}) {
  return JSON.stringify({ name: "pkg", scripts });
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {string[]} the reported files
 */
function reported(workspaceRoot, projectRoot) {
  return fmt.check({ workspaceRoot, projectRoot }).map(violation => violation.file);
}

test("a package without its own config or flag passes", () => {
  const root = workspace({
    "oxfmt.config.mts": 'export { default } from "@support/fmt";\n',
    "shared/a/package.json": manifest({ format: "oxfmt src", "format:check": "oxfmt src --check" }),
  });
  assert.deepEqual(fmt.check({ workspaceRoot: root, projectRoot: "shared/a" }), []);
});

test("a config in the package or below it is reported, whatever its format", () => {
  const root = workspace({
    "shared/a/package.json": manifest(),
    "shared/a/.oxfmtrc.json": "{}",
    "shared/a/oxfmt.config.ts": "export default {};",
    "shared/a/src/nested/.oxfmtrc.jsonc": "{}",
    "shared/a/node_modules/dep/.oxfmtrc.json": "{}",
    "shared/a/lib/.oxfmtrc.json": "{}",
  });
  assert.deepEqual(reported(root, "shared/a").sort(), [
    "shared/a/.oxfmtrc.json",
    "shared/a/oxfmt.config.ts",
    "shared/a/src/nested/.oxfmtrc.jsonc",
  ]);
});

test("a config between the package and the workspace root is reported", () => {
  const root = workspace({
    "libs/coin-modules/.oxfmtrc.json": "{}",
    "libs/coin-modules/coin-a/package.json": manifest(),
  });
  assert.deepEqual(reported(root, "libs/coin-modules/coin-a"), ["libs/coin-modules/.oxfmtrc.json"]);
});

test("support/fmt carries the shared config and nothing else", () => {
  const root = workspace({
    "support/fmt/package.json": manifest({ format: "oxfmt oxfmt.config.mts" }),
    "support/fmt/oxfmt.config.mts": "export default {};",
    "support/fmt/.oxfmtrc.json": "{}",
  });
  assert.deepEqual(reported(root, "support/fmt"), ["support/fmt/.oxfmtrc.json"]);
});

test("every spelling of the config flag on oxfmt is reported, once per script", () => {
  const root = workspace({
    "shared/a/package.json": manifest({
      short: "pnpm exec oxfmt -c ../../.oxfmtrc.json ./src",
      equals: "oxfmt -c=../../.oxfmtrc.json src --check",
      long: "oxfmt --config ../../.oxfmtrc.json src",
      longEquals: "oxfmt src --config=../../.oxfmtrc.json && oxfmt -c x tests",
      chained: "tsc && oxfmt -c ../../.oxfmtrc.json src",
    }),
  });
  assert.deepEqual(
    fmt.check({ workspaceRoot: root, projectRoot: "shared/a" }).map(v => v.message.split('"')[1]),
    ["short", "equals", "long", "longEquals", "chained"],
  );
});

test("a config flag on another command in the same script is not oxfmt's", () => {
  const root = workspace({
    "shared/a/package.json": manifest({
      "lint:fix": "oxfmt ./src && oxlint -c ../oxc-live-libs/.oxlintrc.json ./src --fix",
      lint: "oxlint -c .oxlintrc.json src | tee out; oxfmt --check src",
    }),
  });
  assert.deepEqual(fmt.check({ workspaceRoot: root, projectRoot: "shared/a" }), []);
});
