import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  inputsOf,
  latestProdTag,
  type LsRemote,
  NIGHTLY,
  outputsOf,
  planBuilds,
  type PlanInputs,
  resolveRef,
  summaryOf,
} from "./resolve-refs.mts";

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
  accountsUserdata: "speculos-x-other-account,swap-history",
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

  it("builds only develop, release, main and release tags in a run from one of them", () => {
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
        /a run from develop builds only develop, release, main and live-mobile@X\.Y\.Z tags, as its jobs get develop's identity: to measure '[^']+', run the workflow from it/,
      );
    }
    assert.throws(() => plan({ branchName: "release", refB: "feat/x" }), /a run from release/);
    const fromTheBranch = planBuilds({ ...INPUTS, branchName: "feat/x", refB: "feat/x" }, refs);
    assert.equal(fromTheBranch.shaB, SHA(8));
  });

  it("saves build A only when B builds reviewed code: develop, release, main or A's own", () => {
    const refs = fakeLsRemote([
      ...REFS,
      [SHA(8), "refs/heads/main"],
      [SHA(8), "refs/heads/hotfix"],
      [SHA(8), "refs/heads/feat/x"],
    ]);
    const saveA = (inputs: Partial<PlanInputs>) => planBuilds({ ...INPUTS, ...inputs }, refs).saveA;
    assert.equal(saveA({ preset: "prod-vs-develop", refA: "", refB: "" }), true);
    assert.equal(saveA({ preset: "prod-vs-release", refA: "", refB: "" }), true);
    assert.equal(saveA({ refB: "main" }), true);
    assert.equal(saveA({ preset: "aa-noise" }), true);
    assert.equal(saveA({ preset: "known-regression" }), true);
    assert.equal(saveA({ preset: "prod-vs-develop", refA: "", refB: "feat/x" }), false);
    assert.equal(saveA({ preset: "prod-vs-release", refA: "", refB: "hotfix" }), false);
    assert.equal(saveA({ refB: "live-mobile@4.27.1" }), false);
    assert.equal(saveA({ refA: "develop", refB: "develop" }), false);
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

describe("inputsOf", () => {
  const DISPATCH = {
    PRESET: "custom",
    REF_A: "live-mobile@4.27.0",
    REF_B: "develop",
    PLATFORMS: "iOS Only",
    PAIRS: "",
    THRESHOLD: "100",
    SCENARIOS: "accounts",
    ACCOUNTS_USERDATA: "swap-history",
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
    assert.equal(inputs.pairs, "");
    assert.throws(() => planBuilds(inputs, fakeLsRemote()), /even number ≥ 6/);
  });
});

describe("outputsOf and summaryOf", () => {
  for (const accountsUserdata of [`swap-history\nref_a=${SHA(7)}`, "swap-history\r"]) {
    it(`refuses an output that spans lines: ${JSON.stringify(accountsUserdata)}`, () => {
      const plan = planBuilds({ ...INPUTS, accountsUserdata }, fakeLsRemote());
      assert.throws(() => outputsOf(plan), /accounts_userdata must be on one line/);
    });
  }

  it("writes the job matrices as JSON, the settings and the summary as before", () => {
    const plan = planBuilds(INPUTS, fakeLsRemote());
    assert.equal(
      outputsOf(plan),
      [
        'sides=["a","b"]',
        'scenarios=["no-accounts","accounts"]',
        `ref_a=${SHA(6)}`,
        `ref_b=${SHA(1)}`,
        `label_a=live-mobile@4.27.0 (${SHA(6).slice(0, 10)})`,
        `label_b=develop (${SHA(1).slice(0, 10)})`,
        "cache_a=true",
        "save_a=true",
        "preset=custom",
        "platforms=Android & iOS",
        "pairs=20",
        "threshold_ms=100",
        "accounts_userdata=speculos-x-other-account,swap-history",
        "",
      ].join("\n"),
    );
    assert.match(
      summaryOf(plan, INPUTS, "4"),
      /^### Startup performance: custom\n\n- A: `live-mobile@4\.27\.0/,
    );
    assert.doesNotMatch(summaryOf(plan, INPUTS, "4"), /not saved/);
  });

  it("says in the summary when build A is not saved to the cache", () => {
    const inputs = { ...INPUTS, refB: "live-mobile@4.27.1" };
    assert.match(
      summaryOf(planBuilds(inputs, fakeLsRemote()), inputs, "4"),
      /- Build A is not saved to the cache: B is not develop, release or main\n/,
    );
  });
});
