"use strict";

// Checks that every `index.*` in a new-architecture package is a pure barrel, and that the public
// components of a dual-platform package keep one API and one kind of entry (components.js).
//
// Run for one package (the inferred `lint:structure` target passes its project root) or for all
// of them at once (no argument), which is handy to audit the workspace.

const fs = require("node:fs");
const path = require("node:path");
const { checkBarrel, isBarrelFile } = require("./rules");
const { checkComponents } = require("./components");
const { COMPONENT_EXCEPTIONS, PACKAGE_EXCEPTIONS } = require("./exceptions");

const EXCEPTIONS_FILE = "tools/nx-plugins/enforce-package-structure/exceptions.js";

const LAYER_ROOTS = ["domain", "shared", "features"];
const SKIP_DIRS = new Set(["node_modules", "dist", "lib", "lib-es", "build", ".turbo", ".cache"]);

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
 * @param {string} workspaceRoot
 * @param {string} projectRoot posix-style, e.g. "domain/entity/contact"
 * @param {Record<string, Record<string, { rules: string[] }>>} [componentExceptions]
 * @returns {Array<{ file: string, line: number, code: string, message: string, text: string, rule?: string }>}
 */
function checkPackage(workspaceRoot, projectRoot, componentExceptions = COMPONENT_EXCEPTIONS) {
  const found = applyComponentWaivers(
    projectRoot,
    checkComponents(workspaceRoot, projectRoot),
    componentExceptions[projectRoot] ?? {},
  );

  const options = PACKAGE_EXCEPTIONS[projectRoot] ?? {};
  const srcDir = path.join(workspaceRoot, projectRoot, "src");

  walk(options.skip ? "" : srcDir, file => {
    const relative = path.relative(workspaceRoot, file).split(path.sep).join("/");
    if (!isBarrelFile(relative)) return;
    let source;
    try {
      source = fs.readFileSync(file, "utf8");
    } catch {
      return;
    }
    for (const violation of checkBarrel(source, options)) {
      found.push({ file: relative, ...violation });
    }
  });

  return found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
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

  if (violations.some(v => !v.rule)) {
    console.error(
      '\nAn `index.*` may only contain `export * from "./x"` and an optional default re-export.',
    );
    console.error("Move anything private to an internals location: internals/, internals.ts,");
    console.error("or a <name>.internals.ts companion. See .agents/skills/package-public-api.");
  }
  if (violations.some(v => v.rule)) {
    console.error("\nR1: a universal component is exported on both platforms under the same name.");
    console.error("R5: a component is exported from universal entries or from platform entries,");
    console.error("never both, and a platform entry points at a suffixed module of its own.");
    console.error("See docs/adr/universal-components.md.");
  }
  console.error("");

  process.exit(1);
}

module.exports = { checkPackage, findPackageRoots };

if (require.main === module) {
  main();
}
