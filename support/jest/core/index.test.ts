// Pins how the presets built on the core resolve their projects: the override rule, test matching,
// the native-only shapes, the flow additions and the quarantine wiring.

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const shared = require("@support/jest/shared");
const flow = require("@support/jest/features-flow");
const { createSharedUiJestConfig, createSharedUiNativeJestConfig } = shared;
const { createFlowJestConfig, createFlowNativeJestConfig } = flow;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const quarantineReporter = "@ledgerhq/test-quarantine/jest";
const quarantineRetries = "@ledgerhq/test-quarantine/jest-retries";

/**
 * The project defaults a preset module exports, by side.
 *
 * @param {typeof shared | typeof flow} module
 */
const projectDefaults = module => ({
  web: {
    moduleNameMapper: module.webModuleNameMapper,
    setupFilesAfterEnv: module.webSetupFilesAfterEnv,
  },
  native: {
    moduleNameMapper: module.nativeModuleNameMapper,
    setupFilesAfterEnv: module.nativeSetupFilesAfterEnv,
  },
});

// Each preset with the project defaults its module exports.
const dualPresets = [
  ["createSharedUiJestConfig", createSharedUiJestConfig, projectDefaults(shared)],
  ["createFlowJestConfig", createFlowJestConfig, projectDefaults(flow)],
];
const nativeOnlyPresets = [
  ["createSharedUiNativeJestConfig", createSharedUiNativeJestConfig, projectDefaults(shared)],
  ["createFlowNativeJestConfig", createFlowNativeJestConfig, projectDefaults(flow)],
];
const sides = ["web", "native"];

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
const pinWebExtensions = ["web.tsx", "web.ts", "tsx", "ts", "js", "jsx", "json"];
const pinNativeExtensions = ["native.tsx", "native.ts", "tsx", "ts", "js", "jsx", "json"];

for (const [name, create, defaults] of dualPresets) {
  test(`${name}: the projects use the exported mappers and setup files, as unfrozen copies`, () => {
    const config = create();
    for (const side of sides) {
      const { moduleNameMapper, setupFilesAfterEnv } = project(config, side);
      const exported = defaults[side];
      assert.deepEqual(moduleNameMapper, exported.moduleNameMapper, side);
      assert.deepEqual(setupFilesAfterEnv, exported.setupFilesAfterEnv, side);
      assert.ok(
        Object.isFrozen(exported.moduleNameMapper) && Object.isFrozen(exported.setupFilesAfterEnv),
        side,
      );
      assert.ok(!Object.isFrozen(moduleNameMapper) && !Object.isFrozen(setupFilesAfterEnv), side);
    }
  });

  test(`${name}: moduleNameMapper and setupFilesAfterEnv overrides replace the preset's`, () => {
    const config = create({
      webOverrides: { moduleNameMapper: { "^web$": "/web.js" }, setupFilesAfterEnv: ["/web.js"] },
      nativeOverrides: {
        moduleNameMapper: { "^native$": "/native.js" },
        setupFilesAfterEnv: ["/native.js"],
      },
    });
    for (const side of sides) {
      assert.deepEqual(project(config, side).moduleNameMapper, { [`^${side}$`]: `/${side}.js` });
      assert.deepEqual(project(config, side).setupFilesAfterEnv, [`/${side}.js`]);
    }
  });

  test(`${name}: spreading the exported defaults keeps them, in their order`, () => {
    const lumen = "^@ledgerhq/lumen-ui-rnative(/.*)?$";
    const exported = defaults.native;
    const native = project(
      create({
        nativeOverrides: {
          moduleNameMapper: {
            ...exported.moduleNameMapper,
            [lumen]: "/own-lumen.js",
            "^extra$": "/extra.js",
          },
          setupFilesAfterEnv: [...exported.setupFilesAfterEnv, "/setup.js"],
        },
      }),
      "native",
    );
    assert.deepEqual(Object.keys(native.moduleNameMapper), [
      ...Object.keys(exported.moduleNameMapper),
      "^extra$",
    ]);
    assert.equal(native.moduleNameMapper[lumen], "/own-lumen.js");
    assert.deepEqual(native.setupFilesAfterEnv, [...exported.setupFilesAfterEnv, "/setup.js"]);
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

  test(`${name}: moduleFileExtensions and the shared swc transform`, () => {
    const config = create();
    const transformKey = Object.keys(project(config, "web").transform)[0];
    const transformRe = new RegExp(transformKey);
    for (const ext of [".ts", ".tsx", ".cts", ".js", ".jsx"])
      assert.ok(transformRe.test(`file${ext}`), `transform should match ${ext}`);
    for (const ext of [".mjs", ".cjs", ".ctsx"])
      assert.ok(!transformRe.test(`file${ext}`), `transform must not match ${ext}`);
    assert.deepEqual(project(config, "web").moduleFileExtensions, pinWebExtensions);
    assert.deepEqual(project(config, "native").moduleFileExtensions, pinNativeExtensions);
  });
}

// The tables a layer builds on the core's keep the core's entries, before the layer's own.
const coreReactNative = ["^react-native$", path.join(root, "core/mocks/react-native.cts")];
const coreWebSetup = path.join(root, "core/setup/web.ts");
const flowReanimated = [
  "^react-native-reanimated$",
  path.join(root, "features-flow/mocks/reanimated.cts"),
];
const flowWebSetup = path.join(root, "features-flow/setup/web.cts");

for (const [name, config] of [
  ["createSharedUiJestConfig", project(createSharedUiJestConfig(), "native")],
  ["createSharedUiNativeJestConfig", createSharedUiNativeJestConfig()],
]) {
  test(`${name}: the core's react-native stub on the native side`, () => {
    assert.equal(config.moduleNameMapper[coreReactNative[0]], coreReactNative[1]);
  });
}

for (const [name, create] of [
  ["createFlowJestConfig", createFlowJestConfig],
  ["createFlowNativeJestConfig", createFlowNativeJestConfig],
]) {
  test(`${name}: the native mocks are the core's, then the flow's`, () => {
    const entries = Object.entries(project(create(), "native").moduleNameMapper);
    /** @param {[string, string]} entry */
    const at = ([key, value]) => entries.findIndex(([k, v]) => k === key && v === value);
    assert.ok(at(coreReactNative) >= 0, "no core react-native stub");
    assert.ok(at(flowReanimated) > at(coreReactNative), "no flow reanimated mock after it");
  });
}

test("createFlowJestConfig: the web setup files are the core's, then the flow's", () => {
  assert.deepEqual(project(createFlowJestConfig(), "web").setupFilesAfterEnv, [
    "@testing-library/jest-dom",
    coreWebSetup,
    quarantineRetries,
    flowWebSetup,
  ]);
});

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
    path.join(root, "core/mocks/react-native.cts"),
  );
  assert.deepEqual(config.moduleFileExtensions.slice(0, 2), ["native.tsx", "native.ts"]);
});

for (const [name, create, defaults] of nativeOnlyPresets) {
  /** @param {import('@jest/types').Config.InitialOptions} options */
  const withNative = options =>
    create(create === createFlowNativeJestConfig ? { nativeOverrides: options } : options);

  test(`${name}: the exported native mapper and setup files, as unfrozen copies`, () => {
    const { moduleNameMapper, setupFilesAfterEnv } = nativeConfig(create());
    assert.deepEqual(moduleNameMapper, defaults.native.moduleNameMapper);
    assert.deepEqual(setupFilesAfterEnv, defaults.native.setupFilesAfterEnv);
    assert.ok(!Object.isFrozen(moduleNameMapper) && !Object.isFrozen(setupFilesAfterEnv));
  });

  test(`${name}: moduleNameMapper and setupFilesAfterEnv overrides replace the preset's`, () => {
    const config = nativeConfig(
      withNative({
        moduleNameMapper: { "^extra$": "/extra.js" },
        setupFilesAfterEnv: ["/setup.js"],
      }),
    );
    assert.deepEqual(config.moduleNameMapper, { "^extra$": "/extra.js" });
    assert.deepEqual(config.setupFilesAfterEnv, ["/setup.js"]);
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
    assert.equal(native.resolver, path.join(root, "features-flow/resolver.native.ts"));
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

for (const [name, create] of dualPresets) {
  test(`${name}: an unfrozen copy of the frozen sonar reporter, for jest to normalize`, () => {
    const { jestSonarReporter } = require("@support/jest/shared");
    const sonar = create().reporters.find(reporter => reporter[0] === "jest-sonar");
    assert.deepEqual(sonar, jestSonarReporter);
    assert.ok(Object.isFrozen(jestSonarReporter[1]));
    assert.ok(!Object.isFrozen(sonar) && !Object.isFrozen(sonar[1]));
  });
}

test("createSharedUiJestConfig: no flow resolver, the lumen transform allowlist only", () => {
  for (const side of ["web", "native"]) {
    const config = project(createSharedUiJestConfig(), side);
    assert.equal(config.resolver, undefined, side);
    assert.deepEqual(
      config.transformIgnorePatterns,
      ["node_modules/.pnpm/(?!(@ledgerhq\\+lumen-utils-shared|@ledgerhq\\+lumen-design-core))"],
      side,
    );
  }
});
