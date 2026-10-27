import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JEST_DEBT } from "./jest-debt.mjs";
import jest, {
  FACTORY_OPTIONS,
  OWNED_KEYS,
  factoryProblem,
  maskSource,
  overridesProblems,
  presetLoader,
} from "./jest.mjs";

const CONSUMER = JSON.stringify({ devDependencies: { "@support/jest": "workspace:*" } });
const REPOSITORY = fileURLToPath(new URL("../../../..", import.meta.url));
const loadPreset = presetLoader(REPOSITORY);

/**
 * @param {string} source a config file
 * @param {string[]} [listed] its debt entries
 * @returns {string[]} what the rule reports about its overrides, against the repository presets
 */
function problems(source, listed) {
  return overridesProblems(source, { listed, loadPreset });
}

/**
 * @param {Record<string, string>} files paths relative to the package root
 * @param {Record<string, string[]>} [debt]
 * @returns {string[]} the messages the rule reports for that package
 */
function check(files, debt = {}) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "jest-rule-test-"));
  const projectRoot = "shared/thing";
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(workspaceRoot, projectRoot, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return jest
    .check({ workspaceRoot, projectRoot }, { debt, loadPreset })
    .map(v => `${v.file}: ${v.message}`);
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

test("parentheses in comments and literals do not end the factory call", () => {
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

const SHARED = 'const { createSharedJestConfig } = require("@support/jest/shared");\n';
const FLOW = 'const { createFlowJestConfig } = require("@support/jest/features-flow");\n';
const COIN =
  'const { createLibsCoinJestConfig, createLibsCoinJestProject } = require("@support/jest/libs-coin");\n';
const NOT_OWNED = "is not an override a package owns";

test("the keys a package owns pass, whatever their value", () => {
  const source = `${SHARED}const patterns = ["**/*.spec.ts"];
module.exports = createSharedJestConfig(
  {
    rootDir: __dirname,
    roots: ["<rootDir>"],
    testMatch: patterns,
    "moduleNameMapper": { "^x$": require.resolve("./x") },
    setupFilesAfterEnv: ["./setup.ts"],
    collectCoverageFrom: ["src/**/*.ts"],
    maxWorkers: 1,
    passWithNoTests: true,
  },
  { esm: true, extraEsmDeps: ["@scure"], retries: false },
);
`;
  assert.deepEqual(problems(source), []);
});

test("a key the preset owns is rejected, with the fix to use instead", () => {
  const source = `${SHARED}module.exports = createSharedJestConfig({
  transformIgnorePatterns: ["node_modules/(?!x)"],
  testEnvironment: "jsdom",
  verbose: true,
});
`;
  assert.deepEqual(problems(source), [
    `transformIgnorePatterns ${NOT_OWNED}: keep a dependency transformed with the extraEsmDeps option`,
    `testEnvironment ${NOT_OWNED}: pick the preset of the environment the tests need`,
    `verbose ${NOT_OWNED}: leave it to the preset`,
  ]);
});

test("overrides and options must be object literals the rule can read", () => {
  assert.deepEqual(
    problems(`${SHARED}const base = {};\nmodule.exports = createSharedJestConfig(base);`),
    [
      "passes createSharedJestConfig() overrides that are not an object literal; write out its keys",
    ],
  );
  assert.deepEqual(problems(`${SHARED}module.exports = createSharedJestConfig(overrides());`), [
    "passes createSharedJestConfig() overrides that are not an object literal; write out its keys",
  ]);
  assert.deepEqual(
    problems(
      `${SHARED}module.exports = createSharedJestConfig({ ...base, [key]: 1, roots() {} });`,
    ),
    [
      "overrides spread `...base`; write out its keys",
      "overrides hold an entry that is not a plain key: `[key]: 1`",
      "overrides hold an entry that is not a plain key: `roots() {}`",
    ],
  );
  assert.deepEqual(problems(`${SHARED}module.exports = createSharedJestConfig({}, options);`), [
    "passes createSharedJestConfig() options that are not an object literal; write out its keys",
  ]);
  assert.deepEqual(
    problems(`${SHARED}module.exports = createSharedJestConfig({}, { coverage: true }, 3);`),
    [
      "passes createSharedJestConfig() more than overrides and options",
      'passes createSharedJestConfig() an unknown option "coverage"',
    ],
  );
});

test("a literal override that leaves the preset's result unchanged is rejected", () => {
  assert.deepEqual(
    problems(
      `${SHARED}module.exports = createSharedJestConfig({ testMatch: ["**/*.test.ts"], roots: ["<rootDir>"] });`,
    ),
    ["testMatch repeats what the preset sets; remove it"],
  );
  // Setup files add to the preset's: an empty list changes nothing.
  assert.deepEqual(
    problems(
      'const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");\n' +
        "module.exports = createLibsCoinIntegJestConfig({ testTimeout: 60_000, setupFilesAfterEnv: [] });",
    ),
    [
      "testTimeout repeats what the preset sets; remove it",
      "setupFilesAfterEnv repeats what the preset sets; remove it",
    ],
  );
  // A value the rule cannot read without running the config is not compared.
  assert.deepEqual(
    problems(
      `${SHARED}const match = ["**/*.test.ts"];\nmodule.exports = createSharedJestConfig({ testMatch: match });`,
    ),
    [],
  );
});

test("the dual presets' project overrides follow the same allowlist", () => {
  const source = `${FLOW}const path = require("path");
module.exports = createFlowJestConfig({
  webOverrides: {
    setupFilesAfterEnv: [path.resolve(__dirname, "jest/setup.js")],
    transform: {},
  },
  nativeOverrides: {
    moduleNameMapper: { "^x$": "./x.js" },
    testMatch: ["**/*.native.test.ts?(x)", "**/*.native.spec.ts?(x)"],
    webOverrides: {},
  },
});
`;
  assert.deepEqual(problems(source), [
    `webOverrides.transform ${NOT_OWNED}: keep a dependency transformed with the extraEsmDeps option`,
    "nativeOverrides.testMatch repeats what the preset sets; remove it",
    `nativeOverrides.webOverrides ${NOT_OWNED}: leave it to the preset`,
  ]);
  assert.deepEqual(
    problems(`${FLOW}module.exports = createFlowJestConfig({ webOverrides: shared });`),
    ["webOverrides is not an object literal; write out its keys"],
  );
});

test("projects list preset project calls, each checked like a project's overrides", () => {
  const accepted = `${COIN}module.exports = createLibsCoinJestConfig({
  rootDir: __dirname,
  projects: [
    createLibsCoinJestProject({ displayName: "unit", testPathIgnorePatterns: ["\\\\.msw\\\\.test\\\\.ts"] }),
    createLibsCoinJestProject({ displayName: "msw", testMatch: ["**/*.msw.test.ts"] }, { network: true }),
  ],
});
`;
  assert.deepEqual(problems(accepted), []);

  const rejected = `${COIN}const shared = { testEnvironment: "node" };
module.exports = createLibsCoinJestConfig({
  projects: [
    { ...shared, displayName: "unit" },
    createLibsCoinJestProject({ testMatch: ["**/*.test.ts"], transform: {} }, { coverage: true }),
    createLibsCoinJestConfig(),
  ],
});
`;
  assert.deepEqual(problems(rejected), [
    'projects holds `{ ...shared, displayName: "unit" }`, not a @support/jest create*Project(...) call: jest does not pass a preset\'s options down to a project',
    "projects[createLibsCoinJestProject].testMatch repeats what the preset sets; remove it",
    `projects[createLibsCoinJestProject].transform ${NOT_OWNED}: keep a dependency transformed with the extraEsmDeps option`,
    'passes createLibsCoinJestProject() an unknown option "coverage"',
    "projects holds `createLibsCoinJestConfig()`, not a @support/jest create*Project(...) call: jest does not pass a preset's options down to a project",
  ]);
  assert.deepEqual(
    problems(`${COIN}module.exports = createLibsCoinJestConfig({ projects: list });`),
    ["projects is not an array literal; list create*Project(...) calls"],
  );
});

test("a key the debt list names for the file passes, and an entry it no longer uses is reported", () => {
  const source = `${SHARED}module.exports = createSharedJestConfig({ testEnvironment: "jsdom" });`;
  assert.deepEqual(problems(source, ["testEnvironment"]), []);
  assert.deepEqual(problems(source, ["testEnvironment", "transform"]), [
    "tools/nx-plugins/enforce-tool-config/rules/jest-debt.mjs lists transform, which the config no " +
      "longer overrides; remove it",
  ]);
});

test("the rule reports overrides by file, and debt entries for configs that are gone", () => {
  assert.deepEqual(
    check(
      {
        "package.json": CONSUMER,
        "jest.config.js": `${SHARED}module.exports = createSharedJestConfig({ reporters: [] });`,
        "jest.integ.config.js": `${SHARED}module.exports = createSharedJestConfig({ globals: {} });`,
      },
      {
        "shared/thing/jest.integ.config.js": ["globals"],
        "shared/thing/jest.native.config.js": ["transform"],
        "shared/thing/nested/jest.config.js": ["transform"],
        "shared/other/jest.config.js": ["transform"],
      },
    ),
    [
      `shared/thing/jest.config.js: reporters ${NOT_OWNED}: every preset reports the same way`,
      "tools/nx-plugins/enforce-tool-config/rules/jest-debt.mjs: lists " +
        "shared/thing/jest.native.config.js, which does not exist; remove it",
    ],
  );
});

test("every debt entry names a config that exists, each key once", () => {
  for (const [file, keys] of Object.entries(JEST_DEBT)) {
    assert.ok(fs.existsSync(path.join(REPOSITORY, file)), `${file} does not exist`);
    assert.equal(new Set(keys).size, keys.length, `${file} lists a key twice`);
  }
});

test("a factory takes only the options it reads, a misplaced one names the factories that do", () => {
  const integ = 'const { createLibsCoinIntegJestConfig } = require("@support/jest/libs-coin");\n';
  const cases = [
    [`${SHARED}module.exports = createSharedJestConfig({}, { retries: false });`, []],
    [
      `${SHARED}module.exports = createSharedJestConfig({}, { network: true });`,
      [
        'passes createSharedJestConfig() the option "network", which it does not read; it belongs ' +
          "to createLibsCoinJestConfig(), createLibsCoinJestProject()",
      ],
    ],
    [`${COIN}module.exports = createLibsCoinJestConfig({}, { network: true });`, []],
    [
      `${COIN}module.exports = createLibsCoinJestConfig({}, { retries: false });`,
      [
        'passes createLibsCoinJestConfig() the option "retries", which it does not read; it ' +
          "belongs to createSharedJestConfig()",
      ],
    ],
    [`${integ}module.exports = createLibsCoinIntegJestConfig({}, { walletFramework: false });`, []],
    [
      `${integ}module.exports = createLibsCoinIntegJestConfig({}, { network: true });`,
      [
        'passes createLibsCoinIntegJestConfig() the option "network", which it does not read; it ' +
          "belongs to createLibsCoinJestConfig(), createLibsCoinJestProject()",
      ],
    ],
    [
      `${COIN}module.exports = createLibsCoinJestConfig({ projects: [createLibsCoinJestProject({}, { network: true })] });`,
      [],
    ],
    [
      `${COIN}module.exports = createLibsCoinJestConfig({ projects: [createLibsCoinJestProject({}, { projectRoot: "../" })] });`,
      [
        'passes createLibsCoinJestProject() the option "projectRoot", which it does not read; it ' +
          "belongs to createSharedJestConfig(), createLibsCoinJestConfig(), createLibsCoinIntegJestConfig()",
      ],
    ],
    // The dual presets take no options.
    [`${FLOW}module.exports = createFlowJestConfig({ webOverrides: {} });`, []],
    [
      `${FLOW}module.exports = createFlowJestConfig({}, { esm: true });`,
      [
        'passes createFlowJestConfig() the option "esm", which it does not read; it belongs to ' +
          "createSharedJestConfig(), createLibsCoinJestConfig(), createLibsCoinIntegJestConfig(), " +
          "createLibsCoinJestProject()",
      ],
    ],
  ];
  for (const [source, expected] of cases) assert.deepEqual(problems(source), expected, source);
});

/**
 * The lines of the README block that follows the line starting with `lead`, up to a blank line.
 *
 * @param {string[]} lines
 * @param {string} lead
 * @returns {string[]}
 */
function readmeBlock(lines, lead) {
  const start = lines.findIndex(line => line.startsWith(lead));
  assert.notEqual(start, -1, `support/jest/README.md has no line starting with "${lead}"`);
  const block = lines.slice(start + 2);
  const end = block.indexOf("");
  return end === -1 ? block : block.slice(0, end);
}

/**
 * @param {Iterable<string>} listed what the README lists
 * @param {Iterable<string>} expected what the rule holds
 * @param {string} what
 */
function assertSameNames(listed, expected, what) {
  const inReadme = new Set(listed);
  const inRule = new Set(expected);
  const missing = [...inRule].filter(name => !inReadme.has(name));
  const extra = [...inReadme].filter(name => !inRule.has(name));
  assert.deepEqual(
    { missing, extra },
    { missing: [], extra: [] },
    `${what} in support/jest/README.md`,
  );
}

/**
 * @param {string} text
 * @returns {string[]} the names written as inline code in `text`
 */
function names(text) {
  return [...text.matchAll(/`([A-Za-z]+)`/g)].map(match => match[1]);
}

test("the README lists the owned keys and the options of each factory the rule holds", () => {
  const lines = fs
    .readFileSync(path.join(REPOSITORY, "support/jest/README.md"), "utf8")
    .split("\n");

  assertSameNames(
    names(readmeBlock(lines, "Override keys a package owns").join(" ")),
    OWNED_KEYS,
    "keys",
  );

  const rows = readmeBlock(lines, "Options each factory reads")
    .slice(2)
    .map(row => /^\|\s*`(\w+)`\s*\|(.*)\|\s*$/.exec(row));
  assert.ok(rows.every(Boolean), "the options table has a row that is not `factory` | options");
  assertSameNames(
    rows.map(([, factory]) => factory),
    Object.keys(FACTORY_OPTIONS),
    "factories",
  );
  for (const [, factory, options] of rows) {
    assertSameNames(names(options), FACTORY_OPTIONS[factory] ?? [], `options of ${factory}`);
  }
});

test("an override value is read, never run: calls, member access and tagged templates are not literals", () => {
  const probes = [
    '[]["constructor"]["constructor"]`globalThis.__jestRuleProbe = 1```',
    '["**/*.test.ts"]["constructor"]',
    "`**/*.test.ts`.split``",
    '[`${"**"}/*.test.ts`]',
  ];
  for (const value of probes) {
    assert.deepEqual(
      problems(`${SHARED}module.exports = createSharedJestConfig({ testMatch: ${value} });`),
      [],
      value,
    );
  }
  assert.equal(globalThis.__jestRuleProbe, undefined);

  // Comments, trailing commas, numeric separators and escapes are still literals.
  const source = `${SHARED}module.exports = createSharedJestConfig({
  testMatch: [
    "**/*.test.ts", // the preset's
  ],
  testPathIgnorePatterns: ['lib/', "lib-es/", \`node_modules/\`, /* the preset's */],
});`;
  assert.deepEqual(problems(source), [
    "testMatch repeats what the preset sets; remove it",
    "testPathIgnorePatterns repeats what the preset sets; remove it",
  ]);
});

test("the comparison runs the factory with the call's own options, or not at all", () => {
  const override = '{ transformIgnorePatterns: ["node_modules/(?!x)"] }';
  const listed = ["transformIgnorePatterns"];
  // With the default `esm: true`, withEsmDeps replaces the override.
  assert.deepEqual(
    problems(`${COIN}module.exports = createLibsCoinJestConfig(${override});`, listed),
    ["transformIgnorePatterns repeats what the preset sets; remove it"],
  );
  assert.deepEqual(
    problems(
      `${COIN}module.exports = createLibsCoinJestConfig(${override}, { esm: false });`,
      listed,
    ),
    [],
  );
  // Options the rule cannot read without running the config: no comparison.
  assert.deepEqual(
    problems(
      `${SHARED}const extraEsmDeps = ["@scure"];\nmodule.exports = createSharedJestConfig({ testMatch: ["**/*.test.ts"] }, { extraEsmDeps });`,
    ),
    [],
  );
});
