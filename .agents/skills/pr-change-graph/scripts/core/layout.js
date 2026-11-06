import { compare } from "./text.js";

/**
 * @import { Box, Direction, ExternalNode, FileNode, Graph } from "./types.js"
 * @import { GraphNode, LaidOutGraph, PackageNode } from "./types.js"
 */

// Most items on one level that a top to bottom layout takes; a wider level goes left to right instead.
const MAX_LEVEL_WIDTH = 5;

/**
 * The graph with its files in package boxes. The graph, with each box as one item, and each box go top to
 * bottom, or left to right when a level is too wide.
 * @param {Graph} graph
 * @param {Direction} [direction] The graph's and every box's, instead of the ones their levels give
 * @returns {LaidOutGraph}
 */
export function layoutGraph(graph, direction) {
  const { nodes, edges } = graph;
  /** @type {Map<PackageNode, FileNode[]>} */
  const groups = new Map();
  /** @type {(PackageNode | ExternalNode)[]} */
  const loose = [];
  for (const node of nodes.toSorted((a, b) => compare(a.key, b.key))) {
    if (node.kind === "external") loose.push(node);
    else if (node.kind === "file") {
      const files = groups.get(node.pkg) ?? [];
      files.push(node);
      groups.set(node.pkg, files);
    }
  }
  for (const node of nodes) if (node.kind === "package" && !groups.has(node)) loose.push(node);

  // The graph's levels count a package box as one item, under the package's key; a box's count its files.
  /** @param {GraphNode} node */
  const boxOf = node => (node.kind === "file" ? node.pkg.key : node.key);
  /** @type {[from: string, to: string][]} */
  const fileEdges = [];
  /** @type {[from: string, to: string][]} */
  const boxEdges = [];
  for (const { from, to } of edges) {
    fileEdges.push([from.key, to.key]);
    if (boxOf(from) !== boxOf(to)) boxEdges.push([boxOf(from), boxOf(to)]);
  }
  /** @type {Map<PackageNode, Box>} */
  const boxes = new Map();
  for (const [pkg, files] of groups) {
    boxes.set(pkg, {
      direction:
        direction ??
        directionOf(
          files.map(node => node.key),
          fileEdges,
        ),
      files,
    });
  }
  const graphItems = [...groups.keys(), ...loose].map(node => node.key);
  return { ...graph, direction: direction ?? directionOf(graphItems, boxEdges), boxes };
}

/**
 * Level of each item: 1 when no edge points at it, else one below the deepest item pointing at it. Edges
 * closing a cycle, found depth first from the items no edge points at, are left out and counted.
 * @param {string[]} items
 * @param {[from: string, to: string][]} edges The edges between other items are left out.
 */
export function assignLevels(items, edges) {
  /** @type {Map<string, string[]>} */
  const targets = new Map(items.map(item => [item, []]));
  for (const [from, to] of edges) if (targets.has(to)) targets.get(from)?.push(to);
  const { kept, ignored } = dropCycles(items, targets);

  // Longest path from the items no edge points at, in topological order.
  const pending = new Map(items.map(item => [item, 0]));
  for (const to of [...kept.values()].flat()) pending.set(to, (pending.get(to) ?? 0) + 1);
  const queue = items.filter(item => pending.get(item) === 0);
  const levels = new Map(queue.map(item => [item, 1]));
  for (const item of queue) {
    for (const to of kept.get(item) ?? []) {
      levels.set(to, Math.max(levels.get(to) ?? 0, (levels.get(item) ?? 0) + 1));
      pending.set(to, (pending.get(to) ?? 0) - 1);
      if (pending.get(to) === 0) queue.push(to);
    }
  }
  return { levels, ignored };
}

/**
 * Number of items on the most crowded level.
 * @param {string[]} items
 * @param {[from: string, to: string][]} edges
 */
export function widestLevel(items, edges) {
  /** @type {Map<number, number>} */
  const counts = new Map();
  for (const level of assignLevels(items, edges).levels.values())
    counts.set(level, (counts.get(level) ?? 0) + 1);
  return Math.max(0, ...counts.values());
}

/**
 * @param {string[]} items
 * @param {[from: string, to: string][]} edges
 * @returns {Direction}
 */
function directionOf(items, edges) {
  return widestLevel(items, edges) <= MAX_LEVEL_WIDTH ? "TB" : "LR";
}

/**
 * The edges without those closing a cycle, walking depth first from the items no edge points at, then
 * from the items left, which only cycles reach.
 * @param {string[]} items
 * @param {Map<string, string[]>} targets
 */
function dropCycles(items, targets) {
  const pointedAt = new Set([...targets.values()].flat());
  /** @type {Map<string, string[]>} */
  const kept = new Map(items.map(item => [item, []]));
  /** @type {Map<string, "open" | "done">} */
  const state = new Map();
  let ignored = 0;
  for (const start of [...items.filter(item => !pointedAt.has(item)), ...items]) {
    if (!state.has(start)) visit(start);
  }
  return { kept, ignored };

  /** @param {string} item */
  function visit(item) {
    state.set(item, "open");
    for (const to of targets.get(item) ?? []) {
      if (state.get(to) === "open") {
        ignored++;
      } else {
        kept.get(item)?.push(to);
        if (!state.has(to)) visit(to);
      }
    }
    state.set(item, "done");
  }
}
