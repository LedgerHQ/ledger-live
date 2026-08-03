"use strict";

const { createProjectGraphAsync } = require("@nx/devkit");
const { DEP_CONSTRAINTS, BOUNDARY_EXCEPTIONS, BANNED_DEPENDENCIES } = require("./constraints");
const fs = require("node:fs");
const path = require("node:path");

/**
 * @typedef {{ data?: { root?: string, tags?: string[] } }} GraphNode
 * @typedef {{ target: string }} GraphEdge
 * @typedef {{ nodes: Record<string, GraphNode>, dependencies: Record<string, GraphEdge[]> }} ProjectGraphLike
 * @typedef {{ sourceName: string, sourceTags: string[], target: string, targetTags: string[] }} Violation
 * @typedef {{ file: string, specifier: string }} SourceViolation
 * @typedef {{ manifest: string, dependency: string, field: string, reason: string }} BannedDepViolation
 */

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const SKIP_DIRS = new Set(["node_modules", "dist", "lib", "build", ".turbo", ".cache"]);
const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/**
 * @param {string} dir
 * @param {(file: string) => void} callback
 */
function walkSourceFiles(dir, callback) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkSourceFiles(full, callback);
    } else if (SOURCE_EXTS.has(path.extname(entry.name))) {
      callback(full);
    }
  }
}

/**
 * Derive the set of legacy npm package names from the Nx project graph: every
 * node tagged `scope:libs` is a legacy package. Reading the node's package.json
 * gives the npm name used in import specifiers.
 *
 * This reuses the same tag signal as the declared-dep boundary check, so both
 * checks stay consistent with the project-tags plugin.
 *
 * @param {ProjectGraphLike} graph
 * @param {string} workspaceRoot
 * @returns {Set<string>}
 */
function collectLegacyPackageNames(graph, workspaceRoot) {
  const names = new Set();
  for (const node of Object.values(graph.nodes)) {
    const tags = node.data?.tags ?? [];
    if (!tags.includes("scope:libs")) continue;
    const root = node.data?.root;
    if (!root) continue;
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(workspaceRoot, root, "package.json"), "utf8"),
      );
      if (typeof pkg.name === "string" && pkg.name.startsWith("@ledgerhq/")) {
        names.add(pkg.name);
      }
    } catch {}
  }
  return names;
}

/**
 * Scan source files under shared/, domain/, features/ for any import of a legacy
 * in-repo @ledgerhq/* package (one that lives under libs/) or any relative import
 * that resolves into libs/.
 *
 * @param {string} workspaceRoot
 * @param {Set<string>} legacyPackages  set of in-repo @ledgerhq/* package names
 * @param {Array<{sourceRoot: string, targetRoot: string, allowedImport: string}>} exceptions
 * @returns {SourceViolation[]}
 */
function findSourceImportViolations(workspaceRoot, legacyPackages, exceptions = []) {
  const roots = ["shared", "domain", "features"].map(r => path.join(workspaceRoot, r));
  const libsRoot = path.join(workspaceRoot, "libs");
  const violations = [];

  for (const root of roots) {
    walkSourceFiles(root, file => {
      let content;
      try {
        content = fs.readFileSync(file, "utf8");
      } catch {
        return;
      }

      // Capture specifiers from: from "SPEC", require("SPEC"), import("SPEC")
      const re = /(?:from|require\s*\(|import\s*\()\s*['"]([^'"]+)['"]/g;
      let m;
      while ((m = re.exec(content)) !== null) {
        const spec = m[1];

        if (spec.startsWith("@ledgerhq/")) {
          // Strip sub-paths: "@ledgerhq/errors/types" → "@ledgerhq/errors"
          const pkg = spec.split("/").slice(0, 2).join("/");
          if (legacyPackages.has(pkg)) {
            const relFile = path.relative(workspaceRoot, file);
            const isExcepted = exceptions.some(
              e => relFile.startsWith(e.sourceRoot + path.sep) && e.allowedImport === pkg,
            );
            if (!isExcepted) {
              violations.push({ file: relFile, specifier: spec });
            }
          }
        } else if (spec.startsWith(".")) {
          const resolved = path.resolve(path.dirname(file), spec);
          if (resolved.startsWith(libsRoot + path.sep) || resolved === libsRoot) {
            violations.push({ file: path.relative(workspaceRoot, file), specifier: spec });
          }
        }
      }
    });
  }

  return violations;
}

/**
 * Check every workspace manifest for a dependency on a banned package.
 *
 * A banned package's own manifest is skipped: the package may still live in the repo (to
 * keep being published) while nothing in the workspace is allowed to depend on it.
 *
 * @param {ProjectGraphLike} graph
 * @param {string} workspaceRoot
 * @param {Array<{name: string, reason: string}>} bannedDependencies
 * @returns {BannedDepViolation[]}
 */
function findBannedDependencyViolations(graph, workspaceRoot, bannedDependencies = []) {
  if (bannedDependencies.length === 0) return [];
  const banned = new Map(bannedDependencies.map(b => [b.name, b.reason]));
  const violations = [];

  for (const node of Object.values(graph.nodes)) {
    const root = node.data?.root;
    if (!root) continue;
    const manifest = path.join(root, "package.json");
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(path.join(workspaceRoot, manifest), "utf8"));
    } catch {
      continue;
    }
    if (banned.has(pkg.name)) continue; // the banned package itself

    for (const field of DEPENDENCY_FIELDS) {
      for (const dependency of Object.keys(pkg[field] ?? {})) {
        const reason = banned.get(dependency);
        if (reason !== undefined) {
          violations.push({ manifest, dependency, field, reason });
        }
      }
    }
  }

  return violations;
}

/**
 * Walk the Nx project graph and collect every edge that violates the
 * DEP_CONSTRAINTS rules. A given edge can match multiple constraints
 * (e.g. a `type:domain-api` source also has `scope:domain`); the
 * function reports each offending edge once and accumulates the failing
 * source tags. Exported for unit testing against a synthetic graph.
 *
 * @param {ProjectGraphLike} graph
 * @param {Array<{sourceRoot: string, targetRoot: string, allowedImport: string}>} exceptions
 * @returns {Violation[]}
 */
function findViolations(graph, exceptions = []) {
  const byEdge = new Map();

  for (const [sourceName, edges] of Object.entries(graph.dependencies)) {
    const sourceNode = graph.nodes[sourceName];
    if (!sourceNode) continue;
    const sourceTags = sourceNode.data?.tags ?? [];

    for (const edge of edges) {
      const targetNode = graph.nodes[edge.target];
      if (!targetNode) continue; // external / npm targets carry no tags; skip
      const targetTags = targetNode.data?.tags ?? [];

      const sourceRoot = sourceNode.data?.root;
      const targetRoot = targetNode.data?.root;
      const isExcepted =
        sourceRoot !== undefined &&
        targetRoot !== undefined &&
        exceptions.some(e => e.sourceRoot === sourceRoot && e.targetRoot === targetRoot);
      if (isExcepted) continue;

      for (const { sourceTag, onlyDependOnLibsWithTags } of DEP_CONSTRAINTS) {
        if (!sourceTags.includes(sourceTag)) continue;
        const allowed = targetTags.some(t => onlyDependOnLibsWithTags.includes(t));
        if (allowed) continue;

        const key = `${sourceName}
${edge.target}`;
        let v = byEdge.get(key);
        if (!v) {
          v = { sourceName, target: edge.target, targetTags, sourceTags: [] };
          byEdge.set(key, v);
        }
        v.sourceTags.push(sourceTag);
      }
    }
  }

  return [...byEdge.values()];
}

async function main() {
  let hasError = false;

  const graph = await createProjectGraphAsync({ exitOnError: true });
  const graphViolations = findViolations(graph, BOUNDARY_EXCEPTIONS);

  if (graphViolations.length > 0) {
    hasError = true;
    console.error(`\n✗ ${graphViolations.length} module-boundary violation(s):\n`);
    for (const v of graphViolations) {
      const tgtTags = v.targetTags.length > 0 ? v.targetTags.join(", ") : "untagged";
      console.error(`  ${v.sourceName} [${v.sourceTags.join(", ")}] → ${v.target} [${tgtTags}]`);
    }
    console.error(
      "\nAllowed edges are defined in tools/nx-plugins/enforce-boundaries/constraints.js\n",
    );
  }

  const workspaceRoot = process.cwd();
  const legacyPackages = collectLegacyPackageNames(graph, workspaceRoot);
  const sourceViolations = findSourceImportViolations(
    workspaceRoot,
    legacyPackages,
    BOUNDARY_EXCEPTIONS,
  );

  if (sourceViolations.length > 0) {
    hasError = true;
    console.error(`\n✗ ${sourceViolations.length} legacy source-import violation(s):\n`);
    for (const v of sourceViolations) {
      console.error(`  ${v.file}  →  ${v.specifier}`);
    }
    console.error(
      "\n@ledgerhq/* workspace-package imports are forbidden in shared/, domain/, features/ source files.\n",
    );
  }

  const bannedDepViolations = findBannedDependencyViolations(
    graph,
    workspaceRoot,
    BANNED_DEPENDENCIES,
  );

  if (bannedDepViolations.length > 0) {
    hasError = true;
    console.error(`\n✗ ${bannedDepViolations.length} banned-dependency violation(s):\n`);
    for (const v of bannedDepViolations) {
      console.error(`  ${v.manifest}  →  ${v.dependency}  (${v.field})`);
    }
    const reasons = new Map(bannedDepViolations.map(v => [v.dependency, v.reason]));
    for (const [dependency, reason] of reasons) {
      console.error(`\n${dependency} is banned: ${reason}`);
    }
    console.error(
      "\nBanned packages are listed in tools/nx-plugins/enforce-boundaries/constraints.js\n",
    );
  }

  if (hasError) process.exit(1);
  console.log("✓ module boundaries ok");
}

module.exports = {
  findViolations,
  findSourceImportViolations,
  collectLegacyPackageNames,
  findBannedDependencyViolations,
};

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
