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

  it("returns enabled false and variant when llmTransferButtonCopyVariant is disabled", () => {
    const method = mockMethod({ enabled: false, params: { variantId: "control" } });
    expect(getRemoteABTestingAttributes(method)).toEqual({
      llmTransferButtonCopyVariantEnabled: false,
      llmTransferButtonCopyVariant: "control",
    });
  });

  it("returns enabled true and variantId when llmTransferButtonCopyVariant is enabled", () => {
    const method = mockMethod({ enabled: true, params: { variantId: "variant_a" } });
    expect(getRemoteABTestingAttributes(method)).toEqual({
      llmTransferButtonCopyVariantEnabled: true,
      llmTransferButtonCopyVariant: "variant_a",
    });
  });

  it("returns enabled true and undefined variantId when params are missing", () => {
    const method = mockMethod({ enabled: true });
    expect(getRemoteABTestingAttributes(method)).toEqual({
      llmTransferButtonCopyVariantEnabled: true,
      llmTransferButtonCopyVariant: undefined,
    });
  });

  it("returns enabled false and undefined variant when flag is missing", () => {
    const method = mockMethod(null);
    expect(getRemoteABTestingAttributes(method)).toEqual({
      llmTransferButtonCopyVariantEnabled: false,
      llmTransferButtonCopyVariant: undefined,
    });
  });
});
