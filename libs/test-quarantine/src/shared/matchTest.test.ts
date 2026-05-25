import { createMatcher } from "../match.js";
import type { QuarantineEntry } from "../schema.js";
import { matchCircusTest, matchJestAssertion } from "./matchTest.js";

const entry: QuarantineEntry = {
  id: "unit-flaky",
  team: "@ledgerhq/qa",
  expiry: "2099-01-01",
  reason: "flaky",
  failureMode: "optional",
  filter: {
    files: "apps/ledger-live-desktop/src/**/Foo.test.ts",
    title: "renders",
  },
};

const state = {
  repoRoot: "/repo",
  match: createMatcher([entry]),
};

describe("matchTest", () => {
  it("matchCircusTest matches file and title", () => {
    const test = { name: "renders label", parent: { name: "Foo" } };
    const result = matchCircusTest(state, "/repo/apps/ledger-live-desktop/src/Foo.test.ts", test);
    expect(result?.id).toBe("unit-flaky");
  });

  it("matchJestAssertion matches assertion result shape", () => {
    const result = matchJestAssertion(
      state,
      "/repo/apps/ledger-live-desktop/src/Foo.test.ts",
      ["Foo"],
      "renders label",
    );
    expect(result?.id).toBe("unit-flaky");
  });

  it("returns undefined when file is outside repo root", () => {
    const result = matchJestAssertion(state, "/other/Foo.test.ts", ["Foo"], "renders label");
    expect(result).toBeUndefined();
  });
});
