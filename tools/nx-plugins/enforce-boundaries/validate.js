"use strict";

const { createProjectGraphAsync } = require("@nx/devkit");
const { DEP_CONSTRAINTS } = require("./constraints");

/**
 * @typedef {{ data?: { tags?: string[] } }} GraphNode
 * @typedef {{ target: string }} GraphEdge
 * @typedef {{ nodes: Record<string, GraphNode>, dependencies: Record<string, GraphEdge[]> }} ProjectGraphLike
 * @typedef {{ sourceName: string, sourceTag: string, target: string, targetTags: string[] }} Violation
 */

/**
 * Walk the Nx project graph and collect every edge that violates the
 * DEP_CONSTRAINTS rules. Exported for unit testing against a synthetic graph.
 *
 * @param {ProjectGraphLike} graph
 * @returns {Violation[]}
 */
function findViolations(graph) {
  const violations = [];

  for (const [sourceName, edges] of Object.entries(graph.dependencies)) {
    const sourceNode = graph.nodes[sourceName];
    if (!sourceNode) continue;
    const sourceTags = sourceNode.data?.tags ?? [];

    for (const edge of edges) {
      const targetNode = graph.nodes[edge.target];
      if (!targetNode) continue; // external / npm targets carry no tags; skip
      const targetTags = targetNode.data?.tags ?? [];

      for (const { sourceTag, onlyDependOnLibsWithTags } of DEP_CONSTRAINTS) {
        if (!sourceTags.includes(sourceTag)) continue;
        const allowed = targetTags.some(t => onlyDependOnLibsWithTags.includes(t));
        if (!allowed) {
          violations.push({ sourceName, sourceTag, target: edge.target, targetTags });
        }
      }
    }
  }

  return violations;
}

async function main() {
  const graph = await createProjectGraphAsync({ exitOnError: true });
  const violations = findViolations(graph);

  if (violations.length > 0) {
    console.error(`\n✗ ${violations.length} module-boundary violation(s):\n`);
    for (const v of violations) {
      const tgtTags = v.targetTags.length > 0 ? v.targetTags.join(", ") : "untagged";
      console.error(`  ${v.sourceName} [${v.sourceTag}] → ${v.target} [${tgtTags}]`);
    }
    console.error(
      "\nAllowed edges are defined in tools/nx-plugins/enforce-boundaries/constraints.js\n",
    );
    process.exit(1);
  }

  console.log("✓ module boundaries ok");
}

module.exports = { findViolations };

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
