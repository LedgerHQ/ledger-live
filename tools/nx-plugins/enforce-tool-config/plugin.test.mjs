import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import plugin, { buildTarget } from "./plugin.mjs";

const [, createNodes] = plugin.createNodesV2;

/**
 * @param {Record<string, string>} files paths relative to the workspace root
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tool-config-plugin-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

test("infers the target on workspace packages only", () => {
  const files = [
    "package.json",
    "libs/a/package.json",
    "libs/a/src/__fixtures__/package.json",
    "support/b/package.json",
    "tools/unlisted/package.json",
  ];
  const root = workspace({
    ...Object.fromEntries(files.map(file => [file, "{}"])),
    "pnpm-workspace.yaml": 'packages:\n  - "libs/*"\n  - "support/*"\n',
  });

  const results = createNodes(files, undefined, { workspaceRoot: root });

  assert.deepEqual(
    results.map(([file]) => file),
    ["libs/a/package.json", "support/b/package.json"],
  );
  const [, nodes] = results[0];
  assert.deepEqual(Object.keys(nodes.projects), ["libs/a"]);
  assert.ok(nodes.projects["libs/a"].targets["lint:tool-config"]);
});

test("the target checks its own project and caches on the rules' inputs", () => {
  const rule = { name: "fmt", inputs: ["{projectRoot}/.oxfmtrc.json"], check: () => [] };
  const twin = { name: "lint", inputs: ["{projectRoot}/.oxfmtrc.json"], check: () => [] };
  const target = buildTarget("libs/a", [rule, twin]);

  assert.equal(target.cache, true);
  assert.equal(
    target.options.command,
    "node tools/nx-plugins/enforce-tool-config/validate.mjs libs/a",
  );
  assert.equal(target.inputs.filter(input => input === "{projectRoot}/.oxfmtrc.json").length, 1);
  assert.ok(
    target.inputs.includes("{workspaceRoot}/tools/nx-plugins/enforce-tool-config/exclusions.mjs"),
  );
});

test("with no rules the target still depends on the plugin's own files", () => {
  const target = buildTarget("libs/a", []);
  assert.deepEqual(target.inputs, [
    "{workspaceRoot}/tools/nx-plugins/enforce-tool-config/rules/**/*.mjs",
    "{workspaceRoot}/tools/nx-plugins/enforce-tool-config/validate.mjs",
    "{workspaceRoot}/tools/nx-plugins/enforce-tool-config/exclusions.mjs",
  ]);
});
