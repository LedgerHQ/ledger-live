#!/usr/bin/env node
// The plan job: resolves the refs of builds A and B to commits, and gives the jobs their matrices
// and settings. Reads the workflow's inputs from the environment, or the nightly's settings on a
// scheduled run; writes GITHUB_OUTPUT and the job summary.
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { appendSummary, runStep, StepFailure, toolOutput } from "./step.mts";

export interface PlanInputs {
  preset: string;
  refA: string;
  refB: string;
  platforms: string;
  pairs: string;
  thresholdMs: string;
  scenarios: string;
  accountsUserdata: string;
  /** The commit and the branch the workflow runs from. */
  branchSha: string;
  branchName: string;
}

/** What a scheduled run measures, as it has no inputs: develop against production. */
export const NIGHTLY: Omit<PlanInputs, "branchSha" | "branchName"> = {
  preset: "prod-vs-develop",
  refA: "",
  refB: "",
  platforms: "Android & iOS",
  pairs: "20",
  thresholdMs: "100",
  scenarios: "no-accounts,accounts",
  accountsUserdata: "speculos-x-other-account,swap-history",
};

interface Builds {
  sides: Array<"a" | "b">;
  shaA: string;
  shaB: string;
  labelA: string;
  labelB: string;
  warnings: string[];
  /** The refs given as A or B. */
  refs: Resolved[];
  /** Build A is a release tag's: it only changes on a release, so the cache keeps it. */
  cacheA: boolean;
  /** B builds only reviewed code, so B's build job cannot have replaced A's artifact. */
  reviewedB: boolean;
}

export interface Plan extends Builds {
  /** `save-builds` caches build A: a release tag's, next to a reviewed B, in a run from develop. */
  saveA: boolean;
  /** The release tags a run from a reviewed branch builds, which `checkReleaseTags` vets. */
  tagsToCheck: Array<{ ref: string; sha: string }>;
  scenarios: string[];
  /** The run's settings, which the build and measure jobs read from the plan's outputs. */
  settings: Pick<PlanInputs, "preset" | "platforms" | "pairs" | "thresholdMs" | "accountsUserdata">;
}

/** `git ls-remote <options> <this repository> <patterns>`. */
export type LsRemote = (options: string[], patterns: string[]) => string;

/** A `GET` of this repository's GitHub REST API (`repos/<owner>/<repo>/<path>`), as JSON. */
export type GitHubGet = (path: string) => Promise<unknown>;

const PROD_TAG = /^live-mobile@(\d+)\.(\d+)\.(\d+)$/;
const TAGS_PREFIX = "refs/tags/";
/**
 * The branches only a merged pull request changes: `hotfix` only refuses force-pushes, and no rule
 * covers tags.
 */
const REVIEWED_BRANCHES = new Set(["develop", "release", "main"]);

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
  return resolve(ref, lsRemote).sha;
}

interface Resolved {
  ref: string;
  sha: string;
  isReleaseTag: boolean;
  isReviewedBranch: boolean;
}

function resolve(ref: string, lsRemote: LsRemote): Resolved {
  const refs = refsOf(
    lsRemote([], [`refs/heads/${ref}`, `${TAGS_PREFIX}${ref}`, `${TAGS_PREFIX}${ref}^{}`]),
  );
  const shaOf = (name: string) => refs.find(r => r.name === name)?.sha;
  const branch = shaOf(`refs/heads/${ref}`);
  const tag = shaOf(`${TAGS_PREFIX}${ref}^{}`) ?? shaOf(`${TAGS_PREFIX}${ref}`);
  // The release tags are lightweight: a branch of the same name would stand in for one.
  if (branch && tag) {
    throw new StepFailure(
      `'${ref}' is both a branch and a tag of this repository: rename the branch`,
    );
  }
  const sha = branch ?? tag;
  if (!sha) {
    throw new StepFailure(
      `'${ref}' is not a branch or tag of this repository (to measure a commit, push a branch or tag at it)`,
    );
  }
  return {
    ref,
    sha,
    isReleaseTag: Boolean(tag) && PROD_TAG.test(ref),
    isReviewedBranch: Boolean(branch) && REVIEWED_BRANCHES.has(ref),
  };
}

/**
 * A ref the run may build. A run from develop, release or main gets that branch's identity (OIDC),
 * which the build jobs hold for JFrog and the caches trust: it builds only those branches and the
 * release tags, and another branch is measured from a run of its own.
 */
function resolveForRun(inputs: PlanInputs, ref: string, lsRemote: LsRemote): Resolved {
  const resolved = resolve(ref, lsRemote);
  const run = inputs.branchName;
  if (REVIEWED_BRANCHES.has(run) && !resolved.isReviewedBranch && !resolved.isReleaseTag) {
    throw new StepFailure(
      `a run from ${run} builds only develop, release, main and live-mobile@X.Y.Z tags, as its jobs get ${run}'s identity: to measure '${ref}', run the workflow from it`,
    );
  }
  return resolved;
}

/** Builds A and B of two refs. */
function twoRefs(inputs: PlanInputs, lsRemote: LsRemote, refA: string, refB: string): Builds {
  const [a, b] = [resolveForRun(inputs, refA, lsRemote), resolveForRun(inputs, refB, lsRemote)];
  return {
    sides: ["a", "b"],
    shaA: a.sha,
    shaB: b.sha,
    labelA: refA,
    labelB: refB,
    warnings: [],
    refs: [a, b],
    cacheA: a.isReleaseTag,
    reviewedB: b.isReviewedBranch,
  };
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

/** The latest prod tag (or ref_a) against `refB`. */
function againstProd(inputs: PlanInputs, lsRemote: LsRemote, refB: string): Builds {
  const refA = inputs.refA || latestProdTag(lsRemote);
  const builds = twoRefs(inputs, lsRemote, refA, refB);
  if (builds.shaA === builds.shaB) builds.warnings.push(`${refA} and ${refB} are the same commit`);
  return builds;
}

function prodVsRelease(inputs: PlanInputs, lsRemote: LsRemote): Builds {
  if (!inputs.refB && !lsRemote(["--heads"], ["refs/heads/release"]).trim()) {
    throw new StepFailure("no release branch: no pre-release in progress (set ref_b, e.g. hotfix)");
  }
  return againstProd(inputs, lsRemote, inputs.refB || "release");
}

function custom(inputs: PlanInputs, lsRemote: LsRemote): Builds {
  if (!inputs.refA || !inputs.refB) throw new StepFailure("custom needs both ref_a and ref_b");
  return twoRefs(inputs, lsRemote, inputs.refA, inputs.refB);
}

/**
 * One commit for both sides: ref_a, else the branch the workflow runs from. B builds A's code, with
 * at most this workflow's own edit.
 */
function oneCommit(inputs: PlanInputs, lsRemote: LsRemote): Omit<Builds, "sides" | "labelB"> {
  const a = inputs.refA ? resolveForRun(inputs, inputs.refA, lsRemote) : undefined;
  const sha = a?.sha ?? inputs.branchSha;
  return {
    shaA: sha,
    shaB: sha,
    labelA: inputs.refA || inputs.branchName,
    warnings: [],
    refs: a ? [a] : [],
    cacheA: a?.isReleaseTag ?? false,
    reviewedB: true,
  };
}

function buildsFor(inputs: PlanInputs, lsRemote: LsRemote): Builds {
  switch (inputs.preset) {
    case "prod-vs-release":
      return prodVsRelease(inputs, lsRemote);
    case "prod-vs-develop":
      return againstProd(inputs, lsRemote, inputs.refB || "develop");
    case "custom":
      return custom(inputs, lsRemote);
    case "aa-noise":
      return { ...oneCommit(inputs, lsRemote), sides: ["a"], labelB: "the same binary" };
    case "known-regression": {
      // Build B re-adds LIVE-36190 to the same commit (prepare-build.mts).
      const builds = oneCommit(inputs, lsRemote);
      return { ...builds, sides: ["a", "b"], labelB: `${builds.labelA} with LIVE-36190 re-added` };
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
  const tagsToCheck = REVIEWED_BRANCHES.has(inputs.branchName)
    ? builds.refs.filter(r => r.isReleaseTag).map(({ ref, sha }) => ({ ref, sha }))
    : [];
  const withSha = (label: string, sha: string) => `${label} (${sha.slice(0, 10)})`;
  return {
    ...builds,
    labelA: withSha(builds.labelA, builds.shaA),
    labelB: builds.sides.includes("b") ? withSha(builds.labelB, builds.shaB) : builds.labelB,
    // Every run restores from develop/, which only develop's role writes.
    saveA: builds.cacheA && builds.reviewedB && inputs.branchName === "develop",
    tagsToCheck,
    scenarios: inputs.scenarios.split(","),
    settings: {
      preset: inputs.preset,
      platforms: inputs.platforms,
      pairs: inputs.pairs,
      thresholdMs: inputs.thresholdMs,
      accountsUserdata: inputs.accountsUserdata,
    },
  };
}

const RELEASE_BOT = "live-github-bot[bot]";
/**
 * The commit a hotfix tag is on, off main (release-prepare-hotfix.yml). The bot also commits on
 * Renovate branches (renovate-sync-reusable.yml), on code nobody reviewed.
 */
const HOTFIX_RELEASE_COMMIT = "chore(hotfix): :fire: hotfix release [skip ci]";

/**
 * No rule protects the release tags: a run from a reviewed branch builds one only when its commit is
 * on main, or the release bot's hotfix release commit, committed and signed by GitHub, as every
 * release tag is.
 */
export async function checkReleaseTags(plan: Plan, get: GitHubGet): Promise<void> {
  await Promise.all(plan.tagsToCheck.map(tag => checkReleaseTag(tag, get)));
}

async function checkReleaseTag(
  { ref, sha }: { ref: string; sha: string },
  get: GitHubGet,
): Promise<void> {
  // One page of one file: a release's merge commit lists thousands.
  const commit = (await get(`commits/${sha}?per_page=1`)) as {
    author: { login: string } | null;
    committer: { login: string } | null;
    commit: { message?: string; verification?: { verified: boolean } };
  };
  const byTheBot = commit.author?.login === RELEASE_BOT && commit.committer?.login === "web-flow";
  const isHotfixRelease = commit.commit.message === HOTFIX_RELEASE_COMMIT;
  if (byTheBot && isHotfixRelease && commit.commit.verification?.verified) return;
  const { status } = (await get(`compare/${sha}...main?per_page=1`)) as { status: string };
  if (status === "ahead" || status === "identical") return;
  throw new StepFailure(
    `${ref} (${sha.slice(0, 10)}) is neither on main nor a signed hotfix release commit of ${RELEASE_BOT}, as release tags are: a run from a reviewed branch does not build it`,
  );
}

export function outputsOf(plan: Plan): string {
  const outputs = {
    sides: JSON.stringify(plan.sides),
    scenarios: JSON.stringify(plan.scenarios),
    ref_a: plan.shaA,
    ref_b: plan.shaB,
    label_a: plan.labelA,
    label_b: plan.labelB,
    cache_a: String(plan.cacheA),
    save_a: String(plan.saveA),
    preset: plan.settings.preset,
    platforms: plan.settings.platforms,
    pairs: plan.settings.pairs,
    threshold_ms: plan.settings.thresholdMs,
    accounts_userdata: plan.settings.accountsUserdata,
  };
  // A line break in a free-text input would add or override outputs, such as a validated ref.
  return Object.entries(outputs)
    .map(([key, value]) => {
      if (/[\r\n]/.test(value)) throw new StepFailure(`${key} must be on one line`);
      return `${key}=${value}\n`;
    })
    .join("");
}

export function summaryOf(plan: Plan, inputs: PlanInputs, avdCores: string): string {
  const notSaved =
    inputs.branchName === "develop"
      ? "B is not develop, release or main"
      : "only a run from develop saves it";
  return [
    `### Startup performance: ${inputs.preset}`,
    "",
    `- A: \`${plan.labelA}\` → \`${plan.shaA}\``,
    `- B: \`${plan.labelB}\` → \`${plan.shaB}\``,
    `- ${inputs.pairs} pairs per scenario`,
    `- Android: one job (runner) per scenario, two emulators with ${avdCores} cores each, cellular network like E2E`,
    ...(plan.cacheA && !plan.saveA ? [`- Build A is not saved to the cache: ${notSaved}`] : []),
    "",
  ].join("\n");
}

/** The workflow's inputs; on a scheduled run, which has none, the nightly's settings. */
export function inputsOf(env: NodeJS.ProcessEnv): PlanInputs {
  const branch = { branchSha: env.BRANCH_SHA ?? "", branchName: env.GITHUB_REF_NAME ?? "" };
  if (env.GITHUB_EVENT_NAME === "schedule") return { ...NIGHTLY, ...branch };
  return {
    preset: env.PRESET ?? "",
    refA: env.REF_A ?? "",
    refB: env.REF_B ?? "",
    platforms: env.PLATFORMS ?? "",
    pairs: env.PAIRS ?? "",
    thresholdMs: env.THRESHOLD ?? "",
    scenarios: env.SCENARIOS ?? "",
    accountsUserdata: env.ACCOUNTS_USERDATA ?? "",
    ...branch,
  };
}

/** The GitHub API with the run's token, which reads this repository's contents. */
function gitHubGet(env: NodeJS.ProcessEnv): GitHubGet {
  return async path => {
    const url = `${env.GITHUB_API_URL}/repos/${env.GITHUB_REPOSITORY}/${path}`;
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${env.GH_TOKEN}` },
    });
    if (!response.ok) throw new StepFailure(`GitHub API ${path}: HTTP ${response.status}`);
    return response.json();
  };
}

async function main(): Promise<void> {
  const env = process.env;
  const inputs = inputsOf(env);
  const repository = env.REPO_URL ?? "";
  const lsRemote: LsRemote = (options, patterns) =>
    toolOutput("git", ["ls-remote", ...options, repository, ...patterns]);
  const plan = planBuilds(inputs, lsRemote);
  await checkReleaseTags(plan, gitHubGet(env));
  plan.warnings.forEach(warning => console.log(`::warning::${warning}`));
  const outputs = outputsOf(plan);
  if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, outputs);
  else process.stdout.write(outputs);
  appendSummary(summaryOf(plan, inputs, env.PERF_AVD_CORES ?? ""));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runStep("resolve-refs", main);
}
