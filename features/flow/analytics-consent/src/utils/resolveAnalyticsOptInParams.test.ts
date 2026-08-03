import { resolveAnalyticsOptInParams } from "./resolveAnalyticsOptInParams";

describe("resolveAnalyticsOptInParams", () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("parses a major/minor string version", () => {
    expect(resolveAnalyticsOptInParams({ params: { policyVersion: "2.1" } })).toEqual({
      currentPolicyVersion: { major: 2, minor: 1, normalized: "2.1" },
    });
  });

  it("reads a legacy number version as major only", () => {
    expect(resolveAnalyticsOptInParams({ params: { policyVersion: 2 } })).toEqual({
      currentPolicyVersion: { major: 2, minor: 0, normalized: "2.0" },
    });
  });

  it("ignores params the mobile decision no longer reads", () => {
    expect(
      resolveAnalyticsOptInParams({ params: { policyVersion: 2, consentValidityDays: 730 } }),
    ).toEqual({ currentPolicyVersion: { major: 2, minor: 0, normalized: "2.0" } });
  });

  it.each([
    { feature: null },
    { feature: undefined },
    { feature: {} },
    { feature: { params: "nope" } },
    { feature: { params: { policyVersion: 1.2 } } },
    { feature: { params: { policyVersion: "01.2" } } },
  ])("resolves no current version for $feature instead of defaulting", ({ feature }) => {
    expect(resolveAnalyticsOptInParams(feature).currentPolicyVersion).toBeNull();
  });

  it("warns once per invalid value so a remote-config mistake is visible", () => {
    resolveAnalyticsOptInParams({ params: { policyVersion: "v2" } });
    resolveAnalyticsOptInParams({ params: { policyVersion: "v2" } });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("policyVersion");
  });
});
