// Private libraries under libs/ have no build: their exports point at src, and apps, tests and
// tooling read them from source. Published packages (not `private: true`) keep their build. This
// rule keeps that split from drifting back. CHECKS describes each check under its name, which is
// how source-only-debt.mjs lists a package that cannot pass it yet.
//
// published-deps reads the privacy of a dependency from its own manifest, which is not a cache
// input of this package: a dependency turning private is reported once this package's manifest
// or the rule changes.

import fs from "node:fs";
import path from "node:path";
import { SOURCE_ONLY_DEBT } from "./source-only-debt.mjs";

const DEBT_FILE = "tools/nx-plugins/enforce-tool-config/rules/source-only-debt.mjs";

const SOURCE_CONDITION = "@ledgerhq/source";

export const CHECKS = {
  "no-build": 'a private package under libs/ has no "build" script or "build" target',
  "exports-to-src": "a private package under libs/ points its entry points at src",
  "published-deps": "a published package has no private workspace package in its dependencies",
  "no-source-condition": `no Jest, rspack or Re.Pack config sets the ${SOURCE_CONDITION} condition`,
};

// A path into a build output, e.g. "./lib/index.js", "lib-es/index.d.ts" or "./lib/*".
const BUILD_OUTPUT = /^(?:\.\/)?lib(?:-es)?\//;

const ENTRY_FIELDS = ["main", "module", "types", "typings", "typesVersions", "sideEffects"];

// The configs that resolve export conditions: Jest (jest.config.*, jest.<variant>.config.*),
// rspack and Re.Pack (rspack.config.*, repack.config.*, and split configs such as the desktop
// app's tools/rspack/rspack.<target>.mts).
const BUNDLER_CONFIG = /^(?:jest(?:\.[\w-]+)?\.config|(?:rspack|repack)(?:\.[\w-]+)?)\.[cm]?[jt]s$/;

// Where those configs live, relative to the project root.
const CONFIG_DIRS = ["", "tools/rspack"];

// `customExportConditions: [..., "@ledgerhq/source", ...]` or `conditionNames: [...]`.
const SOURCE_CONDITION_OPTION = new RegExp(
  `\\b(customExportConditions|conditionNames)\\s*:\\s*\\[[^\\]]*["'\`]${SOURCE_CONDITION}["'\`]`,
);

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
 * @param {string} file absolute
 * @returns {any} the parsed JSON, or undefined when the file is missing or invalid
 */
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

/**
 * Every string leaf of a JSON value with its path, e.g. `exports["."].import`.
 *
 * @param {unknown} value
 * @param {string} at
 * @returns {Array<{ at: string, value: string }>}
 */
function stringLeaves(value, at) {
  if (typeof value === "string") return [{ at, value }];
  if (Array.isArray(value))
    return value.flatMap((item, index) => stringLeaves(item, `${at}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      stringLeaves(item, `${at}[${JSON.stringify(key)}]`),
    );
  }
  return [];
}

/**
 * @param {unknown} value
 * @param {string} at
 * @returns {Array<{ at: string, kind: "array" | "condition" }>}
 */
function exportsShapes(value, at) {
  if (Array.isArray(value)) return [{ at, kind: "array" }];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => [
    ...(key === SOURCE_CONDITION ? [{ at, kind: /** @type {const} */ ("condition") }] : []),
    ...exportsShapes(item, `${at}[${JSON.stringify(key)}]`),
  ]);
}

/**
 * @param {any} manifest
 * @param {string} manifestFile
 * @param {any} projectJson
 * @param {string} projectJsonFile
 * @returns {Finding[]}
 */
function buildFindings(manifest, manifestFile, projectJson, projectJsonFile) {
  const fix = "the package is read from src, so delete it";
  return [
    ...(manifest.scripts?.build === undefined
      ? []
      : [finding("no-build", manifestFile, 'it has a "build" script', fix)]),
    ...(manifest.nx?.targets?.build === undefined
      ? []
      : [finding("no-build", manifestFile, 'it has a "build" target under "nx"', fix)]),
    ...(projectJson?.targets?.build === undefined
      ? []
      : [finding("no-build", projectJsonFile, 'it has a "build" target', fix)]),
  ];
}

/**
 * @param {any} manifest
 * @param {string} manifestFile
 * @returns {Finding[]}
 */
function exportsFindings(manifest, manifestFile) {
  return [
    ...stringLeaves(manifest.exports, "exports")
      .filter(({ value }) => BUILD_OUTPUT.test(value))
      .map(({ at, value }) =>
        finding("exports-to-src", manifestFile, `${at} is "${value}"`, "point it at src"),
      ),
    ...exportsShapes(manifest.exports, "exports").map(({ at, kind }) =>
      kind === "array"
        ? finding("exports-to-src", manifestFile, `${at} is an array`, "make it a single target")
        : finding(
            "exports-to-src",
            manifestFile,
            `${at} has a "${SOURCE_CONDITION}" condition`,
            "point the entry itself at src and drop the condition",
          ),
    ),
    ...ENTRY_FIELDS.flatMap(field =>
      stringLeaves(manifest[field], field)
        .filter(({ value }) => BUILD_OUTPUT.test(value))
        .map(({ at, value }) =>
          finding("exports-to-src", manifestFile, `${at} is "${value}"`, "point it at src"),
        ),
    ),
  ];
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @param {any} manifest
 * @param {string} manifestFile
 * @returns {Finding[]}
 */
function publishedDepsFindings(workspaceRoot, projectRoot, manifest, manifestFile) {
  return Object.entries(manifest.dependencies ?? {})
    .filter(([, version]) => typeof version === "string" && version.startsWith("workspace:"))
    .filter(
      ([name]) =>
        readJson(path.join(workspaceRoot, projectRoot, "node_modules", name, "package.json"))
          ?.private === true,
    )
    .map(([name]) =>
      finding(
        "published-deps",
        manifestFile,
        `dependencies has "${name}", which is private and has no build`,
        "move it to devDependencies, or publish it",
      ),
    );
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {Finding[]}
 */
function sourceConditionFindings(workspaceRoot, projectRoot) {
  return CONFIG_DIRS.flatMap(dir => {
    const directory = dir ? `${projectRoot}/${dir}` : projectRoot;
    try {
      return fs
        .readdirSync(path.join(workspaceRoot, directory))
        .filter(name => BUNDLER_CONFIG.test(name))
        .sort()
        .map(name => `${directory}/${name}`);
    } catch {
      return [];
    }
  }).flatMap(file => {
    const option = fs
      .readFileSync(path.join(workspaceRoot, file), "utf8")
      .match(SOURCE_CONDITION_OPTION)?.[1];
    return option
      ? [
          finding(
            "no-source-condition",
            file,
            `${option} lists it`,
            "drop it; private libraries already export src, published ones are read built",
          ),
        ]
      : [];
  });
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @returns {Finding[]}
 */
function findings(workspaceRoot, projectRoot) {
  const manifestFile = `${projectRoot}/package.json`;
  const manifest = readJson(path.join(workspaceRoot, manifestFile));
  const found = sourceConditionFindings(workspaceRoot, projectRoot);
  if (!manifest) return found;

  if (manifest.private !== true) {
    return [...publishedDepsFindings(workspaceRoot, projectRoot, manifest, manifestFile), ...found];
  }
  if (!projectRoot.startsWith("libs/")) return found;

  const projectJsonFile = `${projectRoot}/project.json`;
  return [
    ...buildFindings(
      manifest,
      manifestFile,
      readJson(path.join(workspaceRoot, projectJsonFile)),
      projectJsonFile,
    ),
    ...exportsFindings(manifest, manifestFile),
    ...found,
  ];
}

/**
 * @param {import("./index.mjs").RuleContext} context
 * @param {{ debt?: typeof SOURCE_ONLY_DEBT }} [overrides] for tests
 * @returns {import("./index.mjs").Violation[]}
 */
export function check({ workspaceRoot, projectRoot }, { debt = SOURCE_ONLY_DEBT } = {}) {
  const found = findings(workspaceRoot, projectRoot);
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
  name: "source-only",
  inputs: [
    "{projectRoot}/package.json",
    "{projectRoot}/project.json",
    "{projectRoot}/jest*.config.*",
    "{projectRoot}/rspack.*",
    "{projectRoot}/repack.*",
    "{projectRoot}/tools/rspack/rspack.*",
    "{projectRoot}/tools/rspack/repack.*",
  ],
  check: context => check(context),
};
