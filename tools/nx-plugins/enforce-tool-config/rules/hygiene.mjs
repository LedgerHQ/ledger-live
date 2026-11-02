// Package hygiene for the layers (shared/, domain/, features/): what every package there carries
// besides its tool configs. Each check has a name, which is how hygiene-debt.mjs lists a package
// that cannot pass it yet.
//
//   readme               a README.md
//   status-marker        a status marker in it, as docs/new-library.md describes
//   side-effects         "sideEffects": false
//   lint-script          a "lint" script running oxlint
//   format-check-script  a "format:check" script running oxfmt --check
//   tool-dependency      no oxlint or oxfmt dependency: the binaries resolve from the workspace root
//
// The scripts' paths are not checked: the layers spell them both "src" and "./src". The lint and
// fmt rules report a config flag on them.

import fs from "node:fs";
import path from "node:path";
import { HYGIENE_DEBT } from "./hygiene-debt.mjs";

const LAYERS = ["shared/", "domain/", "features/"];

const DEBT_FILE = "tools/nx-plugins/enforce-tool-config/rules/hygiene-debt.mjs";

export const CHECKS = [
  "readme",
  "status-marker",
  "side-effects",
  "lint-script",
  "format-check-script",
  "tool-dependency",
];

// The line of the callout that carries the status, e.g. `> **Status: STABLE.** Production-ready.`
const STATUS_MARKER = /^> \*\*Status: (STABLE|UNSTABLE|DEPRECATED)\b/m;

const TOOLS = ["oxlint", "oxfmt"];

const DEPENDENCY_FIELDS = ["dependencies", "devDependencies"];

const STATUS_DOC = "docs/new-library.md#readme-status-marker";

/**
 * @param {string | undefined} script
 * @param {(command: string) => boolean} predicate
 * @returns {boolean} whether one command of the script matches
 */
function runs(script, predicate) {
  return (script ?? "").split(/&&|\|\||;|\|/).some(command => predicate(command.trim()));
}

/** @param {string} tool */
function callsTool(tool) {
  const word = new RegExp(`(^|\\s)${tool}(\\s|$)`);
  return command => word.test(command);
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {Array<{ check: string, file: string, message: string }>}
 */
function findings(workspaceRoot, projectRoot) {
  const manifestFile = `${projectRoot}/package.json`;
  const readmeFile = `${projectRoot}/README.md`;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(workspaceRoot, manifestFile), "utf8"));
  } catch {
    return [];
  }

  /** @type {Array<{ check: string, file: string, message: string }>} */
  const found = [];

  let readme;
  try {
    readme = fs.readFileSync(path.join(workspaceRoot, readmeFile), "utf8");
  } catch {
    found.push({
      check: "readme",
      file: readmeFile,
      message:
        "missing: write one that says in a line or two what the package is, and its status " +
        `(${STATUS_DOC})`,
    });
  }
  if (readme !== undefined && !STATUS_MARKER.test(readme)) {
    found.push({
      check: "status-marker",
      file: readmeFile,
      message:
        "no status marker: under the title, add a callout with a line starting " +
        `"> **Status: STABLE**", "> **Status: UNSTABLE**" or "> **Status: DEPRECATED**" (${STATUS_DOC})`,
    });
  }

  if (manifest.sideEffects !== false) {
    const actual =
      manifest.sideEffects === undefined ? "not set" : `${JSON.stringify(manifest.sideEffects)}`;
    found.push({
      check: "side-effects",
      file: manifestFile,
      message:
        `"sideEffects" is ${actual}: set it to false, and turn code that runs on import into a ` +
        "function its consumers call",
    });
  }

  const scripts = manifest.scripts ?? {};
  if (!runs(scripts.lint, callsTool("oxlint"))) {
    found.push({
      check: "lint-script",
      file: manifestFile,
      message:
        scripts.lint === undefined
          ? 'no "lint" script: add "lint": "oxlint src"'
          : 'script "lint" does not run oxlint: make it "oxlint src"',
    });
  }
  const isFormatCheck = command =>
    callsTool("oxfmt")(command) && /(^|\s)--check(\s|$)/.test(command);
  if (!runs(scripts["format:check"], isFormatCheck)) {
    found.push({
      check: "format-check-script",
      file: manifestFile,
      message:
        scripts["format:check"] === undefined
          ? 'no "format:check" script: add "format:check": "oxfmt src --check", next to "format": "oxfmt src"'
          : 'script "format:check" does not run oxfmt --check: make it "oxfmt src --check"',
    });
  }

  for (const field of DEPENDENCY_FIELDS) {
    for (const tool of TOOLS) {
      if (manifest[field] && Object.hasOwn(manifest[field], tool)) {
        found.push({
          check: "tool-dependency",
          file: manifestFile,
          message: `${field} declares ${tool}: remove it, the binary resolves from the workspace root`,
        });
      }
    }
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

  const found = findings(workspaceRoot, projectRoot);
  const listed = debt[projectRoot]?.checks ?? [];

  return [
    ...found
      .filter(finding => !listed.includes(finding.check))
      .map(({ file, message }) => ({ file, message })),
    ...listed
      .filter(name => !found.some(finding => finding.check === name))
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
