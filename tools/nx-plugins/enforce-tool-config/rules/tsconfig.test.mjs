import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { TSCONFIG_DEBT } from "./tsconfig-debt.mjs";
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
 * @param {Record<string, string[]>} [debt]
 * @returns {string[]} "file: message" lines, file relative to the package
 */
function violations(files, debt = {}) {
  const root = workspace(
    Object.fromEntries(
      Object.entries({ "package.json": "{}", ...files }).map(([file, content]) => [
        `shared/pkg/${file}`,
        content,
      ]),
    ),
  );
  return check({ workspaceRoot: root, projectRoot: "shared/pkg" }, { debt }).map(
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
      "tsconfig.e.json": { extends: ["@support/tsconfig/logic", "./options.json"] },
      "options.json": { compilerOptions: { strict: false } },
    }),
    [
      'tsconfig.a.json: extends "../../tsconfig.base.json" points outside the package; extend a @support/tsconfig preset instead',
      'tsconfig.b.json: extends "@support/tsconfig/nope" is not a preset @support/tsconfig exports',
      'tsconfig.c.json: extends "some-package/tsconfig.json" is neither a @support/tsconfig preset nor a sibling config',
      'tsconfig.d.json: extends "./missing.json" does not exist',
      'tsconfig.e.json: extends "./options.json" is not a tsconfig*.json this rule checks; name the parent tsconfig.<name>.json',
      "tsconfig.json: must extend a @support/tsconfig preset",
    ],
  );
});

test("a mixin alone does not count as a preset", () => {
  assert.deepEqual(
    violations({
      "tsconfig.json": { extends: "@support/tsconfig/lib/build" },
      "tsconfig.build.json": { extends: ["./tsconfig.json", "@support/tsconfig/lib/build"] },
    }),
    [
      "tsconfig.build.json: inherits no @support/tsconfig archetype: extend one before a lib/build, lib/esm or lib/tests mixin",
      "tsconfig.json: inherits no @support/tsconfig archetype: extend one before a lib/build, lib/esm or lib/tests mixin",
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

test("compiler options other than types and paths belong to a preset", () => {
  assert.deepEqual(
    violations(
      {
        "tsconfig.json": {
          extends: "@support/tsconfig/logic",
          compilerOptions: { target: "ESNext", paths: { "*": ["./*"] }, types: ["jest"] },
        },
      },
      { "shared/pkg/tsconfig.json": ["target"] },
    ),
    [
      "tsconfig.json: compilerOptions.target belongs to a preset: extend the preset that sets it",
      "tsconfig.json: tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs lists " +
        "compilerOptions.target, which the config no longer relaxes; remove it",
    ],
  );
});

test("a relaxation of the preset strictness needs a debt entry", () => {
  const files = {
    "tsconfig.json": {
      extends: "@support/tsconfig/logic",
      compilerOptions: { noImplicitAny: false, types: ["jest"] },
    },
  };
  assert.deepEqual(violations(files), [
    "tsconfig.json: compilerOptions.noImplicitAny relaxes the strictness of its preset: fix the " +
      "code instead, or list it in tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs",
  ]);
  assert.deepEqual(violations(files, { "shared/pkg/tsconfig.json": ["noImplicitAny"] }), []);
});

test("a relaxation only takes its relaxed value, and not when strict already sets it", () => {
  assert.deepEqual(
    violations({
      "tsconfig.json": {
        extends: "@support/tsconfig/logic",
        compilerOptions: { noImplicitAny: true, noImplicitThis: true },
      },
    }),
    [
      "tsconfig.json: compilerOptions.noImplicitAny may only relax the preset, to false",
      "tsconfig.json: compilerOptions.noImplicitThis may only relax the preset, to false",
      "tsconfig.json: compilerOptions.noImplicitAny repeats what the config inherits; remove it",
      "tsconfig.json: compilerOptions.noImplicitThis repeats what the config inherits; remove it",
    ],
  );
});

test("the debt list only shrinks: entries the configs no longer need are reported", () => {
  assert.deepEqual(
    violations(
      { "tsconfig.json": { extends: "@support/tsconfig/logic" } },
      {
        "shared/pkg/tsconfig.json": ["noImplicitAny"],
        "shared/pkg/tsconfig.gone.json": ["noImplicitThis"],
      },
    ),
    [
      "tsconfig.json: tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs lists " +
        "compilerOptions.noImplicitAny, which the config no longer relaxes; remove it",
      "tools/nx-plugins/enforce-tool-config/rules/tsconfig-debt.mjs: lists " +
        "shared/pkg/tsconfig.gone.json, which does not exist; remove it",
    ],
  );
});

test("a key equal to what the config inherits is rejected", () => {
  assert.deepEqual(
    violations({
      "tsconfig.json": {
        extends: "@support/tsconfig/logic",
        compilerOptions: { types: ["jest"] },
        include: ["src/**/*"],
      },
      "tsconfig.web.json": {
        extends: ["./tsconfig.json", "@support/tsconfig/web"],
        compilerOptions: { types: ["jest"] },
        exclude: ["src/**/*.native.*"],
      },
    }),
    [
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

test("every debt entry names an existing config", () => {
  for (const file of Object.keys(TSCONFIG_DEBT)) {
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
