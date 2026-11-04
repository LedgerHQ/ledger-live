import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import toolDependency, { TOOLS, check, executables } from "./tool-dependency.mjs";
import { TOOL_DEPENDENCY_DEBT } from "./tool-dependency-debt.mjs";

const WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const DEBT_FILE = "tools/nx-plugins/enforce-tool-config/rules/tool-dependency-debt.mjs";

/** @type {string[]} */
const workspaces = [];

after(() => {
  for (const root of workspaces) fs.rmSync(root, { recursive: true, force: true });
});

/**
 * @param {{ manifest: object | string, projectRoot?: string, debt?: object }} options a string
 *   manifest is written as is
 * @returns {Array<{ file: string, message: string }>}
 */
function violations({ manifest, projectRoot = "libs/pkg", debt = {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-tool-dependency-test-"));
  workspaces.push(root);
  fs.mkdirSync(path.join(root, projectRoot), { recursive: true });
  fs.writeFileSync(
    path.join(root, projectRoot, "package.json"),
    typeof manifest === "string" ? manifest : JSON.stringify(manifest),
  );
  return check({ workspaceRoot: root, projectRoot }, { debt });
}

/**
 * @param {string} scriptName
 * @param {string} tool
 * @param {string} supplier
 * @returns {string}
 */
const undeclared = (scriptName, tool, supplier) =>
  `script "${scriptName}" runs ${tool}, which this package does not declare: add ` +
  `"${supplier}": "catalog:" to devDependencies, after adding ${supplier} to the catalog of ` +
  "pnpm-workspace.yaml if it is not there yet";

for (const [tool, supplier, script] of [
  ["tsc", "@typescript/native", "tsc --noEmit -p tsconfig.web.json"],
  ["knip", "knip", "knip --directory ../.."],
  ["oxlint", "oxlint", "oxlint src"],
  ["oxfmt", "oxfmt", "oxfmt src --check"],
  ["rimraf", "rimraf", "rimraf lib"],
  ["zx", "zx", "zx scripts/build.mjs"],
  ["nx", "nx", "nx run-many -t build"],
]) {
  test(`a script that runs ${tool} needs ${supplier} declared`, () => {
    const scripts = { tool: script };
    assert.deepEqual(violations({ manifest: { scripts } }), [
      { file: "libs/pkg/package.json", message: undeclared("tool", tool, supplier) },
    ]);
    for (const field of ["devDependencies", "dependencies"]) {
      const manifest = { scripts, [field]: { [supplier]: "catalog:" } };
      assert.deepEqual(violations({ manifest }), [], field);
    }
  });
}

test("outside the layers, a pinned version puts the tool in the graph and passes", () => {
  const manifest = { scripts: { clean: "rimraf lib" }, devDependencies: { rimraf: "5.0.10" } };
  assert.deepEqual(violations({ manifest }), []);
});

test('in the layers, the tool is in devDependencies as "catalog:"', () => {
  const scripts = { lint: "oxlint src" };
  for (const layer of ["shared", "domain/entity", "features/flow"]) {
    const projectRoot = `${layer}/pkg`;
    const file = `${projectRoot}/package.json`;
    assert.deepEqual(
      violations({ projectRoot, manifest: { scripts, devDependencies: { oxlint: "catalog:" } } }),
      [],
    );
    assert.deepEqual(
      violations({ projectRoot, manifest: { scripts, devDependencies: { oxlint: "1.82.0" } } }),
      [
        {
          file,
          message:
            'script "lint" runs oxlint, and the layers take its version from the catalog; ' +
            'devDependencies has oxlint as "1.82.0": add "oxlint": "catalog:" to devDependencies',
        },
      ],
    );
    assert.deepEqual(
      violations({ projectRoot, manifest: { scripts, dependencies: { oxlint: "catalog:" } } }),
      [
        {
          file,
          message:
            'script "lint" runs oxlint, and the layers take its version from the catalog; ' +
            'dependencies has oxlint as "catalog:": add "oxlint": "catalog:" to devDependencies',
        },
      ],
    );
  }
});

test("every script counts: hooks and scripts that other scripts run", () => {
  const scripts = {
    build: "pnpm run build:types",
    "build:types": "tsc -p tsconfig.build.json",
    prebuild: "rimraf lib",
    postbuild: "pnpm run format",
    format: "oxfmt lib",
  };
  assert.deepEqual(
    violations({ manifest: { scripts } }).map(v => v.message),
    [
      undeclared("build:types", "tsc", "@typescript/native"),
      undeclared("prebuild", "rimraf", "rimraf"),
      undeclared("format", "oxfmt", "oxfmt"),
    ],
  );
});

test("a tool run by several scripts is reported once, under the first", () => {
  const scripts = { lint: "oxlint src", "lint:fix": "oxlint src --fix" };
  assert.deepEqual(
    violations({ manifest: { scripts } }).map(v => v.message),
    [undeclared("lint", "oxlint", "oxlint")],
  );
});

test("a declared tool that no script runs passes", () => {
  const manifest = { scripts: { test: "jest" }, devDependencies: { zx: "8.0.0" } };
  assert.deepEqual(violations({ manifest }), []);
});

test("a package without scripts, or with a manifest that does not parse, passes", () => {
  assert.deepEqual(violations({ manifest: { name: "pkg" } }), []);
  assert.deepEqual(violations({ manifest: "{ not json" }), []);
});

test("the executable is found behind env assignments, wrappers and package-manager runners", () => {
  for (const script of [
    "tsc",
    "NODE_OPTIONS=--max-old-space-size=8192 tsc",
    "cross-env NODE_ENV=production tsc",
    "env FOO=1 tsc",
    "npx tsc",
    "npx --yes tsc",
    "pnpm tsc",
    "pnpm exec tsc",
    "pnpm exec --silent tsc",
    "echo start && tsc",
    "echo start; tsc",
    "false || tsc",
    "cat files | tsc",
    "(cd src && tsc)",
    "echo $(tsc --version)",
    "echo `tsc --version`",
  ]) {
    assert.deepEqual(
      executables(script).filter(executable => executable === "tsc"),
      ["tsc"],
      script,
    );
  }
});

test("naming a tool is not running it", () => {
  for (const script of [
    "echo tsc",
    "jest --testPathPattern tsc",
    "pnpm run tsc-check",
    "pnpm --filter @ledgerhq/other tsc",
    "pnpm -w nx run-many -t build",
    "pnpm dlx rimraf lib",
  ]) {
    assert.deepEqual(
      executables(script).filter(executable => executable in TOOLS),
      [],
      script,
    );
  }
});

test("pnpm <name> runs the package's script of that name, not the binary", () => {
  assert.deepEqual(executables("pnpm tsc", new Set(["tsc"])), []);
  assert.deepEqual(executables("pnpm tsc", new Set(["build"])), ["tsc"]);
});

test("a debt entry silences the tools it names, for its package only", () => {
  const manifest = { scripts: { gen: "zx scripts/gen.mjs", clean: "rimraf lib" } };
  const debt = { "libs/pkg": { tools: ["zx"], reason: "Exit condition: soon." } };
  assert.deepEqual(
    violations({ manifest, debt }).map(v => v.message),
    [undeclared("clean", "rimraf", "rimraf")],
  );
  assert.equal(violations({ manifest, debt, projectRoot: "libs/other" }).length, 2);
});

test("the debt list only shrinks: a tool the package now declares is reported", () => {
  const manifest = { scripts: { gen: "zx scripts/gen.mjs" }, devDependencies: { zx: "catalog:" } };
  const debt = { "libs/pkg": { tools: ["zx"], reason: "Exit condition: soon." } };
  assert.deepEqual(violations({ manifest, debt }), [
    {
      file: DEBT_FILE,
      message: "lists zx for libs/pkg, which the package now passes; remove it",
    },
  ]);
});

test("every debt entry names a package, known tools and an exit condition", () => {
  for (const [projectRoot, { tools, reason }] of Object.entries(TOOL_DEPENDENCY_DEBT)) {
    assert.ok(
      fs.existsSync(path.join(WORKSPACE_ROOT, projectRoot, "package.json")),
      `${projectRoot} is not a package`,
    );
    assert.ok(tools.length > 0, `${projectRoot} lists no tool`);
    for (const tool of tools) assert.ok(tool in TOOLS, `${tool} is not a root tool`);
    assert.match(reason, /Exit condition: /);
  }
});

test("the rule reads the manifest of the package", () => {
  assert.equal(toolDependency.name, "tool-dependency");
  assert.deepEqual(toolDependency.inputs, ["{projectRoot}/package.json"]);
});
