import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import toolDependency, { check, executables, rootTools } from "./tool-dependency.mjs";
import { TOOL_DEPENDENCY_DEBT } from "./tool-dependency-debt.mjs";

const WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const DEBT_FILE = "tools/nx-plugins/enforce-tool-config/rules/tool-dependency-debt.mjs";

// What the root declares, and what each of those packages installs in node_modules/.bin.
const ROOT_DEPENDENCIES = {
  oxlint: { spec: "catalog:", bin: { oxlint: "bin/oxlint" } },
  zx: { spec: "8.8.5", bin: { zx: "build/cli.js" } },
  "@changesets/cli": { spec: "catalog:", bin: { changeset: "bin.js" } },
  "@scoped/tool": { spec: "1.0.0", bin: "cli.js" },
  typescript: { spec: "catalog:", bin: { tsc6: "bin/tsc" } },
  "typescript-fork": { spec: "1.0.0", bin: { tsc6: "bin/tsc" } },
  chalk: { spec: "catalog:", bin: undefined },
};

/** @type {string[]} */
const workspaces = [];

after(() => {
  for (const root of workspaces) fs.rmSync(root, { recursive: true, force: true });
});

/**
 * @param {string} root
 * @param {string} file
 * @param {object | string} content a string is written as is
 */
function write(root, file, content) {
  const full = path.join(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content));
}

/**
 * A workspace whose root declares `rootDependencies`, each installed in node_modules.
 *
 * @param {typeof ROOT_DEPENDENCIES} [rootDependencies]
 * @returns {string} workspace root
 */
function workspace(rootDependencies = ROOT_DEPENDENCIES) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-tool-dependency-test-"));
  workspaces.push(root);
  const devDependencies = {};
  for (const [name, { spec, bin }] of Object.entries(rootDependencies)) {
    devDependencies[name] = spec;
    write(root, `node_modules/${name}/package.json`, { name, bin });
  }
  write(root, "package.json", { name: "root", devDependencies });
  return root;
}

/**
 * @param {{ manifest: object | string, projectRoot?: string, debt?: object }} options a string
 *   manifest is written as is
 * @returns {Array<{ file: string, message: string }>}
 */
function violations({ manifest, projectRoot = "libs/pkg", debt = {} }) {
  const root = workspace();
  write(root, `${projectRoot}/package.json`, manifest);
  return check({ workspaceRoot: root, projectRoot }, { debt });
}

/**
 * @param {string} scriptName
 * @param {string} tool
 * @param {string} supplier
 * @param {string} spec
 * @returns {string}
 */
const rootOnly = (scriptName, tool, supplier, spec) =>
  `script "${scriptName}" runs ${tool}, which only the workspace root declares: add ` +
  `"${supplier}": "${spec}" to devDependencies`;

test("the root tools are the executables the root's dependencies install", () => {
  const tools = rootTools(workspace());
  assert.deepEqual(
    Object.fromEntries([...tools].map(([executable, suppliers]) => [executable, suppliers])),
    {
      oxlint: [{ supplier: "oxlint", spec: "catalog:" }],
      zx: [{ supplier: "zx", spec: "8.8.5" }],
      changeset: [{ supplier: "@changesets/cli", spec: "catalog:" }],
      tool: [{ supplier: "@scoped/tool", spec: "1.0.0" }],
      tsc6: [
        { supplier: "typescript", spec: "catalog:" },
        { supplier: "typescript-fork", spec: "1.0.0" },
      ],
    },
  );
});

test("a root dependency that is not installed fails the check rather than passing it", () => {
  const root = workspace();
  fs.rmSync(path.join(root, "node_modules/zx"), { recursive: true });
  assert.throws(() => rootTools(root), /node_modules\/zx\/package\.json.*run pnpm install/);
});

for (const [tool, supplier, spec, script] of [
  ["oxlint", "oxlint", "catalog:", "oxlint src"],
  ["zx", "zx", "8.8.5", "zx scripts/build.mjs"],
  ["changeset", "@changesets/cli", "catalog:", "changeset version"],
  ["tool", "@scoped/tool", "1.0.0", "tool --run"],
]) {
  test(`a script that runs ${tool} declares ${supplier}, at the root's version`, () => {
    const scripts = { run: script };
    assert.deepEqual(violations({ manifest: { scripts } }), [
      { file: "libs/pkg/package.json", message: rootOnly("run", tool, supplier, spec) },
    ]);
    for (const field of ["devDependencies", "dependencies"]) {
      const manifest = { scripts, [field]: { [supplier]: spec } };
      assert.deepEqual(violations({ manifest }), [], field);
    }
  });
}

test("an executable several root dependencies install passes when the package declares any", () => {
  const scripts = { typecheck: "tsc6 --noEmit" };
  assert.deepEqual(
    violations({ manifest: { scripts } }).map(v => v.message),
    [rootOnly("typecheck", "tsc6", "typescript", "catalog:")],
  );
  const manifest = { scripts, devDependencies: { "typescript-fork": "1.0.0" } };
  assert.deepEqual(violations({ manifest }), []);
});

test("a tool the root does not declare is not this rule's: the install enforces it", () => {
  const manifest = { scripts: { clean: "rimraf lib", typecheck: "tsc --noEmit" } };
  assert.deepEqual(violations({ manifest }), []);
});

test("outside the layers, a pinned version puts the tool in the graph and passes", () => {
  const manifest = { scripts: { lint: "oxlint src" }, devDependencies: { oxlint: "1.82.0" } };
  assert.deepEqual(violations({ manifest }), []);
});

test('in the layers, a tool the root takes from the catalog is in devDependencies as "catalog:"', () => {
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

test("in the layers, a tool the root pins passes at any version", () => {
  const manifest = { scripts: { gen: "zx scripts/gen.mjs" }, devDependencies: { zx: "8.0.0" } };
  assert.deepEqual(violations({ projectRoot: "shared/pkg", manifest }), []);
});

test("every script counts: hooks and scripts that other scripts run", () => {
  const scripts = {
    build: "pnpm run build:types",
    "build:types": "tsc6 -p tsconfig.build.json",
    prebuild: "zx scripts/clean.mjs",
    postbuild: "pnpm run lint",
    lint: "oxlint lib",
  };
  assert.deepEqual(
    violations({ manifest: { scripts } }).map(v => v.message),
    [
      rootOnly("build:types", "tsc6", "typescript", "catalog:"),
      rootOnly("prebuild", "zx", "zx", "8.8.5"),
      rootOnly("lint", "oxlint", "oxlint", "catalog:"),
    ],
  );
});

test("a tool run by several scripts is reported once, under the first", () => {
  const scripts = { lint: "oxlint src", "lint:fix": "oxlint src --fix" };
  assert.deepEqual(
    violations({ manifest: { scripts } }).map(v => v.message),
    [rootOnly("lint", "oxlint", "oxlint", "catalog:")],
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
      executables(script).filter(executable => ["tsc", "nx", "rimraf"].includes(executable)),
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
  const manifest = { scripts: { gen: "zx scripts/gen.mjs", lint: "oxlint src" } };
  const debt = { "libs/pkg": { tools: ["zx"], reason: "Exit condition: soon." } };
  assert.deepEqual(
    violations({ manifest, debt }).map(v => v.message),
    [rootOnly("lint", "oxlint", "oxlint", "catalog:")],
  );
  assert.equal(violations({ manifest, debt, projectRoot: "libs/other" }).length, 2);
});

test("the debt list only shrinks: a tool the package now declares is reported", () => {
  const manifest = { scripts: { gen: "zx scripts/gen.mjs" }, devDependencies: { zx: "8.8.5" } };
  const debt = { "libs/pkg": { tools: ["zx"], reason: "Exit condition: soon." } };
  assert.deepEqual(violations({ manifest, debt }), [
    {
      file: DEBT_FILE,
      message: "lists zx for libs/pkg, which the package now passes; remove it",
    },
  ]);
});

test("every debt entry names a package, root tools and an exit condition", () => {
  const tools = rootTools(WORKSPACE_ROOT);
  for (const [projectRoot, { tools: listed, reason }] of Object.entries(TOOL_DEPENDENCY_DEBT)) {
    assert.ok(
      fs.existsSync(path.join(WORKSPACE_ROOT, projectRoot, "package.json")),
      `${projectRoot} is not a package`,
    );
    assert.ok(listed.length > 0, `${projectRoot} lists no tool`);
    for (const tool of listed) assert.ok(tools.has(tool), `${tool} is not a root tool`);
    assert.match(reason, /Exit condition: /);
  }
});

test("the rule reads the manifests of the package and of the workspace root", () => {
  assert.equal(toolDependency.name, "tool-dependency");
  assert.deepEqual(toolDependency.inputs, [
    "{projectRoot}/package.json",
    "{workspaceRoot}/package.json",
  ]);
});
