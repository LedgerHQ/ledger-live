import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import hygiene, { CHECKS, check } from "./hygiene.mjs";
import { HYGIENE_DEBT } from "./hygiene-debt.mjs";

const WORKSPACE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const README = "# @shared/pkg\n\n> [!CAUTION]\n> **Status: UNSTABLE.** In active development.\n";

const MANIFEST = {
  name: "@shared/pkg",
  sideEffects: false,
  scripts: { lint: "oxlint src", format: "oxfmt src", "format:check": "oxfmt src --check" },
  devDependencies: { oxfmt: "catalog:", oxlint: "catalog:", typescript: "catalog:" },
};

/** @type {string[]} */
const workspaces = [];

after(() => {
  for (const root of workspaces) fs.rmSync(root, { recursive: true, force: true });
});

/**
 * @param {Record<string, string | null>} files paths relative to the workspace root; `null`
 *   leaves that file out
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-hygiene-test-"));
  workspaces.push(root);
  for (const [file, content] of Object.entries(files)) {
    if (content === null) continue;
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

/**
 * A conforming package at `projectRoot`, with the manifest fields and README overridden.
 *
 * @param {{ manifest?: object, readme?: string | null, projectRoot?: string, debt?: object }} [options]
 * @returns {Array<{ file: string, message: string }>}
 */
function violations({
  manifest = {},
  readme = README,
  projectRoot = "shared/pkg",
  debt = {},
} = {}) {
  const root = workspace({
    [`${projectRoot}/package.json`]: JSON.stringify({ ...MANIFEST, ...manifest }),
    [`${projectRoot}/README.md`]: readme,
  });
  return check({ workspaceRoot: root, projectRoot }, { debt });
}

const NO_LINT_SCRIPT = 'a "lint" script runs oxlint; this one has none: add "lint": "oxlint src"';

const NO_FORMAT_CHECK_SCRIPT =
  'a "format:check" script runs oxfmt --check; this one has none: add "format:check": ' +
  '"oxfmt src --check", next to "format": "oxfmt src"';

test("a conforming package passes, in every layer", () => {
  for (const projectRoot of ["shared/pkg", "domain/entity/pkg", "features/flow/pkg"]) {
    assert.deepEqual(violations({ projectRoot }), []);
  }
});

test("a package outside the layers is not checked", () => {
  assert.deepEqual(
    violations({ projectRoot: "libs/pkg", readme: null, manifest: { scripts: {} } }),
    [],
  );
});

test("manifest: a package.json that is missing or not JSON is reported", () => {
  const missing = workspace({ "shared/pkg/README.md": README });
  assert.deepEqual(check({ workspaceRoot: missing, projectRoot: "shared/pkg" }, { debt: {} }), [
    {
      file: "shared/pkg/package.json",
      message:
        "a package has a package.json that parses as JSON; this one cannot be read: restore it",
    },
  ]);
  const malformed = workspace({
    "shared/pkg/package.json": '{ "name": "@shared/pkg", }',
    "shared/pkg/README.md": README,
  });
  assert.deepEqual(check({ workspaceRoot: malformed, projectRoot: "shared/pkg" }, { debt: {} }), [
    {
      file: "shared/pkg/package.json",
      message:
        "a package has a package.json that parses as JSON; this one is not valid JSON: fix its " +
        "syntax",
    },
  ]);
});

test("readme: a package without a README is reported", () => {
  assert.deepEqual(violations({ readme: null }), [
    {
      file: "shared/pkg/README.md",
      message:
        "a package has a README.md; this one has none: write one that says in a line or two " +
        "what the package is, and its status (docs/new-library.md#readme-status-marker)",
    },
  ]);
});

test("status-marker: every status of docs/new-library.md passes", () => {
  for (const marker of [
    "> [!NOTE]\n> **Status: STABLE** \u2014 Production-ready.",
    "> [!CAUTION]\n> **Status: UNSTABLE** \u2014 In active development.",
    "> [!WARNING]\n> **Status: DEPRECATED** \u2014 Use @shared/other.",
  ]) {
    assert.deepEqual(violations({ readme: `# @shared/pkg\n\n${marker}\n` }), []);
  }
});

test("status-marker: a README without a marker, or with one GitHub does not render, is reported", () => {
  const expected = [
    {
      file: "shared/pkg/README.md",
      message:
        "the README carries a status marker; this one has none: add a callout " +
        'with a line starting "> **Status: STABLE**", "> **Status: UNSTABLE**" or ' +
        '"> **Status: DEPRECATED**" (docs/new-library.md#readme-status-marker)',
    },
  ];
  assert.deepEqual(violations({ readme: "# @shared/pkg\n\nWhat it does.\n" }), expected);
  assert.deepEqual(
    violations({ readme: "# @shared/pkg\n\n> [!CAUTION] > **Status: UNSTABLE** \u2014 Soon.\n" }),
    expected,
  );
  assert.deepEqual(violations({ readme: "# @shared/pkg\n\n> **Status: BETA**\n" }), expected);
});

test("side-effects: anything but false is reported", () => {
  assert.deepEqual(violations({ manifest: { sideEffects: ["./src/slice.ts"] } }), [
    {
      file: "shared/pkg/package.json",
      message:
        '"sideEffects" is false; here it is ["./src/slice.ts"]: set it to false, and turn code ' +
        "that runs on import into a function its consumers call",
    },
  ]);
  assert.deepEqual(violations({ manifest: { sideEffects: undefined } }), [
    {
      file: "shared/pkg/package.json",
      message:
        '"sideEffects" is false; here it is not set: set it to false, and turn code that runs ' +
        "on import into a function its consumers call",
    },
  ]);
});

test("lint-script: both spellings of the sources pass", () => {
  for (const lint of [
    "oxlint src",
    "oxlint ./src",
    "oxlint src -A no-console",
    "pnpm exec oxlint src",
  ]) {
    assert.deepEqual(violations({ manifest: { scripts: { ...MANIFEST.scripts, lint } } }), []);
  }
});

test("lint-script: a missing lint script, or one that does not run oxlint, is reported", () => {
  const { lint: _lint, ...withoutLint } = MANIFEST.scripts;
  assert.deepEqual(violations({ manifest: { scripts: withoutLint } }), [
    { file: "shared/pkg/package.json", message: NO_LINT_SCRIPT },
  ]);
  for (const lint of ["eslint src", "echo oxlint src", "eslint src --plugin oxlint"]) {
    assert.deepEqual(violations({ manifest: { scripts: { ...MANIFEST.scripts, lint } } }), [
      {
        file: "shared/pkg/package.json",
        message: 'a "lint" script runs oxlint; this one does not: make it "oxlint src"',
      },
    ]);
  }
});

test("format-check-script: every spelling in use passes", () => {
  for (const formatCheck of [
    "oxfmt src --check",
    "oxfmt --check src",
    "pnpm exec oxfmt ./src --check",
  ]) {
    const scripts = { ...MANIFEST.scripts, "format:check": formatCheck };
    assert.deepEqual(violations({ manifest: { scripts } }), []);
  }
});

test("format-check-script: a missing script, or one that does not check, is reported", () => {
  const { "format:check": _check, ...withoutCheck } = MANIFEST.scripts;
  assert.deepEqual(violations({ manifest: { scripts: withoutCheck } }), [
    { file: "shared/pkg/package.json", message: NO_FORMAT_CHECK_SCRIPT },
  ]);
  for (const formatCheck of ["oxfmt src", "echo oxfmt src --check", "prettier --check oxfmt"]) {
    const scripts = { ...MANIFEST.scripts, "format:check": formatCheck };
    assert.deepEqual(violations({ manifest: { scripts } }), [
      {
        file: "shared/pkg/package.json",
        message:
          'a "format:check" script runs oxfmt --check; this one does not: make it ' +
          '"oxfmt src --check"',
      },
    ]);
  }
});

test("a debt entry silences the checks it names, for its package only", () => {
  const debt = { "shared/pkg": { checks: ["side-effects"], reason: "Exit condition: soon." } };
  assert.deepEqual(violations({ manifest: { sideEffects: true }, debt }), []);
  assert.deepEqual(
    violations({ manifest: { sideEffects: true, scripts: {} }, debt }).map(v => v.message),
    [NO_LINT_SCRIPT, NO_FORMAT_CHECK_SCRIPT],
  );
  assert.equal(
    violations({ projectRoot: "shared/other", manifest: { sideEffects: true }, debt }).length,
    1,
  );
});

test("the debt list only shrinks: a check the package passes again is reported", () => {
  const debt = { "shared/pkg": { checks: ["side-effects"], reason: "Exit condition: soon." } };
  assert.deepEqual(violations({ debt }), [
    {
      file: "tools/nx-plugins/enforce-tool-config/rules/hygiene-debt.mjs",
      message: 'lists "side-effects" for shared/pkg, which the package now passes; remove it',
    },
  ]);
});

test("every debt entry names a layer package, known checks and an exit condition", () => {
  const names = Object.keys(CHECKS);
  for (const [projectRoot, { checks, reason }] of Object.entries(HYGIENE_DEBT)) {
    assert.ok(
      fs.existsSync(path.join(WORKSPACE_ROOT, projectRoot, "package.json")),
      `${projectRoot} is not a package`,
    );
    assert.match(projectRoot, /^(shared|domain|features)\//);
    assert.ok(checks.length > 0, `${projectRoot} lists no check`);
    for (const name of checks) assert.ok(names.includes(name), `${name} is not a check`);
    assert.match(reason, /Exit condition: /);
  }
});

test("the rule reads the manifest and the README of the package", () => {
  assert.equal(hygiene.name, "hygiene");
  assert.deepEqual(hygiene.inputs, ["{projectRoot}/package.json", "{projectRoot}/README.md"]);
});
