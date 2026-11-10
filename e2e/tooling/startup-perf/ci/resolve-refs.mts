#!/usr/bin/env node
// The plan job: resolves the refs of builds A and B to commits, and gives the jobs their matrices.
// Reads the workflow's inputs from the environment; writes GITHUB_OUTPUT and the job summary.
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { appendSummary, runStep, StepFailure, toolOutput } from "./step.mts";

export interface PlanInputs {
  preset: string;
  refA: string;
  refB: string;
  pairs: string;
  thresholdMs: string;
  scenarios: string;
  /** The commit and the branch the workflow runs from. */
  branchSha: string;
  branchName: string;
}

interface Builds {
  sides: Array<"a" | "b">;
  shaA: string;
  shaB: string;
  labelA: string;
  labelB: string;
  warnings: string[];
}

export interface Plan extends Builds {
  scenarios: string[];
}

/** `git ls-remote <options> <this repository> <patterns>`. */
export type LsRemote = (options: string[], patterns: string[]) => string;

const PROD_TAG = /^live-mobile@(\d+)\.(\d+)\.(\d+)$/;
const TAGS_PREFIX = "refs/tags/";

const refsOf = (output: string) =>
  output
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const [sha, name] = line.split("\t");
      return { sha, name };
    });

/**
 * A branch or tag of this repository, as a commit. No raw SHA: a fork's commit can be fetched here
 * too and would run with this workflow's secrets.
 */
export function resolveRef(ref: string, lsRemote: LsRemote): string {
  const refs = refsOf(
    lsRemote([], [`refs/heads/${ref}`, `${TAGS_PREFIX}${ref}`, `${TAGS_PREFIX}${ref}^{}`]),
  );
  const peeledTag = refs.find(r => r.name === `${TAGS_PREFIX}${ref}^{}`);
  const branchOrTag = refs.find(
    r => r.name === `refs/heads/${ref}` || r.name === `${TAGS_PREFIX}${ref}`,
  );
  const sha = (peeledTag ?? branchOrTag)?.sha;
  if (!sha) {
    throw new StepFailure(
      `'${ref}' is not a branch or tag of this repository (to measure a commit, push a branch or tag at it)`,
    );
  }
  return sha;
}

const versionOf = (tag: string) => (PROD_TAG.exec(tag) ?? []).slice(1).map(Number);
const byVersion = (a: string, b: string) => {
  const [x, y] = [versionOf(a), versionOf(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/** The newest `live-mobile@X.Y.Z` tag: the version in production. */
export function latestProdTag(lsRemote: LsRemote): string {
  const tags = refsOf(lsRemote(["--tags", "--refs"], [`${TAGS_PREFIX}live-mobile@*`]))
    .map(r => r.name.slice(TAGS_PREFIX.length))
    .filter(tag => PROD_TAG.test(tag))
    .sort(byVersion);
  const latest = tags.at(-1);
  if (!latest) throw new StepFailure("no live-mobile@X.Y.Z tag found");
  return latest;
}

function prodVsRelease(inputs: PlanInputs, lsRemote: LsRemote): Builds {
  const refA = inputs.refA || latestProdTag(lsRemote);
  if (!inputs.refB && !lsRemote(["--heads"], ["refs/heads/release"]).trim()) {
    throw new StepFailure("no release branch: no pre-release in progress (set ref_b, e.g. hotfix)");
  }
  const refB = inputs.refB || "release";
  const shaA = resolveRef(refA, lsRemote);
  const shaB = resolveRef(refB, lsRemote);
  const warnings = shaA === shaB ? [`${refA} and ${refB} are the same commit`] : [];
  return { sides: ["a", "b"], shaA, shaB, labelA: refA, labelB: refB, warnings };
}

function custom(inputs: PlanInputs, lsRemote: LsRemote): Builds {
  if (!inputs.refA || !inputs.refB) throw new StepFailure("custom needs both ref_a and ref_b");
  const shaA = resolveRef(inputs.refA, lsRemote);
  const shaB = resolveRef(inputs.refB, lsRemote);
  return { sides: ["a", "b"], shaA, shaB, labelA: inputs.refA, labelB: inputs.refB, warnings: [] };
}

/** `ref`, else the commit the workflow runs from. */
function refOrThisBranch(
  ref: string,
  inputs: PlanInputs,
  lsRemote: LsRemote,
): { sha: string; label: string } {
  if (!ref) return { sha: inputs.branchSha, label: inputs.branchName };
  return { sha: resolveRef(ref, lsRemote), label: ref };
}

/** The nightly's comparison: the latest prod tag (or ref_a) against the commit it runs on (or ref_b). */
function prodVsDevelop(inputs: PlanInputs, lsRemote: LsRemote): Builds {
  const refA = inputs.refA || latestProdTag(lsRemote);
  const shaA = resolveRef(refA, lsRemote);
  const b = refOrThisBranch(inputs.refB, inputs, lsRemote);
  const warnings = shaA === b.sha ? [`${refA} and ${b.label} are the same commit`] : [];
  return { sides: ["a", "b"], shaA, shaB: b.sha, labelA: refA, labelB: b.label, warnings };
}

function buildsFor(inputs: PlanInputs, lsRemote: LsRemote): Builds {
  switch (inputs.preset) {
    case "prod-vs-release":
      return prodVsRelease(inputs, lsRemote);
    case "prod-vs-develop":
      return prodVsDevelop(inputs, lsRemote);
    case "custom":
      return custom(inputs, lsRemote);
    case "aa-noise": {
      const { sha, label } = refOrThisBranch(inputs.refA, inputs, lsRemote);
      return {
        sides: ["a"],
        shaA: sha,
        shaB: sha,
        labelA: label,
        labelB: "the same binary",
        warnings: [],
      };
    }
    case "known-regression": {
      // Build B re-adds LIVE-36190 to the same commit (prepare-build.mts).
      const { sha, label } = refOrThisBranch(inputs.refA, inputs, lsRemote);
      const labelB = `${label} with LIVE-36190 re-added`;
      return { sides: ["a", "b"], shaA: sha, shaB: sha, labelA: label, labelB, warnings: [] };
    }
    default:
      throw new StepFailure(`unknown preset ${inputs.preset}`);
  }
}

export function planBuilds(inputs: PlanInputs, lsRemote: LsRemote): Plan {
  const pairs = Number(inputs.pairs);
  if (!/^\d+$/.test(inputs.pairs) || pairs < 6 || pairs % 2) {
    throw new StepFailure(`pairs must be an even number ≥ 6, got '${inputs.pairs}'`);
  }
  if (!/^\d+$/.test(inputs.thresholdMs)) throw new StepFailure("threshold_ms must be a number");
  const builds = buildsFor(inputs, lsRemote);
  const withSha = (label: string, sha: string) => `${label} (${sha.slice(0, 10)})`;
  return {
    ...builds,
    labelA: withSha(builds.labelA, builds.shaA),
    labelB: builds.sides.includes("b") ? withSha(builds.labelB, builds.shaB) : builds.labelB,
    scenarios: inputs.scenarios.split(","),
  };
}

export function outputsOf(plan: Plan): string {
  const outputs = {
    sides: JSON.stringify(plan.sides),
    scenarios: JSON.stringify(plan.scenarios),
    ref_a: plan.shaA,
    ref_b: plan.shaB,
    label_a: plan.labelA,
    label_b: plan.labelB,
  };
  return Object.entries(outputs)
    .map(([key, value]) => `${key}=${value}\n`)
    .join("");
}

export function summaryOf(plan: Plan, inputs: PlanInputs, avdCores: string): string {
  return [
    `### Startup performance: ${inputs.preset}`,
    "",
    `- A: \`${plan.labelA}\` → \`${plan.shaA}\``,
    `- B: \`${plan.labelB}\` → \`${plan.shaB}\``,
    `- ${inputs.pairs} pairs per scenario`,
    `- Android: one job (runner) per scenario, two emulators with ${avdCores} cores each, cellular network like E2E`,
    "",
  ].join("\n");
}

function main(): void {
  const env = process.env;
  const inputs: PlanInputs = {
    preset: env.PRESET ?? "",
    refA: env.REF_A ?? "",
    refB: env.REF_B ?? "",
    pairs: env.PAIRS ?? "",
    thresholdMs: env.THRESHOLD ?? "",
    scenarios: env.SCENARIOS ?? "",
    branchSha: env.BRANCH_SHA ?? "",
    branchName: env.GITHUB_REF_NAME ?? "",
  };
  const repository = env.REPO_URL ?? "";
  const lsRemote: LsRemote = (options, patterns) =>
    toolOutput("git", ["ls-remote", ...options, repository, ...patterns]);
  const plan = planBuilds(inputs, lsRemote);
  plan.warnings.forEach(warning => console.log(`::warning::${warning}`));
  const outputs = outputsOf(plan);
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, outputs);
  else process.stdout.write(outputs);
  appendSummary(summaryOf(plan, inputs, env.PERF_AVD_CORES ?? ""));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runStep("resolve-refs", main);
}
