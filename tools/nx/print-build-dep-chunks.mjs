#!/usr/bin/env node
/**
 * Reads a graph dumped by `nx graph --focus=<project> --file=<path>` and prints
 * the focus project's transitive build dependencies, topologically sorted
 * (leaves first), split into up to chunkCount comma-separated chunks (one per line).
 * The focus project itself is excluded.
 *
 * Used by CI to warm the nx cache across a few separate nx processes on
 * Windows, where restoring all of live-common's deps in one process exhausts
 * file descriptors and crashes with EMFILE. Root cause: @nx/s3-cache's
 * createPack() reads every cached output file concurrently via
 * node:fs/promises.readFile with no concurrency cap (see @nx/s3-cache source).
 * Splitting into smaller nx invocations bounds the per-task
 * fd burst for tasks with very large cached outputs (e.g., live-common).
 * This is a workaround until upstream adds a concurrency limit.
 */
import fs from "node:fs";
import process from "node:process";

const [graphPath, focusProject, chunkCountArg = "2"] = process.argv.slice(2);

if (!graphPath || !focusProject) {
  console.error(
    "Usage: print-build-dep-chunks.mjs <graph.json> <focusProject> [chunkCount]",
  );
  process.exit(1);
}

const chunkCount = Number.parseInt(chunkCountArg, 10);
if (!Number.isFinite(chunkCount) || chunkCount < 1) {
  console.error(`Invalid chunk count: ${chunkCountArg}`);
  process.exit(1);
}

const { graph } = JSON.parse(fs.readFileSync(graphPath, "utf8"));
const { nodes, dependencies } = graph;

if (!nodes[focusProject]) {
  console.error(`Focus project ${focusProject} not found in graph`);
  process.exit(1);
}

const visited = new Set();
const order = [];

function visit(name) {
  if (visited.has(name) || !nodes[name]) return;
  visited.add(name);
  for (const edge of dependencies[name] || []) {
    visit(edge.target);
  }
  order.push(name);
}

visit(focusProject);

const buildable = order.filter(
  name => name !== focusProject && nodes[name]?.data?.targets?.build,
);

const chunkSize = Math.max(1, Math.ceil(buildable.length / chunkCount));
for (let i = 0; i < buildable.length; i += chunkSize) {
  console.log(buildable.slice(i, i + chunkSize).join(","));
}
