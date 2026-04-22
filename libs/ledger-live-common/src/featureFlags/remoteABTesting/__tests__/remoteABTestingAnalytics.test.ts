import { getRemoteABTestingAttributes } from "../remoteABTestingAnalytics";
import type { AnalyticsFeatureFlagMethod } from "../../../analytics/types";

function mockMethod(
  returnValue: { enabled: boolean; params?: Record<string, unknown> } | null,
): AnalyticsFeatureFlagMethod {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return (() => returnValue) as AnalyticsFeatureFlagMethod;
}

describe("getRemoteABTestingAttributes", () => {
  it("returns empty object when method is null", () => {
    expect(getRemoteABTestingAttributes(null)).toEqual({});
  });

  it("returns empty object when transferButtonCopyVariant is disabled", () => {
    const method = mockMethod({ enabled: false, params: { variantId: "control" } });
    expect(getRemoteABTestingAttributes(method)).toEqual({});
  });

  it("returns variantId when transferButtonCopyVariant is enabled", () => {
    const method = mockMethod({ enabled: true, params: { variantId: "variant_a" } });
    expect(getRemoteABTestingAttributes(method)).toEqual({
      transferButtonCopyVariant: "variant_a",
    });
  });

  it("returns undefined variantId when params are missing", () => {
    const method = mockMethod({ enabled: true });
    expect(getRemoteABTestingAttributes(method)).toEqual({
      transferButtonCopyVariant: undefined,
    });
  });
});
