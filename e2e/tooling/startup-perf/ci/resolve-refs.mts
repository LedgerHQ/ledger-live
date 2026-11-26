#!/usr/bin/env node
// The plan job: resolves the refs of builds A and B to commits, and gives the jobs their matrices
// and settings. Reads the workflow's inputs from the environment, or the nightly's settings on a
// scheduled run; writes GITHUB_OUTPUT and the job summary.
import { appendFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
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
  /** Where run.ts reads each launch: log, both or screen. */
  read: string;
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
  read: "log",
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
  /** B builds only reviewed code, so B's build job cannot have replaced another job's artifact. */
  reviewedB: boolean;
}

/** An entry of the build matrices: a side, the commit it builds, the regression B re-adds. */
export interface BuildEntry {
  side: "a" | "b";
  ref: string;
  regression: string;
}

export interface Plan extends Builds {
  /** The build matrices before the cache: one entry per side. restore-cache leaves out A it restored. */
  builds: BuildEntry[];
  /** The accounts scenario needs the snapshot: made unless restore-cache restored it. */
  snapshot: boolean;
  /** The platforms the run measures. */
  android: boolean;
  ios: boolean;
  /** `restore-cache` looks the cache up: for build A of a release tag, and the accounts snapshot. */
  restore: boolean;
  /**
   * `save-cache` caches what this run made, in a run from develop whose B builds only reviewed
   * code: B's build job runs B's code, which could replace another job's artifact before it is
   * cached. Build A also needs `cacheA`.
   */
  save: boolean;
  scenarios: string[];
  /**
   * The release whose E2E build makes the accounts scenario's snapshot (src/snapshot/run.ts), and
   * its commit: none without that scenario.
   */
  snapshotRelease: string;
  snapshotSha: string;
  /** The release tags `checkReleaseTags` vets: the snapshot's in every run, A's and B's from develop. */
  tagsToCheck: Array<{ ref: string; sha: string }>;
  /** The run's settings, which the build and measure jobs read from the plan's outputs. */
  settings: Pick<PlanInputs, "preset" | "platforms" | "pairs" | "thresholdMs" | "read">;
}

/** `git ls-remote <options> <this repository> <patterns>`. */
export type LsRemote = (options: string[], patterns: string[]) => string;

/** A `GET` of this repository's GitHub REST API (`repos/<owner>/<repo>/<path>`), as JSON. */
export type GitHubGet = (path: string) => Promise<unknown>;

const PROD_TAG = /^live-mobile@(\d+)\.(\d+)\.(\d+)$/;
const TAGS_PREFIX = "refs/tags/";
/**
 * The branches only a merged pull request changes, besides the release bot's commits: hotfix through
 * a branch protection rule, as its rulesets only refuse force-pushes. No rule covers tags.
 */
const REVIEWED_BRANCHES = new Set(["develop", "release", "main", "hotfix"]);
/**
 * The branch whose runs get the develop cache role and save to the cache: the role trusts the
 * branch's runs (OIDC), so their build jobs could take it too. Every other run gets the branch role.
 */
const CACHE_BRANCH = "develop";

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
 * A ref the run may build. A run from develop holds develop's identity in its build jobs and caches
 * what they build: it builds only the reviewed branches and the release tags, once
 * `checkReleaseTags` has vetted their commit. Another branch is measured from a run of its own.
 */
function resolveForRun(inputs: PlanInputs, ref: string, lsRemote: LsRemote): Resolved {
  const resolved = resolve(ref, lsRemote);
  const run = inputs.branchName;
  if (run === CACHE_BRANCH && !resolved.isReviewedBranch && !resolved.isReleaseTag) {
    throw new StepFailure(
      `a run from ${run} builds only develop, release, main, hotfix and live-mobile@X.Y.Z tags, as its jobs get ${run}'s identity: to measure '${ref}', run the workflow from it`,
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
    // B is A's commit: reviewed when A is the run's own branch (only develop's runs save), a
    // release tag's, or a reviewed branch.
    reviewedB: !a || a.isReviewedBranch || a.isReleaseTag,
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
  const withSha = (label: string, sha: string) => `${label} (${sha.slice(0, 10)})`;
  const scenarios = inputs.scenarios.split(",");
  const snapshotRelease = scenarios.includes("accounts") ? latestProdTag(lsRemote) : "";
  // The snapshot job runs this release's E2E app with the E2E seed in its environment, in every run:
  // its tag is checked in every run, and must still be a tag (it may have given way to a branch of
  // its name since the tags were listed). A and B only in a run from develop (resolveForRun).
  const snapshot = snapshotRelease ? [resolve(snapshotRelease, lsRemote)] : [];
  if (snapshot[0] && !snapshot[0].isReleaseTag) {
    throw new StepFailure(
      `${snapshotRelease} is no longer a release tag of this repository: the accounts snapshot is made only from one`,
    );
  }
  const builtTags = inputs.branchName === CACHE_BRANCH ? builds.refs : [];
  // Each commit once: a tag resolved twice may have moved in between, and the jobs build both.
  const tagsToCheck = [...builtTags, ...snapshot]
    .filter(r => r.isReleaseTag)
    .map(({ ref, sha }) => ({ ref, sha }))
    .filter((tag, i, tags) => tags.findIndex(t => t.sha === tag.sha) === i);
  return {
    ...builds,
    labelA: withSha(builds.labelA, builds.shaA),
    labelB: builds.sides.includes("b") ? withSha(builds.labelB, builds.shaB) : builds.labelB,
    builds: builds.sides.map(side => ({
      side,
      ref: side === "a" ? builds.shaA : builds.shaB,
      regression: side === "b" && inputs.preset === "known-regression" ? "LIVE-36190" : "",
    })),
    snapshot: snapshotRelease !== "",
    android: inputs.platforms !== "iOS Only",
    ios: inputs.platforms !== "Android Only",
    restore: builds.cacheA || snapshotRelease !== "",
    // Every run restores from develop/, which only develop's role writes.
    save: builds.reviewedB && inputs.branchName === CACHE_BRANCH,
    scenarios,
    snapshotRelease,
    snapshotSha: snapshot[0]?.sha ?? "",
    tagsToCheck,
    settings: {
      preset: inputs.preset,
      platforms: inputs.platforms,
      pairs: inputs.pairs,
      thresholdMs: inputs.thresholdMs,
      read: inputs.read,
    },
  };
}

const RELEASE_BOT = "live-github-bot[bot]";
/**
 * The commit a hotfix's release makes on hotfix (release-prepare-hotfix.yml), which its tag is on and
 * which stays off main's history. The bot also commits on Renovate branches
 * (renovate-sync-reusable.yml), on code nobody reviewed, and a hotfix's prereleases, which no release
 * tag is on.
 */
const HOTFIX_RELEASE_COMMIT = "chore(hotfix): :fire: hotfix release [skip ci]";

/**
 * No rule protects the release tags: a run from develop builds one only when its commit is
 * on main, or is the release bot's hotfix release commit, committed and signed by GitHub, as every
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
    `${ref} (${sha.slice(0, 10)}) is neither on main nor a signed hotfix release commit of ${RELEASE_BOT}: a run from develop does not build it`,
  );
}

/**
 * `request`, tried again after 1 s and 2 s while it fails with anything but a StepFailure (a
 * network error, a rate limit or a 5xx): every nightly goes through these calls.
 */
export async function retried<T>(
  request: () => Promise<T>,
  wait: (ms: number) => Promise<unknown> = sleep,
  attempts = 3,
  delayMs = 1000,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof StepFailure || attempts <= 1) throw error;
    await wait(delayMs);
    return retried(request, wait, attempts - 1, delayMs * 2);
  }
}

export function outputsOf(plan: Plan): string {
  const outputs = {
    sides: JSON.stringify(plan.sides),
    builds: JSON.stringify(plan.builds),
    snapshot: String(plan.snapshot),
    android: String(plan.android),
    ios: String(plan.ios),
    scenarios: JSON.stringify(plan.scenarios),
    ref_a: plan.shaA,
    ref_b: plan.shaB,
    label_a: plan.labelA,
    label_b: plan.labelB,
    cache_a: String(plan.cacheA),
    restore: String(plan.restore),
    save: String(plan.save),
    preset: plan.settings.preset,
    platforms: plan.settings.platforms,
    pairs: plan.settings.pairs,
    threshold_ms: plan.settings.thresholdMs,
    read: plan.settings.read,
    snapshot_release: plan.snapshotRelease,
    snapshot_ref: plan.snapshotSha,
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
    inputs.branchName === CACHE_BRANCH
      ? "B is not develop, release, main or hotfix"
      : "only a run from develop saves it";
  return [
    `### Startup performance: ${inputs.preset}`,
    "",
    `- A: \`${plan.labelA}\` → \`${plan.shaA}\``,
    `- B: \`${plan.labelB}\` → \`${plan.shaB}\``,
    `- ${inputs.pairs} pairs per scenario`,
    ...(plan.snapshotRelease
      ? [`- Accounts: the snapshot ${plan.snapshotRelease}'s E2E build made through its UI`]
      : []),
    `- Android: one job (runner) per scenario, two emulators with ${avdCores} cores each, cellular network like E2E`,
    ...(plan.restore && !plan.save
      ? [`- Nothing this run makes is saved to the cache: ${notSaved}`]
      : []),
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
    read: env.READ ?? "",
    ...branch,
  };
}

/**
 * Whether GitHub refused a request for its rate limit, which a later try may pass: a 429, or a 403
 * with no request left or a Retry-After. Any other 403 is a permission the token lacks.
 */
export function isRateLimited(status: number, headers: Headers): boolean {
  if (status === 429) return true;
  return (
    status === 403 && (headers.get("x-ratelimit-remaining") === "0" || headers.has("retry-after"))
  );
}

/** The GitHub API with the run's token, which reads this repository's contents. */
function gitHubGet(env: NodeJS.ProcessEnv): GitHubGet {
  return async path => {
    const url = `${env.GITHUB_API_URL}/repos/${env.GITHUB_REPOSITORY}/${path}`;
    const get = async () => {
      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${env.GH_TOKEN}` },
      });
      const failure = `GitHub API ${path}: HTTP ${response.status}`;
      if (response.status >= 500 || isRateLimited(response.status, response.headers)) {
        throw new Error(failure);
      }
      if (!response.ok) throw new StepFailure(failure);
      return response.json();
    };
    try {
      return await retried(get);
    } catch (error) {
      if (error instanceof StepFailure) throw error;
      throw new StepFailure(`GitHub API ${path}: ${(error as Error).message}`);
    }
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
