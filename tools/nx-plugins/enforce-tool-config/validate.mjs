// Checks that a package's tool configs conform to the support/ convention, one rule per tool.
//
// Run for one package (the inferred `lint:tool-config` target passes its project root) or for all
// workspace packages at once (no argument), which is handy to audit the workspace.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPackageJsonPatterns,
  buildPackageJsonWorkspacesMatcher,
} from "nx/src/plugins/package-json/index.js";
import { EXCLUSIONS } from "./exclusions.mjs";
import { RULES } from "./rules/index.mjs";

// Build outputs and installs: they hold copied package.json files that are not packages.
const SKIP_DIRS = new Set([".git", ".nx", "node_modules", "dist", "lib", "lib-es", "build"]);

/**
 * Whether an exclusion exempts the project from the rule: an entry covers its directory and
 * everything below it, for the rules it names.
 *
 * @param {string} projectRoot posix-style, e.g. "libs/coin-modules/coin-evm"
 * @param {string} ruleName
 * @param {typeof EXCLUSIONS} exclusions
 * @returns {boolean}
 */
export function isExcluded(projectRoot, ruleName, exclusions = EXCLUSIONS) {
  return Object.entries(exclusions).some(
    ([dir, entry]) =>
      (projectRoot === dir || projectRoot.startsWith(`${dir}/`)) && entry.rules.includes(ruleName),
  );
}

/**
 * Runs every rule that is not excluded for the project.
 *
 * @param {string} workspaceRoot
 * @param {string} projectRoot
 * @param {import("./rules/index.mjs").Rule[]} rules
 * @param {typeof EXCLUSIONS} exclusions
 * @returns {Array<{ rule: string, file: string, message: string }>}
 */
export function checkProject(workspaceRoot, projectRoot, rules = RULES, exclusions = EXCLUSIONS) {
  return rules
    .filter(rule => !isExcluded(projectRoot, rule.name, exclusions))
    .flatMap(rule =>
      rule
        .check({ workspaceRoot, projectRoot })
        .map(violation => ({ rule: rule.name, ...violation })),
    );
}

/**
 * Matches the package.json files nx turns into projects: the package manager workspaces.
 *
 * @param {string} workspaceRoot
 * @returns {(packageJsonPath: string) => boolean} takes a posix path relative to the workspace root
 */
export function workspacesMatcher(workspaceRoot) {
  const readJson = file => JSON.parse(fs.readFileSync(path.join(workspaceRoot, file), "utf8"));
  return buildPackageJsonWorkspacesMatcher(buildPackageJsonPatterns(workspaceRoot, readJson));
}

/**
 * Every workspace package root except the workspace root itself, as posix-style relative paths.
 *
 * @param {string} workspaceRoot
 * @returns {string[]}
 */
export function findProjectRoots(workspaceRoot) {
  const isWorkspacePackage = workspacesMatcher(workspaceRoot);
  const roots = [];

  /** @param {string} dir posix-style, relative to the workspace root */
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(path.join(workspaceRoot, dir), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const relative = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(relative);
      } else if (entry.name === "package.json" && dir && isWorkspacePackage(relative)) {
        roots.push(dir);
      }
    }
  }

  walk("");
  return roots.sort();
}

/** Checks the packages given as arguments, or every workspace package; exits 1 on a violation. */
function main() {
  const workspaceRoot = process.cwd();
  const args = process.argv.slice(2);
  const projectRoots = args.length > 0 ? args : findProjectRoots(workspaceRoot);

  const violations = projectRoots.flatMap(root =>
    checkProject(workspaceRoot, root).map(violation => ({ root, ...violation })),
  );

  if (violations.length === 0) {
    console.log(`✓ tool config ok (${projectRoots.length} package(s), ${RULES.length} rule(s))`);
    return;
  }

  console.error(`\n✗ ${violations.length} tool config violation(s):\n`);
  for (const violation of violations) {
    console.error(`  [${violation.rule}] ${violation.file}: ${violation.message}`);
  }
  console.error("\nA package carries only what its tool cannot inherit from its support/ preset.");
  console.error("See support/README.md. A package that cannot conform yet belongs in");
  console.error("tools/nx-plugins/enforce-tool-config/exclusions.mjs, with an exit condition.\n");

  process.exit(1);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
