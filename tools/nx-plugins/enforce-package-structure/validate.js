"use strict";

// Checks that every `index.*` in a new-architecture package is a pure barrel where
// BARREL_LOCATION (rules.js) allows one, that every module
// those barrels reach through `export *`, or that `package.json#exports` names, re-exports like
// one, and that the public components of a dual-platform package keep one API, one neutral props
// contract and one kind of entry (components.js). The barrel rule follows a file's role, not its
// name.
//
// Run for one package (the inferred `lint:structure` target passes its project root) or for all
// of them at once (no argument), which is handy to audit the workspace.

const fs = require("node:fs");
const path = require("node:path");
const {
  BARREL_LOCATION,
  checkBarrel,
  checkBarrelLocation,
  checkReachedModule,
  isBarrelFile,
  starReexportTargets,
} = require("./rules");
const { barrelReach, moduleGraph, resolveModule } = require("./barrel-graph");
const { checkComponents, isIgnoredEntry } = require("./components");
const { COMPONENT_EXCEPTIONS, FILE_EXCEPTIONS, PACKAGE_EXCEPTIONS } = require("./exceptions");
const { INTERMEDIATE_BARREL_WAIVERS } = require("./intermediate-barrels");

/** @typedef {import("./rules").ChainBreaker} ChainBreaker */

const EXCEPTIONS_FILE = "tools/nx-plugins/enforce-package-structure/exceptions.js";

const LAYER_ROOTS = ["domain", "shared", "features"];
const SKIP_DIRS = new Set(["node_modules", "dist", "lib", "lib-es", "build", ".turbo", ".cache"]);
const SOURCE_FILE = /\.[cm]?[jt]sx?$/;

/**
 * @param {string} dir
 * @param {(file: string) => void} callback
 */
function walk(dir, callback) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, callback);
    } else {
      callback(full);
    }
  }
}

/**
 * Every package root under the new-architecture layers, as posix-style relative paths.
 *
 * @param {string} workspaceRoot
 * @returns {string[]}
 */
function findPackageRoots(workspaceRoot) {
  const roots = [];
  for (const layer of LAYER_ROOTS) {
    walk(path.join(workspaceRoot, layer), file => {
      if (path.basename(file) !== "package.json") return;
      const dir = path.dirname(path.relative(workspaceRoot, file));
      roots.push(dir.split(path.sep).join("/"));
    });
  }
  return roots.sort();
}

/**
 * Drop the waived component violations, and report each waiver that no longer matches one.
 *
 * @param {string} projectRoot
 * @param {ReturnType<typeof checkComponents>} violations
 * @param {Record<string, { rules: string[] }>} waivers
 */
function applyComponentWaivers(projectRoot, violations, waivers) {
  const used = new Set();
  const kept = violations.filter(violation => {
    if (!waivers[violation.subject]?.rules.includes(violation.rule)) return true;
    used.add(`${violation.subject}#${violation.rule}`);
    return false;
  });
  for (const [subject, waiver] of Object.entries(waivers)) {
    for (const rule of waiver.rules) {
      if (used.has(`${subject}#${rule}`)) continue;
      kept.push({
        rule,
        subject,
        file: EXCEPTIONS_FILE,
        line: 1,
        code: "stale-waiver",
        message: `\`${subject}\` in ${projectRoot} no longer breaks ${rule}: delete its waiver`,
        text: "",
      });
    }
  }
  return kept;
}

/**
 * Every relative source file a `package.json#exports` target names, under any condition and at
 * any depth. Wildcard targets are skipped: they name a pattern, not a file.
 *
 * @param {unknown} target
 * @returns {string[]}
 */
function targetFilesOf(target) {
  if (typeof target === "string") {
    return target.startsWith("./") && SOURCE_FILE.test(target) && !target.includes("*")
      ? [target]
      : [];
  }
  if (target && typeof target === "object") {
    return Object.values(target).flatMap(targetFilesOf);
  }
  return [];
}

/**
 * Every source file named in `package.json#exports`. Test support entries are left out as
 * components.js does, unless asked for: they are still entries, so their barrels are not
 * intermediate.
 *
 * @param {unknown} exportsField
 * @param {boolean} [withTestSupport]
 * @returns {string[]}
 */
function entryPointsOf(exportsField, withTestSupport = false) {
  if (!exportsField || typeof exportsField !== "object") return targetFilesOf(exportsField);
  // An object of conditions alone is the target of the root entry.
  if (!Object.keys(exportsField).some(key => key.startsWith("."))) {
    return targetFilesOf(exportsField);
  }
  return Object.entries(exportsField).flatMap(([subpath, target]) =>
    !withTestSupport && isIgnoredEntry(subpath) ? [] : targetFilesOf(target),
  );
}

/**
 * @param {string} workspaceRoot
 * @param {string} projectRoot posix-style, e.g. "domain/entity/contact"
 * @param {Record<string, Record<string, { rules: string[] }>>} [componentExceptions]
 * @param {Record<string, string>} [fileExceptions] the exception audit passes `{}` to see what
 *   each entry hides
 * @param {Record<string, string>} [intermediateBarrelWaivers] likewise for its own audit
 * @returns {Array<{ file: string, line: number, code: string, message: string, text: string, rule?: string, breaker?: ChainBreaker }>}
 */
function checkPackage(
  workspaceRoot,
  projectRoot,
  componentExceptions = COMPONENT_EXCEPTIONS,
  fileExceptions = FILE_EXCEPTIONS,
  intermediateBarrelWaivers = INTERMEDIATE_BARREL_WAIVERS,
) {
  const found = applyComponentWaivers(
    projectRoot,
    checkComponents(workspaceRoot, projectRoot),
    componentExceptions[projectRoot] ?? {},
  );

  const options = PACKAGE_EXCEPTIONS[projectRoot] ?? {};
  const packageDir = path.join(workspaceRoot, projectRoot);
  const visited = new Set();
  const graph = moduleGraph();

  /**
   * @param {string} file absolute path
   * @returns {string} posix-style path from the repo root
   */
  function toRelative(file) {
    return path.relative(workspaceRoot, file).split(path.sep).join("/");
  }

  // Each file is checked once, so an `export *` cycle terminates.
  function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const source = graph.sourceOf(file);
    if (source === undefined) return;
    const relative = toRelative(file);
    if (!Object.hasOwn(fileExceptions, relative)) {
      const violations = isBarrelFile(relative)
        ? checkBarrel(source, options)
        : checkReachedModule(source, options, relative);
      for (const violation of violations) {
        found.push({ file: relative, ...violation });
      }
    }
    for (const specifier of starReexportTargets(source, relative)) {
      for (const target of resolveModule(file, specifier)) visit(target);
    }
  }

  // `skip` exempts the package from the barrel rule, traversal included.
  if (!options.skip) {
    const barrels = [];
    walk(path.join(packageDir, "src"), file => {
      if (!isBarrelFile(path.basename(file))) return;
      barrels.push(file);
      visit(file);
    });

    let manifest = {};
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
    } catch {
      // No manifest, no entry points: the barrels above are all there is to check.
    }
    for (const entry of entryPointsOf(manifest.exports)) {
      visit(path.join(packageDir, entry));
    }

    const sourceRoot = path.join(packageDir, "src");
    const reach = barrelReach(
      [
        ...barrels.filter(barrel => path.dirname(barrel) === sourceRoot),
        ...entryPointsOf(manifest.exports, true).map(entry => path.join(packageDir, entry)),
      ],
      graph,
    );
    for (const barrel of barrels) {
      const relative = toRelative(barrel);
      if (Object.hasOwn(intermediateBarrelWaivers, relative)) continue;
      const { depth, breaker } = reach.get(barrel) ?? {};
      const at = breaker && { ...breaker, file: toRelative(breaker.file) };
      for (const violation of checkBarrelLocation(projectRoot, relative, depth, at)) {
        found.push({ file: relative, ...violation });
      }
    }
  }

  return found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

/**
 * Problems with a list of files allowed to keep their violations: an entry must name an existing
 * file, hide at least one violation, and state its exit condition, so the list only ever shrinks.
 *
 * @param {string} workspaceRoot
 * @param {Record<string, string>} list
 * @param {(projectRoot: string) => Array<{ file: string }>} violationsWithout what each package
 *   reports with the list emptied
 * @returns {string[]}
 */
function auditList(workspaceRoot, list, violationsWithout) {
  const problems = [];
  const reported = new Map();
  for (const [file, reason] of Object.entries(list)) {
    if (!/exit condition/i.test(reason)) {
      problems.push(`${file}: the reason states no exit condition`);
    }
    if (!fs.existsSync(path.join(workspaceRoot, file))) {
      problems.push(`${file}: no such file`);
      continue;
    }
    const projectRoot = file.slice(0, file.indexOf("/src/"));
    if (!reported.has(projectRoot)) {
      reported.set(projectRoot, new Set(violationsWithout(projectRoot).map(v => v.file)));
    }
    if (!reported.get(projectRoot).has(file)) {
      problems.push(`${file}: no violation left to except, delete the entry`);
    }
  }
  return problems;
}

/**
 * Problems with the file exception list itself, see auditList.
 *
 * @param {string} workspaceRoot
 * @param {Record<string, string>} fileExceptions
 * @returns {string[]}
 */
function auditFileExceptions(workspaceRoot, fileExceptions) {
  return auditList(workspaceRoot, fileExceptions, projectRoot =>
    checkPackage(workspaceRoot, projectRoot, COMPONENT_EXCEPTIONS, {}).filter(
      v => !Object.hasOwn(BARREL_LOCATION, v.code),
    ),
  );
}

/**
 * Problems with the intermediate barrel waiver list itself, see auditList.
 *
 * @param {string} workspaceRoot
 * @param {Record<string, string>} waivers
 * @returns {string[]}
 */
function auditIntermediateBarrelWaivers(workspaceRoot, waivers) {
  return auditList(workspaceRoot, waivers, projectRoot =>
    checkPackage(workspaceRoot, projectRoot, COMPONENT_EXCEPTIONS, FILE_EXCEPTIONS, {}).filter(v =>
      Object.hasOwn(BARREL_LOCATION, v.code),
    ),
  );
}

function main() {
  const workspaceRoot = process.cwd();
  const args = process.argv.slice(2);
  const projectRoots = args.length > 0 ? args : findPackageRoots(workspaceRoot);

  const violations = projectRoots.flatMap(root => checkPackage(workspaceRoot, root));

  if (violations.length === 0) {
    console.log(`✓ package structure ok (${projectRoots.length} package(s))`);
    return;
  }

  const files = new Set(violations.map(v => v.file));
  console.error(`\n✗ ${violations.length} violation(s) in ${files.size} file(s):\n`);

  let current = "";
  for (const violation of violations) {
    if (violation.file !== current) {
      current = violation.file;
      console.error(`  ${current}`);
    }
    const rule = violation.rule ? `${violation.rule} ` : "";
    console.error(`    ${violation.line}: ${rule}${violation.message}`);
    if (violation.text) console.error(`       ${violation.text}`);
  }

  if (violations.some(v => !v.rule && !Object.hasOwn(BARREL_LOCATION, v.code))) {
    console.error(
      '\nAn `index.*` may only contain `export * from "./x"` and an optional default re-export.',
    );
    console.error(
      "A module reached by `export *` or named in package.json#exports re-exports the same way.",
    );
    console.error("Move anything private to an internals location: internals/, internals.ts,");
    console.error("or a <name>.internals.ts companion. See .agents/skills/package-public-api.");
  }
  for (const [code, { rule, fix }] of Object.entries(BARREL_LOCATION)) {
    if (!violations.some(v => v.code === code)) continue;
    console.error(`\n${code}: ${rule}.`);
    console.error(`Fix: ${fix}. See .agents/skills/package-public-api.`);
  }
  if (violations.some(v => v.rule)) {
    console.error("\nR1: a universal component is exported on both platforms under the same name.");
    console.error(
      "R2: both implementations take one props type, declared in one unsuffixed module.",
    );
    console.error(
      "R3: that contract has no platform import, type, className, style or gesture name.",
    );
    console.error(
      "R4: a platform module that declares a universal component exports nothing else.",
    );
    console.error("R5: a component is exported from universal entries or from platform entries,");
    console.error("never both, and a platform entry points at a suffixed module of its own.");
    console.error("See docs/adr/universal-components.md.");
  }
  console.error("");

  process.exit(1);
}

module.exports = {
  auditFileExceptions,
  auditIntermediateBarrelWaivers,
  checkPackage,
  findPackageRoots,
};

if (require.main === module) {
  main();
}
