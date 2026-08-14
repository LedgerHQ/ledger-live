/**
 * @jest-environment jsdom
 */

import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { t } from "i18next";
import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, fireEvent, withFlagOverrides } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { track } from "~/renderer/analytics/segment";
import { BANNER_PLACEMENT_BY_LOCATION } from "LLD/features/LNSUpsell/types";
import { LNSUpsellBanner } from ".";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

const DEFAULT_DISCOUNT_PERCENT = Math.round(
  (FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params?.discount ?? 0) * 100,
);

describe("LNSUpsellBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    { location: "accounts", page: "Accounts" },
    { location: "manager", page: "Manager" },
    { location: "portfolio", page: "Portfolio" },
    { location: "notification_center", page: "NotificationPanel" },
  ] as const)("on the $page page", ({ location, page }) => {
    it("should not render if the feature flag is disabled", () => {
      renderBanner({ ffEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the location param is disabled on the feature flag", () => {
      renderBanner({ ffLocationEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the tracking CTA is disabled on the feature flag", () => {
      renderBanner({ ffCtaEnabled: false });
      expect(screen.queryByText(t(`lnsUpsell.opted_in.cta`))).toBeNull();
    });

    it("should not render if the user uses another device", () => {
      renderBanner({ devicesModelList: [DeviceModelId.nanoSP] });
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
      fireEvent.click(screen.getByText(t(`lnsUpsell.opted_in.cta`)));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith("https://example.com/optInCta");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optInCta",
        page,
      });
    });

    it("should render Lumen MediaBanner and track click when lwdWallet40 brazePlacement is on", () => {
      renderBanner({ brazePlacement: true });

      expect(screen.getByText(t(`lnsUpsell.opted_in.title`))).toBeTruthy();
      expect(
        screen.getByText(
          t(`lnsUpsell.opted_in.description`, { discount: DEFAULT_DISCOUNT_PERCENT }),
        ),
      ).toBeTruthy();

      fireEvent.click(screen.getByTestId("lns-upsell-media-banner"));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith("https://example.com/optInCta");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optInCta",
        page,
      });
    });

    it("should render opted-out MediaBanner copy when lwdWallet40 brazePlacement is on", () => {
      renderBanner({ brazePlacement: true, isOptIn: false });

      expect(screen.getByText(t(`lnsUpsell.opted_out.title`))).toBeTruthy();
      expect(screen.getByText(t(`lnsUpsell.opted_out.description`))).toBeTruthy();
    });

    it("should render the banner for opted out users", () => {
      renderBanner({ isOptIn: false });
      fireEvent.click(screen.getByText(t(`lnsUpsell.opted_out.cta`)));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith("https://example.com/optOutCta");
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Level up wallet",
        link: "https://example.com/optOutCta",
        page,
      });
    });

    it("should render for opted out users regardless of content cards state", () => {
      renderBanner({ isOptIn: false, targetedByHighTierUpsell: true });
      fireEvent.click(screen.getByText(t(`lnsUpsell.opted_out.cta`)));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(openURL).toHaveBeenCalledWith("https://example.com/optOutCta");
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
      ffCtaEnabled = true,
      isOptIn = true,
      devicesModelList = [DeviceModelId.nanoS],
      targetedByHighTierUpsell = false,
      brazePlacement = false,
    }) {
      const defaultParams = FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params;

      if (!defaultParams) {
        throw new Error("Expected large-screen upsell default params");
      }

      const placement = BANNER_PLACEMENT_BY_LOCATION[location];

      render(<LNSUpsellBanner location={location} />, {
        initialState: {
          ...withFlagOverrides({
            largeScreenUpsell: {
              enabled: ffEnabled,
              params: {
                ...defaultParams,
                banners: {
                  ...defaultParams.banners,
                  [placement]: ffLocationEnabled,
                },
                opted_in: {
                  ...defaultParams.opted_in,
                  enabled: ffCtaEnabled,
                  link: "https://example.com/optInCta",
                },
                opted_out: {
                  ...defaultParams.opted_out,
                  enabled: ffCtaEnabled,
                  link: "https://example.com/optOutCta",
                },
              },
            },
            lwdWallet40: { enabled: true, params: { brazePlacement } },
          }),
          settings: {
            shareAnalytics: true,
            sharePersonalizedRecommandations: isOptIn,
            devicesModelList,
            anonymousUserNotifications: {},
          },
          dynamicContent: {
            desktopCards: [
              { extras: { campaign: targetedByHighTierUpsell && "LNS_UPSELL_HIGH_TIER" } },
            ],
          },
        },
      });
    }
  });

  it("should render portfolio banner for opted-in users when homepage placement is enabled", () => {
    const defaultParams = FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params;

    if (!defaultParams) {
      throw new Error("Expected large-screen upsell default params");
    }

    render(<LNSUpsellBanner location="portfolio" />, {
      initialState: {
        ...withFlagOverrides({
          largeScreenUpsell: {
            enabled: true,
            params: {
              ...defaultParams,
              banners: {
                ...defaultParams.banners,
                homepage: true,
              },
              opted_in: {
                ...defaultParams.opted_in,
                enabled: true,
                link: "https://example.com/optInCta",
              },
            },
          },
        }),
        settings: {
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          devicesModelList: [DeviceModelId.nanoS],
          anonymousUserNotifications: {},
        },
        dynamicContent: {
          desktopCards: [],
        },
      },
    });

    fireEvent.click(screen.getByTestId("lns-upsell-media-banner"));
    expect(openURL).toHaveBeenCalledWith("https://example.com/optInCta");
  });
});
