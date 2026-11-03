// Package hygiene for the layers (shared/, domain/, features/): what every package there carries
// besides its tool configs. CHECKS describes each check under its name, which is how
// hygiene-debt.mjs lists a package that cannot pass it yet.
//
// The scripts' paths are not checked: the layers spell them both "src" and "./src". The lint and
// fmt rules report a config flag on them.

import fs from "node:fs";
import path from "node:path";
import { HYGIENE_DEBT } from "./hygiene-debt.mjs";

const LAYERS = ["shared/", "domain/", "features/"];

const DEBT_FILE = "tools/nx-plugins/enforce-tool-config/rules/hygiene-debt.mjs";

export const CHECKS = {
  manifest: "a package has a package.json that parses as JSON",
  readme: "a package has a README.md",
  "status-marker": "the README carries a status marker",
  "side-effects": '"sideEffects" is false',
  "lint-script": 'a "lint" script runs oxlint',
  "format-check-script": 'a "format:check" script runs oxfmt --check',
  "tool-dependency":
    'each tool a script runs is in devDependencies as "catalog:", so Nx hashes its version ' +
    "(ADR-0003)",
};

const STATUSES = ["STABLE", "UNSTABLE", "DEPRECATED"];

// The line of the callout that carries the status, e.g. `> **Status: STABLE.** Production-ready.`
const STATUS_MARKER = new RegExp(`^> \\*\\*Status: (${STATUSES.join("|")})\\b`, "m");

const STATUS_LINES = STATUSES.map(status => `"> **Status: ${status}**"`);

// Each root tool, by the executable a script runs, and the package that supplies it.
const TOOLS = {
  tsc: "@typescript/native",
  oxlint: "oxlint",
  oxfmt: "oxfmt",
  rimraf: "rimraf",
  zx: "zx",
  nx: "nx",
};

const STATUS_DOC = "docs/new-library.md#readme-status-marker";

/**
 * @typedef {{ check: keyof typeof CHECKS, file: string, message: string }} Finding
 */

/**
 * @param {keyof typeof CHECKS} name
 * @param {string} file
 * @param {string} problem what this package does instead
 * @param {string} fix
 * @returns {Finding}
 */
function finding(name, file, problem, fix) {
  return { check: name, file, message: `${CHECKS[name]}; ${problem}: ${fix}` };
}

/**
 * @param {string | undefined} script
 * @param {(command: string) => boolean} predicate
 * @returns {boolean} whether one command of the script matches
 */
function runs(script, predicate) {
  return (script ?? "").split(/&&|\|\||;|\|/).some(command => predicate(command.trim()));
}

const EXECUTABLE = /^(?:(?:pnpm(?:\s+exec)?|npx)\s+)?(\S+)/;

/**
 * @param {string} tool
 * @returns {(command: string) => boolean} whether the command runs the tool, not only names it
 */
function callsTool(tool) {
  return command => command.match(EXECUTABLE)?.[1] === tool;
}

/** @param {string} command */
const isFormatCheck = command => callsTool("oxfmt")(command) && /(^|\s)--check(\s|$)/.test(command);

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {Finding[]}
 */
function readmeFindings(workspaceRoot, projectRoot) {
  const readmeFile = `${projectRoot}/README.md`;
  let readme;
  try {
    readme = fs.readFileSync(path.join(workspaceRoot, readmeFile), "utf8");
  } catch {
    return [
      finding(
        "readme",
        readmeFile,
        "this one has none",
        `write one that says in a line or two what the package is, and its status (${STATUS_DOC})`,
      ),
    ];
  }
  if (STATUS_MARKER.test(readme)) return [];
  return [
    finding(
      "status-marker",
      readmeFile,
      "this one has none",
      `add a callout with a line starting ${STATUS_LINES.slice(0, -1).join(", ")} or ` +
        `${STATUS_LINES.at(-1)} (${STATUS_DOC})`,
    ),
  ];
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {Finding[]}
 */
function manifestFindings(workspaceRoot, projectRoot) {
  const manifestFile = `${projectRoot}/package.json`;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(workspaceRoot, manifestFile), "utf8"));
  } catch (error) {
    return [
      error instanceof SyntaxError
        ? finding("manifest", manifestFile, "this one is not valid JSON", "fix its syntax")
        : finding("manifest", manifestFile, "this one cannot be read", "restore it"),
    ];
  }

  /** @type {Finding[]} */
  const found = [];

  if (manifest.sideEffects !== false) {
    const actual =
      manifest.sideEffects === undefined ? "not set" : JSON.stringify(manifest.sideEffects);
    found.push(
      finding(
        "side-effects",
        manifestFile,
        `here it is ${actual}`,
        "set it to false, and turn code that runs on import into a function its consumers call",
      ),
    );
  }

  const scripts = manifest.scripts ?? {};
  if (!runs(scripts.lint, callsTool("oxlint"))) {
    found.push(
      scripts.lint === undefined
        ? finding("lint-script", manifestFile, "this one has none", 'add "lint": "oxlint src"')
        : finding("lint-script", manifestFile, "this one does not", 'make it "oxlint src"'),
    );
  }
  if (!runs(scripts["format:check"], isFormatCheck)) {
    found.push(
      scripts["format:check"] === undefined
        ? finding(
            "format-check-script",
            manifestFile,
            "this one has none",
            'add "format:check": "oxfmt src --check", next to "format": "oxfmt src"',
          )
        : finding(
            "format-check-script",
            manifestFile,
            "this one does not",
            'make it "oxfmt src --check"',
          ),
    );
  }

  const devDependencies = manifest.devDependencies ?? {};
  for (const [tool, supplier] of Object.entries(TOOLS)) {
    if (!Object.values(scripts).some(script => runs(script, callsTool(tool)))) continue;
    const declared = devDependencies[supplier];
    if (declared === "catalog:") continue;
    const add = `"${supplier}": "catalog:"`;
    found.push(
      declared === undefined
        ? finding(
            "tool-dependency",
            manifestFile,
            `a script runs ${tool} and devDependencies has no ${supplier}`,
            `add ${add}`,
          )
        : finding(
            "tool-dependency",
            manifestFile,
            `devDependencies has ${supplier} as ${JSON.stringify(declared)}`,
            `make it ${add}`,
          ),
    );
  }

  return found;
}

/**
 * @param {import("./index.mjs").RuleContext} context
 * @param {{ debt?: typeof HYGIENE_DEBT }} [overrides] for tests
 * @returns {import("./index.mjs").Violation[]}
 */
export function check({ workspaceRoot, projectRoot }, { debt = HYGIENE_DEBT } = {}) {
  if (!LAYERS.some(layer => projectRoot.startsWith(layer))) return [];

  const found = [
    ...readmeFindings(workspaceRoot, projectRoot),
    ...manifestFindings(workspaceRoot, projectRoot),
  ];
  const listed = debt[projectRoot]?.checks ?? [];

  return [
    ...found
      .filter(({ check: name }) => !listed.includes(name))
      .map(({ file, message }) => ({ file, message })),
    ...listed
      .filter(name => !found.some(({ check: foundName }) => foundName === name))
      .map(name => ({
        file: DEBT_FILE,
        message: `lists "${name}" for ${projectRoot}, which the package now passes; remove it`,
      })),
  ];
}

/** @type {import("./index.mjs").Rule} */
export default {
  name: "hygiene",
  inputs: ["{projectRoot}/package.json", "{projectRoot}/README.md"],
  check: context => check(context),
};
