import { useFeature } from "@features/platform-feature-flags";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useDeviceOnboardingFeatureFlag } from "./useDeviceOnboardingFeatureFlag";

describe("useDeviceOnboardingFeatureFlag", () => {
  it("overrides the app flag when the devtool switches a param", () => {
    const { result } = renderHook(
      () => ({ tool: useDeviceOnboardingFeatureFlag(), flag: useFeature("deviceOnboarding") }),
      {
        overrideInitialState: withFlagOverrides({
          deviceOnboarding: { enabled: true, params: { offerLedgerSync: false } },
        }),
      },
    );

    expect(result.current.tool.featureFlag).toEqual({
      enabled: true,
      params: { offerLedgerSync: false },
    });

    act(() =>
      result.current.tool.setFeatureFlag?.({ enabled: false, params: { offerLedgerSync: true } }),
    );

    expect(result.current.flag).toMatchObject({
      enabled: false,
      params: { offerLedgerSync: true },
    });
  });
});
