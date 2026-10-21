// oxfmt: one config for the whole repository, support/fmt, which the workspace root re-exports.
// oxfmt uses the config nearest to each file, so a config in a package, below it or in a directory
// between it and the root overrides the shared one for that subtree. A `-c` flag does the same for
// one script.

import fs from "node:fs";
import path from "node:path";

const CONFIG_FILE = /^(\.oxfmtrc\.jsonc?|oxfmt\.config\.[cm]?[jt]s)$/;

// The config itself; the root shim is never checked, since the workspace root is not a package.
const SHARED_CONFIG = "support/fmt/oxfmt.config.mts";

// Installs and build outputs: oxfmt skips them, and walking them is slow.
const SKIP_DIRS = new Set(["node_modules", "dist", "lib", "lib-es", "build"]);

// `-c x`, `-c=x`, `--config x` or `--config=x` in the same command as `oxfmt`.
const CONFIG_FLAG = /(^|\s)(-c|--config)(=|\s)/;

/**
 * @param {string} workspaceRoot
 * @param {string} dir posix-style, relative to the workspace root
 * @returns {string[]} the oxfmt configs directly in `dir`, as posix paths relative to the root
 */
function configsIn(workspaceRoot, dir) {
  let names;
  try {
    names = fs.readdirSync(path.join(workspaceRoot, dir));
  } catch {
    return [];
  }
  return names.filter(name => CONFIG_FILE.test(name)).map(name => `${dir}/${name}`);
}

/**
 * @param {string} workspaceRoot
 * @param {string} dir posix-style, relative to the workspace root
 * @returns {string[]} the oxfmt configs in `dir` and below it
 */
function configsBelow(workspaceRoot, dir) {
  const found = configsIn(workspaceRoot, dir);
  const entries = fs.readdirSync(path.join(workspaceRoot, dir), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
      found.push(...configsBelow(workspaceRoot, `${dir}/${entry.name}`));
    }
  }
  return found;
}

/**
 * @param {string} projectRoot posix-style, e.g. "libs/coin-modules/coin-evm"
 * @returns {string[]} the directories between the project and the workspace root, both excluded
 */
function ancestors(projectRoot) {
  const dirs = [];
  for (let dir = path.posix.dirname(projectRoot); dir !== "."; dir = path.posix.dirname(dir)) {
    dirs.push(dir);
  }
  return dirs;
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {Array<{ file: string, message: string }>}
 */
function configFlags(workspaceRoot, projectRoot) {
  const file = `${projectRoot}/package.json`;
  let scripts;
  try {
    scripts = JSON.parse(fs.readFileSync(path.join(workspaceRoot, file), "utf8")).scripts ?? {};
  } catch {
    return [];
  }
  return Object.entries(scripts)
    .filter(([, script]) =>
      script
        .split(/&&|\|\||;|\|/)
        .some(command => /(^|\s)oxfmt(\s|$)/.test(command) && CONFIG_FLAG.test(command)),
    )
    .map(([name]) => ({
      file,
      message:
        `script "${name}" passes a config to oxfmt: drop the flag, oxfmt finds the ` +
        "repository config on its own",
    }));
}

/** @type {import("./index.mjs").Rule} */
export default {
  name: "fmt",
  inputs: [
    "{projectRoot}/package.json",
    "{workspaceRoot}/**/.oxfmtrc.*",
    "{workspaceRoot}/**/oxfmt.config.*",
  ],
  check({ workspaceRoot, projectRoot }) {
    const configs = [
      ...configsBelow(workspaceRoot, projectRoot),
      ...ancestors(projectRoot).flatMap(dir => configsIn(workspaceRoot, dir)),
    ].filter(file => file !== SHARED_CONFIG);

    return [
      ...configs.map(file => ({
        file,
        message:
          "oxfmt config outside support/fmt: delete it, and write a pattern this package " +
          "needs in support/fmt/oxfmt.config.mts, relative to the workspace root",
      })),
      ...configFlags(workspaceRoot, projectRoot),
    ];
  },
};
