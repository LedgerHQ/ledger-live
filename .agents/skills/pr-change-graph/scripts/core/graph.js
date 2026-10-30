import { join } from "./text.js";

/**
 * @import { Branch, Change, Edge, ExternalNode, FileNode, Graph, GraphNode } from "./types.js"
 * @import { PackageInfo, PackageNode, Revision, Side, Status, Target } from "./types.js"
 */

export const CODE_FILE = /\.(?:[cm]?[jt]sx?)$/;
export const TEST_FILE = /(?:\.(?:test|spec)\.[cm]?[jt]sx?$)|(?:^|\/)__tests__\//;
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

/**
 * Nodes are the changed files, plus the files of their package they import, and their packages with the
 * packages or external packages these depend on. Imports out of their package are left out: packages are
 * linked by their dependencies. Each edge is added, removed or kept, from the commits that hold it.
 * @param {Branch} branch
 * @returns {Graph}
 */
export function buildGraph({ changes, revisions }) {
  /** @type {Map<string, FileNode>} */
  const files = new Map();
  /** @type {Map<string, PackageNode>} */
  const packages = new Map();
  /** @type {Map<string, ExternalNode>} */
  const externals = new Map();
  /** @type {Map<string, Omit<Edge, "status"> & Record<Side, boolean>>} */
  const edges = new Map();
  /** @type {Set<string>} */
  const unresolved = new Set();

  // The changed files and their packages first: a package found again as a dependency keeps their status.
  for (const change of changes.values()) {
    const revision = change.status === "deleted" ? revisions.base : revisions.head;
    const info = revision.packageOf(change.rel);
    // A package is added or deleted with its manifest.
    const manifest = changes.get(join(info.dir, "package.json"))?.status;
    const pkg = packageNode(
      info,
      manifest === "added" || manifest === "deleted" ? manifest : "modified",
    );
    files.set(change.rel, {
      kind: "file",
      key: change.rel,
      status: change.status,
      rel: change.rel,
      pkg,
    });
  }
  const changedPackages = [...packages.values()];

  for (const change of changes.values()) if (CODE_FILE.test(change.rel)) collectImports(change);
  for (const pkg of changedPackages) collectDependencies(pkg);

  return {
    nodes: [...files.values(), ...packages.values(), ...externals.values()],
    edges: [...edges.values()].map(({ base, head, ...edge }) => ({
      ...edge,
      status: base && head ? "kept" : head ? "added" : "removed",
    })),
    unresolved,
  };

  /** @param {Change} change */
  function collectImports(change) {
    const from = /** @type {FileNode} */ (files.get(change.rel));
    for (const side of sidesHolding(change)) {
      const revision = revisions[side];
      const pkg = packageNode(revision.packageOf(change.rel), "unchanged");
      for (const specifier of revision.importsOf(change.rel)) {
        const target = revision.resolve(change.rel, specifier);
        if (target.kind === "unresolved") {
          unresolved.add(`${change.rel} → ${specifier}`);
        } else if (
          target.kind === "file" &&
          target.rel !== change.rel &&
          revision.packageOf(target.rel).dir === pkg.dir
        ) {
          /** @type {FileNode} */
          const to = files.get(target.rel) ?? {
            kind: "file",
            key: target.rel,
            status: "unchanged",
            rel: target.rel,
            pkg,
          };
          files.set(target.rel, to);
          markEdge(from, to, side, false);
        } else if (target.kind !== "file" || target.rel !== change.rel) {
          // An import out of the package is no edge, but tells the dependencies the file uses.
          (from.packageImports ??= new Set()).add(importedPackageKey(revision, target, specifier));
        }
      }
    }
  }

  /**
   * Dependencies of a package holding a change, whether or not its manifest changed.
   * @param {PackageNode} pkg
   */
  function collectDependencies(pkg) {
    for (const side of /** @type {Side[]} */ (["base", "head"])) {
      const revision = revisions[side];
      const text = revision.read(join(pkg.dir, "package.json"));
      if (text === undefined) continue;
      const manifest = JSON.parse(text);
      for (const field of DEPENDENCY_FIELDS) {
        for (const name of Object.keys(manifest[field] ?? {})) {
          const dir = revision.workspace.get(name);
          const to =
            dir === undefined
              ? externalNode(name)
              : packageNode(revision.packageInfo(dir), "unchanged");
          markEdge(pkg, to, side, field === "devDependencies");
        }
      }
    }
  }

  /**
   * The package's node, made with the given status when it has none yet.
   * @param {PackageInfo} info
   * @param {Status} status
   */
  function packageNode({ dir, label }, status) {
    /** @type {PackageNode} */
    const node = packages.get(dir) ?? { kind: "package", key: `pkg:${dir}`, status, dir, label };
    packages.set(dir, node);
    return node;
  }

  /** @param {string} name */
  function externalNode(name) {
    /** @type {ExternalNode} */
    const node = externals.get(name) ?? { kind: "external", key: `ext:${name}`, name };
    externals.set(name, node);
    return node;
  }

  /**
   * @param {GraphNode} from
   * @param {GraphNode} to
   * @param {Side} side
   * @param {boolean} dev
   */
  function markEdge(from, to, side, dev) {
    const key = `${from.key}\0${to.key}`;
    const edge = edges.get(key) ?? { from, to, dev, base: false, head: false };
    edge[side] = true;
    // A package that is also a dependency, on either side, shows as one.
    edge.dev &&= dev;
    edges.set(key, edge);
  }
}

/**
 * The key of the package an import out of the file's package lands in: the workspace package holding the
 * file it resolves to, or the package its bare specifier names.
 * @param {Revision} revision
 * @param {Target} target
 * @param {string} specifier
 */
function importedPackageKey(revision, target, specifier) {
  if (target.kind === "file") return `pkg:${revision.packageOf(target.rel).dir}`;
  const parts = specifier.split("/");
  const name = parts.slice(0, specifier.startsWith("@") ? 2 : 1).join("/");
  const dir = revision.workspace.get(name);
  return dir === undefined ? `ext:${name}` : `pkg:${dir}`;
}

/**
 * The commits that hold the file.
 * @param {Change} change
 */
function sidesHolding(change) {
  return /** @type {Side[]} */ (
    { added: ["head"], deleted: ["base"], modified: ["base", "head"] }[change.status]
  );
}
