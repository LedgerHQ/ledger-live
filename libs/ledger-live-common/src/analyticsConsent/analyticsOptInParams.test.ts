import { resolveAnalyticsOptInParams } from "./analyticsOptInParams";

describe("resolveAnalyticsOptInParams", () => {
  it("returns defaults when feature or params is missing", () => {
    expect(resolveAnalyticsOptInParams(undefined)).toEqual({
      policyVersion: 1,
      consentValidityDays: 365,
    });
    expect(resolveAnalyticsOptInParams({})).toEqual({
      policyVersion: 1,
      consentValidityDays: 365,
    });
  });

  it("coerces string numbers from remote params", () => {
    expect(
      resolveAnalyticsOptInParams({
        params: { policyVersion: "2", consentValidityDays: "180" },
      }),
    ).toEqual({ policyVersion: 2, consentValidityDays: 180 });
  });

  it("merges partial params with defaults", () => {
    expect(resolveAnalyticsOptInParams({ params: { policyVersion: 3 } })).toEqual({
      policyVersion: 3,
      consentValidityDays: 365,
    });
  });
});
