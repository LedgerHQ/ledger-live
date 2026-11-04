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
  DEVTOOLS_TYPE_ONLY_RULE,
  DEVTOOLS_LAZY_IMPORTS,
  DEVTOOLS_LAZY_RULE,
  DEVTOOLS_HOST_APPS,
  DEVTOOLS_HOST_APP_RULE,
  DEVTOOLS_HOST_FOLDER_RULE,
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
 * @typedef {"DEVTOOLS_TYPE_ONLY_RULE" | "DEVTOOLS_LAZY_RULE"} DevtoolsRule
 * @typedef {{ source: string, target: string, file?: string, line?: number, specifier?: string, rule?: DevtoolsRule }} DevtoolsImportViolation
 * @typedef {"DEVTOOLS_HOST_APP_RULE" | "DEVTOOLS_HOST_FOLDER_RULE"} DevtoolsHostRule
 * @typedef {{ file: string, line: number, specifier: string, rule: DevtoolsHostRule }} DevtoolsHostViolation
 */

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

const SKIP_DIRS = new Set(["node_modules", "dist", "lib", "build", ".turbo", ".cache"]);
const SOURCE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/** Workspace root of the `@devtools/*` packages the devtools import check reads. */
const DEVTOOLS_ROOT = "devtools";

/**
 * @param {string} dir
 * @param {(file: string) => void} callback
 */
function walkSourceFiles(dir, callback) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
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
 * Manifest of a project root, or `undefined` when it has none. An unreadable or malformed
 * manifest throws: skipping it would hide its dependencies from every check.
 *
 * @param {string} workspaceRoot
 * @param {string} root
 * @returns {{ manifest: string, pkg: Record<string, any> } | undefined}
 */
function readManifest(workspaceRoot, root) {
  const manifest = path.join(root, "package.json");
  let content;
  try {
    content = fs.readFileSync(path.join(workspaceRoot, manifest), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
  try {
    return { manifest, pkg: JSON.parse(content) };
  } catch (error) {
    throw new Error(`${manifest}: ${error.message}`, { cause: error });
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

const sourceFiles = {
  /**
   * Parse a source file, without type information.
   *
   * @param {string} file
   * @param {string} [content] the file's content, read from disk when omitted
   * @returns {import("typescript").SourceFile}
   */
  parse(file, content = fs.readFileSync(file, "utf8")) {
    return ts.createSourceFile(file, content, ts.ScriptTarget.Latest, false);
  },
};

/**
 * How a source file loads a module: `"type"` for the forms the build erases (`import type`,
 * `export type … from`, `typeof import("…")`), `"dynamic"` for `import()`, `"static"` for the rest.
 *
 * @typedef {"type" | "dynamic" | "static"} ReferenceKind
 * @typedef {{ specifier: string, kind: ReferenceKind, line: number }} ModuleReference
 */

/**
 * Every module a source file references, with how it loads it and the 1-based line.
 *
 * @param {import("typescript").SourceFile} source
 * @returns {ModuleReference[]}
 */
function moduleReferences(source) {
  /** @type {ModuleReference[]} */
  const references = [];
  /** @param {import("typescript").Node} node */
  const visit = node => {
    let spec;
    /** @type {ReferenceKind} */
    let kind = "static";
    if (ts.isImportDeclaration(node)) {
      spec = node.moduleSpecifier;
      if (node.importClause?.isTypeOnly) kind = "type";
    } else if (ts.isExportDeclaration(node)) {
      spec = node.moduleSpecifier;
      if (node.isTypeOnly) kind = "type";
    } else if (ts.isImportEqualsDeclaration(node)) {
      if (ts.isExternalModuleReference(node.moduleReference)) {
        spec = node.moduleReference.expression;
      }
      if (node.isTypeOnly) kind = "type";
    } else if (ts.isImportTypeNode(node)) {
      if (ts.isLiteralTypeNode(node.argument)) spec = node.argument.literal;
      kind = "type";
    } else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        spec = node.arguments[0];
        kind = "dynamic";
      } else if (ts.isIdentifier(node.expression) && node.expression.text === "require") {
        spec = node.arguments[0];
      }
    }
    if (spec && ts.isStringLiteralLike(spec)) {
      const { line } = source.getLineAndCharacterOfPosition(spec.getStart(source));
      references.push({ specifier: spec.text, kind, line: line + 1 });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return references;
}

/**
 * Whether `spec`, imported from `file`, names `pkg` or a relative path into `pkgRoot`.
 *
 * @param {string} file
 * @param {string} spec
 * @param {string} pkg
 * @param {string} pkgRoot absolute root of `pkg`
 */
function specifierLoads(file, spec, pkg, pkgRoot) {
  if (!spec.startsWith(".")) return packageNameOf(spec) === pkg;
  const resolved = path.resolve(path.dirname(file), spec);
  return resolved === pkgRoot || resolved.startsWith(pkgRoot + path.sep);
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
    const name = readManifest(workspaceRoot, root)?.pkg.name;
    if (typeof name === "string" && name.startsWith("@ledgerhq/")) {
      names.add(name);
    }
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
      const content = fs.readFileSync(file, "utf8");

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
    const read = readManifest(workspaceRoot, root);
    if (!read) continue;
    const { manifest, pkg } = read;
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

      const read = readManifest(workspaceRoot, root);
      if (read) {
        for (const field of DEPENDENCY_FIELDS) {
          for (const dependency of Object.keys(read.pkg[field] ?? {})) {
            if (banned.has(dependency)) {
              violations.push({ file: read.manifest, specifier: dependency, field, sourceTag });
            }
          }
        }
      }

      walkSourceFiles(path.join(workspaceRoot, root), file => {
        const content = fs.readFileSync(file, "utf8");
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
 * `@devtools/*` package name of every graph node under `devtools/`, keyed by node name.
 * Manifests elsewhere are not read.
 *
 * @param {ProjectGraphLike} graph
 * @param {string} workspaceRoot
 * @returns {Map<string, string>}
 */
function devtoolsPackageNames(graph, workspaceRoot) {
  const names = new Map();
  for (const [nodeName, node] of Object.entries(graph.nodes)) {
    const root = node.data?.root;
    if (!root?.startsWith(`${DEVTOOLS_ROOT}/`)) continue;
    const name = readManifest(workspaceRoot, root)?.pkg.name;
    if (name?.startsWith("@devtools/")) names.set(nodeName, name);
  }
  return names;
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
 * target at runtime. An allowed edge the lazy table lists passes when no source file loads the
 * target statically. Each import that breaks either rule is reported with its file and line.
 *
 * @param {ProjectGraphLike} graph
 * @param {string} workspaceRoot
 * @param {Record<string, string[] | "*">} allowedImports
 * @param {Record<string, string[] | "*">} [typeOnlyImports]
 * @param {Record<string, string[] | "*">} [lazyImports]
 * @returns {DevtoolsImportViolation[]}
 */
function findDevtoolsImportViolations(
  graph,
  workspaceRoot,
  allowedImports,
  typeOnlyImports = {},
  lazyImports = {},
) {
  const names = devtoolsPackageNames(graph, workspaceRoot);
  const byEdge = new Map();
  /** @type {Map<string, Array<{ file: string, references: ModuleReference[] }>>} */
  const filesByNode = new Map();
  /** @param {string} nodeName */
  const referencesOf = nodeName => {
    let files = filesByNode.get(nodeName);
    if (!files) {
      files = [];
      walkSourceFiles(path.join(workspaceRoot, graph.nodes[nodeName].data.root), file => {
        files.push({ file, references: moduleReferences(sourceFiles.parse(file)) });
      });
      filesByNode.set(nodeName, files);
    }
    return files;
  };
  /**
   * @param {string} sourceNode
   * @param {string} source
   * @param {string} target
   * @param {string} targetNode
   * @param {(kind: ReferenceKind) => boolean} breaks
   * @param {DevtoolsRule} rule
   */
  const reportReferences = (sourceNode, source, target, targetNode, breaks, rule) => {
    const targetRoot = path.join(workspaceRoot, graph.nodes[targetNode].data.root);
    for (const { file, references } of referencesOf(sourceNode)) {
      for (const { specifier, kind, line } of references) {
        if (!breaks(kind) || !specifierLoads(file, specifier, target, targetRoot)) continue;
        const rel = path.relative(workspaceRoot, file);
        byEdge.set(`${source}\n${target}\n${rel}:${line}\n${specifier}`, {
          source,
          target,
          file: rel,
          line,
          specifier,
          rule,
        });
      }
    }
  };

  for (const [sourceNode, edges] of Object.entries(graph.dependencies)) {
    const source = names.get(sourceNode);
    if (!source) continue;

    for (const edge of edges) {
      const target = names.get(edge.target);
      if (!target) continue;

      if (allows(allowedImports[source], target)) {
        if (allows(lazyImports[source], target)) {
          reportReferences(
            sourceNode,
            source,
            target,
            edge.target,
            kind => kind === "static",
            "DEVTOOLS_LAZY_RULE",
          );
        }
        continue;
      }
      if (!allows(typeOnlyImports[source], target)) {
        byEdge.set(`${source}\n${target}`, { source, target });
        continue;
      }
      reportReferences(
        sourceNode,
        source,
        target,
        edge.target,
        kind => kind !== "type",
        "DEVTOOLS_TYPE_ONLY_RULE",
      );
    }
  }

  return [...byEdge.values()];
}

const TEST_FILE = /(^|\/)(__tests__|__integrations__)\/|\.test\.[^/]+$/;

/**
 * Module resolution settings of an app's own `tsconfig.json`: its `compilerOptions.paths` prefix
 * aliases, longest first (only `prefix*` patterns, mapped to their first target), and its
 * `moduleSuffixes`.
 *
 * @param {string} appRoot absolute
 * @returns {{ aliases: Array<{ prefix: string, target: string }>, suffixes: string[] }}
 */
function readModuleResolution(appRoot) {
  const tsconfig = path.join(appRoot, "tsconfig.json");
  const { config, error } = ts.readConfigFile(tsconfig, ts.sys.readFile);
  if (error) {
    throw new Error(`${tsconfig}: ${ts.flattenDiagnosticMessageText(error.messageText, "\n")}`);
  }
  const options = config.compilerOptions ?? {};
  const base = path.resolve(appRoot, options.baseUrl ?? ".");
  const aliases = Object.entries(options.paths ?? {})
    .filter(([pattern, targets]) => pattern.endsWith("*") && targets[0]?.endsWith("*"))
    .map(([pattern, targets]) => ({
      prefix: pattern.slice(0, -1),
      target: path.resolve(base, targets[0].slice(0, -1)),
    }))
    .sort((a, b) => b.prefix.length - a.prefix.length);
  return { aliases, suffixes: options.moduleSuffixes ?? [""] };
}

/**
 * @param {string} p
 */
function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * The source file a resolved specifier loads, in TypeScript's order: the path itself when it has a
 * source extension, then `<p><suffix><ext>`, then `<p>/index<suffix><ext>`. `undefined` when none
 * exists.
 *
 * @param {string} p absolute, as `resolveSpecifier` returns it
 * @param {string[]} suffixes the app's `moduleSuffixes`
 * @returns {string | undefined}
 */
function resolveSourceFile(p, suffixes) {
  if (SOURCE_EXTS.has(path.extname(p)) && isFile(p)) return p;
  for (const base of [p, path.join(p, "index")]) {
    for (const suffix of suffixes) {
      for (const ext of SOURCE_EXTS) {
        if (isFile(base + suffix + ext)) return base + suffix + ext;
      }
    }
  }
  return undefined;
}

/**
 * Absolute path a specifier names, before extension resolution: a relative path, or a bare
 * specifier through the longest matching alias. `undefined` for a package import.
 *
 * @param {string} file absolute importer
 * @param {string} spec
 * @param {Array<{ prefix: string, target: string }>} aliases
 * @returns {string | undefined}
 */
function resolveSpecifier(file, spec, aliases) {
  if (spec.startsWith(".")) return path.resolve(path.dirname(file), spec);
  const alias = aliases.find(a => spec.startsWith(a.prefix));
  return alias && path.join(alias.target, spec.slice(alias.prefix.length));
}

/**
 * A path without its source extension, so `x/index.tsx`, `x/index` and `x` compare alike.
 *
 * @param {string} p
 */
function moduleKey(p) {
  const stripped = SOURCE_EXTS.has(path.extname(p)) ? p.slice(0, -path.extname(p).length) : p;
  return path.basename(stripped) === "index" ? path.dirname(stripped) : stripped;
}

/**
 * Check the source files of each host app under `DEVTOOLS_HOST_APP_RULE` and
 * `DEVTOOLS_HOST_FOLDER_RULE`. Files under the app's `allowedUnder` folder are not checked.
 *
 * @param {string} workspaceRoot
 * @param {Array<{ root: string, allowedUnder: string, entries: string[] }>} hostApps
 * @returns {DevtoolsHostViolation[]}
 */
function findDevtoolsHostViolations(workspaceRoot, hostApps) {
  const devtoolsRoot = path.join(workspaceRoot, DEVTOOLS_ROOT);
  /** @type {DevtoolsHostViolation[]} */
  const violations = [];

  for (const app of hostApps) {
    const appRoot = path.join(workspaceRoot, app.root);
    const { aliases, suffixes } = readModuleResolution(appRoot);
    const folder = path.resolve(appRoot, app.allowedUnder);
    const entryFiles = new Set(app.entries.map(e => path.resolve(appRoot, e)));
    const entryKeys = new Set([...entryFiles].map(moduleKey));
    /**
     * An entry is matched on the file the specifier loads, so `DevToolsWindow.tsx` never passes
     * for `DevToolsWindow/index.tsx`. Only a path with no file on disk falls back to its key.
     *
     * @param {string} resolved
     */
    const isEntry = resolved => {
      const loaded = resolveSourceFile(resolved, suffixes);
      return loaded ? entryFiles.has(loaded) : entryKeys.has(moduleKey(resolved));
    };
    /**
     * @param {string | undefined} p
     * @param {string} dir
     * @returns {p is string}
     */
    const isUnder = (p, dir) => p !== undefined && (p === dir || p.startsWith(dir + path.sep));

    walkSourceFiles(appRoot, file => {
      if (isUnder(file, folder)) return;
      const rel = path.relative(workspaceRoot, file);
      const isTest = TEST_FILE.test(path.relative(appRoot, file).split(path.sep).join("/"));

      for (const { specifier, kind, line } of moduleReferences(sourceFiles.parse(file))) {
        const resolved = resolveSpecifier(file, specifier, aliases);
        if (specifier.startsWith("@devtools/") || isUnder(resolved, devtoolsRoot)) {
          violations.push({ file: rel, line, specifier, rule: "DEVTOOLS_HOST_APP_RULE" });
        } else if (
          !isTest &&
          kind !== "dynamic" &&
          isUnder(resolved, folder) &&
          !isEntry(resolved)
        ) {
          violations.push({ file: rel, line, specifier, rule: "DEVTOOLS_HOST_FOLDER_RULE" });
        }
      }
    });
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

      for (const {
        sourceTag,
        onlyDependOnLibsWithTags,
        notDependOnLibsWithTags,
      } of DEP_CONSTRAINTS) {
        if (!sourceTags.includes(sourceTag)) continue;
        const missesAllowedTag =
          onlyDependOnLibsWithTags !== undefined &&
          !targetTags.some(t => onlyDependOnLibsWithTags.includes(t));
        const hasForbiddenTag =
          notDependOnLibsWithTags !== undefined &&
          targetTags.some(t => notDependOnLibsWithTags.includes(t));
        if (!missesAllowedTag && !hasForbiddenTag) continue;

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

/** @param {DevtoolsImportViolation} v */
function formatDevtoolsImportViolation(v) {
  const where = v.file ? `  (${v.file}:${v.line} imports "${v.specifier}", breaks ${v.rule})` : "";
  return `${v.source}  →  ${v.target}${where}`;
}

/** @param {DevtoolsHostViolation} v */
function formatDevtoolsHostViolation(v) {
  return `${v.file}:${v.line}  →  ${v.specifier}  (breaks ${v.rule})`;
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
        DEVTOOLS_LAZY_IMPORTS,
      ),
      formatDevtoolsImportViolation,
      "Allowed @devtools/* imports (DEVTOOLS_ALLOWED_IMPORTS, DEVTOOLS_TYPE_ONLY_IMPORTS, DEVTOOLS_LAZY_IMPORTS)",
      [
        `DEVTOOLS_TYPE_ONLY_RULE: ${DEVTOOLS_TYPE_ONLY_RULE}`,
        `DEVTOOLS_LAZY_RULE: ${DEVTOOLS_LAZY_RULE}`,
      ],
    ),
    reportViolations(
      "devtools host-app",
      findDevtoolsHostViolations(workspaceRoot, DEVTOOLS_HOST_APPS),
      formatDevtoolsHostViolation,
      "Host apps, their DevTools folder and its entries (DEVTOOLS_HOST_APPS)",
      [
        `DEVTOOLS_HOST_APP_RULE: ${DEVTOOLS_HOST_APP_RULE}`,
        `DEVTOOLS_HOST_FOLDER_RULE: ${DEVTOOLS_HOST_FOLDER_RULE}`,
      ],
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
  findDevtoolsHostViolations,
  formatDevtoolsImportViolation,
  formatDevtoolsHostViolation,
  sourceFiles,
  SKIP_DIRS,
  SOURCE_EXTS,
  DEVTOOLS_ROOT,
};

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
