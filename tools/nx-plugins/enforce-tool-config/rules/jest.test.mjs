import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import jest, { factoryProblem, maskSource } from "./jest.mjs";

const CONSUMER = JSON.stringify({ devDependencies: { "@support/jest": "workspace:*" } });

/**
 * @param {Record<string, string>} files paths relative to the package root
 * @returns {string[]} the messages the rule reports for that package
 */
function check(files) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jest-rule-test-"));
  const projectRoot = "shared/thing";
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(workspaceRoot, projectRoot, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return jest.check({ workspaceRoot, projectRoot }).map(v => `${v.file}: ${v.message}`);
}

test("a package without the @support/jest dependency is not checked", () => {
  assert.deepEqual(
    check({
      "package.json": "{}",
      "jest.config.js": "module.exports = { testEnvironment: 'node' };",
    }),
    [],
  );
});

test("a consumer whose configs come out of preset factories passes", () => {
  assert.deepEqual(
    check({
      "package.json": CONSUMER,
      "jest.config.js": 'module.exports = require("@support/jest/devtools").createWebJestConfig();',
      "jest.native.config.js":
        'module.exports = require("@support/jest/devtools").createNativeJestConfig();\n',
    }),
    [],
  );
});

test("every way of binding a factory is recognised", () => {
  const accepted = [
    'module.exports = require("@support/jest/features-flow").createFlowJestConfig();',
    "module.exports = require('@support/jest/shared')\n  .createSharedJestConfig();",
    'const { createSharedJestConfig } = require("@support/jest/shared");\nmodule.exports = createSharedJestConfig();',
    'const { createSharedJestConfig: preset } = require("@support/jest/shared");\nmodule.exports = preset();',
    'const shared = require("@support/jest/shared");\nmodule.exports = shared.createSharedUiJestConfig();',
    'import { createSharedJestConfig } from "@support/jest/shared";\nexport default createSharedJestConfig();',
    'import { createSharedJestConfig as preset } from "@support/jest/shared";\nexport default preset();',
    'import * as shared from "@support/jest/shared";\nexport default shared.createSharedJestConfig();',
  ];
  for (const source of accepted) assert.equal(factoryProblem(source), null, source);
});

test("the overrides argument is not policed", () => {
  const source = `const path = require("path");
const { createSharedUiJestConfig, sharedReporters } = require("@support/jest/shared");

// Parentheses in a comment ) do not end the call.
module.exports = createSharedUiJestConfig({
  reporters: ["default", ...(process.env.CI ? ["github-actions"] : []), ...sharedReporters],
  nativeOverrides: {
    moduleNameMapper: {
      "^lumen(/.*)?$": path.join(__dirname, "jest/mocks/lumen.js"), /* ) */
      "^react-native$": require.resolve("@support/jest/shared/mocks/react-native"),
    },
  },
});
`;
  assert.equal(factoryProblem(source), null);
});

test("a hand-written config is rejected", () => {
  assert.match(
    factoryProblem("module.exports = { testEnvironment: 'node' };"),
    /not built by a @support\/jest preset factory/,
  );
});

test("a config wrapped by a helper rather than built by a factory is rejected", () => {
  const source = `const { withEsmDeps } = require("@support/jest/shared");
const config = { testEnvironment: "node" };
module.exports = withEsmDeps(config);`;
  assert.match(factoryProblem(source), /not built by a @support\/jest preset factory/);
});

test("a factory that is not from a preset is rejected", () => {
  assert.match(
    factoryProblem('module.exports = require("other-preset").createJestConfig();'),
    /not built by/,
  );
  assert.match(
    factoryProblem(
      'const { createJestConfig } = require("./local");\nmodule.exports = createJestConfig();',
    ),
    /not built by/,
  );
});

test("a config that edits what the factory returns is rejected", () => {
  const derived = `// Native-only.
const { projects, ...config } = require("@support/jest/features-flow").createFlowJestConfig();
module.exports = { ...config, projects: projects.filter(p => p.displayName === "native") };`;
  assert.match(factoryProblem(derived), /not built by/);

  const mutated = `const config = require("@support/jest/features-flow").createFlowJestConfig();
config.projects[0].setupFilesAfterEnv.push("x");
module.exports = config;`;
  assert.match(factoryProblem(mutated), /not built by/);

  const chained =
    'module.exports = require("@support/jest/shared").createSharedUiJestConfig().projects[0];';
  assert.match(factoryProblem(chained), /changes the result of createSharedUiJestConfig\(\)/);
});

test("commented-out code is ignored", () => {
  const source = `// module.exports = { testEnvironment: "node" };
/* module.exports = {}; */
module.exports = require("@support/jest/shared").createSharedJestConfig();`;
  assert.equal(factoryProblem(source), null);
});

test("comments and literal contents are masked, preset specifiers and offsets kept", () => {
  assert.equal(
    maskSource('require("@support/jest/shared") // x\n"a(" + /b"\\//g'),
    'require("@support/jest/shared")     \n"  " + /    /g',
  );
  assert.equal(maskSource("`a${`(`}b`"), "` ${` `} `");
  assert.equal(maskSource("x = a / 2 / b;"), "x = a / 2 / b;");
});

test("regular expression and string literals in the overrides are not read as code", () => {
  const source = `const { createSharedJestConfig } = require("@support/jest/shared");

module.exports = createSharedJestConfig({
  displayName: "module.exports",
  testPathIgnorePatterns: [/node_modules\\//.source, /["')]/.source, /[/]/.source],
  rootDir: \`\${__dirname}/) export default\`,
  maxWorkers: require("os").cpus().length / 2,
  testRegex: typeof x === "string" ? /\\.test\\.ts$/ : "x",
});
`;
  assert.equal(factoryProblem(source), null);
});

test("an export hidden after a regular expression is still found", () => {
  const source = `const ignored = [/lib\\/*/];
module.exports = require("@support/jest/shared").createSharedJestConfig();
module.exports.verbose = true;`;
  assert.equal(factoryProblem(source), "assigns its export more than once");
});

test("a config without an export, or exporting twice, is rejected", () => {
  assert.equal(factoryProblem("const x = 1;"), "exports no config");
  assert.equal(
    factoryProblem(
      'module.exports = require("@support/jest/shared").createSharedJestConfig();\nmodule.exports.verbose = true;',
    ),
    "assigns its export more than once",
  );
});

test("every jest config of a consumer is checked and reported by file", () => {
  assert.deepEqual(
    check({
      "package.json": CONSUMER,
      "jest.config.js": 'module.exports = require("@support/jest/devtools").createWebJestConfig();',
      "jest.native.config.js": "module.exports = { testEnvironment: 'node' };",
      "jest-setup.js": "module.exports = {};",
    }),
    [
      "shared/thing/jest.native.config.js: exports a config that is not built by a @support/jest " +
        "preset factory; export a create*Config(overrides) call from @support/jest/<preset>",
    ],
  );
});

test("a consumer without a jest config is reported", () => {
  assert.deepEqual(check({ "package.json": CONSUMER }), [
    "shared/thing/package.json: depends on @support/jest but has no jest config built by one of " +
      "its presets",
  ]);
});
