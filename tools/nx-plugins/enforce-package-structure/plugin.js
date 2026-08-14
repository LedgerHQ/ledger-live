"use strict";

// Infers a `lint:structure` target on every new-architecture package, so `nx affected` only
// re-checks the packages a change actually touches.

const { existsSync } = require("node:fs");
const path = require("node:path");

const PLUGIN_ROOT = "tools/nx-plugins/enforce-package-structure";

/**
 * @param {string} projectRoot posix-style relative path (e.g. domain/entity/contact)
 * @returns {boolean}
 */
function isNewArchitecturePackage(projectRoot) {
  return (
    projectRoot.startsWith("domain/") ||
    projectRoot.startsWith("shared/") ||
    projectRoot.startsWith("features/")
  );
}

/**
 * @param {string} projectRoot
 * @returns {Record<string, unknown>}
 */
function buildTarget(projectRoot) {
  return {
    executor: "nx:run-commands",
    cache: true,
    inputs: [
      `{projectRoot}/src/**/index*.ts`,
      `{projectRoot}/src/**/index*.tsx`,
      `{workspaceRoot}/${PLUGIN_ROOT}/rules.js`,
      `{workspaceRoot}/${PLUGIN_ROOT}/validate.js`,
      `{workspaceRoot}/${PLUGIN_ROOT}/exceptions.js`,
    ],
    options: {
      cwd: "{workspaceRoot}",
      command: `node ${PLUGIN_ROOT}/validate.js ${projectRoot}`,
    },
  };
}

/**
 * @type {import('nx/src/project-graph/plugins').NxPluginV2}
 */
const plugin = {
  name: "@ledgerhq/nx-plugin-package-structure",
  createNodesV2: [
    "{domain,shared,features}/**/package.json",
    configFiles => {
      /** @type {import('nx/src/project-graph/plugins').CreateNodesResultV2} */
      const out = [];

      for (const file of configFiles) {
        if (path.basename(file) !== "package.json") continue;

        const projectRoot = path.posix.dirname(file.split(path.sep).join("/"));
        if (!isNewArchitecturePackage(projectRoot)) continue;
        if (!existsSync(path.join(projectRoot, "src"))) continue;

        out.push([
          file,
          {
            projects: {
              [projectRoot]: { targets: { "lint:structure": buildTarget(projectRoot) } },
            },
          },
        ]);
      }

      return out;
    },
  ],
};

module.exports = plugin;
module.exports.isNewArchitecturePackage = isNewArchitecturePackage;
