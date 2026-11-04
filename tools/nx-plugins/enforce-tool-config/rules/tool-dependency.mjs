// Every root tool a package's scripts run is declared in the package's own manifest, so Nx puts the
// tool in the package's project graph and hashes its version (ADR-0003).
//
// Every script is checked, not only the entry points: pnpm runs pre and post hooks
// (enablePrePostScripts) and scripts run other scripts, and each of those is a script too.
//
// The layers (shared/, domain/, features/) also take the version from the catalog. Elsewhere any
// declaration puts the tool in the graph, and some packages still pin a version of their own.

import fs from "node:fs";
import path from "node:path";
import { TOOL_DEPENDENCY_DEBT } from "./tool-dependency-debt.mjs";

/** Each root tool, by the executable a script runs, and the package that supplies it. */
export const TOOLS = {
  tsc: "@typescript/native",
  knip: "knip",
  oxlint: "oxlint",
  oxfmt: "oxfmt",
  rimraf: "rimraf",
  zx: "zx",
  nx: "nx",
};

const CATALOG_LAYERS = ["shared/", "domain/", "features/"];

const DEBT_FILE = "tools/nx-plugins/enforce-tool-config/rules/tool-dependency-debt.mjs";

// Commands that run the command after them: `cross-env NODE_ENV=production tsc`.
const WRAPPERS = new Set(["cross-env", "env", "time", "nice"]);

// pnpm's own commands. `pnpm <anything else>` runs a script of that name or else a binary.
const PNPM_COMMANDS = new Set([
  "add",
  "audit",
  "bin",
  "config",
  "create",
  "deploy",
  "dlx",
  "env",
  "i",
  "init",
  "install",
  "link",
  "list",
  "ls",
  "outdated",
  "pack",
  "patch",
  "prune",
  "publish",
  "rebuild",
  "remove",
  "rm",
  "root",
  "run",
  "start",
  "store",
  "t",
  "test",
  "unlink",
  "up",
  "update",
  "why",
]);

const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

/**
 * The executable of one command, once the env assignments, wrappers and package-manager runners in
 * front of it are dropped.
 *
 * @param {string[]} words the command, split on whitespace
 * @param {Set<string>} scriptNames `pnpm <name>` runs that script, not a binary
 * @returns {string | undefined}
 */
function executableOf(words, scriptNames) {
  const rest = [...words];
  while (rest.length > 0) {
    const [first, second] = rest;
    if (ENV_ASSIGNMENT.test(first) || WRAPPERS.has(first)) {
      rest.shift();
    } else if (first === "npx" || (first === "pnpm" && second === "exec")) {
      rest.splice(0, first === "npx" ? 1 : 2);
      while (rest[0]?.startsWith("-")) rest.shift();
    } else if (first === "pnpm") {
      // A flag first (`pnpm --filter x`, `pnpm -w`) runs in another package or the root.
      if (!second || second.startsWith("-") || PNPM_COMMANDS.has(second)) return undefined;
      if (scriptNames.has(second)) return undefined;
      rest.shift();
    } else {
      return first;
    }
  }
  return undefined;
}

/**
 * Every executable a script runs, one per command of its command lists, pipelines and subshells.
 *
 * @param {string} script
 * @param {Set<string>} [scriptNames] the package's script names
 * @returns {string[]}
 */
export function executables(script, scriptNames = new Set()) {
  return script
    .split(/&&|\|\||[;|&()`\n]|\$\(/)
    .map(command => executableOf(command.trim().split(/\s+/).filter(Boolean), scriptNames))
    .filter(executable => executable !== undefined);
}

/**
 * @param {string} projectRoot
 * @returns {boolean}
 */
const takesCatalog = projectRoot => CATALOG_LAYERS.some(layer => projectRoot.startsWith(layer));

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {Array<{ tool: string, message: string }>} one per tool a script runs undeclared
 */
function findings(workspaceRoot, projectRoot) {
  let manifest;
  try {
    manifest = JSON.parse(
      fs.readFileSync(path.join(workspaceRoot, projectRoot, "package.json"), "utf8"),
    );
  } catch {
    // An unreadable manifest is not this rule's to report: nx cannot make a project of it.
    return [];
  }

  const scripts = manifest.scripts ?? {};
  const scriptNames = new Set(Object.keys(scripts));
  const run = new Map();
  for (const [name, script] of Object.entries(scripts)) {
    for (const executable of executables(script, scriptNames)) {
      if (executable in TOOLS && !run.has(executable)) run.set(executable, name);
    }
  }

  const strict = takesCatalog(projectRoot);
  const devDependencies = manifest.devDependencies ?? {};
  const dependencies = manifest.dependencies ?? {};

  return [...run].flatMap(([tool, scriptName]) => {
    const supplier = TOOLS[tool];
    const add = `add "${supplier}": "catalog:" to devDependencies`;
    const runs = `script "${scriptName}" runs ${tool}`;
    const declared = devDependencies[supplier] ?? dependencies[supplier];

    if (declared === undefined) {
      return [
        {
          tool,
          message:
            `${runs}, which this package does not declare: ${add}, after adding ${supplier} to ` +
            "the catalog of pnpm-workspace.yaml if it is not there yet",
        },
      ];
    }
    if (strict && devDependencies[supplier] !== "catalog:") {
      const where = supplier in devDependencies ? "devDependencies" : "dependencies";
      return [
        {
          tool,
          message:
            `${runs}, and the layers take its version from the catalog; ${where} has ` +
            `${supplier} as ${JSON.stringify(declared)}: ${add}`,
        },
      ];
    }
    return [];
  });
}

/**
 * @param {import("./index.mjs").RuleContext} context
 * @param {{ debt?: typeof TOOL_DEPENDENCY_DEBT }} [overrides] for tests
 * @returns {import("./index.mjs").Violation[]}
 */
export function check({ workspaceRoot, projectRoot }, { debt = TOOL_DEPENDENCY_DEBT } = {}) {
  const file = `${projectRoot}/package.json`;
  const found = findings(workspaceRoot, projectRoot);
  const listed = debt[projectRoot]?.tools ?? [];

  return [
    ...found.filter(({ tool }) => !listed.includes(tool)).map(({ message }) => ({ file, message })),
    ...listed
      .filter(tool => !found.some(finding => finding.tool === tool))
      .map(tool => ({
        file: DEBT_FILE,
        message: `lists ${tool} for ${projectRoot}, which the package now passes; remove it`,
      })),
  ];
}

/** @type {import("./index.mjs").Rule} */
export default {
  name: "tool-dependency",
  inputs: ["{projectRoot}/package.json"],
  check: context => check(context),
};
