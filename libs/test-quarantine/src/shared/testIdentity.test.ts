import {
  buildTitleFromAncestorTitles,
  buildTitleFromCircusTest,
  formatQuarantineSkipMessage,
  toRepoRelativeFile,
} from "./testIdentity.js";

describe("testIdentity", () => {
  it("buildTitleFromCircusTest joins describe chain with >", () => {
    const test = {
      name: "should work",
      parent: {
        name: "MyComponent",
        parent: {
          name: "features",
        },
      },
    };
    expect(buildTitleFromCircusTest(test)).toBe("features > MyComponent > should work");
  });

  it("buildTitleFromAncestorTitles matches circus title format", () => {
    expect(buildTitleFromAncestorTitles(["features", "MyComponent"], "should work")).toBe(
      "features > MyComponent > should work",
    );
  });

  it("toRepoRelativeFile returns posix path under repo root", () => {
    const repoRoot = "/repo";
    const file = toRepoRelativeFile(repoRoot, "/repo/apps/ledger-live-desktop/src/foo.test.ts");
    expect(file).toBe("apps/ledger-live-desktop/src/foo.test.ts");
  });

  it("toRepoRelativeFile returns undefined outside repo root", () => {
    expect(toRepoRelativeFile("/repo", "/other/foo.test.ts")).toBeUndefined();
  });

  it("formatQuarantineSkipMessage matches Playwright skip text", () => {
    expect(
      formatQuarantineSkipMessage({
        id: "flaky-send",
        team: "@ledgerhq/wallet-xp",
        expiry: "2026-12-31",
        reason: "Waiting on mock",
      }),
    ).toBe("Quarantine [flaky-send] (@ledgerhq/wallet-xp, expires 2026-12-31): Waiting on mock");
  });
});
