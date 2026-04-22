"use strict";

const { existsSync } = require("node:fs");
const path = require("node:path");
const { readJsonFile } = require("nx/src/utils/fileutils");
const { combineGlobPatterns } = require("nx/src/utils/globs");
const {
  buildPackageJsonPatterns,
  buildPackageJsonWorkspacesMatcher,
} = require("nx/src/plugins/package-json/create-nodes");

/**
 * @param {string} projectRoot posix-style relative path (e.g. libs/foo)
 * @param {string} packageName
 * @returns {string[]}
 */
function inferTags(projectRoot, packageName) {
  const tags = new Set();

  if (projectRoot.startsWith("libs/")) {
    tags.add("scope:libs");
    if (projectRoot.startsWith("libs/ui/")) {
      tags.add("scope:libs-ui");
    } else {
      tags.add("scope:libs-non-ui");
    }
    if (projectRoot.startsWith("libs/ledgerjs/")) {
      tags.add("scope:libs-ledgerjs");
    }
  }

  if (projectRoot.startsWith("features/")) {
    tags.add("scope:features");
  }

  if (projectRoot.startsWith("e2e/")) {
    tags.add("scope:e2e");
  }

  if (projectRoot.startsWith("tools/")) {
    tags.add("scope:tools");
  }

  if (!(projectRoot === "apps" || projectRoot.startsWith("apps/"))) {
    tags.add("scope:no-apps");
  }

  if (
    projectRoot === "libs/ledger-live-common" ||
    projectRoot.startsWith("libs/ledger-live-common/")
  ) {
    tags.add("type:live-common");
  }

  const isCoinModulePath = projectRoot.startsWith("libs/coin-modules/");
  const isCoinModulePackage =
    typeof packageName === "string" &&
    packageName.startsWith("@ledgerhq/coin-") &&
    !packageName.startsWith("@ledgerhq/coin-tester");
  if (isCoinModulePath || isCoinModulePackage) {
    tags.add("type:coin-module");
  }

  const isCoinTesterPath =
    projectRoot === "libs/coin-tester" ||
    projectRoot.startsWith("libs/coin-tester/") ||
    projectRoot.startsWith("libs/coin-tester-modules/");
  const isCoinTesterPackage =
    typeof packageName === "string" && packageName.startsWith("@ledgerhq/coin-tester");
  if (isCoinTesterPath || isCoinTesterPackage) {
    tags.add("type:coin-tester");
  }

  if (projectRoot === "apps/ledger-live-desktop") {
    tags.add("scope:apps");
    tags.add("type:app-desktop");
  } else if (projectRoot === "apps/ledger-live-mobile") {
    tags.add("scope:apps");
    tags.add("type:app-mobile");
  } else if (projectRoot === "apps/cli" || packageName === "@ledgerhq/live-cli") {
    tags.add("scope:apps");
    tags.add("type:app-cli");
  } else if (projectRoot === "apps/web-tools" || packageName === "@ledgerhq/web-tools") {
    tags.add("scope:apps");
    tags.add("type:app-web-tools");
  } else if (
    packageName === "ledger-live-desktop-e2e-tests" ||
    projectRoot === "e2e/desktop"
  ) {
    tags.add("scope:apps");
    tags.add("type:e2e-desktop");
  } else if (
    packageName === "ledger-live-mobile-e2e-tests" ||
    projectRoot === "e2e/mobile"
  ) {
    tags.add("scope:apps");
    tags.add("type:e2e-mobile");
  }

  return [...tags].sort();
}

function normalizeProjectRoot(packageJsonPath) {
  return path.posix.dirname(packageJsonPath.split(path.sep).join("/"));
}

/**
 * @type {import('nx/src/project-graph/plugins').NxPluginV2}
 */
const plugin = {
  name: "@ledgerhq/nx-plugin-project-tags",
  createNodesV2: [
    combineGlobPatterns("package.json", "**/package.json"),
    (configFiles, _options, context) => {
      const readJson = (f) => readJsonFile(path.join(context.workspaceRoot, f));
      const patterns = buildPackageJsonPatterns(context.workspaceRoot, readJson);
      const isInPackageManagerWorkspaces = buildPackageJsonWorkspacesMatcher(patterns);

      /** @type {import('nx/src/project-graph/plugins').CreateNodesResultV2} */
      const out = [];

      for (const file of configFiles) {
        if (path.basename(file) !== "package.json") {
          continue;
        }

        const projectRoot = normalizeProjectRoot(file);
        const siblingProjectJson = path.join(
          context.workspaceRoot,
          projectRoot,
          "project.json",
        );
        const nextToProjectJson = existsSync(siblingProjectJson);

        if (!isInPackageManagerWorkspaces(file) && !nextToProjectJson) {
          continue;
        }

        let pkg;
        try {
          pkg = readJsonFile(path.join(context.workspaceRoot, file));
        } catch {
          continue;
        }

        const name = typeof pkg?.name === "string" ? pkg.name : "";
        const tags = inferTags(projectRoot, name);
        if (tags.length === 0) {
          continue;
        }

        out.push([file, { projects: { [projectRoot]: { tags } } }]);
      }

      return out;
    },
  ],
};

module.exports = plugin;
module.exports.inferTags = inferTags;
