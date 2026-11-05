"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { SKIP_DIRS, SOURCE_EXTS } = require("./validate");
const projectJson = require("./project.json");

/** Input globs of the cached `lint:boundaries` target, named inputs expanded. */
const lintBoundariesGlobs = projectJson.targets["lint:boundaries"].inputs
  .flatMap(input => projectJson.namedInputs[input] ?? [input])
  .map(input => input.replace("{workspaceRoot}/", ""));

/**
 * Whether a negated input of the cached `lint:boundaries` target matches `file`.
 *
 * @param {string} file workspace-relative path
 */
function isExcludedFromLintBoundaries(file) {
  return lintBoundariesGlobs.some(g => g.startsWith("!") && path.matchesGlob(file, g.slice(1)));
}

/**
 * Whether the cached `lint:boundaries` target hashes `file`: a positive input matches it and no
 * negated one does.
 *
 * @param {string} file workspace-relative path
 */
function isLintBoundariesInput(file) {
  return (
    lintBoundariesGlobs.some(g => !g.startsWith("!") && path.matchesGlob(file, g)) &&
    !isExcludedFromLintBoundaries(file)
  );
}

/**
 * Assert the `lint:boundaries` inputs hash a source file of every extension under each root.
 *
 * @param {string[]} sourceRoots workspace-relative roots whose source files a check reads
 */
function assertSourceFilesHashed(sourceRoots) {
  const missed = sourceRoots.flatMap(sourceRoot =>
    [...SOURCE_EXTS]
      .map(ext => `${sourceRoot}/src/nested/index${ext}`)
      .filter(file => !isLintBoundariesInput(file)),
  );
  assert.deepEqual(missed, []);
}

/**
 * Assert the `lint:boundaries` inputs exclude each directory the checks skip under each root,
 * and no directory whose name merely contains it.
 *
 * @param {string[]} sourceRoots workspace-relative roots whose source files a check reads
 */
function assertSkipDirsExcluded(sourceRoots) {
  for (const dir of SKIP_DIRS) {
    const filesUnder = sourceRoots.flatMap(sourceRoot => [
      `${sourceRoot}/${dir}/index.ts`,
      `${sourceRoot}/src/${dir}/nested/index.ts`,
    ]);
    assert.deepEqual(
      filesUnder.filter(file => !isExcludedFromLintBoundaries(file)),
      [],
      `${dir}/ is hashed`,
    );

    const filesUnderSibling = sourceRoots.map(
      sourceRoot => `${sourceRoot}/src/kept${dir}/index.ts`,
    );
    assert.deepEqual(
      filesUnderSibling.filter(isExcludedFromLintBoundaries),
      [],
      `kept${dir}/ is not hashed`,
    );
  }
}

module.exports = { isLintBoundariesInput, assertSourceFilesHashed, assertSkipDirsExcluded };
