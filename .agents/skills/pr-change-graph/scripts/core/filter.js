import path from "node:path";
import { CODE_FILE, TEST_FILE } from "./graph.js";

/** @import { FileNode, Filter, Graph, GraphNode } from "./types.js" */

/**
 * The part of the graph the diagram draws: the changed files the filter shows, the imports and dependencies
 * the branch adds or removes between what it shows, the unchanged ones to changed files and between packages
 * with changed files, a dev dependency only when one of these files imports it, the files and packages these
 * link, and the packages of the files.
 * @param {Graph} graph
 * @param {Filter} filter
 * @returns {Graph}
 */
export function filterGraph(graph, filter) {
  /** @param {GraphNode} node */
  const shown = node => isShown(node, filter);
  const changed = graph.nodes.filter(
    /** @returns {node is FileNode} */
    node => node.kind === "file" && node.status !== "unchanged" && shown(node),
  );
  /** @type {Set<GraphNode>} */
  const boxes = new Set(changed.map(node => node.pkg));
  // `<package key>\0<imported package key>` for each package a changed file shown imports.
  const imported = new Set(
    changed.flatMap(node => [...(node.packageImports ?? [])].map(key => `${node.pkg.key}\0${key}`)),
  );
  const edges = graph.edges.filter(({ from, to, status, dev }) => {
    if (!shown(from) || !shown(to)) return false;
    // The workspace root's dependencies show with its files, and none with --code-only.
    if (from.kind === "package" && (filter.codeOnly || (!filter.root && from.dir === "")))
      return false;
    if (to.kind === "external" && !filter.externals) return false;
    // A kept import matters when it points at a changed file, a kept dependency between two boxes: a dev one
    // only when a changed file imports it, as most are tools, but a bundled app's are its code's dependencies.
    const used = !dev || imported.has(`${from.key}\0${to.key}`);
    const changedTarget =
      to.kind === "file" ? to.status !== "unchanged" : used && boxes.has(from) && boxes.has(to);
    return changedTarget || status !== "kept" || filter.context;
  });

  /** @type {Set<GraphNode>} */
  const nodes = new Set(changed);
  for (const edge of edges) {
    nodes.add(edge.from);
    nodes.add(edge.to);
  }
  // The packages of the files, drawn as their boxes, whether or not a dependency links them.
  for (const node of [...nodes]) if (node.kind === "file") nodes.add(node.pkg);
  return { nodes: [...nodes], edges, unresolved: graph.unresolved };
}

/**
 * Whether the diagram shows a file, given the flags that leave tests, root files, manifests or non-code out.
 * @param {GraphNode} node
 * @param {Filter} filter
 */
export function isShown(node, filter) {
  return (
    node.kind !== "file" ||
    ((filter.tests || !TEST_FILE.test(node.rel)) &&
      (filter.root || node.pkg.dir !== "") &&
      (filter.manifests || path.posix.basename(node.rel) !== "package.json") &&
      (!filter.codeOnly || CODE_FILE.test(node.rel)))
  );
}
