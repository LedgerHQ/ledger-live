import React from "react";
import { Linking } from "react-native";
import { resetLazyOnboardingBannerSession } from "@features/flow-lazy-onboarding-banner/testing";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { LazyOnboardingBanner } from "../components/LazyOnboardingBanner";

type RenderOptions = Readonly<{
  enabled?: boolean;
  mode?: "shop_direct" | "feature_intro";
  stateTransform?: (state: State) => State;
}>;

const SHOP_LINK = "https://shop.ledger.com/?product=flex";

function withEligibleLazyOnboardingState(state: State): State {
  return {
    ...state,
    settings: {
      ...state.settings,
      hasCompletedOnboarding: true,
      readOnlyModeEnabled: true,
      onboardingHasDevice: false,
      isReborn: true,
      seenDevices: [],
      lastConnectedDevice: null,
    },
  };
}

function renderBanner({
  enabled = true,
  mode = "shop_direct",
  stateTransform,
}: RenderOptions = {}) {
  return render(<LazyOnboardingBanner />, {
    overrideInitialState: withFlagOverrides(
      {
        lazyOnboardingBanner: {
          enabled,
          params: { mode, link: SHOP_LINK },
        },
      },
      state =>
        stateTransform?.(withEligibleLazyOnboardingState(state)) ??
        withEligibleLazyOnboardingState(state),
    ),
  });
}

describe("LazyOnboardingBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetLazyOnboardingBannerSession();
  });

  it.each(["shop_direct", "feature_intro"] as const)(
    "should open the shop with attribution in %s mode",
    async mode => {
      const { user } = renderBanner({ mode });

      expect(screen.getByText("Discover Ledger devices")).toBeVisible();
      expect(screen.getByText("Explore our latest products and accessories")).toBeVisible();

      await user.press(screen.getByTestId("lazy-onboarding-banner"));

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
      const openedUrl = new URL(jest.mocked(Linking.openURL).mock.calls[0][0]);
      expect(openedUrl.searchParams.get("product")).toBe("flex");
      expect(openedUrl.searchParams.get("utm_source")).toBe("ledger_wallet_mobile");
      expect(openedUrl.searchParams.get("utm_medium")).toBe("ledger_live");
      expect(openedUrl.searchParams.get("utm_campaign")).toBe("upsell_large_screen");
      expect(openedUrl.searchParams.get("utm_content")).toBe("lazy_onboarding_banner");
    },
  );

  it("should remain hidden for the rest of the session after it is closed", async () => {
    const firstRender = renderBanner();

    await firstRender.user.press(screen.getByTestId("media-banner-close-button"));
    expect(screen.queryByText("Discover Ledger devices")).toBeNull();

    firstRender.unmount();
    renderBanner();

    expect(screen.queryByText("Discover Ledger devices")).toBeNull();
    expect(Linking.openURL).not.toHaveBeenCalled();
  });

  it("should not render when the feature is disabled", () => {
    renderBanner({ enabled: false });

    expect(screen.queryByText("Discover Ledger devices")).toBeNull();
  });

  it("should stop rendering after a device has been connected", () => {
    renderBanner({
      stateTransform: state => ({
        ...state,
        settings: {
          ...state.settings,
          lastConnectedDevice: {
            deviceId: "device-id",
            deviceName: "Ledger Flex",
            modelId: DeviceModelId.europa,
            wired: false,
          },
        },
      }),
    });

    expect(screen.queryByText("Discover Ledger devices")).toBeNull();
  });

  it("should stay hidden when a previously connected model is no longer recognized", () => {
    renderBanner({
      stateTransform: state => ({
        ...state,
        settings: {
          ...state.settings,
          lastConnectedDevice: {
            deviceId: "device-id",
            deviceName: "Legacy Ledger",
            modelId: "legacy-model" as DeviceModelId,
            wired: false,
          },
        },
      }),
    });

    expect(screen.queryByText("Discover Ledger devices")).toBeNull();
  });
});
