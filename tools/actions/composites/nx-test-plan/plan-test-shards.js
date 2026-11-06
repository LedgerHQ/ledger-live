#!/usr/bin/env node
"use strict";

/**
 * Plans the "Test Packages" matrix from the affected Nx projects.
 *
 * Affected projects in the package scopes are weighted (test files + a fixed cost for lint,
 * typecheck and Jest start-up) and packed onto as few shards as the weight budget allows,
 * heaviest first onto the lightest shard. Most PRs fit in one shard.
 *
 * Run locally: AFFECTED="a\nb" node plan-test-shards.js   (prints the plan as JSON)
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS for a standalone script
const { spawnSync } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS for a standalone script
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS for a standalone script
const os = require("os");
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS for a standalone script
const path = require("path");

const SCOPE_TAGS = [
  "scope:libs",
  "scope:features",
  "scope:shared",
  "scope:domain",
  "scope:devtools",
  "scope:support",
];
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const DEFAULT_BASE_WEIGHT = 10;
const DEFAULT_MAX_WEIGHT_PER_SHARD = 2500;
const DEFAULT_MAX_SHARDS = 4;

/** Mirrors the lanes it replaces: UI libs have their own job, and only libs fall back to `test`. */
function classify(node) {
  const tags = node.data.tags || [];
  const targets = node.data.targets || {};
  if (!SCOPE_TAGS.some(tag => tags.includes(tag))) return null;

  const isUiLib = tags.includes("scope:libs-ui");
  const isLib = tags.includes("scope:libs");
  let testTarget = null;
  if (!isUiLib && targets.coverage) testTarget = "coverage";
  else if (!isUiLib && isLib && targets.test) testTarget = "test";

  return {
    name: node.name,
    root: node.data.root,
    testTarget,
    exportRules: tags.includes("scope:domain") && Boolean(targets["check-export-rules"]),
  };
}

/** Attributes each test file to the deepest project root containing it, so nested packages are not double-counted. */
function countTestFiles(files, roots) {
  const byDepth = [...roots].sort((a, b) => b.length - a.length);
  const counts = new Map(roots.map(root => [root, 0]));
  for (const file of files) {
    if (!TEST_FILE.test(file)) continue;
    const owner = byDepth.find(root => file.startsWith(`${root}/`));
    if (owner) counts.set(owner, counts.get(owner) + 1);
  }
  return counts;
}

function planShards(projects, options = {}) {
  const maxWeight = options.maxWeightPerShard ?? DEFAULT_MAX_WEIGHT_PER_SHARD;
  const maxShards = options.maxShards ?? DEFAULT_MAX_SHARDS;
  if (projects.length === 0) return [];

  const total = projects.reduce((sum, p) => sum + p.weight, 0);
  const count = Math.min(maxShards, Math.max(1, Math.ceil(total / maxWeight)));
  const shards = Array.from({ length: count }, () => ({ weight: 0, projects: [] }));

  const heaviestFirst = [...projects].sort(
    (a, b) => b.weight - a.weight || a.name.localeCompare(b.name),
  );
  for (const project of heaviestFirst) {
    const lightest = shards.reduce((min, s) => (s.weight < min.weight ? s : min));
    lightest.weight += project.weight;
    lightest.projects.push(project);
  }

  return shards
    .filter(s => s.projects.length > 0)
    .map((s, i) => {
      const names = s.projects.map(p => p.name).sort();
      const pick = predicate =>
        s.projects
          .filter(predicate)
          .map(p => p.name)
          .sort()
          .join(",");
      return {
        shard: i + 1,
        weight: s.weight,
        projects: names.join(","),
        coverage: pick(p => p.testTarget === "coverage"),
        test: pick(p => p.testTarget === "test"),
        export_rules: pick(p => p.exportRules),
        roots: s.projects
          .map(p => p.root)
          .sort()
          .join(" "),
      };
    });
}

function buildPlan({ graph, affected, files, options = {} }) {
  const baseWeight = options.baseWeight ?? DEFAULT_BASE_WEIGHT;
  const nodes = graph.graph.nodes;
  const allRoots = Object.values(nodes)
    .map(n => n.data.root)
    .filter(Boolean);
  const testFiles = countTestFiles(files, allRoots);

  const projects = affected
    .map(name => nodes[name])
    .filter(Boolean)
    .map(classify)
    .filter(Boolean)
    .map(p => ({
      ...p,
      weight: baseWeight + (p.testTarget ? testFiles.get(p.root) || 0 : 0),
    }));

  return planShards(projects, options);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (${r.status}): ${(r.stderr || "").trim()}`);
  }
  return r.stdout;
}

function main() {
  const affected = (process.env.AFFECTED || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
  const graphFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "nx-graph-")), "graph.json");
  run("pnpm", ["nx", "graph", `--file=${graphFile}`]);
  const graph = JSON.parse(fs.readFileSync(graphFile, "utf-8"));
  const files = run("git", ["ls-files"]).split("\n");

  const numberFromEnv = key => (process.env[key] ? Number(process.env[key]) : undefined);
  const shards = buildPlan({
    graph,
    affected,
    files,
    options: {
      maxWeightPerShard: numberFromEnv("MAX_WEIGHT_PER_SHARD"),
      maxShards: numberFromEnv("MAX_SHARDS"),
    },
  });

  for (const s of shards) {
    console.error(`shard ${s.shard}: weight ${s.weight}, ${s.projects.split(",").length} projects`);
  }
  const result = { shards: shards.length, matrix: { include: shards } };
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `shards=${result.shards}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${JSON.stringify(result.matrix)}\n`);
  }
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { buildPlan, planShards, countTestFiles, classify };

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
