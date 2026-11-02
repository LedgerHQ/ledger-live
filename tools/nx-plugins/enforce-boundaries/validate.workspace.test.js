"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { createProjectGraphAsync } = require("@nx/devkit");
const { DEP_CONSTRAINTS, BANNED_EXTERNALS_BY_TAG } = require("./constraints");
const {
  isLintBoundariesInput,
  assertSourceFilesHashed,
  assertSkipDirsExcluded,
} = require("./test-helpers");

/** @type {Promise<Array<{ root: string, tags: string[] }>> | undefined} */
let workspaceNodes;

/**
 * Root and tags of every node of the workspace project graph `lint:boundaries` checks.
 *
 * @returns {Promise<Array<{ root: string, tags: string[] }>>}
 */
function workspaceProjectNodes() {
  workspaceNodes ??= createProjectGraphAsync({ exitOnError: false }).then(graph =>
    Object.values(graph.nodes).map(node => ({ root: node.data.root, tags: node.data.tags ?? [] })),
  );
  return workspaceNodes;
}

/**
 * Every project root tagged with a constrained source tag: the checks read its source files.
 *
 * @returns {Promise<string[]>}
 */
async function taggedSourceRoots() {
  const constrainedTags = new Set([
    ...DEP_CONSTRAINTS.map(c => c.sourceTag),
    ...BANNED_EXTERNALS_BY_TAG.map(r => r.sourceTag),
  ]);
  return (await workspaceProjectNodes())
    .filter(node => node.tags.some(tag => constrainedTags.has(tag)))
    .map(node => node.root);
}

test("lint:boundaries inputs cover every source file of a tagged project", async () => {
  assertSourceFilesHashed(await taggedSourceRoots());
});

test("lint:boundaries inputs exclude each skipped directory of a tagged project", async () => {
  assertSkipDirsExcluded(await taggedSourceRoots());
});

test("lint:boundaries inputs cover the manifest and project file of every graph node", async () => {
  const roots = (await workspaceProjectNodes()).map(node => node.root);
  for (const top of ["e2e", "tests", "tools"]) {
    assert.ok(
      roots.some(r => r === top || r.startsWith(`${top}/`)),
      `no graph node under ${top}/`,
    );
  }
  const files = roots.flatMap(r => [
    path.posix.join(r, "package.json"),
    path.posix.join(r, "project.json"),
  ]);
  assert.deepEqual(
    files.filter(file => !isLintBoundariesInput(file)),
    [],
  );
});
