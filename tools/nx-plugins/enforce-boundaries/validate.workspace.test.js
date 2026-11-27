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

/** @type {Promise<Array<{ name: string, root: string, tags: string[] }>> | undefined} */
let workspaceNodes;

/**
 * Name, root and tags of every node of the workspace project graph `lint:boundaries` checks.
 *
 * @returns {Promise<Array<{ name: string, root: string, tags: string[] }>>}
 */
function workspaceProjectNodes() {
  workspaceNodes ??= createProjectGraphAsync({ exitOnError: false }).then(graph =>
    Object.entries(graph.nodes).map(([name, node]) => ({
      name,
      root: node.data.root,
      tags: node.data.tags ?? [],
    })),
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

test("every BANNED_EXTERNALS_BY_TAG exception names a graph node carrying the rule's tag", async () => {
  const nodes = await workspaceProjectNodes();
  for (const { sourceTag, exceptProjects = [] } of BANNED_EXTERNALS_BY_TAG) {
    for (const name of exceptProjects) {
      const node = nodes.find(n => n.name === name);
      assert.ok(node, `${name} is not a graph node`);
      assert.ok(node.tags.includes(sourceTag), `${name} does not carry ${sourceTag}`);
    }
  }
});
