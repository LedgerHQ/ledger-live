import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkReleaseTags,
  type GitHubGet,
  inputsOf,
  isRateLimited,
  latestProdTag,
  type LsRemote,
  NIGHTLY,
  outputsOf,
  planBuilds,
  type PlanInputs,
  resolveRef,
  retried,
  summaryOf,
} from "./resolve-refs.mts";
import { StepFailure } from "./step.mts";

const SHA = (n: number) => String(n).repeat(40).slice(0, 40);

// What `git ls-remote` lists for this repository, filtered like git does: a pattern matches a ref
// that ends with it.
const REFS: Array<[string, string]> = [
  [SHA(1), "refs/heads/develop"],
  [SHA(2), "refs/heads/release"],
  [SHA(3), "refs/tags/live-mobile@4.9.0"],
  [SHA(4), "refs/tags/live-mobile@4.27.1"],
  [SHA(5), "refs/tags/live-mobile@4.27.1^{}"],
  [SHA(6), "refs/tags/live-mobile@4.27.0"],
  [SHA(7), "refs/tags/live-mobile@4.28.0-nightly.1"],
];

function fakeLsRemote(refs = REFS): LsRemote {
  return (options, patterns) => {
    const wanted = (name: string) =>
      patterns.some(pattern => {
        const glob = pattern.endsWith("*");
        return glob ? name.startsWith(pattern.slice(0, -1)) : name === pattern;
      });
    const peeled = (name: string) => options.includes("--refs") && name.endsWith("^{}");
    return refs
      .filter(([, name]) => wanted(name) && !peeled(name))
      .map(([sha, name]) => `${sha}\t${name}\n`)
      .join("");
  };
}

const INPUTS: PlanInputs = {
  preset: "custom",
  refA: "live-mobile@4.27.0",
  refB: "develop",
  platforms: "Android & iOS",
  pairs: "20",
  thresholdMs: "100",
  scenarios: "no-accounts,accounts",
  read: "log",
  branchSha: SHA(9),
  branchName: "ci/branch",
};

describe("resolveRef", () => {
  it("resolves a branch, and an annotated tag to its commit", () => {
    assert.equal(resolveRef("develop", fakeLsRemote()), SHA(1));
    assert.equal(resolveRef("live-mobile@4.27.1", fakeLsRemote()), SHA(5));
  });
  it("refuses a name that is both a branch and a tag: the branch could stand in for a release", () => {
    const shadowed = fakeLsRemote([...REFS, [SHA(8), "refs/heads/live-mobile@4.27.1"]]);
    assert.throws(
      () => resolveRef("live-mobile@4.27.1", shadowed),
      /'live-mobile@4\.27\.1' is both a branch and a tag/,
    );
    assert.throws(
      () => planBuilds({ ...INPUTS, preset: "prod-vs-develop", refA: "", refB: "" }, shadowed),
      /is both a branch and a tag/,
    );
  });
  it("refuses a raw SHA, which could be a fork's commit", () => {
    assert.throws(
      () => resolveRef(SHA(1), fakeLsRemote()),
      /is not a branch or tag of this repository/,
    );
  });
});

describe("latestProdTag", () => {
  it("takes the highest X.Y.Z version, not the last in text order", () => {
    assert.equal(latestProdTag(fakeLsRemote()), "live-mobile@4.27.1");
  });
  it("fails without any", () => {
    assert.throws(() => latestProdTag(fakeLsRemote([])), /no live-mobile@X.Y.Z tag found/);
  });
});

describe("planBuilds", () => {
  it("defaults prod-vs-release to the latest prod tag against release", () => {
    const plan = planBuilds(
      { ...INPUTS, preset: "prod-vs-release", refA: "", refB: "" },
      fakeLsRemote(),
    );
    assert.equal(plan.labelA, `live-mobile@4.27.1 (${SHA(5).slice(0, 10)})`);
    assert.equal(plan.labelB, `release (${SHA(2).slice(0, 10)})`);
    assert.deepEqual(plan.sides, ["a", "b"]);
  });

  it("needs a release branch when ref_b is blank", () => {
    const withoutRelease = REFS.filter(([, name]) => name !== "refs/heads/release");
    assert.throws(
      () =>
        planBuilds(
          { ...INPUTS, preset: "prod-vs-release", refB: "" },
          fakeLsRemote(withoutRelease),
        ),
      /no release branch/,
    );
  });

  it("warns in prod-vs-release when both refs are the same commit", () => {
    const plan = planBuilds(
      { ...INPUTS, preset: "prod-vs-release", refA: "develop", refB: "develop" },
      fakeLsRemote(),
    );
    assert.deepEqual(plan.warnings, ["develop and develop are the same commit"]);
  });

  it("defaults prod-vs-develop to the latest prod tag against develop, from any branch", () => {
    const plan = planBuilds(
      { ...INPUTS, preset: "prod-vs-develop", refA: "", refB: "" },
      fakeLsRemote(),
    );
    assert.deepEqual([plan.sides, plan.shaA, plan.shaB], [["a", "b"], SHA(5), SHA(1)]);
    assert.equal(plan.labelA, `live-mobile@4.27.1 (${SHA(5).slice(0, 10)})`);
    assert.equal(plan.labelB, `develop (${SHA(1).slice(0, 10)})`);
    assert.deepEqual(plan.warnings, []);
  });

  it("takes ref_a and ref_b in prod-vs-develop when they are set", () => {
    const plan = planBuilds(
      { ...INPUTS, preset: "prod-vs-develop", refA: "live-mobile@4.27.0", refB: "release" },
      fakeLsRemote(),
    );
    assert.deepEqual([plan.shaA, plan.shaB], [SHA(6), SHA(2)]);
    assert.equal(plan.labelB, `release (${SHA(2).slice(0, 10)})`);
  });

  it("warns in prod-vs-develop when both sides are the same commit", () => {
    const plan = planBuilds(
      { ...INPUTS, preset: "prod-vs-develop", refA: "develop", refB: "" },
      fakeLsRemote(),
    );
    assert.deepEqual(plan.warnings, ["develop and develop are the same commit"]);
  });

  it("needs both refs for custom", () => {
    assert.throws(() => planBuilds({ ...INPUTS, refB: "" }, fakeLsRemote()), /custom needs both/);
  });

  it("builds one binary for aa-noise, from this branch by default", () => {
    const plan = planBuilds({ ...INPUTS, preset: "aa-noise", refA: "" }, fakeLsRemote());
    assert.deepEqual([plan.sides, plan.shaA, plan.shaB], [["a"], SHA(9), SHA(9)]);
    assert.equal(plan.labelB, "the same binary");
  });

  it("builds the same commit twice for known-regression, B with LIVE-36190", () => {
    const plan = planBuilds(
      { ...INPUTS, preset: "known-regression", refA: "develop" },
      fakeLsRemote(),
    );
    assert.deepEqual([plan.sides, plan.shaA, plan.shaB], [["a", "b"], SHA(1), SHA(1)]);
    assert.equal(plan.labelB, `develop with LIVE-36190 re-added (${SHA(1).slice(0, 10)})`);
  });

  it("caches build A only when it is a release tag's", () => {
    const cacheA = (inputs: Partial<PlanInputs>) =>
      planBuilds({ ...INPUTS, ...inputs }, fakeLsRemote()).cacheA;
    assert.equal(cacheA({ preset: "prod-vs-develop", refA: "", refB: "" }), true);
    assert.equal(cacheA({ preset: "known-regression", refA: "live-mobile@4.27.1" }), true);
    assert.equal(cacheA({ refA: "develop", refB: "live-mobile@4.27.1" }), false);
    assert.equal(cacheA({ preset: "aa-noise", refA: "" }), false);
    assert.equal(cacheA({ refA: "live-mobile@4.28.0-nightly.1" }), false);
    const branchNamedLikeATag = fakeLsRemote([...REFS, [SHA(8), "refs/heads/live-mobile@4.30.0"]]);
    assert.equal(
      planBuilds({ ...INPUTS, refA: "live-mobile@4.30.0" }, branchNamedLikeATag).cacheA,
      false,
    );
  });

  it("builds only reviewed branches and release tags in a run from develop", () => {
    const refs = fakeLsRemote([
      ...REFS,
      [SHA(8), "refs/heads/main"],
      [SHA(8), "refs/heads/feat/x"],
    ]);
    const plan = (inputs: Partial<PlanInputs>) =>
      planBuilds({ ...INPUTS, branchName: "develop", ...inputs }, refs);
    assert.equal(plan({ preset: "prod-vs-develop", refA: "", refB: "" }).shaB, SHA(1));
    assert.equal(plan({ preset: "prod-vs-release", refA: "", refB: "" }).shaB, SHA(2));
    assert.equal(plan({ refA: "live-mobile@4.27.0", refB: "main" }).shaB, SHA(8));
    assert.equal(plan({ preset: "aa-noise", refA: "" }).shaA, SHA(9));
    for (const inputs of [
      { preset: "prod-vs-develop", refA: "", refB: "feat/x" },
      { refA: "feat/x", refB: "develop" },
      { refA: "live-mobile@4.28.0-nightly.1" },
      { preset: "known-regression", refA: "feat/x" },
    ]) {
      assert.throws(
        () => plan(inputs),
        /a run from develop builds only develop, release, main, hotfix and live-mobile@X\.Y\.Z tags, as its jobs get develop's identity: to measure '[^']+', run the workflow from it/,
      );
    }
    // A run from another branch gets the branch cache role: it builds any branch.
    assert.equal(plan({ branchName: "release", refB: "feat/x" }).shaB, SHA(8));
    const fromTheBranch = planBuilds({ ...INPUTS, branchName: "feat/x", refB: "feat/x" }, refs);
    assert.equal(fromTheBranch.shaB, SHA(8));
  });

  it("builds hotfix in a run from develop, as a reviewed branch", () => {
    const refs = fakeLsRemote([...REFS, [SHA(8), "refs/heads/hotfix"]]);
    const hotfixCheck = {
      ...INPUTS,
      preset: "prod-vs-release",
      refA: "",
      refB: "hotfix",
      scenarios: "no-accounts",
      branchName: "develop",
    };
    const plan = planBuilds(hotfixCheck, refs);
    assert.equal(plan.shaB, SHA(8));
    // Only a merged pull request changes it: only A's tag is vetted, and the run saves.
    assert.deepEqual(plan.tagsToCheck, [{ ref: "live-mobile@4.27.1", sha: SHA(5) }]);
    assert.equal(plan.save, true);
  });

  it("saves to the cache only from develop, when B is develop, release, main or A's own", () => {
    const refs = fakeLsRemote([...REFS, [SHA(8), "refs/heads/main"]]);
    const save = (inputs: Partial<PlanInputs>) =>
      planBuilds({ ...INPUTS, branchName: "develop", ...inputs }, refs).save;
    const nightly = { preset: "prod-vs-develop", refA: "", refB: "" };
    assert.equal(save(nightly), true);
    assert.equal(save({ preset: "prod-vs-release", refA: "", refB: "" }), true);
    assert.equal(save({ refB: "main" }), true);
    assert.equal(save({ preset: "aa-noise" }), true);
    assert.equal(save({ preset: "known-regression" }), true);
    // A single-commit run builds B from A's commit, which a run from develop only takes reviewed.
    assert.equal(save({ preset: "aa-noise", refA: "release" }), true);
    assert.equal(save({ preset: "known-regression", refA: "live-mobile@4.27.1" }), true);
    assert.equal(save({ refB: "live-mobile@4.27.1" }), false);
    // Only develop's role writes develop/, which every run restores from.
    assert.equal(save({ ...nightly, branchName: "release" }), false);
    assert.equal(save({ ...nightly, branchName: "feat/x" }), false);
  });

  it("restores and saves build A only when it is a release tag's", () => {
    const plan = (inputs: Partial<PlanInputs>) =>
      planBuilds({ ...INPUTS, branchName: "develop", ...inputs }, fakeLsRemote());
    const nightly = plan({ preset: "prod-vs-develop", refA: "", refB: "" });
    assert.deepEqual([nightly.restore, nightly.cacheA, nightly.save], [true, true, true]);
    // B is reviewed, so the run may save, but its A is no release's: only its snapshot is cached.
    const developTwice = plan({ refA: "develop", refB: "develop" });
    assert.deepEqual(
      [developTwice.restore, developTwice.cacheA, developTwice.save],
      [true, false, true],
    );
  });

  it("makes and restores the accounts snapshot only for the accounts scenario", () => {
    const plan = (scenarios: string) =>
      planBuilds({ ...INPUTS, refA: "develop", refB: "develop", scenarios }, fakeLsRemote());
    const withAccounts = plan("no-accounts,accounts");
    assert.deepEqual([withAccounts.snapshot, withAccounts.restore], [true, true]);
    assert.equal(withAccounts.snapshotRelease, "live-mobile@4.27.1");
    const withoutAccounts = plan("no-accounts");
    assert.deepEqual(
      [withoutAccounts.snapshot, withoutAccounts.restore, withoutAccounts.snapshotRelease],
      [false, false, ""],
    );
  });

  it("gives each build matrix entry its commit, and B of known-regression its regression", () => {
    const builds = (inputs: Partial<PlanInputs>) =>
      planBuilds({ ...INPUTS, ...inputs }, fakeLsRemote()).builds;
    assert.deepEqual(builds({}), [
      { side: "a", ref: SHA(6), regression: "" },
      { side: "b", ref: SHA(1), regression: "" },
    ]);
    assert.deepEqual(builds({ preset: "known-regression", refA: "develop" }), [
      { side: "a", ref: SHA(1), regression: "" },
      { side: "b", ref: SHA(1), regression: "LIVE-36190" },
    ]);
    assert.deepEqual(builds({ preset: "aa-noise", refA: "develop" }), [
      { side: "a", ref: SHA(1), regression: "" },
    ]);
  });

  it("says which platforms the run measures", () => {
    const flags = (platforms: string) => {
      const plan = planBuilds({ ...INPUTS, platforms }, fakeLsRemote());
      return [plan.android, plan.ios];
    };
    assert.deepEqual(flags("Android & iOS"), [true, true]);
    assert.deepEqual(flags("Android Only"), [true, false]);
    assert.deepEqual(flags("iOS Only"), [false, true]);
  });

  for (const pairs of ["4", "7", "x", ""]) {
    it(`refuses ${JSON.stringify(pairs)} pairs`, () => {
      assert.throws(() => planBuilds({ ...INPUTS, pairs }, fakeLsRemote()), /even number ≥ 6/);
    });
  }

  it("refuses a threshold that is not a number", () => {
    assert.throws(
      () => planBuilds({ ...INPUTS, thresholdMs: "1e3" }, fakeLsRemote()),
      /threshold_ms/,
    );
  });
});

describe("checkReleaseTags", () => {
  const BOT = {
    author: { login: "live-github-bot[bot]" },
    committer: { login: "web-flow" },
    commit: {
      message: "chore(hotfix): :fire: hotfix release [skip ci]",
      verification: { verified: true },
    },
  };
  const HUMAN = { ...BOT, author: { login: "someone" } };
  const RENOVATE_SYNC = {
    ...BOT,
    commit: { ...BOT.commit, message: "chore(deps): sync Podfile.lock and changeset" },
  };
  const fakeGitHub = (commit: object, status = "diverged") => {
    const paths: string[] = [];
    const get: GitHubGet = async path => {
      paths.push(path);
      return path.startsWith("commits/") ? commit : { status };
    };
    return { get, paths };
  };
  const fromDevelop = planBuilds(
    { ...INPUTS, preset: "prod-vs-develop", refA: "", refB: "", branchName: "develop" },
    fakeLsRemote(),
  );

  it("checks A's and B's tags in a run from develop, and the snapshot's in every run", () => {
    assert.deepEqual(fromDevelop.tagsToCheck, [{ ref: "live-mobile@4.27.1", sha: SHA(5) }]);
    const fromRelease = planBuilds(
      { ...INPUTS, refA: "live-mobile@4.27.0", refB: "develop", branchName: "release" },
      fakeLsRemote(),
    );
    // The snapshot job runs the release's app next to the E2E seed, whichever branch runs it.
    const snapshotTag = [{ ref: "live-mobile@4.27.1", sha: SHA(5) }];
    assert.deepEqual(fromRelease.tagsToCheck, snapshotTag);
    assert.deepEqual(planBuilds(INPUTS, fakeLsRemote()).tagsToCheck, snapshotTag);
    const noAccounts = { ...INPUTS, scenarios: "no-accounts" };
    assert.deepEqual(planBuilds(noAccounts, fakeLsRemote()).tagsToCheck, []);
    const aaFromDevelop = {
      ...INPUTS,
      preset: "aa-noise",
      refA: "",
      branchName: "develop",
      scenarios: "no-accounts",
    };
    assert.deepEqual(planBuilds(aaFromDevelop, fakeLsRemote()).tagsToCheck, []);
  });

  it("checks the accounts snapshot's release too, once when it is also build A", () => {
    const tags = (inputs: Partial<PlanInputs>) =>
      planBuilds({ ...INPUTS, branchName: "develop", ...inputs }, fakeLsRemote()).tagsToCheck;
    const snapshotOnly = { preset: "aa-noise", refA: "", scenarios: "accounts" };
    assert.deepEqual(tags(snapshotOnly), [{ ref: "live-mobile@4.27.1", sha: SHA(5) }]);
    assert.deepEqual(tags({ refA: "live-mobile@4.27.0", refB: "develop" }), [
      { ref: "live-mobile@4.27.0", sha: SHA(6) },
      { ref: "live-mobile@4.27.1", sha: SHA(5) },
    ]);
    assert.deepEqual(tags({ refA: "live-mobile@4.27.0", scenarios: "no-accounts" }), [
      { ref: "live-mobile@4.27.0", sha: SHA(6) },
    ]);
  });

  it("checks each commit a release tag resolved to, should it move between A and the snapshot", () => {
    const peeled = "refs/tags/live-mobile@4.27.1^{}";
    const moved = fakeLsRemote(
      REFS.map(([sha, name]): [string, string] => [name === peeled ? SHA(8) : sha, name]),
    );
    let resolvedOnce = false;
    const moving: LsRemote = (options, patterns) => {
      const refs = resolvedOnce ? moved : fakeLsRemote();
      if (patterns.includes(peeled)) resolvedOnce = true;
      return refs(options, patterns);
    };
    const nightly = { preset: "prod-vs-develop", refA: "", refB: "", branchName: "develop" };
    const plan = planBuilds({ ...INPUTS, ...nightly }, moving);
    assert.deepEqual([plan.shaA, plan.snapshotSha], [SHA(5), SHA(8)]);
    assert.deepEqual(plan.tagsToCheck, [
      { ref: "live-mobile@4.27.1", sha: SHA(5) },
      { ref: "live-mobile@4.27.1", sha: SHA(8) },
    ]);
  });

  it("refuses a snapshot release that became a branch after the tags were listed", () => {
    const tag = "refs/tags/live-mobile@4.27.1";
    const replaced = fakeLsRemote([
      ...REFS.filter(([, name]) => !name.startsWith(tag)),
      [SHA(8), "refs/heads/live-mobile@4.27.1"],
    ]);
    const replacing = (): LsRemote => {
      let listed = false;
      return (options, patterns) => {
        const refs = listed ? replaced : fakeLsRemote();
        if (options.includes("--tags")) listed = true;
        return refs(options, patterns);
      };
    };
    const snapshotOnly = { preset: "aa-noise", refA: "", scenarios: "accounts" };
    for (const branchName of ["develop", "ci/branch"]) {
      assert.throws(
        () => planBuilds({ ...INPUTS, ...snapshotOnly, branchName }, replacing()),
        /live-mobile@4\.27\.1 is no longer a release tag of this repository/,
      );
    }
  });

  it("refuses a tag on the release bot's signed hotfix prerelease, which no release is on", async () => {
    const prerelease = {
      ...BOT,
      commit: {
        ...BOT.commit,
        message:
          "chore(hotfix): :fire: hotfix prerelease [LLD(4.27.1-hotfix.0), LLM(4.27.1-hotfix.0)] [skip ci]",
      },
    };
    await assert.rejects(
      checkReleaseTags(fromDevelop, fakeGitHub(prerelease).get),
      /live-mobile@4\.27\.1 \(5555555555\) is neither on main nor a signed hotfix release commit/,
    );
  });

  it("builds a tag on the release bot's signed hotfix release, without asking where it is", async () => {
    const github = fakeGitHub(BOT);
    await checkReleaseTags(fromDevelop, github.get);
    assert.deepEqual(github.paths, [`commits/${SHA(5)}?per_page=1`]);
  });

  for (const [name, commit] of [
    ["someone else's", HUMAN],
    ["the bot's renovate-sync", RENOVATE_SYNC],
  ] as const) {
    for (const status of ["ahead", "identical"]) {
      it(`builds a tag on ${name} commit on main's history (compare: ${status})`, async () => {
        const github = fakeGitHub(commit, status);
        await checkReleaseTags(fromDevelop, github.get);
        assert.deepEqual(github.paths, [
          `commits/${SHA(5)}?per_page=1`,
          `compare/${SHA(5)}...main?per_page=1`,
        ]);
      });
    }
  }

  for (const [name, commit] of [
    ["someone else's", HUMAN],
    ["the bot's renovate-sync", RENOVATE_SYNC],
    [
      "the bot's unsigned",
      { ...BOT, commit: { ...BOT.commit, verification: { verified: false } } },
    ],
    ["the bot's, not committed by GitHub,", { ...BOT, committer: { login: "someone" } }],
    ["a commit with no GitHub user", { author: null, committer: null, commit: {} }],
  ] as const) {
    it(`refuses a tag on ${name} commit off main`, async () => {
      await assert.rejects(
        checkReleaseTags(fromDevelop, fakeGitHub(commit).get),
        /live-mobile@4\.27\.1 \(5555555555\) is neither on main nor a signed hotfix release commit of live-github-bot\[bot\]/,
      );
    });
  }
});

describe("retried", () => {
  const waits: number[] = [];
  const wait = async (ms: number) => waits.push(ms);

  it("tries a network error or a 5xx again after 1 s and 2 s", async () => {
    waits.length = 0;
    let calls = 0;
    const flaky = async () => {
      calls++;
      if (calls < 3) throw new Error("HTTP 502");
      return "ok";
    };
    assert.equal(await retried(flaky, wait), "ok");
    assert.deepEqual([calls, waits], [3, [1000, 2000]]);
  });

  it("gives up after 3 attempts, and at once on a StepFailure", async () => {
    waits.length = 0;
    let calls = 0;
    const down = async () => {
      calls++;
      throw new Error("fetch failed");
    };
    await assert.rejects(retried(down, wait), /fetch failed/);
    assert.equal(calls, 3);
    let refusals = 0;
    const refused = async () => {
      refusals++;
      throw new StepFailure("HTTP 404");
    };
    await assert.rejects(retried(refused, wait), /HTTP 404/);
    assert.equal(refusals, 1);
  });
});

describe("isRateLimited", () => {
  it("tries a 429 or a rate-limited 403 again, not a permission denied", () => {
    const headers = (entries: Record<string, string> = {}) => new Headers(entries);
    assert.equal(isRateLimited(429, headers()), true);
    assert.equal(isRateLimited(403, headers({ "x-ratelimit-remaining": "0" })), true);
    assert.equal(isRateLimited(403, headers({ "retry-after": "60" })), true);
    assert.equal(isRateLimited(403, headers({ "x-ratelimit-remaining": "42" })), false);
    assert.equal(isRateLimited(404, headers({ "retry-after": "60" })), false);
  });
});

describe("inputsOf", () => {
  const DISPATCH = {
    PRESET: "custom",
    REF_A: "live-mobile@4.27.0",
    REF_B: "develop",
    PLATFORMS: "iOS Only",
    PAIRS: "",
    THRESHOLD: "100",
    SCENARIOS: "accounts",
    READ: "both",
    BRANCH_SHA: SHA(9),
    GITHUB_REF_NAME: "ci/branch",
  };

  it("runs the nightly's settings on a scheduled run, which has no inputs", () => {
    const scheduled = {
      GITHUB_EVENT_NAME: "schedule",
      BRANCH_SHA: SHA(1),
      GITHUB_REF_NAME: "develop",
    };
    assert.deepEqual(inputsOf(scheduled), { ...NIGHTLY, branchSha: SHA(1), branchName: "develop" });
    const plan = planBuilds(inputsOf(scheduled), fakeLsRemote());
    assert.equal(plan.labelB, `develop (${SHA(1).slice(0, 10)})`);
    assert.deepEqual(plan.scenarios, ["no-accounts", "accounts"]);
  });

  it("keeps a dispatch's inputs as they are, so a blank one is still refused", () => {
    const inputs = inputsOf({ GITHUB_EVENT_NAME: "workflow_dispatch", ...DISPATCH });
    assert.equal(inputs.platforms, "iOS Only");
    assert.equal(inputs.read, "both");
    assert.equal(inputs.pairs, "");
    assert.throws(() => planBuilds(inputs, fakeLsRemote()), /even number ≥ 6/);
  });
});

describe("outputsOf and summaryOf", () => {
  for (const read of [`log\nref_a=${SHA(7)}`, "log\r"]) {
    it(`refuses an output that spans lines: ${JSON.stringify(read)}`, () => {
      const plan = planBuilds({ ...INPUTS, read }, fakeLsRemote());
      assert.throws(() => outputsOf(plan), /read must be on one line/);
    });
  }

  it("writes the job matrices as JSON, the settings and the summary as before", () => {
    const plan = planBuilds(INPUTS, fakeLsRemote());
    assert.equal(
      outputsOf(plan),
      [
        'sides=["a","b"]',
        `builds=[{"side":"a","ref":"${SHA(6)}","regression":""},{"side":"b","ref":"${SHA(1)}","regression":""}]`,
        "snapshot=true",
        "android=true",
        "ios=true",
        'scenarios=["no-accounts","accounts"]',
        `ref_a=${SHA(6)}`,
        `ref_b=${SHA(1)}`,
        `label_a=live-mobile@4.27.0 (${SHA(6).slice(0, 10)})`,
        `label_b=develop (${SHA(1).slice(0, 10)})`,
        "cache_a=true",
        "restore=true",
        "save=false",
        "preset=custom",
        "platforms=Android & iOS",
        "pairs=20",
        "threshold_ms=100",
        "read=log",
        "snapshot_release=live-mobile@4.27.1",
        `snapshot_ref=${SHA(5)}`,
        "",
      ].join("\n"),
    );
    assert.match(
      summaryOf(plan, INPUTS, "4"),
      /^### Startup performance: custom\n\n- A: `live-mobile@4\.27\.0/,
    );
    assert.match(summaryOf(plan, INPUTS, "4"), /- Accounts: the snapshot live-mobile@4\.27\.1's/);
  });

  it("names no snapshot release when the run has no accounts scenario", () => {
    const plan = planBuilds({ ...INPUTS, scenarios: "no-accounts" }, fakeLsRemote());
    assert.match(outputsOf(plan), /\nsnapshot_release=\nsnapshot_ref=\n$/);
    assert.doesNotMatch(summaryOf(plan, INPUTS, "4"), /Accounts:/);
  });

  it("says in the summary why nothing is saved to the cache", () => {
    const summary = (inputs: PlanInputs) =>
      summaryOf(planBuilds(inputs, fakeLsRemote()), inputs, "4");
    const fromDevelop = { ...INPUTS, branchName: "develop" };
    assert.doesNotMatch(summary(fromDevelop), /not saved|Nothing/);
    assert.match(
      summary({ ...fromDevelop, refB: "live-mobile@4.27.1" }),
      /- Nothing this run makes is saved to the cache: B is not develop, release, main or hotfix\n/,
    );
    assert.match(
      summary(INPUTS),
      /- Nothing this run makes is saved to the cache: only a run from develop saves it\n/,
    );
  });
});
