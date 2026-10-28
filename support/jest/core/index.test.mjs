// Pins how the presets built on the core resolve their projects: the override rule, test matching,
// the native-only shapes, the flow additions and the quarantine wiring.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { createSharedUiJestConfig, createSharedUiNativeJestConfig } = require("../shared");
const { createFlowJestConfig, createFlowNativeJestConfig } = require("../features-flow");

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const quarantineReporter = "@ledgerhq/test-quarantine/jest";
const quarantineRetries = "@ledgerhq/test-quarantine/jest-retries";

const dualPresets = [
  ["createSharedUiJestConfig", createSharedUiJestConfig],
  ["createFlowJestConfig", createFlowJestConfig],
];
const nativeOnlyPresets = [
  ["createSharedUiNativeJestConfig", createSharedUiNativeJestConfig],
  ["createFlowNativeJestConfig", createFlowNativeJestConfig],
];

/**
 * @param {{ projects?: object[] }} config
 * @param {string} name
 */
function project(config, name) {
  const found = config.projects?.find(p => p.displayName === name);
  assert.ok(found, `no ${name} project`);
  return found;
}

/**
 * The native config of a native-only preset: its single project, or the flat config itself.
 *
 * @param {object} config
 */
function nativeConfig(config) {
  return config.projects === undefined ? config : project(config, "native");
}

const webFiles = ["src/View.web.test.tsx", "src/view-model.test.ts", "src/View.web.spec.ts"];
const nativeFiles = ["src/View.native.test.tsx", "src/View.native.spec.ts"];

for (const [name, create] of dualPresets) {
  test(`${name}: an override mapper entry adds to the mocks, the same pattern replaces one`, () => {
    const defaults = create();
    const config = create({
      webOverrides: {
        moduleNameMapper: {
          "^extra-web$": "/extra-web.js",
          "^@ledgerhq/lumen-ui-react(/.*)?$": "/own-lumen-web.js",
        },
      },
      nativeOverrides: {
        moduleNameMapper: {
          "^extra-native$": "/extra-native.js",
          "^@ledgerhq/lumen-ui-rnative(/.*)?$": "/own-lumen-native.js",
        },
      },
    });
    for (const [side, extra, lumen, own] of [
      ["web", "^extra-web$", "^@ledgerhq/lumen-ui-react(/.*)?$", "/own-lumen-web.js"],
      ["native", "^extra-native$", "^@ledgerhq/lumen-ui-rnative(/.*)?$", "/own-lumen-native.js"],
    ]) {
      const before = project(defaults, side).moduleNameMapper;
      const after = project(config, side).moduleNameMapper;
      assert.deepEqual(Object.keys(after), [...Object.keys(before), extra]);
      assert.equal(after[lumen], own);
      for (const pattern of Object.keys(before).filter(p => p !== lumen))
        assert.equal(after[pattern], before[pattern], pattern);
    }
  });

  test(`${name}: setupFilesAfterEnv overrides are appended after the preset's`, () => {
    const defaults = create();
    const config = create({
      webOverrides: { setupFilesAfterEnv: ["/web-setup.js"] },
      nativeOverrides: { setupFilesAfterEnv: ["/native-setup.js"] },
    });
    assert.deepEqual(project(config, "web").setupFilesAfterEnv, [
      ...project(defaults, "web").setupFilesAfterEnv,
      "/web-setup.js",
    ]);
    assert.deepEqual(project(config, "native").setupFilesAfterEnv, [
      ...project(defaults, "native").setupFilesAfterEnv,
      "/native-setup.js",
    ]);
  });

  test(`${name}: any other override key replaces the preset's`, () => {
    const config = create({ nativeOverrides: { testMatch: ["**/only.test.ts"] } });
    assert.deepEqual(project(config, "native").testMatch, ["**/only.test.ts"]);
  });

  test(`${name}: web matches suffixed and unsuffixed tests, native only suffixed ones`, () => {
    const config = create();
    const web = project(config, "web").testMatch;
    const native = project(config, "native").testMatch;
    for (const file of webFiles)
      assert.ok(
        web.some(glob => path.matchesGlob(file, glob)),
        `web misses ${file}`,
      );
    for (const file of nativeFiles)
      assert.ok(!web.some(glob => path.matchesGlob(file, glob)), `web runs ${file}`);
    for (const file of nativeFiles)
      assert.ok(
        native.some(glob => path.matchesGlob(file, glob)),
        `native misses ${file}`,
      );
    for (const file of webFiles)
      assert.ok(!native.some(glob => path.matchesGlob(file, glob)), `native runs ${file}`);
  });

  test(`${name}: quarantine reporter and retries on both projects`, () => {
    const config = create();
    assert.ok(config.reporters.includes(quarantineReporter));
    for (const side of ["web", "native"])
      assert.ok(project(config, side).setupFilesAfterEnv.includes(quarantineRetries), side);
  });
}

test("createFlowNativeJestConfig: a single native project", () => {
  const config = createFlowNativeJestConfig();
  assert.deepEqual(
    config.projects.map(p => p.displayName),
    ["native"],
  );
});

test("createSharedUiNativeJestConfig: a flat native config, no projects", () => {
  const config = createSharedUiNativeJestConfig();
  assert.equal(config.projects, undefined);
  assert.equal(config.testEnvironment, "node");
  assert.equal(
    config.moduleNameMapper["^react-native$"],
    path.join(root, "core/mocks/react-native.js"),
  );
  assert.deepEqual(config.moduleFileExtensions.slice(0, 2), ["native.tsx", "native.ts"]);
});

for (const [name, create] of nativeOnlyPresets) {
  test(`${name}: an override mapper entry adds to the mocks, the same pattern replaces one`, () => {
    const lumen = "^@ledgerhq/lumen-ui-rnative(/.*)?$";
    const before = nativeConfig(create()).moduleNameMapper;
    const options = { moduleNameMapper: { "^extra$": "/extra.js", [lumen]: "/own-lumen.js" } };
    const after = nativeConfig(
      create(name === "createFlowNativeJestConfig" ? { nativeOverrides: options } : options),
    ).moduleNameMapper;
    assert.deepEqual(Object.keys(after), [...Object.keys(before), "^extra$"]);
    assert.equal(after[lumen], "/own-lumen.js");
  });

  test(`${name}: setupFilesAfterEnv overrides are appended after the preset's`, () => {
    const before = nativeConfig(create()).setupFilesAfterEnv;
    const options = { setupFilesAfterEnv: ["/setup.js"] };
    const after = nativeConfig(
      create(name === "createFlowNativeJestConfig" ? { nativeOverrides: options } : options),
    ).setupFilesAfterEnv;
    assert.deepEqual(after, [...before, "/setup.js"]);
  });

  test(`${name}: native tests only`, () => {
    const { testMatch } = nativeConfig(create());
    for (const file of nativeFiles)
      assert.ok(
        testMatch.some(glob => path.matchesGlob(file, glob)),
        `misses ${file}`,
      );
    for (const file of webFiles)
      assert.ok(!testMatch.some(glob => path.matchesGlob(file, glob)), `runs ${file}`);
  });

  test(`${name}: quarantine reporter and retries`, () => {
    const config = create();
    assert.ok(config.reporters.includes(quarantineReporter));
    assert.ok(nativeConfig(config).setupFilesAfterEnv.includes(quarantineRetries));
  });
}

for (const [name, create] of [
  ["createFlowJestConfig", createFlowJestConfig],
  ["createFlowNativeJestConfig", createFlowNativeJestConfig],
]) {
  test(`${name}: the native project keeps the flow resolver and transform allowlist`, () => {
    const native = project(create(), "native");
    assert.equal(native.resolver, path.join(root, "features-flow/resolver.native.js"));
    assert.equal(native.transformIgnorePatterns.length, 1);
    assert.match(native.transformIgnorePatterns[0], /lumen-utils-shared\|.*lumen-design-core/);
  });
}

for (const [name, create, depth] of [
  ["createSharedUiJestConfig", createSharedUiJestConfig, "../../"],
  ["createFlowJestConfig", createFlowJestConfig, "../../../"],
  ["createFlowNativeJestConfig", createFlowNativeJestConfig, "../../../"],
]) {
  test(`${name}: coverage reporters at the top level, lcov rooted at the repository`, () => {
    const lcov = config => config.coverageReporters?.find(r => Array.isArray(r) && r[0] === "lcov");
    const config = create();
    assert.deepEqual(lcov(config), ["lcov", { file: "lcov.info", projectRoot: depth }]);
    for (const p of config.projects)
      assert.equal(p.coverageReporters, undefined, `${p.displayName} has coverageReporters`);
    const rootDir = path.resolve(root, "../../features/platform/some-package");
    assert.equal(lcov(create({ rootDir }))[1].projectRoot, "../../../");
  });
}

test("createSharedUiJestConfig: no flow resolver or transform allowlist", () => {
  for (const side of ["web", "native"]) {
    const config = project(createSharedUiJestConfig(), side);
    assert.equal(config.resolver, undefined, side);
    assert.equal(config.transformIgnorePatterns, undefined, side);
  }
});
