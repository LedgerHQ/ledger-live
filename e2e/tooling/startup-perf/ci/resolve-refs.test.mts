import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  latestProdTag,
  type LsRemote,
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
  pairs: "20",
  thresholdMs: "100",
  scenarios: "no-accounts,accounts",
  branchSha: SHA(9),
  branchName: "ci/branch",
};

describe("resolveRef", () => {
  it("resolves a branch, and an annotated tag to its commit", () => {
    assert.equal(resolveRef("develop", fakeLsRemote()), SHA(1));
    assert.equal(resolveRef("live-mobile@4.27.1", fakeLsRemote()), SHA(5));
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

describe("outputsOf and summaryOf", () => {
  it("writes the job matrices as JSON and the summary as before", () => {
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
        "",
      ].join("\n"),
    );
    assert.match(
      summaryOf(plan, INPUTS, "4"),
      /^### Startup performance: custom\n\n- A: `live-mobile@4\.27\.0/,
    );
  });
});
