// A package declares every root tool its scripts run, so Nx puts the tool in the package's project
// graph and hashes its version (ADR-0003). The root tools are the executables the workspace root's
// dependencies install in the root node_modules/.bin, the one place a package script can reach a
// binary it does not declare. A tool the root drops is enforced by the install instead: the script
// fails with "command not found".
//
// Every script is checked, not only the entry points: pnpm runs pre and post hooks
// (enablePrePostScripts) and scripts run other scripts, and each of those is a script too.
//
// Where the root takes a tool from the catalog, the layers (shared/, domain/, features/) do too.
// Elsewhere any declaration puts the tool in the graph, and some packages pin a version of their own.

import fs from "node:fs";
import path from "node:path";
import { TOOL_DEPENDENCY_DEBT } from "./tool-dependency-debt.mjs";

/**
 * @typedef {{ supplier: string, spec: string }} RootTool the root dependency that installs an
 *   executable, and the version the root declares it at
 */

/** @type {Map<string, Map<string, RootTool[]>>} by workspace root */
const rootToolsCache = new Map();

/**
 * @param {string} file
 * @returns {any}
 */
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));

/**
 * Every executable the workspace root's dependencies install, read from their `bin` fields.
 *
 * @param {string} workspaceRoot
 * @returns {Map<string, RootTool[]>} by executable
 */
export function rootTools(workspaceRoot) {
  const cached = rootToolsCache.get(workspaceRoot);
  if (cached) return cached;

  const root = readJson(path.join(workspaceRoot, "package.json"));
  /** @type {Map<string, RootTool[]>} */
  const tools = new Map();
  for (const [supplier, spec] of Object.entries({
    ...root.dependencies,
    ...root.devDependencies,
  })) {
    const manifestFile = path.join(workspaceRoot, "node_modules", supplier, "package.json");
    let manifest;
    try {
      manifest = readJson(manifestFile);
    } catch (error) {
      throw new Error(
        `tool-dependency reads the executables of ${supplier} from ${manifestFile}, which ` +
          "cannot be read: run pnpm install",
        { cause: error },
      );
    }
    const bin =
      typeof manifest.bin === "string"
        ? { [supplier.split("/").pop()]: manifest.bin }
        : (manifest.bin ?? {});
    for (const executable of Object.keys(bin)) {
      tools.set(executable, [...(tools.get(executable) ?? []), { supplier, spec }]);
    }
  }

  rootToolsCache.set(workspaceRoot, tools);
  return tools;
}

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

  const tools = rootTools(workspaceRoot);
  const scripts = manifest.scripts ?? {};
  const scriptNames = new Set(Object.keys(scripts));
  /** @type {Map<string, string>} the first script that runs each root tool */
  const run = new Map();
  for (const [name, script] of Object.entries(scripts)) {
    for (const executable of executables(script, scriptNames)) {
      if (tools.has(executable) && !run.has(executable)) run.set(executable, name);
    }
  }

  const strict = takesCatalog(projectRoot);
  const devDependencies = manifest.devDependencies ?? {};
  const dependencies = manifest.dependencies ?? {};

  return [...run].flatMap(([tool, scriptName]) => {
    const suppliers = tools.get(tool) ?? [];
    const runs = `script "${scriptName}" runs ${tool}`;
    const declared = suppliers.find(
      ({ supplier }) => supplier in devDependencies || supplier in dependencies,
    );

    if (declared === undefined) {
      const { supplier, spec } = suppliers[0];
      return [
        {
          tool,
          message:
            `${runs}, which only the workspace root declares: add "${supplier}": ` +
            `${JSON.stringify(spec)} to devDependencies`,
        },
      ];
    }

    const { supplier, spec } = declared;
    if (strict && spec === "catalog:" && devDependencies[supplier] !== "catalog:") {
      const where = supplier in devDependencies ? "devDependencies" : "dependencies";
      const actual = devDependencies[supplier] ?? dependencies[supplier];
      return [
        {
          tool,
          message:
            `${runs}, and the layers take its version from the catalog; ${where} has ` +
            `${supplier} as ${JSON.stringify(actual)}: add "${supplier}": "catalog:" to ` +
            "devDependencies",
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
  inputs: ["{projectRoot}/package.json", "{workspaceRoot}/package.json"],
  check: context => check(context),
};
