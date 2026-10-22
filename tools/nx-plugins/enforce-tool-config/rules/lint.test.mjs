import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import lint from "./lint.mjs";

/**
 * @param {string} preset
 * @returns {string} a layer config re-exporting the preset
 */
function layer(preset) {
  return `export { default } from "@support/lint/${preset}";\n`;
}

const LAYERS = {
  "devtools/oxlint.config.mts": layer("devtools"),
  "domain/oxlint.config.mts": layer("base"),
  "features/flow/oxlint.config.mts": layer("features-flow"),
  "features/platform/oxlint.config.mts": layer("base"),
  "libs/oxlint.config.mts": layer("libs"),
  "libs/coin-tester-modules/oxlint.config.mts": layer("libs-coin-tester"),
  "shared/oxlint.config.mts": layer("base"),
  "support/oxlint.config.mts": layer("support"),
  "tools/oxlint.config.mts": layer("tools"),
};

/**
 * @param {Record<string, string | null>} files paths relative to the workspace root, on top of
 *   every layer config; `null` leaves that file out
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-lint-test-"));
  for (const [file, content] of Object.entries({ ...LAYERS, ...files })) {
    if (content === null) continue;
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
 * @returns {string[]} the reported messages
 */
function messages(workspaceRoot, projectRoot) {
  return lint.check({ workspaceRoot, projectRoot }).map(violation => violation.message);
}

test("a package under its layer config, without config or flag of its own, passes", () => {
  const root = workspace({
    "features/flow/a/package.json": manifest({
      lint: "oxlint src",
      "lint:fix": "oxfmt src && oxlint src --fix --quiet",
    }),
    "libs/coin-tester-modules/b/package.json": manifest({ lint: "oxlint src" }),
  });
  assert.deepEqual(lint.check({ workspaceRoot: root, projectRoot: "features/flow/a" }), []);
  assert.deepEqual(
    lint.check({ workspaceRoot: root, projectRoot: "libs/coin-tester-modules/b" }),
    [],
  );
});

test("a config in the package or below it is reported, whatever its format", () => {
  const root = workspace({
    "shared/a/package.json": manifest(),
    "shared/a/.oxlintrc.json": "{}",
    "shared/a/oxlint.config.ts": "export default {};",
    "shared/a/src/nested/.oxlintrc.jsonc": "{}",
    "shared/a/node_modules/dep/.oxlintrc.json": "{}",
    "shared/a/lib/.oxlintrc.json": "{}",
  });
  assert.deepEqual(
    lint
      .check({ workspaceRoot: root, projectRoot: "shared/a" })
      .map(v => v.file)
      .sort(),
    ["shared/a/.oxlintrc.json", "shared/a/oxlint.config.ts", "shared/a/src/nested/.oxlintrc.jsonc"],
  );
});

test("a config between the package and the root is reported unless it is a layer config", () => {
  const root = workspace({
    "features/oxlint.config.mts": layer("base"),
    "features/flow/oxlint.config.mts": layer("features-flow"),
    "features/flow/.oxlintrc.json": "{}",
    "features/flow/a/package.json": manifest(),
  });
  assert.deepEqual(
    lint
      .check({ workspaceRoot: root, projectRoot: "features/flow/a" })
      .map(v => v.file)
      .sort(),
    ["features/flow/.oxlintrc.json", "features/oxlint.config.mts"],
  );
});

test("a missing layer config is reported for the packages it covers", () => {
  const root = workspace({
    "features/flow/oxlint.config.mts": null,
    "features/flow/a/package.json": manifest(),
    "libs/coin-tester-modules/oxlint.config.mts": null,
    "libs/coin-tester-modules/b/package.json": manifest(),
    "libs/c/package.json": manifest(),
  });
  assert.deepEqual(
    lint.check({ workspaceRoot: root, projectRoot: "features/flow/a" }).map(v => v.file),
    ["features/flow/oxlint.config.mts"],
  );
  assert.match(messages(root, "features/flow/a")[0], /@support\/lint\/features-flow/);
  // The libs/ config still exists, but it is not the preset coin testers run on.
  assert.deepEqual(
    lint.check({ workspaceRoot: root, projectRoot: "libs/coin-tester-modules/b" }).map(v => v.file),
    ["libs/coin-tester-modules/oxlint.config.mts"],
  );
  assert.deepEqual(messages(root, "libs/c"), []);
});

test("a config at the workspace root is reported", () => {
  const root = workspace({
    ".oxlintrc.json": "{}",
    "oxlint.config.mts": "export default {};",
    "shared/a/package.json": manifest(),
  });
  assert.deepEqual(
    lint
      .check({ workspaceRoot: root, projectRoot: "shared/a" })
      .map(v => v.file)
      .sort(),
    [".oxlintrc.json", "oxlint.config.mts"],
  );
});

test("a layer config that does more than re-export its own preset is reported", () => {
  const root = workspace({
    "shared/oxlint.config.mts": layer("libs"),
    "shared/a/package.json": manifest(),
    "tools/oxlint.config.mts": 'import base from "@support/lint/tools";\nexport default base;\n',
    "tools/b/package.json": manifest(),
  });
  assert.deepEqual(messages(root, "shared/a"), [
    'a layer config only re-exports its preset: `export { default } from "@support/lint/base";`',
  ]);
  assert.equal(messages(root, "tools/b").length, 1);
});

test("a config flag on an oxlint call is reported, in any script and any spelling", () => {
  const root = workspace({
    "shared/a/package.json": manifest({
      lint: "oxlint -c ../../libs/oxc-live-libs/.oxlintrc.json ./src",
      "lint:fix": "oxfmt src && oxlint --config=x.json src --fix",
      "lint:ci": "oxlint src --config x.json",
    }),
  });
  assert.equal(messages(root, "shared/a").length, 3);
});

test("a config flag on another tool in the same script is not reported", () => {
  const root = workspace({
    "shared/a/package.json": manifest({
      "lint:fix": "oxfmt -c ../../.oxfmtrc.json src && oxlint src --fix",
      typecheck: "tsc -p tsconfig.json",
    }),
  });
  assert.deepEqual(messages(root, "shared/a"), []);
});

test("an allowlisted rule flag on the lint script passes, in either spelling", () => {
  const root = workspace({
    "libs/a/package.json": manifest({
      lint: "oxlint ./src -A no-console",
      "lint:fix": "pnpm lint --fix",
    }),
    "libs/b/package.json": manifest({ lint: "oxlint ./src --deny=import/no-cycle" }),
  });
  assert.deepEqual(messages(root, "libs/a"), []);
  assert.deepEqual(messages(root, "libs/b"), []);
});

test("a rule flag outside the allowlist, or on another script, is reported", () => {
  const root = workspace({
    "libs/a/package.json": manifest({
      lint: "oxlint ./src -A no-console -D eslint/no-shadow",
      "lint:fix": "oxfmt src && oxlint src -A no-console --fix",
    }),
  });
  const reported = messages(root, "libs/a");
  assert.equal(reported.length, 2);
  assert.match(reported[0], /`-D eslint\/no-shadow`, which is not in the allowlist/);
  assert.match(reported[1], /script "lint:fix" sets `-A no-console`: rule flags go on the "lint"/);
});

test("a package without a manifest or scripts is only checked for configs", () => {
  const root = workspace({ "shared/a/src/index.ts": "", "shared/b/package.json": "{}" });
  assert.deepEqual(messages(root, "shared/a"), []);
  assert.deepEqual(messages(root, "shared/b"), []);
});
