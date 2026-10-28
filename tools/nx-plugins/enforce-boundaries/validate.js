"use strict";

const { createProjectGraphAsync } = require("@nx/devkit");
const {
  DEP_CONSTRAINTS,
  BOUNDARY_EXCEPTIONS,
  LEGACY_SOURCE_ROOTS,
  LEGACY_IMPORT_RULE,
  LEGACY_PACKAGES,
  BANNED_EXTERNALS_BY_TAG,
  BANNED_DEPENDENCIES,
  DEVTOOLS_ALLOWED_IMPORTS,
  DEVTOOLS_TYPE_ONLY_IMPORTS,
} = require("./constraints");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

/**
 * @typedef {{ data?: { root?: string, tags?: string[] } }} GraphNode
 * @typedef {{ target: string }} GraphEdge
 * @typedef {{ nodes: Record<string, GraphNode>, dependencies: Record<string, GraphEdge[]> }} ProjectGraphLike
 * @typedef {{ sourceName: string, sourceTags: string[], target: string, targetTags: string[] }} Violation
 * @typedef {{ file: string, specifier: string }} SourceViolation
 * @typedef {{ manifest: string, dependency: string, field: string, reason: string }} BannedDepViolation
 * @typedef {{ file: string, specifier: string, field?: string, sourceTag: string }} BannedExternalViolation
 * @typedef {{ source: string, target: string, file?: string }} DevtoolsImportViolation
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
 * Specifiers of the imports, re-exports, `require()` and `import()` calls of a source file.
 * The TypeScript scanner skips comments and string contents.
 *
 * @param {string} content
 * @returns {string[]}
 */
function importSpecifiers(content) {
  return ts.preProcessFile(content, true, true).importedFiles.map(f => f.fileName);
}

/**
 * Specifiers of a source file that load `pkg` at runtime: every import of it but `import type`,
 * `export type … from` and `import("…")` type queries, which the build erases.
 *
 * @param {string} file
 * @param {string} content
 * @param {string} pkg
 * @returns {string[]}
 */
function valueImportsOf(file, content, pkg) {
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, false);
  const specifiers = [];
  /** @param {import("typescript").Node} node */
  const visit = node => {
    let spec;
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) {
      spec = node.moduleSpecifier;
    } else if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
      spec = node.moduleSpecifier;
    } else if (ts.isImportEqualsDeclaration(node) && !node.isTypeOnly) {
      spec = ts.isExternalModuleReference(node.moduleReference)
        ? node.moduleReference.expression
        : undefined;
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      spec = node.arguments[0];
    }
    if (spec && ts.isStringLiteralLike(spec) && packageNameOf(spec.text) === pkg) {
      specifiers.push(spec.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return specifiers;
}

/**
 * Package name of a bare specifier: "@ledgerhq/logs/types" → "@ledgerhq/logs", "react/jsx-runtime" → "react".
 *
 * @param {string} spec
 * @returns {string}
 */
function packageNameOf(spec) {
  return spec
    .split("/")
    .slice(0, spec.startsWith("@") ? 2 : 1)
    .join("/");
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
 * Scan source files under `LEGACY_SOURCE_ROOTS` for violations of `LEGACY_IMPORT_RULE`.
 *
 * @param {string} workspaceRoot
 * @param {Set<string>} legacyPackages  set of legacy @ledgerhq/* package names
 * @param {Array<{sourceRoot: string, targetRoot?: string, allowedImport: string}>} exceptions
 * @returns {SourceViolation[]}
 */
function findSourceImportViolations(workspaceRoot, legacyPackages, exceptions = []) {
  const roots = LEGACY_SOURCE_ROOTS.map(r => path.join(workspaceRoot, r));
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

      for (const spec of importSpecifiers(content)) {
        if (spec.startsWith("@ledgerhq/")) {
          const pkg = packageNameOf(spec);
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
 * Check every project carrying a rule's source tag for a third-party package it may not use:
 * declared in any dependency field of its manifest, or imported by a source file under its root.
 *
 * @param {ProjectGraphLike} graph
 * @param {string} workspaceRoot
 * @param {Array<{sourceTag: string, packages: string[]}>} rules
 * @returns {BannedExternalViolation[]}
 */
function findBannedExternalViolations(graph, workspaceRoot, rules = []) {
  const violations = [];

  for (const node of Object.values(graph.nodes)) {
    const root = node.data?.root;
    if (!root) continue;
    const tags = node.data?.tags ?? [];

    for (const { sourceTag, packages } of rules) {
      if (!tags.includes(sourceTag)) continue;
      const banned = new Set(packages);

      const manifest = path.join(root, "package.json");
      let pkg = {};
      try {
        pkg = JSON.parse(fs.readFileSync(path.join(workspaceRoot, manifest), "utf8"));
      } catch {}
      for (const field of DEPENDENCY_FIELDS) {
        for (const dependency of Object.keys(pkg[field] ?? {})) {
          if (banned.has(dependency)) {
            violations.push({ file: manifest, specifier: dependency, field, sourceTag });
          }
        }
      }

      walkSourceFiles(path.join(workspaceRoot, root), file => {
        let content;
        try {
          content = fs.readFileSync(file, "utf8");
        } catch {
          return;
        }
        for (const spec of importSpecifiers(content)) {
          if (banned.has(packageNameOf(spec))) {
            violations.push({
              file: path.relative(workspaceRoot, file),
              specifier: spec,
              sourceTag,
            });
          }
        }
      });
    }
  }

  return violations;
}

/**
 * Manifest of every graph node that has one, keyed by node name.
 *
 * @param {ProjectGraphLike} graph
 * @param {string} workspaceRoot
 * @returns {Map<string, { manifest: string, pkg: Record<string, any> }>}
 */
function readManifests(graph, workspaceRoot) {
  const manifests = new Map();
  for (const [nodeName, node] of Object.entries(graph.nodes)) {
    const root = node.data?.root;
    if (!root) continue;
    const manifest = path.join(root, "package.json");
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(workspaceRoot, manifest), "utf8"));
      manifests.set(nodeName, { manifest, pkg });
    } catch {}
  }
  return manifests;
}

/**
 * @param {string[] | "*" | undefined} allowed
 * @param {string} target
 */
function allows(allowed, target) {
  return allowed === "*" || (allowed?.includes(target) ?? false);
}

/**
 * Collect every `@devtools/*` → `@devtools/*` graph edge the allowed-imports table does not list.
 * An edge the type-only table lists passes when no source file under the package root loads the
 * target at runtime; each file that does is reported.
 *
 * @param {ProjectGraphLike} graph
 * @param {string} workspaceRoot
 * @param {Record<string, string[] | "*">} allowedImports
 * @param {Record<string, string[] | "*">} typeOnlyImports
 * @returns {DevtoolsImportViolation[]}
 */
function findDevtoolsImportViolations(graph, workspaceRoot, allowedImports, typeOnlyImports = {}) {
  const manifests = readManifests(graph, workspaceRoot);
  const byEdge = new Map();

  for (const [sourceNode, edges] of Object.entries(graph.dependencies)) {
    const source = manifests.get(sourceNode)?.pkg.name;
    if (!source?.startsWith("@devtools/")) continue;

    for (const edge of edges) {
      const target = manifests.get(edge.target)?.pkg.name;
      if (!target?.startsWith("@devtools/")) continue;
      if (allows(allowedImports[source], target)) continue;

      if (!allows(typeOnlyImports[source], target)) {
        byEdge.set(`${source}\n${target}`, { source, target });
        continue;
      }
      walkSourceFiles(path.join(workspaceRoot, graph.nodes[sourceNode].data.root), file => {
        const content = fs.readFileSync(file, "utf8");
        if (valueImportsOf(file, content, target).length === 0) return;
        const rel = path.relative(workspaceRoot, file);
        byEdge.set(`${source}\n${target}\n${rel}`, { source, target, file: rel });
      });
    }
  }

  return [...byEdge.values()];
}

/**
 * Walk the Nx project graph and collect every edge that violates the
 * DEP_CONSTRAINTS rules. A given edge can match multiple constraints
 * (e.g. a `type:domain-api` source also has `scope:domain`); the
 * function reports each offending edge once and accumulates the failing
 * source tags. Exported for unit testing against a synthetic graph.
 *
 * @param {ProjectGraphLike} graph
 * @param {Array<{sourceRoot: string, targetRoot?: string, allowedImport: string}>} exceptions
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

const CONSTRAINTS_FILE = "tools/nx-plugins/enforce-boundaries/constraints.js";

/**
 * Print a check's violations, one per line, then its notes and where its rules are listed.
 *
 * @template V
 * @param {string} label  the kind of violation, e.g. "module-boundary"
 * @param {V[]} violations
 * @param {(violation: V) => string} format
 * @param {string} rules  what constraints.js lists for the check, e.g. "Allowed edges"
 * @param {string[]} [notes]
 * @returns {boolean} whether the check found violations
 */
function reportViolations(label, violations, format, rules, notes = []) {
  if (violations.length === 0) return false;
  console.error(`\n✗ ${violations.length} ${label} violation(s):\n`);
  for (const v of violations) console.error(`  ${format(v)}`);
  for (const note of notes) console.error(`\n${note}`);
  console.error(`\n${rules} are listed in ${CONSTRAINTS_FILE}\n`);
  return true;
}

async function main() {
  const graph = await createProjectGraphAsync({ exitOnError: true });
  const workspaceRoot = process.cwd();
  const legacyPackages = new Set([
    ...collectLegacyPackageNames(graph, workspaceRoot),
    ...LEGACY_PACKAGES,
  ]);
  const bannedDepViolations = findBannedDependencyViolations(
    graph,
    workspaceRoot,
    BANNED_DEPENDENCIES,
  );

  const failed = [
    reportViolations(
      "module-boundary",
      findViolations(graph, BOUNDARY_EXCEPTIONS),
      v => {
        const tgtTags = v.targetTags.length > 0 ? v.targetTags.join(", ") : "untagged";
        return `${v.sourceName} [${v.sourceTags.join(", ")}] → ${v.target} [${tgtTags}]`;
      },
      "Allowed edges",
    ),
    reportViolations(
      "legacy source-import",
      findSourceImportViolations(workspaceRoot, legacyPackages, BOUNDARY_EXCEPTIONS),
      v => `${v.file}  →  ${v.specifier}`,
      "Legacy source roots and packages",
      [LEGACY_IMPORT_RULE],
    ),
    reportViolations(
      "banned-external",
      findBannedExternalViolations(graph, workspaceRoot, BANNED_EXTERNALS_BY_TAG),
      v => `${v.file}  →  ${v.specifier}${v.field ? ` (${v.field})` : ""}  [${v.sourceTag}]`,
      "Packages banned per source tag",
    ),
    reportViolations(
      "banned-dependency",
      bannedDepViolations,
      v => `${v.manifest}  →  ${v.dependency}  (${v.field})`,
      "Banned packages",
      [...new Map(bannedDepViolations.map(v => [v.dependency, v.reason]))].map(
        ([dependency, reason]) => `${dependency} is banned: ${reason}`,
      ),
    ),
    reportViolations(
      "devtools import",
      findDevtoolsImportViolations(
        graph,
        workspaceRoot,
        DEVTOOLS_ALLOWED_IMPORTS,
        DEVTOOLS_TYPE_ONLY_IMPORTS,
      ),
      v => {
        const where = v.file
          ? `  (value import in ${v.file}; only \`import type\` is allowed)`
          : "";
        return `${v.source}  →  ${v.target}${where}`;
      },
      "Allowed @devtools/* imports (DEVTOOLS_ALLOWED_IMPORTS, DEVTOOLS_TYPE_ONLY_IMPORTS)",
    ),
  ].includes(true);

  if (failed) process.exit(1);
  console.log("✓ module boundaries ok");
}

module.exports = {
  findViolations,
  findSourceImportViolations,
  collectLegacyPackageNames,
  findBannedDependencyViolations,
  findBannedExternalViolations,
  findDevtoolsImportViolations,
};

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
