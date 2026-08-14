"use strict";

// Checks that every `index.*` in a new-architecture package is a pure barrel.
//
// Run for one package (the inferred `lint:structure` target passes its project root) or for all
// of them at once (no argument), which is handy to audit the workspace.

const fs = require("node:fs");
const path = require("node:path");
const { checkBarrel, isBarrelFile } = require("./rules");
const { PACKAGE_EXCEPTIONS } = require("./exceptions");

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
 * @param {string} workspaceRoot
 * @param {string} projectRoot posix-style, e.g. "domain/entity/contact"
 * @returns {Array<{ file: string, line: number, code: string, message: string, text: string }>}
 */
function checkPackage(workspaceRoot, projectRoot) {
  const options = PACKAGE_EXCEPTIONS[projectRoot] ?? {};
  if (options.skip) return [];

  const srcDir = path.join(workspaceRoot, projectRoot, "src");
  const found = [];

  walk(srcDir, file => {
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
  console.error(`\n✗ ${violations.length} barrel violation(s) in ${files.size} file(s):\n`);

  let current = "";
  for (const violation of violations) {
    if (violation.file !== current) {
      current = violation.file;
      console.error(`  ${current}`);
    }
    console.error(`    ${violation.line}: ${violation.message}`);
    if (violation.text) console.error(`       ${violation.text}`);
  }

  console.error(
    '\nAn `index.*` may only contain `export * from "./x"` and an optional default re-export.',
  );
  console.error("Move anything private to an internals location: internals/, internals.ts,");
  console.error("or a <name>.internals.ts companion. See .agents/skills/package-public-api.\n");

  process.exit(1);
}

module.exports = { checkPackage, findPackageRoots };

if (require.main === module) {
  main();
}
