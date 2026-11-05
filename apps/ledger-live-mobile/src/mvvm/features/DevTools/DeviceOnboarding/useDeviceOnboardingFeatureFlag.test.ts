import { useFeature } from "@features/platform-feature-flags";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useDeviceOnboardingFeatureFlag } from "./useDeviceOnboardingFeatureFlag";

describe("useDeviceOnboardingFeatureFlag", () => {
  it("overrides the app flag when the devtool switches a param", () => {
    const { result } = renderHook(
      () => ({
        tool: useDeviceOnboardingFeatureFlag(),
        flag: useFeature("deviceOnboarding"),
      }),
      {
        overrideInitialState: withFlagOverrides({
          deviceOnboarding: {
            enabled: true,
            params: {
              offerLedgerSync: false,
              connectSeededDevice: false,
              connectUnseededDevice: false,
              unifiedEntryPoints: false,
            },
          },
        }),
      },
    );

    expect(result.current.tool.isFeatureFlagOverridden).toBe(true);
    expect(result.current.tool.featureFlag).toEqual({
      enabled: true,
      params: {
        offerLedgerSync: false,
        connectSeededDevice: false,
        connectUnseededDevice: false,
        unifiedEntryPoints: false,
      },
    });

    act(() =>
      result.current.tool.setFeatureFlag?.({
        enabled: false,
        params: {
          offerLedgerSync: true,
          connectSeededDevice: true,
          connectUnseededDevice: true,
          unifiedEntryPoints: true,
        },
      }),
    );

    expect(result.current.flag).toMatchObject({
      enabled: false,
      params: {
        offerLedgerSync: true,
        connectSeededDevice: true,
        connectUnseededDevice: true,
        unifiedEntryPoints: true,
      },
    });
  });

  it("drops the local mock and shows the feature flag again", () => {
    const { result } = renderHook(
      () => ({
        tool: useDeviceOnboardingFeatureFlag(),
        flag: useFeature("deviceOnboarding"),
      }),
      {
        overrideInitialState: withFlagOverrides({
          deviceOnboarding: {
            enabled: true,
            params: { connectUnseededDevice: true },
          },
        }),
      },
    );

    expect(result.current.tool.isFeatureFlagOverridden).toBe(true);

    act(() => result.current.tool.resetFeatureFlag?.());

    expect(result.current.tool.isFeatureFlagOverridden).toBe(false);
    expect(result.current.flag).toMatchObject({
      enabled: false,
      params: { connectUnseededDevice: false },
    });
  });

  it("lists a param the saved value does not have yet, from its default", () => {
    const { result } = renderHook(() => useDeviceOnboardingFeatureFlag(), {
      overrideInitialState: withFlagOverrides({
        deviceOnboarding: { enabled: true, params: { offerLedgerSync: true } },
      }),
    });

    expect(result.current.featureFlag?.params).toEqual({
      offerLedgerSync: true,
      connectSeededDevice: false,
      connectUnseededDevice: false,
      unifiedEntryPoints: false,
    });
  });
});
