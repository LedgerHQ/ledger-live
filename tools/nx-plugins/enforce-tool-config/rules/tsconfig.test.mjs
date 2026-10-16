import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { TSCONFIG_BASELINE } from "./tsconfig-baseline.mjs";
import rule, { check } from "./tsconfig.mjs";

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, "../../../..");

const PRESETS = {
  "support/tsconfig/package.json": JSON.stringify({
    name: "@support/tsconfig",
    exports: {
      "./base": "./base.json",
      "./logic": "./logic.json",
      "./web": "./web.json",
      "./lib/build": "./lib-build.json",
      "./package.json": "./package.json",
    },
  }),
  "support/tsconfig/base.json": JSON.stringify({ compilerOptions: { strict: true } }),
  "support/tsconfig/logic.json": JSON.stringify({
    extends: "./base.json",
    compilerOptions: { lib: ["ES2022"], noEmit: true },
    include: ["${configDir}/src/**/*"],
  }),
  "support/tsconfig/web.json": JSON.stringify({
    extends: "./base.json",
    compilerOptions: { lib: ["ES2022", "DOM"], jsx: "react-jsx" },
    include: ["${configDir}/src/**/*"],
    exclude: ["${configDir}/src/**/*.native.*"],
  }),
  "support/tsconfig/lib-build.json": JSON.stringify({ compilerOptions: { customConditions: [] } }),
};

/**
 * A workspace holding the presets, linked where TypeScript resolves them from, plus `files`.
 *
 * @param {Record<string, unknown>} files paths relative to the workspace root; objects are written
 *   as JSON
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-tsconfig-test-"));
  for (const [file, content] of Object.entries({ ...PRESETS, ...files })) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content));
  }
  fs.mkdirSync(path.join(root, "node_modules/@support"), { recursive: true });
  fs.symlinkSync(
    path.join(root, "support/tsconfig"),
    path.join(root, "node_modules/@support/tsconfig"),
  );
  return root;
}

/**
 * @param {Record<string, unknown>} files the package's files, relative to `shared/pkg`
 * @param {Record<string, string[]>} [baseline]
 * @returns {string[]} "file: message" lines, file relative to the package
 */
function violations(files, baseline = {}) {
  const root = workspace(
    Object.fromEntries(
      Object.entries({ "package.json": "{}", ...files }).map(([file, content]) => [
        `shared/pkg/${file}`,
        content,
      ]),
    ),
  );
  return check({ workspaceRoot: root, projectRoot: "shared/pkg" }, { baseline }).map(
    ({ file, message }) => `${file.replace("shared/pkg/", "")}: ${message}`,
  );
}

test("a package on its presets passes", () => {
  assert.deepEqual(
    violations({
      "tsconfig.json": {
        extends: "@support/tsconfig/logic",
        compilerOptions: { types: ["jest"] },
        references: [{ path: "./tsconfig.web.json" }],
      },
      "tsconfig.web.json": { extends: ["./tsconfig.json", "@support/tsconfig/web"] },
      "tsconfig.build.json": {
        extends: ["./tsconfig.json", "@support/tsconfig/lib/build"],
        compilerOptions: { types: [] },
      },
      "tests/tsconfig.json": { extends: "../tsconfig.json", include: ["**/*"] },
    }),
    [],
  );
});

test("extends must name a preset or a config of the same package", () => {
  assert.deepEqual(
    violations({
      "tsconfig.json": { compilerOptions: { types: ["jest"] } },
      "tsconfig.a.json": { extends: "../../tsconfig.base.json" },
      "tsconfig.b.json": { extends: "@support/tsconfig/nope" },
      "tsconfig.c.json": { extends: "some-package/tsconfig.json" },
      "tsconfig.d.json": { extends: "./missing.json" },
    }),
    [
      'tsconfig.a.json: extends "../../tsconfig.base.json" points outside the package; extend a @support/tsconfig preset instead',
      'tsconfig.b.json: extends "@support/tsconfig/nope" is not a preset @support/tsconfig exports',
      'tsconfig.c.json: extends "some-package/tsconfig.json" is neither a @support/tsconfig preset nor a sibling config',
      'tsconfig.d.json: extends "./missing.json" does not exist',
      "tsconfig.json: must extend a @support/tsconfig preset",
    ],
  );
});

test("only the allowed top-level keys may appear", () => {
  assert.deepEqual(
    violations({
      "tsconfig.json": { extends: "@support/tsconfig/logic", "ts-node": { esm: true } },
    }),
    ['tsconfig.json: "ts-node" is not allowed in a package tsconfig'],
  );
});

test("a compiler option other than types needs a baseline entry", () => {
  const files = {
    "tsconfig.json": {
      extends: "@support/tsconfig/logic",
      compilerOptions: { noImplicitAny: false, types: ["jest"] },
    },
  };
  assert.deepEqual(violations(files), [
    "tsconfig.json: compilerOptions.noImplicitAny is not the preset's: move it to a preset, or " +
      "list it in tools/nx-plugins/enforce-tool-config/rules/tsconfig-baseline.mjs",
  ]);
  assert.deepEqual(violations(files, { "shared/pkg/tsconfig.json": ["noImplicitAny"] }), []);
});

test("the baseline only shrinks: entries the configs no longer need are reported", () => {
  assert.deepEqual(
    violations(
      { "tsconfig.json": { extends: "@support/tsconfig/logic" } },
      {
        "shared/pkg/tsconfig.json": ["noImplicitAny"],
        "shared/pkg/tsconfig.gone.json": ["lib"],
      },
    ),
    [
      "tsconfig.json: tools/nx-plugins/enforce-tool-config/rules/tsconfig-baseline.mjs lists " +
        "compilerOptions.noImplicitAny, which the config no longer sets; remove it",
      "tools/nx-plugins/enforce-tool-config/rules/tsconfig-baseline.mjs: lists " +
        "shared/pkg/tsconfig.gone.json, which does not exist; remove it",
    ],
  );
});

test("a key equal to what the config inherits is rejected, baseline or not", () => {
  assert.deepEqual(
    violations(
      {
        "tsconfig.json": {
          extends: "@support/tsconfig/logic",
          compilerOptions: { lib: ["ES2022"], types: ["jest"] },
          include: ["src/**/*"],
        },
        "tsconfig.web.json": {
          extends: ["./tsconfig.json", "@support/tsconfig/web"],
          compilerOptions: { types: ["jest"] },
          exclude: ["src/**/*.native.*"],
        },
      },
      { "shared/pkg/tsconfig.json": ["lib"] },
    ),
    [
      "tsconfig.json: compilerOptions.lib repeats what the config inherits; remove it",
      "tsconfig.json: include repeats what the config inherits; remove it",
      "tsconfig.web.json: compilerOptions.types repeats what the config inherits; remove it",
      "tsconfig.web.json: exclude repeats what the config inherits; remove it",
    ],
  );
});

test("a different set of files is allowed", () => {
  assert.deepEqual(
    violations({
      "tsconfig.json": {
        extends: "@support/tsconfig/logic",
        include: ["src/**/*", "jest/**/*"],
      },
    }),
    [],
  );
});

test("configs of a nested package and of build outputs are left to their owner", () => {
  assert.deepEqual(
    violations({
      "tsconfig.json": { extends: "@support/tsconfig/logic" },
      "fixtures/nested/package.json": "{}",
      "fixtures/nested/tsconfig.json": { compilerOptions: { strict: false } },
      "lib/tsconfig.json": { compilerOptions: { strict: false } },
      "node_modules/dep/tsconfig.json": { compilerOptions: { strict: false } },
    }),
    [],
  );
});

test("every baseline entry names an existing config", () => {
  for (const file of Object.keys(TSCONFIG_BASELINE)) {
    assert.ok(fs.existsSync(path.join(WORKSPACE_ROOT, file)), `${file} must exist`);
  }
});

test("the rule is cached on the configs and the presets", () => {
  assert.equal(rule.name, "tsconfig");
  assert.deepEqual(rule.inputs, [
    "{projectRoot}/**/tsconfig*.json",
    "{workspaceRoot}/support/tsconfig/**/*",
  ]);
});
