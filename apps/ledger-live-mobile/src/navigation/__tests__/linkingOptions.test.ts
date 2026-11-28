import { getStateFromPath } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { getOnboardingLinkingOptions, linkingOptions } from "../DeeplinksProvider";

describe("linkingOptions", () => {
  it("should open the Ledger Sync deeplink handler registered in the base navigator", () => {
    const config = linkingOptions().config as Parameters<typeof getStateFromPath>[1];

    const state = getStateFromPath("ledgersync", config);

    const baseRoute = state?.routes[0];
    expect(baseRoute?.name).toBe(NavigatorName.Base);
    expect(baseRoute?.state?.routes.at(-1)?.name).toBe(ScreenName.LedgerSyncDeepLinkHandler);
  });

  it("should route sync-onboarding to the legacy BLE pairing flow when device onboarding is off", () => {
    const config = linkingOptions({ isDeviceOnboardingEnabled: false }).config as Parameters<
      typeof getStateFromPath
    >[1];

    const state = getStateFromPath("sync-onboarding", config);

    const baseRoute = state?.routes[0];
    expect(baseRoute?.name).toBe(NavigatorName.Base);
    expect(baseRoute?.state?.routes.at(-1)?.name).toBe(ScreenName.BleDevicePairingFlow);
  });

  it("should route sync-onboarding to DeviceOnboardingConnect above Base when device onboarding is on", () => {
    const config = linkingOptions({ isDeviceOnboardingEnabled: true }).config as Parameters<
      typeof getStateFromPath
    >[1];

    const state = getStateFromPath("sync-onboarding", config);

    expect(state?.routes.map(route => route.name)).toEqual([
      NavigatorName.Base,
      NavigatorName.DeviceOnboarding,
    ]);
    expect(state?.routes[1]?.state?.routes.at(-1)?.name).toBe(ScreenName.DeviceOnboardingConnect);
  });

  it("should route sync-onboarding with query params to DeviceOnboardingConnect when device onboarding is on", () => {
    const config = linkingOptions({ isDeviceOnboardingEnabled: true }).config as Parameters<
      typeof getStateFromPath
    >[1];

    const state = getStateFromPath("sync-onboarding?ajs_prop_source=device", config);

    expect(state?.routes.map(route => route.name)).toEqual([
      NavigatorName.Base,
      NavigatorName.DeviceOnboarding,
    ]);
    expect(state?.routes[1]?.state?.routes.at(-1)?.name).toBe(ScreenName.DeviceOnboardingConnect);
  });
});

describe("getOnboardingLinkingOptions", () => {
  it("should route sync-onboarding to the legacy onboarding BLE pairing flow when device onboarding is off", () => {
    const config = getOnboardingLinkingOptions({
      acceptedTermsOfUse: true,
      isDeviceOnboardingEnabled: false,
    }).config as Parameters<typeof getStateFromPath>[1];

    const state = getStateFromPath("sync-onboarding", config);

    const baseOnboardingRoute = state?.routes[0];
    expect(baseOnboardingRoute?.name).toBe(NavigatorName.BaseOnboarding);
    const onboardingRoute = baseOnboardingRoute?.state?.routes.at(-1);
    expect(onboardingRoute?.name).toBe(NavigatorName.Onboarding);
    expect(onboardingRoute?.state?.routes.at(-1)?.name).toBe(
      ScreenName.OnboardingBleDevicePairingFlow,
    );
  });

  it("should route sync-onboarding to DeviceOnboardingConnect above BaseOnboarding when device onboarding is on", () => {
    const config = getOnboardingLinkingOptions({
      acceptedTermsOfUse: true,
      isDeviceOnboardingEnabled: true,
    }).config as Parameters<typeof getStateFromPath>[1];

    const state = getStateFromPath("sync-onboarding", config);

    expect(state?.routes.map(route => route.name)).toEqual([
      NavigatorName.BaseOnboarding,
      NavigatorName.DeviceOnboarding,
    ]);
    expect(state?.routes[1]?.state?.routes.at(-1)?.name).toBe(ScreenName.DeviceOnboardingConnect);
  });

  it("should not resolve sync-onboarding when terms of use are not accepted", () => {
    const config = getOnboardingLinkingOptions({
      acceptedTermsOfUse: false,
      isDeviceOnboardingEnabled: true,
    }).config as Parameters<typeof getStateFromPath>[1];

    const state = getStateFromPath("sync-onboarding", config);

    expect(state).toBeUndefined();
  });
});
