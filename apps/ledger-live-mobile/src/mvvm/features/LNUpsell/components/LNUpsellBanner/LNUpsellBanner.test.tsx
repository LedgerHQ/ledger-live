import merge from "lodash/merge";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { Linking } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, fireEvent, renderHook } from "@tests/test-renderer";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { track } from "~/analytics";
import { LNUpsellBanner } from ".";

describe("LNUpsellBanner", () => {
  const now = new Date("2026-07-06T12:00:00.000Z");
  let t: ReturnType<typeof useTranslation>["t"];

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    jest.clearAllMocks();
    t = renderHook(useTranslation).result.current.t;
  });

  afterEach(() => {
    jest.useRealTimers();
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
      renderBanner({ largeScreenUpsellEnabled: false });
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

    it("should not render when the tracking params are missing", () => {
      renderBanner({ hasTrackingParams: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it.each(["", "   "])("should not render when the CTA link is %j", ctaLink => {
      renderBanner({ ctaLink });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should trim the CTA link before tracking and opening it", () => {
      renderBanner({ ctaLink: "  https://example.com/trimmedCta  " });
      fireEvent.press(screen.getByText(t(`lnsUpsell.opted_in.cta`)));

      expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/trimmedCta");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        deviceModel: "lns",
        link: "https://example.com/trimmedCta",
        page,
      });
    });

    it.each([DeviceModelId.nanoSP, DeviceModelId.nanoX])(
      "should respect the cooldown for %s",
      deviceModelId => {
        renderBanner({
          devicesModelList: [deviceModelId],
          onboardingDate: "2026-06-07T12:00:00.000Z",
        });
        expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
      },
    );

    it.each([
      { deviceModelId: DeviceModelId.nanoSP, analyticsValue: "lnsp" },
      { deviceModelId: DeviceModelId.nanoX, analyticsValue: "lnx" },
    ])(
      "should render for $deviceModelId once its cooldown has elapsed",
      ({ deviceModelId, analyticsValue }) => {
        renderBanner({
          devicesModelList: [deviceModelId],
          onboardingDate: "2026-06-06T12:00:00.000Z",
        });
        fireEvent.press(screen.getByText(t(`lnsUpsell.opted_in.cta`)));

        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "Level up wallet",
          deviceModel: analyticsValue,
          link: "https://example.com/optInCta",
          page,
        });
      },
    );

    it("should not render if the user's Nano model is outside the audience", () => {
      renderBanner({ audienceModels: { [DeviceModelId.nanoS]: false } });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the user also owns a large-screen device", () => {
      renderBanner({
        devicesModelList: [DeviceModelId.nanoS, DeviceModelId.stax],
      });
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
        deviceModel: "lns",
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
        deviceModel: "lns",
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
        deviceModel: "lns",
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
        deviceModel: "lns",
        link: "https://example.com/optOutCta",
        page,
      });
    });

    function renderBanner({
      largeScreenUpsellEnabled = true,
      isOptIn = true,
      devicesModelList = [DeviceModelId.nanoS],
      onboardingDate = now.toISOString(),
      audienceModels = {},
      targetedByHighTierUpsell = false,
      brazePlacement = false,
      largeScreenPlacementEnabled = true,
      hasLargeScreenBannersParam = true,
      hasTrackingParams = true,
      ctaLink = undefined as string | undefined,
    }) {
      const largeScreenUpsellParams = FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params;

      if (!largeScreenUpsellParams) {
        throw new Error("Expected large-screen upsell default params");
      }

      const resolvedCtaLink =
        ctaLink ?? (isOptIn ? "https://example.com/optInCta" : "https://example.com/optOutCta");
      const configuredParams = {
        ...largeScreenUpsellParams,
        audience: {
          models: {
            ...largeScreenUpsellParams.audience.models,
            ...audienceModels,
          },
        },
        banners: {
          ...largeScreenUpsellParams.banners,
          [placement]: largeScreenPlacementEnabled,
        },
        opted_in: {
          ...largeScreenUpsellParams.opted_in,
          enabled: true,
          link: isOptIn ? resolvedCtaLink : "https://example.com/optInCta",
        },
        opted_out: {
          ...largeScreenUpsellParams.opted_out,
          enabled: true,
          link: isOptIn ? "https://example.com/optOutCta" : resolvedCtaLink,
        },
      };
      const { banners: _banners, ...legacyLargeScreenUpsellParams } = configuredParams;
      const tracking = isOptIn ? "opted_in" : "opted_out";
      const paramsWithTracking = hasTrackingParams
        ? configuredParams
        : { ...configuredParams, [tracking]: null };
      const largeScreenUpsell = {
        ...FEATURE_FLAGS_DEFAULTS.largeScreenUpsell,
        enabled: largeScreenUpsellEnabled,
        params: hasLargeScreenBannersParam ? paramsWithTracking : legacyLargeScreenUpsellParams,
      };

      render(<LNUpsellBanner location={location} />, {
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
                {
                  extras: {
                    campaign: targetedByHighTierUpsell && "LNS_UPSELL_HIGH_TIER",
                  },
                },
              ],
            },
            postOnboarding: {
              onboardingDate,
            },
          }),
      });
    }
  });
});
