// Infers a `lint:tool-config` target on every workspace package. Its inputs are the config files
// the rules read, so `nx affected` only re-checks the packages whose configs a change touches.

import path from "node:path";
import { RULES } from "./rules/index.mjs";
import { workspacesMatcher } from "./validate.mjs";

const PLUGIN_ROOT = "tools/nx-plugins/enforce-tool-config";

/**
 * The `lint:tool-config` target of one project. It is cached on the files the rules read plus the
 * check's own code, so editing a rule or an exclusion re-checks every package.
 *
 * @param {string} projectRoot posix-style, relative to the workspace root
 * @param {import("./rules/index.mjs").Rule[]} [rules] defaults to the registered rules
 * @returns {Record<string, unknown>} an nx target configuration
 */
export function buildTarget(projectRoot, rules = RULES) {
  return {
    executor: "nx:run-commands",
    cache: true,
    inputs: [
      ...new Set(rules.flatMap(rule => rule.inputs)),
      `{workspaceRoot}/${PLUGIN_ROOT}/rules/**/*.mjs`,
      `{workspaceRoot}/${PLUGIN_ROOT}/validate.mjs`,
      `{workspaceRoot}/${PLUGIN_ROOT}/exclusions.mjs`,
    ],
    options: {
      cwd: "{workspaceRoot}",
      command: `node ${PLUGIN_ROOT}/validate.mjs ${projectRoot}`,
    },
  };
}

/**
 * @type {import('nx/src/project-graph/plugins').NxPluginV2}
 */
const plugin = {
  name: "@ledgerhq/nx-plugin-tool-config",
  createNodesV2: [
    "**/package.json",
    (configFiles, _options, context) => {
      // nx hands over every package.json, fixtures included: keep the ones it makes projects of.
      const isWorkspacePackage = workspacesMatcher(context.workspaceRoot);

      /** @type {import('nx/src/project-graph/plugins').CreateNodesResultV2} */
      const out = [];

      for (const file of configFiles) {
        const posixFile = file.split(path.sep).join("/");
        const projectRoot = path.posix.dirname(posixFile);
        if (projectRoot === "." || !isWorkspacePackage(posixFile)) continue;

        out.push([
          file,
          {
            projects: {
              [projectRoot]: { targets: { "lint:tool-config": buildTarget(projectRoot) } },
            },
          },
        ]);
      }

      return out;
    },
  ],
};

export default plugin;
