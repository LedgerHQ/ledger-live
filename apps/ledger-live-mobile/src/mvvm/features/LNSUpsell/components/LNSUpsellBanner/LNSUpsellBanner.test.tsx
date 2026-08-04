import merge from "lodash/merge";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, fireEvent, renderHook } from "@tests/test-renderer";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { track } from "~/analytics";
import { LNSUpsellBanner } from ".";

describe("LNSUpsellBanner", () => {
  let t: ReturnType<typeof useTranslation>["t"];

  beforeEach(() => {
    jest.clearAllMocks();
    t = renderHook(useTranslation).result.current.t;
  });

  describe.each([
    { location: "accounts", placement: "accounts", page: "Accounts" },
    { location: "manager", placement: "my-ledger", page: "Manager" },
    { location: "wallet", placement: "homepage", page: "Wallet" },
    {
      location: "notification_center",
      placement: "notification-center",
      page: "NotificationPanel",
    },
  ] as const)("on the $page page", ({ location, placement, page }) => {
    it("should not render if the feature flag is disabled", () => {
      renderBanner({ ffEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the location param is disabled on the feature flag", () => {
      renderBanner({ ffLocationEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if its large-screen upsell placement is disabled", () => {
      renderBanner({ largeScreenPlacementEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should render with legacy large-screen upsell params missing banners", () => {
      renderBanner({ hasLargeScreenBannersParam: false });
      expect(screen.getByText(t(`lnsUpsell.opted_in.cta`))).toBeVisible();
    });

    it("should not render if the user uses another device", () => {
      renderBanner({ devicesModelList: [DeviceModelId.nanoSP] });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the user also owns a large-screen device", () => {
      renderBanner({ devicesModelList: [DeviceModelId.nanoS, DeviceModelId.stax] });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the user has no devices", () => {
      renderBanner({ devicesModelList: [] });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the user (opted in) is targeted by a higher tier upsell campaign", () => {
      renderBanner({ targetedByHighTierUpsell: true });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should track click on the cta", () => {
      renderBanner({});
      fireEvent.press(screen.getByText(t(`lnsUpsell.opted_in.cta`)));

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/optInCta");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optInCta",
        page,
      });
    });

    it("should render Lumen MediaBanner and track press when lwmWallet40 brazePlacement is on", () => {
      renderBanner({ brazePlacement: true });
      fireEvent.press(screen.getByTestId("lns-upsell-media-banner"));

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/optInCta");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optInCta",
        page,
      });
    });

    it("should render the banner for opted out users", () => {
      renderBanner({ isOptIn: false });
      fireEvent.press(screen.getByText(t(`lnsUpsell.opted_out.cta`)));

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/optOutCta");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optOutCta",
        page,
      });
    });

    it("should render for opted out users regardless of content cards state", () => {
      renderBanner({ isOptIn: false, targetedByHighTierUpsell: true });
      fireEvent.press(screen.getByText(t(`lnsUpsell.opted_out.cta`)));

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/optOutCta");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optOutCta",
        page,
      });
    });

    function renderBanner({
      ffEnabled = true,
      ffLocationEnabled = true,
      isOptIn = true,
      devicesModelList = [DeviceModelId.nanoS],
      targetedByHighTierUpsell = false,
      brazePlacement = false,
      largeScreenPlacementEnabled = true,
      hasLargeScreenBannersParam = true,
    }) {
      const defaultParams = { [location]: ffLocationEnabled, "%": 10, img: "" };
      const ffParams = {
        opted_in: { ...defaultParams, link: "https://example.com/optInCta" },
        opted_out: { ...defaultParams, link: "https://example.com/optOutCta" },
      };
      const largeScreenUpsellParams = FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params;

      if (!largeScreenUpsellParams) {
        throw new Error("Expected large-screen upsell default params");
      }

      const { banners: _banners, ...legacyLargeScreenUpsellParams } = largeScreenUpsellParams;
      const largeScreenUpsell = {
        ...FEATURE_FLAGS_DEFAULTS.largeScreenUpsell,
        params: hasLargeScreenBannersParam
          ? {
              ...largeScreenUpsellParams,
              banners: {
                ...largeScreenUpsellParams.banners,
                [placement]: largeScreenPlacementEnabled,
              },
            }
          : legacyLargeScreenUpsellParams,
      };

      render(<LNSUpsellBanner location={location} />, {
        overrideInitialState: state =>
          merge({}, state, {
            settings: {
              shareAnalytics: true,
              personalizedRecommendationsEnabled: isOptIn,
              knownDeviceModelIds: Object.fromEntries(devicesModelList.map(model => [model, true])),
              anonymousUserNotifications: {},
            },
            featureFlags: {
              overrides: {
                llmNanoSUpsellBanners: { enabled: ffEnabled, params: ffParams },
                largeScreenUpsell,
                ...(brazePlacement
                  ? {
                      lwmWallet40: {
                        enabled: true,
                        params: { brazePlacement: true },
                      },
                    }
                  : {}),
              },
            },
            dynamicContent: {
              mobileCards: [
                { extras: { campaign: targetedByHighTierUpsell && "LNS_UPSELL_HIGH_TIER" } },
              ],
            },
          }),
      });
    }
  });
});
