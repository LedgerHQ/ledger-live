/**
 * @jest-environment jsdom
 */

import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { LARGE_SCREEN_UPSELL_UTM } from "@features/flow-large-screen-upsell";
import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { render, screen, fireEvent, withFlagOverrides } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { track, trackPage } from "~/renderer/analytics/segment";
import { BANNER_PLACEMENT_BY_LOCATION } from "LLD/features/LNSUpsell/types";
import { LNSUpsellBanner } from ".";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

const DEFAULT_DISCOUNT_PERCENT = Math.round(
  (FEATURE_FLAGS_DEFAULTS.largeScreenUpsell.params?.discount ?? 0) * 100,
);

const OPTED_IN_ANALYTICS_PROPS = {
  deviceModel: "lns",
  personalRecoOptIn: true,
  offerType: "discount",
  platform: "lwd",
} as const;

const OPTED_OUT_ANALYTICS_PROPS = {
  deviceModel: "lns",
  personalRecoOptIn: false,
  offerType: "none",
  platform: "lwd",
} as const;

type SharedAnalyticsProps = {
  deviceModel: "lns" | "lnsp" | "lnx";
  personalRecoOptIn: boolean;
  offerType: "discount" | "none";
  platform: "lwd";
};

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function expectUpgradeClickTracking(pageName: string, sharedProps: SharedAnalyticsProps) {
  expect(track).toHaveBeenCalledWith("button_clicked", {
    button: "upgrade",
    page: pageName,
    ...sharedProps,
  });
  expect(track).toHaveBeenCalledWith("deeplink_clicked", {
    page: pageName,
    deeplinkSource: LARGE_SCREEN_UPSELL_UTM.sourceByPlatform.desktop,
    deeplinkMedium: LARGE_SCREEN_UPSELL_UTM.medium,
    deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM.campaign,
    ...sharedProps,
  });
}

describe("LNSUpsellBanner", () => {
  beforeEach(() => {
    jest.mocked(openURL).mockClear();
    jest.mocked(track).mockClear();
    jest.mocked(trackPage).mockClear();
  });

  describe.each([
    {
      location: "accounts",
      page: "Accounts",
      bannerPageName: "banner upsell portfolio",
      utmContent: LARGE_SCREEN_UPSELL_UTM.content.portfolio_banner,
    },
    {
      location: "manager",
      page: "Manager",
      bannerPageName: "banner upsell my ledger",
      utmContent: LARGE_SCREEN_UPSELL_UTM.content.my_ledger_banner,
    },
    {
      location: "portfolio",
      page: "Portfolio",
      bannerPageName: "banner upsell portfolio",
      utmContent: LARGE_SCREEN_UPSELL_UTM.content.portfolio_banner,
    },
    {
      location: "notification_center",
      page: "NotificationPanel",
      bannerPageName: "banner upsell notification center",
      utmContent: LARGE_SCREEN_UPSELL_UTM.content.notif_banner,
    },
  ] as const)("on the $page page", ({ location, bannerPageName, utmContent }) => {
    it("should not render if the feature flag is disabled", () => {
      renderBanner({ ffEnabled: false });
      expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
    });

    it("should not render if the location param is disabled on the feature flag", () => {
      renderBanner({ ffLocationEnabled: false });
      expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
    });

    it("should not render if the tracking CTA is disabled on the feature flag", () => {
      renderBanner({ ffCtaEnabled: false });
      expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
    });

    it.each([DeviceModelId.nanoSP, DeviceModelId.nanoX])(
      "should not render for %s before the cooldown elapses",
      deviceModelId => {
        renderBanner({
          devicesModelList: [deviceModelId],
          onboardingDate: daysAgoIso(1),
        });
        expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
      },
    );

    it.each([
      { deviceModelId: DeviceModelId.nanoSP, analyticsValue: "lnsp" as const },
      { deviceModelId: DeviceModelId.nanoX, analyticsValue: "lnx" as const },
    ])(
      "should render for $deviceModelId once its cooldown has elapsed",
      ({ deviceModelId, analyticsValue }) => {
        renderBanner({
          devicesModelList: [deviceModelId],
          onboardingDate: daysAgoIso(30),
        });
        fireEvent.click(screen.getByText("Upgrade my Ledger"));

        expectUpgradeClickTracking(bannerPageName, {
          ...OPTED_IN_ANALYTICS_PROPS,
          deviceModel: analyticsValue,
        });
      },
    );

    it("should not render if the user's Nano model is outside the audience", () => {
      renderBanner({ audienceModels: { nanoS: false, nanoSP: true, nanoX: true } });
      expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
    });

    it("should not render if the user also owns a large-screen device", () => {
      renderBanner({ devicesModelList: [DeviceModelId.nanoS, DeviceModelId.stax] });
      expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
    });

    it("should not render when a longer-cooldown nano is still in cooldown", () => {
      renderBanner({
        devicesModelList: [DeviceModelId.nanoS, DeviceModelId.nanoX],
      });
      expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
    });

    it("should render the longest-cooldown nano once that cooldown has elapsed", () => {
      renderBanner({
        devicesModelList: [DeviceModelId.nanoS, DeviceModelId.nanoX],
        onboardingDate: daysAgoIso(30),
      });
      fireEvent.click(screen.getByText("Upgrade my Ledger"));

      expectUpgradeClickTracking(bannerPageName, {
        ...OPTED_IN_ANALYTICS_PROPS,
        deviceModel: "lnx",
      });
    });

    it("should not render if the user has no devices", () => {
      renderBanner({ devicesModelList: [] });
      expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
    });

    it("should not render if the user (opted in) is targeted by a higher tier upsell campaign", () => {
      renderBanner({ targetedByHighTierUpsell: true });
      expect(screen.queryByText("Upgrade my Ledger")).toBeNull();
    });

    it("should fire a banner page event when the banner is shown", () => {
      renderBanner({});

      expect(trackPage).toHaveBeenCalledWith(
        bannerPageName,
        undefined,
        {
          name: bannerPageName,
          ...OPTED_IN_ANALYTICS_PROPS,
        },
        true,
        false,
      );
    });

    it("should track click on the cta", () => {
      renderBanner({});
      fireEvent.click(screen.getByText("Upgrade my Ledger"));

      expect(openURL).toHaveBeenCalledTimes(1);
      const openedUrl = new URL(String(jest.mocked(openURL).mock.calls[0][0]));
      expect(openedUrl.origin + openedUrl.pathname).toBe("https://example.com/optInCta");
      expect(openedUrl.searchParams.get("utm_content")).toBe(utmContent);
      expect(track).toHaveBeenCalledTimes(2);
      expectUpgradeClickTracking(bannerPageName, OPTED_IN_ANALYTICS_PROPS);
    });

    it("should render Lumen MediaBanner and track click when lwdWallet40 brazePlacement is on", () => {
      renderBanner({ brazePlacement: true });

      expect(screen.getByText("See more. Sign safer")).toBeVisible();
      expect(screen.getByText(`Upgrade and get ${DEFAULT_DISCOUNT_PERCENT}% off.`)).toBeVisible();

      fireEvent.click(screen.getByTestId("lns-upsell-media-banner"));

      expect(openURL).toHaveBeenCalledTimes(1);
      expectUpgradeClickTracking(bannerPageName, OPTED_IN_ANALYTICS_PROPS);
    });

    it("should render opted-out MediaBanner copy when lwdWallet40 brazePlacement is on", () => {
      renderBanner({ brazePlacement: true, isOptIn: false });

      expect(screen.getByText("More security. More control")).toBeVisible();
      expect(screen.getByText("Learn more about security features.")).toBeVisible();
    });

    it("should render the banner for opted out users", () => {
      renderBanner({ isOptIn: false });
      fireEvent.click(screen.getByText("Learn more"));

      expect(openURL).toHaveBeenCalledTimes(1);
      const openedUrl = new URL(String(jest.mocked(openURL).mock.calls[0][0]));
      expect(openedUrl.origin + openedUrl.pathname).toBe("https://example.com/optOutCta");
      expect(track).toHaveBeenCalledTimes(2);
      expectUpgradeClickTracking(bannerPageName, OPTED_OUT_ANALYTICS_PROPS);
    });

    it("should render for opted out users regardless of content cards state", () => {
      renderBanner({ isOptIn: false, targetedByHighTierUpsell: true });
      fireEvent.click(screen.getByText("Learn more"));

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledTimes(2);
      expectUpgradeClickTracking(bannerPageName, OPTED_OUT_ANALYTICS_PROPS);
    });

    function renderBanner({
      ffEnabled = true,
      ffLocationEnabled = true,
      ffCtaEnabled = true,
      isOptIn = true,
      devicesModelList = [DeviceModelId.nanoS],
      onboardingDate = daysAgoIso(0),
      audienceModels = {},
      targetedByHighTierUpsell = false,
      brazePlacement = false,
    }: {
      ffEnabled?: boolean;
      ffLocationEnabled?: boolean;
      ffCtaEnabled?: boolean;
      isOptIn?: boolean;
      devicesModelList?: DeviceModelId[];
      onboardingDate?: string;
      audienceModels?: Partial<{ nanoS: boolean; nanoSP: boolean; nanoX: boolean }>;
      targetedByHighTierUpsell?: boolean;
      brazePlacement?: boolean;
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
                audience: {
                  models: {
                    ...defaultParams.audience.models,
                    ...audienceModels,
                  },
                },
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
          postOnboarding: {
            onboardingDate,
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
        postOnboarding: {
          onboardingDate: daysAgoIso(0),
        },
        dynamicContent: {
          desktopCards: [],
        },
      },
    });

    fireEvent.click(screen.getByTestId("lns-upsell-media-banner"));
    const openedUrl = new URL(String(jest.mocked(openURL).mock.calls[0][0]));
    expect(openedUrl.origin + openedUrl.pathname).toBe("https://example.com/optInCta");
    expect(openedUrl.searchParams.get("utm_content")).toBe(
      LARGE_SCREEN_UPSELL_UTM.content.portfolio_banner,
    );
  });
});
